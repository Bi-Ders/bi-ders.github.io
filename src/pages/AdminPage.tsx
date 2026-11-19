import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookMarked, BookOpen, ClipboardCheck, Mail, MessageSquare, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, usePageMeta } from '../hooks'
import { getAdminStats, getAllProfiles, getContactMessages, getManagedContents, setUserRole } from '../services/api'
import { formatDate, roleLabels } from '../lib/utils'
import type { Role } from '../types'
import { Avatar, Badge, Chip, PageHeader, RoleBadge } from '../components/ui/Display'
import { Alert, EmptyState, ErrorState, RowSkeleton, Skeleton } from '../components/ui/Feedback'

type AdminTab = 'contents' | 'messages' | 'users'

export function AdminPage() {
  usePageMeta('Yönetim Paneli')
  const { user, isAdmin } = useAuth()
  const [tab, setTab] = useState<AdminTab>('contents')
  const [feedback, setFeedback] = useState<string | null>(null)

  const stats = useAsync(() => getAdminStats(), [])
  const contents = useAsync(() => (user ? getManagedContents(user.id, isAdmin) : Promise.resolve([])), [user?.id, isAdmin])
  const messages = useAsync(() => (isAdmin ? getContactMessages() : Promise.resolve([])), [isAdmin])
  const users = useAsync(() => (isAdmin ? getAllProfiles() : Promise.resolve([])), [isAdmin])

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
        eyebrow="Yönetim Paneli"
        title="İçerik ve topluluk yönetimi"
        description={isAdmin ? 'Yönetici yetkisiyle tüm istatistikleri, içerikleri, mesajları ve kullanıcı rollerini yönetebilirsin.' : 'Öğretmen hesabınla kendi ders notlarını ve içeriklerini takip edebilirsin.'}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.loading ? (
            Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
          ) : stats.data ? (
            <>
              <StatTile icon={<Users className="size-4" />} label="Üyeler" value={stats.data.users} />
              <StatTile icon={<BookOpen className="size-4" />} label="Dersler" value={stats.data.contents} />
              <StatTile icon={<MessageSquare className="size-4" />} label="Forum" value={stats.data.topics} />
              <StatTile icon={<ClipboardCheck className="size-4" />} label="Testler" value={stats.data.quizzes} />
              <StatTile icon={<BookMarked className="size-4" />} label="Kitaplar" value={stats.data.books} />
              <StatTile icon={<Mail className="size-4" />} label="Yeni Mesaj" value={stats.data.newMessages} highlight={stats.data.newMessages > 0} />
            </>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Chip active={tab === 'contents'} onClick={() => setTab('contents')}>
            İçerikler ({contents.data?.length ?? 0})
          </Chip>
          {isAdmin && (
            <>
              <Chip active={tab === 'messages'} onClick={() => setTab('messages')}>
                İletişim Mesajları ({messages.data?.length ?? 0})
              </Chip>
              <Chip active={tab === 'users'} onClick={() => setTab('users')}>
                Kullanıcılar ({users.data?.length ?? 0})
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

        {tab === 'contents' && (
          <div className="card divide-y divide-line overflow-hidden">
            {contents.loading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : contents.error ? (
              <div className="p-5">
                <ErrorState message={contents.error} onRetry={contents.reload} />
              </div>
            ) : !contents.data?.length ? (
              <div className="p-6">
                <EmptyState icon={<BookOpen className="size-6" />} title="Henüz içerik yok" />
              </div>
            ) : (
              contents.data.map((c) => (
                <Link key={c.id} to={`/dersler/${c.slug}`} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition hover:bg-paper/70">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{c.title}</p>
                    <p className="text-xs text-muted">
                      {c.category?.name ?? 'Genel'} · {c.author?.full_name ?? '—'} · {formatDate(c.created_at)}
                    </p>
                  </div>
                  <Badge tone={c.status === 'published' ? 'success' : 'neutral'}>
                    {c.status === 'published' ? 'Yayında' : c.status === 'draft' ? 'Taslak' : c.status}
                  </Badge>
                </Link>
              ))
            )}
          </div>
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
