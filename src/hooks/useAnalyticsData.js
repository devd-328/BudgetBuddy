import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useAnalyticsData(userId, period) {
  // period = 'week' | 'month' | 'quarter' | 'year'
  const [data, setData] = useState({
    donutData: [],
    lineData: { labels: [], income: [], expense: [] },
    topCategory: null,
    budgetProgress: []
  })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const now = new Date()
      let startDate = new Date()
      
      if (period === 'week') startDate.setDate(now.getDate() - 7)
      else if (period === 'month') startDate.setMonth(now.getMonth() - 1)
      else if (period === 'quarter') startDate.setMonth(now.getMonth() - 3)
      else if (period === 'year') startDate.setFullYear(now.getFullYear() - 1)
      
      const startStr = startDate.toISOString().split('T')[0]

      // Determine 6 month backward bounds specifically for the Line Chart
      const sixMonthsBack = new Date()
      sixMonthsBack.setMonth(now.getMonth() - 5)
      sixMonthsBack.setDate(1) // first day of that month
      const sixMonthStr = sixMonthsBack.toISOString().split('T')[0]

      // To minimize queries, fetch starting from the oldest required date
      const fetchStartStr = startDate < sixMonthsBack ? startStr : sixMonthStr

      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', fetchStartStr)

      if (txError) throw txError

      const { data: cats, error: catsErr } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)

      if (catsErr) throw catsErr

      const currentMonthNum = now.getMonth() + 1
      const currentYearNum = now.getFullYear()
      const { data: buds, error: budsErr } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonthNum)
        .eq('year', currentYearNum)

      if (budsErr) throw budsErr

      // ======================================
      // 1. Process Doughnut Data (Active Period)
      // ======================================
      const periodExpenses = {}
      txs.forEach(tx => {
         if (tx.type === 'expense' && tx.date >= startStr) {
            periodExpenses[tx.category] = (periodExpenses[tx.category] || 0) + Number(tx.amount)
         }
      })

      const donutData = Object.keys(periodExpenses).map(catName => {
         const matchedCat = cats?.find(c => c.name === catName)
         return {
            name: catName,
            amount: periodExpenses[catName],
            color: matchedCat?.color || '#888888'
         }
      }).sort((a,b) => b.amount - a.amount)

      const topCategory = donutData.length > 0 ? donutData[0] : null

      // ======================================
      // 2. Process Budget Progress
      // Using Current Month logic for budgets
      // ======================================
      const monthExpenses = {}
      txs.forEach(tx => {
         const tDate = new Date(tx.date)
         if (tx.type === 'expense' && tDate.getMonth() + 1 === currentMonthNum && tDate.getFullYear() === currentYearNum) {
             monthExpenses[tx.category] = (monthExpenses[tx.category] || 0) + Number(tx.amount)
         }
      })

      const budgetProgress = cats?.map(cat => {
         const bd = buds?.find(b => b.category_id === cat.id)
         const limit = bd ? Number(bd.limit_amount) : 0
         const spent = monthExpenses[cat.name] || 0
         return { ...cat, limit, spent }
      }).filter(c => c.limit > 0 || c.spent > 0)

      // ======================================
      // 3. Process Line Chart Data (6 Months Fixed)
      // ======================================
      const monthMap = {}
      for(let i=5; i>=0; i--) {
         const mDate = new Date()
         mDate.setMonth(now.getMonth() - i)
         const mKey = mDate.toLocaleString('default', { month: 'short' }) + " '" + mDate.getFullYear().toString().slice(2)
         monthMap[mKey] = { income: 0, expense: 0, order: mDate.getTime() }
      }

      txs.forEach(tx => {
         if (tx.date >= sixMonthStr) {
            const tDate = new Date(tx.date)
            const key = tDate.toLocaleString('default', { month: 'short' }) + " '" + tDate.getFullYear().toString().slice(2)
            if (monthMap[key]) {
               monthMap[key][tx.type] += Number(tx.amount)
            }
         }
      })

      const lineLabels = Object.keys(monthMap).sort((a,b) => monthMap[a].order - monthMap[b].order)
      const lineIncome = lineLabels.map(l => monthMap[l].income)
      const lineExpense = lineLabels.map(l => monthMap[l].expense)

      setData({
         donutData,
         topCategory,
         budgetProgress,
         lineData: {
            labels: lineLabels,
            income: lineIncome,
            expense: lineExpense
         }
      })

    } catch (err) {
      console.error(err)
      toast.error('Could not load analytics')
    } finally {
      setLoading(false)
    }
  }, [userId, period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { ...data, loading }
}
