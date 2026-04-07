import { useRef, useEffect, useState } from 'react'

/**
 * SegmentedControl — Animated tab toggle with sliding indicator.
 * Replaces all ad-hoc pill toggles across the app.
 * 
 * Props:
 *   options  — [{ value: string, label: string }]
 *   value    — current selected value
 *   onChange — callback(value)
 *   size     — 'sm' | 'md'
 */

export default function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md',
  className = '',
}) {
  const containerRef = useRef(null)
  const [indicatorStyle, setIndicatorStyle] = useState({})
  const activeIndex = options.findIndex(o => o.value === value)

  useEffect(() => {
    if (!containerRef.current || activeIndex < 0) return

    const container = containerRef.current
    const buttons = container.querySelectorAll('[data-segment-btn]')
    const activeBtn = buttons[activeIndex]

    if (activeBtn) {
      setIndicatorStyle({
        width: `${activeBtn.offsetWidth}px`,
        transform: `translateX(${activeBtn.offsetLeft}px)`,
      })
    }
  }, [activeIndex, options])

  const sizeClasses = size === 'sm'
    ? 'text-xs py-1'
    : 'text-xs py-1.5'

  return (
    <div
      ref={containerRef}
      className={`relative flex w-full bg-interactive rounded-xl p-1 ${className}`}
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-card border border-border-subtle shadow-sm transition-[transform,width] duration-normal ease-out-expo"
        style={indicatorStyle}
      />

      {options.map((option) => (
        <button
          key={option.value}
          data-segment-btn
          type="button"
          onClick={() => onChange(option.value)}
          className={`relative z-10 flex-1 ${sizeClasses} font-semibold rounded-lg transition-colors duration-fast truncate px-1 ${
            value === option.value
              ? 'text-txt-primary'
              : 'text-txt-muted hover:text-txt-secondary'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
