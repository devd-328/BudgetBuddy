import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, Globe, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CustomToast from '../components/ui/CustomToast'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [isSupabaseOnline, setIsSupabaseOnline] = useState(true)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // 1. Handle email persistence (Location state -> LocalStorage fallback)
  useEffect(() => {
    const savedEmail = localStorage.getItem('pending_verification_email')
    if (location.state?.email) {
      setEmail(location.state.email)
      localStorage.setItem('pending_verification_email', location.state.email)
    } else if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [location.state])

  // 2. Supabase Health Check
  useEffect(() => {
    async function checkHealth() {
      try {
        setCheckingStatus(true)
        // Ping settings or a simple public table to verify connectivity
        const { error } = await supabase.from('profiles').select('id').limit(1)
        
        // If error is 'fetch' related, it's a connection issue
        if (error && error.message?.includes('fetch')) {
          setIsSupabaseOnline(false)
        } else {
          setIsSupabaseOnline(true)
        }
      } catch (err) {
        setIsSupabaseOnline(false)
      } finally {
        setCheckingStatus(false)
      }
    }
    checkHealth()
  }, [])

  // 3. Countdown for resend button cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleResend = async () => {
    if (cooldown > 0) return
    if (!email) {
      return CustomToast.error('Email not found', 'Please try signing up again.')
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })
      
      if (error) {
        // Handle rate limits specifically
        if (error.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a minute before trying again.')
        }
        throw error
      }
      
      CustomToast.success('Email Resent!', `A new verification link has been sent to ${email}`)
      setCooldown(60) // 1 minute cooldown
    } catch (error) {
      console.error('Resend error:', error)
      const isFetchError = error.message?.includes('fetch')
      CustomToast.error(
        isFetchError ? 'Connection Error' : 'Resend Failed',
        isFetchError ? 'Unable to reach the server. Please check your internet.' : error.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm animate-fade-in text-center">
        
        {/* Status Badge */}
        {!checkingStatus && (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-8 border ${
            isSupabaseOnline 
              ? 'bg-income/10 text-income border-income/20' 
              : 'bg-expense/10 text-expense border-expense/20 animate-pulse'
          }`}>
            {isSupabaseOnline ? <Globe size={10} /> : <AlertTriangle size={10} />}
            {isSupabaseOnline ? 'Server Online' : 'Server Unreachable'}
          </div>
        )}

        {/* Illustration */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-accent/20 rounded-3xl blur-2xl animate-pulse" />
          <div className="relative w-full h-full bg-card border border-border-subtle rounded-3xl flex items-center justify-center shadow-xl">
            <Mail size={40} className="text-accent" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-income text-canvas w-8 h-8 rounded-full flex items-center justify-center border-4 border-canvas shadow-lg">
            <CheckCircle2 size={16} strokeWidth={3} />
          </div>
        </div>

        {/* Text */}
        <h1 className="text-2xl font-bold text-txt-bright tracking-tight mb-3">Check your inbox</h1>
        <p className="text-txt-secondary text-sm leading-relaxed mb-8">
          We've sent a verification link to <br />
          <span className="text-txt-primary font-semibold">{email || 'your email address'}</span>. 
          Please click it to activate your account.
        </p>

        {/* Action Card */}
        <div className="bg-card border border-border-subtle rounded-2xl p-6 space-y-6">
          <div className="text-left space-y-3">
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-accent text-xs font-bold font-mono">1</span>
              </div>
              <p className="text-xs text-txt-muted">Check your spam folder if you don't see it in 1 minute.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-accent text-xs font-bold font-mono">2</span>
              </div>
              <p className="text-xs text-txt-muted">Click the link in the email to unlock your dashboard.</p>
            </div>
          </div>

          <button
            onClick={handleResend}
            disabled={loading || cooldown > 0 || !isSupabaseOnline}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-border-subtle bg-interactive
                       hover:bg-elevated hover:border-border transition-all duration-fast text-sm font-semibold
                       disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} className={cooldown > 0 ? "" : "group-hover:rotate-180 transition-transform duration-500"} />
            )}
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
          </button>
          
          {!isSupabaseOnline && !checkingStatus && (
            <p className="text-[10px] text-expense font-medium animate-bounce">
              Servers are currently unreachable. Please check your connection.
            </p>
          )}
        </div>

        {/* Back Link */}
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-txt-muted hover:text-txt-primary mt-8 text-sm transition-colors duration-fast"
        >
          <ArrowLeft size={14} /> Back to Login
        </Link>
      </div>
    </div>
  )
}
