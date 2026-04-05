import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * AmountDisplay — The signature fintech component.
 * Renders currency amounts in JetBrains Mono with tabular figures.
 * 
 * Props:
 *   value    — number to display
 *   currency — currency symbol (default: 'Rs')
 *   size     — 'sm' | 'md' | 'lg' | 'hero'
 *   trend    — 'up' | 'down' | 'neutral' | undefined
 *   animate  — if true, counts up from 0 on mount
 *   className — additional classes
 *   colored  — if true, applies income/expense color based on value sign
 */

const sizes = {
  sm:   { amount: 'text-sm font-bold',   currency: 'text-xs',  trend: 14 },
  md:   { amount: 'text-lg font-bold',   currency: 'text-sm',  trend: 16 },
  lg:   { amount: 'text-2xl font-bold',  currency: 'text-base', trend: 18 },
  hero: { amount: 'text-4xl font-black', currency: 'text-xl',  trend: 20 },
}

function formatNumber(num) {
  return Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function TrendIndicator({ direction, size }) {
  const shared = 'ml-1.5 inline-flex items-center'
  if (direction === 'up') {
    return <span className={`${shared} text-income`}><TrendingUp size={size} /></span>
  }
  if (direction === 'down') {
    return <span className={`${shared} text-expense`}><TrendingDown size={size} /></span>
  }
  return <span className={`${shared} text-txt-muted`}><Minus size={size} /></span>
}

export default function AmountDisplay({
  value = 0,
  currency = 'Rs',
  size = 'md',
  trend,
  animate = false,
  className = '',
  colored = false,
}) {
  const s = sizes[size]
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value)
  const frameRef = useRef(null)

  useEffect(() => {
    if (!animate) {
      setDisplayValue(value)
      return
    }

    const duration = 800
    const start = performance.now()
    const from = 0
    const to = value

    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out-expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setDisplayValue(from + (to - from) * eased)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, animate])

  const colorClass = colored
    ? value >= 0 ? 'text-income' : 'text-expense'
    : ''

  return (
    <span className={`font-mono tracking-tight inline-flex items-baseline ${className}`}>
      <span className={`${s.currency} font-medium text-txt-muted mr-1`}>
        {currency}
      </span>
      <span className={`${s.amount} ${colorClass}`}>
        {formatNumber(displayValue)}
      </span>
      {trend && <TrendIndicator direction={trend} size={s.trend} />}
    </span>
  )
}
