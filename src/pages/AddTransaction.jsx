import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { name: 'Food', icon: '🍔' },
  { name: 'Transport', icon: '🚌' },
  { name: 'Education', icon: '📚' },
  { name: 'Health', icon: '💊' },
  { name: 'Shopping', icon: '🛍' },
  { name: 'Entertainment', icon: '🎮' },
  { name: 'Bills', icon: '💡' },
  { name: 'Custom', icon: '➕' },
]

export default function AddTransaction() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [type, setType] = useState('expense') // 'expense' | 'income'
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0].name)
  const [description, setDescription] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isListening, setIsListening] = useState(false)
  const [loading, setLoading] = useState(false)

  const amountRef = useRef(null)
  const currency = profile?.currency || '$'

  // Focus amount on mount
  useEffect(() => {
    if (amountRef.current) amountRef.current.focus()
  }, [])

  // Speech Recognition using native browser API
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser. Try Chrome/Safari.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      toast('Listening... (e.g. "Lunch for 500")', { icon: '🎙️', duration: 2500 })
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      // Extract numbers for amount
      const numMatch = transcript.match(/\d+([.,]\d+)?/)
      
      let parsedAmount = amount
      let parsedDesc = transcript

      if (numMatch) {
         parsedAmount = numMatch[0].replace(',', '.')
         // Strip out the amount and words like 'for', 'cost', 'bucks'
         let rawDesc = transcript.replace(numMatch[0], '')
              .replace(/\b(for|cost|bucks|rupees|dollars|rs)\b/gi, '').trim()
         
         // Clean up punctuation if it got left behind
         rawDesc = rawDesc.replace(/^[^a-zA-Z0-9]+/, '').trim()
         
         parsedDesc = rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1)
         
         setAmount(parsedAmount)
         setDescription(parsedDesc || 'Voice Input')
         toast.success('Successfully parsed amount!')
      } else {
         setDescription(transcript.charAt(0).toUpperCase() + transcript.slice(1))
         toast.error('Try speaking a number next time.')
      }
    }

    recognition.onerror = (event) => {
       console.error('Speech recognition error', event.error)
       if (event.error !== 'no-speech') {
         toast.error('Microphone access denied or error occurred.')
       }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return toast.error('Please enter a valid amount')
    if (!description) return toast.error('Please enter a description')

    setLoading(true)
    try {
      const { error } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          type,
          amount: Number(amount),
          category,
          description,
          note,
          date,
        }
      ])

      if (error) throw error

      toast.success('Transaction added!')
      navigate('/')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Error saving transaction.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold">Add New</h1>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* Type Toggle */}
        <div className="flex bg-white/5 rounded-full p-1 mb-8">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-2 text-sm font-semibold rounded-full transition-colors ${type === 'expense' ? 'bg-expense text-white' : 'text-white/50'}`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2 text-sm font-semibold rounded-full transition-colors ${type === 'income' ? 'bg-income text-white' : 'text-white/50'}`}
          >
            Income
          </button>
        </div>

        {/* Hero Amount Input */}
        <div className="text-center mb-8 relative">
          <p className="text-white/50 text-sm mb-2 drop-shadow">Amount</p>
          <div className="flex justify-center items-center">
            <span className="text-4xl font-bold text-white/40 mr-2">{currency}</span>
            <input
              ref={amountRef}
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-5xl font-bold text-white outline-none w-1/2 text-left placeholder:text-white/20"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">Category</p>
          <div className="flex overflow-x-auto pb-4 gap-3 snap-x scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setCategory(cat.name)}
                className={`snap-start shrink-0 flex flex-col items-center p-3 rounded-2xl border transition-all ${
                  category === cat.name 
                    ? 'bg-white/10 border-accent text-white shadow-lg shadow-accent/20' 
                    : 'bg-white/5 border-transparent text-white/60'
                }`}
                style={{ width: '80px' }}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-[10px] w-full truncate text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Details Fields */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Description (e.g. Lunch with friends)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field pr-12"
              required
            />
            {/* Voice Input Button placed inside Description input for convenience */}
            <button
               type="button"
               onClick={startVoiceInput}
               className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/10 text-white/50'}`}
            >
               <span className="text-sm">🎙️</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field w-full text-white/80"
                required
             />
             <input
                type="text"
                placeholder="Note (Optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input-field"
             />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full h-[48px] flex items-center justify-center" disabled={loading}>
            {loading ? <span className="loader shrink-0 inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Save Transaction'}
        </button>

      </form>
    </div>
  )
}
