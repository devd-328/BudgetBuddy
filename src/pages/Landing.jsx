import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mic, BarChart3, Handshake, Bot, ChevronDown, ChevronRight, ArrowRight, Star, Menu, X } from 'lucide-react'

/* ═══════════════════════════════════════════════════════
   LANDING PAGE — BudgetBuddy v2.0 (Premium Dark)
   Fully idiomatic React. New design system tokens.
   No pricing, no subscriptions — 100% free app.
   ═══════════════════════════════════════════════════════ */

const FEATURES = [
  {
    icon: Mic,
    color: '#60A5FA',
    title: 'Voice Input',
    desc: 'Say "spent Rs 500 on food" while walking. BudgetBuddy logs it automatically — no typing needed.',
  },
  {
    icon: BarChart3,
    color: '#34D399',
    title: 'Visual Charts',
    desc: 'See exactly where your money goes with interactive doughnut charts and weekly bar trends.',
  },
  {
    icon: Bot,
    color: '#A78BFA',
    title: 'AI Assistant',
    desc: 'Ask anything — "How much did I spend this month?" or "Where can I cut back?" — powered by local AI.',
  },
  {
    icon: Handshake,
    color: '#FB7185',
    title: 'Borrow & Lend',
    desc: 'Track every debt with names, amounts, dates, and reasons. Never lose track of who owes you.',
  },
]

const STEPS = [
  { num: '01', title: 'Add to Home Screen', desc: "Tap 'Install' or 'Add to Home Screen.' Works on Android and iPhone. No app store needed." },
  { num: '02', title: 'Log your transactions', desc: 'Type, tap, or speak. BudgetBuddy categorizes everything so your dashboard always makes sense.' },
  { num: '03', title: 'Watch your money grow', desc: 'See trends, hit budget goals, and finally understand where your money goes each month.' },
]

const FAQS = [
  { q: 'Is BudgetBuddy really free?', a: 'Yes, completely free — no premium tiers, no hidden fees, no ads. We believe everyone deserves good financial tools.' },
  { q: 'How is my data stored?', a: 'Your data is securely stored in the cloud using end-to-end encrypted connections. Only you can access your financial information.' },
  { q: 'Can I use it offline?', a: 'Yes! BudgetBuddy is a Progressive Web App (PWA). Once installed, it works offline and syncs when you reconnect.' },
  { q: 'Is the AI assistant free too?', a: "Yes. It's powered by local AI models (Ollama), so it runs without any subscription or cloud API costs." },
  { q: 'Can I export my data?', a: 'Absolutely. Go to Settings → Export as CSV to download your full transaction history anytime.' },
]

// Intersection Observer hook for reveal animations
function useReveal(options = {}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.unobserve(el) } },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px', ...options }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return [ref, isVisible]
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, isVisible] = useReveal()
  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// FAQ Accordion Item
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border-subtle last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-sm font-medium text-txt-primary group-hover:text-accent transition-colors pr-4">{q}</span>
        <ChevronDown
          size={16}
          className={`text-txt-muted shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-sm text-txt-secondary leading-relaxed pb-5">{a}</p>
      </div>
    </div>
  )
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handle, { passive: true })
    return () => window.removeEventListener('scroll', handle)
  }, [])

  return (
    <div className="bg-canvas text-txt-primary font-sans">

      {/* ═══ NAVBAR ═══ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-[background,border-color,backdrop-filter] duration-300 ${
          scrolled
            ? 'bg-canvas/90 backdrop-blur-xl border-b border-border-subtle'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-2.5">
            <img 
              src="/google_consent_logo.png" 
              alt="BudgetBuddy Logo" 
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span className="font-bold text-base tracking-tight text-txt-bright">BudgetBuddy</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-txt-muted hover:text-txt-primary text-sm font-medium transition-colors">Features</a>
            <a href="#how-it-works" className="text-txt-muted hover:text-txt-primary text-sm font-medium transition-colors">How it works</a>
            <a href="#faq" className="text-txt-muted hover:text-txt-primary text-sm font-medium transition-colors">FAQ</a>
            <div className="flex items-center gap-3 pl-2">
              <Link to="/login" className="text-txt-secondary hover:text-txt-primary text-sm font-medium transition-colors">Log in</Link>
              <Link to="/signup" className="btn-primary text-sm px-5 py-2.5">Sign up free</Link>
            </div>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden p-2 text-txt-muted"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </nav>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-canvas flex flex-col animate-fade-in">
          <div className="flex justify-between items-center px-6 py-4 border-b border-border-subtle">
            <span className="font-bold text-txt-bright">BudgetBuddy</span>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-txt-muted">
              <X size={22} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-6 py-8 text-lg font-medium">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-3 border-b border-border-subtle text-txt-secondary">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-3 border-b border-border-subtle text-txt-secondary">How it works</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-3 text-txt-secondary">FAQ</a>
            <div className="flex flex-col gap-3 mt-8">
              <Link to="/login" className="btn-ghost text-center py-3" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
              <Link to="/signup" className="btn-primary text-center py-3" onClick={() => setMobileMenuOpen(false)}>Sign up free</Link>
            </div>
          </nav>
        </div>
      )}

      <main>
        {/* ═══ HERO ═══ */}
        <section id="hero" className="min-h-screen flex items-center pt-20 pb-16 px-6 relative overflow-hidden">
          {/* Background accents */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-income/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
            {/* Copy */}
            <Reveal>
              <div className="inline-flex items-center gap-2 text-2xs font-medium text-income bg-income-tint border border-income/20 rounded-full px-3 py-1.5 mb-6">
                <Star size={12} className="fill-current" />
                100% free · No hidden costs
              </div>

              <h1 className="text-txt-bright font-black leading-[1.08] mb-6" style={{ fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '-1.5px' }}>
                Your money,{' '}finally<br />
                <span className="text-gradient">under control</span>
              </h1>

              <p className="text-txt-secondary text-lg leading-relaxed mb-10 max-w-lg">
                Stop tracking expenses in WhatsApp notes. BudgetBuddy gives you a beautiful, voice-powered budget tracker — completely free.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  to="/signup"
                  className="btn-primary text-base px-7 py-4 flex items-center justify-center gap-2"
                >
                  Start for free <ArrowRight size={16} />
                </Link>
                <a
                  href="#features"
                  className="btn-ghost text-base px-7 py-4 flex items-center justify-center gap-2"
                >
                  See how it works <ChevronDown size={16} />
                </a>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['#60A5FA', '#34D399', '#FB7185', '#A78BFA'].map((c, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-canvas flex items-center justify-center text-2xs font-bold text-white"
                      style={{ backgroundColor: c }}
                    >
                      {['AK', 'SF', 'HM', 'ZA'][i]}
                    </div>
                  ))}
                </div>
                <p className="text-txt-muted text-sm">
                  <span className="text-txt-primary font-semibold">2,400+</span> students joined this month
                </p>
              </div>
            </Reveal>

            {/* Phone Mockup */}
            <Reveal delay={200} className="flex justify-center lg:justify-end">
              <div className="w-72 rounded-3xl p-5 border border-border-subtle bg-card shadow-xl">
                {/* Status bar */}
                <div className="flex justify-between text-txt-muted text-2xs mb-5 px-1">
                  <span>9:41</span>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-1.5 rounded-sm bg-txt-muted" />
                    <div className="w-3 h-1.5 rounded-sm bg-txt-muted" />
                  </div>
                </div>
                {/* Balance card */}
                <div className="bg-interactive rounded-2xl p-4 mb-3 border border-border-subtle">
                  <p className="overline mb-1">Total Balance</p>
                  <p className="text-txt-bright font-black text-3xl tracking-tighter font-mono mb-3">Rs 2,840</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-2xs text-income mb-0.5">● Income</p>
                      <p className="text-txt-primary font-bold text-sm font-mono">Rs 4,200</p>
                    </div>
                    <div>
                      <p className="text-2xs text-expense mb-0.5">● Expenses</p>
                      <p className="text-txt-primary font-bold text-sm font-mono">Rs 1,360</p>
                    </div>
                  </div>
                </div>
                {/* Mini bar chart */}
                <div className="bg-interactive rounded-2xl p-4 mb-3 border border-border-subtle">
                  <p className="overline mb-3">Weekly trend</p>
                  <div className="flex items-end gap-1.5 h-14">
                    {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{
                          height: `${h}%`,
                          backgroundColor: i === 5 ? '#34D399' : '#60A5FA',
                          opacity: i === 5 ? 1 : 0.4 + (h / 200),
                        }}
                      />
                    ))}
                  </div>
                </div>
                {/* Transactions */}
                <div className="space-y-2">
                  {[
                    { cat: 'Food', amount: '-Rs 120', color: '#FB7185', time: 'Today' },
                    { cat: 'Salary', amount: '+Rs 4,200', color: '#34D399', time: 'Mon' },
                  ].map((tx, i) => (
                    <div key={i} className="flex items-center justify-between bg-interactive rounded-xl p-3 border border-border-subtle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${tx.color}15` }}>
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.color }} />
                        </div>
                        <div>
                          <p className="text-txt-primary text-xs font-semibold">{tx.cat}</p>
                          <p className="text-txt-muted text-2xs">{tx.time}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold font-mono" style={{ color: tx.color }}>{tx.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <Reveal className="text-center mb-16">
              <div className="overline mb-3">Built for real people</div>
              <h2 className="text-txt-bright font-bold mb-4" style={{ fontSize: 'clamp(26px, 4vw, 36px)', letterSpacing: '-0.5px' }}>
                Everything you need.{' '}
                <span className="text-txt-muted">Nothing you don't.</span>
              </h2>
            </Reveal>

            <div className="grid sm:grid-cols-2 gap-4">
              {FEATURES.map((f, i) => (
                <Reveal key={i} delay={i * 100}>
                  <div className="bg-card border border-border-subtle rounded-2xl p-6 group hover:border-border transition-[border-color] duration-300">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: `${f.color}12` }}
                    >
                      <f.icon size={20} style={{ color: f.color }} strokeWidth={1.75} />
                    </div>
                    <h3 className="text-base font-semibold text-txt-primary mb-2">{f.title}</h3>
                    <p className="text-sm text-txt-secondary leading-relaxed">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how-it-works" className="py-24 px-6 bg-surface">
          <div className="max-w-4xl mx-auto">
            <Reveal className="text-center mb-16">
              <div className="overline mb-3">Get started in minutes</div>
              <h2 className="text-txt-bright font-bold" style={{ fontSize: 'clamp(26px, 4vw, 36px)', letterSpacing: '-0.5px' }}>
                Up and running in 3 steps
              </h2>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-8">
              {STEPS.map((step, i) => (
                <Reveal key={i} delay={i * 120}>
                  <div className="text-center md:text-left">
                    <div className="w-12 h-12 rounded-2xl bg-interactive border border-border-subtle flex items-center justify-center font-mono text-sm font-bold text-accent mb-4 mx-auto md:mx-0">
                      {step.num}
                    </div>
                    <h3 className="text-base font-semibold text-txt-primary mb-2">{step.title}</h3>
                    <p className="text-sm text-txt-secondary leading-relaxed">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section id="faq" className="py-24 px-6">
          <div className="max-w-2xl mx-auto">
            <Reveal className="text-center mb-12">
              <div className="overline mb-3">Questions & answers</div>
              <h2 className="text-txt-bright font-bold" style={{ fontSize: 'clamp(26px, 4vw, 36px)', letterSpacing: '-0.5px' }}>
                Frequently asked
              </h2>
            </Reveal>

            <Reveal>
              <div className="bg-card border border-border-subtle rounded-2xl px-6">
                {FAQS.map((faq, i) => (
                  <FaqItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="py-24 px-6 bg-surface">
          <Reveal className="max-w-2xl mx-auto text-center">
            <h2 className="text-txt-bright font-bold mb-4" style={{ fontSize: 'clamp(26px, 4vw, 36px)', letterSpacing: '-0.5px' }}>
              Ready to take control?
            </h2>
            <p className="text-txt-secondary text-base mb-8 max-w-md mx-auto">
              Join thousands of students and young professionals who finally understand where their money goes.
            </p>
            <Link
              to="/signup"
              className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4"
            >
              Get started — it's free <ChevronRight size={16} />
            </Link>
          </Reveal>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border-subtle py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img 
              src="/google_consent_logo.png" 
              alt="BudgetBuddy Logo" 
              className="w-6 h-6 rounded-md object-contain"
            />
            <span className="text-sm text-txt-muted">BudgetBuddy · Free forever</span>
          </div>
          <div className="flex items-center gap-6 text-2xs text-txt-muted">
            <a href="#" className="hover:text-txt-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-txt-primary transition-colors">Terms</a>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
