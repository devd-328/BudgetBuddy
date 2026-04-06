import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CustomToast from '../components/ui/CustomToast'

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      return CustomToast.error('Missing credentials', 'Please enter your email and password.')
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email, password: formData.password,
      })
      if (error) throw error
      CustomToast.success('Welcome Back!', 'Redirecting you to your dashboard...')
      navigate('/')
    } catch (error) {
      if (error.message.includes('Email not confirmed')) {
        CustomToast.warning('Email not verified', 'Please check your inbox to verify your account.')
        localStorage.setItem('pending_verification_email', formData.email)
        navigate('/verify-email', { state: { email: formData.email } })
      } else {
        CustomToast.error('Login Failed', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (error) throw error
    } catch (error) {
      CustomToast.error('Google Auth Failed', error.message)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-txt-muted hover:text-txt-primary mb-8 text-sm transition-colors duration-fast">
          <ArrowLeft size={14} /> Back
        </Link>

        {/* Brand */}
        <div className="text-center mb-6 md:mb-8">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 border border-border-subtle overflow-hidden p-2.5">
            <img 
              src="/google_consent_logo.png" 
              alt="BudgetBuddy Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-txt-bright">BudgetBuddy</h1>
          <p className="text-txt-muted text-xs md:text-sm mt-1">Take control of your finances</p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border-subtle rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-txt-primary">Welcome back</h2>

          {/* Google OAuth — top */}
          <button
            type="button" onClick={handleGoogleLogin}
            className="w-full flex justify-center items-center gap-3 h-12 bg-white text-canvas font-semibold rounded-xl 
                       hover:bg-gray-100 transition-colors duration-fast shadow-sm"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="text-2xs text-txt-muted font-medium">OR</span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              id="login-email" type="email" placeholder="Email"
              className="input-field" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <div className="relative">
              <input
                id="login-password" 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Password"
                className="input-field pr-12" 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-txt-muted hover:text-txt-primary transition-colors duration-fast"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-accent hover:text-accent-hover transition-colors duration-fast">
                Forgot Password?
              </Link>
            </div>

            <button id="login-btn" type="submit" className="btn-primary w-full h-12 flex items-center justify-center" disabled={loading}>
              {loading
                ? <div className="w-5 h-5 border-2 border-canvas/20 border-t-canvas rounded-full animate-spin" />
                : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-txt-muted mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent font-medium hover:text-accent-hover transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
