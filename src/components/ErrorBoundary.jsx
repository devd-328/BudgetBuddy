import React from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorType: null }
  }

  static getDerivedStateFromError(error) {
    // Check if it's a chunk load error (common in PWAs when offline)
    const isChunkError = error.name === 'ChunkLoadError' || 
                         error.message.includes('Failed to fetch dynamically imported module')
    
    return { 
      hasError: true, 
      errorType: isChunkError ? 'offline' : 'crash' 
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-16 h-16 bg-expense/10 rounded-full flex items-center justify-center mb-4 text-expense">
            <AlertCircle size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-txt-bright mb-2">
            {this.state.errorType === 'offline' ? "You're Offline" : "Something went wrong"}
          </h2>
          
          <p className="text-txt-muted text-sm max-w-xs mb-6">
            {this.state.errorType === 'offline' 
              ? "This page hasn't been cached yet. Please connect to the internet to load it for the first time."
              : "An unexpected error occurred. We've been notified and are looking into it."}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl"
          >
            <RefreshCcw size={18} />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
