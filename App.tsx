import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { History } from './components/History';
import { LoginModal } from './components/LoginModal';
import { useInvoiceStore } from './store';
import { FileText, History as HistoryIcon, LayoutTemplate, User, ShieldCheck, LogIn, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'editor' | 'history'>('editor');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { resetInvoice, initializeAuth, logout, user, currentInvoice } = useInvoiceStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  const handleNewInvoice = () => {
    resetInvoice();
    setView('editor');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar / Navigation */}
      <aside className="w-full md:w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col shrink-0 shadow-2xl">
        <div className="p-6 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-transparent">
          <h1 className="text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            <LayoutTemplate className="text-cyan-400" size={28} />
            LatieFinvoice
          </h1>
          <div className="mt-3 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full w-fit">
                  {user.isAdmin ? <ShieldCheck size={12} /> : <User size={12} />}
                  {user.isAdmin ? 'Admin Mode' : 'User Mode'}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 truncate max-w-[180px]" title={user.email || ''}>
                    {user.email}
                  </p>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Guest Mode</p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
                  title="Login"
                >
                  <LogIn size={14} />
                  <span>Login</span>
                </button>
              </div>
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-cyan-50/30">
        {view === 'editor' ? (
          <Layout>
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Left: Form Editor */}
              <div className="flex-1 lg:max-w-xl xl:max-w-2xl h-full overflow-y-auto no-scrollbar pr-2 pb-20">
                <InvoiceForm key={currentInvoice.id} />
              </div>

              {/* Right: Preview */}
              <div className="hidden lg:flex flex-1 bg-gradient-to-br from-gray-200/80 via-gray-100/60 to-cyan-100/40 rounded-2xl border border-gray-300/50 items-start justify-center overflow-auto h-full p-8 shadow-xl backdrop-blur-sm">
                {/* InvoicePreview renders the A4 sheet */}
                <InvoicePreview key={currentInvoice.id} id="desktop-preview" />
              </div>
            </div>
          </Layout>
        ) : (
          <Layout>
            <History onViewInvoice={() => setView('editor')} />
          </Layout>
        )}
      </main>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default App;