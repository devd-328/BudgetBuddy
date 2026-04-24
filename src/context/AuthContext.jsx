import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from profiles table
  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (!error && data) setProfile(data)
    } catch (err) {
      // Silently fail offline — profile stays null, app still renders
      console.warn('[AuthContext] fetchProfile failed (possibly offline):', err)
    }
  }

  useEffect(() => {
    let settled = false

    // Applies the session result exactly once, regardless of which path wins
    const finish = (session) => {
      if (settled) return
      settled = true
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
      setLoading(false)
    }

    // ✅ Offline guard: if getSession() never settles within 3 s, treat as
    //    unauthenticated so the skeleton screen is never shown forever.
    const timeoutId = setTimeout(() => {
      console.warn('[AuthContext] getSession timed out — device may be offline.')
      finish(null)
    }, 3000)

    // Get initial session (reads from localStorage cache; network only on expiry)
    supabase.auth.getSession()
      .then(({ data: { session } }) => { clearTimeout(timeoutId); finish(session) })
      .catch(() => { clearTimeout(timeoutId); finish(null) })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        clearTimeout(timeoutId)
        settled = true
        const u = session?.user ?? null
        setUser(u)
        if (u) fetchProfile(u.id)
        else setProfile(null)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  /** Called when onboarding tour is completed or skipped */
  async function markOnboardingComplete(userId) {
    if (!userId) return
    const { error } = await supabase
      .from('profiles')
      .update({ is_first_login: false })
      .eq('user_id', userId)
    if (!error) {
      setProfile((prev) => prev ? { ...prev, is_first_login: false } : prev)
    }
  }

  const value = {
    user,
    profile,
    setProfile,
    loading,
    signOut,
    isAuthenticated: !!user,
    markOnboardingComplete,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
