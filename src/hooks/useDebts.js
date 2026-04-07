import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useDebts(userId) {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDebts = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (error) throw error
      setDebts(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchDebts()
  }, [fetchDebts])

  // Total you are owed = sum of remaining balances of all active Lent records
  const theyOweYou = debts
    .filter(d => d.type === 'lent' && d.status !== 'settled')
    .reduce((sum, d) => sum + Number(d.remaining_amount !== null ? d.remaining_amount : d.amount), 0)

  // Total you owe = sum of remaining balances of all active Borrowed records
  const youOwe = debts
    .filter(d => d.type === 'owed' && d.status !== 'settled')
    .reduce((sum, d) => sum + Number(d.remaining_amount !== null ? d.remaining_amount : d.amount), 0)

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('debts')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) throw error
      await fetchDebts()
    } catch (err) {
      console.error('Update status failed: ', err)
      throw err
    }
  }

  const addDebt = async (debtData) => {
    try {
      const { error } = await supabase
        .from('debts')
        .insert([{ 
          user_id: userId, 
          ...debtData,
          remaining_amount: debtData.amount,
          repayments: [],
          status: 'active'
        }])
      if (error) throw error
      await fetchDebts()
    } catch (err) {
      console.error('Insert debt failed: ', err)
      throw err
    }
  }

  const addRepayment = async (debtId, amount, date = new Date().toISOString().split('T')[0]) => {
    try {
      const debt = debts.find(d => d.id === debtId)
      if (!debt) throw new Error('Debt record not found')

      const currentRepayments = Array.isArray(debt.repayments) ? debt.repayments : []
      const newRepayments = [...currentRepayments, { amount, date }]
      const currentRemaining = debt.remaining_amount !== null ? Number(debt.remaining_amount) : Number(debt.amount)
      const newRemainingAmount = Math.max(0, currentRemaining - Number(amount))
      const newStatus = newRemainingAmount <= 0 ? 'settled' : 'active'

      const { error } = await supabase
        .from('debts')
        .update({
          repayments: newRepayments,
          remaining_amount: newRemainingAmount,
          status: newStatus
        })
        .eq('id', debtId)

      if (error) throw error
      await fetchDebts()
      return { settled: newStatus === 'settled', remaining: newRemainingAmount }
    } catch (err) {
      console.error('Add repayment failed: ', err)
      throw err
    }
  }

  return { 
    debts, 
    loading, 
    theyOweYou, 
    youOwe, 
    updateStatus, 
    addDebt, 
    addRepayment,
    refetch: fetchDebts 
  }
}
