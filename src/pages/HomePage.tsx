import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Eye, MessageSquare, Sparkles } from 'lucide-react'
import heroImg from '../assets/hero.webp'
import { siteConfig } from '../config/site'
import { useAuth } from '../context/AuthContext'
import { useAsync, usePageMeta } from '../hooks'
import { getBooks, getCategories, getContents, getForumTopics, getQuizzes } from '../services/api'
import { contentTypeLabels, difficultyLabels, formatNumber, formatPrice, timeAgo } from '../lib/utils'
import { BookCover } from '../components/books/BookCover'
import { SearchBar } from '../components/layout/SearchBar'
import { ModuleIcon } from '../components/modules/ModuleIcon'
import { Button, ButtonLink } from '../components/ui/Button'
import { Avatar, Badge, CategoryTag } from '../components/ui/Display'
import { EmptyState, ErrorState, GridSkeleton, RowSkeleton, Skeleton } from '../components/ui/Feedback'

export function HomePage() {
  usePageMeta('', siteConfig.description)
  const { user, openAuth } = useAuth()

  const categories = useAsync(() => getCategories(), [])
  const contents = useAsync(() => getContents({ limit: 3 }), [])
  const topics = useAsync(() => getForumTopics({ limit: 4 }), [])
  const quizzes = useAsync(() => getQuizzes({ limit: 3 }), [])
  const books = useAsync(() => getBooks({ limit: 3 }), [])

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line bg-paper-deep/50">
        <div className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:py-20">
          <div className="animate-fade-up lg:col-span-7">
            <p className="eyebrow mb-3">Ücretsiz · Türkçe · Mobil Öncelikli</p>
            <h1 className="text-4xl leading-[1.08] font-extrabold sm:text-5xl lg:text-[54px]">
              Öğrenmenin en kısa yolu: <span className="marker">Bi Ders!</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Ders notları, konu tarama testleri, ücretsiz kaynak kitaplar ve takıldığın soruları birlikte çözeceğin öğrenci forumu tek yerde.
            </p>

            <SearchBar
              id="hero-search"
              size="lg"
              className="mt-7 max-w-xl"
              placeholder="Türev, Newton yasaları, paragraf, kitap ara…"
            />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ButtonLink to="/dersler" size="lg" icon={<BookOpen className="size-4" aria-hidden />}>
                Derslere Başla
              </ButtonLink>
              {user ? (
                <ButtonLink to="/profil" variant="secondary" size="lg">
                  Profilime Git
                </ButtonLink>
              ) : (
                <Button variant="sun" size="lg" onClick={() => openAuth('register')} icon={<Sparkles className="size-4" aria-hidden />}>
                  Ücretsiz Katıl
                </Button>
              )}
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-line pt-6 sm:grid-cols-4">
              {siteConfig.stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs font-semibold text-muted">{s.label}</dt>
                  <dd className="font-display text-2xl font-extrabold text-ink">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-3xl border border-line bg-paper p-3 shadow-[var(--shadow-pop)]">
              <img
                src={heroImg}
                alt="Ders kitapları, açık matematik defteri ve öğrenci forumunu temsil eden illüstrasyon"
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 8 Ana Eğitim Modülü */}
      <section aria-labelledby="sec-modules" className="container-page pt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">8 Eğitim Modülü</p>
            <h2 id="sec-modules" className="mt-1 text-2xl font-extrabold sm:text-3xl">
              İhtiyacın olan tüm kaynaklar tek çatı altında
            </h2>
          </div>
          <p className="text-sm text-muted">Ders notlarından interaktif oyunlara, online testlerden öğretmen evraklarına.</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {siteConfig.educationModules.map((mod) => (
            <Link
              key={mod.key}
              to={mod.to}
              className="group card card-hover flex flex-col overflow-hidden"
            >
              <div className={`flex h-24 items-start justify-between bg-gradient-to-br ${mod.gradient} p-4 text-white`}>
                <span className="grid size-10 place-items-center rounded-xl bg-white/20 backdrop-blur-xs transition-transform duration-200 group-hover:scale-105">
                  <ModuleIcon name={mod.icon} className="size-5" />
                </span>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-xs">
                  {mod.badge}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="flex items-center justify-between gap-2 font-display text-lg font-extrabold text-ink group-hover:text-brand">
                  <span>{mod.label}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{mod.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Ders Kategorileri */}
      <section aria-labelledby="sec-categories" className="container-page pt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Derslere Göre Keşfet</p>
            <h2 id="sec-categories" className="mt-1 text-2xl font-extrabold sm:text-3xl">
              Hangi derse çalışmak istiyorsun?
            </h2>
          </div>
          <Link to="/dersler" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">
            Tüm dersler <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        {categories.loading ? (
          <div className="mt-6 flex flex-wrap gap-2.5" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-32 rounded-xl" />
            ))}
          </div>
        ) : categories.error ? (
          <div className="mt-6">
            <ErrorState message={categories.error} onRetry={categories.reload} />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(categories.data ?? []).map((c) => (
              <Link
                key={c.id}
                to={`/dersler?kategori=${c.slug}`}
                className="card card-hover flex items-center gap-3 px-4 py-3.5"
              >
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.color ?? 'var(--color-brand)' }} aria-hidden />
                <span className="truncate font-semibold text-ink">{c.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Son Ders Notları */}
      <section aria-labelledby="sec-lessons" className="container-page pt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Öne Çıkan İçerikler</p>
            <h2 id="sec-lessons" className="mt-1 text-2xl font-extrabold sm:text-3xl">
              Güncel konu anlatımları
            </h2>
          </div>
          <Link to="/dersler" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">
            Tümünü gör <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-6">
          {contents.loading ? (
            <GridSkeleton count={3} />
          ) : contents.error ? (
            <ErrorState message={contents.error} onRetry={contents.reload} />
          ) : !contents.data?.length ? (
            <EmptyState icon={<BookOpen className="size-6" />} title="Henüz içerik eklenmedi" description="Yakında yeni ders notları burada olacak." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {contents.data.map((item) => (
                <Link key={item.id} to={`/dersler/${item.slug}`} className="card card-hover flex flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    {item.category ? <CategoryTag name={item.category.name} color={item.category.color} /> : <span />}
                    <Badge tone="neutral">{contentTypeLabels[item.type]}</Badge>
                  </div>
                  <h3 className="mt-3 text-lg leading-snug font-bold text-ink">{item.title}</h3>
                  {item.summary && <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{item.summary}</p>}
                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
                    <span className="inline-flex items-center gap-2 font-medium text-ink-soft">
                      <Avatar name={item.author?.full_name} src={item.author?.avatar_url} size="sm" />
                      {item.author?.full_name ?? 'Bi Ders!'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" aria-hidden /> {formatNumber(item.view_count)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Forum & Testler */}
      <section className="container-page grid gap-10 pt-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Öğrenci Forumu</p>
              <h2 className="mt-1 text-2xl font-extrabold">Son soru ve tartışmalar</h2>
            </div>
            <Link to="/forum" className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
              Foruma git <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="card mt-5 divide-y divide-line overflow-hidden">
            {topics.loading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : topics.error ? (
              <div className="p-5">
                <ErrorState message={topics.error} onRetry={topics.reload} />
              </div>
            ) : !topics.data?.length ? (
              <div className="p-6">
                <EmptyState icon={<MessageSquare className="size-6" />} title="Henüz konu açılmadı" />
              </div>
            ) : (
              topics.data.map((t) => (
                <Link key={t.id} to={`/forum/${t.id}`} className="flex items-start gap-3.5 px-5 py-4 transition hover:bg-paper/70">
                  <Avatar name={t.author?.full_name} src={t.author?.avatar_url} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {t.is_pinned && <Badge tone="sun">Sabit</Badge>}
                      {t.is_solved && (
                        <Badge tone="success">
                          <CheckCircle2 className="size-3" aria-hidden /> Çözüldü
                        </Badge>
                      )}
                      {t.category && <CategoryTag name={t.category.name} color={t.category.color} />}
                    </div>
                    <h3 className="mt-1 font-sans text-[15px] font-bold text-ink">{t.title}</h3>
                    <p className="mt-1 text-xs text-muted">
                      {t.author?.full_name ?? 'Üye'} · {timeAgo(t.last_activity_at)}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-1 rounded-lg bg-paper-deep px-2.5 py-1 text-xs font-bold text-ink-soft sm:flex">
                    <MessageSquare className="size-3.5" aria-hidden /> {t.reply_count}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Kendini Dene</p>
              <h2 className="mt-1 text-2xl font-extrabold">Popüler testler</h2>
            </div>
            <Link to="/testler" className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
              Tüm testler <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="mt-5 space-y-3.5">
            {quizzes.loading ? (
              <>
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </>
            ) : quizzes.error ? (
              <ErrorState message={quizzes.error} onRetry={quizzes.reload} />
            ) : (
              (quizzes.data ?? []).map((q) => (
                <Link key={q.id} to={`/testler/${q.id}`} className="card card-hover block p-4">
                  <div className="flex items-center justify-between gap-2">
                    {q.category ? <CategoryTag name={q.category.name} color={q.category.color} /> : <span />}
                    <Badge tone={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'easy' ? 'success' : 'brand'}>
                      {difficultyLabels[q.difficulty]}
                    </Badge>
                  </div>
                  <h3 className="mt-2 font-sans text-base font-bold">{q.title}</h3>
                  <p className="mt-1.5 flex items-center gap-3 text-xs font-medium text-muted">
                    <span className="inline-flex items-center gap-1">
                      <ClipboardCheck className="size-3.5" aria-hidden /> {q.question_count ?? 0} soru
                    </span>
                    {q.time_limit_minutes && <span>{q.time_limit_minutes} dk</span>}
                    {q.grade && <span>{q.grade}</span>}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Kitaplık */}
      <section aria-labelledby="sec-books" className="container-page pt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Açık Kütüphane</p>
            <h2 id="sec-books" className="mt-1 text-2xl font-extrabold sm:text-3xl">
              Önerilen kitaplar ve kaynaklar
            </h2>
          </div>
          <Link to="/kitaplar" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">
            Kitaplığa git <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-6">
          {books.loading ? (
            <GridSkeleton count={3} />
          ) : books.error ? (
            <ErrorState message={books.error} onRetry={books.reload} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(books.data ?? []).map((b) => (
                <Link key={b.id} to={`/kitaplar/${b.slug}`} className="card card-hover flex gap-4 p-4">
                  <BookCover book={b} size="sm" />
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <h3 className="line-clamp-2 font-sans text-base font-bold text-ink">{b.title}</h3>
                      {b.author && <p className="mt-0.5 truncate text-sm text-muted">{b.author}</p>}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Badge tone={b.price && b.price > 0 ? 'sun' : 'success'}>{formatPrice(b.price)}</Badge>
                      {b.grade && <Badge tone="neutral">{b.grade}</Badge>}
                      {b.page_count && <Badge tone="neutral">{b.page_count} sf.</Badge>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
