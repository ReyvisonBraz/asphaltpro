import React, { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { useApp } from '../../context/AppContext';
import { ViewMode } from '../../types';
import { SyncStatusBadge } from '../sync/SyncStatusBadge';
import { SyncDetailsModal } from '../sync/SyncDetailsModal';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { errorDiagnosticsService } from '../../services/errorDiagnosticsService';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export const TopHeader: React.FC = () => {
  const {
    currentView,
    navigateBack,
    canGoBack,
    previousViewTitle,
    notifications,
    user,
    systemUsers,
    switchUser,
    logout,
    setIsHelpOpen,
    setIsDiagnosticsOpen,
    setCurrentView,
    setIsMobileSidebarOpen,
    isSidebarCollapsed,
    toggleSidebarCollapsed
  } = useApp();

  const errors = useSyncExternalStore(
    (cb) => errorDiagnosticsService.subscribe(cb),
    () => errorDiagnosticsService.getErrors(),
    () => []
  );

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.lida).length;
  const recentErrorCount = (errors || []).filter(e => {
    const errorTime = new Date(e.timestamp).getTime();
    return Date.now() - errorTime < 1000 * 60 * 30; // últimos 30 min
  }).length;

  const viewTitles: Record<ViewMode, string> = {
    dashboard: 'Dashboard Resumo',
    lancamentos: 'Lançamentos Financeiros',
    contas: 'Contas a Pagar e Receber',
    orcamentos: 'Orçamentos & Propostas Comerciais',
    cadastros: 'Cadastros da Usina',
    relatorios: 'Relatórios & DRE',
    configuracoes: 'Configurações'
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-16 bg-white border-b border-[#DEE2E6] z-30 flex justify-between items-center px-4 sm:px-6 lg:px-10 sticky top-0 w-full shadow-none">
        {/* Title + Back Button + Mobile Menu Trigger + Desktop Sidebar Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 mr-2">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Abrir Menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          {/* Desktop Sidebar Collapse Toggle */}
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className="hidden lg:flex p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition-colors cursor-pointer shrink-0 border border-gray-200/80 shadow-2xs active:scale-95"
            title={isSidebarCollapsed ? "Fixar e expandir barra lateral (Ctrl+B)" : "Recolher barra lateral para expandir área útil (Ctrl+B)"}
            aria-label="Alternar barra lateral"
          >
            <span className="material-symbols-outlined text-[20px] text-gray-700">
              {isSidebarCollapsed ? 'dock_to_right' : 'dock_to_left'}
            </span>
          </button>

          {canGoBack && (
            <button
              onClick={navigateBack}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 hover:text-black text-xs font-bold transition-all border border-gray-200 shadow-2xs shrink-0 cursor-pointer active:scale-95"
              title={`Voltar para ${previousViewTitle || 'tela anterior'}`}
              aria-label="Voltar à tela anterior"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span className="hidden sm:inline">Voltar</span>
            </button>
          )}

          <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-[#010102] tracking-tight truncate min-w-0">
            {viewTitles[currentView] || 'Painel Financeiro'}
          </h2>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4 shrink-0">
          {/* Sync Status Badge */}
          <SyncStatusBadge onClick={() => setIsSyncModalOpen(true)} />

          {/* PWA Install Button (if available in browser) */}
          <PWAInstallButton variant="header" />

          {/* Action icons */}
          <div className="flex items-center gap-1 text-[#46464A]">
            {/* Notifications button */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-[#F1EDEC] hover:text-[#835400] transition-colors flex items-center justify-center relative"
                title="Notificações"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#E03131] rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg border border-[#DEE2E6] shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#010102]">Notificações</span>
                      {unreadCount > 0 && (
                        <span className="bg-[#FFDAD6] text-[#93000A] text-xs font-bold px-2 py-0.5 rounded-full">
                          {unreadCount} novas
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNotifOpen(false)}
                      className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                      title="Fechar notificações"
                      aria-label="Fechar"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          notif.lida
                            ? 'bg-[#F8F9FA] border-gray-100 text-gray-600'
                            : 'bg-white border-[#DEE2E6] text-[#010102] shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-[#010102]">{notif.titulo}</p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">{notif.data}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.mensagem}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Error Diagnostics button */}
            <button
              onClick={() => setIsDiagnosticsOpen(true)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all flex items-center justify-center relative ${
                recentErrorCount > 0
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 ring-2 ring-rose-300'
                  : 'hover:bg-[#F1EDEC] hover:text-[#835400] text-[#46464A]'
              }`}
              title="Diagnóstico do Sistema & Resolução de Erros"
            >
              {recentErrorCount > 0 ? (
                <ShieldAlert className="w-5 h-5 text-[#E03131] animate-pulse" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              )}
              {recentErrorCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#E03131] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {recentErrorCount}
                </span>
              )}
            </button>

            {/* Help button */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-[#F1EDEC] hover:text-[#835400] transition-colors hidden sm:flex items-center justify-center cursor-pointer"
              title="Ajuda e Atalhos"
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">help_outline</span>
            </button>
          </div>

          {/* Manager User Profile */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#C7C6CA] hover:opacity-90 transition-opacity"
            >
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-[#1C1B1B] block truncate max-w-[120px]">
                  {user.name.split(' ')[0]}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#835400] block">
                  {user.role}
                </span>
              </div>
              <img
                src={user.avatarUrl}
                alt="Manager Avatar"
                className="w-8 h-8 rounded-full object-cover border border-[#C7C6CA]"
              />
            </button>

            {/* User Menu Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#DEE2E6] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border border-gray-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#010102] truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                        Perfil: {user.role}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                    title="Fechar menu do usuário"
                    aria-label="Fechar"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                {/* Quick Switch User (Demo/Simulation) */}
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block px-1 mb-1">
                    Alternar Perfil Rápido
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {systemUsers.map((su) => (
                      <button
                        key={su.id}
                        onClick={() => {
                          switchUser(su.id);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                          su.id === user.id
                            ? 'bg-amber-100 font-bold text-amber-950'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <img src={su.avatarUrl} alt={su.name} className="w-5 h-5 rounded-full object-cover" />
                          <span className="truncate">{su.name}</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-gray-500 shrink-0">
                          {su.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsSyncModalOpen(true);
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">sync_saved_locally</span>
                  Status de Sincronização
                </button>
                <button
                  onClick={() => {
                    setCurrentView('configuracoes');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  Configurações & Usuários
                </button>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#E03131] hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Sair do Sistema
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sync Details & Audit Modal */}
      {isSyncModalOpen && (
        <SyncDetailsModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
        />
      )}
    </>
  );
};

