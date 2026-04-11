import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Fetches required data for the Dashboard:
 * - Ledger-based income/expense totals
 * - Total pending lent out
 * - Top 4 expense categories across the ledger
 * - Past 7 days expenses (for chart)
 * - 5 Most recent transactions
 */
export function useDashboardData(userId) {
  const [data, setData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    totalBalance: 0,
    totalLentOut: 0,
    readyToAssign: 0,
    recentTransactions: [],
    weeklyData: [],
    categoriesSpends: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0]
      
      // 1. Fetch all transactions so balance always reflects the full ledger
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (txError) throw txError

      // 2. Fetch budgets for 'Ready to Assign' calculation
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('limit_amount')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .eq('year', currentYear)

      if (budgetError) throw budgetError

      // 3. Fetch debts for 'lent out'
      const { data: debtData, error: debtError } = await supabase
         .from('debts')
         .select('amount')
         .eq('user_id', userId)
         .eq('type', 'lent')
         .neq('status', 'settled')

      if (debtError) throw debtError

      // 4. Process the data
      let income = 0
      let expense = 0
      let categorised = {}

      const sortedTransactions = [...(txData || [])].sort((a, b) => {
         const dateDiff = new Date(b.date) - new Date(a.date)
         if (dateDiff !== 0) return dateDiff
         return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      })

      sortedTransactions.forEach(tx => {
         if (tx.type === 'income') {
           income += Number(tx.amount)
         } else if (tx.type === 'expense') {
           expense += Number(tx.amount)
           categorised[tx.category] = (categorised[tx.category] || 0) + Number(tx.amount)
         }
      })

      const totalBalance = income - expense
      const totalBudgeted = budgetData?.reduce((sum, b) => sum + Number(b.limit_amount), 0) || 0
      const readyToAssign = totalBalance - totalBudgeted

      // Top 4 categories
      const categoriesSpends = Object.keys(categorised).map(c => ({
         name: c,
         amount: categorised[c]
      })).sort((a,b) => b.amount - a.amount).slice(0, 4)

      const lentOut = debtData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0

      // Weekly chart data
      const weeklyData = []
      for(let i=6; i>=0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const dateStr = d.toISOString().split('T')[0]
          
          const dayExpenses = sortedTransactions.filter(t => t.date === dateStr && t.type === 'expense')
              .reduce((sum, t) => sum + Number(t.amount), 0) || 0

          weeklyData.push({
             label: d.toLocaleDateString('en-US', { weekday: 'short' }),
             amount: dayExpenses
          })
      }

      setData({
         totalIncome: income,
         totalExpense: expense,
         totalBalance,
         totalLentOut: lentOut,
         readyToAssign: readyToAssign,
         recentTransactions: sortedTransactions.slice(0, 5),
         weeklyData,
         categoriesSpends
      })
      setError(null)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!userId) return undefined

    const channel = supabase
      .channel(`dashboard-live-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${userId}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debts', filter: `user_id=eq.${userId}` }, fetchData)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData, userId])

  return { data, loading, error, refetch: fetchData }
}
