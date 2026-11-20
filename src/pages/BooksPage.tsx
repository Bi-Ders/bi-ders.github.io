import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, BookMarked, Bookmark, BookmarkCheck, FileText, Search, ShoppingBag } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, usePageMeta } from '../hooks'
import { getBooks, getCategories, getFavorites, toggleFavorite } from '../services/api'
import { detectPaymentProvider, formatPrice } from '../lib/utils'
import { BookCover } from '../components/books/BookCover'
import { Badge, CategoryTag, Chip, PageHeader } from '../components/ui/Display'
import { Button, ButtonLink } from '../components/ui/Button'
import { EmptyState, ErrorState, GridSkeleton } from '../components/ui/Feedback'

export function BooksPage() {
  usePageMeta(
    'Kitaplar & Mağaza',
    'Bi Ders! konu anlatım kitapları, soru bankaları, formül defterleri ve açıklamalı klasikler — örnek PDF önizleme ve güvenli satın alma.',
  )
  const { user, openAuth } = useAuth()
  const [params, setParams] = useSearchParams()
  const categorySlug = params.get('kategori') ?? ''
  const query = params.get('ara') ?? ''
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({})

  const categories = useAsync(() => getCategories(), [])
  const books = useAsync(() => getBooks({ categorySlug: categorySlug || undefined, query: query || undefined }), [categorySlug, query])

  useEffect(() => {
    if (!user) return
    let active = true
    getFavorites(user.id)
      .then((favs) => {
        if (!active) return
        const map: Record<string, boolean> = {}
        for (const f of favs) {
          if (f.item_type === 'book') map[f.item_id] = true
        }
        setSavedIds(map)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [user])

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
        eyebrow="Kitap Mağazası & Kütüphane"
        title="Kitaplar ve kaynaklar"
        description="Konu anlatım kitapları, soru bankaları, formül defterleri ve açıklamalı klasikler. Örnek sayfaları PDF olarak incele, beğendiklerini güvenle edin."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setFilter('ara', e.target.value)}
              placeholder="Kitap, yazar veya seviye ara…"
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.data.map((b) => {
              const saved = Boolean(user && savedIds[b.id])
              const isFree = b.price == null || b.price <= 0
              const provider = b.external_url ? detectPaymentProvider(b.external_url) : null

              return (
                <article key={b.id} className="group card card-hover flex flex-col p-5">
                  <Link to={`/kitaplar/${b.slug}`} className="flex gap-4">
                    <BookCover
                      book={b}
                      size="md"
                      className="transition-transform duration-200 group-hover:-translate-y-0.5"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        {b.category ? <CategoryTag name={b.category.name} color={b.category.color} /> : <span />}
                        <span
                          className={
                            isFree
                              ? 'shrink-0 rounded-lg bg-success-soft px-2 py-0.5 font-display text-xs font-extrabold text-success'
                              : 'shrink-0 rounded-lg border border-ink/20 bg-sun-soft px-2 py-0.5 font-display text-sm font-extrabold text-ink'
                          }
                        >
                          {formatPrice(b.price)}
                        </span>
                      </div>

                      <h2 className="mt-2 line-clamp-2 font-sans text-base leading-snug font-bold text-ink transition-colors group-hover:text-brand">
                        {b.title}
                      </h2>
                      {b.author && <p className="mt-0.5 truncate text-xs font-medium text-muted">{b.author}</p>}

                      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                        {b.grade && <Badge tone="brand">{b.grade}</Badge>}
                        {b.page_count && <Badge tone="neutral">{b.page_count} sf.</Badge>}
                        {b.file_url && (
                          <Badge tone="neutral">
                            <FileText className="size-3" aria-hidden /> Örnek PDF
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>

                  {b.description && (
                    <Link
                      to={`/kitaplar/${b.slug}`}
                      className="mt-4 line-clamp-2 flex-1 text-sm leading-relaxed text-muted hover:text-ink-soft"
                    >
                      {b.description}
                    </Link>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-4">
                    <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold text-muted">
                      {provider ? (
                        <>
                          <ShoppingBag className="size-3.5 shrink-0 text-brand" aria-hidden />
                          <span className="truncate">{provider.label}</span>
                        </>
                      ) : (
                        <span className="truncate">{b.publisher ?? 'Bi Ders! Yayınları'}</span>
                      )}
                    </span>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={saved ? 'sun' : 'ghost'}
                        onClick={() => handleSave(b.id)}
                        aria-label={saved ? 'Favorilerden çıkar' : 'Favorilere kaydet'}
                        icon={saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                        className="px-2.5"
                      >
                        <span className="sr-only">{saved ? 'Kaydedildi' : 'Kaydet'}</span>
                      </Button>
                      <ButtonLink
                        to={`/kitaplar/${b.slug}`}
                        size="sm"
                        variant="secondary"
                      >
                        İncele <ArrowRight className="size-3.5" aria-hidden />
                      </ButtonLink>
                    </div>
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
