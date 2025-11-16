import React from 'react';
import { useInvoiceStore } from '../store';
import { formatCurrency, generateCSV } from '../utils';
import { Eye, Trash2, Search, FileSpreadsheet } from 'lucide-react';

interface Props {
    onViewInvoice: () => void;
}

export const History: React.FC<Props> = ({ onViewInvoice }) => {
    const { history, loadInvoice, deleteInvoice } = useInvoiceStore();
    const [search, setSearch] = React.useState("");

    const filteredHistory = history.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.receiver.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleView = (id: string) => {
        loadInvoice(id);
        onViewInvoice();
    };

    const handleExportCSV = () => {
        if (history.length === 0) {
            alert("No invoices to export.");
            return;
        }
        generateCSV(history);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Invoice History</h2>
                    <p className="text-sm text-gray-500">Manage your past invoices</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search invoice..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm text-sm font-medium whitespace-nowrap"
                        title="Export to Excel/CSV"
                    >
                        <FileSpreadsheet size={18} />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
                {filteredHistory.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20">
                        <p>No invoices found.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider rounded-l-lg">Number</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider rounded-r-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredHistory.map(inv => {
                                const total = inv.items.reduce((acc, item) => acc + (item.price * item.quantity), 0) * (1 + inv.settings.taxRate/100);
                                return (
                                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-medium text-blue-600">{inv.invoiceNumber}</span>
                                                {inv.settings.useStatus && (
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase
                                                        ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                          inv.status === 'UNPAID' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}
                                                    >
                                                        {inv.status}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">{inv.date}</td>
                                        <td className="py-3 px-4 text-gray-800 font-medium">{inv.receiver.name}</td>
                                        <td className="py-3 px-4 text-right font-medium text-gray-800">{formatCurrency(total, inv.settings.currency)}</td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleView(inv.id)}
                                                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                                    title="View / Edit"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => deleteInvoice(inv.id)}
                                                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};