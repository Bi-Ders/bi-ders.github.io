import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Eye, Lock, MessageSquare, Pin, Plus, Search, ThumbsUp, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, useLockBody, usePageMeta } from '../hooks'
import { createForumTopic, getCategories, getForumTopics } from '../services/api'
import { formatNumber, timeAgo } from '../lib/utils'
import { Avatar, Badge, CategoryTag, Chip, PageHeader } from '../components/ui/Display'
import { Button } from '../components/ui/Button'
import { Alert, EmptyState, ErrorState, RowSkeleton } from '../components/ui/Feedback'
import type { Category } from '../types'

type StatusFilter = '' | 'solved' | 'open'

export function ForumPage() {
  usePageMeta('Forum', 'Takıldığın soruları sor, diğer öğrencilerle ve öğretmenlerle birlikte çöz.')
  const { user, profile, openAuth } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const categorySlug = params.get('kategori') ?? ''
  const query = params.get('ara') ?? ''
  const status = (params.get('durum') ?? '') as StatusFilter
  const [modalOpen, setModalOpen] = useState(false)

  const categories = useAsync(() => getCategories(), [])
  const topics = useAsync(
    () => getForumTopics({ categorySlug: categorySlug || undefined, query: query || undefined }),
    [categorySlug, query],
  )

  const setFilter = (key: 'kategori' | 'ara' | 'durum', val: string) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const visibleTopics = (topics.data ?? []).filter((t) => {
    if (status === 'solved') return t.is_solved
    if (status === 'open') return !t.is_solved && !t.is_locked
    return true
  })

  return (
    <div>
      <PageHeader
        eyebrow="Öğrenci Forumu"
        title="Soru sor, birlikte çöz"
        description="Çözemediğin bir soru mu var? Dersini seç, denemeni paylaş; topluluk ve öğretmenler yardım etsin."
        actions={
          <Button
            variant="sun"
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => {
              if (!user) return openAuth('login')
              setModalOpen(true)
            }}
          >
            Yeni Konu Aç
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setFilter('ara', e.target.value)}
                placeholder="Konu başlığı veya etiket ara…"
                aria-label="Forumda ara"
                className="input pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Durum filtresi">
              <Chip active={!status} onClick={() => setFilter('durum', '')}>
                Tümü
              </Chip>
              <Chip active={status === 'open'} onClick={() => setFilter('durum', 'open')}>
                Çözüm Bekleyenler
              </Chip>
              <Chip active={status === 'solved'} onClick={() => setFilter('durum', 'solved')}>
                <CheckCircle2 className="size-3.5" aria-hidden /> Çözülenler
              </Chip>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip active={!categorySlug} onClick={() => setFilter('kategori', '')}>
              Tüm Dersler
            </Chip>
            {(categories.data ?? []).map((c) => (
              <Chip key={c.id} active={categorySlug === c.slug} onClick={() => setFilter('kategori', c.slug)}>
                {c.name}
              </Chip>
            ))}
          </div>
        </div>
      </PageHeader>

      <section className="container-page py-10">
        {topics.loading ? (
          <div className="card divide-y divide-line overflow-hidden">
            {Array.from({ length: 5 }, (_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : topics.error ? (
          <ErrorState message={topics.error} onRetry={topics.reload} />
        ) : !visibleTopics.length ? (
          <EmptyState
            icon={<MessageSquare className="size-6" />}
            title="Bu filtrede forum konusu yok"
            description="Farklı bir kategori seçebilir, aramayı temizleyebilir veya ilk soruyu sen sorabilirsin."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {(categorySlug || query || status) && (
                  <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                    Filtreleri temizle
                  </Button>
                )}
                <Button
                  icon={<Plus className="size-4" aria-hidden />}
                  onClick={() => {
                    if (!user) return openAuth('login')
                    setModalOpen(true)
                  }}
                >
                  Yeni Konu Aç
                </Button>
              </div>
            }
          />
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {visibleTopics.map((t) => (
              <Link key={t.id} to={`/forum/${t.id}`} className="flex items-start gap-4 px-5 py-4 transition hover:bg-paper/70">
                <Avatar name={t.author?.full_name} src={t.author?.avatar_url} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {t.is_pinned && (
                      <Badge tone="sun">
                        <Pin className="size-3" aria-hidden /> Sabit
                      </Badge>
                    )}
                    {t.is_locked && (
                      <Badge tone="neutral">
                        <Lock className="size-3" aria-hidden /> Kilitli
                      </Badge>
                    )}
                    {t.is_solved && (
                      <Badge tone="success">
                        <CheckCircle2 className="size-3" aria-hidden /> Çözüldü
                      </Badge>
                    )}
                    {t.category && <CategoryTag name={t.category.name} color={t.category.color} />}
                  </div>
                  <h2 className="mt-1.5 font-sans text-base font-bold text-ink">{t.title}</h2>
                  <p className="mt-1 line-clamp-1 text-sm text-muted">{t.body}</p>
                  <p className="mt-2 text-xs text-muted">
                    {t.author?.full_name ?? 'Üye'} · Son etkinlik {timeAgo(t.last_activity_at)}
                  </p>
                </div>
                <div className="hidden shrink-0 items-center gap-3 self-center text-xs font-semibold text-muted sm:flex">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-paper-deep px-2.5 py-1.5 text-ink">
                    <MessageSquare className="size-3.5" aria-hidden /> {t.reply_count}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ThumbsUp className="size-3.5" aria-hidden /> {formatNumber(t.like_count ?? 0)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-3.5" aria-hidden /> {formatNumber(t.view_count)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {modalOpen && user && (
        <NewTopicModal
          categories={categories.data ?? []}
          author={{
            id: user.id,
            full_name: profile?.full_name ?? user.email?.split('@')[0] ?? 'Üye',
            avatar_url: profile?.avatar_url ?? null,
            role: profile?.role ?? 'student',
          }}
          onClose={() => setModalOpen(false)}
          onCreated={(createdId) => {
            setModalOpen(false)
            navigate(`/forum/${createdId}`)
          }}
        />
      )}
    </div>
  )
}

function NewTopicModal({
  categories,
  author,
  onClose,
  onCreated,
}: {
  categories: Category[]
  author: { id: string; full_name: string | null; avatar_url: string | null; role: 'student' | 'teacher' | 'admin' }
  onClose: () => void
  onCreated: (id: string) => void
}) {
  useLockBody(true)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [body, setBody] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (title.trim().length < 5) {
      setError('Konu başlığı en az 5 karakter olmalıdır.')
      return
    }
    if (body.trim().length < 10) {
      setError('Açıklama en az 10 karakter olmalıdır.')
      return
    }
    const tags = tagsRaw
      .split(',')
      .map((s) => s.trim().toLocaleLowerCase('tr-TR'))
      .filter(Boolean)
      .slice(0, 5)

    setBusy(true)
    try {
      const created = await createForumTopic(
        {
          title,
          body,
          category_id: categoryId || null,
          tags,
        },
        author,
      )
      onCreated(created.id)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-[#091129]/50 backdrop-blur-[2px] dark:bg-[#050a1a]/75" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-topic-title"
        className="relative max-h-[92dvh] w-full max-w-xl animate-pop-in overflow-y-auto rounded-t-3xl border border-line bg-paper p-6 shadow-[var(--shadow-pop)] sm:rounded-3xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-xl text-muted hover:bg-ink/5 hover:text-ink dark:hover:bg-white/10"
        >
          <X className="size-5" />
        </button>

        <p className="eyebrow">Öğrenci Forumu</p>
        <h2 id="new-topic-title" className="mt-1 text-2xl font-extrabold">
          Yeni Konu Aç
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          Konu başlığını anlaşılır yaz ve kendi çözüm denemeni paylaşırsan çok daha hızlı yanıt alırsın.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="ft-title" className="label">
              Konu Başlığı
            </label>
            <input
              id="ft-title"
              className="input"
              required
              minLength={5}
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Kareköklü sayılarda toplama işleminde takıldım"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ft-category" className="label">
                Ders Kategorisi
              </label>
              <select
                id="ft-category"
                className="input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Genel</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ft-tags" className="label">
                Etiketler (virgülle ayır)
              </label>
              <input
                id="ft-tags"
                className="input"
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="lgs, matematik, soru"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ft-body" className="label">
              Soru veya Konu Açıklaması
            </label>
            <textarea
              id="ft-body"
              rows={5}
              required
              minLength={10}
              className="input resize-y"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Sorunun detaylarını ve denediğin adımları yaz…"
            />
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit" loading={busy} icon={<Plus className="size-4" aria-hidden />}>
              Konuyu Yayınla
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
