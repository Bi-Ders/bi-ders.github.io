import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck, Clock, Gamepad2, Play, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, usePageMeta } from '../hooks'
import { getCategories, getQuizResults, getQuizzes } from '../services/api'
import { difficultyLabels } from '../lib/utils'
import { Badge, CategoryTag, Chip, PageHeader } from '../components/ui/Display'
import { Button, ButtonLink } from '../components/ui/Button'
import { EmptyState, ErrorState, GridSkeleton } from '../components/ui/Feedback'
import type { Difficulty } from '../types'

const QUIZ_GRADIENTS = [
  'from-blue-700 via-indigo-700 to-violet-600',
  'from-teal-600 via-emerald-600 to-cyan-600',
  'from-purple-700 via-fuchsia-600 to-pink-600',
  'from-amber-600 via-orange-600 to-rose-600',
  'from-slate-800 via-blue-900 to-indigo-700',
  'from-rose-700 via-red-600 to-amber-600',
]

export function QuizzesPage() {
  usePageMeta('Online Testler', 'Süreli çoktan seçmeli konu tarama testleri ve anlık geri bildirimli denemelerle bilgini ölç.')
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const categorySlug = params.get('kategori') ?? ''
  const difficulty = (params.get('zorluk') ?? '') as Difficulty | ''
  const query = params.get('ara') ?? ''

  const categories = useAsync(() => getCategories(), [])
  const quizzes = useAsync(
    () => getQuizzes({ categorySlug: categorySlug || undefined, query: query || undefined }),
    [categorySlug, query],
  )
  const myResults = useAsync(() => (user ? getQuizResults(user.id) : Promise.resolve([])), [user?.id])

  const setFilter = (key: 'kategori' | 'zorluk' | 'ara', val: string) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const filteredQuizzes = (quizzes.data ?? []).filter((q) => !difficulty || q.difficulty === difficulty)

  // Kullanıcının her test için en son sonucunu eşle
  const latestByQuiz = new Map<string, { score: number; total: number }>()
  for (const r of myResults.data ?? []) {
    if (!latestByQuiz.has(r.quiz_id)) {
      latestByQuiz.set(r.quiz_id, { score: r.score, total: r.total })
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Online Test Motoru"
        title={
          <span className="inline-flex items-center gap-3">
            <span
              className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-600 text-white shadow-sm"
              aria-hidden
            >
              <ClipboardCheck className="size-5" />
            </span>
            <span>Kendini sına, eksiklerini gör</span>
          </span>
        }
        description="Geri sayım sayaçlı, anlık doğru/yanlış açıklamalı çoktan seçmeli online testler. Sonuçların profiline otomatik kaydedilir."
        actions={
          <ButtonLink to="/etkinlikler" variant="secondary" size="sm" icon={<Gamepad2 className="size-4" aria-hidden />}>
            Oyun &amp; Etkinlikler
          </ButtonLink>
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
                placeholder="Online test ara…"
                aria-label="Testlerde filtrele"
                className="input pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Zorluk filtresi">
              <Chip active={!difficulty} onClick={() => setFilter('zorluk', '')}>
                Tüm Zorluklar
              </Chip>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <Chip key={d} active={difficulty === d} onClick={() => setFilter('zorluk', d)}>
                  {difficultyLabels[d]}
                </Chip>
              ))}
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
        {quizzes.loading ? (
          <GridSkeleton count={6} />
        ) : quizzes.error ? (
          <ErrorState message={quizzes.error} onRetry={quizzes.reload} />
        ) : !filteredQuizzes.length ? (
          <EmptyState
            icon={<ClipboardCheck className="size-6" />}
            title="Test bulunamadı"
            description="Seçtiğin filtrelerle eşleşen online test yok."
            action={
              (categorySlug || difficulty || query) && (
                <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                  Filtreleri temizle
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredQuizzes.map((q, index) => {
              const last = latestByQuiz.get(q.id)
              const gradient = QUIZ_GRADIENTS[index % QUIZ_GRADIENTS.length]!
              return (
                <article key={q.id} className="card card-hover flex flex-col overflow-hidden">
                  <Link
                    to={`/testler/${q.id}`}
                    className={`flex h-28 flex-col justify-between bg-gradient-to-br ${gradient} p-4 text-white`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur-xs">
                        {q.grade ?? 'Genel'}
                      </span>
                      <span className="rounded-md bg-ink/80 px-2 py-0.5 text-[11px] font-extrabold">
                        {difficultyLabels[q.difficulty]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-white/95">
                      <span>{q.category?.name ?? 'Online Test'}</span>
                      <span>
                        {q.question_count ?? 0} soru · {q.time_limit_minutes ?? 15} dk
                      </span>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {q.category ? <CategoryTag name={q.category.name} color={q.category.color} /> : <span />}
                      {last && (
                        <Badge tone="success">
                          <CheckCircle2 className="size-3" aria-hidden /> Son: {last.score}/{last.total}
                        </Badge>
                      )}
                    </div>

                    <Link to={`/testler/${q.id}`} className="mt-2.5 block">
                      <h2 className="text-lg leading-snug font-bold text-ink hover:text-brand">{q.title}</h2>
                    </Link>
                    {q.description && <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{q.description}</p>}

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-ink-soft">
                      <span className="inline-flex items-center gap-1">
                        <ClipboardCheck className="size-3.5 text-brand" aria-hidden /> {q.question_count ?? 0} soru
                      </span>
                      {q.time_limit_minutes && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5 text-brand" aria-hidden /> {q.time_limit_minutes} dakika
                        </span>
                      )}
                    </div>

                    <div className="mt-5 border-t border-line pt-4">
                      <ButtonLink
                        to={`/testler/${q.id}`}
                        className="w-full"
                        variant={last ? 'secondary' : 'primary'}
                        size="sm"
                        icon={<Play className="size-4" aria-hidden />}
                      >
                        {last ? 'Tekrar Çöz' : 'Teste Başla'}
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
