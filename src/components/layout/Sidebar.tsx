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
    permissions,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    quotes
  } = useApp();

  const openQuotesCount = quotes.filter(q => q.status === 'enviado' || q.status === 'aprovado').length;

  const navItems: { id: ViewMode; label: string; icon: string; badge?: number; visible?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', visible: permissions.canViewDashboard },
    { id: 'lancamentos', label: 'Lançamentos', icon: 'receipt_long', visible: permissions.canViewTransactions },
    { id: 'contas', label: 'Contas a Pagar/Receber', icon: 'payments', visible: permissions.canManageAccounts },
    { id: 'orcamentos', label: 'Orçamentos', icon: 'request_quote', badge: openQuotesCount, visible: permissions.canManageQuotes },
    { id: 'cadastros', label: 'Cadastros', icon: 'settings_applications', visible: permissions.canManageEmployees },
    { id: 'relatorios', label: 'Relatórios & DRE', icon: 'analytics', visible: permissions.canViewReports }
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
          {navItems
            .filter((item) => item.visible !== false)
            .map((item) => {
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

          {permissions.canManageSettings && (
            <button
              onClick={() => handleNavClick('configuracoes')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-colors text-left w-full ${
                currentView === 'configuracoes'
                  ? 'bg-[#835400] text-white'
                  : 'text-[#858486] hover:text-white hover:bg-[#1c1c1e]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">settings</span>
              <span className="truncate">Configurações & Usuários</span>
            </button>
          )}

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

          {/* User profile & status card */}
          <button
            onClick={() => handleNavClick('configuracoes')}
            className="mt-3 p-3 rounded-xl bg-[#101720] border border-[#1e2a38] hover:border-[#835400] hover:bg-[#151f2c] transition-all text-left w-full cursor-pointer group shadow-sm flex flex-col gap-2"
            title="Clique para gerenciar perfil e permissões"
          >
            {/* Top row: Avatar + Status + Role badge */}
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-[#2a3b4e]"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#2F9E44] ring-2 ring-[#101720] animate-pulse"></span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400">
                  Online
                </span>
              </div>

              <span className="text-[10px] text-[#F2A93B] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-800/50 shrink-0">
                {user.userRole || user.role}
              </span>
            </div>

            {/* Bottom block: Full Name and Full Role/Title without truncating */}
            <div className="w-full pt-1 border-t border-[#1a2533]">
              <span className="text-xs font-bold text-white block leading-tight">
                {user.name}
              </span>
              <span className="text-[11px] text-slate-300 block font-medium leading-tight mt-0.5">
                {user.roleTitle || user.role}
              </span>
            </div>

            {/* Micro action hint */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 group-hover:text-amber-400 pt-0.5 transition-colors">
              <span>Gerenciar perfil</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
