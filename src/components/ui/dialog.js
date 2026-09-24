import React from 'react';

export function Dialog({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      {children}
    </div>
  );
}

export function DialogContent({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-xl p-6 relative w-full ${className}`}
      style={{ maxWidth: 400 }}
      {...props}
    >
      {children}
    </div>
  );
}
