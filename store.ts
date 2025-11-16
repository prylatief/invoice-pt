import { create } from 'zustand';
import { Invoice, InvoiceItem, UserProfile } from './types';
import { INITIAL_INVOICE } from './constants';
import { v4 as uuidv4 } from 'uuid';
import { db, auth } from './services/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
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

        // Start Listening to Firestore
        set({ isLoadingHistory: true });

        let q;
        if (isAdmin) {
          // Admin sees ALL invoices
          q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
        } else {
          // Regular user sees only THEIR invoices
          q = query(
            collection(db, 'invoices'),
            where('userId', '==', firebaseUser.uid)
          );
        }

        // Create Firestore listener and store unsubscribe function
        const unsubSnapshot = onSnapshot(q, (snapshot) => {
          const loadedInvoices: Invoice[] = [];
          snapshot.forEach((doc) => {
            const invoice = doc.data() as Invoice;
            // Backwards compatibility: Add useStatus if missing
            if (invoice.settings.useStatus === undefined) {
              invoice.settings.useStatus = true;
            }
            loadedInvoices.push(invoice);
          });

          // Sort manually if composite index is missing for 'where' + 'orderBy'
          if (!isAdmin) {
             loadedInvoices.sort((a, b) => b.createdAt - a.createdAt);
          }

          set({ history: loadedInvoices, isLoadingHistory: false });
        }, (error) => {
          console.error('Error listening to invoices:', error);
          set({ isLoadingHistory: false });
        });

        // Store the unsubscribe function
        set({ _unsubscribeSnapshot: unsubSnapshot });

      } else {
        // Guest Mode: Load invoices from localStorage
        const loadLocalInvoices = () => {
          try {
            const saved = localStorage.getItem('guest_invoices');
            if (saved) {
              const loadedInvoices: Invoice[] = JSON.parse(saved);
              // Backwards compatibility: Add useStatus if missing
              loadedInvoices.forEach(invoice => {
                if (invoice.settings.useStatus === undefined) {
                  invoice.settings.useStatus = true;
                }
              });
              loadedInvoices.sort((a, b) => b.createdAt - a.createdAt);
              set({ history: loadedInvoices });
            }
          } catch (error) {
            console.error('Error loading guest invoices:', error);
          }
        };

        loadLocalInvoices();
        set({ user: null, isLoadingHistory: false });
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
    set({
      user: null,
      history: [],
      _unsubscribeSnapshot: null
    });
    get().resetInvoice();
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

  // --- Firestore Actions ---

  saveInvoice: async (forceNew = false) => {
    const { currentInvoice, user, history, isEditingExisting } = get();

    try {
      // Determine if this should create a new invoice entry
      const shouldCreateNew = forceNew || !isEditingExisting;

      // If creating new, generate new ID
      let invoiceToSave = {
        ...currentInvoice,
        userId: user?.uid || currentInvoice.userId || 'guest',
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

      if (user) {
        // Authenticated Mode: Save to Firebase
        await setDoc(doc(db, "invoices", invoiceToSave.id), invoiceToSave);

        // After successful save, reset to create new invoice (if it was a new invoice)
        if (!isEditingExisting || forceNew) {
          get().resetInvoice();
          alert("Invoice Saved to Cloud! Ready to create a new invoice.");
        } else {
          // Update local state currentInvoice to match saved
          set({ currentInvoice: invoiceToSave });
          alert("Invoice Updated!");
        }

        // Note: onSnapshot listener will handle history update automatically
      } else {
        // Guest Mode: Save to localStorage
        const existingIndex = history.findIndex(inv => inv.id === invoiceToSave.id);
        let updatedHistory: Invoice[];

        if (existingIndex >= 0 && !shouldCreateNew) {
          // Update existing invoice
          updatedHistory = [...history];
          updatedHistory[existingIndex] = invoiceToSave;
        } else {
          // Add new invoice (or save as copy)
          updatedHistory = [invoiceToSave, ...history];
        }

        // Sort by creation date
        updatedHistory.sort((a, b) => b.createdAt - a.createdAt);

        // Save to localStorage
        localStorage.setItem('guest_invoices', JSON.stringify(updatedHistory));

        // After successful save, reset to create new invoice (if it was a new invoice)
        if (!isEditingExisting || forceNew) {
          get().resetInvoice();
          set({ history: updatedHistory });
          alert("Invoice Saved Locally! Ready to create a new invoice.");
        } else {
          // Update state
          set({ currentInvoice: invoiceToSave, history: updatedHistory });
          alert("Invoice Updated!");
        }
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice.");
    }
  },

  loadInvoice: (id) => set((state) => {
    const invoice = state.history.find(i => i.id === id);
    return invoice ? { currentInvoice: invoice, isEditingExisting: true } : {};
  }),

  deleteInvoice: async (id) => {
    const { user, history } = get();

    if (confirm("Are you sure you want to delete this invoice?")) {
      try {
        if (user) {
          // Authenticated Mode: Delete from Firebase
          await deleteDoc(doc(db, "invoices", id));
          // Listener handles UI update automatically
        } else {
          // Guest Mode: Delete from localStorage
          const updatedHistory = history.filter(inv => inv.id !== id);
          localStorage.setItem('guest_invoices', JSON.stringify(updatedHistory));
          set({ history: updatedHistory });
        }
      } catch (error) {
        console.error("Error deleting:", error);
        alert("Failed to delete.");
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
