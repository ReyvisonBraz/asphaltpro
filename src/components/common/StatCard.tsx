import React from 'react';

export type StatCardVariant = 'default' | 'success' | 'danger' | 'warning' | 'primary' | 'dark';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  variant?: StatCardVariant;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  onClick?: () => void;
  className?: string;
}

const variantStyles: Record<
  StatCardVariant,
  { iconBg: string; iconColor: string; border: string; valueColor: string }
> = {
  default: {
    iconBg: 'bg-gray-100',
    iconColor: 'text-[#46464A]',
    border: 'border-[#DEE2E6]',
    valueColor: 'text-[#010102]',
  },
  success: {
    iconBg: 'bg-emerald-50',
    iconColor: 'text-[#2F9E44]',
    border: 'border-[#DEE2E6]',
    valueColor: 'text-[#2F9E44]',
  },
  danger: {
    iconBg: 'bg-red-50',
    iconColor: 'text-[#E03131]',
    border: 'border-[#DEE2E6]',
    valueColor: 'text-[#E03131]',
  },
  warning: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-[#F2A93B]',
    border: 'border-[#DEE2E6]',
    valueColor: 'text-[#010102]',
  },
  primary: {
    iconBg: 'bg-[#835400]/10',
    iconColor: 'text-[#835400]',
    border: 'border-[#DEE2E6]',
    valueColor: 'text-[#835400]',
  },
  dark: {
    iconBg: 'bg-gray-800',
    iconColor: 'text-[#F2A93B]',
    border: 'border-gray-800',
    valueColor: 'text-white',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  trend,
  onClick,
  className = '',
}) => {
  const currentVariant = variantStyles[variant] || variantStyles.default;
  const isDark = variant === 'dark';

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl border p-5 transition-all
        ${isDark ? 'bg-[#010102] text-white' : 'bg-white text-[#010102]'}
        ${currentVariant.border}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-[#835400]/40' : 'shadow-xs'}
        min-w-0 overflow-hidden flex flex-col justify-between
        ${className}
      `.trim()}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className={`text-[11px] font-bold uppercase tracking-wider truncate ${
            isDark ? 'text-gray-400' : 'text-[#77767B]'
          }`}
        >
          {title}
        </span>
        {icon && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${currentVariant.iconBg}`}
          >
            <span className={`material-symbols-outlined text-[18px] ${currentVariant.iconColor}`}>
              {icon}
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p
          className={`text-xl sm:text-2xl font-extrabold tracking-tight truncate tabular-nums ${
            isDark ? 'text-white' : currentVariant.valueColor
          }`}
          title={String(value)}
        >
          {value}
        </p>

        {(subtitle || trend) && (
          <div className="mt-1 flex items-center gap-2 text-xs truncate">
            {trend && (
              <span
                className={`font-bold flex items-center gap-0.5 ${
                  trend.isPositive ? 'text-[#2F9E44]' : 'text-[#E03131]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {trend.isPositive ? 'trending_up' : 'trending_down'}
                </span>
                {trend.value}
              </span>
            )}
            {subtitle && (
              <span className={`truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
