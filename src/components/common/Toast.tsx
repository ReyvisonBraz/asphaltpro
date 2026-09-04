import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, ShieldAlert, ChevronRight, X, Wrench } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage, openDiagnosticsWithError, hideToast, toastPosition } = useApp();

  if (!toastMessage) return null;

  const bgColors = {
    success: 'bg-[#18181b] text-white border-l-4 border-[#2F9E44]',
    error: 'bg-[#1c1417] text-white border-l-4 border-[#E03131]',
    info: 'bg-[#18181b] text-white border-l-4 border-[#F2A93B]'
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#2F9E44] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[#E03131] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#F2A93B] shrink-0" />
  };

  const isError = toastMessage.type === 'error';

  // Configurable position classes: defaults to top-right safely out of the way of modal/footer action buttons
  const positionClasses: Record<string, string> = {
    'top-right': 'top-4 right-4 sm:top-6 sm:right-6 items-end',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 sm:top-6 items-center',
    'top-left': 'top-4 left-4 sm:top-6 sm:left-6 items-start',
    'bottom-left': 'bottom-6 left-4 sm:bottom-6 sm:left-6 items-start',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2 items-center',
    'bottom-right': 'bottom-6 right-4 sm:bottom-6 sm:right-6 items-end'
  };

  const currentPosClass = positionClasses[toastPosition] || positionClasses['top-right'];
  const isTopPosition = (toastPosition || 'top-right').startsWith('top');

  return (
    <div 
      className={`fixed ${currentPosClass} z-[99999] pointer-events-none flex flex-col max-w-[calc(100%-2rem)] sm:max-w-md w-full transition-all`}
      aria-live="assertive"
    >
      <div 
        className={`pointer-events-auto p-4 rounded-xl shadow-2xl ${bgColors[toastMessage.type]} border border-[#3c3a44] transition-all duration-200 ${
          isTopPosition 
            ? 'animate-in fade-in slide-in-from-top-4' 
            : 'animate-in fade-in slide-in-from-bottom-4'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-0.5">
              {icons[toastMessage.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-semibold text-white leading-snug">
                  {isError ? 'Atenção / Ocorreu um Erro' : toastMessage.type === 'success' ? 'Sucesso' : 'Notificação'}
                </span>
                {toastMessage.errorCode && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#E03131]/20 text-[#ff8787] border border-[#E03131]/40">
                    {toastMessage.errorCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 leading-relaxed break-words">
                {toastMessage.text}
              </p>

              {toastMessage.resolucao && (
                <div className="mt-2.5 p-2 rounded-lg bg-black/40 border border-slate-700/60 flex items-start gap-2">
                  <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-200/90 leading-tight">
                    <strong className="text-amber-300">Como corrigir:</strong> {toastMessage.resolucao}
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={hideToast}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar Notificação"
            aria-label="Fechar Notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isError && (
          <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Central de Diagnóstico
            </span>
            <button
              type="button"
              onClick={() => {
                hideToast();
                openDiagnosticsWithError(toastMessage.errorId);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline transition-colors cursor-pointer"
            >
              Ver Detalhes e Solução
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

