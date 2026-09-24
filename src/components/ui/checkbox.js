import React from 'react';

export function Checkbox({ id, checked, onCheckedChange, className = '' }) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={e => onCheckedChange(e.target.checked)}
      className={`h-5 w-5 rounded border border-[var(--access-border)] bg-transparent accent-[var(--access-accent)] transition focus:ring-2 focus:ring-[var(--access-focus)] ${className}`}
    />
  );
}
