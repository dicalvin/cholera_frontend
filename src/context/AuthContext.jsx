import { createContext, useContext, useEffect, useRef, useState } from 'react'

import { supabase } from '../lib/supabaseClient'

// Emails that are always treated as system_admin even without a DB row.
// Once the SQL migration is run this list acts only as a last-resort fallback.
const ADMIN_EMAILS = ['dicalvin17@gmail.com']

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // Separate flag so App.jsx can tell "profile is still fetching" apart from "no profile row"
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState(null)
  const profileRef = useRef(null)

  const loadProfile = async (currentUser) => {
    if (!currentUser) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    setError(null)
    try {
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile request timeout')), 8000)
      })

      const { data, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise,
      ])

      if (profileError) {
        // eslint-disable-next-line no-console
        console.error('Failed to load user profile', profileError)
        setError(profileError.message)
      }

      if (data) {
        // Normal case: profile row exists — use it, but ensure role/status are
        // correct for known admin emails so the DB bootstrap hasn't run yet.
        if (ADMIN_EMAILS.includes(currentUser.email)) {
          setProfile({
            ...data,
            role: 'system_admin',
            status: 'approved',
          })
        } else {
          setProfile(data)
        }
      } else {
        // No profile row in DB yet (migration not run or user just signed up)
        if (ADMIN_EMAILS.includes(currentUser.email)) {
          // Synthesise a full admin profile from auth metadata so all pages work
          const meta = currentUser.user_metadata || {}
          setProfile({
            id: currentUser.id,
            email: currentUser.email,
            first_name: meta.first_name || 'Calvin',
            last_name: meta.last_name || 'Admin',
            full_name:
              meta.full_name ||
              (meta.first_name
                ? `${meta.first_name || 'Calvin'} ${meta.last_name || 'Admin'}`.trim()
                : currentUser.email),
            phone: meta.phone || null,
            requested_role: 'system_admin',
            role: 'system_admin',
            status: 'approved',
          })
        } else {
          setProfile(null)
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Unexpected loadProfile error', err)
      setError(err?.message || 'Failed to load profile')
      // Keep last known good profile to avoid role/status flicker on transient failures.
      if (!profileRef.current) setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    profileRef.current = profile
  }, [profile])


  useEffect(() => {
    let unsubscribe
    const init = async () => {
      setLoading(true)
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        setError(sessionError.message)
      } else {
        setUser(data.session?.user ?? null)
        if (data.session?.user) {
          await loadProfile(data.session.user)
        }
      }
      const { data: listener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user ?? null)

          // Token refresh can fire frequently; avoid disruptive profile reload loops.
          if (event === 'TOKEN_REFRESHED') {
            if (!profileRef.current && session?.user) {
              await loadProfile(session.user)
            }
            return
          }

          await loadProfile(session?.user ?? null)
        },
      )
      unsubscribe = listener.subscription
      setLoading(false)
    }
    init()

    return () => {
      if (unsubscribe) unsubscribe.unsubscribe()
    }
  }, [])


  const signOut = async () => {
    setLoading(true)
    setError(null)
    try {
      // Prefer local sign-out (clears this browser only)
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
      if (signOutError) {
        // eslint-disable-next-line no-console
        console.error('Supabase signOut error', signOutError)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Unexpected signOut error', err)
    } finally {
      // Hard-clear any persisted auth leftovers (defensive)
      try {
        Object.keys(window.localStorage || {}).forEach((k) => {
          if (k.startsWith('sb-') || k.includes('supabase')) {
            window.localStorage.removeItem(k)
          }
        })
        Object.keys(window.sessionStorage || {}).forEach((k) => {
          if (k.startsWith('sb-') || k.includes('supabase')) {
            window.sessionStorage.removeItem(k)
          }
        })
      } catch (e) {
        // ignore
      }
      setUser(null)
      setProfile(null)
      setLoading(false)
    }
  }

  const value = {
    user,
    profile,
    loading,
    profileLoading,
    error,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

