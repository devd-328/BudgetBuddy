import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase automatically picks up the recovery token from the URL hash
  // and establishes a session. We listen for that event.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    // Also check if there's already a session (user clicked the link and page loaded)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    if (password !== confirmPassword) return toast.error('Passwords do not match')

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      // Sign out so user can log in fresh with new password
      await supabase.auth.signOut()
      setSuccess(true)
      toast.success('Password updated successfully!')
    } catch (error) {
      toast.error(error.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  // Success state — show confirmation and redirect to login
  if (success) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm animate-fade-in text-center">
          <div className="w-16 h-16 rounded-2xl bg-income-tint border border-income/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={28} className="text-income" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-txt-bright mb-2">Password Updated!</h1>
          <p className="text-txt-secondary text-sm mb-8">
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
          <Link
            to="/login"
            className="btn-primary w-full h-12 flex items-center justify-center"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // Waiting for recovery session
  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm animate-fade-in text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={24} className="text-accent" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-txt-bright mb-2">Verifying your link...</h1>
          <p className="text-txt-muted text-sm mb-6">
            Please wait while we verify your reset token.
          </p>
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
          </div>
          <p className="text-txt-muted text-2xs mt-8">
            If this takes too long, your link may have expired.{' '}
            <Link to="/forgot-password" className="text-accent hover:text-accent-hover transition-colors">
              Request a new one
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // Main reset form
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={24} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-txt-bright">Set New Password</h1>
          <p className="text-txt-muted text-sm mt-1">Choose a strong password for your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border-subtle rounded-2xl p-5 space-y-4">
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
              className="input-field pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-primary transition-colors p-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <input
              id="confirm-new-password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm new password"
              className="input-field pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-primary transition-colors p-1"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password strength hints */}
          <div className="space-y-1.5 pt-1">
            <PasswordHint met={password.length >= 6} text="At least 6 characters" />
            <PasswordHint met={password === confirmPassword && password.length > 0} text="Passwords match" />
          </div>

          <button
            type="submit"
            className="btn-primary w-full h-12 flex items-center justify-center"
            disabled={loading || password.length < 6 || password !== confirmPassword}
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-canvas/20 border-t-canvas rounded-full animate-spin" />
              : 'Update Password'}
          </button>
        </form>

        <p className="text-center text-sm text-txt-muted mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-accent font-medium hover:text-accent-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

function PasswordHint({ met, text }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${met ? 'bg-income' : 'bg-txt-muted/30'}`} />
      <span className={`text-2xs transition-colors duration-300 ${met ? 'text-income' : 'text-txt-muted'}`}>
        {text}
      </span>
    </div>
  )
}
