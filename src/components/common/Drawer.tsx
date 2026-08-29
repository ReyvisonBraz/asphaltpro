import React, { useEffect, useRef } from 'react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
  className = '',
}) => {
  const drawerIdRef = useRef(`drawer-${Math.random().toString(36).slice(2, 9)}`);
  const pushedHistoryRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        if (window.history.state?.modalId === drawerIdRef.current) {
          window.history.back();
        }
      }
      return;
    }

    pushedHistoryRef.current = true;
    window.history.pushState(
      { isModal: true, modalId: drawerIdRef.current },
      ''
    );

    const handlePopState = () => {
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        if (window.history.state?.modalId === drawerIdRef.current) {
          window.history.back();
        }
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`
            w-screen bg-white shadow-2xl flex flex-col border-l border-[#DEE2E6]
            animate-in slide-in-from-right duration-250 ease-out
            ${sizeClasses[size]}
            ${className}
          `.trim()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#DEE2E6] flex items-center justify-between gap-4 bg-white shrink-0">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-[#010102] tracking-tight truncate">{title}</h3>
              {subtitle && <p className="text-xs text-[#77767B] mt-0.5 truncate">{subtitle}</p>}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black border border-gray-200/80 transition-colors shrink-0 cursor-pointer"
              title="Fechar painel lateral (Esc ou Voltar)"
              aria-label="Fechar"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-[#DEE2E6] bg-gray-50 flex items-center justify-end gap-2.5 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
