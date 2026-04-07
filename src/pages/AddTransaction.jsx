import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Mic, Utensils, Bus, BookOpen, Heart, ShoppingBag, 
  Gamepad2, Zap, Plus, Briefcase, Laptop, Gift, TrendingUp, Coins, ChevronDown, Check
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCategoriesAndBudgets } from '../hooks/useCategoriesAndBudgets'
import { supabase } from '../lib/supabase'
import { categorizeTransaction } from '../lib/groq'
import CustomToast from '../components/ui/CustomToast'

const EXPENSE_CATEGORIES = [
  { name: 'Food',          icon: Utensils,    color: '#34D399' },
  { name: 'Transport',     icon: Bus,         color: '#60A5FA' },
  { name: 'Education',     icon: BookOpen,    color: '#FB923C' },
  { name: 'Health',        icon: Heart,       color: '#FB7185' },
  { name: 'Shopping',      icon: ShoppingBag, color: '#FBBF24' },
  { name: 'Entertainment', icon: Gamepad2,    color: '#A78BFA' },
  { name: 'Bills',         icon: Zap,         color: '#2DD4BF' },
  { name: 'Custom',        icon: Plus,        color: '#5A5A6E' },
]

const INCOME_CATEGORIES = [
  { name: 'Salary',        icon: Briefcase,   color: '#34D399' },
  { name: 'Freelance',     icon: Laptop,      color: '#60A5FA' },
  { name: 'Gift',          icon: Gift,        color: '#FBBF24' },
  { name: 'Business',      icon: TrendingUp,  color: '#818CF8' },
  { name: 'Other Income',  icon: Coins,       color: '#A78BFA' },
]

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
]

export default function AddTransaction() {
  const { user, profile } = useAuth()
  const { categories, budgets, refetch } = useCategoriesAndBudgets(user?.id)

  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name)
  const [description, setDescription] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isListening, setIsListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isCategorizing, setIsCategorizing] = useState(false)
  
  // Allocation state
  const [isAllocating, setIsAllocating] = useState(false)
  const [allocations, setAllocations] = useState({}) // categoryName -> amount

  const amountRef = useRef(null)
  const currency = profile?.currency || 'Rs'

  const activeCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  useEffect(() => {
    setCategory(activeCategories[0].name)
  }, [type])

  useEffect(() => {
    if (amountRef.current) amountRef.current.focus()
  }, [])

  // Voice Input
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      CustomToast.error('Not Supported', 'Voice input is not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      CustomToast.info('Listening...', 'Try saying something like "Lunch for 500"')
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
        CustomToast.success('Input Parsed', `Added ${parsedDesc || 'transaction'} for ${currency}${parsedAmount}`)
      } else {
        setDescription(transcript.charAt(0).toUpperCase() + transcript.slice(1))
        CustomToast.warning('Amount Missing', 'We caught the description but couldn\'t find a number.')
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error)
      if (event.error !== 'no-speech') {
        CustomToast.error('Voice Error', 'Microphone access denied or error occurred.')
      }
    }

    recognition.onend = () => setIsListening(false)
    recognition.start()
  }
  const handleAutoCategorize = async () => {
    if (type !== 'expense' || !description.trim() || description.length < 3) return
    
    setIsCategorizing(true)
    try {
      const suggestedCategory = await categorizeTransaction(description)
      if (suggestedCategory && suggestedCategory !== 'Other') {
        // Check if it's a valid category in our list
        const exists = EXPENSE_CATEGORIES.some(c => c.name === suggestedCategory)
        if (exists) {
          setCategory(suggestedCategory)
          CustomToast.info('Auto-Categorized', `AI suggested "${suggestedCategory}" for this transaction.`, { duration: 2000 })
        }
      }
    } catch (err) {
      console.error('Auto-categorization error:', err)
    } finally {
      setIsCategorizing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      return CustomToast.error('Invalid Amount', 'Please enter a valid amount greater than zero.')
    }
    if (!description) {
      return CustomToast.error('Description Required', 'Please enter a description for this transaction.')
    }

    if (type === 'income' && isAllocating) {
      const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + (Number(val) || 0), 0)
      if (totalAllocated > Number(amount)) {
        return CustomToast.error('Over Allocation', 'Total allocation cannot exceed the income amount.')
      }
    }

    setLoading(true)
    try {
      // 1. Save Transaction
      const { error: txError } = await supabase.from('transactions').insert([
        { user_id: user.id, type, amount: Number(amount), category, description, note, date }
      ])
      if (txError) throw txError

      // 2. Handle Allocations (Budgets)
      if (type === 'income' && isAllocating) {
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()

        const allocationPromises = Object.entries(allocations).map(async ([catName, allocAmount]) => {
          if (Number(allocAmount) <= 0) return

          const cat = categories.find(c => c.name === catName)
          if (!cat) return

          const existingBudget = budgets.find(b => b.category_id === cat.id)
          
          if (existingBudget) {
            return supabase
              .from('budgets')
              .update({ limit_amount: Number(existingBudget.limit_amount) + Number(allocAmount) })
              .eq('id', existingBudget.id)
          } else {
            return supabase
              .from('budgets')
              .insert([{ 
                user_id: user.id, 
                category_id: cat.id, 
                limit_amount: Number(allocAmount),
                month: currentMonth,
                year: currentYear
              }])
          }
        })

        await Promise.all(allocationPromises)
        refetch()
      }

      CustomToast.success('Transaction Saved', 'Your transaction has been recorded successfully.')
      navigate('/')
    } catch (err) {
      console.error(err)
      CustomToast.error('Save Failed', err.message || 'An error occurred while saving.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    const hasData = amount || description || note || isAllocating
    if (!hasData) return

    CustomToast.confirm(
      'Reset form?',
      'This will clear all current input fields. You cannot undo this.',
      () => {
        setAmount('')
        setDescription('')
        setNote('')
        setAllocations({})
        setIsAllocating(false)
        CustomToast.success('Form reset')
      },
      null,
      'Reset',
      'Cancel'
    )
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
        <h1 className="text-xl font-bold tracking-tight text-txt-bright">Add New</h1>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Type Toggle */}
        <div className="flex bg-interactive/50 p-1 rounded-2xl border border-border-subtle mb-8">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300
                ${type === opt.value 
                  ? 'bg-card text-txt-primary shadow-glow-accent border border-accent/20' 
                  : 'text-txt-muted hover:text-txt-secondary'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

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
                         outline-none w-48 text-left placeholder:text-txt-muted/20"
              placeholder="0"
              required
            />
          </div>
          {/* Subtle accent line under amount */}
          <div className={`mx-auto mt-4 h-1 w-24 rounded-full ${type === 'expense' ? 'bg-expense/40 shadow-glow-expense' : 'bg-income/40 shadow-glow-income'}`} />
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="overline text-txt-muted">{type === 'income' ? 'Income Source' : 'Category'}</p>
            {isCategorizing && (
              <div className="flex items-center gap-1.5 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest">AI Categorizing...</span>
              </div>
            )}
          </div>
          <div className="flex overflow-x-auto pb-4 gap-3 scrollbar-hide snap-x">
            {activeCategories.map(cat => {
              const Icon = cat.icon
              const isSelected = category === cat.name

              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`snap-start shrink-0 flex flex-col items-center gap-2 p-3.5 rounded-2xl border w-[80px]
                    transition-all duration-300 ease-out-expo
                    ${isSelected
                      ? 'bg-card border-accent/40 shadow-glow-accent ring-1 ring-accent/20'
                      : 'bg-card/40 border-border-subtle hover:bg-interactive/40'
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center
                      transition-all duration-300 ${isSelected ? 'scale-110 rotate-3 shadow-lg' : ''}`}
                    style={{ 
                      backgroundColor: isSelected ? `${cat.color}25` : `${cat.color}10`,
                      boxShadow: isSelected ? `0 0 15px ${cat.color}30` : 'none'
                    }}
                  >
                    <Icon size={18} style={{ color: cat.color }} strokeWidth={isSelected ? 2.5 : 1.5} />
                  </div>
                  <span className={`text-[10px] truncate w-full text-center font-bold tracking-tight
                    ${isSelected ? 'text-txt-primary' : 'text-txt-muted'}`}>
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Allocation System */}
        {type === 'income' && Number(amount) > 0 && (
          <div className="mb-8 bg-card border border-border-subtle rounded-2xl p-5 animate-fade-in shadow-xl shadow-canvas/50">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-txt-primary">Allocate to Budgets</h3>
                <p className="text-2xs text-txt-muted mt-0.5">Distribute this income into your category budgets</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAllocating(!isAllocating)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95
                  ${isAllocating ? 'bg-income text-canvas shadow-income/20' : 'bg-interactive text-txt-muted'}`}
              >
                {isAllocating ? <Check size={18} strokeWidth={3} /> : <Plus size={18} />}
              </button>
            </div>

            {isAllocating && (
              <div className="space-y-4 animate-scale-in origin-top">
                <div className="grid grid-cols-1 gap-3">
                  {EXPENSE_CATEGORIES.filter(c => c.name !== 'Custom').map(cat => (
                    <div key={cat.name} className="flex items-center gap-3 bg-interactive/20 p-3 rounded-xl border border-border-subtle/30 group hover:border-accent/30 transition-colors">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                           style={{ backgroundColor: `${cat.color}15` }}>
                        <cat.icon size={16} style={{ color: cat.color }} />
                      </div>
                      <span className="text-xs font-bold text-txt-secondary flex-1">{cat.name}</span>
                      <div className="relative w-32">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-muted text-2xs font-bold font-mono">{currency}</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={allocations[cat.name] || ''}
                          onChange={(e) => setAllocations({ ...allocations, [cat.name]: e.target.value })}
                          className="w-full bg-canvas border border-border-subtle rounded-lg py-2 pl-8 pr-2 text-xs font-bold font-mono text-right outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-border-subtle flex justify-between items-center">
                  <span className="text-2xs font-bold text-txt-muted uppercase tracking-[0.1em]">Remaining to Assign</span>
                  <div className="flex flex-col items-end">
                    <span className={`font-mono text-base font-black ${
                      (Number(amount) - Object.values(allocations).reduce((s,v) => s + (Number(v)||0), 0)) < 0 
                      ? 'text-expense' 
                      : 'text-income'
                    }`}>
                      {currency}{(Number(amount) - Object.values(allocations).reduce((s,v) => s + (Number(v)||0), 0)).toLocaleString()}
                    </span>
                    {(Number(amount) - Object.values(allocations).reduce((s,v) => s + (Number(v)||0), 0)) < 0 && (
                      <span className="text-[10px] text-expense font-bold animate-pulse">Exceeds Income!</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4 mb-10">
          <div className="relative group">
            <input
              type="text"
              placeholder="Description (e.g. Lunch with friends)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleAutoCategorize}
              className="input-field pr-12 h-14 text-sm font-medium"
              required
            />
            <button
              type="button"
              onClick={startVoiceInput}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center
                transition-all duration-300 shadow-sm
                ${isListening
                  ? 'bg-expense text-canvas animate-pulse scale-110'
                  : 'bg-interactive text-txt-muted hover:text-accent hover:bg-accent/10'
                }`}
            >
              <Mic size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="overline ml-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field font-mono text-xs h-12"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="overline ml-1">Extra Note</label>
              <input
                type="text"
                placeholder="Details..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input-field h-12 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 h-14 rounded-2xl border border-border-subtle bg-card text-txt-muted font-bold hover:bg-interactive transition-colors"
            disabled={loading}
          >
            Reset
          </button>
          <button
            type="submit"
            className="flex-[2] btn-primary h-14 flex items-center justify-center text-sm font-bold shadow-xl shadow-accent/20 active:scale-[0.98] transition-transform"
            disabled={loading}
          >
            {loading
              ? <div className="w-6 h-6 border-3 border-canvas/20 border-t-canvas rounded-full animate-spin" />
              : `Save ${type === 'income' ? 'Income' : 'Expense'}`}
          </button>
        </div>
      </form>
    </div>
  )
}
