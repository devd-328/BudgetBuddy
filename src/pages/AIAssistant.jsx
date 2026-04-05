import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mic, Send, Bot } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function AIAssistant() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const currency = profile?.currency || 'Rs'

  const [messages, setMessages] = useState([
    { sender: 'AI', text: "Hello! I'm your BudgetBuddy assistant. Try asking:\n- 'How much did I spend?'\n- 'Add 500 for Coffee'\n- 'How much can I save?'\n- 'Show my top category'" }
  ])
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  // Main intelligence engine
  const processIntent = async (text) => {
    const input = text.toLowerCase()

    try {
      // INTENT 1: 'How much did I spend?'
      if (input.includes('how much did i spend') || input.includes('what did i spend')) {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
        const { data, error } = await supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'expense').gte('date', startOfMonth)
        if (error) throw error
        const total = data?.reduce((acc, t) => acc + Number(t.amount), 0) || 0
        return `You have spent ${currency}${total.toFixed(2)} this month so far.`
      }

      // INTENT 2: 'Add X for Y'
      const addRegex = /add\s+(\d+(?:\.\d+)?)\s+(?:for|on|to)\s+(.*)/i
      const match = input.match(addRegex)
      if (match) {
        const amount = Number(match[1])
        const descriptionRaw = match[2].trim()
        const description = descriptionRaw.replace(/^[^a-zA-Z0-9]+/, '').trim()
        const { error } = await supabase.from('transactions').insert([{
          user_id: user.id, type: 'expense', amount, category: 'Custom',
          description: description.charAt(0).toUpperCase() + description.slice(1),
          date: new Date().toISOString().split('T')[0]
        }])
        if (error) throw error
        return `Logged ${currency}${amount.toFixed(2)} for ${description.charAt(0).toUpperCase() + description.slice(1)}.`
      }

      // INTENT 3: 'How much can I save?'
      if (input.includes('how much can i save') || input.includes('what can i save')) {
        const currentMonthNum = new Date().getMonth() + 1
        const currentYearNum = new Date().getFullYear()
        const { data: buds, error: budsErr } = await supabase.from('budgets').select('*').eq('user_id', user.id).eq('month', currentMonthNum).eq('year', currentYearNum)
        if (budsErr) throw budsErr
        if (!buds || buds.length === 0) return "You haven't set any budget limits yet! Go to Categories to configure them."
        const startOfMonth = new Date(currentYearNum, currentMonthNum - 1, 1).toISOString().split('T')[0]
        const { data: txs, error: txsErr } = await supabase.from('transactions').select('category, amount').eq('user_id', user.id).eq('type', 'expense').gte('date', startOfMonth)
        if (txsErr) throw txsErr
        const { data: cats } = await supabase.from('categories').select('*').eq('user_id', user.id)
        let totalLimit = 0, totalRelevantSpent = 0
        buds.forEach(b => {
          totalLimit += Number(b.limit_amount)
          const catName = cats?.find(c => c.id === b.category_id)?.name
          const spent = txs?.filter(t => t.category === catName).reduce((sum, t) => sum + Number(t.amount), 0) || 0
          totalRelevantSpent += spent
        })
        const left = totalLimit - totalRelevantSpent
        if (left <= 0) return `You've exceeded your budget caps. Time to slow down!`
        return `Based on your limits, you can save ${currency}${left.toFixed(2)} this month.`
      }

      // INTENT 4: 'Show my top category'
      if (input.includes('top category') || input.includes('highest spending')) {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
        const { data: txs, error } = await supabase.from('transactions').select('category, amount').eq('user_id', user.id).eq('type', 'expense').gte('date', startOfMonth)
        if (error) throw error
        const catSpends = {}
        txs?.forEach(t => { catSpends[t.category] = (catSpends[t.category] || 0) + Number(t.amount) })
        const top = Object.keys(catSpends).sort((a, b) => catSpends[b] - catSpends[a])[0]
        if (!top) return "You haven't spent anything this month!"
        return `Your top category is ${top} at ${currency}${catSpends[top].toFixed(2)}.`
      }

      return "I don't know how to answer that yet. Try 'Add 50 for Coffee' or 'How much did I spend?'"
    } catch (e) {
      console.error(e)
      return "Something went wrong while accessing your data."
    }
  }

  const handleSend = async (text) => {
    if (!text.trim()) return
    const msg = text.trim()
    setMessages(prev => [...prev, { sender: 'User', text: msg }])
    setInputText('')
    setProcessing(true)
    setTimeout(async () => {
      const response = await processIntent(msg)
      setMessages(prev => [...prev, { sender: 'AI', text: response }])
      setProcessing(false)
    }, 600)
  }

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return toast.error('Voice input not supported in this browser.')

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => { setIsListening(true); toast('Listening...', { icon: '🎙️', duration: 3000 }) }
    recognition.onresult = (event) => handleSend(event.results[0][0].transcript)
    recognition.onerror = (event) => { if (event.error !== 'no-speech') toast.error('Microphone error.') }
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  return (
    <div className="page-enter flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="py-4 flex items-center gap-3 shrink-0 z-10 border-b border-border-subtle mb-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-interactive border border-border-subtle 
                     hover:bg-elevated hover:border-border transition-[background,border-color] duration-fast
                     text-txt-muted hover:text-txt-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
          <Bot size={22} className="text-accent" /> AI Assistant
        </h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2 space-y-3 scrollbar-hide">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'User'
                  ? 'bg-accent text-txt-inverted rounded-br-md'
                  : 'bg-card border border-border-subtle text-txt-primary rounded-bl-md'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {processing && (
          <div className="flex justify-start">
            <div className="bg-card border border-border-subtle rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-txt-muted animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-txt-muted animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 rounded-full bg-txt-muted animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="pt-3 mt-2 border-t border-border-subtle shrink-0 z-10">
        <div className="flex items-end gap-2 bg-card p-2 rounded-2xl border border-border-subtle">
          <button
            type="button"
            onClick={handleMicClick}
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-[background,color] duration-fast
              ${isListening
                ? 'bg-expense/20 text-expense animate-pulse'
                : 'bg-interactive text-txt-muted hover:text-txt-primary'
              }`}
          >
            <Mic size={18} />
          </button>

          <textarea
            rows={1}
            placeholder="Message AI..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(inputText)
              }
            }}
            className="w-full bg-transparent text-txt-primary placeholder:text-txt-muted resize-none 
                       outline-none py-2.5 text-sm max-h-[100px]"
          />

          <button
            onClick={() => handleSend(inputText)}
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-[background,color] duration-fast
              ${inputText.trim()
                ? 'bg-accent text-txt-inverted shadow-glow-accent'
                : 'bg-interactive text-txt-muted'
              }`}
            disabled={!inputText.trim()}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-2xs text-center text-txt-muted mt-3">Rule-based MVP · Ollama integration coming soon</p>
      </div>
    </div>
  )
}
