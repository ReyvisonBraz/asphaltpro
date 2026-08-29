import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ViewMode } from '../../types';

interface BottomNavigationProps {
  onOpenMobileSidebar: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ onOpenMobileSidebar }) => {
  const {
    currentView,
    setCurrentView,
    contasEmAtraso,
    quotes,
    openNovoLancamentoWithTab,
    setIsNovaContaOpen,
    setIsNovoOrcamentoOpen,
    setIsNovoFuncionarioOpen,
    setEditingQuote,
    setEditingEmployee,
    permissions
  } = useApp();

  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const pushedQuickActionsRef = useRef(false);

  useEffect(() => {
    if (!isQuickActionsOpen) {
      if (pushedQuickActionsRef.current) {
        pushedQuickActionsRef.current = false;
        if (window.history.state?.isQuickActions) {
          window.history.back();
        }
      }
      return;
    }

    pushedQuickActionsRef.current = true;
    window.history.pushState({ isModal: true, isQuickActions: true }, '');

    const handlePopState = () => {
      if (pushedQuickActionsRef.current) {
        pushedQuickActionsRef.current = false;
        setIsQuickActionsOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (pushedQuickActionsRef.current) {
        pushedQuickActionsRef.current = false;
        if (window.history.state?.isQuickActions) {
          window.history.back();
        }
      }
    };
  }, [isQuickActionsOpen]);

  const pendingQuotes = quotes.filter(q => q.status === 'rascunho' || q.status === 'enviado').length;

  const navItems: {
    id: ViewMode | 'menu';
    label: string;
    icon: string;
    badge?: number | boolean;
    badgeColor?: string;
    onClick: () => void;
  }[] = [
    {
      id: 'dashboard',
      label: 'Início',
      icon: 'dashboard',
      onClick: () => setCurrentView('dashboard'),
    },
    {
      id: 'lancamentos',
      label: 'Caixa',
      icon: 'receipt_long',
      onClick: () => setCurrentView('lancamentos'),
    },
    {
      id: 'orcamentos',
      label: 'Cotações',
      icon: 'request_quote',
      badge: pendingQuotes > 0 ? pendingQuotes : undefined,
      badgeColor: 'bg-[#835400] text-white',
      onClick: () => setCurrentView('orcamentos'),
    },
    {
      id: 'contas',
      label: 'Contas',
      icon: 'payments',
      badge: contasEmAtraso > 0 ? contasEmAtraso : undefined,
      badgeColor: 'bg-[#E03131] text-white',
      onClick: () => setCurrentView('contas'),
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: 'menu',
      onClick: onOpenMobileSidebar,
    },
  ];

  return (
    <>
      {/* Quick Actions Action Sheet (Mobile Bottom Sheet) */}
      {isQuickActionsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsQuickActionsOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl border-t border-[#DEE2E6] shadow-2xl p-5 pb-8 flex flex-col gap-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab indicator */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-1" />

            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F2A93B] text-[22px]">bolt</span>
                <h3 className="text-base font-extrabold text-[#010102] tracking-tight">
                  Ações Rápidas de Campo
                </h3>
              </div>
              <button
                onClick={() => setIsQuickActionsOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-black flex items-center justify-center"
                aria-label="Fechar ações rápidas"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Nova Entrada */}
              <button
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  openNovoLancamentoWithTab('entrada');
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100/70 text-left transition-all active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-[#2F9E44] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-emerald-950 truncate">Nova Entrada</div>
                  <div className="text-[10px] text-emerald-700 truncate">Venda de CBUQ / Serv.</div>
                </div>
              </button>

              {/* Nova Saída */}
              <button
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  openNovoLancamentoWithTab('saida');
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 hover:bg-amber-100/70 text-left transition-all active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-[#835400] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">remove_circle</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-amber-950 truncate">Nova Saída</div>
                  <div className="text-[10px] text-amber-800 truncate">Combustível / CAP</div>
                </div>
              </button>

              {/* Novo Orçamento */}
              <button
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  setEditingQuote(null);
                  setIsNovoOrcamentoOpen(true);
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-left transition-all active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-[#010102] text-[#F2A93B] flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">request_quote</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-gray-900 truncate">Novo Orçamento</div>
                  <div className="text-[10px] text-gray-500 truncate">Proposta A4 / Cotação</div>
                </div>
              </button>

              {/* Nova Conta */}
              <button
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  setIsNovaContaOpen(true);
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-red-50 border border-red-200/80 hover:bg-red-100/70 text-left transition-all active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-[#E03131] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-red-950 truncate">Novo Título</div>
                  <div className="text-[10px] text-red-700 truncate">A Pagar ou Receber</div>
                </div>
              </button>

              {/* Novo Funcionário / Motorista */}
              {permissions.canManageUsers && (
                <button
                  onClick={() => {
                    setIsQuickActionsOpen(false);
                    setEditingEmployee(null);
                    setIsNovoFuncionarioOpen(true);
                  }}
                  className="col-span-2 flex items-center gap-3 p-3 rounded-2xl bg-blue-50 border border-blue-200/80 hover:bg-blue-100/70 text-left transition-all active:scale-98"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1971C2] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-blue-950 truncate">Cadastrar Colaborador / Motorista</div>
                    <div className="text-[10px] text-blue-700 truncate">Equipe operacional, usina e pavimentação</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) for Mobile */}
      <div className="fixed bottom-20 right-4 z-40 lg:hidden">
        <button
          onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-90 ${
            isQuickActionsOpen
              ? 'bg-[#010102] text-white rotate-45 border-2 border-white/40'
              : 'bg-[#F2A93B] text-[#010102] hover:bg-[#d99632] border-2 border-white shadow-amber-500/30'
          }`}
          aria-label="Ações rápidas"
          title="Ações rápidas de usina"
        >
          <span className="material-symbols-outlined text-[28px] font-bold">add</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DEE2E6] pb-[env(safe-area-inset-bottom,4px)] lg:hidden shadow-lg"
        aria-label="Navegação mobile"
      >
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative select-none active:scale-95 ${
                  isActive ? 'text-[#835400]' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <div className="relative">
                  <span
                    className={`material-symbols-outlined text-[22px] transition-transform ${
                      isActive ? 'scale-110 font-bold' : ''
                    }`}
                  >
                    {item.icon}
                  </span>

                  {item.badge !== undefined && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 text-[10px] font-black rounded-full flex items-center justify-center shadow-xs ${
                        item.badgeColor || 'bg-red-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[11px] font-semibold mt-0.5 tracking-tight leading-tight ${
                    isActive ? 'font-bold text-[#835400]' : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </span>

                {isActive && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-[#835400] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
