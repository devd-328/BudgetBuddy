import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center gap-4 px-6">
      <span className="text-6xl">🔍</span>
      <h1 className="text-2xl font-bold">Page Not Found</h1>
      <p className="text-white/40 text-sm text-center">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn-primary mt-4">
        Go Home
      </Link>
    </div>
  )
}
