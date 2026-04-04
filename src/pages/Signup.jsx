import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Signup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      return toast.error('Please fill in all fields')
    }
    
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match')
    }
    
    if (!formData.termsAccepted) {
      return toast.error('Please agree to the Terms & Privacy')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      })

      if (error) throw error

      if (data?.user) {
        // Attempt to create a profile entry
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            user_id: data.user.id,
            name: formData.name,
            currency: '$', 
          },
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })
      if (error) throw error
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to home
        </Link>
        
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/30">
            <span className="text-3xl">💰</span>
          </div>
          <h1 className="text-2xl font-bold">BudgetBuddy</h1>
          <p className="text-white/40 text-sm mt-1">Take control of your money 💰</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="card border border-white/10 space-y-4">
          <input 
            id="signup-name" 
            type="text" 
            placeholder="Full Name" 
            className="input-field" 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input 
            id="signup-email" 
            type="email" 
            placeholder="Email Address" 
            className="input-field" 
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          
          <div className="relative">
            <input 
              id="signup-password" 
              type={showPassword ? "text" : "password"}
              placeholder="Password" 
              className="input-field pr-10" 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1" aria-label="Toggle password visibility">
              {showPassword ? (
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              )}
            </button>
          </div>

          <div className="relative">
            <input 
              id="signup-confirm-password" 
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password" 
              className="input-field pr-10" 
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1" aria-label="Toggle password visibility">
              {showConfirmPassword ? (
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              )}
            </button>
          </div>

          <div className="flex items-start gap-3 pt-1 pb-2">
            <input 
              type="checkbox" 
              id="terms" 
              className="mt-1.5 w-4 h-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent/40 focus:ring-offset-0 flex-shrink-0 cursor-pointer"
              checked={formData.termsAccepted}
              onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
            />
            <label htmlFor="terms" className="text-sm text-white/60 leading-relaxed cursor-pointer select-none">
              I agree to the <a href="#" className="text-accent font-medium hover:underline">Terms</a> & <a href="#" className="text-accent font-medium hover:underline">Privacy</a>
            </label>
          </div>

          <button id="signup-btn" type="submit" className="btn-primary w-full flex justify-center items-center h-[46px]" disabled={loading}>
            {loading ? <span className="loader shrink-0 inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Create Account'}
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-xs text-white/30 font-medium">OR</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin} 
            className="w-full flex justify-center items-center gap-3 h-[46px] bg-white text-navy font-semibold rounded-2xl hover:bg-gray-100 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
               <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
               <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
               <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
               <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="text-center text-sm text-white/40 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
