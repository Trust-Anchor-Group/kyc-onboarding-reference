import React from 'react';

export const Input = React.forwardRef(function Input({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`h-12 w-full rounded-xl border border-[var(--access-border)] bg-[var(--access-input)] px-4 text-[var(--access-text)] placeholder:text-[var(--access-text-muted)] shadow-inner transition duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--access-focus)] focus:border-[var(--access-focus)] ${className}`}
      {...props}
    />
  );
});
