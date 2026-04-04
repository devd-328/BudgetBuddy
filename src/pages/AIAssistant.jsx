import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
        // cleanup punctuation
        const description = descriptionRaw.replace(/^[^a-zA-Z0-9]+/, '').trim()

        const { error } = await supabase.from('transactions').insert([{
           user_id: user.id,
           type: 'expense',
           amount,
           category: 'Custom',
           description: description.charAt(0).toUpperCase() + description.slice(1),
           date: new Date().toISOString().split('T')[0]
        }])

        if (error) throw error
        return `Successfully logged an expense of ${currency}${amount.toFixed(2)} for ${description.charAt(0).toUpperCase() + description.slice(1)}.`
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

        let totalLimit = 0
        let totalRelevantSpent = 0

        const { data: cats } = await supabase.from('categories').select('*').eq('user_id', user.id)

        buds.forEach(b => {
           totalLimit += Number(b.limit_amount)
           const catName = cats?.find(c => c.id === b.category_id)?.name
           const spent = txs?.filter(t => t.category === catName).reduce((sum, t) => sum + Number(t.amount), 0) || 0
           totalRelevantSpent += spent
        })

        const left = totalLimit - totalRelevantSpent
        if (left <= 0) return `You've actually exceeded your budget caps globally. Time to slow down!`
        return `Based on your budget limits, if you stop spending correctly, you can logically save ${currency}${left.toFixed(2)} this month!`
      }

      // INTENT 4: 'Show my top category'
      if (input.includes('top category') || input.includes('highest spending')) {
         const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
         const { data: txs, error } = await supabase.from('transactions').select('category, amount').eq('user_id', user.id).eq('type', 'expense').gte('date', startOfMonth)
         if (error) throw error

         const catSpends = {}
         txs?.forEach(t => {
            catSpends[t.category] = (catSpends[t.category] || 0) + Number(t.amount)
         })

         const top = Object.keys(catSpends).sort((a,b) => catSpends[b] - catSpends[a])[0]
         if (!top) return "You haven't spent anything this month!"
         return `Your top spending category is ${top} at ${currency}${catSpends[top].toFixed(2)}.`
      }

      return "I'm sorry, I don't know how to answer that yet. Try saying 'Add 50 for Coffee' or 'How much did I spend?'"
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

    // Optional tiny delay to mimic AI thinking organically
    setTimeout(async () => {
      const response = await processIntent(msg)
      setMessages(prev => [...prev, { sender: 'AI', text: response }])
      setProcessing(false)
    }, 600)
  }

  const handleMicClick = () => {
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
      toast('Listening...', { icon: '🎙️', duration: 3000 })
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      handleSend(transcript)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        toast.error('Microphone access denied or error occurred.')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  return (
    <div className="page-enter flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="py-4 flex items-center gap-3 shrink-0 z-10 border-b border-white/5 mb-2">
         <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors active:scale-95 text-white/50 hover:text-white">
            <ArrowLeft size={18} />
         </button>
         <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🤖</span> AI Assistant
         </h1>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-2 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-lg ${
                msg.sender === 'User' 
                  ? 'bg-accent text-white rounded-tr-sm' 
                  : 'bg-white/10 text-white/90 rounded-tl-sm border border-white/5'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {processing && (
          <div className="flex justify-start">
             <div className="bg-white/10 text-white/90 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 border border-white/5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{animationDelay: '0.4s'}}></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Terminal */}
      <div className="pt-4 mt-2 border-t border-white/5 shrink-0 z-10">
        <div className="flex items-end gap-2 bg-white/5 p-2 rounded-[24px] border border-white/10">
           <button 
             type="button"
             onClick={handleMicClick}
             className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
               isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-transparent text-white/50 active:bg-white/10'
             }`}
           >
             <span className="text-lg">🎙️</span>
           </button>

           <textarea
             rows={1}
             placeholder="Message AI..."
             value={inputText}
             onChange={(e) => setInputText(e.target.value)}
             onKeyDown={(e) => {
               if(e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(inputText)
               }
             }}
             className="w-full bg-transparent text-white placeholder:text-white/30 resize-none outline-none py-2.5 text-sm max-h-[100px]"
           />

           <button 
              onClick={() => handleSend(inputText)}
              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                inputText.trim() ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-white/10 text-white/30'
              }`}
              disabled={!inputText.trim()}
           >
             <span className="text-sm">➤</span>
           </button>
        </div>
        <p className="text-[10px] text-center text-white/30 mt-3">Rule-Based MVP Logic Only</p>
      </div>

    </div>
  )
}
