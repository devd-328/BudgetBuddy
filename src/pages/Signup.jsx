import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Signup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password) {
      return toast.error('Please fill in all fields')
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
        // Attempt to create a profile entry, Supabase trigger could also do this 
        // but we'll try ensuring it here if there's no trigger.
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            user_id: data.user.id,
            name: formData.name,
            currency: '$', 
          },
        ])
        
        if (profileError) {
          // Ignore unique violation if trigger already created it
          if (profileError.code !== '23505') {
            console.warn('Profile creation log:', profileError)
          }
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

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-accent rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/30">
            <span className="text-3xl">💰</span>
          </div>
          <h1 className="text-2xl font-bold">BudgetBuddy</h1>
          <p className="text-white/40 text-sm mt-1">Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold">Get started</h2>

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
            placeholder="Email" 
            className="input-field" 
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input 
            id="signup-password" 
            type="password" 
            placeholder="Password" 
            className="input-field" 
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <button id="signup-btn" type="submit" className="btn-primary w-full flex justify-center items-center h-[46px]" disabled={loading}>
            {loading ? <span className="loader shrink-0 inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-white/40 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
