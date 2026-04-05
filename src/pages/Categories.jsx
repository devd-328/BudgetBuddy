import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Target, Utensils, Bus, BookOpen, Heart, ShoppingBag, Gamepad2, Zap, HelpCircle, Coffee, Plane, Dog, Shirt, Gift, Check, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCategoriesAndBudgets } from '../hooks/useCategoriesAndBudgets'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/EmptyState'

const ICON_OPTIONS = [
  { name: 'Utensils', component: Utensils },
  { name: 'Bus', component: Bus },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Heart', component: Heart },
  { name: 'ShoppingBag', component: ShoppingBag },
  { name: 'Gamepad2', component: Gamepad2 },
  { name: 'Zap', component: Zap },
  { name: 'Coffee', component: Coffee },
  { name: 'Plane', component: Plane },
  { name: 'Dog', component: Dog },
  { name: 'Shirt', component: Shirt },
  { name: 'Gift', component: Gift },
  { name: 'Plus', component: Plus },
  { name: 'HelpCircle', component: HelpCircle },
]

const COLORS = ['#34D399', '#60A5FA', '#FB923C', '#FB7185', '#FBBF24', '#A78BFA', '#2DD4BF', '#8A8A9E', '#F472B6', '#6366F1', '#EC4899']

// Map old emoji icons to Lucide
const EMOJI_TO_LUCIDE = {
  '🍔': Utensils, '🚌': Bus, '📚': BookOpen, '💊': Heart,
  '🛍': ShoppingBag, '🎮': Gamepad2, '💡': Zap, '➕': Plus,
  '🏠': Coffee, '✈️': Plane, '🐶': Dog, '👗': Shirt, '🎁': Gift, '☕': Coffee,
}

function getCategoryIcon(iconStr) {
  return EMOJI_TO_LUCIDE[iconStr] || HelpCircle
}

export default function Categories() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { categories, budgets, spentMap, loading, refetch } = useCategoriesAndBudgets(user?.id)
  const currency = profile?.currency || 'Rs'

  const [activeView, setActiveView] = useState('list')
  const [selectedCat, setSelectedCat] = useState(null)
  const [expandedBudget, setExpandedBudget] = useState(null)

  // Category Form
  const [catName, setCatName] = useState('')
  const [catIcon, setCatIcon] = useState('Utensils')
  const [catColor, setCatColor] = useState('#60A5FA')
  const [catFormLoading, setCatFormLoading] = useState(false)

  // Budget Form
  const [budgetLimit, setBudgetLimit] = useState('')
  const [budgetFormLoading, setBudgetFormLoading] = useState(false)

  const handleOpenEditCategory = (cat = null) => {
    setSelectedCat(cat)
    if (cat) {
      setCatName(cat.name)
      setCatIcon(cat.icon)
      setCatColor(cat.color)
    } else {
      setCatName('')
      setCatIcon('Utensils')
      setCatColor('#60A5FA')
    }
    setActiveView('edit-category')
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault()
    if (!catName) return toast.error('Category name needed.')

    setCatFormLoading(true)
    try {
      if (selectedCat) {
        const { error } = await supabase
          .from('categories')
          .update({ name: catName, icon: catIcon, color: catColor })
          .eq('id', selectedCat.id)
        if (error) throw error
        toast.success('Category updated!')
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{ user_id: user.id, name: catName, icon: catIcon, color: catColor, budget_limit: 0 }])
        if (error) throw error
        toast.success('Category created!')
      }
      setActiveView('list')
      refetch()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save category.')
    } finally {
      setCatFormLoading(false)
    }
  }

  const handleSaveBudget = async (catId) => {
    setBudgetFormLoading(true)
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    try {
      const activeBudget = budgets.find(b => b.category_id === catId)
      const numLimit = Number(budgetLimit)

      if (activeBudget) {
        const { error } = await supabase
          .from('budgets')
          .update({ limit_amount: numLimit })
          .eq('id', activeBudget.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert([{ user_id: user.id, category_id: catId, limit_amount: numLimit, month: currentMonth, year: currentYear }])
        if (error) throw error
      }
      toast.success('Budget goal updated!')
      setExpandedBudget(null)
      refetch()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save budget.')
    } finally {
      setBudgetFormLoading(false)
    }
  }

  // ─── Loading ───
  if (loading && categories.length === 0) {
    return (
      <div className="page-enter pb-24 space-y-6">
        <Skeleton variant="text" width="200px" />
        <Skeleton variant="card" count={4} />
      </div>
    )
  }

  // ─── Edit Category View ───
  if (activeView === 'edit-category') {
    return (
      <div className="page-enter pb-24">
        <button
          onClick={() => setActiveView('list')}
          className="flex items-center gap-2 text-txt-muted hover:text-txt-primary transition-colors duration-fast mb-6"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="text-xl font-bold tracking-tight mb-6">
          {selectedCat ? 'Edit Category' : 'New Category'}
        </h1>

        <form onSubmit={handleSaveCategory} className="space-y-6">
          <input
            type="text"
            placeholder="Category Name"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            className="input-field"
            required
          />

          {/* Icon Picker */}
          <div>
            <p className="overline mb-3">Choose Icon</p>
            <div className="grid grid-cols-7 gap-2">
              {ICON_OPTIONS.map(({ name, component: Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCatIcon(name)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border 
                    transition-[background,border-color,transform] duration-fast ease-out-expo
                    ${catIcon === name
                      ? 'border-accent bg-accent-tint scale-110'
                      : 'border-border-subtle bg-interactive hover:bg-elevated'
                    }`}
                >
                  <Icon size={18} strokeWidth={1.5} className={catIcon === name ? 'text-accent' : 'text-txt-muted'} />
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <p className="overline mb-3">Choose Color</p>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCatColor(color)}
                  className="w-8 h-8 rounded-full transition-[transform,box-shadow] duration-fast ease-out-expo"
                  style={{
                    backgroundColor: color,
                    boxShadow: catColor === color ? `0 0 0 2px var(--tw-shadow-color, #0A0A0F), 0 0 0 4px ${color}` : 'none',
                    transform: catColor === color ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full h-12 flex items-center justify-center" disabled={catFormLoading}>
            {catFormLoading
              ? <div className="w-5 h-5 border-2 border-canvas/20 border-t-canvas rounded-full animate-spin" />
              : 'Save Category'}
          </button>
        </form>
      </div>
    )
  }

  // ─── List View ───
  return (
    <div className="page-enter pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1 text-txt-muted hover:text-txt-primary text-sm transition-colors duration-fast mb-1"
          >
            <ArrowLeft size={14} /> Settings
          </button>
          <h1 className="text-xl font-bold tracking-tight">Budgets & Categories</h1>
        </div>
        <button
          onClick={() => handleOpenEditCategory()}
          className="w-9 h-9 rounded-xl bg-interactive border border-border-subtle flex items-center justify-center 
                     text-txt-muted hover:text-accent hover:border-accent/30 
                     transition-[color,border-color] duration-fast active:scale-95"
        >
          <Plus size={18} />
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          illustration="budgets"
          title="Set your first budget"
          message="Create categories and set spending limits to stay on track."
          action={{ label: 'Create Category', onClick: () => handleOpenEditCategory() }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {categories.map((cat) => {
            const spent = spentMap[cat.id] || 0
            const activeBudget = budgets.find(b => b.category_id === cat.id)
            const limit = activeBudget ? Number(activeBudget.limit_amount) : 0
            const Icon = getCategoryIcon(cat.icon)
            const isExpanded = expandedBudget === cat.id

            return (
              <Card key={cat.id} variant="interactive" padding="compact" className="!cursor-default">
                <div className="flex items-center gap-3 mb-3">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}15` }}
                  >
                    <Icon size={18} style={{ color: cat.color }} strokeWidth={1.75} />
                  </div>

                  {/* Name + Budget */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-txt-primary truncate">{cat.name}</h3>
                    <p className="text-2xs text-txt-muted">
                      {limit > 0 ? `Limit: ${currency}${limit.toLocaleString()}` : 'No limit set'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedBudget(null)
                        } else {
                          setBudgetLimit(limit || '')
                          setExpandedBudget(cat.id)
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-interactive text-txt-muted hover:text-accent transition-colors duration-fast"
                      title="Edit budget"
                    >
                      <Target size={14} />
                    </button>
                    <button
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-1.5 rounded-lg hover:bg-interactive text-txt-muted hover:text-txt-primary transition-colors duration-fast"
                      title="Edit category"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>

                {/* Spent + Progress */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-medium text-txt-primary">
                    {currency}{spent.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    <span className="text-txt-muted font-normal"> spent</span>
                  </span>
                  {limit > 0 && (
                    <span className="font-mono text-2xs text-txt-muted">
                      {Math.round((spent / limit) * 100)}%
                    </span>
                  )}
                </div>

                {limit > 0 && (
                  <ProgressBar
                    value={spent}
                    max={limit}
                    color="adaptive"
                    height="sm"
                  />
                )}

                {/* Inline Budget Editor */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border-subtle animate-fade-in">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm font-mono">{currency}</span>
                        <input
                          type="number"
                          step="1"
                          placeholder="Monthly limit"
                          value={budgetLimit}
                          onChange={(e) => setBudgetLimit(e.target.value)}
                          className="input-field pl-8 text-sm font-mono"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveBudget(cat.id)}
                        disabled={budgetFormLoading}
                        className="p-2.5 rounded-xl bg-accent text-txt-inverted hover:bg-accent-hover transition-colors duration-fast"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setExpandedBudget(null)}
                        className="p-2.5 rounded-xl bg-interactive text-txt-muted hover:text-txt-primary transition-colors duration-fast"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
