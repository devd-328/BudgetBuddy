/**
 * Skeleton — Shimmer loading placeholder.
 * Replaces all spinner-based loading states with content-shaped placeholders.
 * 
 * Props:
 *   variant  — 'text' | 'circle' | 'rect' | 'card'
 *   width    — CSS width (string or number)
 *   height   — CSS height (string or number)
 *   size     — diameter for circle variant
 *   lines    — number of text lines to render
 *   className — additional classes
 */

function SkeletonBase({ className = '', style = {} }) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-interactive via-card to-interactive bg-[length:200%_100%] animate-shimmer ${className}`}
      style={style}
    />
  )
}

function SkeletonText({ width = '100%', lines = 1 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase
          key={i}
          className="h-3"
          style={{
            width: i === lines - 1 && lines > 1 ? '60%' : width,
          }}
        />
      ))}
    </div>
  )
}

function SkeletonCircle({ size = 40 }) {
  return (
    <SkeletonBase
      className="rounded-full shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

function SkeletonRect({ width = '100%', height = 120 }) {
  return (
    <SkeletonBase
      className="rounded-2xl"
      style={{ width, height }}
    />
  )
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border-subtle rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonCircle size={36} />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-3 w-3/4" />
          <SkeletonBase className="h-2.5 w-1/2" />
        </div>
        <SkeletonBase className="h-5 w-16" />
      </div>
      <SkeletonBase className="h-1.5 w-full rounded-full" />
    </div>
  )
}

function SkeletonTransaction() {
  return (
    <div className="flex items-center gap-3 py-3">
      <SkeletonCircle size={36} />
      <div className="flex-1 space-y-1.5">
        <SkeletonBase className="h-3 w-2/3" />
        <SkeletonBase className="h-2.5 w-1/3" />
      </div>
      <SkeletonBase className="h-4 w-14" />
    </div>
  )
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  size,
  lines,
  count = 1,
  className = '',
}) {
  const Component = {
    text: () => <SkeletonText width={width} lines={lines || 1} />,
    circle: () => <SkeletonCircle size={size || 40} />,
    rect: () => <SkeletonRect width={width} height={height || 120} />,
    card: () => <SkeletonCard />,
    transaction: () => <SkeletonTransaction />,
  }[variant] || (() => <SkeletonBase className="h-4 w-full" />)

  if (count > 1) {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <Component key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      <Component />
    </div>
  )
}
