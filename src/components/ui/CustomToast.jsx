import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle, XCircle, Info } from 'lucide-react';

const CustomToast = {
  success: (message, description = '') => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-elevated border border-income/30 shadow-lg rounded-2xl pointer-events-auto flex items-center p-4 gap-4 glass-morphism`}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-income/10 flex items-center justify-center text-income">
          <CheckCircle2 size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-txt-bright leading-tight">
            {message}
          </p>
          {description && (
            <p className="mt-1 text-xs text-txt-muted line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 rounded-lg p-1 text-txt-muted hover:text-txt-primary hover:bg-interactive transition-colors"
        >
          <XCircle size={18} />
        </button>
      </div>
    ), { duration: 4000 });
  },

  error: (message, description = '') => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-elevated border border-expense/30 shadow-lg rounded-2xl pointer-events-auto flex items-center p-4 gap-4 glass-morphism`}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-expense/10 flex items-center justify-center text-expense">
          <AlertCircle size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-txt-bright leading-tight">
            {message}
          </p>
          {description && (
            <p className="mt-1 text-xs text-txt-muted line-clamp-2">
              {description || 'Something went wrong. Please try again.'}
            </p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 rounded-lg p-1 text-txt-muted hover:text-txt-primary hover:bg-interactive transition-colors"
        >
          <XCircle size={18} />
        </button>
      </div>
    ), { duration: 5000 });
  },

  warning: (message, description = '') => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-elevated border border-warning/30 shadow-lg rounded-2xl pointer-events-auto flex items-center p-4 gap-4 glass-morphism`}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
          <AlertCircle size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-txt-bright leading-tight">
            {message}
          </p>
          {description && (
            <p className="mt-1 text-xs text-txt-muted line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 rounded-lg p-1 text-txt-muted hover:text-txt-primary hover:bg-interactive transition-colors"
        >
          <XCircle size={18} />
        </button>
      </div>
    ), { duration: 4000 });
  },

  info: (message, description = '') => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-elevated border border-accent/30 shadow-lg rounded-2xl pointer-events-auto flex items-center p-4 gap-4 glass-morphism`}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
          <Info size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-txt-bright leading-tight">
            {message}
          </p>
          {description && (
            <p className="mt-1 text-xs text-txt-muted line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 rounded-lg p-1 text-txt-muted hover:text-txt-primary hover:bg-interactive transition-colors"
        >
          <XCircle size={18} />
        </button>
      </div>
    ), { duration: 4000 });
  },

  // Standard toast for progress/loading
  loading: (message) => toast.loading(message, {
    style: {
      background: '#252545',
      color: '#fff',
      borderRadius: '1rem',
      border: '1px solid rgba(255,255,255,0.1)',
    },
  }),

  confirm: (message, description = '', onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel') => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-elevated border border-warning/40 shadow-2xl rounded-2xl pointer-events-auto p-5 glass-morphism`}
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
            <AlertCircle size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-txt-bright leading-tight">
              {message}
            </p>
            {description && (
              <p className="mt-1 text-xs text-txt-muted">
                {description}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  onConfirm?.();
                  toast.dismiss(t.id);
                }}
                className="btn-primary py-1.5 px-4 text-xs h-auto bg-expense hover:bg-expense-hover border-none shadow-none"
              >
                {confirmText}
              </button>
              <button
                onClick={() => {
                  onCancel?.();
                  toast.dismiss(t.id);
                }}
                className="btn-secondary py-1.5 px-4 text-xs h-auto border-border-subtle"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    ), { duration: Infinity });
  }
};

export default CustomToast;
