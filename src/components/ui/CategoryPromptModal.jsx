import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X } from 'lucide-react'

export default function CategoryPromptModal({
  open,
  title = 'Add Custom Category',
  message = 'Choose a name for your new category.',
  confirmText = 'Save Category',
  cancelText = 'Cancel',
  initialValue = '',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const inputRef = useRef(null)
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (!open) return

    setValue(initialValue)

    const handleKey = (event) => {
      if (event.key === 'Escape' && !loading) onCancel?.()
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 10)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [initialValue, loading, onCancel, open])

  if (!open) return null

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!loading) onConfirm?.(value)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center px-6"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel?.()
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-3xl border border-border-subtle bg-card p-6 shadow-xl animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-prompt-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
            <Plus size={22} />
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 w-10 rounded-xl bg-interactive/70 text-txt-muted transition-colors hover:text-txt-primary"
            aria-label="Close"
          >
            <X size={18} className="mx-auto" />
          </button>
        </div>

        <h3 id="category-prompt-title" className="mt-4 text-lg font-semibold text-txt-bright">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-txt-secondary">
          {message}
        </p>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Category name"
          className="input-field mt-5 h-12"
          maxLength={40}
          disabled={loading}
        />

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 flex-1 rounded-xl border border-border-subtle bg-interactive text-sm font-medium text-txt-secondary transition-colors hover:bg-elevated hover:text-txt-primary"
          >
            {cancelText}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary h-11 flex-1 text-sm"
          >
            {loading
              ? <div className="mx-auto h-5 w-5 rounded-full border-2 border-canvas/20 border-t-canvas animate-spin" />
              : confirmText}
          </button>
        </div>
      </form>
    </div>,
    document.body
  )
}
