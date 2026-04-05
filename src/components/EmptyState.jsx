import { Plus } from 'lucide-react'

/**
 * EmptyState — Premium empty state with SVG illustrations and CTA.
 * 
 * Props:
 *   illustration — 'transactions' | 'budgets' | 'debts' | 'analytics' | 'default'
 *   title        — heading text
 *   message      — description text
 *   action       — { label, onClick, icon } for CTA button
 */

// Abstract SVG illustrations — unique shapes, not stock art
const illustrations = {
  transactions: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" fill="currentColor" opacity="0.03" />
      <circle cx="60" cy="60" r="35" fill="currentColor" opacity="0.05" />
      <rect x="35" y="40" width="50" height="8" rx="4" fill="currentColor" opacity="0.08" />
      <rect x="35" y="54" width="38" height="8" rx="4" fill="currentColor" opacity="0.06" />
      <rect x="35" y="68" width="44" height="8" rx="4" fill="currentColor" opacity="0.04" />
      <circle cx="28" cy="44" r="3" fill="currentColor" opacity="0.15" />
      <circle cx="28" cy="58" r="3" fill="currentColor" opacity="0.1" />
      <circle cx="28" cy="72" r="3" fill="currentColor" opacity="0.07" />
    </svg>
  ),
  budgets: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" fill="currentColor" opacity="0.03" />
      <circle cx="60" cy="60" r="40" stroke="currentColor" strokeWidth="6" opacity="0.06" strokeDasharray="12 8" />
      <circle cx="60" cy="60" r="28" stroke="currentColor" strokeWidth="4" opacity="0.1" strokeDasharray="8 6" />
      <circle cx="60" cy="60" r="6" fill="currentColor" opacity="0.12" />
    </svg>
  ),
  debts: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" fill="currentColor" opacity="0.03" />
      <circle cx="45" cy="55" r="14" stroke="currentColor" strokeWidth="3" opacity="0.08" />
      <circle cx="75" cy="55" r="14" stroke="currentColor" strokeWidth="3" opacity="0.08" />
      <path d="M59 55 L61 55" stroke="currentColor" strokeWidth="3" opacity="0.12" strokeLinecap="round" />
      <rect x="40" y="78" width="40" height="6" rx="3" fill="currentColor" opacity="0.06" />
    </svg>
  ),
  analytics: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" fill="currentColor" opacity="0.03" />
      <rect x="25" y="75" width="12" height="20" rx="3" fill="currentColor" opacity="0.06" transform="rotate(180 31 85)" />
      <rect x="42" y="55" width="12" height="40" rx="3" fill="currentColor" opacity="0.08" transform="rotate(180 48 75)" />
      <rect x="59" y="45" width="12" height="50" rx="3" fill="currentColor" opacity="0.1" transform="rotate(180 65 70)" />
      <rect x="76" y="60" width="12" height="35" rx="3" fill="currentColor" opacity="0.07" transform="rotate(180 82 77.5)" />
      <path d="M25 42 Q45 30 60 35 Q75 40 95 25" stroke="currentColor" strokeWidth="2" opacity="0.12" fill="none" strokeLinecap="round" />
    </svg>
  ),
  default: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" fill="currentColor" opacity="0.03" />
      <circle cx="60" cy="60" r="20" stroke="currentColor" strokeWidth="3" opacity="0.08" strokeDasharray="6 4" />
      <circle cx="60" cy="60" r="4" fill="currentColor" opacity="0.12" />
    </svg>
  ),
}

export default function EmptyState({
  illustration = 'default',
  title = 'Nothing here yet',
  message = '',
  action,
}) {
  const ActionIcon = action?.icon || Plus

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      {/* Illustration */}
      <div className="text-accent mb-6">
        {illustrations[illustration] || illustrations.default}
      </div>

      {/* Text */}
      <h3 className="text-base font-semibold text-txt-primary mb-2 tracking-tight">
        {title}
      </h3>
      {message && (
        <p className="text-sm text-txt-muted max-w-xs leading-relaxed">
          {message}
        </p>
      )}

      {/* CTA */}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 btn-primary inline-flex items-center gap-2 text-sm"
        >
          <ActionIcon size={16} />
          {action.label}
        </button>
      )}
    </div>
  )
}
