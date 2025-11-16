import React, { useRef, useState } from 'react';
import { useInvoiceStore } from '../store';
import { fileToBase64 } from '../utils';
import { scanInvoiceImage } from '../services/geminiService';
import { Upload, Plus, Trash2, Sparkles, Loader2, Palette, Save } from 'lucide-react';

export const InvoiceForm: React.FC = () => {
  const {
    currentInvoice,
    updateSender,
    updateReceiver,
    updateInvoiceDetails,
    updateSettings,
    addItem,
    updateItem,
    removeItem,
    setItems,
    saveInvoice
  } = useInvoiceStore();

  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      updateSender({ logo: base64 });
    }
  };

  const handleAIScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsScanning(true);
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        const items = await scanInvoiceImage(base64);
        if (items.length > 0) {
          setItems(items); // Replace items or append? Let's replace for this flow
        }
      } catch (error) {
        alert("Failed to scan image. Please check API Key or image format.");
      } finally {
        setIsScanning(false);
      }
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Palette size={18} />
          Branding & Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Logo</label>
            <div className="flex items-center gap-4">
              {currentInvoice.sender.logo && (
                <img src={currentInvoice.sender.logo} alt="Logo" className="h-12 w-12 object-contain rounded border" />
              )}
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border rounded-lg text-sm text-gray-700 transition-colors">
                <Upload size={16} />
                Upload Logo
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Brand Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentInvoice.settings.brandColor}
                onChange={(e) => updateSettings({ brandColor: e.target.value })}
                className="h-10 w-16 rounded cursor-pointer border p-1"
              />
              <span className="text-xs text-gray-500">{currentInvoice.settings.brandColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              value={currentInvoice.settings.taxRate}
              onChange={(e) => updateSettings({ taxRate: parseFloat(e.target.value) })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-600 mb-1">Currency</label>
             <select 
                value={currentInvoice.settings.currency}
                onChange={(e) => updateSettings({ currency: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
             >
                <option value="IDR">IDR (Rp)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
             </select>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-semibold text-gray-800">Invoice Details</h2>
             <button 
                onClick={saveInvoice}
                className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition"
             >
                <Save size={16} /> Save
             </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Invoice Number</label>
            <input
              type="text"
              value={currentInvoice.invoiceNumber}
              onChange={(e) => updateInvoiceDetails({ invoiceNumber: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={currentInvoice.date}
              onChange={(e) => updateInvoiceDetails({ date: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Due Date</label>
            <input
              type="date"
              value={currentInvoice.dueDate}
              onChange={(e) => updateInvoiceDetails({ dueDate: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
             <select 
                value={currentInvoice.status}
                onChange={(e) => updateInvoiceDetails({ status: e.target.value as any })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
             >
                <option value="DRAFT">Draft</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid</option>
             </select>
          </div>
        </div>
      </div>

      {/* Company & Client */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">From (Sender)</h2>
          <div className="space-y-3">
            <input
              placeholder="Company Name"
              value={currentInvoice.sender.name}
              onChange={(e) => updateSender({ name: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
            <textarea
              placeholder="Address"
              value={currentInvoice.sender.address}
              onChange={(e) => updateSender({ address: e.target.value })}
              className="w-full p-2 border rounded-lg resize-none h-20"
            />
            <input
              placeholder="Email"
              value={currentInvoice.sender.email}
              onChange={(e) => updateSender({ email: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
             <input
              placeholder="Phone"
              value={currentInvoice.sender.phone}
              onChange={(e) => updateSender({ phone: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
             <input
              placeholder="Website (e.g. www.yourcompany.com)"
              value={currentInvoice.sender.website || ''}
              onChange={(e) => updateSender({ website: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">To (Client)</h2>
          <div className="space-y-3">
            <input
              placeholder="Client Name"
              value={currentInvoice.receiver.name}
              onChange={(e) => updateReceiver({ name: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
            <textarea
              placeholder="Address"
              value={currentInvoice.receiver.address}
              onChange={(e) => updateReceiver({ address: e.target.value })}
              className="w-full p-2 border rounded-lg resize-none h-20"
            />
            <input
              placeholder="Email"
              value={currentInvoice.receiver.email}
              onChange={(e) => updateReceiver({ email: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-gray-800">Items</h2>
          <div className="flex gap-2">
             <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAIScan}
             />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {isScanning ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              AI Scan Receipt
            </button>
            <button
              onClick={() => addItem()}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {currentInvoice.items.map((item, index) => (
            <div key={item.id} className="flex gap-2 items-start p-3 border rounded-lg bg-gray-50">
              <div className="flex-1 space-y-2">
                <input
                  placeholder="Item Description"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  className="w-full p-2 border rounded bg-white"
                />
                <div className="flex gap-2">
                  <div className="w-24">
                     <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) })}
                        className="w-full p-2 border rounded bg-white text-center"
                      />
                  </div>
                   <div className="flex-1">
                     <input
                        type="number"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) })}
                        className="w-full p-2 border rounded bg-white text-right"
                      />
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="p-2 text-red-500 hover:bg-red-100 rounded transition-colors mt-1"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          
          {currentInvoice.items.length === 0 && (
            <div className="text-center py-8 text-gray-400 italic">
                No items added. Add manually or scan a receipt.
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <h2 className="text-lg font-semibold text-gray-800 mb-2">Notes & Signature</h2>
         <div className="space-y-4">
            <textarea
               value={currentInvoice.notes}
               onChange={(e) => updateInvoiceDetails({ notes: e.target.value })}
               className="w-full p-3 border rounded-lg h-24"
               placeholder="Payment details, Thank you notes, etc."
            />
            <div>
               <label className="block text-sm font-medium text-gray-600 mb-1">Signature Label</label>
               <input 
                  value={currentInvoice.settings.signatureText}
                  onChange={(e) => updateSettings({ signatureText: e.target.value })}
                  className="w-full p-2 border rounded-lg max-w-xs"
               />
            </div>
         </div>
      </div>
    </div>
  );
};
