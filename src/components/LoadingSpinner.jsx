import Skeleton from './ui/Skeleton'

/**
 * LoadingSpinner — Redesigned with skeleton-based loading.
 * Keeps the same API as the original for backwards compatibility.
 * 
 * Props: 
 *   fullPage — centers in viewport
 *   size     — 'sm' | 'md' | 'lg' (for inline spinner fallback)
 *   variant  — 'spinner' | 'skeleton' (default: 'skeleton')
 */
export default function LoadingSpinner({ fullPage = false, size = 'md', variant = 'skeleton' }) {
  // Inline spinner (still useful for buttons)
  if (variant === 'spinner' || !fullPage) {
    const sizes = {
      sm: 'w-4 h-4 border-2',
      md: 'w-5 h-5 border-2',
      lg: 'w-8 h-8 border-2',
    }

    const spinner = (
      <div
        className={`${sizes[size]} border-border border-t-accent rounded-full animate-spin`}
      />
    )

    if (fullPage) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-canvas">
          <div className="flex flex-col items-center gap-4">
            {spinner}
            <p className="text-txt-muted text-sm">Loading...</p>
          </div>
        </div>
      )
    }

    return spinner
  }

  // Full page skeleton layout
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="w-full max-w-mobile mx-auto px-4 py-6 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton variant="text" width="120px" />
            <Skeleton variant="text" width="80px" />
          </div>
          <Skeleton variant="circle" size={40} />
        </div>

        {/* Balance card skeleton */}
        <Skeleton variant="rect" height={160} />

        {/* Chart skeleton */}
        <Skeleton variant="rect" height={140} />

        {/* Transaction skeletons */}
        <Skeleton variant="transaction" count={4} />
      </div>
    </div>
  )
}
