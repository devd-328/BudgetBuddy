import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDebts } from '../hooks/useDebts'
import toast from 'react-hot-toast'

export default function Borrow() {
  const { user, profile } = useAuth()
  const { debts, loading, theyOweYou, youOwe, updateStatus, addDebt } = useDebts(user?.id)
  
  const [activeTab, setActiveTab] = useState('lent') // 'lent' | 'owed' | 'settled'
  const [showAddForm, setShowAddForm] = useState(false)
  const currency = profile?.currency || '$'

  // Add Form State
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
         status: 'pending' // default
      })
      toast.success('Record added successfully')
      setShowAddForm(false)
      // Reset form
      setNewPerson('')
      setNewAmount('')
      setNewReason('')
      setNewType('lent')
    } catch (err) {
      toast.error('Failed to save record')
    } finally {
      setFormLoading(false)
    }
  }

  // Filter lists based on tab
  const filteredDebts = debts.filter(d => {
     if (activeTab === 'settled') return d.status === 'settled'
     if (activeTab === 'lent') return d.type === 'lent' && d.status !== 'settled'
     if (activeTab === 'owed') return d.type === 'owed' && d.status !== 'settled'
     return false
  })

  return (
    <div className="page-enter pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Borrow & Lend</h1>
        <button 
           onClick={() => setShowAddForm(true)} 
           className="bg-accent/20 text-accent font-bold px-3 py-1.5 rounded-full text-sm flex items-center gap-2 active:scale-95 transition-transform"
        >
           <span>+</span> New Entry
        </button>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 gap-4 mb-6">
         <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center drop-shadow-sm">
            <p className="text-[11px] text-income font-medium tracking-wide mb-1 flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-income"></span>
               THEY OWE YOU
            </p>
            <p className="text-xl font-bold">{currency}{theyOweYou.toFixed(2)}</p>
         </div>
         <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center drop-shadow-sm">
            <p className="text-[11px] text-expense font-medium tracking-wide mb-1 flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-expense"></span>
               YOU OWE
            </p>
            <p className="text-xl font-bold">{currency}{youOwe.toFixed(2)}</p>
         </div>
      </div>

      {/* Dynamic Tabs */}
      <div className="flex bg-white/5 p-1 rounded-full mb-6 relative">
         <button 
            onClick={() => setActiveTab('lent')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full z-10 transition-colors ${activeTab === 'lent' ? 'bg-white/10 text-white shadow' : 'text-white/40'}`}
         >
            Lent Out
         </button>
         <button 
            onClick={() => setActiveTab('owed')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full z-10 transition-colors ${activeTab === 'owed' ? 'bg-white/10 text-white shadow' : 'text-white/40'}`}
         >
            I Owe
         </button>
         <button 
            onClick={() => setActiveTab('settled')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full z-10 transition-colors ${activeTab === 'settled' ? 'bg-white/10 text-white shadow' : 'text-white/40'}`}
         >
            Settled
         </button>
      </div>

      {/* List Ledger */}
      {loading ? (
        <div className="flex justify-center p-10">
           <span className="loader w-8 h-8 border-4 border-white/20 border-t-accent rounded-full animate-spin"></span>
        </div>
      ) : filteredDebts.length === 0 ? (
        <div className="text-center py-10 bg-white/5 border border-white/5 rounded-2xl">
           <span className="text-4xl mb-2 block">🤝</span>
           <p className="text-sm text-white/50">No records found for this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
           {filteredDebts.map(debt => (
              <div key={debt.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-accent shrink-0 uppercase tracking-widest text-xs">
                       {debt.person_name.substring(0, 2)}
                    </div>
                    <div>
                       <h3 className="font-semibold text-sm max-w-[120px] truncate">{debt.person_name}</h3>
                       <p className="text-[10px] text-white/40 max-w-[120px] truncate mt-0.5">{debt.reason}</p>
                    </div>
                 </div>

                 <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <p className={`font-bold text-sm ${debt.type === 'lent' ? 'text-income' : 'text-expense'} ${debt.status === 'settled' ? 'opacity-50 line-through' : ''}`}>
                       {currency}{Number(debt.amount).toFixed(2)}
                    </p>
                    <button 
                       onClick={() => handleToggleStatus(debt.id, debt.status)}
                       className={`text-[10px] uppercase font-bold border px-2 py-0.5 rounded transition-transform active:scale-95 ${
                         debt.status === 'pending' ? 'border-expense text-expense' :
                         debt.status === 'partial' ? 'border-accent text-accent' :
                         'border-white/20 text-white/40'
                       }`}
                    >
                       {debt.status}
                    </button>
                    <p className="text-[10px] text-white/30">{new Date(debt.date).toLocaleDateString()}</p>
                 </div>
              </div>
           ))}
        </div>
      )}

      {/* Add New Form Modal */}
      {showAddForm && (
         <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1a1a2e]/90 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a2e] w-full max-w-sm rounded-[32px] p-6 border border-white/10 mb-4 animate-[slideUp_0.3s_ease-out]">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold">Log Record</h2>
                  <button onClick={() => setShowAddForm(false)} className="text-white/40 text-xl font-bold leading-none p-2">&times;</button>
               </div>

               <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div className="flex bg-white/5 rounded-full p-1">
                     <button
                        type="button"
                        onClick={() => setNewType('lent')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-colors ${newType === 'lent' ? 'bg-income text-[#1a1a2e]' : 'text-white/50'}`}
                     >
                        I Lent To
                     </button>
                     <button
                        type="button"
                        onClick={() => setNewType('owed')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-colors ${newType === 'owed' ? 'bg-expense text-white' : 'text-white/50'}`}
                     >
                        I Borrowed From
                     </button>
                  </div>

                  <input
                     type="text"
                     placeholder="Person's Name"
                     value={newPerson}
                     onChange={(e) => setNewPerson(e.target.value)}
                     className="input-field"
                     required
                  />

                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">{currency}</span>
                     <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="input-field pl-10"
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
                     className="input-field w-full"
                     required
                  />

                  <button type="submit" className="btn-primary w-full mt-2 h-[48px] flex items-center justify-center" disabled={formLoading}>
                     {formLoading ? <span className="loader w-5 h-5 border-2 border-[#1a1a2e]/20 border-t-[#1a1a2e] rounded-full animate-spin"></span> : 'Save Record'}
                  </button>
               </form>
            </div>
         </div>
      )}

    </div>
  )
}
