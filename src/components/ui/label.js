import React from 'react';

export const Label = React.forwardRef(function Label({ className = '', ...props }, ref) {
  return (
    <label
      ref={ref}
      className={`mb-1 block text-sm font-medium text-[var(--access-text-secondary)] ${className}`}
      {...props}
    />
  );
});
