/**
 * Card — The foundational surface component.
 * 
 * Variants:
 *   default     — standard card with subtle border
 *   elevated    — slightly raised with shadow
 *   interactive — hover/active states for clickable cards
 *   highlight   — accent-bordered for featured content
 * 
 * Props:
 *   variant   — 'default' | 'elevated' | 'interactive' | 'highlight'
 *   padding   — 'none' | 'compact' | 'default' | 'spacious'
 *   glow      — 'none' | 'accent' | 'income' | 'expense'
 *   className — additional classes
 *   as        — render as a different element (default: 'div')
 */

const variants = {
  default:     'bg-card border border-border-subtle rounded-2xl',
  elevated:    'bg-elevated border border-border-subtle rounded-2xl shadow-md',
  interactive: 'bg-card border border-border-subtle rounded-2xl hover:bg-elevated hover:border-border cursor-pointer transition-[background,border-color,transform,box-shadow] duration-fast ease-out-expo active:scale-[0.98]',
  highlight:   'bg-card border border-accent/20 rounded-2xl shadow-glow-accent',
}

const paddings = {
  none:     '',
  compact:  'p-3 lg:p-4',
  default:  'p-4 lg:p-6',
  spacious: 'p-6 lg:p-8',
}

const glows = {
  none:    '',
  accent:  'shadow-glow-accent',
  income:  'shadow-glow-income',
  expense: 'shadow-glow-expense',
}

export default function Card({
  variant = 'default',
  padding = 'default',
  glow = 'none',
  className = '',
  as: Component = 'div',
  children,
  ...props
}) {
  return (
    <Component
      className={`${variants[variant]} ${paddings[padding]} ${glows[glow]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
