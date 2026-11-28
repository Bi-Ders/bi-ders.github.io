import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, BookOpen, Eye, EyeOff, GraduationCap, Info, Mail, ShieldCheck } from 'lucide-react'
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

type AccountType = 'student' | 'teacher'

const USERNAME_RE = /^[a-z0-9_.]{3,30}$/

const titles: Record<AuthMode, { title: string; subtitle: string }> = {
  login: { title: 'Tekrar hoş geldin!', subtitle: 'Kaldığın yerden devam etmek için giriş yap.' },
  register: { title: 'Ücretsiz hesap oluştur', subtitle: 'Favorilerini kaydet, test sonuçlarını takip et, forumda soru sor.' },
  forgot: { title: 'Şifreni mi unuttun?', subtitle: 'E-posta adresini yaz, sana şifre yenileme bağlantısı gönderelim.' },
}

export function AuthForm({ initialMode = 'login', onSuccess, next, idPrefix, onModeChange }: AuthFormProps) {
  const { isDemo, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, signInAsDemo } = useAuth()
  const [mode, setModeState] = useState<AuthMode>(initialMode)
  const [accountType, setAccountType] = useState<AccountType>('student')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [school, setSchool] = useState('')
  const [grade, setGrade] = useState('')
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

  const isTeacher = accountType === 'teacher'
  const cleanName = fullName.trim()
  const cleanUsername = username.trim().toLowerCase()
  const cleanSchool = school.trim()
  const cleanGrade = grade.trim()

  const emailInvalid = touched && !isEmail(email)
  const passwordInvalid = touched && mode !== 'forgot' && password.length < 6
  const nameInvalid = touched && mode === 'register' && (cleanName.length < 2 || cleanName.length > 120)
  const usernameError =
    touched && mode === 'register'
      ? !cleanUsername
        ? 'Lütfen bir kullanıcı adı belirle.'
        : !USERNAME_RE.test(cleanUsername)
          ? '3–30 karakter; yalnızca küçük harf, rakam, "_" ve "." kullanabilirsin.'
          : undefined
      : undefined
  const schoolInvalid = touched && mode === 'register' && (cleanSchool.length < 2 || cleanSchool.length > 160)
  const gradeError =
    touched && mode === 'register'
      ? !cleanGrade
        ? isTeacher
          ? 'Lütfen branş bilgisini yaz.'
          : 'Lütfen sınıf veya hedef bilgisini yaz.'
        : cleanGrade.length > 40
          ? isTeacher
            ? 'Branş bilgisi en fazla 40 karakter olabilir.'
            : 'Sınıf / Hedef bilgisi en fazla 40 karakter olabilir.'
          : undefined
      : undefined

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

    if (mode === 'register') {
      const hasInvalidField =
        cleanName.length < 2 ||
        cleanName.length > 120 ||
        !cleanUsername ||
        !USERNAME_RE.test(cleanUsername) ||
        cleanSchool.length < 2 ||
        cleanSchool.length > 160 ||
        !cleanGrade ||
        cleanGrade.length > 40 ||
        !isEmail(email) ||
        password.length < 6

      if (hasInvalidField) {
        setError('Lütfen tüm zorunlu alanları eksiksiz ve geçerli şekilde doldur.')
        return
      }
      if (!acceptTerms) {
        setError('Devam etmek için Kullanım Koşulları ve KVKK metnini onaylamalısın.')
        return
      }
    } else {
      if (!isEmail(email)) {
        setError('Lütfen geçerli bir e-posta adresi gir.')
        return
      }
      if (mode !== 'forgot' && password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır.')
        return
      }
    }

    setBusy('email')
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
        onSuccess?.()
      } else if (mode === 'register') {
        const { needsConfirmation } = await signUpWithEmail({
          fullName: cleanName,
          username: cleanUsername,
          school: cleanSchool,
          grade: cleanGrade,
          email,
          password,
          requestedTeacher: isTeacher,
        })
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
          <>
            <div>
              <span className="label">Hesap Türü</span>
              <div
                role="radiogroup"
                aria-label="Hesap türü seçimi"
                className="grid grid-cols-2 gap-2.5"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={accountType === 'student'}
                  onClick={() => setAccountType('student')}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition',
                    accountType === 'student'
                      ? 'border-ink bg-sun-soft text-ink shadow-[0_2px_0_0_var(--color-ink)] dark:border-sun dark:bg-[#1e3168] dark:shadow-none'
                      : 'border-line-strong bg-card text-ink-soft hover:border-ink/50 hover:text-ink dark:hover:border-sun/50',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-lg transition',
                      accountType === 'student'
                        ? 'bg-ink text-sun dark:bg-sun dark:text-[#12204a]'
                        : 'bg-paper-deep text-muted',
                    )}
                    aria-hidden
                  >
                    <GraduationCap className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-tight">Öğrenciyim</span>
                    <span className="block truncate text-[11px] text-muted">Ders, test, forum</span>
                  </span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={accountType === 'teacher'}
                  onClick={() => setAccountType('teacher')}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition',
                    accountType === 'teacher'
                      ? 'border-ink bg-sun-soft text-ink shadow-[0_2px_0_0_var(--color-ink)] dark:border-sun dark:bg-[#1e3168] dark:shadow-none'
                      : 'border-line-strong bg-card text-ink-soft hover:border-ink/50 hover:text-ink dark:hover:border-sun/50',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-lg transition',
                      accountType === 'teacher'
                        ? 'bg-ink text-sun dark:bg-sun dark:text-[#12204a]'
                        : 'bg-paper-deep text-muted',
                    )}
                    aria-hidden
                  >
                    <BookOpen className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-tight">Öğretmenim</span>
                    <span className="block truncate text-[11px] text-muted">İçerik &amp; kaynak</span>
                  </span>
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`${idPrefix}-name`} label="Ad Soyad" required error={nameInvalid ? 'Lütfen adını ve soyadını yaz.' : undefined}>
                <input
                  id={`${idPrefix}-name`}
                  className="input"
                  autoComplete="name"
                  required
                  maxLength={120}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  aria-invalid={nameInvalid}
                  aria-describedby={nameInvalid ? `${idPrefix}-name-error` : undefined}
                  placeholder="Örn. Elif Yılmaz"
                />
              </Field>

              <Field id={`${idPrefix}-username`} label="Kullanıcı Adı" required error={usernameError}>
                <input
                  id={`${idPrefix}-username`}
                  className="input"
                  autoComplete="username"
                  required
                  maxLength={30}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  aria-invalid={Boolean(usernameError)}
                  aria-describedby={usernameError ? `${idPrefix}-username-error` : undefined}
                  placeholder="ornek.kullanici"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`${idPrefix}-school`} label="Okul" required error={schoolInvalid ? 'Lütfen okul adını yaz.' : undefined}>
                <input
                  id={`${idPrefix}-school`}
                  className="input"
                  required
                  maxLength={160}
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  aria-invalid={schoolInvalid}
                  aria-describedby={schoolInvalid ? `${idPrefix}-school-error` : undefined}
                  placeholder="Okul adı"
                />
              </Field>

              <Field
                id={`${idPrefix}-grade`}
                label={isTeacher ? 'Branş' : 'Sınıf / Hedef'}
                required
                error={gradeError}
              >
                <input
                  id={`${idPrefix}-grade`}
                  className="input"
                  required
                  maxLength={40}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  aria-invalid={Boolean(gradeError)}
                  aria-describedby={gradeError ? `${idPrefix}-grade-error` : undefined}
                  placeholder={isTeacher ? 'Örn. Türkçe, Matematik, Fen Bilimleri' : 'Örn. 8. Sınıf / LGS'}
                />
              </Field>
            </div>
          </>
        )}

        <Field id={`${idPrefix}-email`} label="E-posta" required={mode === 'register'} error={emailInvalid ? 'Geçerli bir e-posta adresi gir.' : undefined}>
          <input
            id={`${idPrefix}-email`}
            type="email"
            inputMode="email"
            className="input"
            autoComplete="email"
            required
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
            required={mode === 'register'}
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
                required
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

        {mode === 'register' && isTeacher && (
          <p className="flex items-start gap-2 rounded-xl border border-brand/25 bg-brand-soft/60 px-3.5 py-2.5 text-xs leading-relaxed text-ink-soft dark:border-sun/35 dark:bg-[#182a5d]">
            <Info className="mt-0.5 size-4 shrink-0 text-brand dark:text-sun" aria-hidden />
            <span>Öğretmen yetkiniz yönetici doğrulamasından sonra aktifleşecektir.</span>
          </p>
        )}
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

function Field({
  id,
  label,
  required,
  error,
  aside,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="label">
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          )}
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
