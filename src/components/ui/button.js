import React from 'react';

export const Button = React.forwardRef(function Button({
  children,
  className = '',
  variant = 'default',
  ...props
}, ref) {
  let variantClass = '';
  if (variant === 'ghost') {
    variantClass = 'bg-transparent hover:bg-[var(--access-surface-subtle)] text-[var(--access-text)]';
  }
  if (variant === 'secondary') {
    variantClass = 'border border-[var(--access-border)] bg-[var(--access-surface-subtle)] text-[var(--access-text)] hover:bg-[var(--access-surface-strong)]';
  }
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--access-focus)] active:scale-[0.99] ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
