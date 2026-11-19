import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Eye, Lock, MessageSquare, Pin, Plus, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, usePageMeta } from '../hooks'
import { getCategories, getForumTopics } from '../services/api'
import { formatNumber, timeAgo } from '../lib/utils'
import { Avatar, Badge, CategoryTag, Chip, PageHeader } from '../components/ui/Display'
import { Button } from '../components/ui/Button'
import { Alert, EmptyState, ErrorState, RowSkeleton } from '../components/ui/Feedback'

export function ForumPage() {
  usePageMeta('Forum', 'Takıldığın soruları sor, diğer öğrencilerle ve öğretmenlerle birlikte çöz.')
  const { user, openAuth } = useAuth()
  const [params, setParams] = useSearchParams()
  const categorySlug = params.get('kategori') ?? ''
  const query = params.get('ara') ?? ''
  const [notice, setNotice] = useState(false)

  const categories = useAsync(() => getCategories(), [])
  const topics = useAsync(() => getForumTopics({ categorySlug: categorySlug || undefined, query: query || undefined }), [categorySlug, query])

  const setFilter = (key: 'kategori' | 'ara', val: string) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <div>
      <PageHeader
        eyebrow="Öğrenci Forumu"
        title="Soru sor, birlikte çöz"
        description="Çözemediğin bir soru mu var? Dersini seç, denemeni paylaş; topluluk ve öğretmenler yardım etsin."
        actions={
          <Button
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => {
              if (!user) return openAuth('login')
              setNotice(true)
            }}
          >
            Yeni Konu Aç
          </Button>
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setFilter('ara', e.target.value)}
              placeholder="Konu başlığı ara…"
              aria-label="Forumda ara"
              className="input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip active={!categorySlug} onClick={() => setFilter('kategori', '')}>
              Tümü
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
        {notice && (
          <Alert tone="info" className="mb-6">
            Yeni konu açma ve cevap yazma düzenleyicisi bir sonraki adımda eklenecek. Mevcut konuları inceleyebilir ve favorilerine ekleyebilirsin.
          </Alert>
        )}

        {topics.loading ? (
          <div className="card divide-y divide-line overflow-hidden">
            {Array.from({ length: 5 }, (_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : topics.error ? (
          <ErrorState message={topics.error} onRetry={topics.reload} />
        ) : !topics.data?.length ? (
          <EmptyState
            icon={<MessageSquare className="size-6" />}
            title="Bu filtrede forum konusu yok"
            description="Farklı bir kategori seçebilir veya aramayı temizleyebilirsin."
            action={
              (categorySlug || query) && (
                <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                  Filtreleri temizle
                </Button>
              )
            }
          />
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {topics.data.map((t) => (
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
                <div className="hidden shrink-0 items-center gap-4 self-center text-xs font-semibold text-muted sm:flex">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-paper-deep px-2.5 py-1.5 text-ink">
                    <MessageSquare className="size-3.5" aria-hidden /> {t.reply_count}
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
    </div>
  )
}
