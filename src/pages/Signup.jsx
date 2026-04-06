import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CustomToast from '../components/ui/CustomToast'

const GoogleIcon = () => (
// ... (same as before)
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
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)

  // Password strength calculation
  const getStrength = (pw) => {
    const requirements = [
      { id: 'length', label: 'Min 8 characters', met: pw.length >= 8 },
      { id: 'upper',  label: 'Uppercase (ABC)',  met: /[A-Z]/.test(pw) },
      { id: 'lower',  label: 'Lowercase (abc)',  met: /[a-z]/.test(pw) },
      { id: 'number', label: 'Number (123)',     met: /[0-9]/.test(pw) },
      { id: 'symbol', label: 'Symbol (!@#)',     met: /[^A-Za-z0-9]/.test(pw) },
    ]
    const score = requirements.filter(r => r.met).length
    return { score, requirements }
  }

  const { score, requirements } = getStrength(formData.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      return CustomToast.error('Missing fields', 'Please fill in all fields to create your account.')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return CustomToast.error('Invalid email', 'Please enter a valid email address (e.g. name@gmail.com)')
    }
    if (/[^a-zA-Z\s]/.test(formData.name)) {
      return CustomToast.error('Invalid name', 'Only letters and spaces are allowed for your name.')
    }
    if (formData.password !== formData.confirmPassword) {
      return CustomToast.error('Passwords mismatch', 'The passwords you entered do not match.')
    }
    if (score < 4) {
      return CustomToast.error('Weak password', 'Please follow the strength requirements below.')
    }
    if (!formData.termsAccepted) {
      return CustomToast.error('Agreement required', 'You must agree to the Terms & Privacy to continue.')
    }

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
          { user_id: data.user.id, name: formData.name, currency: 'Rs' },
        ])
        if (profileError && profileError.code !== '23505') {
          console.warn('Profile creation log:', profileError)
        }
        
        // Persist email for VerifyEmail page
        localStorage.setItem('pending_verification_email', formData.email)
        
        CustomToast.success('Account created!', 'Please check your email for the verification link.')
        navigate('/verify-email', { state: { email: formData.email } })
      }
    } catch (error) {
      CustomToast.error('Signup failed', error.message)
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
// ... (rest of the component remains largely the same, just keeping the return block)
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 py-8 md:py-12">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-txt-muted hover:text-txt-primary mb-6 text-sm transition-colors duration-fast">
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
            <div className="space-y-1">
              <input
                id="signup-name" type="text" placeholder="Full Name"
                className={`input-field ${formData.name && /[^a-zA-Z\s]/.test(formData.name) ? 'border-expense ring-1 ring-expense/20' : ''}`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formData.name && /[^a-zA-Z\s]/.test(formData.name) && (
                <p className="text-[10px] text-expense font-medium pl-1 animate-fade-in">
                  Only letters and spaces are allowed for your name
                </p>
              )}
            </div>
            <div className="space-y-1">
              <input
                id="signup-email" type="email" placeholder="Email Address"
                className={`input-field ${formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'border-expense ring-1 ring-expense/20' : ''}`}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                <p className="text-[10px] text-expense font-medium pl-1 animate-fade-in">
                  Please enter a valid email address (e.g. name@gmail.com)
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input
                  id="signup-password" type={showPassword ? "text" : "password"}
                  placeholder="Password" className="input-field pr-10" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setIsPasswordFocused(true)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-primary transition-colors p-1">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Strength Analyzer */}
              {(isPasswordFocused || formData.password.length > 0) && (
                <div className="space-y-3 pt-1 animate-fade-in">
                  <div className="flex gap-1.5 h-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`flex-1 rounded-full transition-all duration-500 ${
                          score >= level
                            ? score <= 2 
                              ? 'bg-expense' 
                              : score <= 4 
                                ? 'bg-warning' 
                                : 'bg-income'
                            : 'bg-interactive'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {requirements.map((req) => (
                      <div key={req.id} className="flex items-center gap-2">
                        <div className={`w-1 h-1 rounded-full ${req.met ? 'bg-income shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-txt-muted/30'}`} />
                        <span className={`text-[10px] font-medium transition-colors duration-300 ${req.met ? 'text-txt-primary' : 'text-txt-muted'}`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
