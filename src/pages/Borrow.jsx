import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, X, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDebts } from '../hooks/useDebts'
import CustomToast from '../components/ui/CustomToast'

import Card from '../components/ui/Card'
import SegmentedControl from '../components/ui/SegmentedControl'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/EmptyState'

const TAB_OPTIONS = [
  { value: 'lent',    label: 'Lent Out' },
  { value: 'owed',    label: 'I Owe' },
  { value: 'settled', label: 'Settled' },
]

const TYPE_OPTIONS = [
  { value: 'lent', label: 'I Lent' },
  { value: 'owed', label: 'I Borrowed' },
]

const STATUS_STYLES = {
  pending: 'border-expense/30 bg-expense/10 text-expense shadow-glow-expense/10',
  partial: 'border-accent/30 bg-accent/10 text-accent shadow-glow-accent/10',
  settled: 'border-border-subtle bg-interactive/50 text-txt-muted opacity-60',
}

export default function Borrow() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { debts, loading, theyOweYou, youOwe, updateStatus, addDebt } = useDebts(user?.id)

  const [activeTab, setActiveTab] = useState('lent')
  const [showAddForm, setShowAddForm] = useState(false)
  const currency = profile?.currency || 'Rs'

  // Form State
  const [newPerson, setNewPerson] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newType, setNewType] = useState('lent')
  const [newReason, setNewReason] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [formLoading, setFormLoading] = useState(false)

  const handleToggleStatus = async (id, currentStatus) => {
    let nextStatus = 'pending'
    if (currentStatus === 'pending') nextStatus = 'partial'
    else if (currentStatus === 'partial') nextStatus = 'settled'

    try {
      await updateStatus(id, nextStatus)
      CustomToast.success('Status Updated', `Record marked as ${nextStatus}.`)
    } catch (err) {
      CustomToast.error('Update Failed', 'An error occurred while updating the status.')
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!newPerson || !newAmount) {
      return CustomToast.warning('Missing Info', 'Please enter a name and amount to continue.')
    }

    setFormLoading(true)
    try {
      await addDebt({
        person_name: newPerson,
        amount: Number(newAmount),
        type: newType,
        reason: newReason || 'No reason provided',
        date: newDate,
        status: 'pending',
      })
      CustomToast.success('Record Added', `Successfully logged debt for ${newPerson}.`)
      setShowAddForm(false)
      setNewPerson(''); setNewAmount(''); setNewReason(''); setNewType('lent')
    } catch (err) {
      CustomToast.error('Save Failed', 'An error occurred while saving the record.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleReset = () => {
    const hasData = newAmount || newPerson || newReason
    if (!hasData) return

    CustomToast.confirm(
      'Reset record?',
      'This will clear all current input fields. You cannot undo this.',
      () => {
        setNewAmount('')
        setNewPerson('')
        setNewReason('')
        CustomToast.success('Form reset')
      },
      null,
      'Reset',
      'Cancel'
    )
  }

  const filteredDebts = debts.filter(d => {
    if (activeTab === 'settled') return d.status === 'settled'
    if (activeTab === 'lent') return d.type === 'lent' && d.status !== 'settled'
    if (activeTab === 'owed') return d.type === 'owed' && d.status !== 'settled'
    return false
  })

  return (
    <div className="page-enter pb-24 text-txt-bright">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-interactive border border-border-subtle 
                       hover:bg-elevated hover:border-border transition-all duration-fast
                       text-txt-muted hover:text-txt-primary"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Borrow & Lend</h1>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="w-10 h-10 rounded-xl bg-accent text-canvas shadow-lg shadow-accent/20 flex items-center justify-center 
                     hover:bg-accent-hover transition-all duration-fast active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card padding="compact" className="bg-card/40 border-border-subtle shadow-xl shadow-canvas/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-6 h-6 rounded-lg bg-income/10 flex items-center justify-center">
              <ArrowUpRight size={14} strokeWidth={2.5} className="text-income" />
            </div>
            <span className="overline text-txt-muted text-[10px]">They Owe You</span>
          </div>
          <p className="font-mono text-xl font-black text-income tracking-tight px-1">
            {currency}{theyOweYou.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </p>
        </Card>
        <Card padding="compact" className="bg-card/40 border-border-subtle shadow-xl shadow-canvas/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-6 h-6 rounded-lg bg-expense/10 flex items-center justify-center">
              <ArrowDownLeft size={14} strokeWidth={2.5} className="text-expense" />
            </div>
            <span className="overline text-txt-muted text-[10px]">You Owe</span>
          </div>
          <p className="font-mono text-xl font-black text-expense tracking-tight px-1">
            {currency}{youOwe.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <SegmentedControl
        options={TAB_OPTIONS}
        value={activeTab}
        onChange={setActiveTab}
        className="mb-8"
      />

      {/* List */}
      {loading ? (
        <Skeleton variant="card" count={3} />
      ) : filteredDebts.length === 0 ? (
        <EmptyState
          illustration="debts"
          title="No records here"
          message="Start tracking who owes you and who you owe."
          action={{ label: 'Log New Debt', onClick: () => setShowAddForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filteredDebts.map(debt => (
            <Card key={debt.id} variant="interactive" padding="compact" className="shadow-xl shadow-canvas/50">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 
                                flex items-center justify-center font-black text-accent text-xs 
                                uppercase tracking-widest shrink-0 shadow-sm">
                   {debt.person_name.substring(0, 2)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-1">
                  <h3 className="text-sm font-bold text-txt-primary truncate">{debt.person_name}</h3>
                  <p className="text-2xs text-txt-muted truncate mt-0.5 font-medium italic opacity-80">
                    {debt.reason || 'No description'}
                  </p>
                </div>

                {/* Amount + Status */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className={`font-mono text-sm font-black tracking-tight
                    ${debt.type === 'lent' ? 'text-income' : 'text-expense'}
                    ${debt.status === 'settled' ? 'opacity-40 line-through' : ''}`}>
                    {currency}{Number(debt.amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                  <button
                    onClick={() => handleToggleStatus(debt.id, debt.status)}
                    className={`text-[10px] uppercase font-black border px-2.5 py-1 rounded-xl shadow-sm
                      transition-all duration-300 hover:brightness-110 active:scale-95
                      ${STATUS_STYLES[debt.status]}`}
                  >
                    {debt.status}
                  </button>
                  <p className="text-[10px] text-txt-muted font-bold font-mono opacity-50">
                    {new Date(debt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ Bottom Sheet Form ═══ */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-canvas/90 backdrop-blur-md"
             onClick={(e) => e.target === e.currentTarget && setShowAddForm(false)}>
          <div className="bg-card w-full max-w-sm rounded-t-[2.5rem] p-8 border-t border-x border-border-subtle 
                          animate-slide-up shadow-[0_-25px_50px_-12px_rgba(0,0,0,0.5)]">
            {/* Handle */}
            <div className="w-12 h-1.5 bg-border-subtle rounded-full mx-auto mb-8 opacity-40" />

            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black tracking-tight text-txt-bright">Log New Debt</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-10 h-10 rounded-xl bg-interactive/50 text-txt-muted hover:text-txt-primary transition-all duration-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-6">
              <SegmentedControl
                options={TYPE_OPTIONS}
                value={newType}
                onChange={setNewType}
              />

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="overline ml-1">Person's Name</label>
                  <input
                    type="text"
                    placeholder="Who is this with?"
                    value={newPerson}
                    onChange={(e) => setNewPerson(e.target.value)}
                    className="input-field h-13 font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="overline ml-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted font-mono text-sm font-bold">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="input-field pl-9 font-black font-mono h-13"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="overline ml-1">Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="input-field font-mono text-xs h-13"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="overline ml-1">Reason</label>
                    <input
                      type="text"
                      placeholder="Lunch, taxi..."
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                      className="input-field h-13 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 h-12 rounded-xl border border-border-subtle bg-canvas text-txt-muted font-bold hover:bg-interactive transition-colors"
                  disabled={formLoading}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="flex-[2] btn-primary h-12 flex items-center justify-center font-bold"
                  disabled={formLoading}
                >
                  {formLoading
                    ? <div className="w-5 h-5 border-2 border-canvas/20 border-t-canvas rounded-full animate-spin" />
                    : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
