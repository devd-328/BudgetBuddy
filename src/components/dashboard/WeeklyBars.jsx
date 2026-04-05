import { useState } from 'react'

/**
 * WeeklyBars — Custom CSS bar chart (no Chart.js dependency).
 * Staggered entry animation, hover tooltips, accent glow on active day.
 */
export default function WeeklyBars({ data = [], currency = 'Rs' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const max = Math.max(...data.map(d => d.amount), 1) // Avoid divide-by-zero

  return (
    <div className="bg-card border border-border-subtle rounded-2xl p-4 lg:p-6">
      <p className="section-title mb-4">This Week</p>
      
      <div className="flex items-end gap-1.5 sm:gap-2 h-36 lg:h-44">
        {data.map((day, i) => {
          const height = max > 0 ? (day.amount / max) * 100 : 0
          const isHovered = hoveredIndex === i
          const isToday = i === data.length - 1

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-2 relative"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              {isHovered && day.amount > 0 && (
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-10 
                                bg-elevated border border-border-subtle rounded-lg 
                                px-2 py-1 shadow-lg whitespace-nowrap animate-fade-in
                                pointer-events-none">
                  <span className="font-mono text-2xs font-bold text-txt-primary">
                    {currency}{day.amount.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Bar */}
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-t-md relative overflow-hidden transition-[height] duration-slower ease-out-expo
                    ${isToday ? 'shadow-glow-accent' : ''}
                    ${isHovered ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                  style={{
                    height: `${Math.max(height, 4)}%`,
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  {/* Gradient fill */}
                  <div
                    className={`absolute inset-0 rounded-t-md transition-opacity duration-fast
                      ${isToday 
                        ? 'bg-gradient-to-t from-accent to-accent/60' 
                        : 'bg-gradient-to-t from-accent/40 to-accent/20'
                      }
                      ${isHovered ? 'from-accent to-accent/80' : ''}
                    `}
                  />
                </div>
              </div>

              {/* Label */}
              <span className={`text-2xs font-medium transition-colors duration-fast
                ${isToday ? 'text-accent' : 'text-txt-muted'}`}>
                {day.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Zero state */}
      {data.every(d => d.amount === 0) && (
        <p className="text-center text-txt-muted text-xs mt-4">
          No expenses recorded this week
        </p>
      )}
    </div>
  )
}
