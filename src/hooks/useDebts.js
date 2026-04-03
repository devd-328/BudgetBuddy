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

  const theyOweYou = debts
    .filter(d => d.type === 'lent' && d.status !== 'settled')
    .reduce((sum, d) => sum + Number(d.amount), 0)

  const youOwe = debts
    .filter(d => d.type === 'owed' && d.status !== 'settled')
    .reduce((sum, d) => sum + Number(d.amount), 0)

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
        .insert([{ user_id: userId, ...debtData }])
      if (error) throw error
      await fetchDebts()
    } catch (err) {
      console.error('Insert debt failed: ', err)
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
    refetch: fetchDebts 
  }
}
