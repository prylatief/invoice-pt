import { create } from 'zustand';
import { Invoice, InvoiceItem, UserProfile } from './types';
import { INITIAL_INVOICE } from './constants';
import { v4 as uuidv4 } from 'uuid';
import { db, auth } from './services/firebase';
import {
  ref,
  set,
  push,
  remove,
  onValue,
  off,
  query,
  orderByChild,
  equalTo
} from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface InvoiceState {
  user: UserProfile | null;
  currentInvoice: Invoice;
  history: Invoice[];
  isLoadingHistory: boolean;
  isEditingExisting: boolean; // Track if editing existing invoice

  // Internal: Listener cleanup functions
  _unsubscribeAuth: (() => void) | null;
  _unsubscribeSnapshot: (() => void) | null;

  // Actions
  initializeAuth: () => void;
  logout: () => void;

  updateSender: (data: Partial<Invoice['sender']>) => void;
  updateReceiver: (data: Partial<Invoice['receiver']>) => void;
  updateSettings: (data: Partial<Invoice['settings']>) => void;
  updateInvoiceDetails: (data: Partial<Pick<Invoice, 'invoiceNumber' | 'date' | 'dueDate' | 'status' | 'notes'>>) => void;

  addItem: (item?: Partial<InvoiceItem>) => void;
  updateItem: (id: string, data: Partial<InvoiceItem>) => void;
  removeItem: (id: string) => void;
  setItems: (items: InvoiceItem[]) => void;

  saveInvoice: (forceNew?: boolean) => Promise<void>;
  loadInvoice: (id: string) => void;
  deleteInvoice: (id: string) => Promise<void>;
  resetInvoice: () => void;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  user: null,
  currentInvoice: { ...INITIAL_INVOICE, id: uuidv4(), userId: '' },
  history: [],
  isLoadingHistory: false,
  isEditingExisting: false,
  _unsubscribeAuth: null,
  _unsubscribeSnapshot: null,

  // --- Auth & Realtime Listeners ---
  initializeAuth: () => {
    // Clean up existing listeners before creating new ones
    const { _unsubscribeAuth, _unsubscribeSnapshot } = get();
    if (_unsubscribeAuth) {
      _unsubscribeAuth();
      set({ _unsubscribeAuth: null });
    }
    if (_unsubscribeSnapshot) {
      _unsubscribeSnapshot();
      set({ _unsubscribeSnapshot: null });
    }

    // Create auth state listener and store unsubscribe function
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Simple Admin Logic: If email contains 'admin', treat as admin
        const isAdmin = firebaseUser.email?.includes('admin') || false;

        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          isAdmin
        };

        set({ user: userProfile });

        // Start Listening to Realtime Database
        set({ isLoadingHistory: true });

        let dbRef;
        if (isAdmin) {
          // Admin sees ALL invoices from all users
          dbRef = ref(db, 'invoices');
        } else {
          // Regular user sees only THEIR invoices
          // Path: /invoices/<user_uid>/
          dbRef = ref(db, `invoices/${firebaseUser.uid}`);
        }

        // Create Realtime Database listener
        const handleSnapshot = (snapshot: any) => {
          const loadedInvoices: Invoice[] = [];

          if (snapshot.exists()) {
            const data = snapshot.val();

            if (isAdmin) {
              // Admin mode: data is nested by userId
              // Structure: { userId1: { invoiceId1: {...}, invoiceId2: {...} }, userId2: {...} }
              Object.keys(data).forEach(userId => {
                const userInvoices = data[userId];
                Object.keys(userInvoices).forEach(invoiceId => {
                  const invoice = userInvoices[invoiceId] as Invoice;
                  // Backwards compatibility: Add useStatus if missing
                  if (invoice.settings.useStatus === undefined) {
                    invoice.settings.useStatus = true;
                  }
                  loadedInvoices.push(invoice);
                });
              });
            } else {
              // User mode: data is directly invoices
              // Structure: { invoiceId1: {...}, invoiceId2: {...} }
              Object.keys(data).forEach(invoiceId => {
                const invoice = data[invoiceId] as Invoice;
                // Backwards compatibility: Add useStatus if missing
                if (invoice.settings.useStatus === undefined) {
                  invoice.settings.useStatus = true;
                }
                loadedInvoices.push(invoice);
              });
            }
          }

          // Sort by createdAt descending
          loadedInvoices.sort((a, b) => b.createdAt - a.createdAt);

          set({ history: loadedInvoices, isLoadingHistory: false });
        };

        const handleError = (error: any) => {
          console.error('Error listening to invoices:', error);
          set({ isLoadingHistory: false });
        };

        // Attach listener
        onValue(dbRef, handleSnapshot, handleError);

        // Store the unsubscribe function
        const unsubSnapshot = () => {
          off(dbRef);
        };
        set({ _unsubscribeSnapshot: unsubSnapshot });

      } else {
        // Guest Mode: TIDAK menggunakan localStorage, hanya tampilkan pesan
        set({ user: null, history: [], isLoadingHistory: false });
      }
    });

    // Store the auth listener unsubscribe function
    set({ _unsubscribeAuth: unsubAuth });
  },

  logout: async () => {
    // Clean up listeners before logging out
    const { _unsubscribeSnapshot } = get();
    if (_unsubscribeSnapshot) {
      _unsubscribeSnapshot();
    }

    await signOut(auth);
    set((state) => ({
      user: null,
      history: [],
      _unsubscribeSnapshot: null,
      currentInvoice: {
        ...INITIAL_INVOICE,
        id: uuidv4(),
        userId: '',
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      },
      isEditingExisting: false
    }));
  },

  // --- Invoice Editing Actions ---

  updateSender: (data) => set((state) => ({
    currentInvoice: { ...state.currentInvoice, sender: { ...state.currentInvoice.sender, ...data } }
  })),

  updateReceiver: (data) => set((state) => ({
    currentInvoice: { ...state.currentInvoice, receiver: { ...state.currentInvoice.receiver, ...data } }
  })),

  updateSettings: (data) => set((state) => ({
    currentInvoice: { ...state.currentInvoice, settings: { ...state.currentInvoice.settings, ...data } }
  })),

  updateInvoiceDetails: (data) => set((state) => ({
    currentInvoice: { ...state.currentInvoice, ...data }
  })),

  addItem: (item) => set((state) => ({
    currentInvoice: {
      ...state.currentInvoice,
      items: [
        ...state.currentInvoice.items,
        {
          id: uuidv4(),
          description: "New Item",
          quantity: 1,
          price: 0,
          ...item
        }
      ]
    }
  })),

  updateItem: (id, data) => set((state) => ({
    currentInvoice: {
      ...state.currentInvoice,
      items: state.currentInvoice.items.map(item => 
        item.id === id ? { ...item, ...data } : item
      )
    }
  })),

  removeItem: (id) => set((state) => ({
    currentInvoice: {
      ...state.currentInvoice,
      items: state.currentInvoice.items.filter(item => item.id !== id)
    }
  })),

  setItems: (items) => set((state) => ({
    currentInvoice: {
      ...state.currentInvoice,
      items: items
    }
  })),

  // --- Realtime Database Actions ---

  saveInvoice: async (forceNew = false) => {
    const { currentInvoice, user, isEditingExisting } = get();

    if (!user) {
      alert("Please login to save invoices. Guest mode is no longer supported.");
      return;
    }

    try {
      // Determine if this should create a new invoice entry
      const shouldCreateNew = forceNew || !isEditingExisting;

      // Prepare invoice data
      let invoiceToSave = {
        ...currentInvoice,
        userId: user.uid,
        createdAt: currentInvoice.createdAt || Date.now()
      };

      if (shouldCreateNew && isEditingExisting) {
        // User wants to save as copy - generate new ID
        invoiceToSave = {
          ...invoiceToSave,
          id: uuidv4(),
          createdAt: Date.now(),
          invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
        };
      }

      // Path: /invoices/<user_uid>/<invoice_id>
      const invoicePath = `invoices/${user.uid}`;

      if (shouldCreateNew && !isEditingExisting) {
        // New invoice: use push() to generate unique ID
        const newInvoiceRef = push(ref(db, invoicePath));
        const pushId = newInvoiceRef.key;

        if (!pushId) {
          throw new Error('Failed to generate invoice ID');
        }

        invoiceToSave.id = pushId;

        // Save to database
        await set(newInvoiceRef, invoiceToSave);

        alert("Invoice Saved to Cloud! Ready to create a new invoice.");

        // Reset form for new invoice - use setTimeout to ensure clean state update after alert
        setTimeout(() => {
          set((state) => ({
            currentInvoice: {
              ...INITIAL_INVOICE,
              id: uuidv4(),
              userId: state.user?.uid || '',
              invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
            },
            isEditingExisting: false
          }));
        }, 100);
      } else {
        // Update existing invoice: use set() with specific path
        const invoiceRef = ref(db, `${invoicePath}/${invoiceToSave.id}`);
        await set(invoiceRef, invoiceToSave);

        if (forceNew) {
          // Saved as copy
          alert("Invoice Saved as Copy!");

          setTimeout(() => {
            set((state) => ({
              currentInvoice: {
                ...INITIAL_INVOICE,
                id: uuidv4(),
                userId: state.user?.uid || '',
                invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
              },
              isEditingExisting: false
            }));
          }, 100);
        } else {
          // Updated existing
          alert("Invoice Updated!");

          setTimeout(() => {
            set({ currentInvoice: invoiceToSave });
          }, 100);
        }
      }

      // Note: onValue listener will handle history update automatically
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice. Error: " + (error as Error).message);
    }
  },

  loadInvoice: (id) => set((state) => {
    const invoice = state.history.find(i => i.id === id);
    return invoice ? { currentInvoice: invoice, isEditingExisting: true } : {};
  }),

  deleteInvoice: async (id) => {
    const { user } = get();

    if (!user) {
      alert("Please login to delete invoices.");
      return;
    }

    if (confirm("Are you sure you want to delete this invoice?")) {
      try {
        // Delete from Realtime Database
        // Path: /invoices/<user_uid>/<invoice_id>
        const invoiceRef = ref(db, `invoices/${user.uid}/${id}`);
        await remove(invoiceRef);

        // Listener handles UI update automatically
        alert("Invoice deleted successfully!");
      } catch (error) {
        console.error("Error deleting:", error);
        alert("Failed to delete invoice. Error: " + (error as Error).message);
      }
    }
  },

  resetInvoice: () => set((state) => ({
    currentInvoice: {
      ...INITIAL_INVOICE,
      id: uuidv4(),
      userId: state.user?.uid || '',
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
    },
    isEditingExisting: false
  }))
}));
