import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Mic, Utensils, Bus, BookOpen, Heart, ShoppingBag,
  Gamepad2, Zap, Plus, Briefcase, Laptop, Gift, TrendingUp, Coins, Check,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCategoriesAndBudgetsFixed } from '../hooks/useCategoriesAndBudgetsFixed'
import { supabase } from '../lib/supabase'
import { categorizeTransaction } from '../lib/groq'
import CustomToast from '../components/ui/CustomToast'
import CategoryPromptModal from '../components/ui/CategoryPromptModal'
import {
  RESERVED_CUSTOM_CATEGORY_NAME,
  sortExpenseCategories,
} from '../lib/categories'

const EXPENSE_CATEGORIES = [
  { name: 'Food', icon: Utensils, color: '#34D399' },
  { name: 'Transport', icon: Bus, color: '#60A5FA' },
  { name: 'Education', icon: BookOpen, color: '#FB923C' },
  { name: 'Health', icon: Heart, color: '#FB7185' },
  { name: 'Shopping', icon: ShoppingBag, color: '#FBBF24' },
  { name: 'Entertainment', icon: Gamepad2, color: '#A78BFA' },
  { name: 'Bills', icon: Zap, color: '#2DD4BF' },
]

const INCOME_CATEGORIES = [
  { name: 'Salary', icon: Briefcase, color: '#34D399' },
  { name: 'Freelance', icon: Laptop, color: '#60A5FA' },
  { name: 'Gift', icon: Gift, color: '#FBBF24' },
  { name: 'Business', icon: TrendingUp, color: '#818CF8' },
  { name: 'Other Income', icon: Coins, color: '#A78BFA' },
]

const ICON_MAP = {
  Utensils,
  Bus,
  BookOpen,
  Heart,
  ShoppingBag,
  Gamepad2,
  Zap,
  Plus,
  Briefcase,
  Laptop,
  Gift,
  TrendingUp,
  Coins,
  '??': Utensils,
  '??': Bus,
  '??': BookOpen,
  '??': Heart,
  '??': ShoppingBag,
  '??': Gamepad2,
  '??': Zap,
  '?': Plus,
  '??': Briefcase,
  '??': Laptop,
  '??': Gift,
  '??': TrendingUp,
  '??': Coins,
}

function getCategoryIcon(icon) {
  return ICON_MAP[icon] || ICON_MAP[icon?.trim?.()] || Plus
}

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
]

export default function AddTransaction() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { categories, budgets, refetch } = useCategoriesAndBudgetsFixed(user?.id)
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const isEditMode = Boolean(editId)

  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name)
  const [description, setDescription] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isListening, setIsListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isCategorizing, setIsCategorizing] = useState(false)
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(false)
  const [isAllocating, setIsAllocating] = useState(false)
  const [allocations, setAllocations] = useState({})
  const [showCategoryPrompt, setShowCategoryPrompt] = useState(false)
  const [isSavingCategory, setIsSavingCategory] = useState(false)

  const amountRef = useRef(null)
  const currency = profile?.currency || 'Rs'

  const expenseCategories = sortExpenseCategories(
    categories
      .filter((item) => (item.type || 'expense') === 'expense')
      .map((item) => ({
        name: item.name,
        icon: getCategoryIcon(item.icon),
        color: item.color || '#5A5A6E',
      }))
  )

  const incomeCategories = categories
    .filter((item) => item.type === 'income')
    .map((item) => ({
      name: item.name,
      icon: getCategoryIcon(item.icon),
      color: item.color || '#5A5A6E',
    }))

  const activeCategories = type === 'income'
    ? (incomeCategories.length > 0 ? incomeCategories : INCOME_CATEGORIES)
    : (expenseCategories.length > 0 ? expenseCategories : EXPENSE_CATEGORIES)

  const visibleCategoryOptions = type === 'expense'
    ? [
        ...activeCategories,
        { name: RESERVED_CUSTOM_CATEGORY_NAME, icon: Plus, color: '#5A5A6E', isCustomAction: true },
      ]
    : activeCategories

  useEffect(() => {
    if (!activeCategories.some((item) => item.name === category)) {
      setCategory(activeCategories[0]?.name || '')
    }
  }, [activeCategories, category])

  useEffect(() => {
    if (amountRef.current) amountRef.current.focus()
  }, [])

  useEffect(() => {
    if (!user?.id || !editId) return

    let isMounted = true

    async function loadTransaction() {
      setIsLoadingTransaction(true)
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', editId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error
        if (!data) {
          CustomToast.error('Transaction not found', 'We could not load the transaction you wanted to edit.')
          navigate('/')
          return
        }

        if (!isMounted) return

        setType(data.type)
        setAmount(String(data.amount))
        setCategory(data.category)
        setDescription(data.description || '')
        setNote(data.note || '')
        setDate(data.date)
        setIsAllocating(false)
        setAllocations({})
      } catch (err) {
        console.error(err)
        CustomToast.error('Could not load transaction', err.message || 'Please try again.')
        navigate('/')
      } finally {
        if (isMounted) setIsLoadingTransaction(false)
      }
    }

    loadTransaction()

    return () => {
      isMounted = false
    }
  }, [editId, navigate, user?.id])

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
        CustomToast.warning('Amount Missing', 'We caught the description but could not find a number.')
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
        const exists = activeCategories.some((item) => item.name === suggestedCategory)
        if (exists) {
          setCategory(suggestedCategory)
          CustomToast.info('Auto-Categorized', `AI suggested "${suggestedCategory}" for this transaction.`)
        }
      }
    } catch (err) {
      console.error('Auto-categorization error:', err)
    } finally {
      setIsCategorizing(false)
    }
  }

  const handleCreateCustomCategory = async (rawName) => {
    const trimmedName = rawName.trim()

    if (!trimmedName) {
      return CustomToast.error('Category name needed', 'Please enter a name for your new category.')
    }

    if (trimmedName.toLowerCase() === RESERVED_CUSTOM_CATEGORY_NAME.toLowerCase()) {
      return CustomToast.error('Choose another name', '"Custom" is reserved for adding new categories.')
    }

    const duplicate = categories.find(
      (item) => (item.type || 'expense') === 'expense' && item.name.trim().toLowerCase() === trimmedName.toLowerCase()
    )

    if (duplicate) {
      setShowCategoryPrompt(false)
      setCategory(duplicate.name)
      return CustomToast.info('Category already exists', `"${duplicate.name}" is already available and has been selected.`)
    }

    setIsSavingCategory(true)
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          user_id: user.id,
          name: trimmedName,
          icon: 'Plus',
          color: '#8A8A9E',
          type: 'expense',
          budget_limit: 0,
        }])

      if (error) throw error

      await refetch()
      setCategory(trimmedName)
      setShowCategoryPrompt(false)
      CustomToast.success('Category created', `"${trimmedName}" has been added to your categories.`)
    } catch (err) {
      console.error(err)
      CustomToast.error('Save Failed', err.message || 'We could not create that category.')
    } finally {
      setIsSavingCategory(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!amount || Number(amount) <= 0) {
      return CustomToast.error('Invalid Amount', 'Please enter a valid amount greater than zero.')
    }
    if (!description) {
      return CustomToast.error('Description Required', 'Please enter a description for this transaction.')
    }

    if (!isEditMode && type === 'income' && isAllocating) {
      const totalAllocated = Object.values(allocations).reduce((sum, value) => sum + (Number(value) || 0), 0)
      if (totalAllocated > Number(amount)) {
        return CustomToast.error('Over Allocation', 'Total allocation cannot exceed the income amount.')
      }
    }

    setLoading(true)
    try {
      const payload = { user_id: user.id, type, amount: Number(amount), category, description, note, date }
      const txQuery = isEditMode
        ? supabase.from('transactions').update(payload).eq('id', editId).eq('user_id', user.id)
        : supabase.from('transactions').insert([payload])
      const { error: txError } = await txQuery
      if (txError) throw txError

      if (!isEditMode && type === 'income' && isAllocating) {
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()

        const allocationPromises = Object.entries(allocations).map(async ([catName, allocAmount]) => {
          if (Number(allocAmount) <= 0) return

          const foundCategory = categories.find((item) => item.name === catName)
          if (!foundCategory) return

          const existingBudget = budgets.find((budget) => budget.category_id === foundCategory.id)

          if (existingBudget) {
            return supabase
              .from('budgets')
              .update({ limit_amount: Number(existingBudget.limit_amount) + Number(allocAmount) })
              .eq('id', existingBudget.id)
          }

          return supabase
            .from('budgets')
            .insert([{
              user_id: user.id,
              category_id: foundCategory.id,
              limit_amount: Number(allocAmount),
              month: currentMonth,
              year: currentYear,
            }])
        })

        await Promise.all(allocationPromises)
        await refetch()
      }

      CustomToast.success(
        isEditMode ? 'Transaction updated' : 'Transaction Saved',
        isEditMode ? 'Your balance has been recalculated instantly.' : 'Your transaction has been recorded successfully.'
      )
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
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-interactive border border-border-subtle
                     hover:bg-elevated hover:border-border transition-[background,border-color] duration-fast
                     text-txt-muted hover:text-txt-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-txt-bright">{isEditMode ? 'Edit Transaction' : 'Add New'}</h1>
      </div>

      {isEditMode && (
        <div className="mb-6 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
          <p className="text-sm font-semibold text-txt-primary">Editing an existing transaction</p>
          <p className="text-xs text-txt-muted mt-1">Saving will reverse the old amount and apply the updated one to your balance automatically.</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex bg-interactive/50 p-1 rounded-2xl border border-border-subtle mb-8">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300
                ${type === option.value
                  ? 'bg-card text-txt-primary shadow-glow-accent border border-accent/20'
                  : 'text-txt-muted hover:text-txt-secondary'}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div id="add-record-hero" className="text-center mb-10">
          <p className="overline mb-3">Amount</p>
          <div className="flex justify-center items-baseline">
            <span className="text-4xl font-bold text-txt-muted mr-2 font-mono">{currency}</span>
            <input
              ref={amountRef}
              type="number"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="bg-transparent text-5xl font-black text-txt-bright font-mono tracking-tighter
                         outline-none w-48 text-left placeholder:text-txt-muted/20"
              placeholder="0"
              required
            />
          </div>
          <div className={`mx-auto mt-4 h-1 w-24 rounded-full ${type === 'expense' ? 'bg-expense/40 shadow-glow-expense' : 'bg-income/40 shadow-glow-income'}`} />
        </div>

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
            {visibleCategoryOptions.map((item) => {
              const Icon = item.icon
              const isSelected = !item.isCustomAction && category === item.name

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    if (item.isCustomAction) {
                      setShowCategoryPrompt(true)
                      return
                    }
                    setCategory(item.name)
                  }}
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
                      backgroundColor: isSelected ? `${item.color}25` : `${item.color}10`,
                      boxShadow: isSelected ? `0 0 15px ${item.color}30` : 'none',
                    }}
                  >
                    <Icon size={18} style={{ color: item.color }} strokeWidth={isSelected ? 2.5 : 1.5} />
                  </div>
                  <span className={`text-[10px] truncate w-full text-center font-bold tracking-tight ${isSelected ? 'text-txt-primary' : 'text-txt-muted'}`}>
                    {item.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {!isEditMode && type === 'income' && Number(amount) > 0 && (
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
                  {expenseCategories.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 bg-interactive/20 p-3 rounded-xl border border-border-subtle/30 group hover:border-accent/30 transition-colors">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: `${item.color}15` }}>
                        <item.icon size={16} style={{ color: item.color }} />
                      </div>
                      <span className="text-xs font-bold text-txt-secondary flex-1">{item.name}</span>
                      <div className="relative w-32">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-muted text-2xs font-bold font-mono">{currency}</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={allocations[item.name] || ''}
                          onChange={(event) => setAllocations({ ...allocations, [item.name]: event.target.value })}
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
                      (Number(amount) - Object.values(allocations).reduce((sum, value) => sum + (Number(value) || 0), 0)) < 0
                        ? 'text-expense'
                        : 'text-income'
                    }`}>
                      {currency}{(Number(amount) - Object.values(allocations).reduce((sum, value) => sum + (Number(value) || 0), 0)).toLocaleString()}
                    </span>
                    {(Number(amount) - Object.values(allocations).reduce((sum, value) => sum + (Number(value) || 0), 0)) < 0 && (
                      <span className="text-[10px] text-expense font-bold animate-pulse">Exceeds Income!</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 mb-10">
          <div className="relative group">
            <input
              type="text"
              placeholder="Description (e.g. Lunch with friends)"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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
                onChange={(event) => setDate(event.target.value)}
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
                onChange={(event) => setNote(event.target.value)}
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
            disabled={loading || isLoadingTransaction}
          >
            {loading
              ? <div className="w-6 h-6 border-3 border-canvas/20 border-t-canvas rounded-full animate-spin" />
              : (isEditMode ? 'Save Changes' : `Save ${type === 'income' ? 'Income' : 'Expense'}`)}
          </button>
        </div>
      </form>

      <CategoryPromptModal
        open={showCategoryPrompt}
        loading={isSavingCategory}
        onCancel={() => setShowCategoryPrompt(false)}
        onConfirm={handleCreateCustomCategory}
      />
    </div>
  )
}
