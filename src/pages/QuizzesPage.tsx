import { useSearchParams } from 'react-router-dom'
import { ClipboardCheck, Clock, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, usePageMeta } from '../hooks'
import { getCategories, getQuizzes } from '../services/api'
import { difficultyLabels } from '../lib/utils'
import { Badge, CategoryTag, Chip, PageHeader } from '../components/ui/Display'
import { Button } from '../components/ui/Button'
import { Alert, EmptyState, ErrorState, GridSkeleton } from '../components/ui/Feedback'
import { useState } from 'react'

export function QuizzesPage() {
  usePageMeta('Testler', 'Konu tarama testleri ve sınav denemeleriyle bilgini ölç.')
  const { user, openAuth } = useAuth()
  const [params, setParams] = useSearchParams()
  const categorySlug = params.get('kategori') ?? ''
  const query = params.get('ara') ?? ''
  const [notice, setNotice] = useState<string | null>(null)

  const categories = useAsync(() => getCategories(), [])
  const quizzes = useAsync(() => getQuizzes({ categorySlug: categorySlug || undefined, query: query || undefined }), [categorySlug, query])

  const setFilter = (key: 'kategori' | 'ara', val: string) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <div>
      <PageHeader
        eyebrow="Testler ve Denemeler"
        title="Kendini sına, eksiklerini gör"
        description="Konu tarama testleri ve süreli denemeler. Sonuçların profilinde saklanır."
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setFilter('ara', e.target.value)}
              placeholder="Test ara…"
              aria-label="Testlerde filtrele"
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
            {notice}
          </Alert>
        )}

        {quizzes.loading ? (
          <GridSkeleton count={4} />
        ) : quizzes.error ? (
          <ErrorState message={quizzes.error} onRetry={quizzes.reload} />
        ) : !quizzes.data?.length ? (
          <EmptyState
            icon={<ClipboardCheck className="size-6" />}
            title="Test bulunamadı"
            description="Seçtiğin filtrelerle eşleşen test yok."
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
            {quizzes.data.map((q) => (
              <div key={q.id} className="card card-hover flex flex-col p-5">
                <div className="flex items-center justify-between gap-2">
                  {q.category ? <CategoryTag name={q.category.name} color={q.category.color} /> : <span />}
                  <Badge tone={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'easy' ? 'success' : 'brand'}>
                    {difficultyLabels[q.difficulty]}
                  </Badge>
                </div>
                <h2 className="mt-3 text-lg font-bold">{q.title}</h2>
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
                  {q.grade && <Badge tone="neutral">{q.grade}</Badge>}
                </div>
                <div className="mt-5 border-t border-line pt-4">
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => {
                      if (!user) return openAuth('login')
                      setNotice(`"${q.title}" etkileşimli test çözücü bir sonraki adımda eklenecek. Geçmiş sonuçlarını Profilim > Test Sonuçlarım sekmesinde görebilirsin.`)
                    }}
                  >
                    Teste Başla
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
