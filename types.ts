export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  logo?: string; // base64
  website?: string;
}

export interface ClientInfo {
  name: string;
  address: string;
  email: string;
  phone?: string;
}

export interface InvoiceSettings {
  currency: string;
  taxRate: number; // percentage
  brandColor: string;
  locale: string;
  signatureText: string;
}

export interface Invoice {
  id: string;
  userId: string; // New field for ownership
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: 'PAID' | 'UNPAID' | 'DRAFT';
  sender: CompanyInfo;
  receiver: ClientInfo;
  items: InvoiceItem[];
  notes: string;
  settings: InvoiceSettings;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  isAdmin: boolean;
}

export enum SheetStatus {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR
}