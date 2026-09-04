import React, { useEffect, useRef } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnEsc?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
  hideHeader?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl sm:max-w-2xl',
  lg: 'max-w-3xl sm:max-w-4xl',
  xl: 'max-w-5xl sm:max-w-6xl',
  '2xl': 'max-w-6xl sm:max-w-7xl lg:max-w-[1450px]',
  full: 'max-w-[98vw] w-[98vw] h-[95vh]',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
  closeOnEsc = true,
  closeOnBackdropClick = true,
  className = '',
  hideHeader = false,
}) => {
  const onCloseRef = useRef(onClose);
  const closeOnEscRef = useRef(closeOnEsc);

  useEffect(() => {
    onCloseRef.current = onClose;
    closeOnEscRef.current = closeOnEsc;
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscRef.current && e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-2.5 md:p-3.5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`
          bg-white rounded-t-3xl sm:rounded-2xl border-t sm:border border-[#DEE2E6] shadow-2xl w-full flex flex-col
          max-h-[95vh] overflow-hidden animate-in slide-in-from-bottom duration-200 sm:zoom-in-95
          ${sizeClasses[size]}
          ${className}
        `.trim()}
      >
        {/* Mobile Pull Bar / Drag Indicator */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-2.5 mb-0.5 sm:hidden shrink-0" />

        {/* Header */}
        {!hideHeader && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#DEE2E6] flex items-center justify-between gap-3 shrink-0 bg-white">
            <div className="min-w-0 flex-1">
              {typeof title === 'string' ? (
                <h3 className="text-base sm:text-lg font-bold text-[#010102] tracking-tight truncate">{title}</h3>
              ) : (
                title
              )}
              {subtitle && <p className="text-xs text-[#77767B] mt-0.5 truncate">{subtitle}</p>}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black border border-gray-200/80 transition-colors shrink-0 cursor-pointer"
              title="Fechar janela (Esc ou Voltar)"
              aria-label="Fechar"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">{children}</div>

        {/* Footer (Safe Area friendly) */}
        {footer && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 pb-6 sm:pb-4 border-t border-[#DEE2E6] bg-gray-50/90 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
