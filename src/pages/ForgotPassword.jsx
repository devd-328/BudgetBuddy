import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      return toast.error('Please enter your email')
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`, // We'll let them update password in settings
      })

      if (error) throw error

      toast.success('Password reset link sent!')
      setIsSent(true)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-accent rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/30">
            <span className="text-3xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-white/40 text-sm mt-1">We'll send you a recovery link</p>
        </div>

        {/* Form */}
        <div className="card border border-white/10 space-y-4">
          {isSent ? (
            <div className="text-center space-y-4">
              <p className="text-white/80">
                Check your email (<strong>{email}</strong>) for a link to reset your password.
              </p>
              <Link to="/login" className="btn-primary w-full inline-block">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                id="reset-email" 
                type="email" 
                placeholder="Email Address" 
                className="input-field" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button type="submit" className="btn-primary w-full flex justify-center items-center h-[46px]" disabled={loading}>
                {loading ? <span className="loader shrink-0 inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Send Link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-white/40 mt-6">
          Remebered your password?{' '}
          <Link to="/login" className="text-accent font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
