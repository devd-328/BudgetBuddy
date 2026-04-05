import AmountDisplay from '../ui/AmountDisplay'
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'

/**
 * BalanceCard — Hero balance display with income/expense breakdown.
 * Mercury-inspired: large mono number, subtle trend indicator, clean breakdown.
 */
export default function BalanceCard({ 
  totalBalance = 0, 
  totalIncome = 0, 
  totalExpense = 0, 
  totalLentOut = 0, 
  currency = 'Rs' 
}) {
  const trend = totalBalance >= 0 ? 'up' : 'down'

  return (
    <div className="relative overflow-hidden bg-card border border-border-subtle rounded-2xl p-5 lg:p-6">
      {/* Subtle gradient accent — top edge only */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* Balance */}
      <div className="mb-5">
        <p className="overline mb-2">Monthly Balance</p>
        <AmountDisplay
          value={totalBalance}
          currency={currency}
          size="hero"
          animate
          colored
        />
      </div>

      {/* Breakdown — horizontal bar style */}
      <div className="grid grid-cols-3 gap-3">
        {/* Income */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-income-tint flex items-center justify-center">
              <TrendingUp size={12} className="text-income" />
            </div>
            <span className="text-2xs font-medium text-txt-muted">Income</span>
          </div>
          <p className="font-mono text-sm font-bold text-txt-primary tracking-tight">
            {currency}{totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Expense */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-expense-tint flex items-center justify-center">
              <TrendingDown size={12} className="text-expense" />
            </div>
            <span className="text-2xs font-medium text-txt-muted">Expense</span>
          </div>
          <p className="font-mono text-sm font-bold text-txt-primary tracking-tight">
            {currency}{totalExpense.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Lent Out */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-accent-tint flex items-center justify-center">
              <ArrowUpRight size={12} className="text-accent" />
            </div>
            <span className="text-2xs font-medium text-txt-muted">Lent</span>
          </div>
          <p className="font-mono text-sm font-bold text-txt-primary tracking-tight">
            {currency}{totalLentOut.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  )
}
