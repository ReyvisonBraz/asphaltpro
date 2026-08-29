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
    globalSearch,
    setGlobalSearch,
    notifications,
    user,
    systemUsers,
    switchUser,
    logout,
    setIsHelpOpen,
    setIsDiagnosticsOpen,
    setCurrentView,
    setIsMobileSidebarOpen
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
        {/* Title + Mobile Menu Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg flex items-center justify-center"
            aria-label="Abrir Menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#010102] tracking-tight truncate max-w-[180px] sm:max-w-md">
            {viewTitles[currentView] || 'Painel Financeiro'}
          </h2>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
          {/* Sync Status Badge */}
          <SyncStatusBadge onClick={() => setIsSyncModalOpen(true)} />

          {/* PWA Install Button (if available in browser) */}
          <PWAInstallButton variant="header" />

          {/* Search Bar */}
          <div className="relative hidden xl:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#77767B] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-9 pr-4 py-1.5 rounded border border-[#C7C6CA] bg-[#FFFFFF] focus:border-[#010102] focus:ring-1 focus:ring-[#010102] text-sm w-44 lg:w-56 outline-none transition-all placeholder:text-[#858486]"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

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
                    <span className="text-xs text-[#77767B]">Usina de Asfalto</span>
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
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-[#F1EDEC] hover:text-[#835400] transition-colors flex items-center justify-center"
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
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3">
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
                  Configurações & Usuários (RBAC)
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
      <SyncDetailsModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </>
  );
};

