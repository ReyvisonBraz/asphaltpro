import React from 'react';
import { useApp } from '../../context/AppContext';
import { ViewMode } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    logout,
    user,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    quotes
  } = useApp();

  const openQuotesCount = quotes.filter(q => q.status === 'enviado' || q.status === 'aprovado').length;

  const navItems: { id: ViewMode; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'lancamentos', label: 'Lançamentos', icon: 'receipt_long' },
    { id: 'contas', label: 'Contas a Pagar/Receber', icon: 'payments' },
    { id: 'orcamentos', label: 'Orçamentos', icon: 'request_quote', badge: openQuotesCount },
    { id: 'cadastros', label: 'Cadastros', icon: 'settings_applications' },
    { id: 'relatorios', label: 'Relatórios', icon: 'analytics' }
  ];

  const handleNavClick = (id: ViewMode) => {
    setCurrentView(id);
    setIsMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`w-64 h-screen bg-[#010102] text-[#858486] border-r border-[#1c1c1e] fixed left-0 top-0 z-50 flex flex-col py-6 px-4 select-none transition-transform duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header Brand */}
        <div className="flex items-center justify-between px-2 mb-8">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-[#1c1c1e] flex items-center justify-center overflow-hidden shrink-0 border border-[#474649]">
              <img
                src={user.avatarUrl}
                alt="Asphalt Pro Manager"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden min-w-0">
              <h1 className="text-base font-bold text-white tracking-tight leading-snug truncate">
                Asphalt Pro
              </h1>
              <p className="text-[11px] font-semibold text-[#858486] tracking-wide uppercase truncate">
                Cash Flow Control
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#1c1c1e]"
            aria-label="Fechar menu"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all text-left w-full ${
                  isActive
                    ? 'bg-[#835400] text-white shadow-sm font-bold translate-x-0.5'
                    : 'text-[#858486] hover:text-white hover:bg-[#1c1c1e]'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px] shrink-0"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className="truncate flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#F2A93B] text-[#010102] shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Navigation */}
        <div className="flex flex-col gap-1.5 pt-4 border-t border-[#1c1c1e] shrink-0">
          <PWAInstallButton variant="sidebar" />

          <button
            onClick={() => handleNavClick('configuracoes')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-colors text-left w-full ${
              currentView === 'configuracoes'
                ? 'bg-[#835400] text-white'
                : 'text-[#858486] hover:text-white hover:bg-[#1c1c1e]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">settings</span>
            <span className="truncate">Configurações</span>
          </button>

          <button
            onClick={() => {
              setIsMobileSidebarOpen(false);
              logout();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-[#858486] hover:text-[#E03131] hover:bg-[#1c1c1e] transition-colors text-left w-full"
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
            <span className="truncate">Sair</span>
          </button>

          {/* Mini user status indicator */}
          <div className="mt-3 px-3 py-2 rounded bg-[#141D24] border border-[#1c1c1e] flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#2F9E44] shrink-0 animate-pulse"></span>
              <span className="text-xs font-medium text-white truncate">{user.name}</span>
            </div>
            <span className="text-[10px] text-[#F2A93B] font-bold uppercase shrink-0">{user.role}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
