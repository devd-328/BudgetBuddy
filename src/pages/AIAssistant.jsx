import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mic, Send, Bot, Volume2, VolumeX, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useBudgetAI } from '../hooks/useBudgetAI'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import CustomToast from '../components/ui/CustomToast'

export default function AIAssistant() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { chat, speak, isSpeaking, loading, history, clearHistory } = useBudgetAI()

  const defaultMessage = { 
    role: 'assistant', 
    content: "Hello! I'm your BudgetBuddy Assistant. I work like a Google Assistant for your finances.\n\nTry asking me:\n- 'I lent 500 to Ahmed for lunch'\n- 'Set my food budget to 5000'\n- 'How much did I spend on Transport?'\n- 'Ahmed paid me back'" 
  }

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("budget_ai_messages")
    return saved ? JSON.parse(saved) : [defaultMessage]
  })
  
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [useVoice, setUseVoice] = useState(false) // Disabled by default per user request
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null) // Persistent recognition instance

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Sync scroll on change
  useEffect(() => { scrollToBottom() }, [messages, loading])

  // Sync messages to localStorage
  useEffect(() => {
    localStorage.setItem("budget_ai_messages", JSON.stringify(messages))
  }, [messages])

  // Handle clearing
  const handleClear = () => {
    CustomToast.confirm(
      'Clear chat history?',
      'This will permanently delete your conversation with the AI. You cannot undo this.',
      () => {
        clearHistory()
        setMessages([defaultMessage])
        localStorage.removeItem("budget_ai_messages")
        toast.success("Chat history cleared")
      },
      null,
      'Clear History',
      'Keep Chat'
    )
  }

  // Main intelligence engine
  const handleSend = async (text) => {
    if (!text.trim() || loading) return
    const msg = text.trim()
    
    // Add user message to local UI state immediately
    const userMsg = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    
    try {
      const { text: response, actionResult } = await chat(msg, user?.id, useVoice)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])

      if (actionResult?.success) {
        toast.success('Action completed successfully!', { icon: '✅' })
      } else if (actionResult?.error) {
        toast.error(`Action failed: ${actionResult.error}`)
      }
    } catch (err) {
      toast.error('AI failed to respond.')
    }
  }

  const handleMicClick = () => {
    // 1. Stop speaking if currently talking
    if (isSpeaking) {
      window.speechSynthesis?.cancel()
      return
    }

    // 2. Toggle Off → Stop recognition
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return toast.error('Speech recognition not supported in this browser. Try Chrome or Edge.')

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'
    recognition.continuous = true // Don't stop on silence
    recognition.interimResults = true // Show results as they come
    
    let listenToastId = null;

    recognition.onstart = () => { 
      setIsListening(true)
      listenToastId = toast.loading('Listening... Click Mic to finish.', { icon: '🎙️' }) 
    }
    
    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      // Update text in real-time
      if (finalTranscript || interimTranscript) {
        setInputText((prev) => {
          return (finalTranscript + interimTranscript).trim()
        })
      }
    }
    
    recognition.onerror = (event) => { 
      console.error('Speech recognition error:', event.error)
      toast.dismiss(listenToastId)
      
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission denied.')
      } else if (event.error !== 'no-speech') {
        toast.error(`Speech error: ${event.error}`)
      }
    }
    
    recognition.onend = () => {
      setIsListening(false)
      toast.dismiss(listenToastId)
    }

    try {
      recognition.start()
    } catch (e) {
      console.error('Recognition start failed:', e)
      toast.error('Failed to start microphone.')
    }
  }

  return (
    <div className="page-enter flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="py-4 flex items-center justify-between shrink-0 z-10 border-b border-border-subtle mb-2">
        <div className="flex items-center gap-3">
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

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="p-2.5 rounded-xl border bg-interactive border-border-subtle text-txt-muted hover:text-expense hover:border-expense/20 transition-all duration-fast"
            title="Clear Chat"
          >
            <Trash2 size={18} />
          </button>
          
          <button
            onClick={() => setUseVoice(!useVoice)}
            className={`p-2.5 rounded-xl border transition-all duration-fast flex items-center gap-2 text-sm font-medium
              ${useVoice 
                ? 'bg-accent/10 border-accent/20 text-accent' 
                : 'bg-interactive border-border-subtle text-txt-muted'}`}
          >
            {useVoice ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span className="hidden sm:inline">{useVoice ? 'Voice On' : 'Voice Off'}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2 space-y-3 scrollbar-hide">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-accent text-txt-inverted rounded-tr-sm'
                  : 'bg-card border border-border-subtle text-txt-primary rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border-subtle rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
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
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-fast relative
              ${isListening
                ? 'bg-expense/20 text-expense animate-pulse'
                : isSpeaking
                  ? 'bg-accent/20 text-accent'
                  : 'bg-interactive text-txt-muted hover:text-txt-primary'
              }`}
          >
            {isSpeaking && (
              <span className="absolute inset-0 rounded-xl border-2 border-accent animate-ping opacity-25" />
            )}
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
        <p className="text-2xs text-center text-txt-muted mt-3">Powered by Groq · Llama 3.3 70B</p>
      </div>
    </div>
  )
}

