import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, profile, setProfile, signOut } = useAuth()
  const navigate = useNavigate()

  // Profile Form States
  const [name, setName] = useState(profile?.name || '')
  const [currency, setCurrency] = useState(profile?.currency || '$')
  const [profileLoading, setProfileLoading] = useState(false)

  // Password States
  const [password, setPassword] = useState('')
  const [passLoading, setPassLoading] = useState(false)

  // General Loading
  const [dbLoading, setDbLoading] = useState(false)

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name, currency })
        .eq('user_id', user.id)

      if (error) throw error

      setProfile(prev => ({ ...prev, name, currency }))
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error('Failed to update profile')
      console.error(err)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (password.length < 6) return toast.error('Password must be at least 6 characters')

    setPassLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      
      toast.success('Password updated successfully')
      setPassword('')
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
      console.error(err)
    } finally {
      setPassLoading(false)
    }
  }

  const handleExportCSV = async () => {
    setDbLoading(true)
    try {
      // Fetch all transactions
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      if (!data || data.length === 0) return toast('No transactions to export', { icon: '📂' })

      // Convert to CSV
      const headers = ['Date', 'Type', 'Amount', 'Category', 'Description', 'Note']
      const rows = data.map(tx => [
         tx.date,
         tx.type,
         tx.amount,
         `"${tx.category}"`, // enclose in quotes in case of commas
         `"${tx.description}"`,
         `"${tx.note || ''}"`
      ])

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `BudgetBuddy_Export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Export downloaded successfully!')

    } catch (err) {
      toast.error('Failed to export data')
      console.error(err)
    } finally {
      setDbLoading(false)
    }
  }

  const handleWipeData = async () => {
    const confirmWipe = window.confirm(
       "Are you absolutely sure you want to delete all your data?\nThis will clear all transactions, categories, budgets, and IOUs instantly from the active tables. This cannot be undone."
    )
    if (!confirmWipe) return

    setDbLoading(true)
    try {
      // Due to RLS and cascading foreign keys, wiping profiles typically isn't enough cleanly.
      // We will explicitly delete all rows from standard tables.
      // Easiest securely on client side is sequential row wiping based on auth ID constraint.
      await supabase.from('transactions').delete().eq('user_id', user.id)
      await supabase.from('debts').delete().eq('user_id', user.id)
      await supabase.from('budgets').delete().eq('user_id', user.id)
      await supabase.from('categories').delete().eq('user_id', user.id)
      
      // Finally drop profile and forcefully trigger a sign out effectively 'closing' the account loop
      await supabase.from('profiles').delete().eq('user_id', user.id)
      
      toast.success('Data wiped successfully.')
      await signOut()
      navigate('/login')
    } catch (err) {
      toast.error('Failed during data wipe operation.')
      console.error(err)
    } finally {
      setDbLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      toast.error('Error logging out')
    }
  }

  return (
    <div className="page-enter pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
         
         {/* Categories Navigate */}
         <Link to="/categories" className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 active:scale-95 transition-transform">
            <div className="flex items-center gap-3">
               <span className="text-2xl">🏷️</span>
               <div>
                  <h2 className="text-sm font-semibold">Categories & Budgets</h2>
                  <p className="text-xs text-white/50">Manage spending limits</p>
               </div>
            </div>
            <span className="text-white/30">➔</span>
         </Link>

         <hr className="border-white/5" />

         {/* General Profile Configurations */}
         <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
            <h2 className="text-sm font-semibold mb-4">Profile Configuration</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
               <div>
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Display Name</label>
                  <input 
                     type="text"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     className="input-field"
                     required
                  />
               </div>
               <div>
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Currency Symbol</label>
                  <input 
                     type="text"
                     value={currency}
                     onChange={(e) => setCurrency(e.target.value)}
                     className="input-field max-w-[100px]"
                     required
                  />
               </div>
               <button type="submit" className="btn-primary w-full h-[40px] flex items-center justify-center text-sm" disabled={profileLoading}>
                  {profileLoading ? <span className="loader w-4 h-4 border-2 border-[#1a1a2e]/20 border-t-[#1a1a2e] rounded-full animate-spin"></span> : 'Update Profile'}
               </button>
            </form>
         </div>

         {/* Security & Password */}
         <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
            <h2 className="text-sm font-semibold mb-4">Security</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
               <div>
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1 block">New Password</label>
                  <input 
                     type="password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="input-field"
                     placeholder="Minimum 6 characters"
                     required
                  />
               </div>
               <button type="submit" className="btn-primary w-full h-[40px] flex items-center justify-center text-sm" disabled={passLoading}>
                  {passLoading ? <span className="loader w-4 h-4 border-2 border-[#1a1a2e]/20 border-t-[#1a1a2e] rounded-full animate-spin"></span> : 'Change Password'}
               </button>
            </form>
         </div>

         <hr className="border-white/5" />

         {/* Data Management */}
         <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
            <h2 className="text-sm font-semibold">Data Management</h2>
            
            <button 
               onClick={handleExportCSV}
               disabled={dbLoading}
               className="w-full flex items-center justify-between p-3 bg-accent/10 border border-accent/20 rounded-xl active:scale-95 transition-all text-left"
            >
               <div>
                  <h3 className="text-sm font-medium text-accent">Export as CSV</h3>
                  <p className="text-[10px] text-white/50 mt-0.5">Download full transaction history</p>
               </div>
               <span className="text-accent text-xl">⬇</span>
            </button>

            <button 
               onClick={handleWipeData}
               disabled={dbLoading}
               className="w-full flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-xl active:scale-95 transition-all text-left group"
            >
               <div>
                  <h3 className="text-sm font-medium text-red-500">Wipe Data & Logout</h3>
                  <p className="text-[10px] text-white/50 mt-0.5 group-hover:text-red-500/60 transition-colors">Permanently deletes all rows safely</p>
               </div>
               <span className="text-red-500 text-xl">⚠️</span>
            </button>
         </div>

         {/* Safe Signout */}
         <button 
            onClick={handleLogout}
            className="w-full font-bold text-white/50 hover:text-white p-3 border border-white/5 rounded-full active:scale-95 transition-all mt-4"
         >
            Sign Out
         </button>

         {/* Info Block */}
         <div className="text-center pt-8 pb-4 opacity-30 pointer-events-none">
            <div className="text-2xl mb-1 grayscale">💰</div>
            <p className="text-xs font-bold tracking-wider uppercase">BudgetBuddy</p>
            <p className="text-[10px]">App Version v1.0.0</p>
         </div>
      </div>
    </div>
  )
}
