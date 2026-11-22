import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import type { EmailOtpType } from '@supabase/supabase-js'
import { CheckCircle2, KeyRound, LogIn } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { translateAuthError, useAuth, type AuthMode } from '../context/AuthContext'
import { usePageMeta } from '../hooks'
import { AuthForm } from '../components/auth/AuthForm'
import { Alert, PageSpinner } from '../components/ui/Feedback'
import { Button, ButtonLink } from '../components/ui/Button'

const EMAIL_OTP_TYPES: ReadonlySet<EmailOtpType> = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])

const CROSS_BROWSER_PKCE_MESSAGE =
  'Hesabınız doğrulandıysa doğrudan e-posta ve şifrenizle giriş yapabilirsiniz.'

type VerifyOtpResult = Awaited<ReturnType<NonNullable<typeof supabase>['auth']['verifyOtp']>>
const inflightVerifyOtp = new Map<string, Promise<VerifyOtpResult>>()

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && EMAIL_OTP_TYPES.has(value as EmailOtpType)
}

function isPkceCrossBrowserError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('code verifier') ||
    m.includes('code_verifier') ||
    m.includes('pkce') ||
    m.includes('flow state') ||
    m.includes('bad_code_verifier') ||
    m.includes('both auth code and code verifier')
  )
}

/** React StrictMode çift çalışmasında tek kullanımlık token_hash'in iki kez tüketilmesini önler */
function verifyOtpOnce(
  client: NonNullable<typeof supabase>,
  tokenHash: string,
  type: EmailOtpType,
): Promise<VerifyOtpResult> {
  const key = `${type}:${tokenHash}`
  const existing = inflightVerifyOtp.get(key)
  if (existing) return existing
  const promise = client.auth.verifyOtp({ token_hash: tokenHash, type })
  inflightVerifyOtp.set(key, promise)
  return promise
}

/** Güvenli iç yönlendirme: yalnızca aynı kaynaklı veya "/" ile başlayan yerel yollara izin verir */
function safeNext(raw: string | null, fallback = '/profil') {
  if (!raw) return fallback
  let path = raw.trim()
  if (/^https?:\/\//i.test(path)) {
    try {
      const parsed = new URL(path)
      if (parsed.origin !== window.location.origin) return fallback
      path = `${parsed.pathname}${parsed.search}${parsed.hash}`
    } catch {
      return fallback
    }
  }
  if (!path.startsWith('/') || path.startsWith('//')) return fallback
  return path
}

/** OAuth ve e-posta dönüşünde güvenli yönlendirme hedefi; geçersiz veya auth yollarında ana sayfaya döner */
function safeCallbackTarget(raw: string | null) {
  const target = safeNext(raw, '/')
  if (target.startsWith('/auth/callback') || target.startsWith('/giris') || target.startsWith('/kayit')) {
    return '/'
  }
  return target
}

type CallbackOutcome =
  | { kind: 'error'; message: string }
  | { kind: 'info'; message: string; detail?: string }

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
  const [outcome, setOutcome] = useState<CallbackOutcome | null>(null)

  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''))
  const urlError =
    params.get('error_description') ??
    params.get('error') ??
    hashParams.get('error_description') ??
    hashParams.get('error')
  const tokenHash = params.get('token_hash') ?? hashParams.get('token_hash')
  const rawType = params.get('type') ?? (tokenHash ? hashParams.get('type') : null)
  const pkceCode = params.get('code')
  const hasImplicitToken = hashParams.has('access_token')
  const isRecoveryHash = !tokenHash && hashParams.get('type') === 'recovery'
  const target = safeCallbackTarget(params.get('next'))

  const derivedUrlOutcome: CallbackOutcome | null = urlError
    ? isPkceCrossBrowserError(urlError)
      ? {
          kind: 'info',
          message: CROSS_BROWSER_PKCE_MESSAGE,
          detail: 'Doğrulama bağlantısı farklı bir tarayıcıda açıldığı için oturum otomatik başlatılamadı.',
        }
      : { kind: 'error', message: translateAuthError(urlError) }
    : null

  const activeOutcome = derivedUrlOutcome ?? outcome

  useEffect(() => {
    if (urlError) return

    const client = supabase
    if (!client) {
      navigate(target, { replace: true })
      return
    }

    let settled = false
    let timeoutId: number | undefined
    let pkceFallbackTimerId: number | undefined

    const clearTimers = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      if (pkceFallbackTimerId !== undefined) window.clearTimeout(pkceFallbackTimerId)
    }

    const finish = (destination: string) => {
      if (settled) return
      settled = true
      clearTimers()
      navigate(destination, { replace: true })
    }

    const showPkceFallback = () => {
      if (settled) return
      settled = true
      clearTimers()
      setOutcome({
        kind: 'info',
        message: CROSS_BROWSER_PKCE_MESSAGE,
        detail:
          'Doğrulama bağlantısı farklı bir tarayıcıda (ör. uygulama içi tarayıcıda) açıldığı için oturum otomatik başlatılamadı.',
      })
    }

    // 1) Tarayıcıdan bağımsız e-posta doğrulama: ?token_hash=...&type=...
    if (tokenHash) {
      const otpType: EmailOtpType | null =
        rawType === null ? 'email' : isEmailOtpType(rawType) ? rawType : null

      if (!otpType) {
        setOutcome({
          kind: 'error',
          message: 'Geçersiz doğrulama bağlantısı. Lütfen e-postanızdaki bağlantıyı kontrol edin.',
        })
        return
      }

      const otpTarget = otpType === 'recovery' && target === '/' ? '/sifre-yenile' : target

      timeoutId = window.setTimeout(() => {
        if (!settled) {
          settled = true
          setOutcome({
            kind: 'error',
            message: 'Oturum doğrulaması zaman aşımına uğradı. Lütfen tekrar giriş yapmayı deneyin.',
          })
        }
      }, 12000)

      void verifyOtpOnce(client, tokenHash, otpType)
        .then(async ({ data, error: verifyErr }) => {
          if (settled) return
          clearTimers()
          if (verifyErr) {
            settled = true
            setOutcome({
              kind: 'error',
              message: translateAuthError(verifyErr.message),
            })
            return
          }
          if (data.session) {
            finish(otpTarget)
            return
          }
          const { data: sessionData } = await client.auth.getSession()
          if (settled) return
          if (sessionData.session) {
            finish(otpTarget)
            return
          }
          settled = true
          setOutcome({
            kind: 'info',
            message: CROSS_BROWSER_PKCE_MESSAGE,
            detail: 'E-posta doğrulamanız tamamlandı.',
          })
        })
        .catch((err: unknown) => {
          if (settled) return
          clearTimers()
          settled = true
          setOutcome({
            kind: 'error',
            message: err instanceof Error ? translateAuthError(err.message) : 'Doğrulama tamamlanamadı.',
          })
        })

      return () => {
        settled = true
        clearTimers()
      }
    }

    // 2) PKCE (?code=...) veya implicit (#access_token=...) akışı
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
        finish(isRecoveryHash ? '/sifre-yenile' : target)
      }
    })

    timeoutId = window.setTimeout(() => {
      if (settled) return
      if (pkceCode) {
        showPkceFallback()
      } else {
        settled = true
        setOutcome({
          kind: 'error',
          message: 'Oturum doğrulaması zaman aşımına uğradı. Lütfen tekrar giriş yapmayı deneyin.',
        })
      }
    }, 10000)

    void client.auth
      .getSession()
      .then(({ data, error: sessionErr }) => {
        if (settled) return
        if (sessionErr) {
          if (pkceCode || isPkceCrossBrowserError(sessionErr.message)) {
            showPkceFallback()
          } else {
            settled = true
            clearTimers()
            setOutcome({ kind: 'error', message: translateAuthError(sessionErr.message) })
          }
          return
        }
        if (data.session) {
          finish(isRecoveryHash ? '/sifre-yenile' : target)
          return
        }
        // getSession() istemcinin URL algılama sürecini bekler. PKCE ?code=... gelmesine
        // rağmen oturum oluşmadıysa (ör. mobil Gmail içi tarayıcıda code_verifier yoksa)
        // zaman aşımına düşmeden doğrudan giriş mesajını gösteriyoruz.
        if (pkceCode) {
          pkceFallbackTimerId = window.setTimeout(() => {
            showPkceFallback()
          }, 150)
          return
        }
        if (!hasImplicitToken) {
          finish('/')
        }
      })
      .catch((err: unknown) => {
        if (settled) return
        if (pkceCode || (err instanceof Error && isPkceCrossBrowserError(err.message))) {
          showPkceFallback()
        } else {
          settled = true
          clearTimers()
          setOutcome({
            kind: 'error',
            message: err instanceof Error ? translateAuthError(err.message) : 'Oturum doğrulanamadı.',
          })
        }
      })

    return () => {
      settled = true
      clearTimers()
      subscription.unsubscribe()
    }
  }, [hasImplicitToken, isRecoveryHash, navigate, pkceCode, rawType, target, tokenHash, urlError])

  if (activeOutcome) {
    if (activeOutcome.kind === 'info') {
      return (
        <div className="container-page flex max-w-md flex-col items-center py-20 text-center">
          <div className="card w-full p-6 sm:p-8">
            <Alert tone="info" className="w-full text-left">
              {activeOutcome.detail && (
                <p className="mb-1.5 text-xs font-normal text-muted">{activeOutcome.detail}</p>
              )}
              <p className="font-semibold text-ink">{activeOutcome.message}</p>
            </Alert>
            <ButtonLink to="/giris" size="lg" className="mt-6 w-full" icon={<LogIn className="size-4" aria-hidden />}>
              Giriş Yap
            </ButtonLink>
          </div>
        </div>
      )
    }

    return (
      <div className="container-page flex max-w-md flex-col items-center py-20 text-center">
        <Alert tone="error" className="w-full">
          Giriş tamamlanamadı: {activeOutcome.message}
        </Alert>
        <ButtonLink to="/giris" className="mt-6" icon={<LogIn className="size-4" aria-hidden />}>
          Giriş Yap
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
