import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant =
  | 'primary'      // Asphalt Brown (#835400)
  | 'secondary'    // White with border (#DEE2E6) and gray text/hover
  | 'dark'         // Pure Asphalt Black (#010102)
  | 'success'      // Forest Green (#2F9E44)
  | 'danger'       // Crimson Red (#E03131)
  | 'warning'      // Amber Gold (#F2A93B)
  | 'ghost'        // Transparent with gentle hover
  | 'outline';     // Transparent with colored border

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant/color theme of the button
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Size scale of the button (padding, text size, icon scale)
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * Material Symbol icon name (e.g. 'add_circle', 'save', 'delete', 'print')
   */
  icon?: string;
  /**
   * Position of the icon relative to the label
   * @default 'left'
   */
  iconPosition?: 'left' | 'right';
  /**
   * Replaces icon/content with an animated spinner and disables clicking
   * @default false
   */
  isLoading?: boolean;
  /**
   * Text to display while loading
   */
  loadingText?: string;
  /**
   * Makes the button occupy 100% width of its parent container
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Optional custom background color override (Hex, RGB or Tailwind class)
   */
  customBgColor?: string;
  /**
   * Optional custom text color override
   */
  customTextColor?: string;
  /**
   * Children elements (text label, nodes)
   */
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#835400] hover:bg-[#6b4400] text-white shadow-xs focus:ring-[#835400]/40 border border-transparent',
  secondary:
    'bg-white hover:bg-gray-50 text-[#010102] border border-[#DEE2E6] shadow-xs focus:ring-gray-300',
  dark:
    'bg-[#010102] hover:bg-[#1a1a1a] text-white shadow-xs focus:ring-black/40 border border-transparent',
  success:
    'bg-[#2F9E44] hover:bg-[#288239] text-white shadow-xs focus:ring-[#2F9E44]/40 border border-transparent',
  danger:
    'bg-[#E03131] hover:bg-[#c92a2a] text-white shadow-xs focus:ring-[#E03131]/40 border border-transparent',
  warning:
    'bg-[#F2A93B] hover:bg-[#d99632] text-[#010102] shadow-xs focus:ring-[#F2A93B]/40 border border-transparent',
  ghost:
    'bg-transparent hover:bg-gray-100 text-gray-700 hover:text-black border border-transparent focus:ring-gray-200',
  outline:
    'bg-transparent hover:bg-[#835400]/5 text-[#835400] border border-[#835400] focus:ring-[#835400]/30',
};

const sizeStyles: Record<ButtonSize, { container: string; icon: string }> = {
  xs: {
    container: 'px-2.5 py-1.5 text-[11px] gap-1 rounded-lg',
    icon: 'text-[14px]',
  },
  sm: {
    container: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    icon: 'text-[16px]',
  },
  md: {
    container: 'px-4 py-2 text-xs gap-2 rounded-xl',
    icon: 'text-[18px]',
  },
  lg: {
    container: 'px-6 py-2.5 text-sm gap-2.5 rounded-xl font-bold',
    icon: 'text-[20px]',
  },
};

/**
 * Reusable Button Component for Asphalt Pro
 * Adheres to accessible HTML button patterns, responsive touch targets, and strict theme variants.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      isLoading = false,
      loadingText,
      fullWidth = false,
      customBgColor,
      customTextColor,
      className = '',
      disabled = false,
      type = 'button',
      children,
      style,
      ...props
    },
    ref
  ) => {
    const isActuallyDisabled = disabled || isLoading;
    const currentSize = sizeStyles[size] || sizeStyles.md;
    const baseVariant = variantStyles[variant] || variantStyles.primary;

    const customStyles: React.CSSProperties = {
      ...style,
      ...(customBgColor ? { backgroundColor: customBgColor } : {}),
      ...(customTextColor ? { color: customTextColor } : {}),
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isActuallyDisabled}
        style={customStyles}
        className={`
          inline-flex items-center justify-center font-bold tracking-tight select-none
          transition-all duration-150 active:scale-[0.98] outline-none focus:ring-2 focus:ring-offset-1
          ${currentSize.container}
          ${baseVariant}
          ${fullWidth ? 'w-full' : 'w-auto'}
          ${isActuallyDisabled ? 'opacity-55 cursor-not-allowed pointer-events-none active:scale-100' : 'cursor-pointer'}
          ${className}
        `.trim()}
        {...props}
      >
        {/* Loading Spinner */}
        {isLoading && (
          <span className="inline-block animate-spin mr-1.5 w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        )}

        {/* Left Icon (when not loading) */}
        {!isLoading && icon && iconPosition === 'left' && (
          <span className={`material-symbols-outlined shrink-0 ${currentSize.icon}`}>
            {icon}
          </span>
        )}

        {/* Content / Text */}
        {isLoading && loadingText ? (
          <span>{loadingText}</span>
        ) : (
          children && <span>{children}</span>
        )}

        {/* Right Icon (when not loading) */}
        {!isLoading && icon && iconPosition === 'right' && (
          <span className={`material-symbols-outlined shrink-0 ${currentSize.icon}`}>
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
