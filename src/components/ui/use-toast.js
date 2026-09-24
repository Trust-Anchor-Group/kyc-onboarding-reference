'use client'
import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const show = useCallback(({ title, description, variant = 'default' }) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, title, description, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg px-4 py-3 shadow-lg transition-all text-sm text-white ${toast.variant === 'success'
                ? 'bg-green-600'
                : toast.variant === 'error'
                  ? 'bg-red-600'
                  : toast.variant === 'warning'
                    ? 'bg-yellow-600 text-black'
                    : 'bg-gray-800'
              }`}
          >
            <strong className="block font-semibold">{toast.title}</strong>
            {toast.description && <p className="mt-1">{toast.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
