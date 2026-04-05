import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Settings, LogOut, Utensils, Bus, BookOpen, Heart, ShoppingBag, Gamepad2, Zap, HelpCircle, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDashboardData } from '../hooks/useDashboardData'

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

  const { data, loading, error } = useDashboardData(user?.id)

  const currency = profile?.currency || 'Rs'
  const displayName = profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'

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

          {/* Balance Card */}
          <BalanceCard
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            totalLentOut={totalLentOut}
            currency={currency}
          />

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
