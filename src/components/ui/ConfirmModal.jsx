import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

/**
 * Premium confirmation modal — replaces window.confirm()
 * Renders via Portal to document.body so it's never clipped by parent containers.
 */
export default function ConfirmModal({
  open,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    document.addEventListener('keydown', handleKey)
    confirmRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onCancel])

  if (!open) return null

  const colors = {
    danger:  { icon: 'text-expense',  bg: 'bg-expense-tint', border: 'border-expense/20', btn: 'bg-expense hover:bg-expense-hover' },
    warning: { icon: 'text-warning',  bg: 'bg-warning/10',   border: 'border-warning/20', btn: 'bg-warning hover:bg-yellow-500 text-canvas' },
    default: { icon: 'text-accent',   bg: 'bg-accent-tint',  border: 'border-accent/20',  btn: 'bg-accent hover:bg-accent-hover' },
  }
  const c = colors[variant] || colors.default

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm bg-card border border-border-subtle rounded-2xl p-6 
                   shadow-xl animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center mb-4`}>
          <AlertTriangle size={22} className={c.icon} />
        </div>

        {/* Content */}
        <h3 id="confirm-title" className="text-base font-semibold text-txt-bright mb-2">
          {title}
        </h3>
        <p className="text-sm text-txt-secondary leading-relaxed mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl text-sm font-medium
                       bg-interactive border border-border-subtle text-txt-secondary
                       hover:bg-elevated hover:text-txt-primary hover:border-border
                       transition-[background,color,border-color] duration-fast
                       active:scale-[0.98]"
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold text-white
                       ${c.btn} transition-[background,transform] duration-fast
                       active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-offset-card focus:ring-expense/50`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
