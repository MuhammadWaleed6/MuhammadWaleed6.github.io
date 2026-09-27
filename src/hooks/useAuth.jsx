import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { envList } from '../lib/utils'

/**
 * Auth context — wraps Supabase Auth.
 *
 * `isAdmin` is NOT merely "logged in": the signed-in email must exist in the
 * `admin_users` allowlist table. Authorization is enforced server-side by RLS
 * (non-allowlisted accounts cannot read/write admin data regardless of this
 * client flag); this flag just drives the UI.
 */

const AuthContext = createContext(null)

/** Optional local override, e.g. VITE_ADMIN_EMAILS=me@example.com */
const LOCAL_ALLOWLIST = envList(import.meta.env.VITE_ADMIN_EMAILS)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)

  const checkAdminStatus = useCallback(async (currentSession) => {
    if (!currentSession?.user || !isSupabaseConfigured) {
      setIsAdmin(false)
      setAdminChecked(true)
      return
    }
    const email = (currentSession.user.email || '').toLowerCase()
    if (LOCAL_ALLOWLIST.length > 0 && !LOCAL_ALLOWLIST.includes(email)) {
      setIsAdmin(false)
      setAdminChecked(true)
      return
    }
    try {
      // RLS only lets allowlisted admins read their own row.
      const { data, error } = await supabase
        .from('admin_users')
        .select('email')
        .ilike('email', email)
        .maybeSingle()
      setIsAdmin(!error && Boolean(data))
    } catch {
      setIsAdmin(false)
    } finally {
      setAdminChecked(true)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      setAdminChecked(true)
      return undefined
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session || null)
        return checkAdminStatus(data.session)
      })
      .finally(() => setLoading(false))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setAdminChecked(false)
      checkAdminStatus(newSession)
    })

    return () => sub?.subscription?.unsubscribe()
  }, [checkAdminStatus])

  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured. Add your keys to .env first.') }
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: String(email || '').trim(),
      password,
    })
    return { error: error || null }
  }, [])

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    setSession(null)
    setIsAdmin(false)
  }, [])

  const sendPasswordReset = useCallback(async (email) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') }
    }
    const { error } = await supabase.auth.resetPasswordForEmail(String(email || '').trim(), {
      redirectTo: `${window.location.origin}${window.location.pathname}#/admin`,
    })
    return { error: error || null }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      loading,
      isAdmin,
      adminChecked,
      signIn,
      signOut,
      sendPasswordReset,
    }),
    [session, loading, isAdmin, adminChecked, signIn, signOut, sendPasswordReset]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
