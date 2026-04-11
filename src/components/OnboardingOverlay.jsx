import { useEffect, useRef } from 'react'
import { X, ChevronRight } from 'lucide-react'
import confetti from 'canvas-confetti'

/**
 * OnboardingOverlay
 * Supports two render modes:
 *  1. Tooltip mode  — spotlight dim + floating card anchored to a highlighted element
 *                     On screens < 420px: falls back to a bottom-sheet (no caret, full width)
 *  2. Fullscreen    — centered modal for greeting / action-nudge / complete steps
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
  tooltipPosition,
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
  const isGreeting    = currentStep.id === 'greeting'
  const isActionNudge = currentStep.id === 'action-nudge'
  const isComplete    = currentStep.id === 'complete'

  // Use tooltip mode if we have positioning data and it's not a fullscreen step
  const isTooltipMode = !!tooltipPosition && !isGreeting && !isActionNudge && !isComplete

  // ── Tooltip Mode ──────────────────────────────────────────────
  if (isTooltipMode) {
    const { top, left, placement, arrowOffset } = tooltipPosition
    const isMobileSheet = typeof window !== 'undefined' && window.innerWidth < 420

    // Use shortTitle/shortTip when available, fall back gracefully
    const displayTitle = currentStep.shortTitle || currentStep.title
    const displayTip   = currentStep.shortTip   || message

    return (
      <>
        {/* Dim overlay — z-50, below spotlight (z-51) and tooltip (z-100) */}
        <div className="onboarding-dim-overlay" aria-hidden="true" />

        {isMobileSheet ? (
          /* ── Mobile bottom-sheet (< 420px) — no caret, full width ── */
          <div
            className="fixed bottom-0 inset-x-0 z-[100] pointer-events-auto"
            style={{ animation: 'sheet-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            <div className="bg-card border-t border-border-subtle rounded-t-3xl shadow-2xl px-5 pt-5 pb-safe-or-6">
              <TooltipContent
                currentStep={currentStep}
                displayTitle={displayTitle}
                displayTip={displayTip}
                progress={progress}
                totalTourSteps={totalTourSteps}
                onSkip={onSkip}
                onPrimary={onPrimary}
                showCaret={false}
                placement={null}
                arrowOffset={0}
              />
            </div>
          </div>
        ) : (
          /* ── Desktop/tablet floating tooltip ── */
          <div
            className="fixed z-[100] pointer-events-none"
            style={{
              top:    placement === 'above' ? 'auto' : `${top}px`,
              bottom: placement === 'above' ? `${window.innerHeight - top}px` : 'auto',
              left:   `${left}px`,
              transform:
                placement === 'above' || placement === 'below'
                  ? 'translateX(-50%)'
                  : placement === 'right'
                  ? 'translateY(-50%)'
                  : 'none',
            }}
          >
            <div
              className={`bg-card border border-border-subtle rounded-3xl shadow-2xl p-4 w-[288px] animate-scale-in pointer-events-auto relative tour-tooltip-arrow-${placement}`}
              style={{ '--arrow-offset': `${arrowOffset || 0}px` }}
            >
              <TooltipContent
                currentStep={currentStep}
                displayTitle={displayTitle}
                displayTip={displayTip}
                progress={progress}
                totalTourSteps={totalTourSteps}
                onSkip={onSkip}
                onPrimary={onPrimary}
                showCaret
                placement={placement}
                arrowOffset={arrowOffset}
              />
            </div>
          </div>
        )}

        <style>{`
          @keyframes sheet-slide-up {
            from { opacity: 0; transform: translateY(100%); }
            to   { opacity: 1; transform: translateY(0); }
          }
          /* Safe area padding for notched devices */
          .pb-safe-or-6 {
            padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
          }
        `}</style>
      </>
    )
  }

  // ── Fullscreen Mode (greeting / action-nudge / complete) ───────
  return (
    <>
      {/* Softened backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[60] animate-fade-in"
        onClick={onSkip}
      />

      <div
        className="
          fixed z-[70]
          /* Mobile: bottom aligned */
          inset-x-4 bottom-8
          /* Desktop: perfectly centered */
          md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
          md:w-[420px]
          max-h-[85vh] overflow-y-auto scrollbar-hide
          bg-card border border-border-subtle rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]
          p-6 md:p-10
          flex flex-col items-center text-center
        "
        style={{
          animation: 'welcome-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 rounded-full text-txt-muted hover:text-txt-primary hover:bg-interactive transition-colors"
        >
          <X size={18} />
        </button>

        {/* Big Emoji with subtle bounce */}
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-accent/10 flex items-center justify-center text-3xl md:text-4xl mb-6 animate-bounce-subtle">
          {currentStep.emoji}
        </div>

        <h3 className="text-xl md:text-2xl font-black text-txt-bright tracking-tight mb-3">
          {currentStep.title}
        </h3>

        <div className="bg-elevated/40 border border-border-subtle/30 rounded-2xl p-5 mb-8 text-sm text-txt-secondary leading-relaxed whitespace-pre-wrap">
          {message}
        </div>

        <div className="w-full space-y-3 mt-auto">
          <button
            onClick={onPrimary}
            className="w-full h-14 rounded-2xl bg-accent text-txt-inverted text-base font-bold flex items-center justify-center gap-2 hover:bg-accent-hover transition-all active:scale-[0.98] shadow-lg shadow-accent/20"
          >
            {currentStep.primaryAction}
            {!isComplete && !isGreeting && <ChevronRight size={18} />}
          </button>

          {isActionNudge && currentStep.tertiaryAction && (
            <button
              onClick={onTertiary}
              className="w-full h-12 rounded-2xl bg-income/10 border border-income/20 text-income text-sm font-bold flex items-center justify-center gap-2 hover:bg-income/20 transition-all"
            >
              {currentStep.tertiaryAction}
              <ChevronRight size={16} />
            </button>
          )}

          {currentStep.secondaryAction && (
            <button
              onClick={onSecondary}
              className="w-full h-10 rounded-xl text-txt-muted text-sm font-medium hover:text-txt-primary transition-colors"
            >
              {currentStep.secondaryAction}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes welcome-slide-up {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (min-width: 768px) {
          @keyframes welcome-slide-up {
            from { opacity: 0; transform: translate(-50%, -40%) scale(0.95); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// TooltipContent — shared between floating tooltip and bottom-sheet
// ─────────────────────────────────────────────────────────────────
function TooltipContent({
  currentStep,
  displayTitle,
  displayTip,
  progress,
  totalTourSteps,
  onSkip,
  onPrimary,
}) {
  return (
    <>
      {/* ── Row 1: step dots + count ── */}
      <div className="flex items-center justify-between mb-3">
        {/* Pill-shaped progress dots */}
        <div className="flex items-center gap-[3px]">
          {Array.from({ length: totalTourSteps }).map((_, i) => {
            const isDone   = i < progress - 1
            const isActive = i === progress - 1
            return (
              <div
                key={i}
                className={`h-[5px] rounded-full transition-all duration-300 ${
                  isDone   ? 'w-[10px] bg-accent/40' :
                  isActive ? 'w-[18px] bg-accent' :
                             'w-[5px]  bg-interactive'
                }`}
              />
            )
          })}
        </div>

        {/* Step count — readable, right-aligned */}
        <span className="text-[10px] font-medium text-txt-muted tabular-nums">
          {progress} of {totalTourSteps}
        </span>
      </div>

      {/* ── Row 2: context badge ── */}
      {currentStep.badge && (
        <div className="inline-flex mb-2">
          <span className="text-[10px] font-semibold tracking-wide text-accent bg-accent/10 border border-accent/20 rounded-full px-2 py-[2px] uppercase">
            {currentStep.badge}
          </span>
        </div>
      )}

      {/* ── Row 3: title ── */}
      <h3 className="text-sm font-bold text-txt-bright leading-snug mb-1.5">
        {displayTitle}
      </h3>

      {/* ── Row 4: short tip ── */}
      <p className="text-[11px] text-txt-secondary leading-relaxed mb-4">
        {displayTip}
      </p>

      {/* ── Row 5: actions ── */}
      <div className="flex items-center">
        {/* Skip — plain text link, left */}
        <button
          onClick={onSkip}
          className="text-[11px] text-txt-muted hover:text-txt-secondary transition-colors py-1 pr-3"
        >
          Skip tour
        </button>

        {/* Next — filled pill, right */}
        <button
          onClick={onPrimary}
          className="ml-auto h-8 px-4 rounded-xl bg-accent text-txt-inverted text-[11px] font-bold flex items-center gap-1 hover:bg-accent-hover transition-colors active:scale-[0.97]"
        >
          {currentStep.primaryAction}
        </button>
      </div>
    </>
  )
}
