import { useEffect, useState, useRef } from 'react'

/**
 * ProgressBar — Adaptive color progress indicator.
 * 
 * Props:
 *   value      — current value
 *   max        — maximum value (default: 100)
 *   color      — 'adaptive' | 'accent' | 'income' | 'expense' | custom hex
 *   showLabel  — show percentage label
 *   height     — 'sm' (4px) | 'md' (6px) | 'lg' (8px)
 *   animate    — animate from 0 on mount
 *   delay      — animation delay in ms (for stagger)
 */

const heights = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
}

const colorMap = {
  accent:  { bar: 'bg-accent',  glow: '' },
  income:  { bar: 'bg-income',  glow: '' },
  expense: { bar: 'bg-expense', glow: '' },
}

function getAdaptiveColor(percent) {
  if (percent >= 80) return { bar: 'bg-expense', glow: 'shadow-glow-expense' }
  if (percent >= 60) return { bar: 'bg-warning', glow: '' }
  return { bar: 'bg-accent', glow: '' }
}

export default function ProgressBar({
  value = 0,
  max = 100,
  color = 'adaptive',
  showLabel = false,
  height = 'md',
  animate = true,
  delay = 0,
  className = '',
}) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const [width, setWidth] = useState(animate ? 0 : percent)
  const mounted = useRef(false)

  useEffect(() => {
    if (!animate) {
      setWidth(percent)
      return
    }

    const timer = setTimeout(() => {
      setWidth(percent)
      mounted.current = true
    }, mounted.current ? 0 : 100 + delay)

    return () => clearTimeout(timer)
  }, [percent, animate, delay])

  // Resolve color
  let colorStyle
  if (color === 'adaptive') {
    colorStyle = getAdaptiveColor(percent)
  } else if (colorMap[color]) {
    colorStyle = colorMap[color]
  } else {
    // Custom hex color
    colorStyle = { bar: '', glow: '' }
  }

  const customBg = !colorMap[color] && color !== 'adaptive' ? color : null

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-end mb-1">
          <span className="text-2xs font-mono text-txt-muted">
            {Math.round(percent)}%
          </span>
        </div>
      )}
      <div className={`w-full ${heights[height]} bg-interactive/60 rounded-full overflow-hidden`}>
        <div
          className={`${heights[height]} rounded-full transition-[width] duration-slower ease-out-expo ${colorStyle.bar} ${colorStyle.glow}`}
          style={{
            width: `${width}%`,
            ...(customBg ? { backgroundColor: customBg } : {}),
          }}
        />
      </div>
    </div>
  )
}
