import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BookMarked,
  BookOpen,
  ClipboardCheck,
  Gamepad2,
  Mail,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, usePageMeta } from '../hooks'
import {
  getAdminStats,
  getAllProfiles,
  getCategories,
  getContactMessages,
  setUserRole,
} from '../services/api'
import { formatDate, roleLabels } from '../lib/utils'
import type { AuthorSummary, Role } from '../types'
import { ResourceManager } from '../components/admin/ResourceManager'
import { ActivityManager } from '../components/admin/ActivityManager'
import { QuizManager } from '../components/admin/QuizManager'
import { BookManager } from '../components/admin/BookManager'
import { Avatar, Badge, Chip, PageHeader, RoleBadge } from '../components/ui/Display'
import { Alert, EmptyState, ErrorState, RowSkeleton, Skeleton } from '../components/ui/Feedback'

type AdminTab = 'resources' | 'activities' | 'quizzes' | 'books' | 'messages' | 'users'

const VALID_TABS: AdminTab[] = ['resources', 'activities', 'quizzes', 'books', 'messages', 'users']

export function AdminPage() {
  usePageMeta('Yönetim Paneli', 'Bi Ders! içerik ekleme, test oluşturma, oyun-etkinlik ve kitap mağazası yönetimi.')
  const { user, profile, isAdmin, isDemo } = useAuth()
  const [params, setParams] = useSearchParams()
  const [feedback, setFeedback] = useState<string | null>(null)

  const rawTab = params.get('sekme') as AdminTab | null
  const tab: AdminTab =
    rawTab && VALID_TABS.includes(rawTab) && (isAdmin || (rawTab !== 'messages' && rawTab !== 'users'))
      ? rawTab
      : 'resources'

  const setTab = (nextTab: AdminTab) => {
    const next = new URLSearchParams(params)
    next.set('sekme', nextTab)
    setParams(next, { replace: true })
    setFeedback(null)
  }

  const stats = useAsync(() => getAdminStats(), [])
  const categories = useAsync(() => getCategories(), [])
  const messages = useAsync(() => (isAdmin ? getContactMessages() : Promise.resolve([])), [isAdmin])
  const users = useAsync(() => (isAdmin ? getAllProfiles() : Promise.resolve([])), [isAdmin])

  const currentAuthor: AuthorSummary = {
    id: profile?.id ?? user?.id ?? 'admin',
    full_name: profile?.full_name ?? 'Bi Ders! Editör',
    avatar_url: profile?.avatar_url ?? null,
    role: profile?.role ?? 'admin',
  }

  const handleRoleChange = async (userId: string, role: Role) => {
    setFeedback(null)
    try {
      await setUserRole(userId, role)
      users.setData((prev) => prev?.map((u) => (u.id === userId ? { ...u, role } : u)) ?? prev)
      setFeedback(`Kullanıcı rolü "${roleLabels[role]}" olarak güncellendi.`)
    } catch (err) {
      setFeedback(`Hata: ${(err as Error).message}`)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={isDemo ? 'Yönetim Paneli · Demo Modu (localStorage Kalıcı)' : 'Yönetim Paneli'}
        title="İçerik, modül ve mağaza yönetimi"
        description={
          isAdmin
            ? 'Ders notları, sunular, yazılılar, evraklar, iframe oyun/etkinlikler, online testler ve kitap mağazasını tek yerden yönet. Eklediğin her içerik ilgili modül sayfasında anında yayınlanır.'
            : 'Öğretmen hesabınla ders notları, sunular, etkinlikler, online testler ve kitap kayıtları oluşturabilirsin.'
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.loading ? (
            Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
          ) : stats.data ? (
            <>
              <StatTile icon={<BookOpen className="size-4" />} label="Doküman & Ders" value={stats.data.contents} />
              <StatTile icon={<Gamepad2 className="size-4" />} label="Oyun & Etkinlik" value={stats.data.activities} />
              <StatTile icon={<ClipboardCheck className="size-4" />} label="Online Test" value={stats.data.quizzes} />
              <StatTile icon={<BookMarked className="size-4" />} label="Kitaplar" value={stats.data.books} />
              <StatTile icon={<Users className="size-4" />} label="Üyeler" value={stats.data.users} />
              <StatTile
                icon={<Mail className="size-4" />}
                label="Yeni Mesaj"
                value={stats.data.newMessages}
                highlight={stats.data.newMessages > 0}
              />
            </>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Yönetim paneli sekmeleri">
          <Chip active={tab === 'resources'} onClick={() => setTab('resources')}>
            <BookOpen className="size-3.5" aria-hidden /> Doküman &amp; Dersler
          </Chip>
          <Chip active={tab === 'activities'} onClick={() => setTab('activities')}>
            <Gamepad2 className="size-3.5" aria-hidden /> Oyun &amp; Etkinlikler
          </Chip>
          <Chip active={tab === 'quizzes'} onClick={() => setTab('quizzes')}>
            <ClipboardCheck className="size-3.5" aria-hidden /> Online Testler
          </Chip>
          <Chip active={tab === 'books'} onClick={() => setTab('books')}>
            <BookMarked className="size-3.5" aria-hidden /> Kitap Mağazası
          </Chip>
          {isAdmin && (
            <>
              <Chip active={tab === 'messages'} onClick={() => setTab('messages')}>
                <Mail className="size-3.5" aria-hidden /> Mesajlar ({messages.data?.length ?? 0})
              </Chip>
              <Chip active={tab === 'users'} onClick={() => setTab('users')}>
                <Users className="size-3.5" aria-hidden /> Kullanıcılar ({users.data?.length ?? 0})
              </Chip>
            </>
          )}
        </div>
      </PageHeader>

      <section className="container-page py-10">
        {feedback && (
          <Alert tone={feedback.startsWith('Hata:') ? 'error' : 'success'} className="mb-6">
            {feedback}
          </Alert>
        )}

        {tab === 'resources' && user && (
          <ResourceManager
            categories={categories.data ?? []}
            author={currentAuthor}
            userId={user.id}
            isAdmin={isAdmin}
            onChanged={stats.reload}
          />
        )}

        {tab === 'activities' && (
          <ActivityManager
            categories={categories.data ?? []}
            author={currentAuthor}
            onChanged={stats.reload}
          />
        )}

        {tab === 'quizzes' && (
          <QuizManager
            categories={categories.data ?? []}
            author={currentAuthor}
            onChanged={stats.reload}
          />
        )}

        {tab === 'books' && user && (
          <BookManager
            categories={categories.data ?? []}
            userId={user.id}
            onChanged={stats.reload}
          />
        )}

        {tab === 'messages' && isAdmin && (
          <div className="card divide-y divide-line overflow-hidden">
            {messages.loading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : messages.error ? (
              <div className="p-5">
                <ErrorState message={messages.error} onRetry={messages.reload} />
              </div>
            ) : !messages.data?.length ? (
              <div className="p-6">
                <EmptyState icon={<Mail className="size-6" />} title="Gelen mesaj yok" />
              </div>
            ) : (
              messages.data.map((m) => (
                <div key={m.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">
                      {m.name} <span className="font-normal text-muted">({m.email})</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge tone={m.status === 'new' ? 'sun' : 'neutral'}>{m.status === 'new' ? 'Yeni' : 'Okundu'}</Badge>
                      <span className="text-xs text-muted">{formatDate(m.created_at)}</span>
                    </div>
                  </div>
                  {m.subject && <p className="mt-1 text-sm font-semibold text-ink-soft">{m.subject}</p>}
                  <p className="mt-1 text-sm text-muted">{m.message}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'users' && isAdmin && (
          <div className="card divide-y divide-line overflow-hidden">
            {users.loading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : users.error ? (
              <div className="p-5">
                <ErrorState message={users.error} onRetry={users.reload} />
              </div>
            ) : (
              (users.data ?? []).map((u) => (
                <div key={u.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.full_name} src={u.avatar_url} size="sm" />
                    <div>
                      <p className="font-semibold text-ink">{u.full_name ?? 'İsimsiz üye'}</p>
                      <p className="text-xs text-muted">{u.school ?? u.username ?? formatDate(u.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RoleBadge role={u.role} />
                    <label className="sr-only" htmlFor={`role-${u.id}`}>
                      Rol seç
                    </label>
                    <select
                      id={`role-${u.id}`}
                      value={u.role}
                      disabled={u.id === user?.id}
                      onChange={(e) => void handleRoleChange(u.id, e.target.value as Role)}
                      className="rounded-lg border border-line-strong bg-white px-2.5 py-1.5 text-xs font-semibold text-ink disabled:opacity-50"
                    >
                      <option value="student">Öğrenci</option>
                      <option value="teacher">Öğretmen</option>
                      <option value="admin">Yönetici</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function StatTile({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? 'border-ink bg-sun-soft' : 'border-line bg-white'}`}>
      <div className="flex items-center gap-2 text-xs font-semibold text-muted">
        <span className="text-brand" aria-hidden>
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-1 font-display text-2xl font-extrabold text-ink">{value}</p>
    </div>
  )
}
