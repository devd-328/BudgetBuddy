import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import {
  DEFAULT_CATEGORIES,
  dedupeCategories,
  isReservedCustomCategoryName,
} from '../lib/categories'

export function useCategoriesAndBudgetsFixed(userId) {
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState([])
  const [spentMap, setSpentMap] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      let { data: cats, error: catsErr } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name')

      if (catsErr) throw catsErr

      if (!cats || cats.length === 0) {
        const seedData = DEFAULT_CATEGORIES.map((category) => ({
          user_id: userId,
          name: category.name,
          icon: category.icon,
          color: category.color,
          type: category.type || 'expense',
          budget_limit: 0,
        }))

        const { data: newCats, error: seedErr } = await supabase
          .from('categories')
          .insert(seedData)
          .select()

        if (seedErr) throw seedErr
        cats = newCats
        toast.success('Generated default categories.')
      }

      const normalizedCats = dedupeCategories(cats || []).filter(
        (category) => !isReservedCustomCategoryName(category.name)
      )

      setCategories(normalizedCats)

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

      const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0]
      const { data: txs, error: txsErr } = await supabase
        .from('transactions')
        .select('category, amount, type')
        .eq('user_id', userId)
        .gte('date', startOfMonth)

      if (txsErr) throw txsErr

      const mappedSpends = {}

      txs?.forEach((tx) => {
        if (tx.type === 'expense') {
          const matchingCat = normalizedCats.find(
            (category) => category.name === tx.category && category.type !== 'income'
          )
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
