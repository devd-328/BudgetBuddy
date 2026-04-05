import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email')

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      toast.success('Reset link sent!')
      setIsSent(true)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <KeyRound size={24} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-txt-bright">Reset Password</h1>
          <p className="text-txt-muted text-sm mt-1">We'll send you a recovery link</p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border-subtle rounded-2xl p-5 space-y-4">
          {isSent ? (
            <div className="text-center space-y-4">
              <p className="text-txt-secondary text-sm">
                Check your email (<strong className="text-txt-primary">{email}</strong>) for a link to reset your password.
              </p>
              <Link to="/login" className="btn-primary w-full text-center h-12 flex items-center justify-center">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                id="reset-email" type="email" placeholder="Email Address"
                className="input-field" value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="btn-primary w-full h-12 flex items-center justify-center" disabled={loading}>
                {loading
                  ? <div className="w-5 h-5 border-2 border-canvas/20 border-t-canvas rounded-full animate-spin" />
                  : 'Send Link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-txt-muted mt-6">
          Remembered your password?{' '}
          <Link to="/login" className="text-accent font-medium hover:text-accent-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
