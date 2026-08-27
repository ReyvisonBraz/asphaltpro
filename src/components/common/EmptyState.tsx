import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'search_off',
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center p-8 sm:p-12
        bg-white rounded-xl border border-[#DEE2E6] shadow-2xs my-2
        ${className}
      `.trim()}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#835400]/10 flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-2xl text-[#835400]">{icon}</span>
      </div>

      <h4 className="text-base font-bold text-[#010102] tracking-tight">{title}</h4>

      {description && (
        <p className="text-xs text-[#77767B] max-w-md mx-auto mt-1 leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="primary" size="sm" icon={actionIcon} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
