import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      return toast.error('Please fill in all fields')
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) throw error

      toast.success('Welcome back!')
      navigate('/')
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
            <span className="text-3xl">💰</span>
          </div>
          <h1 className="text-2xl font-bold">BudgetBuddy</h1>
          <p className="text-white/40 text-sm mt-1">Smart Finance Tracker</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold">Welcome back</h2>

          <input 
            id="login-email" 
            type="email" 
            placeholder="Email" 
            className="input-field" 
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input 
            id="login-password" 
            type="password" 
            placeholder="Password" 
            className="input-field" 
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <div className="flex justify-end">
             <Link to="/forgot-password" className="text-sm text-accent">Forgot Password?</Link>
          </div>

          <button id="login-btn" type="submit" className="btn-primary w-full flex justify-center items-center h-[46px]" disabled={loading}>
            {loading ? <span className="loader shrink-0 inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-white/40 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
