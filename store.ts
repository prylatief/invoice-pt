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
  
  saveInvoice: () => Promise<void>;
  loadInvoice: (id: string) => void;
  deleteInvoice: (id: string) => Promise<void>;
  resetInvoice: () => void;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  user: null,
  currentInvoice: { ...INITIAL_INVOICE, id: uuidv4(), userId: '' },
  history: [],
  isLoadingHistory: false,

  // --- Auth & Realtime Listeners ---
  initializeAuth: () => {
    onAuthStateChanged(auth, (firebaseUser) => {
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

        onSnapshot(q, (snapshot) => {
          const loadedInvoices: Invoice[] = [];
          snapshot.forEach((doc) => {
            loadedInvoices.push(doc.data() as Invoice);
          });
          
          // Sort manually if composite index is missing for 'where' + 'orderBy'
          if (!isAdmin) {
             loadedInvoices.sort((a, b) => b.createdAt - a.createdAt);
          }

          set({ history: loadedInvoices, isLoadingHistory: false });
        });

      } else {
        set({ user: null, history: [], isLoadingHistory: false });
      }
    });
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, history: [] });
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

  saveInvoice: async () => {
    const { currentInvoice, user } = get();
    
    if (!user) {
      alert("Please login to save invoices.");
      return;
    }

    try {
      // Ensure userId is set to the creator (or current user if editing)
      // If admin edits, we keep original owner, or if new, admin becomes owner
      const invoiceToSave = {
        ...currentInvoice,
        userId: currentInvoice.userId || user.uid, 
        createdAt: currentInvoice.createdAt || Date.now()
      };

      // Save to Firestore
      await setDoc(doc(db, "invoices", invoiceToSave.id), invoiceToSave);
      
      // Update local state currentInvoice to match saved (in case of new ID/Timestamp)
      set({ currentInvoice: invoiceToSave });
      
      // Note: We don't need to manually update 'history' array here 
      // because the onSnapshot listener in initializeAuth will handle it automatically!
      
      alert("Invoice Saved to Cloud!");
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice.");
    }
  },

  loadInvoice: (id) => set((state) => {
    const invoice = state.history.find(i => i.id === id);
    return invoice ? { currentInvoice: invoice } : {};
  }),

  deleteInvoice: async (id) => {
    const { user } = get();
    if (!user) return;

    if (confirm("Are you sure you want to delete this invoice?")) {
      try {
        await deleteDoc(doc(db, "invoices", id));
        // Listener handles UI update
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
    }
  }))
}));
