import React from 'react';
import { AccountStatus, QuoteStatus, TransactionType } from '../../types';

export type BadgeVariant =
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'primary'
  | 'purple';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  icon?: string;
  dot?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  primary: 'bg-[#835400]/10 text-[#835400] border-[#835400]/25',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

const sizeStyles = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1',
  sm: 'px-2.5 py-1 text-xs gap-1.5',
  md: 'px-3 py-1.5 text-xs gap-2 font-bold',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  icon,
  dot,
  className = '',
  children,
  ...props
}) => {
  return (
    <span
      className={`
        inline-flex items-center justify-center font-bold tracking-tight rounded-md border
        select-none whitespace-nowrap leading-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim()}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            variant === 'success'
              ? 'bg-emerald-500'
              : variant === 'danger'
              ? 'bg-red-500'
              : variant === 'warning'
              ? 'bg-amber-500'
              : variant === 'info'
              ? 'bg-blue-500'
              : 'bg-gray-400'
          }`}
        />
      )}
      {icon && <span className="material-symbols-outlined text-[14px] leading-none shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export interface StatusBadgeProps {
  status: QuoteStatus | AccountStatus | TransactionType | 'ativo' | 'inativo' | string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

/**
 * High-level domain badge for Quotes, Accounts, Transactions and System Entities.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className = '' }) => {
  switch (status) {
    // Quotes
    case 'aprovado':
      return (
        <Badge variant="success" size={size} icon="check_circle" className={className}>
          Aprovado
        </Badge>
      );
    case 'convertido':
      return (
        <Badge variant="success" size={size} icon="price_check" className={className}>
          Faturado
        </Badge>
      );
    case 'enviado':
      return (
        <Badge variant="info" size={size} icon="send" className={className}>
          Enviado
        </Badge>
      );
    case 'rascunho':
      return (
        <Badge variant="neutral" size={size} icon="edit_note" className={className}>
          Rascunho
        </Badge>
      );
    case 'recusado':
      return (
        <Badge variant="danger" size={size} icon="cancel" className={className}>
          Recusado
        </Badge>
      );
    case 'expirado':
      return (
        <Badge variant="neutral" size={size} icon="timer_off" className={className}>
          Expirado
        </Badge>
      );

    // Accounts
    case 'pago':
      return (
        <Badge variant="success" size={size} icon="task_alt" className={className}>
          Pago / Liquidado
        </Badge>
      );
    case 'pendente':
      return (
        <Badge variant="warning" size={size} icon="hourglass_top" className={className}>
          Pendente
        </Badge>
      );
    case 'atrasado':
      return (
        <Badge variant="danger" size={size} icon="error" className={className}>
          Em Atraso
        </Badge>
      );

    // Transactions
    case 'entrada':
      return (
        <Badge variant="success" size={size} icon="arrow_upward" className={className}>
          Entrada
        </Badge>
      );
    case 'saida':
      return (
        <Badge variant="danger" size={size} icon="arrow_downward" className={className}>
          Saída
        </Badge>
      );

    // General
    case 'ativo':
      return (
        <Badge variant="success" size={size} dot className={className}>
          Ativo
        </Badge>
      );
    case 'inativo':
      return (
        <Badge variant="neutral" size={size} dot className={className}>
          Inativo
        </Badge>
      );

    default:
      return (
        <Badge variant="neutral" size={size} className={className}>
          {status}
        </Badge>
      );
  }
};
