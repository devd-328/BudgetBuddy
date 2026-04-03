import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#5DCAA5' },
  { name: 'Transport', icon: '🚌', color: '#378ADD' },
  { name: 'Education', icon: '📚', color: '#F0997B' },
  { name: 'Health', icon: '💊', color: '#FF7676' },
  { name: 'Shopping', icon: '🛍', color: '#FFB84C' },
  { name: 'Entertainment', icon: '🎮', color: '#9B5DE5' },
  { name: 'Bills', icon: '💡', color: '#00F5D4' },
  { name: 'Custom', icon: '➕', color: '#9E9E9E' },
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
        .select('category, amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', startOfMonth)

      if (txsErr) throw txsErr

      const mappedSpends = {}
      txs?.forEach(tx => {
         const matchingCat = cats.find(c => c.name === tx.category)
         if (matchingCat) {
            mappedSpends[matchingCat.id] = (mappedSpends[matchingCat.id] || 0) + Number(tx.amount)
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
