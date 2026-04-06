import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Fetches required data for the Dashboard:
 * - Month-to-date income/expense
 * - Total pending lent out
 * - Top 4 expense categories
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

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function fetchData() {
      setLoading(true)
      try {
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()
        const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0]
        
        // 1. Fetch current month's transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startOfMonth)
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

        txData?.forEach(tx => {
           if (tx.type === 'income') {
             income += Number(tx.amount)
           } else if (tx.type === 'expense') {
             expense += Number(tx.amount)
             categorised[tx.category] = (categorised[tx.category] || 0) + Number(tx.amount)
           }
        })

        const totalBudgeted = budgetData?.reduce((sum, b) => sum + Number(b.limit_amount), 0) || 0
        const readyToAssign = income - totalBudgeted

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
            
            const dayExpenses = txData?.filter(t => t.date === dateStr && t.type === 'expense')
                .reduce((sum, t) => sum + Number(t.amount), 0) || 0

            weeklyData.push({
               label: d.toLocaleDateString('en-US', { weekday: 'short' }),
               amount: dayExpenses
            })
        }

        setData({
           totalIncome: income,
           totalExpense: expense,
           totalBalance: income - expense,
           totalLentOut: lentOut,
           readyToAssign: readyToAssign,
           recentTransactions: txData?.slice(0, 5) || [],
           weeklyData,
           categoriesSpends
        })
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  return { data, loading, error }
}
