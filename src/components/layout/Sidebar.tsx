import React, { useState, useEffect } from 'react';
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
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    quotes,
    contasEmAtraso,
    letterheadSettings
  } = useApp();

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen, setIsMobileSidebarOpen]);

  // Is the sidebar visually expanded? (True if mobile is open, or desktop is uncollapsed, or desktop is hovered)
  const isExpanded = isMobileSidebarOpen || !isSidebarCollapsed || isHovered;

  const openQuotesCount = quotes.filter(q => q.status === 'enviado' || q.status === 'aprovado').length;

  // All application navigation items - Always fully visible and accessible
  const navItems: { id: ViewMode; label: string; icon: string; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'lancamentos', label: 'Lançamentos', icon: 'receipt_long' },
    { 
      id: 'contas', 
      label: 'Contas a Pagar/Receber', 
      icon: 'payments',
      badge: contasEmAtraso > 0 ? contasEmAtraso : undefined,
      badgeColor: 'bg-[#E03131] text-white'
    },
    { 
      id: 'orcamentos', 
      label: 'Orçamentos & Propostas', 
      icon: 'request_quote', 
      badge: openQuotesCount > 0 ? openQuotesCount : undefined,
      badgeColor: 'bg-[#F2A93B] text-[#010102]'
    },
    { id: 'cadastros', label: 'Cadastros da Usina', icon: 'settings_applications' },
    { id: 'relatorios', label: 'Relatórios & DRE', icon: 'analytics' },
    { id: 'configuracoes', label: 'Configurações & Usuários', icon: 'settings' }
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

      {/* Retractable Sidebar Navigation */}
      <aside
        onMouseEnter={() => {
          if (isSidebarCollapsed) setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        className={`h-screen bg-[#010102] text-[#858486] border-r border-[#1c1c1e] fixed left-0 top-0 z-50 flex flex-col py-4 select-none transition-all duration-300 ease-in-out ${
          isMobileSidebarOpen
            ? 'translate-x-0 w-64 px-3.5 shadow-2xl'
            : '-translate-x-full lg:translate-x-0'
        } ${
          !isMobileSidebarOpen && (isSidebarCollapsed && !isHovered)
            ? 'w-20 px-2.5 items-center'
            : 'w-64 px-3.5 shadow-2xl lg:shadow-none'
        }`}
      >
        {/* Header Brand & Toggle Controls */}
        <div className={`flex items-center mb-5 w-full ${isExpanded ? 'justify-between px-1' : 'justify-center'}`}>
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            {/* Logo Image */}
            <div 
              className="w-10 h-10 rounded-xl bg-[#1c1c1e] flex items-center justify-center overflow-hidden shrink-0 border border-[#474649] shadow-inner cursor-pointer"
              onClick={() => handleNavClick('dashboard')}
              title="Asphalt Pro - Início"
            >
              <img
                src={letterheadSettings.logoUrl || user.avatarUrl}
                alt={letterheadSettings.nomeEmpresa || 'Asphalt Pro'}
                className="w-full h-full object-contain p-0.5"
              />
            </div>

            {/* Brand Title (Visible when expanded) */}
            {isExpanded && (
              <div className="overflow-hidden min-w-0 animate-in fade-in duration-200">
                <h1 className="text-base font-bold text-white tracking-tight leading-snug truncate">
                  Asphalt Pro
                </h1>
                <p className="text-[10px] font-semibold text-[#858486] tracking-wide uppercase truncate">
                  Cash Flow Control
                </p>
              </div>
            )}
          </div>

          {/* Desktop Pin / Collapse Button */}
          {isExpanded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebarCollapsed();
              }}
              className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c1c1e] transition-colors cursor-pointer shrink-0"
              title={isSidebarCollapsed ? "Fixar barra lateral aberta" : "Recolher barra lateral (libera espaço na tela - Ctrl+B)"}
              aria-label="Alternar recolhimento da barra lateral"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSidebarCollapsed ? 'push_pin' : 'keyboard_double_arrow_left'}
              </span>
            </button>
          )}

          {/* Close button on mobile */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c1c1e] cursor-pointer"
            aria-label="Fechar menu"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Small Expand Trigger Button when collapsed on desktop */}
        {!isExpanded && (
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg text-gray-400 hover:text-[#F2A93B] hover:bg-[#1c1c1e] mb-3 transition-colors cursor-pointer"
            title="Expandir e fixar menu lateral (Ctrl+B)"
          >
            <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_right</span>
          </button>
        )}

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto w-full scrollbar-thin">
          {isExpanded && (
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 py-1 mb-1 animate-in fade-in duration-200">
              Módulos do Sistema
            </div>
          )}

          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={!isExpanded ? `${item.label}${item.badge ? ` (${item.badge})` : ''}` : undefined}
                className={`flex items-center rounded-xl text-xs font-semibold tracking-wide transition-all w-full cursor-pointer relative group ${
                  isExpanded ? 'gap-3 px-3 py-2.5 text-left' : 'justify-center p-3'
                } ${
                  isActive
                    ? 'bg-[#835400] text-white shadow-sm font-bold'
                    : 'text-[#858486] hover:text-white hover:bg-[#1c1c1e]'
                }`}
              >
                {/* Icon with active accent */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>

                  {/* Badge in collapsed mode (compact indicator dot / count) */}
                  {!isExpanded && item.badge !== undefined && item.badge > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 flex items-center justify-center text-[9px] font-bold rounded-full ${item.badgeColor || 'bg-[#F2A93B] text-[#010102]'}`}>
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Text Label & Badge (when expanded) */}
                {isExpanded && (
                  <>
                    <span className="truncate flex-1 animate-in fade-in duration-150">
                      {item.label}
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 shadow-2xs ${item.badgeColor || 'bg-[#F2A93B] text-[#010102]'}`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Navigation */}
        <div className={`flex flex-col gap-2 pt-3 border-t border-[#1c1c1e] shrink-0 mt-auto w-full ${!isExpanded ? 'items-center' : ''}`}>
          {isExpanded ? (
            <PWAInstallButton variant="sidebar" />
          ) : (
            <PWAInstallButton variant="header" />
          )}

          {/* Quick Logout Button */}
          <button
            onClick={() => {
              setIsMobileSidebarOpen(false);
              logout();
            }}
            title={!isExpanded ? "Sair do Sistema" : undefined}
            className={`flex items-center rounded-xl text-xs font-semibold tracking-wide text-[#858486] hover:text-[#E03131] hover:bg-[#1c1c1e] transition-colors w-full cursor-pointer ${
              isExpanded ? 'gap-3 px-3 py-2 text-left' : 'justify-center p-3'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] shrink-0">logout</span>
            {isExpanded && <span className="truncate animate-in fade-in duration-150">Sair do Sistema</span>}
          </button>

          {/* User Profile & Direct Settings Link Card */}
          {isExpanded ? (
            <button
              onClick={() => handleNavClick('configuracoes')}
              className="p-3 rounded-xl bg-[#101720] border border-[#1e2a38] hover:border-[#835400] hover:bg-[#151f2c] transition-all text-left w-full cursor-pointer group shadow-sm flex flex-col gap-2 animate-in fade-in duration-150"
              title="Clique para gerenciar perfil e configurações do sistema"
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

              {/* Bottom block: Full Name and Full Role/Title */}
              <div className="w-full pt-1 border-t border-[#1a2533]">
                <span className="text-xs font-bold text-white block leading-tight truncate">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-300 block font-medium leading-tight mt-0.5 truncate">
                  {user.roleTitle || user.role}
                </span>
              </div>

              {/* Micro action hint */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 group-hover:text-amber-400 pt-0.5 transition-colors">
                <span>Configurações do Usuário</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('configuracoes')}
              className="p-2 rounded-xl bg-[#101720] border border-[#1e2a38] hover:border-[#835400] hover:bg-[#151f2c] transition-all flex items-center justify-center cursor-pointer relative group"
              title={`${user.name} (${user.roleTitle || user.role}) - Clique para Configurações`}
            >
              <div className="relative shrink-0">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#2a3b4e]"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#2F9E44] ring-2 ring-[#101720]"></span>
              </div>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
