import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const DEFAULT_CATEGORIES = [
  // Expenses
  { name: 'Food', icon: '🍔', color: '#5DCAA5', type: 'expense' },
  { name: 'Transport', icon: '🚌', color: '#378ADD', type: 'expense' },
  { name: 'Education', icon: '📚', color: '#F0997B', type: 'expense' },
  { name: 'Health', icon: '💊', color: '#FF7676', type: 'expense' },
  { name: 'Shopping', icon: '🛍', color: '#FFB84C', type: 'expense' },
  { name: 'Entertainment', icon: '🎮', color: '#9B5DE5', type: 'expense' },
  { name: 'Bills', icon: '💡', color: '#00F5D4', type: 'expense' },
  { name: 'Custom', icon: '➕', color: '#9E9E9E', type: 'expense' },
  
  // Income
  { name: 'Salary', icon: '💼', color: '#34D399', type: 'income' },
  { name: 'Freelance', icon: '💻', color: '#60A5FA', type: 'income' },
  { name: 'Gift', icon: '🎁', color: '#FBBF24', type: 'income' },
  { name: 'Business', icon: '📈', color: '#818CF8', type: 'income' },
  { name: 'Other Income', icon: '💰', color: '#A78BFA', type: 'income' },
]

export function useCategoriesAndBudgets(userId) {
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState([])
  const [spentMap, setSpentMap] = useState({}) // category_id -> amount
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      // 1. Fetch Categories
      let { data: cats, error: catsErr } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name')

      if (catsErr) throw catsErr

      // Auto-seed
      if (!cats || cats.length === 0) {
        const seedData = DEFAULT_CATEGORIES.map(c => ({
          user_id: userId,
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: c.type || 'expense', // Fallback
          budget_limit: 0
        }))
        
        const { data: newCats, error: seedErr } = await supabase
          .from('categories')
          .insert(seedData)
          .select()

        if (seedErr) throw seedErr
        cats = newCats
        toast.success('Generated default categories.')
      }

      setCategories(cats || [])

      // 2. Fetch Budgets for current month
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      const { data: buds, error: budsErr } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .eq('year', currentYear)

      if (budsErr) throw budsErr
      setBudgets(buds || [])

      // 3. Calculate Spending
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0]
      const { data: txs, error: txsErr } = await supabase
        .from('transactions')
        .select('category, amount, type')
        .eq('user_id', userId)
        .gte('date', startOfMonth)

      if (txsErr) throw txsErr

      const mappedSpends = {}
      let totalIncomeVal = 0
      
      txs?.forEach(tx => {
         if (tx.type === 'income') {
            totalIncomeVal += Number(tx.amount)
         } else if (tx.type === 'expense') {
            const matchingCat = cats.find(c => c.name === tx.category && c.type !== 'income')
            if (matchingCat) {
               mappedSpends[matchingCat.id] = (mappedSpends[matchingCat.id] || 0) + Number(tx.amount)
            }
         }
      })
      
      setSpentMap(mappedSpends)

    } catch (err) {
      console.error(err)
      toast.error('Could not load categories.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { categories, budgets, spentMap, loading, refetch: fetchData }
}
