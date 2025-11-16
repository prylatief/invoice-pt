import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { History } from './components/History';
import { LoginModal } from './components/LoginModal';
import { useInvoiceStore } from './store';
import { FileText, History as HistoryIcon, LayoutTemplate, LogIn, LogOut, User, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'editor' | 'history'>('editor');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  const { resetInvoice, initializeAuth, user, logout } = useInvoiceStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  const handleNewInvoice = () => {
    resetInvoice();
    setView('editor');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* Sidebar / Navigation */}
      <aside className="w-full md:w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col shrink-0 shadow-2xl">
        <div className="p-6 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-transparent">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="text-cyan-400" size={28} />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              LatieFinvoice
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
             {user ? (
               <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                 {user.isAdmin ? <ShieldCheck size={12} /> : <User size={12} />}
                 {user.isAdmin ? 'Admin Mode' : 'User Mode'}
               </div>
             ) : (
               <p className="text-xs text-slate-400">Guest Mode</p>
             )}
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setView('editor')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              view === 'editor'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/50 scale-105'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-cyan-300'
            }`}
          >
            <FileText size={20} />
            <span className="font-medium">Current Invoice</span>
          </button>

          <button
            onClick={() => setView('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              view === 'history'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/50 scale-105'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-cyan-300'
            }`}
          >
            <HistoryIcon size={20} />
            <span className="font-medium">History</span>
          </button>
        </nav>

        <div className="p-4 border-t border-cyan-500/20 space-y-3">
          <button
            onClick={handleNewInvoice}
            className="w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-200 py-2.5 rounded-lg text-sm font-semibold transition-all border border-cyan-400/30 shadow-lg shadow-cyan-900/20"
          >
            + Create New Invoice
          </button>

          {user ? (
            <div className="pt-2 border-t border-white/5">
              <div className="px-2 mb-2 text-xs text-slate-500 truncate">{user.email}</div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg text-sm transition-colors"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
             <button
                onClick={() => setIsLoginOpen(true)}
                className="w-full flex items-center gap-2 justify-center px-4 py-2 bg-cyan-900/30 text-cyan-300 hover:bg-cyan-900/50 hover:text-cyan-200 rounded-lg text-sm transition-all border border-cyan-700/50 font-medium"
              >
                <LogIn size={16} /> Login to Save
              </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-cyan-50/30">
        {view === 'editor' ? (
          <Layout>
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Left: Form Editor */}
              <div className="flex-1 lg:max-w-xl xl:max-w-2xl h-full overflow-y-auto no-scrollbar pr-2 pb-20">
                <InvoiceForm />
              </div>
              
              {/* Right: Preview */}
              <div className="hidden lg:flex flex-1 bg-gradient-to-br from-gray-200/80 via-gray-100/60 to-cyan-100/40 rounded-2xl border border-gray-300/50 items-start justify-center overflow-auto h-full p-8 shadow-xl backdrop-blur-sm">
                {/* InvoicePreview renders the A4 sheet */}
                <InvoicePreview id="desktop-preview" />
              </div>
            </div>
          </Layout>
        ) : (
          <Layout>
            <History onViewInvoice={() => setView('editor')} />
          </Layout>
        )}
      </main>
    </div>
  );
};

export default App;