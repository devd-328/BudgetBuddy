import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, CheckCircle2, ChevronRight, Download, Trash2, LogOut, Grid3x3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { Smartphone } from 'lucide-react'

import Card from '../components/ui/Card'
import ConfirmModal from '../components/ui/ConfirmModal'

const CURRENCIES = [
  { label: 'Rupee (Rs)', value: 'Rs' },
  { label: 'Dollar ($)', value: '$' },
  { label: 'Euro (€)', value: '€' },
  { label: 'Pound (£)', value: '£' },
  { label: 'Yen (¥)', value: '¥' },
  { label: 'Swiss Franc (CHF)', value: 'CHF' },
  { label: 'Dinar (د.ك)', value: 'د.ك' },
]

export default function Settings() {
  const { user, profile, setProfile, signOut } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || '')
  const [currency, setCurrency] = useState(profile?.currency || 'Rs')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [profileLoading, setProfileLoading] = useState(false)

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(profile?.avatar_url || '')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const [password, setPassword] = useState('')
  const [passLoading, setPassLoading] = useState(false)
  const [dbLoading, setDbLoading] = useState(false)
  const [showWipeConfirm, setShowWipeConfirm] = useState(false)
  const { canInstall, installApp } = usePWAInstall()

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) return toast.error('File size must be less than 2MB')
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
    }
  }

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e) => {
    e.preventDefault(); setIsDragging(false)
    const selectedFile = e.dataTransfer.files[0]
    if (selectedFile?.type.startsWith('image/')) {
      if (selectedFile.size > 2 * 1024 * 1024) return toast.error('File size must be less than 2MB')
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
    } else {
      toast.error('Please drop an image file')
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      let finalAvatarUrl = avatarUrl
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
        finalAvatarUrl = publicUrl
      }
      const { error } = await supabase.from('profiles').update({ name, currency, avatar_url: finalAvatarUrl }).eq('user_id', user.id)
      if (error) throw error
      setProfile(prev => ({ ...prev, name, currency, avatar_url: finalAvatarUrl }))
      setAvatarUrl(finalAvatarUrl)
      setFile(null)
      toast.success('Profile updated')
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
      toast.success('Password updated')
      setPassword('')
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setPassLoading(false)
    }
  }

  const handleExportCSV = async () => {
    setDbLoading(true)
    try {
      const { data, error } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false })
      if (error) throw error
      if (!data?.length) return toast('No transactions to export')
      const headers = ['Date', 'Type', 'Amount', 'Category', 'Description', 'Note']
      const rows = data.map(tx => [tx.date, tx.type, tx.amount, `"${tx.category}"`, `"${tx.description}"`, `"${tx.note || ''}"`])
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
      toast.success('Export downloaded!')
    } catch (err) {
      toast.error('Failed to export data')
    } finally {
      setDbLoading(false)
    }
  }

  const handleWipeData = async () => {
    setShowWipeConfirm(false)
    setDbLoading(true)
    try {
      await supabase.from('transactions').delete().eq('user_id', user.id)
      await supabase.from('debts').delete().eq('user_id', user.id)
      await supabase.from('budgets').delete().eq('user_id', user.id)
      await supabase.from('categories').delete().eq('user_id', user.id)
      await supabase.from('profiles').delete().eq('user_id', user.id)
      toast.success('Data wiped.')
      await signOut()
      navigate('/login')
    } catch (err) {
      toast.error('Failed during data wipe.')
    } finally {
      setDbLoading(false)
    }
  }

  const handleLogout = async () => {
    try { await signOut(); navigate('/login') } catch { toast.error('Error logging out') }
  }

  return (
    <div className="page-enter pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-interactive border border-border-subtle 
                     hover:bg-elevated hover:border-border transition-[background,border-color] duration-fast
                     text-txt-muted hover:text-txt-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="space-y-4 stagger-children">

        {/* Categories Link */}
        <Link to="/categories">
          <Card variant="interactive" padding="compact" className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-tint flex items-center justify-center">
                <Grid3x3 size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-txt-primary">Categories & Budgets</h2>
                <p className="text-2xs text-txt-muted">Manage spending limits</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-txt-muted" />
          </Card>
        </Link>

        {/* Profile Configuration */}
        <Card>
          <p className="section-title mb-4">Profile</p>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="overline mb-1.5 block">Display Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="overline mb-1.5 block">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input-field max-w-[200px] appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235A5A6E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                required
              >
                {CURRENCIES.map(curr => (
                  <option key={curr.value} value={curr.value} className="bg-card">{curr.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="overline mb-1.5 block">Profile Picture</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <div
                className={`file-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={previewUrl} alt="Preview" className="file-dropzone-preview" />
                    <p className="text-2xs text-txt-muted">Click or drag to change</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-txt-muted">
                    <div className="w-12 h-12 rounded-full bg-interactive flex items-center justify-center mb-1">
                      <Upload size={20} />
                    </div>
                    <p className="text-xs font-medium text-txt-secondary">Drop your image here</p>
                    <p className="text-2xs">or click to browse</p>
                  </div>
                )}
                {file && (
                  <div className="absolute top-2 right-2 text-income animate-fade-in">
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>
              <p className="text-2xs text-txt-muted mt-2 text-center">Max 2MB · JPG, PNG, WebP</p>
            </div>
            <button type="submit" className="btn-primary w-full h-11 flex items-center justify-center text-sm" disabled={profileLoading}>
              {profileLoading
                ? <div className="w-5 h-5 border-2 border-canvas/20 border-t-canvas rounded-full animate-spin" />
                : 'Update Profile'}
            </button>
          </form>
        </Card>

        {/* Security */}
        <Card>
          <p className="section-title mb-4">Security</p>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="overline mb-1.5 block">New Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-field" placeholder="Minimum 6 characters" required
              />
            </div>
            <button type="submit" className="btn-primary w-full h-11 flex items-center justify-center text-sm" disabled={passLoading}>
              {passLoading
                ? <div className="w-5 h-5 border-2 border-canvas/20 border-t-canvas rounded-full animate-spin" />
                : 'Change Password'}
            </button>
          </form>
        </Card>

        {/* Data Management */}
        <Card>
          <p className="section-title mb-4">Data</p>
          <div className="space-y-3">
            <button
              onClick={handleExportCSV} disabled={dbLoading}
              className="w-full flex items-center justify-between p-3 
                         bg-accent-tint border border-accent/20 rounded-xl 
                         hover:border-accent/40 active:scale-[0.98] transition-[border-color,transform] duration-fast"
            >
              <div>
                <h3 className="text-sm font-medium text-accent">Export as CSV</h3>
                <p className="text-2xs text-txt-muted mt-0.5">Download full transaction history</p>
              </div>
              <Download size={18} className="text-accent" />
            </button>

            <button
              onClick={() => setShowWipeConfirm(true)} disabled={dbLoading}
              className="w-full flex items-center justify-between p-3 
                         bg-expense-tint border border-expense/20 rounded-xl 
                         hover:border-expense/40 active:scale-[0.98] transition-[border-color,transform] duration-fast group"
            >
              <div>
                <h3 className="text-sm font-medium text-expense">Wipe Data & Logout</h3>
                <p className="text-2xs text-txt-muted group-hover:text-expense/60 transition-colors mt-0.5">
                  Permanently deletes all data
                </p>
              </div>
              <Trash2 size={18} className="text-expense" />
            </button>
          </div>
        </Card>

        {/* PWA Settings */}
        {canInstall && (
          <Card>
            <p className="section-title mb-4">Application</p>
            <button
              onClick={installApp}
              className="w-full flex items-center justify-between p-3 
                         bg-accent-tint border border-accent/20 rounded-xl 
                         hover:border-accent/40 active:scale-[0.98] transition-[border-color,transform] duration-fast"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-canvas shrink-0">
                  <Smartphone size={18} />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-medium text-accent">Install BudgetBuddy</h3>
                  <p className="text-2xs text-txt-muted mt-0.5">Add to home screen for quick access</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-accent" />
            </button>
          </Card>
        )}

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full btn-ghost flex items-center justify-center gap-2 h-11"
        >
          <LogOut size={16} />
          Sign Out
        </button>

        {/* Footer */}
        <div className="text-center pt-6 pb-4 opacity-20 pointer-events-none">
          <p className="text-2xs font-bold tracking-wide uppercase font-mono">BudgetBuddy</p>
          <p className="text-2xs mt-0.5">v2.0.0</p>
        </div>
      </div>

      {/* Wipe Data Confirmation Modal */}
      <ConfirmModal
        open={showWipeConfirm}
        variant="danger"
        title="Delete all your data?"
        message="This will permanently clear all transactions, categories, budgets, and IOUs. This action cannot be undone."
        confirmText="Wipe Everything"
        cancelText="Keep My Data"
        onConfirm={handleWipeData}
        onCancel={() => setShowWipeConfirm(false)}
      />
    </div>
  )
}
