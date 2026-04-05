import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-4 px-6">
      <div className="font-mono text-6xl font-black text-txt-muted/20">404</div>
      <h1 className="text-xl font-bold text-txt-bright tracking-tight">Page Not Found</h1>
      <p className="text-txt-muted text-sm text-center max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary mt-4 flex items-center gap-2">
        <ArrowLeft size={14} /> Go Home
      </Link>
    </div>
  )
}
