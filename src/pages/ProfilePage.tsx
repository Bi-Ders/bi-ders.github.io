import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, ClipboardCheck, LayoutDashboard, LogOut, Save, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, usePageMeta } from '../hooks'
import { getFavorites, getQuizResults } from '../services/api'
import { formatDate } from '../lib/utils'
import { Avatar, Badge, Chip, PageHeader, RoleBadge } from '../components/ui/Display'
import { Button, ButtonLink } from '../components/ui/Button'
import { Alert, EmptyState, ErrorState, RowSkeleton } from '../components/ui/Feedback'

type Tab = 'info' | 'favorites' | 'quizzes'

const USERNAME_RE = /^[a-z0-9_.]{3,30}$/

export function ProfilePage() {
  usePageMeta('Profilim')
  const { user, profile, isStaff, updateProfile, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('info')

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [school, setSchool] = useState(profile?.school ?? '')
  const [grade, setGrade] = useState(profile?.grade ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  const isTeacher = profile?.role === 'teacher'
  const gradeLabel = isTeacher ? 'Branş' : 'Sınıf / Hedef'

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setUsername(profile.username ?? '')
    setSchool(profile.school ?? '')
    setGrade(profile.grade ?? '')
    setBio(profile.bio ?? '')
  }, [profile])

  const favorites = useAsync(() => (user ? getFavorites(user.id) : Promise.resolve([])), [user?.id])
  const results = useAsync(() => (user ? getQuizResults(user.id) : Promise.resolve([])), [user?.id])

  const cleanName = fullName.trim()
  const cleanUser = username.trim().toLowerCase()
  const cleanSchool = school.trim()
  const cleanGrade = grade.trim()

  const nameError = touched
    ? cleanName.length < 2
      ? 'Ad Soyad alanı zorunludur (en az 2 karakter).'
      : cleanName.length > 120
        ? 'Ad Soyad en fazla 120 karakter olabilir.'
        : undefined
    : undefined
  const usernameError = touched
    ? !cleanUser
      ? 'Kullanıcı adı alanı zorunludur.'
      : !USERNAME_RE.test(cleanUser)
        ? '3–30 karakter; yalnızca küçük harf, rakam, "_" ve "." içerebilir.'
        : undefined
    : undefined
  const schoolError = touched
    ? cleanSchool.length < 2
      ? 'Okul alanı zorunludur.'
      : cleanSchool.length > 160
        ? 'Okul adı en fazla 160 karakter olabilir.'
        : undefined
    : undefined
  const gradeError = touched
    ? !cleanGrade
      ? isTeacher
        ? 'Branş alanı zorunludur.'
        : 'Sınıf / Hedef alanı zorunludur.'
      : cleanGrade.length > 40
        ? `${gradeLabel} en fazla 40 karakter olabilir.`
        : undefined
    : undefined

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    setSavedMsg(null)
    setErrMsg(null)

    if (
      cleanName.length < 2 ||
      cleanName.length > 120 ||
      !cleanUser ||
      !USERNAME_RE.test(cleanUser) ||
      cleanSchool.length < 2 ||
      cleanSchool.length > 160 ||
      !cleanGrade ||
      cleanGrade.length > 40
    ) {
      setErrMsg('Lütfen "Hakkında" dışındaki tüm zorunlu alanları eksiksiz ve geçerli şekilde doldur.')
      return
    }

    setSaving(true)
    try {
      await updateProfile({
        full_name: cleanName,
        username: cleanUser,
        school: cleanSchool,
        grade: cleanGrade,
        bio: bio.trim() || null,
      })
      setSavedMsg('Profil bilgilerin güncellendi.')
    } catch (err) {
      setErrMsg((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Hesabım"
        title={
          <span className="flex items-center gap-4">
            <Avatar name={profile?.full_name} src={profile?.avatar_url} size="lg" />
            <span>{profile?.full_name ?? 'Profilim'}</span>
          </span>
        }
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {profile && <RoleBadge role={profile.role} />}
            {profile?.email && <span>{profile.email}</span>}
            {profile?.school && <span>· {profile.school}</span>}
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {isStaff && (
              <ButtonLink to="/admin" variant="sun" size="sm" icon={<LayoutDashboard className="size-4" />}>
                Yönetim Paneli
              </ButtonLink>
            )}
            <Button variant="secondary" size="sm" onClick={() => void signOut()} icon={<LogOut className="size-4" />}>
              Çıkış Yap
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Chip active={tab === 'info'} onClick={() => setTab('info')}>
            <User className="size-4" aria-hidden /> Profil Bilgileri
          </Chip>
          <Chip active={tab === 'favorites'} onClick={() => setTab('favorites')}>
            <Bookmark className="size-4" aria-hidden /> Favorilerim ({favorites.data?.length ?? 0})
          </Chip>
          <Chip active={tab === 'quizzes'} onClick={() => setTab('quizzes')}>
            <ClipboardCheck className="size-4" aria-hidden /> Test Sonuçlarım ({results.data?.length ?? 0})
          </Chip>
        </div>
      </PageHeader>

      <section className="container-page max-w-3xl py-10">
        {tab === 'info' && (
          <form onSubmit={handleSave} noValidate className="card space-y-5 p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="p-name" className="label">
                  Ad Soyad <span className="text-danger" aria-hidden>*</span>
                </label>
                <input
                  id="p-name"
                  className="input"
                  required
                  maxLength={120}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? 'p-name-error' : undefined}
                  placeholder="Örn. Elif Yılmaz"
                />
                {nameError && (
                  <p id="p-name-error" className="mt-1.5 text-sm font-medium text-danger">
                    {nameError}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="p-username" className="label">
                  Kullanıcı Adı <span className="text-danger" aria-hidden>*</span>
                </label>
                <input
                  id="p-username"
                  className="input"
                  required
                  maxLength={30}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  aria-invalid={Boolean(usernameError)}
                  aria-describedby={usernameError ? 'p-username-error' : undefined}
                  placeholder="ornek.kullanici"
                />
                {usernameError && (
                  <p id="p-username-error" className="mt-1.5 text-sm font-medium text-danger">
                    {usernameError}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="p-school" className="label">
                  Okul <span className="text-danger" aria-hidden>*</span>
                </label>
                <input
                  id="p-school"
                  className="input"
                  required
                  maxLength={160}
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  aria-invalid={Boolean(schoolError)}
                  aria-describedby={schoolError ? 'p-school-error' : undefined}
                  placeholder="Okul adı"
                />
                {schoolError && (
                  <p id="p-school-error" className="mt-1.5 text-sm font-medium text-danger">
                    {schoolError}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="p-grade" className="label">
                  {gradeLabel} <span className="text-danger" aria-hidden>*</span>
                </label>
                <input
                  id="p-grade"
                  className="input"
                  required
                  maxLength={40}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  aria-invalid={Boolean(gradeError)}
                  aria-describedby={gradeError ? 'p-grade-error' : undefined}
                  placeholder={isTeacher ? 'Örn. Türkçe, Matematik, Fen Bilimleri' : 'Örn. 8. Sınıf / LGS'}
                />
                {gradeError && (
                  <p id="p-grade-error" className="mt-1.5 text-sm font-medium text-danger">
                    {gradeError}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="p-bio" className="label">
                Hakkında <span className="font-normal text-muted">(İsteğe bağlı)</span>
              </label>
              <textarea id="p-bio" rows={3} maxLength={500} className="input resize-y" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Kısaca kendinden bahset…" />
            </div>

            {errMsg && <Alert tone="error">{errMsg}</Alert>}
            {savedMsg && <Alert tone="success">{savedMsg}</Alert>}

            <Button type="submit" loading={saving} icon={<Save className="size-4" aria-hidden />}>
              Değişiklikleri Kaydet
            </Button>
          </form>
        )}

        {tab === 'favorites' && (
          <div className="card divide-y divide-line overflow-hidden">
            {favorites.loading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : favorites.error ? (
              <div className="p-5">
                <ErrorState message={favorites.error} onRetry={favorites.reload} />
              </div>
            ) : !favorites.data?.length ? (
              <div className="p-6">
                <EmptyState
                  icon={<Bookmark className="size-6" />}
                  title="Henüz favorin yok"
                  description="Beğendiğin dersleri, kitapları veya forum konularını kaydettiğinde burada listelenir."
                  action={<ButtonLink to="/dersler">Dersleri keşfet</ButtonLink>}
                />
              </div>
            ) : (
              favorites.data.map((f) => (
                <Link key={f.id} to={f.href} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-paper/70">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{f.title}</p>
                    <p className="text-xs text-muted">
                      {f.subtitle ? `${f.subtitle} · ` : ''}
                      {formatDate(f.created_at)}
                    </p>
                  </div>
                  <Badge tone="neutral">{f.item_type === 'content' ? 'Ders' : f.item_type === 'book' ? 'Kitap' : f.item_type === 'quiz' ? 'Test' : 'Forum'}</Badge>
                </Link>
              ))
            )}
          </div>
        )}

        {tab === 'quizzes' && (
          <div className="card divide-y divide-line overflow-hidden">
            {results.loading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : results.error ? (
              <div className="p-5">
                <ErrorState message={results.error} onRetry={results.reload} />
              </div>
            ) : !results.data?.length ? (
              <div className="p-6">
                <EmptyState
                  icon={<ClipboardCheck className="size-6" />}
                  title="Henüz tamamlanmış test yok"
                  description="Bir test çözdüğünde puanların ve süren burada görünür."
                  action={<ButtonLink to="/testler">Testlere git</ButtonLink>}
                />
              </div>
            ) : (
              results.data.map((r) => {
                const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0
                return (
                  <Link
                    key={r.id}
                    to={`/testler/${r.quiz_id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-paper/70"
                  >
                    <div>
                      <p className="font-semibold text-ink">{r.quiz?.title ?? 'Test'}</p>
                      <p className="text-xs text-muted">
                        {formatDate(r.created_at)}
                        {r.duration_seconds ? ` · ${Math.max(1, Math.round(r.duration_seconds / 60))} dk` : ''}
                      </p>
                    </div>
                    <Badge tone={pct >= 75 ? 'success' : pct >= 50 ? 'brand' : 'danger'}>
                      {r.score}/{r.total} (%{pct})
                    </Badge>
                  </Link>
                )
              })
            )}
          </div>
        )}
      </section>
    </div>
  )
}
