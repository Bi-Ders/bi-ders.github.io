import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { createQuiz, deleteQuiz, getQuizzes } from '../../services/api'
import { useAsync } from '../../hooks'
import { cn, difficultyLabels } from '../../lib/utils'
import { Badge } from '../ui/Display'
import { Button } from '../ui/Button'
import { Alert, EmptyState, ErrorState, RowSkeleton } from '../ui/Feedback'
import type { AuthorSummary, Category, Difficulty } from '../../types'

type QuestionDraft = {
  key: string
  question: string
  options: string[]
  correct_option: number
  explanation: string
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E']

function makeBlankQuestion(): QuestionDraft {
  return {
    key: crypto.randomUUID(),
    question: '',
    options: ['', '', '', ''],
    correct_option: 0,
    explanation: '',
  }
}

export function QuizManager({
  categories,
  author,
  onChanged,
}: {
  categories: Category[]
  author: AuthorSummary
  onChanged: () => void
}) {
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [grade, setGrade] = useState('8. Sınıf / LGS')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [timeLimit, setTimeLimit] = useState('12')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => [makeBlankQuestion(), makeBlankQuestion()])

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ text: string; quizId?: string } | null>(null)

  const quizzes = useAsync(() => getQuizzes(), [])

  const updateQuestion = (key: string, updater: (q: QuestionDraft) => QuestionDraft) => {
    setQuestions((prev) => prev.map((q) => (q.key === key ? updater(q) : q)))
  }

  const addQuestion = () => {
    setQuestions((prev) => [...prev, makeBlankQuestion()])
  }

  const removeQuestion = (key: string) => {
    setQuestions((prev) => (prev.length > 1 ? prev.filter((q) => q.key !== key) : prev))
  }

  const moveQuestion = (idx: number, delta: -1 | 1) => {
    setQuestions((prev) => {
      const target = idx + delta
      if (target < 0 || target >= prev.length) return prev
      const copy = [...prev]
      const [moved] = copy.splice(idx, 1)
      copy.splice(target, 0, moved!)
      return copy
    })
  }

  const addOption = (key: string) => {
    updateQuestion(key, (q) => (q.options.length < 5 ? { ...q, options: [...q.options, ''] } : q))
  }

  const removeOption = (key: string, optIdx: number) => {
    updateQuestion(key, (q) => {
      if (q.options.length <= 2) return q
      const nextOpts = q.options.filter((_, i) => i !== optIdx)
      let nextCorrect = q.correct_option
      if (optIdx === q.correct_option) nextCorrect = 0
      else if (optIdx < q.correct_option) nextCorrect = q.correct_option - 1
      return { ...q, options: nextOpts, correct_option: Math.min(nextCorrect, nextOpts.length - 1) }
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (title.trim().length < 3) {
      setError('Test başlığı en az 3 karakter olmalıdır.')
      return
    }

    // Boş şıkları filtrelemeden önce her sorunun doğru şıkkının dolu olduğundan emin ol
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!
      if (q.question.trim().length < 3) {
        setError(`${i + 1}. soru metni en az 3 karakter olmalıdır.`)
        return
      }
      const nonEmptyIndices = q.options.map((o, idx) => (o.trim() ? idx : -1)).filter((idx) => idx >= 0)
      if (nonEmptyIndices.length < 2) {
        setError(`${i + 1}. soru için en az 2 cevap şıkkı doldurmalısınız.`)
        return
      }
      if (!q.options[q.correct_option]?.trim()) {
        setError(`${i + 1}. sorunun doğru cevap olarak işaretlenen şıkkı boş olamaz.`)
        return
      }
    }

    const payloadQuestions = questions.map((q) => {
      const indexed = q.options.map((text, idx) => ({ text: text.trim(), origIdx: idx })).filter((x) => x.text)
      const mappedCorrect = indexed.findIndex((x) => x.origIdx === q.correct_option)
      return {
        question: q.question.trim(),
        options: indexed.map((x) => x.text),
        correct_option: mappedCorrect >= 0 ? mappedCorrect : 0,
        explanation: q.explanation.trim() || undefined,
      }
    })

    setBusy(true)
    try {
      const created = await createQuiz(
        {
          title,
          description,
          category_id: categoryId || null,
          grade,
          difficulty,
          time_limit_minutes: Number(timeLimit) || 10,
          questions: payloadQuestions,
        },
        author,
      )
      quizzes.reload()
      onChanged()
      setSuccess({
        text: `"${created.title}" (${payloadQuestions.length} soru) yayınlandı ve /testler sayfasına eklendi.`,
        quizId: created.id,
      })
      setTitle('')
      setDescription('')
      setQuestions([makeBlankQuestion(), makeBlankQuestion()])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string, quizTitle: string) => {
    setError(null)
    try {
      await deleteQuiz(id)
      quizzes.setData((prev) => prev?.filter((q) => q.id !== id) ?? prev)
      onChanged()
      setSuccess({ text: `"${quizTitle}" testi kaldırıldı.` })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="card space-y-6 p-6 sm:p-7">
        <div>
          <p className="eyebrow">Online Test Motoru (/testler)</p>
          <h2 className="mt-1 text-xl font-extrabold text-ink">Yeni Çoktan Seçmeli Online Test Oluştur</h2>
          <p className="mt-1 text-sm text-muted">
            Soruları, cevap şıklarını, doğru seçeneği ve çözüm açıklamasını gir; testin anında geri sayımlı test motorunda çözülmeye hazır olsun.
          </p>
        </div>

        {/* Test Üst Bilgileri */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="qz-title" className="label">
              Test Başlığı *
            </label>
            <input
              id="qz-title"
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Üslü ve Köklü Sayılar — Konu Tarama Testi"
            />
          </div>

          <div>
            <label htmlFor="qz-cat" className="label">
              Ders / Kategori
            </label>
            <select
              id="qz-cat"
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
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="qz-grade" className="label">
              Sınıf / Seviye
            </label>
            <input
              id="qz-grade"
              className="input"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Örn: 5. Sınıf, 7. Sınıf, 8. Sınıf / LGS"
            />
          </div>

          <div>
            <label htmlFor="qz-diff" className="label">
              Zorluk Seviyesi
            </label>
            <select
              id="qz-diff"
              className="input"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option value="easy">Kolay</option>
              <option value="medium">Orta</option>
              <option value="hard">Zor</option>
            </select>
          </div>

          <div>
            <label htmlFor="qz-time" className="label">
              Süre Limiti (Dakika)
            </label>
            <input
              id="qz-time"
              type="number"
              min={1}
              max={180}
              className="input"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="qz-desc" className="label">
            Test Açıklaması
          </label>
          <textarea
            id="qz-desc"
            rows={2}
            className="input resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Testin kapsadığı kazanımları kısaca belirtin…"
          />
        </div>

        {/* Dinamik Soru Editörü */}
        <div className="space-y-4 border-t border-line pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-ink">Sorular ({questions.length})</h3>
              <p className="text-xs text-muted">Her soru için doğru olan şıkkın başındaki harfe tıklayarak doğru cevabı işaretleyin.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={addQuestion}
              icon={<Plus className="size-4" aria-hidden />}
            >
              Yeni Soru Ekle
            </Button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={q.key} className="rounded-2xl border border-line-strong bg-paper/75 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 font-display text-sm font-extrabold text-ink">
                  <span className="grid size-6 place-items-center rounded-lg bg-ink text-xs text-paper dark:bg-sun dark:text-[#12204a]">
                    {qIdx + 1}
                  </span>
                  <span>Soru {qIdx + 1}</span>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={qIdx === 0}
                    onClick={() => moveQuestion(qIdx, -1)}
                    aria-label="Soruyu yukarı taşı"
                    className="grid size-7 place-items-center rounded-lg border border-line bg-card text-ink-soft hover:border-ink dark:hover:border-sun/60 disabled:opacity-40"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={qIdx === questions.length - 1}
                    onClick={() => moveQuestion(qIdx, 1)}
                    aria-label="Soruyu aşağı taşı"
                    className="grid size-7 place-items-center rounded-lg border border-line bg-card text-ink-soft hover:border-ink dark:hover:border-sun/60 disabled:opacity-40"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.key)}
                      aria-label={`Soru ${qIdx + 1} sil`}
                      className="grid size-7 place-items-center rounded-lg border border-danger/30 bg-card text-danger hover:bg-danger-soft"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <label htmlFor={`q-text-${q.key}`} className="sr-only">
                  Soru {qIdx + 1} metni
                </label>
                <textarea
                  id={`q-text-${q.key}`}
                  rows={2}
                  required
                  className="input resize-y"
                  value={q.question}
                  onChange={(e) =>
                    updateQuestion(q.key, (curr) => ({ ...curr, question: e.target.value }))
                  }
                  placeholder={`${qIdx + 1}. soru metnini buraya yazın…`}
                />
              </div>

              {/* Şıklar */}
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {q.options.map((opt, optIdx) => {
                  const isCorrect = q.correct_option === optIdx
                  return (
                    <div
                      key={optIdx}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border p-2 transition',
                        isCorrect ? 'border-success bg-success-soft/60' : 'border-line bg-card',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          updateQuestion(q.key, (curr) => ({ ...curr, correct_option: optIdx }))
                        }
                        aria-label={`${OPTION_LETTERS[optIdx]} şıkkını doğru cevap yap`}
                        aria-pressed={isCorrect}
                        title="Doğru cevap olarak işaretle"
                        className={cn(
                          'grid size-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold transition',
                          isCorrect
                            ? 'bg-success text-white shadow-xs'
                            : 'bg-paper-deep text-ink-soft hover:bg-ink hover:text-paper dark:hover:bg-sun dark:hover:text-[#12204a]',
                        )}
                      >
                        {isCorrect ? <CheckCircle2 className="size-4" /> : OPTION_LETTERS[optIdx]}
                      </button>

                      <input
                        type="text"
                        required
                        aria-label={`Soru ${qIdx + 1} ${OPTION_LETTERS[optIdx]} şıkkı`}
                        value={opt}
                        onChange={(e) => {
                          const val = e.target.value
                          updateQuestion(q.key, (curr) => ({
                            ...curr,
                            options: curr.options.map((o, idx) => (idx === optIdx ? val : o)),
                          }))
                        }}
                        placeholder={`${OPTION_LETTERS[optIdx]} seçeneği${isCorrect ? ' (Doğru Cevap)' : ''}`}
                        className="min-w-0 flex-1 bg-transparent px-1 text-sm font-medium text-ink outline-none placeholder:text-muted/75"
                      />

                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(q.key, optIdx)}
                          aria-label={`${OPTION_LETTERS[optIdx]} şıkkını sil`}
                          className="rounded-md p-1 text-muted hover:bg-danger-soft hover:text-danger"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                {q.options.length < 5 ? (
                  <button
                    type="button"
                    onClick={() => addOption(q.key)}
                    className="text-xs font-bold text-brand hover:underline"
                  >
                    + {OPTION_LETTERS[q.options.length]} Şıkkı Ekle
                  </button>
                ) : (
                  <span />
                )}

                <span className="text-xs font-semibold text-success">
                  Doğru cevap: {OPTION_LETTERS[q.correct_option]} şıkkı
                </span>
              </div>

              <div className="mt-3">
                <label htmlFor={`q-exp-${q.key}`} className="sr-only">
                  Çözüm açıklaması
                </label>
                <input
                  id={`q-exp-${q.key}`}
                  className="input py-2 text-sm"
                  value={q.explanation}
                  onChange={(e) =>
                    updateQuestion(q.key, (curr) => ({ ...curr, explanation: e.target.value }))
                  }
                  placeholder="Çözüm açıklaması (opsiyonel — öğrenci soruyu cevaplayınca gösterilir)"
                />
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={addQuestion}
              icon={<Plus className="size-4" aria-hidden />}
            >
              Soru Ekle ({questions.length + 1}. Soru)
            </Button>

            <Button type="submit" variant="sun" loading={busy} icon={<ClipboardCheck className="size-4" aria-hidden />}>
              Testi Yayınla ({questions.length} Soru)
            </Button>
          </div>
        </div>

        {error && <Alert tone="error">{error}</Alert>}
        {success && (
          <Alert tone="success" className="flex flex-wrap items-center justify-between gap-2">
            <span>{success.text}</span>
            {success.quizId && (
              <Link to={`/testler/${success.quizId}`} className="inline-flex items-center gap-1 font-bold underline">
                Testi Şimdi Çöz <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            )}
          </Alert>
        )}
      </form>

      {/* Kayıtlı Online Testler */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-extrabold text-ink">
            Yayınlanan Online Testler ({quizzes.data?.length ?? 0})
          </h3>
          <Link to="/testler" className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">
            Testler Sayfası <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>

        <div className="card divide-y divide-line overflow-hidden">
          {quizzes.loading ? (
            <>
              <RowSkeleton />
              <RowSkeleton />
            </>
          ) : quizzes.error ? (
            <div className="p-5">
              <ErrorState message={quizzes.error} onRetry={quizzes.reload} />
            </div>
          ) : !quizzes.data?.length ? (
            <div className="p-6">
              <EmptyState icon={<ClipboardCheck className="size-6" />} title="Henüz online test yok" />
            </div>
          ) : (
            quizzes.data.map((qz) => (
              <div key={qz.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-paper/60">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={qz.difficulty === 'hard' ? 'danger' : qz.difficulty === 'easy' ? 'success' : 'brand'}>
                      {difficultyLabels[qz.difficulty]}
                    </Badge>
                    {qz.grade && <Badge tone="neutral">{qz.grade}</Badge>}
                    <Badge tone="ink">{qz.question_count ?? 0} soru</Badge>
                  </div>
                  <Link to={`/testler/${qz.id}`} className="mt-1.5 block truncate font-semibold text-ink hover:text-brand">
                    {qz.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {qz.category?.name ?? 'Genel'} · {qz.time_limit_minutes ?? 15} dk · {qz.author?.full_name ?? 'Bi Ders!'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to={`/testler/${qz.id}`}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-line-strong bg-card px-2.5 text-xs font-bold text-ink hover:border-ink dark:hover:border-sun/60"
                  >
                    Teste Git <ExternalLink className="size-3" aria-hidden />
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void handleDelete(qz.id, qz.title)}
                    aria-label={`${qz.title} sil`}
                    className="h-8 px-2 text-danger hover:bg-danger-soft"
                    icon={<Trash2 className="size-4" />}
                  >
                    <span className="sr-only">Sil</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
