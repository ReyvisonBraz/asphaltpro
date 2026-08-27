import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconClick,
      fullWidth = true,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : 'w-auto'}`}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-bold text-[#010102] flex items-center justify-between">
            <span>{label}</span>
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="material-symbols-outlined absolute left-3 text-[18px] text-gray-400 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`
              w-full rounded-xl border text-xs text-[#010102] bg-white transition-all
              placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0
              ${leftIcon ? 'pl-9' : 'pl-3.5'}
              ${rightIcon ? 'pr-9' : 'pr-3.5'}
              py-2.5
              ${
                error
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-[#DEE2E6] focus:border-[#835400] focus:ring-[#835400]/20'
              }
              ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
              ${className}
            `.trim()}
            {...props}
          />

          {rightIcon && (
            <button
              type="button"
              tabIndex={-1}
              onClick={onRightIconClick}
              className={`absolute right-3 text-[18px] text-gray-400 ${
                onRightIconClick ? 'hover:text-black cursor-pointer' : 'pointer-events-none'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{rightIcon}</span>
            </button>
          )}
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

Input.displayName = 'Input';
