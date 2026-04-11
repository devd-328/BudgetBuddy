import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Settings, LogOut, Utensils, Bus, BookOpen, Heart, ShoppingBag, Gamepad2, Zap, HelpCircle, Plus, Sparkles, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { generateMonthlySummary } from '../lib/groq'
import { useDashboardData } from '../hooks/useDashboardData'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { supabase } from '../lib/supabase'
import CustomToast from '../components/ui/CustomToast'
import { Download, Laptop, Smartphone } from 'lucide-react'

import BalanceCard from '../components/dashboard/BalanceCard'
import WeeklyBars from '../components/dashboard/WeeklyBars'
import TransactionRow from '../components/dashboard/TransactionRow'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/ui/Skeleton'

const CATEGORY_ICONS = {
  Food: Utensils, Transport: Bus, Education: BookOpen, Health: Heart,
  Shopping: ShoppingBag, Entertainment: Gamepad2, Bills: Zap, Custom: Plus,
}
const CATEGORY_COLORS = {
  Food: '#34D399', Transport: '#60A5FA', Education: '#FB923C', Health: '#FB7185',
  Shopping: '#FBBF24', Entertainment: '#A78BFA', Bills: '#2DD4BF', Custom: '#5A5A6E',
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const { canInstall, installApp } = usePWAInstall()
  const [aiSummary, setAiSummary] = useState(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const handleGenerateAISummary = async () => {
    setIsGeneratingSummary(true)
    try {
      const summary = await generateMonthlySummary(data.recentTransactions)
      setAiSummary(summary)
    } catch (err) {
      console.error('Summary error:', err)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const { data, loading, error, refetch } = useDashboardData(user?.id)

  useEffect(() => {
    console.log('[DEBUG] Dashboard State:', { hasUser: !!user, hasProfile: !!profile, loading, error, hasData: !!data });
  }, [user, profile, loading, error, data]);

  const currency = profile?.currency || 'Rs'
  const displayName = profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'

  const handleEditTransaction = (transaction) => {
    navigate(`/add?edit=${transaction.id}`)
  }

  const handleDeleteTransaction = (transaction) => {
    CustomToast.confirm(
      'Delete transaction?',
      `This will remove "${transaction.description}" and recalculate your balance immediately.`,
      async () => {
        const { error: deleteError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', transaction.id)
          .eq('user_id', user.id)

        if (deleteError) {
          CustomToast.error('Delete failed', deleteError.message || 'Could not remove the transaction.')
          return
        }

        CustomToast.success('Transaction deleted', 'Your balance has been updated.')
        refetch()
      }
    )
  }

  // Determine greeting: "Welcome" for new users (created today), "Welcome back" for returning
  let greeting = 'Welcome'
  const createdAt = user?.created_at
  if (createdAt) {
    const accountCreated = new Date(createdAt)
    const now = new Date()
    const ageMs = now - accountCreated
    const oneDay = 24 * 60 * 60 * 1000
    if (ageMs >= oneDay) greeting = 'Welcome back'
  }

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="page-enter pb-24 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton variant="text" width="100px" />
            <Skeleton variant="text" width="160px" />
          </div>
          <Skeleton variant="circle" size={40} />
        </div>
        <Skeleton variant="rect" height={180} />
        <Skeleton variant="rect" height={180} />
        <Skeleton variant="transaction" count={4} />
      </div>
    )
  }

  // ─── Error State ───
  if (error) {
    return (
      <div className="page-enter pb-24">
        <EmptyState
          illustration="default"
          title="Something went wrong"
          message="We couldn't reach the server. Check your connection and try again."
          action={{ label: 'Retry', onClick: () => window.location.reload() }}
        />
      </div>
    )
  }

  const {
    totalIncome, totalExpense, totalBalance, totalLentOut,
    recentTransactions, weeklyData, categoriesSpends,
  } = data

  return (
    <div className="page-enter pb-24">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-txt-muted text-sm">{greeting}</p>
          <h1 className="text-xl font-bold text-txt-bright tracking-tight truncate pr-4">
            {displayName}
          </h1>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 shrink-0 rounded-full bg-interactive border border-border-subtle 
                       flex items-center justify-center text-accent text-xs font-bold uppercase 
                       transition-[transform,border-color] duration-fast ease-out-expo
                       hover:border-border hover:scale-105 active:scale-95 overflow-hidden"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName.substring(0, 2)
            )}
          </button>

          {/* Profile Dropdown */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-elevated border border-border-subtle 
                            rounded-2xl shadow-xl z-50 py-1.5 animate-scale-in origin-top-right">
              <div className="px-4 py-2 border-b border-border-subtle mb-1">
                <p className="text-2xs text-txt-muted font-medium">Logged in as</p>
                <p className="text-2xs text-txt-secondary truncate mt-0.5">{user?.email}</p>
              </div>

              <Link
                to="/settings"
                className="flex items-center gap-3 px-4 py-2 text-sm text-txt-secondary 
                           hover:text-txt-primary hover:bg-interactive transition-colors duration-fast"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings size={15} strokeWidth={1.75} />
                <span>Settings</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-expense 
                           hover:bg-expense-tint transition-colors duration-fast"
              >
                <LogOut size={15} strokeWidth={1.75} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Main Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6 stagger-children">

          {/* AI Insights Card */}
          <div className="bg-card border border-border-subtle rounded-3xl overflow-hidden relative group">
            <div className={`absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-50 transition-opacity duration-slow group-hover:opacity-70`} />
            
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-txt-bright tracking-tight">AI Financial Insights</h3>
                </div>
                {aiSummary && (
                  <button onClick={() => setAiSummary(null)} className="text-txt-muted hover:text-txt-primary transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>

              {!aiSummary ? (
                <div className="flex flex-col items-center py-2">
                  <p className="text-xs text-txt-muted text-center max-w-[280px] mb-4 leading-relaxed">
                    Get an intelligent analysis of your {new Date().toLocaleString('default', { month: 'long' })} spending patterns and personalized saving tips.
                  </p>
                  <button
                    onClick={handleGenerateAISummary}
                    disabled={isGeneratingSummary}
                    className="w-full h-12 rounded-2xl bg-interactive border border-border-subtle text-xs font-bold text-txt-primary flex items-center justify-center gap-2 
                               hover:bg-elevated hover:border-accent/30 transition-all duration-fast active:scale-[0.98] disabled:opacity-50"
                  >
                    {isGeneratingSummary ? (
                      <>
                        <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                        <span>Analyzing with Llama...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="text-accent" />
                        <span>Generate Monthly Report</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div className="bg-elevated/50 border border-border-subtle rounded-2xl p-4 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-li:my-1 prose-p:my-2 text-txt-secondary leading-relaxed text-sm">
                    {typeof aiSummary === 'string' ? (
                      aiSummary.split('\n').map((line, i) => (
                        <p key={i} className={line.trim().startsWith('-') || line.trim().startsWith('*') || /^\d+\./.test(line.trim()) ? 'pl-4 -indent-4' : ''}>
                          {line}
                        </p>
                      ))
                    ) : (
                      <p>Something went wrong with the summary format. Please try again.</p>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link to="/ai" className="text-2xs font-bold text-accent hover:underline flex items-center gap-1 mt-1">
                      Ask AI follow-up questions →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Balance Card */}
          <BalanceCard
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            totalLentOut={totalLentOut}
            currency={currency}
          />

          {/* Ready to Assign Highlight */}
          {data.readyToAssign > 0 && (
            <div className="bg-gradient-to-br from-income/20 to-accent/5 border border-income/30 rounded-2xl p-5 
                           flex items-center justify-between gap-4 animate-scale-in group hover:border-income/50 
                           transition-all duration-medium">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-income flex items-center justify-center text-canvas shrink-0 shadow-lg shadow-income/20">
                  <Plus size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-txt-bright group-hover:text-income transition-colors underline-offset-4 decoration-income/30 group-hover:underline">Ready to Assign</h3>
                  <p className="text-2xs text-txt-muted mt-0.5">You have unallocated income to plan for.</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-income font-mono tracking-tighter">
                  {currency}{data.readyToAssign.toLocaleString()}
                </p>
                <Link 
                  to="/categories" 
                  className="text-2xs font-bold text-accent hover:text-accent-hover transition-colors"
                >
                  Budget Now →
                </Link>
              </div>
            </div>
          )}

          {/* PWA Install Promo */}
          {canInstall && (
            <div className="bg-accent-tint border border-accent/20 rounded-2xl p-4 flex items-center justify-between gap-4 animate-scale-in">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-canvas shrink-0 shadow-lg shadow-accent/20">
                  <Smartphone size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-txt-bright">BudgetBuddy is now an App!</h3>
                  <p className="text-2xs text-txt-muted mt-0.5">Install for lightning-fast access and offline use.</p>
                </div>
              </div>
              <button 
                onClick={installApp}
                className="bg-accent text-canvas px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap
                           hover:bg-accent-hover transition-all active:scale-95 shadow-md shadow-accent/10"
              >
                Install Now
              </button>
            </div>
          )}

          {/* Top Categories */}
          {categoriesSpends.length > 0 && (
            <div>
              <p className="section-title mb-3">Top Expenses</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categoriesSpends.map((cat, i) => {
                  const Icon = CATEGORY_ICONS[cat.name] || HelpCircle
                  const color = CATEGORY_COLORS[cat.name] || '#5A5A6E'
                  return (
                    <div
                      key={i}
                      className="bg-card border border-border-subtle rounded-2xl p-3 
                                 flex items-center gap-3 hover:bg-elevated 
                                 transition-[background,border-color] duration-fast ease-out-expo"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}12` }}
                      >
                        <Icon size={16} style={{ color }} strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-2xs text-txt-muted truncate">{cat.name}</p>
                        <p className="font-mono text-sm font-bold text-txt-primary tracking-tight">
                          {currency}{cat.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Weekly Chart */}
          <WeeklyBars data={weeklyData} currency={currency} />
        </div>

        {/* Right Column — Recent Transactions */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <p className="section-title">Recent</p>
            {recentTransactions.length > 0 && (
              <Link
                to="/analytics"
                className="text-2xs font-medium text-accent hover:text-accent-hover transition-colors duration-fast"
              >
                See all →
              </Link>
            )}
          </div>

          {recentTransactions.length === 0 ? (
            <EmptyState
              illustration="transactions"
              title="Your story starts here"
              message="Add your first transaction to see your financial picture unfold."
              action={{
                label: 'Add Transaction',
                onClick: () => navigate('/add'),
                icon: Plus,
              }}
            />
          ) : (
            <div className="bg-card border border-border-subtle rounded-2xl divide-y divide-border-subtle overflow-hidden">
              <div className="px-3 stagger-children">
                {recentTransactions.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    currency={currency}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
