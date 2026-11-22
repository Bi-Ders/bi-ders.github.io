import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, EyeOff, GraduationCap, Mail, ShieldCheck } from 'lucide-react'
import { useAuth, type AuthMode } from '../../context/AuthContext'
import { cn, isEmail } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Feedback'
import { GoogleIcon } from '../ui/BrandIcons'

type AuthFormProps = {
  initialMode?: AuthMode
  /** Başarılı giriş sonrası çağrılır */
  onSuccess?: () => void
  /** OAuth dönüşünde gidilecek sayfa */
  next?: string
  idPrefix: string
  onModeChange?: (mode: AuthMode) => void
}

const titles: Record<AuthMode, { title: string; subtitle: string }> = {
  login: { title: 'Tekrar hoş geldin!', subtitle: 'Kaldığın yerden devam etmek için giriş yap.' },
  register: { title: 'Ücretsiz hesap oluştur', subtitle: 'Favorilerini kaydet, test sonuçlarını takip et, forumda soru sor.' },
  forgot: { title: 'Şifreni mi unuttun?', subtitle: 'E-posta adresini yaz, sana şifre yenileme bağlantısı gönderelim.' },
}

export function AuthForm({ initialMode = 'login', onSuccess, next, idPrefix, onModeChange }: AuthFormProps) {
  const { isDemo, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, signInAsDemo } = useAuth()
  const [mode, setModeState] = useState<AuthMode>(initialMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [busy, setBusy] = useState<null | 'google' | 'email'>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  useEffect(() => setModeState(initialMode), [initialMode])

  const setMode = (m: AuthMode) => {
    setModeState(m)
    setError(null)
    setInfo(null)
    setTouched(false)
    onModeChange?.(m)
  }

  const emailInvalid = touched && !isEmail(email)
  const passwordInvalid = touched && mode !== 'forgot' && password.length < 6
  const nameInvalid = touched && mode === 'register' && fullName.trim().length < 2

  const handleGoogle = async () => {
    setError(null)
    setBusy('google')
    try {
      await signInWithGoogle(next)
      // Tarayıcı Google'a yönlendirilecek
    } catch (err) {
      setError((err as Error).message)
      setBusy(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    setError(null)
    setInfo(null)
    if (!isEmail(email)) return
    if (mode !== 'forgot' && password.length < 6) return
    if (mode === 'register' && (fullName.trim().length < 2 || !acceptTerms)) {
      if (!acceptTerms) setError('Devam etmek için Kullanım Koşulları ve KVKK metnini onaylamalısın.')
      return
    }

    setBusy('email')
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
        onSuccess?.()
      } else if (mode === 'register') {
        const { needsConfirmation } = await signUpWithEmail(fullName, email, password)
        if (needsConfirmation) {
          setInfo(`${email} adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.`)
        } else {
          onSuccess?.()
        }
      } else {
        await sendPasswordReset(email)
        setInfo('Bu e-posta adresine kayıtlı bir hesap varsa şifre yenileme bağlantısı gönderildi.')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const demoLogin = (role: 'student' | 'admin') => {
    signInAsDemo(role)
    onSuccess?.()
  }

  const t = titles[mode]

  return (
    <div>
      {mode === 'forgot' && (
        <button type="button" onClick={() => setMode('login')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Girişe dön
        </button>
      )}

      <h2 id={`${idPrefix}-title`} className="text-2xl font-extrabold sm:text-[28px]">
        {t.title}
      </h2>
      <p className="mt-1.5 text-[15px] text-muted">{t.subtitle}</p>

      {isDemo && mode !== 'forgot' && (
        <section aria-labelledby={`${idPrefix}-demo`} className="mt-6 rounded-2xl border border-ink bg-sun-soft p-4 shadow-[0_2px_0_0_var(--color-ink)] dark:border-sun/45 dark:bg-[#142352] dark:shadow-none">
          <h3 id={`${idPrefix}-demo`} className="font-sans text-sm font-bold tracking-normal text-ink">
            Demo Modu — tek tıkla dene
          </h3>
          <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">Supabase henüz yapılandırılmadı. Örnek bir hesapla giriş yaparak tüm sayfaları deneyebilirsin.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <DemoButton id={`${idPrefix}-demo-student`} onClick={() => demoLogin('student')} icon={<GraduationCap className="size-5" />} title="Demo Öğrenci" subtitle="Profil, favoriler" />
            <DemoButton id={`${idPrefix}-demo-admin`} onClick={() => demoLogin('admin')} icon={<ShieldCheck className="size-5" />} title="Demo Öğretmen/Admin" subtitle="Yönetim paneli" />
          </div>
        </section>
      )}

      {mode !== 'forgot' && (
        <>
          <Button
            id={`${idPrefix}-google`}
            variant="secondary"
            size="lg"
            className="mt-6 w-full"
            onClick={handleGoogle}
            loading={busy === 'google'}
            disabled={busy !== null}
            icon={<GoogleIcon />}
          >
            Google ile {mode === 'register' ? 'Kayıt Ol' : 'Giriş Yap'}
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs font-semibold tracking-wider text-muted uppercase">
            <span className="h-px flex-1 bg-line" /> veya e-posta ile <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} noValidate className={cn('space-y-4', mode === 'forgot' && 'mt-6')}>
        {mode === 'register' && (
          <Field id={`${idPrefix}-name`} label="Ad Soyad" error={nameInvalid ? 'Lütfen adını ve soyadını yaz.' : undefined}>
            <input
              id={`${idPrefix}-name`}
              className="input"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={nameInvalid}
              aria-describedby={nameInvalid ? `${idPrefix}-name-error` : undefined}
              placeholder="Örn. Elif Yılmaz"
            />
          </Field>
        )}

        <Field id={`${idPrefix}-email`} label="E-posta" error={emailInvalid ? 'Geçerli bir e-posta adresi gir.' : undefined}>
          <input
            id={`${idPrefix}-email`}
            type="email"
            inputMode="email"
            className="input"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={emailInvalid}
            aria-describedby={emailInvalid ? `${idPrefix}-email-error` : undefined}
            placeholder="ornek@eposta.com"
          />
        </Field>

        {mode !== 'forgot' && (
          <Field
            id={`${idPrefix}-password`}
            label="Şifre"
            error={passwordInvalid ? 'Şifre en az 6 karakter olmalı.' : undefined}
            aside={
              mode === 'login' ? (
                <button type="button" onClick={() => setMode('forgot')} className="text-sm font-semibold text-brand hover:underline">
                  Şifremi unuttum
                </button>
              ) : undefined
            }
          >
            <div className="relative">
              <input
                id={`${idPrefix}-password`}
                type={showPassword ? 'text' : 'password'}
                className="input pr-11"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={passwordInvalid}
                aria-describedby={passwordInvalid ? `${idPrefix}-password-error` : undefined}
                placeholder={mode === 'register' ? 'En az 6 karakter' : '••••••••'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-paper hover:text-ink"
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
        )}

        {mode === 'register' && (
          <label className="flex items-start gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--color-ink)]"
            />
            <span>
              <a href="/kullanim-kosullari" target="_blank" className="font-semibold text-ink underline underline-offset-2">
                Kullanım Koşulları
              </a>
              'nı ve{' '}
              <a href="/kvkk" target="_blank" className="font-semibold text-ink underline underline-offset-2">
                KVKK Aydınlatma Metni
              </a>
              'ni okudum, kabul ediyorum.
            </span>
          </label>
        )}

        {error && <Alert tone="error">{error}</Alert>}
        {info && <Alert tone="success">{info}</Alert>}

        <Button id={`${idPrefix}-submit`} type="submit" size="lg" className="w-full" loading={busy === 'email'} disabled={busy !== null} icon={mode === 'forgot' ? <Mail className="size-4" /> : undefined}>
          {mode === 'login' ? 'Giriş Yap' : mode === 'register' ? 'Hesap Oluştur' : 'Bağlantı Gönder'}
        </Button>
      </form>

      {mode !== 'forgot' && (
        <p className="mt-6 text-center text-[15px] text-muted">
          {mode === 'login' ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-bold text-ink underline decoration-sun decoration-[3px] underline-offset-4 hover:decoration-brand">
            {mode === 'login' ? 'Ücretsiz kayıt ol' : 'Giriş yap'}
          </button>
        </p>
      )}
    </div>
  )
}

function Field({ id, label, error, aside, children }: { id: string; label: string; error?: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="label">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function DemoButton({ id, onClick, icon, title, subtitle }: { id: string; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-ink/80 bg-card px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:bg-paper active:translate-y-0 dark:border-line-strong dark:hover:border-sun/60 dark:hover:bg-[#203673]"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#12204a] text-sun transition group-hover:rotate-[-6deg] dark:bg-sun dark:text-[#12204a]" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-ink">{title}</span>
        <span className="block truncate text-xs text-muted">{subtitle}</span>
      </span>
    </button>
  )
}
