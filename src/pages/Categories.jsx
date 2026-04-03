import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCategoriesAndBudgets } from '../hooks/useCategoriesAndBudgets'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const EMOTICONS = ['🍔', '🚌', '📚', '💊', '🛍', '🎮', '💡', '➕', '🏠', '✈️', '🐶', '👗', '🎁', '☕']
const COLORS = ['#5DCAA5', '#378ADD', '#F0997B', '#FF7676', '#FFB84C', '#9B5DE5', '#00F5D4', '#9E9E9E', '#E91E63', '#795548', '#607D8B']

export default function Categories() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { categories, budgets, spentMap, loading, refetch } = useCategoriesAndBudgets(user?.id)
  const currency = profile?.currency || '$'

  const [activeView, setActiveView] = useState('list') // 'list' | 'edit-category' | 'edit-budget'
  const [selectedCat, setSelectedCat] = useState(null)
  
  // States for Category Form
  const [catName, setCatName] = useState('')
  const [catIcon, setCatIcon] = useState('➕')
  const [catColor, setCatColor] = useState('#378ADD')
  const [catFormLoading, setCatFormLoading] = useState(false)

  // States for Budget Form
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
      setCatIcon('➕')
      setCatColor('#378ADD')
    }
    setActiveView('edit-category')
  }

  const handleOpenEditBudget = (cat) => {
    setSelectedCat(cat)
    const activeBudget = budgets.find(b => b.category_id === cat.id)
    setBudgetLimit(activeBudget ? activeBudget.limit_amount : '')
    setActiveView('edit-budget')
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault()
    if (!catName) return toast.error('Category name needed.')

    setCatFormLoading(true)
    try {
      if (selectedCat) {
        // Update
        const { error } = await supabase
          .from('categories')
          .update({ name: catName, icon: catIcon, color: catColor })
          .eq('id', selectedCat.id)
        if (error) throw error
        toast.success('Category updated!')
      } else {
        // Create
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

  const handleSaveBudget = async (e) => {
    e.preventDefault()
    setBudgetFormLoading(true)
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    try {
      const activeBudget = budgets.find(b => b.category_id === selectedCat.id)
      const numLimit = Number(budgetLimit)

      if (activeBudget) {
        // update
        const { error } = await supabase
          .from('budgets')
          .update({ limit_amount: numLimit })
          .eq('id', activeBudget.id)
        if (error) throw error
      } else {
        // insert
        const { error } = await supabase
          .from('budgets')
          .insert([{
             user_id: user.id,
             category_id: selectedCat.id,
             limit_amount: numLimit,
             month: currentMonth,
             year: currentYear
          }])
        if (error) throw error
      }
      toast.success('Budget goal updated!')
      setActiveView('list')
      refetch()
    } catch (err) {
       console.error(err)
       toast.error('Failed to save budget.')
    } finally {
       setBudgetFormLoading(false)
    }
  }

  if (loading && categories.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
         <span className="loader w-8 h-8 border-4 border-white/20 border-t-accent rounded-full animate-spin"></span>
      </div>
    )
  }

  if (activeView === 'edit-category') {
    return (
      <div className="page-enter pb-24">
         <button onClick={() => setActiveView('list')} className="text-white/50 mb-6 flex items-center gap-2">
            <span>←</span> Back
         </button>
         <h1 className="text-xl font-bold mb-6">{selectedCat ? 'Edit Category' : 'New Category'}</h1>
         
         <form onSubmit={handleSaveCategory} className="space-y-6">
            <input
               type="text"
               placeholder="Category Name"
               value={catName}
               onChange={(e) => setCatName(e.target.value)}
               className="input-field"
               required
            />
            
            <div>
               <p className="text-sm text-white/50 mb-3">Choose Icon</p>
               <div className="grid grid-cols-7 gap-3">
                  {EMOTICONS.map(emo => (
                     <button
                        key={emo}
                        type="button"
                        onClick={() => setCatIcon(emo)}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${
                           catIcon === emo ? 'border-accent bg-white/20' : 'border-white/5 bg-white/5'
                        }`}
                     >
                        {emo}
                     </button>
                  ))}
               </div>
            </div>

            <div>
               <p className="text-sm text-white/50 mb-3">Choose Color</p>
               <div className="flex flex-wrap gap-3">
                  {COLORS.map(color => (
                     <button
                        key={color}
                        type="button"
                        onClick={() => setCatColor(color)}
                        className={`w-10 h-10 rounded-full border-4 transition-all`}
                        style={{
                           backgroundColor: color,
                           borderColor: catColor === color ? 'var(--color-navy, #1a1a2e)' : 'transparent',
                           boxShadow: catColor === color ? `0 0 0 2px ${color}` : 'none'
                        }}
                     />
                  ))}
               </div>
            </div>

            <button type="submit" className="btn-primary w-full h-[48px] flex items-center justify-center" disabled={catFormLoading}>
               {catFormLoading ? <span className="loader w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Save Category'}
            </button>
         </form>
      </div>
    )
  }

  if (activeView === 'edit-budget') {
     return (
        <div className="page-enter pb-24">
           <button onClick={() => setActiveView('list')} className="text-white/50 mb-6 flex items-center gap-2">
              <span>←</span> Back
           </button>
           <h1 className="text-xl font-bold mb-2">Set Budget Goal</h1>
           <p className="text-white/50 text-sm mb-6">For {selectedCat?.icon} {selectedCat?.name}</p>

           <form onSubmit={handleSaveBudget} className="space-y-6">
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">{currency}</span>
                 <input
                    type="number"
                    step="1"
                    placeholder="Monthly Limit"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                    className="input-field pl-10 text-xl font-bold"
                    required
                 />
              </div>
              
              <button type="submit" className="btn-primary w-full h-[48px] flex items-center justify-center" disabled={budgetFormLoading}>
               {budgetFormLoading ? <span className="loader w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Save Goal'}
            </button>
           </form>
        </div>
     )
  }

  // --- LIST VIEW ---
  return (
    <div className="page-enter pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
           <button onClick={() => navigate('/settings')} className="text-white/50 text-sm mb-1">← Settings</button>
           <h1 className="text-xl font-bold">Budgets & Categories</h1>
        </div>
        <button onClick={() => handleOpenEditCategory()} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold active:scale-95 transition-transform">
          +
        </button>
      </div>

      <div className="space-y-4">
         {categories.map((cat) => {
            const spent = spentMap[cat.id] || 0
            const activeBudget = budgets.find(b => b.category_id === cat.id)
            const limit = activeBudget ? Number(activeBudget.limit_amount) : 0
            
            let percent = 0
            if (limit > 0) percent = Math.min((spent / limit) * 100, 100)
            else percent = spent > 0 ? 100 : 0 // if no limits, arbitrary visualization

            let barColor = cat.color || '#378ADD'
            if (limit > 0) {
               if (percent >= 90) barColor = '#FF7676' // Aggressive Red
               else if (percent >= 75) barColor = '#FFB84C' // Yellow
               // otherwise use category native color 
            }

            return (
               <div key={cat.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleOpenEditCategory(cat)}>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg shrink-0 border border-white/5">
                           {cat.icon}
                        </div>
                        <div>
                           <h3 className="font-semibold text-sm">{cat.name}</h3>
                           <p className="text-xs text-white/40">{limit > 0 ? `Lim: ${currency}${limit}` : 'No limit set'}</p>
                        </div>
                     </div>
                     <div className="text-right flex flex-col items-end">
                        <button 
                           onClick={() => handleOpenEditBudget(cat)}
                           className="text-[10px] text-accent border border-accent/20 bg-accent/5 px-2 py-1 rounded-md mb-1 active:scale-95"
                        >
                           Edit Goal
                        </button>
                        <p className="text-[10px] text-white/50">{currency}{spent.toFixed(2)} spent</p>
                     </div>
                  </div>

                  {/* Progress Bar Container  */}
                  {limit > 0 && (
                     <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mt-2 relative">
                        <div 
                           className="h-full rounded-full transition-all duration-500 ease-out"
                           style={{ 
                              width: `${percent}%`, 
                              backgroundColor: barColor 
                           }}
                        />
                     </div>
                  )}
               </div>
            )
         })}
      </div>

    </div>
  )
}
