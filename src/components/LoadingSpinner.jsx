/**
 * LoadingSpinner — centered full-page or inline spinner
 * Props: fullPage (bool), size (sm|md|lg)
 */
export default function LoadingSpinner({ fullPage = false, size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-2',
  }

  const spinner = (
    <div
      className={`${sizes[size]} border-white/20 border-t-accent rounded-full animate-spin`}
    />
  )

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return spinner
}
