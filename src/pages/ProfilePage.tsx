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

export function ProfilePage() {
  usePageMeta('Profilim')
  const { user, profile, isStaff, updateProfile, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('info')

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [school, setSchool] = useState(profile?.school ?? '')
  const [grade, setGrade] = useState(profile?.grade ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

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

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedMsg(null)
    setErrMsg(null)
    try {
      const cleanUser = username.trim().toLowerCase()
      if (cleanUser && !/^[a-z0-9_.]{3,30}$/.test(cleanUser)) {
        throw new Error('Kullanıcı adı 3–30 karakter olmalı; yalnızca küçük harf, rakam, "_" ve "." içerebilir.')
      }
      await updateProfile({
        full_name: fullName.trim() || null,
        username: cleanUser || null,
        school: school.trim() || null,
        grade: grade.trim() || null,
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
          <form onSubmit={handleSave} className="card space-y-5 p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="p-name" className="label">
                  Ad Soyad
                </label>
                <input id="p-name" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="p-username" className="label">
                  Kullanıcı Adı
                </label>
                <input id="p-username" className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ornek.kullanici" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="p-school" className="label">
                  Okul
                </label>
                <input id="p-school" className="input" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Okul adı" />
              </div>
              <div>
                <label htmlFor="p-grade" className="label">
                  Sınıf / Hedef
                </label>
                <input id="p-grade" className="input" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Örn. 8. Sınıf / LGS" />
              </div>
            </div>
            <div>
              <label htmlFor="p-bio" className="label">
                Hakkında
              </label>
              <textarea id="p-bio" rows={3} className="input resize-y" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Kısaca kendinden bahset…" />
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
