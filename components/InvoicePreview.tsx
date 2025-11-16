import React from 'react';
import { useInvoiceStore } from '../store';
import { formatCurrency, terbilang, generatePDF } from '../utils';
import { Download, Printer } from 'lucide-react';

interface Props {
  id: string;
}

export const InvoicePreview: React.FC<Props> = ({ id }) => {
  const { currentInvoice } = useInvoiceStore();
  const { 
    sender, 
    receiver, 
    items, 
    settings, 
    invoiceNumber, 
    date, 
    dueDate,
    status,
    notes
  } = currentInvoice;

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxAmount = (subtotal * settings.taxRate) / 100;
  const total = subtotal + taxAmount;

  const brandStyle = {
    backgroundColor: settings.brandColor,
    color: '#ffffff'
  };

  const textBrandStyle = {
      color: settings.brandColor
  };

  const handleDownload = () => {
    generatePDF(id, `Invoice-${invoiceNumber}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center w-full">
        {/* Action Bar */}
        <div className="w-full max-w-[210mm] mb-4 flex justify-end gap-3 no-print">
            <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium text-sm"
            >
                <Printer size={16} /> Print / PDF
            </button>
            <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition shadow-lg font-medium text-sm"
            >
                <Download size={16} /> Export Image
            </button>
        </div>

        {/* A4 Container */}
        <div 
            id={id}
            className="bg-white w-[210mm] min-h-[297mm] shadow-2xl relative flex flex-col text-sm leading-relaxed mx-auto print:shadow-none print:mx-0"
            style={{ padding: '0' }}
        >
            {/* Top Colored Bar */}
            <div className="h-4 w-full" style={brandStyle}></div>

            <div className="p-12 flex flex-col h-full flex-1">
                {/* Header */}
                <div className="flex justify-between items-start mb-10">
                    <div className="flex flex-col max-w-[50%]">
                        {sender.logo ? (
                            <img 
                                src={sender.logo} 
                                alt="Logo" 
                                className="max-h-24 max-w-[200px] object-contain mb-4 self-start" 
                            />
                        ) : (
                            <div className="h-16 flex items-center text-2xl font-bold text-gray-300 uppercase tracking-widest mb-4">
                                LOGO
                            </div>
                        )}
                        <h1 className="text-xl font-bold text-gray-900">{sender.name}</h1>
                        <p className="text-gray-500 whitespace-pre-wrap mt-1 leading-snug">{sender.address}</p>
                        {sender.email && <p className="text-gray-500 mt-1">{sender.email}</p>}
                        {sender.phone && <p className="text-gray-500">{sender.phone}</p>}
                    </div>

                    <div className="text-right">
                        <h1 className="text-5xl font-light tracking-tight mb-2" style={textBrandStyle}>INVOICE</h1>
                        <p className="text-lg font-medium text-gray-700 mb-6">#{invoiceNumber}</p>
                        
                        <div className="space-y-1">
                            <div className="flex justify-end gap-6">
                                <span className="text-gray-500 w-24">Date:</span>
                                <span className="font-medium text-gray-900">{date}</span>
                            </div>
                            <div className="flex justify-end gap-6">
                                <span className="text-gray-500 w-24">Due Date:</span>
                                <span className="font-medium text-gray-900">{dueDate}</span>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="mt-6 inline-block px-6 py-1.5 border-2 text-sm font-bold uppercase tracking-widest rounded-md" 
                            style={{ 
                                borderColor: status === 'PAID' ? '#22c55e' : status === 'UNPAID' ? '#ef4444' : '#9ca3af',
                                color: status === 'PAID' ? '#22c55e' : status === 'UNPAID' ? '#ef4444' : '#9ca3af'
                            }}
                        >
                            {status}
                        </div>
                    </div>
                </div>

                {/* Bill To */}
                <div className="mb-12 p-6 bg-gray-50/80 rounded-lg border border-gray-100 break-inside-avoid">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Bill To</span>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{receiver.name || "Client Name"}</h2>
                    <p className="text-gray-600 whitespace-pre-wrap leading-snug">{receiver.address || "Client Address"}</p>
                    <p className="text-gray-600 mt-1">{receiver.email}</p>
                </div>

                {/* Table */}
                <div className="flex-1 mb-8">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr style={brandStyle}>
                                <th className="py-3 px-4 text-left text-xs uppercase font-semibold rounded-tl-lg">Description</th>
                                <th className="py-3 px-4 text-center text-xs uppercase font-semibold w-24">Qty</th>
                                <th className="py-3 px-4 text-right text-xs uppercase font-semibold w-32">Price</th>
                                <th className="py-3 px-4 text-right text-xs uppercase font-semibold w-32 rounded-tr-lg">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {items.map((item, idx) => (
                                <tr key={item.id} className={`break-inside-avoid ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <td className="py-4 px-4 border-b border-gray-100">{item.description}</td>
                                    <td className="py-4 px-4 text-center border-b border-gray-100">{item.quantity}</td>
                                    <td className="py-4 px-4 text-right border-b border-gray-100">
                                        {formatCurrency(item.price, settings.currency)}
                                    </td>
                                    <td className="py-4 px-4 text-right border-b border-gray-100 font-medium">
                                        {formatCurrency(item.price * item.quantity, settings.currency)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div className="flex justify-end mb-12 break-inside-avoid">
                    <div className="w-2/3 md:w-1/2 lg:w-5/12 space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-medium text-gray-900">{formatCurrency(subtotal, settings.currency)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                            <span>Tax ({settings.taxRate}%)</span>
                            <span className="font-medium text-gray-900">{formatCurrency(taxAmount, settings.currency)}</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b-2 border-gray-200">
                            <span className="text-xl font-bold text-gray-800">Total</span>
                            <span className="text-2xl font-bold" style={textBrandStyle}>{formatCurrency(total, settings.currency)}</span>
                        </div>
                        {settings.currency === 'IDR' && (
                            <div className="text-right text-sm text-gray-500 italic mt-2 capitalize font-medium">
                                {terbilang(total)} Rupiah
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer & Notes */}
                <div className="mt-auto break-inside-avoid">
                    <div className="flex justify-between items-end gap-8 pb-8">
                        <div className="flex-1">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Notes & Payment Info</h3>
                            <p className="text-gray-600 text-sm whitespace-pre-wrap border-l-4 pl-4 py-1 leading-relaxed" style={{ borderColor: settings.brandColor }}>
                                {notes}
                            </p>
                        </div>
                        <div className="text-center min-w-[200px]">
                            {/* Space for physical signature */}
                            <div className="h-20 mb-1"></div>
                            
                            {/* Subtle decorative border for signature */}
                            <div className="border-t-2 opacity-50" style={{ borderColor: settings.brandColor }}></div>
                            
                            <div className="pt-2">
                                <p className="font-bold text-gray-900">{settings.signatureText}</p>
                                <p className="text-sm text-gray-500 mt-1">{sender.name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative Bottom Bar with Watermark */}
            <div className="h-8 w-full flex items-center justify-between px-12" style={brandStyle}>
                 <span className="text-[10px] text-white/90 tracking-wide">{sender.website}</span>
                 <span className="text-[10px] text-white/80 font-light tracking-widest">@latiefdeveloper</span>
            </div>
        </div>
    </div>
  );
};