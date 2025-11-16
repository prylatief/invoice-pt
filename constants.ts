import { Invoice } from "./types";

export const DEFAULT_BRAND_COLOR = "#2563EB";

export const INITIAL_INVOICE: Invoice = {
  id: "",
  userId: "",
  invoiceNumber: `INV-${new Date().getFullYear()}-001`,
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: 'UNPAID',
  sender: {
    name: "Your Company Name",
    address: "123 Business Rd, Tech City, 10101",
    email: "billing@company.com",
    phone: "+62 812-3456-7890",
    website: "www.yourcompany.com"
  },
  receiver: {
    name: "Client Name",
    address: "456 Client Ave, Startupsville, 20202",
    email: "client@email.com"
  },
  items: [
    {
      id: '1',
      description: "Web Development Services",
      quantity: 1,
      price: 5000000
    },
    {
      id: '2',
      description: "Server Maintenance (Yearly)",
      quantity: 1,
      price: 1200000
    }
  ],
  notes: "Thank you for your business. Please transfer payment to BCA 1234567890.",
  settings: {
    currency: "IDR",
    taxRate: 11,
    brandColor: DEFAULT_BRAND_COLOR,
    locale: "id-ID",
    signatureText: "Authorized Signature",
    useStatus: true
  },
  createdAt: Date.now()
};