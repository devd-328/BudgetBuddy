import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function Signup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', termsAccepted: false,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      return toast.error('Please fill in all fields')
    }
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match')
    if (!formData.termsAccepted) return toast.error('Please agree to the Terms & Privacy')

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { name: formData.name } },
      })
      if (error) throw error

      if (data?.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          { user_id: data.user.id, name: formData.name, currency: '$' },
        ])
        if (profileError && profileError.code !== '23505') {
          console.warn('Profile creation log:', profileError)
        }
        toast.success('Account created! Welcome to BudgetBuddy.')
        navigate('/')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (error) throw error
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-txt-muted hover:text-txt-primary mb-6 text-sm transition-colors duration-fast">
          <ArrowLeft size={14} /> Back
        </Link>

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-accent font-black text-xl font-mono">B</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-txt-bright">BudgetBuddy</h1>
          <p className="text-txt-muted text-sm mt-1">Take control of your finances</p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border-subtle rounded-2xl p-5 space-y-4">

          {/* Google OAuth — top */}
          <button
            type="button" onClick={handleGoogleLogin}
            className="w-full flex justify-center items-center gap-3 h-12 bg-white text-canvas font-semibold rounded-xl 
                       hover:bg-gray-100 transition-colors duration-fast shadow-sm"
          >
            <GoogleIcon />
            Sign up with Google
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="text-2xs text-txt-muted font-medium">OR</span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              id="signup-name" type="text" placeholder="Full Name"
              className="input-field" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              id="signup-email" type="email" placeholder="Email Address"
              className="input-field" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <div className="relative">
              <input
                id="signup-password" type={showPassword ? "text" : "password"}
                placeholder="Password" className="input-field pr-10" value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-primary transition-colors p-1">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <input
                id="signup-confirm-password" type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password" className="input-field pr-10" value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-primary transition-colors p-1">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-start gap-3 pt-1 pb-2">
              <input
                type="checkbox" id="terms"
                className="mt-1 w-4 h-4 rounded border-border bg-interactive text-accent focus:ring-accent/40 focus:ring-offset-0 shrink-0 cursor-pointer"
                checked={formData.termsAccepted}
                onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
              />
              <label htmlFor="terms" className="text-sm text-txt-secondary leading-relaxed cursor-pointer select-none">
                I agree to the <a href="#" className="text-accent font-medium hover:underline">Terms</a> & <a href="#" className="text-accent font-medium hover:underline">Privacy</a>
              </label>
            </div>

            <button id="signup-btn" type="submit" className="btn-primary w-full h-12 flex items-center justify-center" disabled={loading}>
              {loading
                ? <div className="w-5 h-5 border-2 border-canvas/20 border-t-canvas rounded-full animate-spin" />
                : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-txt-muted mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-medium hover:text-accent-hover transition-colors">Login</Link>
        </p>
      </div>
    </div>
  )
}
