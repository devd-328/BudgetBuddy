import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ONBOARDING_STEPS } from '../data/onboardingSteps'

/**
 * useOnboarding
 * Manages the entire onboarding lifecycle:
 *  - Detects first-login via profile.is_first_login
 *  - Controls step progression
 *  - Navigates to each section during the tour
 *  - Flips the DB flag on completion
 */
export function useOnboarding(user, profile, markOnboardingComplete) {
  const navigate = useNavigate()

  // Active step index into ONBOARDING_STEPS
  const [stepIndex, setStepIndex] = useState(0)
  // Whether the user accepted the tour (vs skipped)
  const [tourAccepted, setTourAccepted] = useState(false)
  // Whether to show extra "moreInfo" text for the current step
  const [showMore, setShowMore] = useState(false)
  // Whether the overlay is visible at all
  const [isVisible, setIsVisible] = useState(false)

  // Show the overlay only when profile says is_first_login = true
  useEffect(() => {
    if (profile?.is_first_login === true) {
      // Small delay so the dashboard renders first — better perceived perf
      const t = setTimeout(() => setIsVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [profile])

  const currentStep = ONBOARDING_STEPS[stepIndex]

  // Navigate to the route of the current step
  const navigateToStep = useCallback(
    (idx) => {
      const step = ONBOARDING_STEPS[idx]
      if (step?.route) navigate(step.route)
    },
    [navigate]
  )

  /** User clicked primary action */
  const handlePrimary = useCallback(async () => {
    setShowMore(false)

    // Greeting step — user accepts tour
    if (currentStep.id === 'greeting') {
      setTourAccepted(true)
      const nextIdx = stepIndex + 1
      setStepIndex(nextIdx)
      navigateToStep(nextIdx)
      return
    }

    // Action nudge — primary = go add transaction
    if (currentStep.id === 'action-nudge') {
      navigate(currentStep.primaryRoute || '/add')
      const nextIdx = stepIndex + 1
      setStepIndex(nextIdx)
      return
    }

    // Complete step — close overlay and finish
    if (currentStep.id === 'complete') {
      setIsVisible(false)
      await markOnboardingComplete(user?.id)
      return
    }

    // Regular tour step — advance
    const nextIdx = stepIndex + 1
    setStepIndex(nextIdx)
    navigateToStep(nextIdx)
  }, [currentStep, stepIndex, navigateToStep, navigate, markOnboardingComplete, user])

  /** User clicked secondary action */
  const handleSecondary = useCallback(async () => {
    setShowMore(false)

    // Greeting — user declines tour, jump to action nudge
    if (currentStep.id === 'greeting') {
      const nudgeIdx = ONBOARDING_STEPS.findIndex((s) => s.id === 'action-nudge')
      setStepIndex(nudgeIdx)
      navigateToStep(nudgeIdx)
      return
    }

    // "Tell me more" on a tour section
    if (currentStep.moreInfo && !showMore) {
      setShowMore(true)
      return
    }

    // Action nudge — "I'll do it later" → complete
    if (currentStep.id === 'action-nudge') {
      const completeIdx = ONBOARDING_STEPS.findIndex((s) => s.id === 'complete')
      setStepIndex(completeIdx)
      navigateToStep(completeIdx)
      return
    }
  }, [currentStep, showMore, navigateToStep])

  /** Tertiary action (only on action-nudge — "Set up a budget") */
  const handleTertiary = useCallback(() => {
    if (currentStep.id === 'action-nudge') {
      navigate(currentStep.tertiaryRoute || '/categories')
      const nextIdx = stepIndex + 1
      setStepIndex(nextIdx)
    }
  }, [currentStep, stepIndex, navigate])

  /** Skip the entire tour immediately */
  const handleSkip = useCallback(async () => {
    setIsVisible(false)
    await markOnboardingComplete(user?.id)
  }, [markOnboardingComplete, user])

  /** For Settings replay — reset to beginning */
  const replayTour = useCallback(() => {
    setStepIndex(0)
    setTourAccepted(false)
    setShowMore(false)
    navigate('/')
    setIsVisible(true)
  }, [navigate])

  // Tooltip position state
  const [tooltipPosition, setTooltipPosition] = useState(null)

  // Re-calculate tooltip position when step or visibility changes
  useEffect(() => {
    let target = null;
    let hasScrolled = false;
    let pollInterval = null;
    let frame = null;
    
    if (!isVisible || !currentStep?.highlight) {
      setTooltipPosition(null)
      return
    }

    const updatePosition = () => {
      target = document.getElementById(currentStep.highlight)
      if (!target) {
        setTooltipPosition(null)
        return
      }

      if (!hasScrolled) {
        hasScrolled = true;
        const targetRect = target.getBoundingClientRect();
        if (targetRect.top < 80 || targetRect.bottom > window.innerHeight - 80) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      // Add the spotlight class directly via DOM
      target.classList.add('onboarding-spotlight');

      const rect = target.getBoundingClientRect()
      
      // Determine placement (fallback to smart placement if not specified)
      let placement = currentStep.placement;
      if (!placement) {
        placement = rect.top > window.innerHeight / 2 ? 'above' : 'below';
      }

      // Calculate horizontal center
      let centerX = rect.left + rect.width / 2;
      
      // Clamp for mobile screens so tooltip doesn't overflow
      // Tooltip is max 320px (half = 160) on desktop, 280px (half=140) on mobile
      const padding = 16;
      const tooltipHalfWidth = window.innerWidth < 768 ? 140 : 160;
      
      let clampedX = centerX;
      if (clampedX - tooltipHalfWidth < padding) {
        clampedX = tooltipHalfWidth + padding;
      } else if (clampedX + tooltipHalfWidth > window.innerWidth - padding) {
        clampedX = window.innerWidth - tooltipHalfWidth - padding;
      }
      
      const arrowOffset = centerX - clampedX; // How much the arrow needs to shift to point accurately

      if (placement === 'above') {
        setTooltipPosition({
          top: rect.top - 12, // Space for arrow pointing down
          left: clampedX,
          arrowOffset,
          placement: 'above'
        })
      } else if (placement === 'below') {
        setTooltipPosition({
          top: rect.bottom + 12, // Space for arrow pointing up
          left: clampedX,
          arrowOffset,
          placement: 'below'
        })
      } else {
        // 'right' or fallback
        setTooltipPosition({
          top: rect.top + rect.height / 2,
          left: Math.min(rect.right + 12, window.innerWidth - (window.innerWidth < 768 ? 280 : 320) - padding), // Basic clamp for right
          arrowOffset: 0,
          placement: 'right'
        })
      }
    }

    // Poll for the target element to handle async route rendering (e.g. data fetching/skeletons)
    pollInterval = setInterval(() => {
      const found = document.getElementById(currentStep.highlight)
      if (found) {
        clearInterval(pollInterval)
        pollInterval = null
        frame = requestAnimationFrame(() => {
          updatePosition()
        })
      }
    }, 150)

    // Handle scroll and resize to keep tooltip locked to element
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, { passive: true })
    
    return () => {
      if (pollInterval) clearInterval(pollInterval)
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
      if (target) {
        target.classList.remove('onboarding-spotlight')
      }
    }
  }, [isVisible, currentStep, stepIndex])

  // Progress: how far through the tour sections (steps 1–6)
  const tourSteps = ONBOARDING_STEPS.filter(
    (s) => !['greeting', 'action-nudge', 'complete'].includes(s.id)
  )
  const currentTourStep = tourSteps.findIndex((s) => s.id === currentStep?.id)
  const progress = currentTourStep >= 0 ? currentTourStep + 1 : null
  const totalTourSteps = tourSteps.length

  return {
    isVisible,
    currentStep,
    stepIndex,
    showMore,
    progress,
    totalTourSteps,
    tourAccepted,
    handlePrimary,
    handleSecondary,
    handleTertiary,
    handleSkip,
    replayTour,
    highlightTarget: currentStep?.highlight ?? null,
    tooltipPosition,
  }
}
