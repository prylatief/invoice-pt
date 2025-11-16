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
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all shadow-sm font-semibold text-sm"
            >
                <Printer size={18} /> Print / PDF
            </button>
            <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-semibold text-sm"
            >
                <Download size={18} /> Export Image
            </button>
        </div>

        {/* A4 Container */}
        <div
            id={id}
            className="bg-white w-[210mm] min-h-[297mm] shadow-2xl relative flex flex-col text-sm leading-relaxed mx-auto print:shadow-none print:mx-0 overflow-hidden"
            style={{ padding: '0' }}
        >
            {/* Top Gradient Bar */}
            <div className="h-4 w-full relative overflow-hidden" style={brandStyle}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>

            <div className="p-6 flex flex-col h-full flex-1">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col max-w-[50%]">
                        {sender.logo ? (
                            <img
                                src={sender.logo}
                                alt="Logo"
                                className="max-h-16 max-w-[180px] object-contain mb-3 self-start"
                            />
                        ) : (
                            <div className="h-12 flex items-center text-xl font-bold text-gray-300 uppercase tracking-widest mb-3">
                                LOGO
                            </div>
                        )}
                        <h1 className="text-xl font-bold text-gray-900">{sender.name}</h1>
                        <p className="text-gray-500 whitespace-pre-wrap mt-1 leading-snug">{sender.address}</p>
                        {sender.email && <p className="text-gray-500 mt-1">{sender.email}</p>}
                        {sender.phone && <p className="text-gray-500">{sender.phone}</p>}
                    </div>

                    <div className="text-right">
                        <h1 className="text-5xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">INVOICE</h1>
                        <p className="text-lg font-bold text-gray-800 mb-4 tracking-wide">#{invoiceNumber}</p>
                        
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
                        <div className="mt-4 inline-block px-5 py-1 border-2 text-sm font-bold uppercase tracking-widest rounded-md" 
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
                <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border-2 border-gray-200/60 shadow-sm break-inside-avoid relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-100/40 to-blue-100/40 rounded-full blur-3xl"></div>
                    <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-1 block relative z-10">Bill To</span>
                    <h2 className="text-lg font-bold text-gray-900 mb-1 relative z-10">{receiver.name || "Client Name"}</h2>
                    <p className="text-gray-600 whitespace-pre-wrap leading-snug relative z-10">{receiver.address || "Client Address"}</p>
                    <p className="text-gray-600 mt-1 relative z-10">{receiver.email}</p>
                </div>

                {/* Table */}
                <div className="flex-1 mb-4">
                    <table className="w-full border-collapse rounded-xl overflow-hidden shadow-sm">
                        <thead>
                            <tr className="bg-gradient-to-r text-white shadow-md" style={{ backgroundImage: `linear-gradient(135deg, ${settings.brandColor}, ${settings.brandColor}dd)` }}>
                                <th className="py-2 px-3 text-left text-xs uppercase font-bold tracking-wider">Description</th>
                                <th className="py-2 px-3 text-center text-xs uppercase font-bold tracking-wider w-20">Qty</th>
                                <th className="py-2 px-3 text-right text-xs uppercase font-bold tracking-wider w-28">Price</th>
                                <th className="py-2 px-3 text-right text-xs uppercase font-bold tracking-wider w-28">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {items.map((item, idx) => (
                                <tr key={item.id} className={`break-inside-avoid transition-colors hover:bg-gray-100/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    <td className="py-2 px-3 border-b border-gray-200/60 font-medium">{item.description}</td>
                                    <td className="py-2 px-3 text-center border-b border-gray-200/60">{item.quantity}</td>
                                    <td className="py-2 px-3 text-right border-b border-gray-200/60 text-gray-600">
                                        {formatCurrency(item.price, settings.currency)}
                                    </td>
                                    <td className="py-2 px-3 text-right border-b border-gray-200/60 font-bold text-gray-900">
                                        {formatCurrency(item.price * item.quantity, settings.currency)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div className="flex justify-end mb-4 break-inside-avoid">
                    <div className="w-2/3 md:w-1/2 lg:w-5/12 space-y-1 bg-gray-50/50 p-4 rounded-2xl border border-gray-200/60 shadow-sm">
                        <div className="flex justify-between py-1.5 border-b border-gray-200 text-gray-600">
                            <span className="font-medium">Subtotal</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(subtotal, settings.currency)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-gray-200 text-gray-600">
                            <span className="font-medium">Tax ({settings.taxRate}%)</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(taxAmount, settings.currency)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 bg-gradient-to-r from-cyan-50 to-blue-50 -mx-4 px-4 rounded-xl mt-1">
                            <span className="text-lg font-bold text-gray-800">Total</span>
                            <span className="text-2xl font-extrabold text-cyan-700">{formatCurrency(total, settings.currency)}</span>
                        </div>
                        {settings.currency === 'IDR' && (
                            <div className="text-right text-sm text-gray-500 italic mt-2 capitalize font-medium border-t border-gray-200 pt-2">
                                {terbilang(total)} Rupiah
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer & Notes */}
                <div className="mt-auto break-inside-avoid">
                    <div className="flex justify-between items-end gap-6 pb-4">
                        <div className="flex-1">
                            <h3 className="text-xs font-bold text-cyan-600 uppercase mb-2 tracking-wider">Notes & Payment Info</h3>
                            <div className="bg-gradient-to-r from-gray-50 to-transparent border-l-4 pl-4 py-2 rounded-r-lg" style={{ borderColor: settings.brandColor }}>
                                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                                    {notes}
                                </p>
                            </div>
                        </div>
                        <div className="text-center min-w-[180px]">
                            {/* Space for physical signature */}
                            <div className="h-12 mb-1"></div>
                            
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
            <div className="h-8 w-full flex items-center justify-between px-6 relative overflow-hidden" style={brandStyle}>
                 <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10"></div>
                 <span className="text-xs text-white/90 tracking-wide font-medium relative z-10">{sender.website || 'www.latiefinvoice.com'}</span>
                 <div className="flex items-center gap-2 relative z-10">
                    <span className="text-xs text-white/70 font-light">Powered by</span>
                    <span className="text-sm text-white font-bold tracking-wider">LatieFinvoice</span>
                 </div>
            </div>
        </div>
    </div>
  );
};