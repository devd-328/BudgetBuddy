import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Target, Utensils, Bus, BookOpen, Heart, ShoppingBag, Gamepad2, Zap, HelpCircle, Coffee, Plane, Dog, Shirt, Gift, Check, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCategoriesAndBudgetsFixed } from '../hooks/useCategoriesAndBudgetsFixed'
import { supabase } from '../lib/supabase'
import CustomToast from '../components/ui/CustomToast'
import CategoryPromptModal from '../components/ui/CategoryPromptModal'

import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/EmptyState'
import {
  isReservedCustomCategoryName,
  sortExpenseCategories,
} from '../lib/categories'

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

const EMOJI_TO_LUCIDE = {
  Utensils,
  Bus,
  BookOpen,
  Heart,
  ShoppingBag,
  Gamepad2,
  Zap,
  Coffee,
  Plane,
  Dog,
  Shirt,
  Gift,
  Plus,
  HelpCircle,
  '??': Utensils,
  '??': Bus,
  '??': BookOpen,
  '??': Heart,
  '??': ShoppingBag,
  '??': Gamepad2,
  '??': Zap,
  '?': Plus,
  '??': Coffee,
  '??': Plane,
  '??': Dog,
  '??': Shirt,
  '??': Gift,
  '?': Coffee,
}

function getCategoryIcon(iconStr) {
  return EMOJI_TO_LUCIDE[iconStr] || EMOJI_TO_LUCIDE[iconStr?.trim?.()] || HelpCircle
}

export default function Categories() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { categories, budgets, spentMap, loading, refetch } = useCategoriesAndBudgetsFixed(user?.id)
  const currency = profile?.currency || 'Rs'

  const [activeView, setActiveView] = useState('list')
  const [selectedCat, setSelectedCat] = useState(null)
  const [expandedBudget, setExpandedBudget] = useState(null)
  const [catName, setCatName] = useState('')
  const [catIcon, setCatIcon] = useState('Utensils')
  const [catColor, setCatColor] = useState('#60A5FA')
  const [catFormLoading, setCatFormLoading] = useState(false)
  const [budgetLimit, setBudgetLimit] = useState('')
  const [budgetFormLoading, setBudgetFormLoading] = useState(false)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [quickAddLoading, setQuickAddLoading] = useState(false)

  const expenseCategories = sortExpenseCategories(
    categories.filter((item) => (item.type || 'expense') === 'expense')
  )

  const handleOpenEditCategory = (category = null) => {
    setSelectedCat(category)
    if (category) {
      setCatName(category.name)
      setCatIcon(category.icon)
      setCatColor(category.color)
    } else {
      setCatName('')
      setCatIcon('Utensils')
      setCatColor('#60A5FA')
    }
    setActiveView('edit-category')
  }

  const handleSaveCategory = async (event) => {
    event.preventDefault()
    if (!catName) return CustomToast.error('Category name needed', 'Please provide a name for your category.')

    const trimmedName = catName.trim()
    if (isReservedCustomCategoryName(trimmedName)) {
      return CustomToast.error('Choose another name', '"Custom" is reserved for adding new categories.')
    }

    const duplicate = categories.find((item) =>
      item.id !== selectedCat?.id && item.name.trim().toLowerCase() === trimmedName.toLowerCase()
    )

    if (duplicate) {
      return CustomToast.error('Category already exists', `"${trimmedName}" is already in your categories.`)
    }

    setCatFormLoading(true)
    try {
      if (selectedCat) {
        const { error } = await supabase
          .from('categories')
          .update({ name: trimmedName, icon: catIcon, color: catColor })
          .eq('id', selectedCat.id)
        if (error) throw error
        CustomToast.success('Category updated', `Successfully saved changes to "${trimmedName}".`)
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{ user_id: user.id, name: trimmedName, icon: catIcon, color: catColor, type: 'expense', budget_limit: 0 }])
        if (error) throw error
        CustomToast.success('Category created', `New category "${trimmedName}" is ready for use.`)
      }
      setActiveView('list')
      await refetch()
    } catch (err) {
      console.error(err)
      CustomToast.error('Save Failed', 'An error occurred while saving the category.')
    } finally {
      setCatFormLoading(false)
    }
  }

  const handleQuickAddCategory = async (rawName) => {
    const trimmedName = rawName.trim()

    if (!trimmedName) {
      return CustomToast.error('Category name needed', 'Please provide a name for your category.')
    }

    if (isReservedCustomCategoryName(trimmedName)) {
      return CustomToast.error('Choose another name', '"Custom" is reserved for adding new categories.')
    }

    const duplicate = categories.find((item) => item.name.trim().toLowerCase() === trimmedName.toLowerCase())
    if (duplicate) {
      setShowQuickAddModal(false)
      return CustomToast.info('Category already exists', `"${duplicate.name}" is already in your categories.`)
    }

    setQuickAddLoading(true)
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          user_id: user.id,
          name: trimmedName,
          icon: 'Plus',
          color: '#8A8A9E',
          type: 'expense',
          budget_limit: 0,
        }])

      if (error) throw error

      await refetch()
      setShowQuickAddModal(false)
      CustomToast.success('Category created', `New category "${trimmedName}" is ready for use.`)
    } catch (err) {
      console.error(err)
      CustomToast.error('Save Failed', 'An error occurred while saving the category.')
    } finally {
      setQuickAddLoading(false)
    }
  }

  const handleSaveBudget = async (catId) => {
    setBudgetFormLoading(true)
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    try {
      const activeBudget = budgets.find((budget) => budget.category_id === catId)
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
      CustomToast.success('Budget goal updated', 'Your spending limit has been saved.')
      setExpandedBudget(null)
      await refetch()
    } catch (err) {
      console.error(err)
      CustomToast.error('Budget failed', 'An error occurred while updating the budget goal.')
    } finally {
      setBudgetFormLoading(false)
    }
  }

  if (loading && categories.length === 0) {
    return (
      <div className="page-enter pb-24 space-y-6">
        <Skeleton variant="text" width="200px" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           <Skeleton variant="card" />
           <Skeleton variant="card" />
           <Skeleton variant="card" />
           <Skeleton variant="card" />
        </div>
      </div>
    )
  }

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
            onChange={(event) => setCatName(event.target.value)}
            className="input-field"
            required
          />

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
                      ? 'border-accent bg-accent/10 scale-110 shadow-glow-accent'
                      : 'border-border-subtle bg-card/40 hover:bg-interactive'
                    }`}
                >
                  <Icon size={18} strokeWidth={1.5} className={catIcon === name ? 'text-accent' : 'text-txt-muted'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="overline mb-3">Choose Color</p>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCatColor(color)}
                  className="w-8 h-8 rounded-full transition-all duration-fast ease-out-expo hover:scale-110"
                  style={{
                    backgroundColor: color,
                    boxShadow: catColor === color ? `0 0 0 2px var(--canvas, #0A0A0F), 0 0 12px ${color}60` : 'none',
                    transform: catColor === color ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full h-12 flex items-center justify-center shadow-lg shadow-accent/10" disabled={catFormLoading}>
            {catFormLoading
              ? <div className="w-5 h-5 border-2 border-canvas/20 border-t-canvas rounded-full animate-spin" />
              : 'Save Category'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="page-enter pb-24 text-txt-bright">
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
          className="w-10 h-10 rounded-xl bg-accent text-canvas shadow-lg shadow-accent/20 flex items-center justify-center
                     hover:bg-accent-hover transition-all duration-fast active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>

      {expenseCategories.length === 0 ? (
        <EmptyState
          illustration="budgets"
          title="Set your first budget"
          message="Create categories and set spending limits to stay on track."
          action={{ label: 'Create Category', onClick: () => setShowQuickAddModal(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {expenseCategories.map((category) => {
            const spent = spentMap[category.id] || 0
            const activeBudget = budgets.find((budget) => budget.category_id === category.id)
            const limit = activeBudget ? Number(activeBudget.limit_amount) : 0
            const Icon = getCategoryIcon(category.icon)
            const isExpanded = expandedBudget === category.id

            return (
              <Card key={category.id} variant="interactive" padding="compact" className="!cursor-default shadow-xl shadow-canvas/50">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: `${category.color}15`, boxShadow: `0 0 15px ${category.color}15` }}
                  >
                    <Icon size={18} style={{ color: category.color }} strokeWidth={2} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-txt-primary truncate">{category.name}</h3>
                    <p className="text-2xs text-txt-muted font-medium">
                      {limit > 0 ? `Goal: ${currency}${limit.toLocaleString()}` : 'No limit set'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedBudget(null)
                        } else {
                          setBudgetLimit(limit || '')
                          setExpandedBudget(category.id)
                        }
                      }}
                      className="p-2 rounded-lg bg-card border border-border-subtle text-txt-muted hover:text-accent hover:border-accent/30 transition-all duration-300"
                      title="Edit budget"
                    >
                      <Target size={14} />
                    </button>
                    <button
                      onClick={() => handleOpenEditCategory(category)}
                      className="p-2 rounded-lg bg-card border border-border-subtle text-txt-muted hover:text-txt-primary transition-colors duration-fast"
                      title="Edit category"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="font-mono text-xs font-bold text-txt-primary">
                    {currency}{spent.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    <span className="text-txt-muted font-medium lowercase"> spent</span>
                  </span>
                  {limit > 0 && (
                    <span className={`font-mono text-xs font-black ${spent > limit ? 'text-expense' : 'text-income'}`}>
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
                    className="shadow-inner"
                  />
                )}

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border-subtle animate-scale-in origin-top">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm font-bold font-mono">{currency}</span>
                        <input
                          type="number"
                          step="1"
                          placeholder="Monthly goal"
                          value={budgetLimit}
                          onChange={(event) => setBudgetLimit(event.target.value)}
                          className="input-field pl-8 text-sm font-bold font-mono h-11"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveBudget(category.id)}
                        disabled={budgetFormLoading}
                        className="w-11 h-11 rounded-xl bg-income text-canvas shadow-lg shadow-income/20 flex items-center justify-center hover:bg-income/90 transition-all active:scale-95"
                      >
                        <Check size={18} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => setExpandedBudget(null)}
                        className="w-11 h-11 rounded-xl bg-interactive text-txt-muted hover:text-txt-primary transition-all active:scale-95"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}

          <button
            type="button"
            onClick={() => setShowQuickAddModal(true)}
            className="rounded-3xl border border-dashed border-accent/30 bg-accent/5 p-5 text-left shadow-xl shadow-canvas/30 transition-colors hover:bg-accent/10 hover:border-accent/50"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
              <Plus size={18} strokeWidth={2.5} />
            </div>
            <h3 className="text-sm font-bold text-txt-primary">Custom</h3>
            <p className="mt-1 text-2xs text-txt-muted leading-relaxed">
              Add another expense category and keep your budget list growing.
            </p>
          </button>
        </div>
      )}

      <CategoryPromptModal
        open={showQuickAddModal}
        loading={quickAddLoading}
        onCancel={() => setShowQuickAddModal(false)}
        onConfirm={handleQuickAddCategory}
      />
    </div>
  )
}
