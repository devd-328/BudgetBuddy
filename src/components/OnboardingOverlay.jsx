import { useEffect, useRef } from 'react'
import { X, ChevronRight, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

/**
 * OnboardingOverlay
 * Props:
 *   currentStep   — the current ONBOARDING_STEPS entry
 *   stepIndex     — numeric index
 *   showMore      — whether the moreInfo panel is visible
 *   progress      — current section number (1–6) or null
 *   totalTourSteps
 *   userName      — display name for personalised messages
 *   onPrimary     — primary button handler
 *   onSecondary   — secondary button handler
 *   onTertiary    — tertiary button handler (action-nudge only)
 *   onSkip        — skip/close entire overlay
 */
export default function OnboardingOverlay({
  currentStep,
  stepIndex,
  showMore,
  progress,
  totalTourSteps,
  userName,
  onPrimary,
  onSecondary,
  onTertiary,
  onSkip,
}) {
  const hasLaunched = useRef(false)

  // Fire confetti exactly once when we hit the complete step
  useEffect(() => {
    if (currentStep?.id === 'complete' && !hasLaunched.current) {
      hasLaunched.current = true
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.75 },
        colors: ['#60A5FA', '#34D399', '#FBBF24', '#FB7185', '#A78BFA'],
      })
      // Second burst for drama
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#60A5FA', '#34D399'],
        })
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#FBBF24', '#FB7185'],
        })
      }, 300)
    }
  }, [currentStep?.id])

  if (!currentStep) return null

  const message = currentStep.getMessage(userName)
  const isGreeting   = currentStep.id === 'greeting'
  const isActionNudge = currentStep.id === 'action-nudge'
  const isComplete   = currentStep.id === 'complete'
  const showProgress = progress !== null && !isGreeting && !isActionNudge && !isComplete

  return (
    <>
      {/* ── Backdrop (mobile only) ── */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden"
        onClick={onSkip}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <div
        className="
          fixed z-[70]
          /* Mobile: bottom sheet */
          bottom-0 left-0 right-0
          rounded-t-3xl
          max-h-[70vh] overflow-y-auto
          /* Desktop: floating card */
          md:bottom-6 md:right-6 md:left-auto md:w-[380px]
          md:rounded-3xl md:max-h-none md:overflow-visible
          bg-card border border-border-subtle
          shadow-2xl shadow-black/40
          animate-slide-up
        "
        style={{ animation: 'onboarding-slide-up 0.45s cubic-bezier(0.16,1,0.3,1) forwards' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-txt-bright tracking-tight">BudgetBuddy Tour</p>
              <p className="text-[10px] text-txt-muted">Powered by AI</p>
            </div>
          </div>

          <button
            onClick={onSkip}
            className="p-1.5 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-interactive transition-all duration-fast"
            title="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Progress dots ── */}
        {showProgress && (
          <div className="flex items-center gap-1.5 px-5 pt-3">
            {Array.from({ length: totalTourSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i < progress
                    ? 'bg-accent flex-[2]'
                    : i === progress - 1
                    ? 'bg-accent flex-[2]'
                    : 'bg-interactive flex-1'
                }`}
              />
            ))}
            <span className="text-[10px] text-txt-muted ml-1 shrink-0 font-medium">
              {progress}/{totalTourSteps}
            </span>
          </div>
        )}

        {/* ── Body ── */}
        <div className="px-5 py-4 space-y-4">

          {/* Emoji + Title */}
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">{currentStep.emoji}</span>
            <h3 className="text-sm font-bold text-txt-bright tracking-tight">{currentStep.title}</h3>
          </div>

          {/* Message bubble */}
          <div className="bg-elevated rounded-2xl px-4 py-3 text-sm text-txt-secondary leading-relaxed whitespace-pre-wrap">
            {message}
          </div>

          {/* More info panel */}
          {showMore && currentStep.moreInfo && (
            <div className="bg-accent/5 border border-accent/15 rounded-2xl px-4 py-3 text-xs text-txt-secondary leading-relaxed whitespace-pre-wrap animate-fade-in">
              {currentStep.moreInfo}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="px-5 pb-6 space-y-2.5">

          {/* Primary */}
          {currentStep.primaryAction && (
            <button
              onClick={onPrimary}
              className="
                w-full h-11 rounded-2xl bg-accent text-txt-inverted
                text-sm font-semibold
                flex items-center justify-center gap-2
                hover:bg-accent-hover active:scale-[0.98]
                transition-all duration-fast shadow-lg shadow-accent/20
              "
            >
              {currentStep.primaryAction}
              {!isComplete && !isGreeting && <ChevronRight size={15} />}
            </button>
          )}

          {/* Tertiary (action-nudge only: "Set up a budget") */}
          {isActionNudge && currentStep.tertiaryAction && (
            <button
              onClick={onTertiary}
              className="
                w-full h-10 rounded-2xl bg-income/10 border border-income/20 text-income
                text-sm font-semibold
                flex items-center justify-center gap-2
                hover:bg-income/20 active:scale-[0.98]
                transition-all duration-fast
              "
            >
              {currentStep.tertiaryAction}
              <ChevronRight size={15} />
            </button>
          )}

          {/* Secondary */}
          {currentStep.secondaryAction && (
            <button
              onClick={onSecondary}
              className="
                w-full h-10 rounded-xl text-txt-muted
                text-sm font-medium
                flex items-center justify-center
                hover:text-txt-primary hover:bg-interactive
                transition-all duration-fast
              "
            >
              {currentStep.secondaryAction}
            </button>
          )}
        </div>
      </div>

      {/* Slide-up keyframe injected via style tag for portability */}
      <style>{`
        @keyframes onboarding-slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 768px) {
          @keyframes onboarding-slide-up {
            from { opacity: 0; transform: translateY(20px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        }
      `}</style>
    </>
  )
}
