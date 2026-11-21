import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { translateAuthError, useAuth, type AuthMode } from '../context/AuthContext'
import { usePageMeta } from '../hooks'
import { AuthForm } from '../components/auth/AuthForm'
import { Alert, PageSpinner } from '../components/ui/Feedback'
import { Button, ButtonLink } from '../components/ui/Button'

/** Güvenli iç yönlendirme: yalnızca "/" ile başlayan yerel yollara izin verir */
function safeNext(raw: string | null, fallback = '/profil') {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback
  return raw
}

/** OAuth dönüşünde güvenli yönlendirme hedefi; geçersiz veya auth yollarında ana sayfaya döner */
function safeCallbackTarget(raw: string | null) {
  const target = safeNext(raw, '/')
  if (target.startsWith('/auth/callback') || target.startsWith('/giris') || target.startsWith('/kayit')) {
    return '/'
  }
  return target
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  usePageMeta(mode === 'register' ? 'Kayıt Ol' : 'Giriş Yap')
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))

  useEffect(() => {
    if (!loading && user) navigate(next, { replace: true })
  }, [loading, user, navigate, next])

  return (
    <div className="container-page flex justify-center py-10 sm:py-16">
      <div className="card w-full max-w-[460px] p-6 sm:p-8">
        <AuthForm
          idPrefix="page-auth"
          initialMode={mode}
          next={next}
          onSuccess={() => navigate(next, { replace: true })}
        />
      </div>
    </div>
  )
}

/** OAuth (Google) ve e-posta doğrulama dönüş noktası: /auth/callback */
export function AuthCallbackPage() {
  usePageMeta('Giriş tamamlanıyor')
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [asyncError, setAsyncError] = useState<string | null>(null)

  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''))
  const urlError =
    params.get('error_description') ??
    params.get('error') ??
    hashParams.get('error_description') ??
    hashParams.get('error')
  const error = urlError ?? asyncError
  const target = safeCallbackTarget(params.get('next'))

  useEffect(() => {
    if (urlError) return

    const client = supabase
    if (!client) {
      navigate(target, { replace: true })
      return
    }

    let settled = false
    const finish = (destination: string) => {
      if (settled) return
      settled = true
      navigate(destination, { replace: true })
    }

    // Supabase istemcisi detectSessionInUrl: true ile PKCE kodunu otomatik doğrular;
    // burada ikinci kez exchangeCodeForSession çağırmadan mevcut oturumu bekliyoruz.
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        finish('/sifre-yenile')
        return
      }
      if (session) {
        finish(target)
      }
    })

    const timeoutId = window.setTimeout(() => {
      if (!settled) {
        settled = true
        setAsyncError('Oturum doğrulaması zaman aşımına uğradı. Lütfen tekrar giriş yapmayı deneyin.')
      }
    }, 8000)

    void client.auth
      .getSession()
      .then(({ data, error: sessionErr }) => {
        if (settled) return
        if (sessionErr) {
          settled = true
          setAsyncError(sessionErr.message)
          return
        }
        if (data.session) {
          finish(target)
          return
        }
        const hasAuthParams =
          params.has('code') ||
          params.has('token_hash') ||
          location.hash.includes('access_token=')
        if (!hasAuthParams) {
          finish('/')
        }
      })
      .catch((err: unknown) => {
        if (settled) return
        settled = true
        setAsyncError(err instanceof Error ? err.message : 'Oturum doğrulanamadı.')
      })

    return () => {
      settled = true
      window.clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [location.hash, navigate, params, target, urlError])

  if (error) {
    return (
      <div className="container-page flex max-w-md flex-col items-center py-20 text-center">
        <Alert tone="error" className="w-full">
          Giriş tamamlanamadı: {translateAuthError(error)}
        </Alert>
        <ButtonLink to="/giris" className="mt-6">
          Giriş sayfasına dön
        </ButtonLink>
      </div>
    )
  }

  return <PageSpinner label="Oturum açılıyor, lütfen bekleyin…" />
}

/** Şifre yenileme bağlantısıyla açılan sayfa: /sifre-yenile */
export function ResetPasswordPage() {
  usePageMeta('Yeni Şifre Belirle')
  const { updatePassword, isDemo } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) return setError('Şifre en az 6 karakter olmalı.')
    if (password !== confirm) return setError('Şifreler birbiriyle eşleşmiyor.')
    setBusy(true)
    try {
      await updatePassword(password)
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-page flex justify-center py-12 sm:py-16">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">
          <KeyRound className="size-6 text-brand" aria-hidden /> Yeni şifre belirle
        </h1>
        {isDemo && (
          <Alert tone="warning" className="mt-4">
            Demo Modu'nda şifre yenileme devre dışıdır.
          </Alert>
        )}
        {done ? (
          <div className="mt-6 space-y-4">
            <Alert tone="success">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4" aria-hidden /> Şifren başarıyla güncellendi.
              </span>
            </Alert>
            <ButtonLink to="/profil" className="w-full">
              Profilime git
            </ButtonLink>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="new-pass" className="label">
                Yeni şifre
              </label>
              <input id="new-pass" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="En az 6 karakter" />
            </div>
            <div>
              <label htmlFor="confirm-pass" className="label">
                Yeni şifre (tekrar)
              </label>
              <input id="confirm-pass" type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <Alert tone="error">{error}</Alert>}
            <Button type="submit" size="lg" className="w-full" loading={busy} disabled={isDemo}>
              Şifreyi Güncelle
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
