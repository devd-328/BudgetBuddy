import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mic, Utensils, Bus, BookOpen, Heart, ShoppingBag, Gamepad2, Zap, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

import SegmentedControl from '../components/ui/SegmentedControl'

const CATEGORIES = [
  { name: 'Food',          icon: Utensils,    color: '#34D399' },
  { name: 'Transport',     icon: Bus,         color: '#60A5FA' },
  { name: 'Education',     icon: BookOpen,    color: '#FB923C' },
  { name: 'Health',        icon: Heart,       color: '#FB7185' },
  { name: 'Shopping',      icon: ShoppingBag, color: '#FBBF24' },
  { name: 'Entertainment', icon: Gamepad2,    color: '#A78BFA' },
  { name: 'Bills',         icon: Zap,         color: '#2DD4BF' },
  { name: 'Custom',        icon: Plus,        color: '#5A5A6E' },
]

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
]

export default function AddTransaction() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0].name)
  const [description, setDescription] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isListening, setIsListening] = useState(false)
  const [loading, setLoading] = useState(false)

  const amountRef = useRef(null)
  const currency = profile?.currency || 'Rs'

  useEffect(() => {
    if (amountRef.current) amountRef.current.focus()
  }, [])

  // Voice Input
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.')
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
      const numMatch = transcript.match(/\d+([.,]\d+)?/)

      if (numMatch) {
        const parsedAmount = numMatch[0].replace(',', '.')
        let rawDesc = transcript.replace(numMatch[0], '')
          .replace(/\b(for|cost|bucks|rupees|dollars|rs)\b/gi, '').trim()
        rawDesc = rawDesc.replace(/^[^a-zA-Z0-9]+/, '').trim()
        const parsedDesc = rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1)

        setAmount(parsedAmount)
        setDescription(parsedDesc || 'Voice Input')
        toast.success('Parsed successfully!')
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

    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return toast.error('Please enter a valid amount')
    if (!description) return toast.error('Please enter a description')

    setLoading(true)
    try {
      const { error } = await supabase.from('transactions').insert([
        { user_id: user.id, type, amount: Number(amount), category, description, note, date }
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-interactive border border-border-subtle 
                     hover:bg-elevated hover:border-border transition-[background,border-color] duration-fast
                     text-txt-muted hover:text-txt-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Add New</h1>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Type Toggle */}
        <SegmentedControl
          options={TYPE_OPTIONS}
          value={type}
          onChange={setType}
          className="mb-8"
        />

        {/* Hero Amount */}
        <div className="text-center mb-10">
          <p className="overline mb-3">Amount</p>
          <div className="flex justify-center items-baseline">
            <span className="text-4xl font-bold text-txt-muted mr-2 font-mono">{currency}</span>
            <input
              ref={amountRef}
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-5xl font-black text-txt-bright font-mono tracking-tighter 
                         outline-none w-40 text-left placeholder:text-txt-muted/30"
              placeholder="0"
              required
            />
          </div>
          {/* Subtle accent line under amount */}
          <div className={`mx-auto mt-2 h-px w-32 ${type === 'expense' ? 'bg-expense/30' : 'bg-income/30'}`} />
        </div>

        {/* Categories */}
        <div className="mb-6">
          <p className="overline mb-3">Category</p>
          <div className="flex overflow-x-auto pb-3 gap-2 scrollbar-hide">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              const isSelected = category === cat.name

              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`snap-start shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl border w-[72px]
                    transition-[background,border-color,transform] duration-fast ease-out-expo
                    ${isSelected
                      ? 'bg-card border-accent/40 shadow-glow-accent'
                      : 'bg-interactive/50 border-border-subtle hover:bg-interactive'
                    }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center
                      transition-transform duration-fast ${isSelected ? 'scale-110' : ''}`}
                    style={{ backgroundColor: `${cat.color}${isSelected ? '20' : '10'}` }}
                  >
                    <Icon size={16} style={{ color: cat.color }} strokeWidth={isSelected ? 2 : 1.5} />
                  </div>
                  <span className={`text-2xs truncate w-full text-center font-medium
                    ${isSelected ? 'text-txt-primary' : 'text-txt-muted'}`}>
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Form Fields */}
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
            <button
              type="button"
              onClick={startVoiceInput}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center
                transition-[background,color] duration-fast
                ${isListening
                  ? 'bg-expense/20 text-expense animate-pulse'
                  : 'bg-interactive text-txt-muted hover:text-txt-primary'
                }`}
            >
              <Mic size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field font-mono text-sm"
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

        <button
          type="submit"
          className="btn-primary w-full h-12 flex items-center justify-center text-sm"
          disabled={loading}
        >
          {loading
            ? <div className="w-5 h-5 border-2 border-canvas/20 border-t-canvas rounded-full animate-spin" />
            : 'Save Transaction'}
        </button>
      </form>
    </div>
  )
}
