import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookMarked, Bookmark, BookmarkCheck, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, usePageMeta } from '../hooks'
import { getBooks, getCategories, toggleFavorite } from '../services/api'
import { Badge, CategoryTag, Chip, PageHeader } from '../components/ui/Display'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, GridSkeleton } from '../components/ui/Feedback'

export function BooksPage() {
  usePageMeta('Kitaplar', 'Ücretsiz ders kitapları, formül defterleri ve telif hakkı serbest klasikler.')
  const { user, openAuth } = useAuth()
  const [params, setParams] = useSearchParams()
  const categorySlug = params.get('kategori') ?? ''
  const query = params.get('ara') ?? ''
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({})

  const categories = useAsync(() => getCategories(), [])
  const books = useAsync(() => getBooks({ categorySlug: categorySlug || undefined, query: query || undefined }), [categorySlug, query])

  const setFilter = (key: 'kategori' | 'ara', val: string) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const handleSave = async (bookId: string) => {
    if (!user) return openAuth('login')
    const next = await toggleFavorite(user.id, 'book', bookId)
    setSavedIds((s) => ({ ...s, [bookId]: next }))
  }

  return (
    <div>
      <PageHeader
        eyebrow="Açık Kütüphane"
        title="Kitaplar ve kaynaklar"
        description="Konu anlatım kitapları, soru bankaları, formül defterleri ve telif hakkı serbest edebiyat klasikleri."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setFilter('ara', e.target.value)}
              placeholder="Kitap veya yazar ara…"
              aria-label="Kitaplarda filtrele"
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
        {books.loading ? (
          <GridSkeleton count={6} />
        ) : books.error ? (
          <ErrorState message={books.error} onRetry={books.reload} />
        ) : !books.data?.length ? (
          <EmptyState
            icon={<BookMarked className="size-6" />}
            title="Kitap bulunamadı"
            description="Aradığın kriterlere uygun kitap yok. Filtreleri temizleyerek tüm kitapları görebilirsin."
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
            {books.data.map((b) => {
              const saved = savedIds[b.id]
              return (
                <article key={b.id} className="card card-hover flex flex-col p-5">
                  <div className="flex gap-4">
                    {b.cover_url ? (
                      <img src={b.cover_url} alt={b.title} className="h-32 w-22 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div
                        className="flex h-32 w-22 shrink-0 flex-col justify-between rounded-xl p-3 text-white shadow-sm"
                        style={{ backgroundColor: b.category?.color ?? '#12204A' }}
                        aria-hidden
                      >
                        <span className="text-[10px] font-bold uppercase opacity-80">{b.category?.name ?? 'Kitap'}</span>
                        <span className="line-clamp-3 font-display text-xs leading-tight font-extrabold">{b.title}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {b.category && <CategoryTag name={b.category.name} color={b.category.color} />}
                      <h2 className="mt-1.5 font-sans text-base font-bold text-ink">{b.title}</h2>
                      {b.author && <p className="mt-0.5 text-sm text-muted">{b.author}</p>}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {b.grade && <Badge tone="brand">{b.grade}</Badge>}
                        {b.page_count && <Badge tone="neutral">{b.page_count} sf.</Badge>}
                        {b.published_year && <Badge tone="neutral">{b.published_year}</Badge>}
                      </div>
                    </div>
                  </div>
                  {b.description && <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{b.description}</p>}
                  <div className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-4">
                    <span className="truncate text-xs text-muted">{b.publisher ?? 'Açık kaynak'}</span>
                    <Button
                      size="sm"
                      variant={saved ? 'sun' : 'secondary'}
                      onClick={() => handleSave(b.id)}
                      icon={saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                    >
                      {saved ? 'Kaydedildi' : 'Kaydet'}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
