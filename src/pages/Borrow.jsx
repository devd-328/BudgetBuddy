import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDebts } from '../hooks/useDebts'
import toast from 'react-hot-toast'

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
  { value: 'lent', label: 'I Lent To' },
  { value: 'owed', label: 'I Borrowed From' },
]

const STATUS_STYLES = {
  pending: 'border-expense/30 bg-expense-tint text-expense',
  partial: 'border-accent/30 bg-accent-tint text-accent',
  settled: 'border-border-subtle bg-interactive text-txt-muted',
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
      toast.success(`Marked as ${nextStatus}`)
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!newPerson || !newAmount) return toast.error('Name and Amount required')

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
      toast.success('Record added')
      setShowAddForm(false)
      setNewPerson(''); setNewAmount(''); setNewReason(''); setNewType('lent')
    } catch (err) {
      toast.error('Failed to save record')
    } finally {
      setFormLoading(false)
    }
  }

  const filteredDebts = debts.filter(d => {
    if (activeTab === 'settled') return d.status === 'settled'
    if (activeTab === 'lent') return d.type === 'lent' && d.status !== 'settled'
    if (activeTab === 'owed') return d.type === 'owed' && d.status !== 'settled'
    return false
  })

  return (
    <div className="page-enter pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-interactive border border-border-subtle 
                       hover:bg-elevated hover:border-border transition-[background,border-color] duration-fast
                       text-txt-muted hover:text-txt-primary"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Borrow & Lend</h1>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-ghost flex items-center gap-1.5"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card padding="compact">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-income-tint flex items-center justify-center">
              <ArrowUpRight size={12} className="text-income" />
            </div>
            <span className="overline">They Owe You</span>
          </div>
          <p className="font-mono text-xl font-bold text-txt-primary tracking-tight">
            {currency}{theyOweYou.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card padding="compact">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-expense-tint flex items-center justify-center">
              <ArrowDownLeft size={12} className="text-expense" />
            </div>
            <span className="overline">You Owe</span>
          </div>
          <p className="font-mono text-xl font-bold text-txt-primary tracking-tight">
            {currency}{youOwe.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <SegmentedControl
        options={TAB_OPTIONS}
        value={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {/* List */}
      {loading ? (
        <Skeleton variant="card" count={3} />
      ) : filteredDebts.length === 0 ? (
        <EmptyState
          illustration="debts"
          title="No records here"
          message="Start tracking who owes you and who you owe."
          action={{ label: 'Add Record', onClick: () => setShowAddForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
          {filteredDebts.map(debt => (
            <Card key={debt.id} variant="interactive" padding="compact">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-interactive border border-border-subtle 
                                flex items-center justify-center font-bold text-accent text-xs 
                                uppercase tracking-widest shrink-0">
                  {debt.person_name.substring(0, 2)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-txt-primary truncate">{debt.person_name}</h3>
                  <p className="text-2xs text-txt-muted truncate mt-0.5">{debt.reason}</p>
                </div>

                {/* Amount + Status */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <p className={`font-mono text-sm font-bold tracking-tight
                    ${debt.type === 'lent' ? 'text-income' : 'text-expense'}
                    ${debt.status === 'settled' ? 'opacity-40 line-through' : ''}`}>
                    {currency}{Number(debt.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <button
                    onClick={() => handleToggleStatus(debt.id, debt.status)}
                    className={`text-2xs uppercase font-bold border px-2 py-0.5 rounded-md
                      transition-[transform,background] duration-fast active:scale-95
                      ${STATUS_STYLES[debt.status]}`}
                  >
                    {debt.status}
                  </button>
                  <p className="text-2xs text-txt-muted font-mono">
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-canvas/90 backdrop-blur-sm"
             onClick={(e) => e.target === e.currentTarget && setShowAddForm(false)}>
          <div className="bg-elevated w-full max-w-sm rounded-t-3xl p-6 border-t border-x border-border-subtle 
                          animate-slide-up">
            {/* Handle */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold tracking-tight">Log Record</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1.5 rounded-lg hover:bg-interactive text-txt-muted hover:text-txt-primary transition-colors duration-fast"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <SegmentedControl
                options={TYPE_OPTIONS}
                value={newType}
                onChange={setNewType}
              />

              <input
                type="text"
                placeholder="Person's Name"
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                className="input-field"
                required
              />

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted font-mono text-sm">{currency}</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="input-field pl-8 font-mono"
                  required
                />
              </div>

              <input
                type="text"
                placeholder="Reason (Optional)"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="input-field"
              />

              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="input-field font-mono text-sm"
                required
              />

              <button
                type="submit"
                className="btn-primary w-full h-12 flex items-center justify-center"
                disabled={formLoading}
              >
                {formLoading
                  ? <div className="w-5 h-5 border-2 border-canvas/20 border-t-canvas rounded-full animate-spin" />
                  : 'Save Record'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
