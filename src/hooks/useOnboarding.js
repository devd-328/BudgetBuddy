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
  }
}
