/**
 * EmptyState — shown when a list or section has no data
 * Props: icon (string emoji), title, message
 */
export default function EmptyState({ icon = '📭', title = 'Nothing here yet', message = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <span className="text-5xl">{icon}</span>
      <p className="text-white font-semibold text-base">{title}</p>
      {message && <p className="text-white/40 text-sm max-w-xs">{message}</p>}
    </div>
  )
}
