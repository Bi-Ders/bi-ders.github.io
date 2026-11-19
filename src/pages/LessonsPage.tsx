import { Link, useSearchParams } from 'react-router-dom'
import { BookOpen, Eye, Search } from 'lucide-react'
import { useAsync, usePageMeta } from '../hooks'
import { getCategories, getContents } from '../services/api'
import { contentTypeLabels, formatDate, formatNumber } from '../lib/utils'
import { Avatar, Badge, CategoryTag, Chip, PageHeader } from '../components/ui/Display'
import { EmptyState, ErrorState, GridSkeleton } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'

export function LessonsPage() {
  usePageMeta('Dersler', 'Ücretsiz Türkçe konu anlatımları, ders notları ve sınav hazırlık içerikleri.')
  const [params, setParams] = useSearchParams()
  const categorySlug = params.get('kategori') ?? ''
  const query = params.get('ara') ?? ''

  const categories = useAsync(() => getCategories(), [])
  const contents = useAsync(() => getContents({ categorySlug: categorySlug || undefined, query: query || undefined }), [categorySlug, query])

  const setFilter = (key: 'kategori' | 'ara', val: string) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <div>
      <PageHeader
        eyebrow="Dersler ve Konu Anlatımları"
        title="Anlaşılır ders notları"
        description="Konu özetleri, örnek çözümler ve sınav ipuçları. Ders seçerek veya arayarak hemen başlayabilirsin."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setFilter('ara', e.target.value)}
              placeholder="Konu veya etiket filtrele…"
              aria-label="Derslerde filtrele"
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
        {contents.loading ? (
          <GridSkeleton count={6} />
        ) : contents.error ? (
          <ErrorState message={contents.error} onRetry={contents.reload} />
        ) : !contents.data?.length ? (
          <EmptyState
            icon={<BookOpen className="size-6" />}
            title="Aradığın kriterlere uygun ders bulunamadı"
            description="Farklı bir ders kategorisi seçebilir veya arama filtresini temizleyebilirsin."
            action={
              (categorySlug || query) && (
                <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                  Filtreleri temizle
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {contents.data.map((item) => (
              <Link key={item.id} to={`/dersler/${item.slug}`} className="card card-hover flex flex-col p-5">
                <div className="flex items-center justify-between gap-2">
                  {item.category ? <CategoryTag name={item.category.name} color={item.category.color} /> : <span />}
                  <Badge tone="neutral">{contentTypeLabels[item.type]}</Badge>
                </div>
                <h2 className="mt-3 text-lg leading-snug font-bold text-ink">{item.title}</h2>
                {item.summary && <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{item.summary}</p>}
                {item.grade && (
                  <div className="mt-4">
                    <Badge tone="brand">{item.grade}</Badge>
                  </div>
                )}
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
                  <span className="inline-flex items-center gap-2 font-medium text-ink-soft">
                    <Avatar name={item.author?.full_name} src={item.author?.avatar_url} size="sm" />
                    {item.author?.full_name ?? 'Bi Ders!'}
                  </span>
                  <span className="inline-flex items-center gap-3">
                    <span>{formatDate(item.published_at ?? item.created_at)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" aria-hidden /> {formatNumber(item.view_count)}
                    </span>
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
