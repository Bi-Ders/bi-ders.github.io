import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSiteUrl, isDemoMode, supabase } from '../lib/supabase'
import { getDemoProfile } from '../data/mockData'
import { fetchProfile, getDemoProfilePatch, updateProfile as apiUpdateProfile, type ProfilePatch } from '../services/api'
import type { Profile, Role } from '../types'

export type AuthMode = 'login' | 'register' | 'forgot'

type AuthUser = { id: string; email: string | null }

type AuthContextValue = {
  user: AuthUser | null
  profile: Profile | null
  /** İlk oturum kontrolü sürüyor mu? */
  loading: boolean
  isDemo: boolean
  role: Role | null
  isStaff: boolean
  isAdmin: boolean
  signInWithGoogle: (next?: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (fullName: string, email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  sendPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signInAsDemo: (role: 'student' | 'admin') => void
  signOut: () => Promise<void>
  updateProfile: (patch: ProfilePatch) => Promise<void>
  // Giriş modalı
  authModal: { open: boolean; mode: AuthMode }
  openAuth: (mode?: AuthMode) => void
  closeAuth: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const DEMO_KEY = 'biders:demo-session'

/** Supabase Auth hata mesajlarını Türkçeye çevirir */
export function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-posta adresi veya şifre hatalı.'
  if (m.includes('email not confirmed')) return 'E-posta adresiniz henüz doğrulanmamış. Gelen kutunuzu kontrol edin.'
  if (m.includes('user already registered')) return 'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin.'
  if (m.includes('password should be at least')) return 'Şifre en az 6 karakter olmalıdır.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.'
  if (m.includes('provider is not enabled')) return 'Google ile giriş bu proje için henüz etkinleştirilmemiş.'
  if (m.includes('otp_expired') || m.includes('token has expired') || m.includes('invalid or has expired')) {
    return 'Doğrulama bağlantısının süresi dolmuş veya daha önce kullanılmış. Hesabınız doğrulandıysa doğrudan e-posta ve şifrenizle giriş yapabilirsiniz.'
  }
  if (m.includes('code verifier') || m.includes('code_verifier') || m.includes('pkce')) {
    return 'Hesabınız doğrulandıysa doğrudan e-posta ve şifrenizle giriş yapabilirsiniz.'
  }
  if (m.includes('network') || m.includes('failed to fetch')) return 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.'
  return message
}

function loadDemoProfile(role: 'student' | 'admin'): Profile {
  const base = getDemoProfile(role)
  return { ...base, ...getDemoProfilePatch(base.id) }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [demoRole, setDemoRole] = useState<'student' | 'admin' | null>(() => {
    if (!isDemoMode) return null
    const saved = localStorage.getItem(DEMO_KEY)
    return saved === 'student' || saved === 'admin' ? saved : null
  })
  const [profile, setProfile] = useState<Profile | null>(() => (demoRole ? loadDemoProfile(demoRole) : null))
  const [loading, setLoading] = useState(!isDemoMode)
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: AuthMode }>({ open: false, mode: 'login' })

  // --- Supabase oturum takibi -------------------------------------------
  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session)
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false))

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      // Not: Bu geri çağırmada doğrudan async Supabase çağrısı yapılmaz (kilitlenme riski).
      setSession(next)
      setLoading(false)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id ?? null

  // --- Profil yükleme ----------------------------------------------------
  useEffect(() => {
    if (!supabase) return
    if (!userId || !session) {
      setProfile(null)
      return
    }
    let active = true
    const meta = session.user.user_metadata ?? {}
    const fallback: Profile = {
      id: userId,
      full_name: meta.full_name ?? meta.name ?? session.user.email?.split('@')[0] ?? null,
      username: null,
      avatar_url: meta.avatar_url ?? null,
      bio: null,
      school: null,
      grade: null,
      role: 'student',
      created_at: session.user.created_at,
    }
    fetchProfile(userId)
      .then((p) => active && setProfile({ ...(p ?? fallback), email: session.user.email ?? null }))
      .catch((err) => {
        console.warn('[Bi Ders!] Profil okunamadı (schema.sql çalıştırıldı mı?):', err)
        if (active) setProfile({ ...fallback, email: session.user.email ?? null })
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // --- Eylemler ----------------------------------------------------------
  const requireClient = () => {
    if (!supabase) throw new Error('Demo Modu: Gerçek giriş için Supabase yapılandırılmalı. Aşağıdaki demo hesaplarını kullanabilirsiniz.')
    return supabase
  }

  const signInWithGoogle = useCallback(async (next?: string) => {
    const client = requireClient()
    const redirectTo = `${getSiteUrl()}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams: { prompt: 'select_account' } },
    })
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const client = requireClient()
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const signUpWithEmail = useCallback(async (fullName: string, email: string, password: string) => {
    const client = requireClient()
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    })
    if (error) throw new Error(translateAuthError(error.message))
    return { needsConfirmation: !data.session }
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    const client = requireClient()
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${getSiteUrl()}/sifre-yenile`,
    })
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const client = requireClient()
    const { error } = await client.auth.updateUser({ password })
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const signInAsDemo = useCallback((role: 'student' | 'admin') => {
    if (!isDemoMode) return
    localStorage.setItem(DEMO_KEY, role)
    setDemoRole(role)
    setProfile(loadDemoProfile(role))
  }, [])

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      localStorage.removeItem(DEMO_KEY)
      setDemoRole(null)
      setProfile(null)
      return
    }
    await supabase?.auth.signOut()
    setProfile(null)
  }, [])

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      if (!profile) throw new Error('Oturum bulunamadı.')
      const updated = await apiUpdateProfile(profile.id, patch)
      setProfile((prev) => (prev ? { ...prev, ...(updated ?? patch), email: prev.email } : prev))
    },
    [profile],
  )

  const openAuth = useCallback((mode: AuthMode = 'login') => setAuthModal({ open: true, mode }), [])
  const closeAuth = useCallback(() => setAuthModal((s) => ({ ...s, open: false })), [])

  // --- Türetilmiş değerler ----------------------------------------------
  const user: AuthUser | null = isDemoMode
    ? demoRole && profile
      ? { id: profile.id, email: profile.email ?? null }
      : null
    : session
      ? { id: session.user.id, email: session.user.email ?? null }
      : null

  const role = user ? (profile?.role ?? 'student') : null

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile: user ? profile : null,
      loading,
      isDemo: isDemoMode,
      role,
      isStaff: role === 'teacher' || role === 'admin',
      isAdmin: role === 'admin',
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      sendPasswordReset,
      updatePassword,
      signInAsDemo,
      signOut,
      updateProfile,
      authModal,
      openAuth,
      closeAuth,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, profile, loading, role, authModal, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.')
  return ctx
}
