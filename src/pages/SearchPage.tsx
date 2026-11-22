import { Link, useSearchParams } from 'react-router-dom'
import { BookMarked, BookOpen, ClipboardCheck, MessageSquare, Search } from 'lucide-react'
import { useAsync, usePageMeta } from '../hooks'
import { searchAll } from '../services/api'
import { difficultyLabels, formatPrice, timeAgo } from '../lib/utils'
import { BookCover } from '../components/books/BookCover'
import { SearchBar } from '../components/layout/SearchBar'
import { Badge, CategoryTag, PageHeader } from '../components/ui/Display'
import { EmptyState, ErrorState, GridSkeleton } from '../components/ui/Feedback'

export function SearchPage() {
  const [params] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  usePageMeta(q ? `"${q}" arama sonuçları` : 'Arama')

  const res = useAsync(() => searchAll(q), [q])
  const total = res.data
    ? res.data.contents.length + res.data.topics.length + res.data.quizzes.length + res.data.books.length
    : 0

  return (
    <div>
      <PageHeader
        eyebrow="Hızlı Arama"
        title={q ? `"${q}" için sonuçlar` : 'Sitede ara'}
        description="Ders notları, forum konuları, testler ve kitaplar arasında tek seferde ara."
      >
        <SearchBar id="search-page-input" size="lg" className="max-w-xl" autoFocus={!q} />
      </PageHeader>

      <section className="container-page py-10">
        {!q ? (
          <EmptyState
            icon={<Search className="size-6" />}
            title="Ne aramak istersin?"
            description='Örneğin "paragraf", "üslü ifadeler", "basınç" veya "Çalıkuşu" yazarak arayabilirsin.'
          />
        ) : res.loading ? (
          <GridSkeleton count={6} />
        ) : res.error ? (
          <ErrorState message={res.error} onRetry={res.reload} />
        ) : total === 0 ? (
          <EmptyState
            icon={<Search className="size-6" />}
            title={`"${q}" için sonuç bulunamadı`}
            description="Yazımı kontrol edebilir veya daha genel bir anahtar kelime deneyebilirsin."
          />
        ) : (
          <div className="space-y-12">
            <p className="text-sm font-semibold text-muted">Toplam {total} sonuç bulundu.</p>

            {res.data!.contents.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <BookOpen className="size-5 text-brand" aria-hidden /> Dersler ({res.data!.contents.length})
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {res.data!.contents.map((c) => (
                    <Link key={c.id} to={`/dersler/${c.slug}`} className="card card-hover p-5">
                      {c.category && <CategoryTag name={c.category.name} color={c.category.color} />}
                      <h3 className="mt-2 font-sans text-base font-bold">{c.title}</h3>
                      {c.summary && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{c.summary}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {res.data!.topics.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <MessageSquare className="size-5 text-brand" aria-hidden /> Forum ({res.data!.topics.length})
                </h2>
                <div className="card mt-4 divide-y divide-line overflow-hidden">
                  {res.data!.topics.map((t) => (
                    <Link key={t.id} to={`/forum/${t.id}`} className="block px-5 py-4 transition hover:bg-paper/70">
                      <h3 className="font-sans text-base font-bold">{t.title}</h3>
                      <p className="mt-1 text-xs text-muted">
                        {t.reply_count} cevap · {timeAgo(t.last_activity_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {res.data!.quizzes.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <ClipboardCheck className="size-5 text-brand" aria-hidden /> Testler ({res.data!.quizzes.length})
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {res.data!.quizzes.map((qz) => (
                    <Link key={qz.id} to={`/testler/${qz.id}`} className="card card-hover p-5">
                      <Badge tone="brand">{difficultyLabels[qz.difficulty]}</Badge>
                      <h3 className="mt-2 font-sans text-base font-bold">{qz.title}</h3>
                      {qz.description && <p className="mt-1 text-sm text-muted">{qz.description}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {res.data!.books.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <BookMarked className="size-5 text-brand" aria-hidden /> Kitaplar ({res.data!.books.length})
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {res.data!.books.map((b) => (
                    <Link key={b.id} to={`/kitaplar/${b.slug}`} className="card card-hover flex gap-3.5 p-4">
                      <BookCover book={b} size="xs" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-sans text-base font-bold">{b.title}</h3>
                        {b.author && <p className="mt-0.5 truncate text-xs text-muted">{b.author}</p>}
                        <div className="mt-2">
                          <Badge tone={b.price && b.price > 0 ? 'sun' : 'success'}>{formatPrice(b.price)}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
