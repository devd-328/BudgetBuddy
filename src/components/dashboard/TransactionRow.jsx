import { Utensils, Bus, BookOpen, Heart, ShoppingBag, Gamepad2, Zap, HelpCircle } from 'lucide-react'

/**
 * TransactionRow — Individual transaction list item.
 * Lucide icons, font-mono amounts, stagger-ready.
 */

const CATEGORY_ICONS = {
  'Food':          Utensils,
  'Transport':     Bus,
  'Education':     BookOpen,
  'Health':        Heart,
  'Shopping':      ShoppingBag,
  'Entertainment': Gamepad2,
  'Bills':         Zap,
}

const CATEGORY_COLORS = {
  'Food':          '#34D399',
  'Transport':     '#60A5FA',
  'Education':     '#FB923C',
  'Health':        '#FB7185',
  'Shopping':      '#FBBF24',
  'Entertainment': '#A78BFA',
  'Bills':         '#2DD4BF',
}

export default function TransactionRow({ transaction, currency = 'Rs', style }) {
  const { type, amount, category, description, date, note } = transaction
  const Icon = CATEGORY_ICONS[category] || HelpCircle
  const color = CATEGORY_COLORS[category] || '#5A5A6E'
  const isIncome = type === 'income'

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      className="flex items-center gap-3 py-3 px-1 rounded-xl
                 hover:bg-interactive/40 transition-[background,transform] duration-fast ease-out-expo
                 cursor-default group"
      style={style}
    >
      {/* Category Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                   transition-transform duration-fast ease-out-back group-hover:scale-105"
        style={{ backgroundColor: `${color}12` }}
      >
        <Icon size={16} style={{ color }} strokeWidth={1.75} />
      </div>

      {/* Description + Meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-txt-primary truncate">
          {description}
        </p>
        <p className="text-2xs text-txt-muted mt-0.5">
          {formattedDate}
          {note && <span className="text-txt-muted"> · {note}</span>}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className={`font-mono text-sm font-bold tracking-tight
          ${isIncome ? 'text-income' : 'text-txt-primary'}`}>
          {isIncome ? '+' : '-'}{currency}{Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </p>
        <p className="text-2xs text-txt-muted mt-0.5 capitalize">{category}</p>
      </div>
    </div>
  )
}
