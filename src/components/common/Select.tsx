import React, { SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: string;
  options?: SelectOption[];
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      options,
      children,
      fullWidth = true,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : 'w-auto'}`}>
        {label && (
          <label htmlFor={selectId} className="text-xs font-bold text-[#010102]">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="material-symbols-outlined absolute left-3 text-[18px] text-gray-400 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`
              w-full rounded-xl border text-xs text-[#010102] bg-white transition-all appearance-none
              focus:outline-none focus:ring-2 focus:ring-offset-0 cursor-pointer
              ${leftIcon ? 'pl-9' : 'pl-3.5'}
              pr-9 py-2.5
              ${
                error
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-[#DEE2E6] focus:border-[#835400] focus:ring-[#835400]/20'
              }
              ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
              ${className}
            `.trim()}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <span className="material-symbols-outlined absolute right-3 text-[18px] text-gray-400 pointer-events-none">
            unfold_more
          </span>
        </div>

        {error ? (
          <span className="text-[11px] font-bold text-red-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {error}
          </span>
        ) : helperText ? (
          <span className="text-[11px] text-gray-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
