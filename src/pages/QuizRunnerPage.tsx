import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Flag,
  LogIn,
  RotateCcw,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, usePageMeta } from '../hooks'
import { getQuizWithQuestions, submitQuiz } from '../services/api'
import { cn, difficultyLabels } from '../lib/utils'
import { Badge, CategoryTag } from '../components/ui/Display'
import { Button, ButtonLink } from '../components/ui/Button'
import { Alert, EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback'
import type { Quiz, QuizQuestion, QuizSubmissionResult } from '../types'

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export function QuizRunnerPage() {
  const { id = '' } = useParams()
  const { user, openAuth } = useAuth()
  const loaded = useAsync(() => getQuizWithQuestions(id), [id])

  usePageMeta(loaded.data?.quiz.title ?? 'Online Test', loaded.data?.quiz.description ?? undefined)

  if (loaded.loading) {
    return (
      <div className="container-page max-w-4xl py-12">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-5 h-28 w-full rounded-3xl" />
        <Skeleton className="mt-6 h-80 w-full rounded-3xl" />
      </div>
    )
  }

  if (loaded.error) {
    return (
      <div className="container-page max-w-3xl py-14">
        <ErrorState message={loaded.error} onRetry={loaded.reload} />
      </div>
    )
  }

  if (!loaded.data || !loaded.data.questions.length) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<ClipboardCheck className="size-6" />}
          title="Test veya sorular bulunamadı"
          description="Bu test kaldırılmış ya da henüz soru eklenmemiş olabilir."
          action={<ButtonLink to="/testler">Tüm Testlere Dön</ButtonLink>}
        />
      </div>
    )
  }

  return (
    <QuizEngine
      key={loaded.data.quiz.id}
      quiz={loaded.data.quiz}
      questions={loaded.data.questions}
      userId={user?.id ?? null}
      onOpenLogin={() => openAuth('login')}
    />
  )
}

function QuizEngine({
  quiz,
  questions,
  userId,
  onOpenLogin,
}: {
  quiz: Quiz
  questions: QuizQuestion[]
  userId: string | null
  onOpenLogin: () => void
}) {
  const totalLimitSec = (quiz.time_limit_minutes ?? 15) * 60

  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [remainingSec, setRemainingSec] = useState(totalLimitSec)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<QuizSubmissionResult | null>(null)

  const startedAtRef = useRef<number>(0)
  const autoSubmittedRef = useRef(false)
  const savingAfterLoginRef = useRef(false)

  useEffect(() => {
    startedAtRef.current = Date.now()
  }, [])

  const currentQuestion = questions[currentIdx]!
  const answeredCount = Object.keys(answers).length
  const hasInstantKey = currentQuestion.correct_option !== undefined

  const finishQuiz = useCallback(async () => {
    if (submitting || result) return
    setSubmitting(true)
    setSubmitError(null)
    const startMs = startedAtRef.current || Date.now()
    const elapsed = Math.max(1, Math.min(totalLimitSec, Math.round((Date.now() - startMs) / 1000)))
    try {
      const res = await submitQuiz(quiz, questions, answers, elapsed, userId)
      setResult(res)
    } catch (err) {
      setSubmitError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }, [answers, questions, quiz, result, submitting, totalLimitSec, userId])

  // Geri sayım sayacı
  useEffect(() => {
    if (result) return
    const timer = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [result])

  // Süre dolunca otomatik bitir
  useEffect(() => {
    if (remainingSec === 0 && !result && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      void finishQuiz()
    }
  }, [remainingSec, result, finishQuiz])

  // Misafir kullanıcı testi bitirdikten sonra giriş yaparsa sonucu profiline kaydet
  useEffect(() => {
    if (!result || result.saved || !userId || savingAfterLoginRef.current) return
    savingAfterLoginRef.current = true
    submitQuiz(quiz, questions, answers, result.duration_seconds, userId)
      .then((savedRes) => setResult(savedRes))
      .catch(() => undefined)
      .finally(() => {
        savingAfterLoginRef.current = false
      })
  }, [userId, result, quiz, questions, answers])

  const selectOption = useCallback(
    (optionIdx: number) => {
      if (result) return
      // Anlık geri bildirim varsa cevaplanan soru kilitlenir
      if (hasInstantKey && answers[currentQuestion.id] !== undefined) return
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIdx }))
    },
    [answers, currentQuestion.id, hasInstantKey, result],
  )

  // Klavye kısayolları (1-5 şık seçimi, ok tuşları geçiş)
  useEffect(() => {
    if (result) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const num = Number(e.key)
      if (num >= 1 && num <= currentQuestion.options.length) {
        selectOption(num - 1)
      } else if (e.key === 'ArrowRight' && currentIdx < questions.length - 1) {
        setCurrentIdx((i) => i + 1)
      } else if (e.key === 'ArrowLeft' && currentIdx > 0) {
        setCurrentIdx((i) => i - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentIdx, currentQuestion.options.length, questions.length, result, selectOption])

  const handleRestart = () => {
    setAnswers({})
    setCurrentIdx(0)
    setRemainingSec(totalLimitSec)
    setResult(null)
    setSubmitError(null)
    startedAtRef.current = Date.now()
    autoSubmittedRef.current = false
  }

  // --- SONUÇ ÖZETİ EKRANI ---
  if (result) {
    const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0
    const wrongCount = result.details.filter((d) => d.selected !== null && !d.is_correct).length
    const blankCount = result.details.filter((d) => d.selected === null).length
    const summaryGradient =
      pct >= 75
        ? 'from-emerald-600 via-teal-600 to-cyan-600'
        : pct >= 50
          ? 'from-blue-700 via-indigo-700 to-violet-600'
          : 'from-rose-600 via-red-600 to-orange-500'
    const motivation =
      pct >= 85
        ? 'Harika bir performans! Konuya tamamen hâkimsin.'
        : pct >= 65
          ? 'Güzel sonuç! Birkaç küçük tekrarla tam puana ulaşabilirsin.'
          : 'İyi bir başlangıç. Yanlış yaptığın soruların açıklamalarını inceleyip tekrar dene.'

    return (
      <div className="container-page max-w-4xl py-10 sm:py-14">
        <Link to="/testler" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Tüm testlere dön
        </Link>

        {/* Puan Özeti Gradyan Kartı */}
        <div className={`mt-6 overflow-hidden rounded-3xl bg-gradient-to-br ${summaryGradient} p-6 text-white shadow-[var(--shadow-pop)] sm:p-8`}>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-xs">
                <Award className="size-3.5" aria-hidden /> Test Tamamlandı
              </span>
              <h1 className="mt-3 font-display text-2xl font-extrabold text-white sm:text-3xl">{quiz.title}</h1>
              <p className="mt-2 max-w-xl text-sm text-white/90 sm:text-base">{motivation}</p>
            </div>

            <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-white/15 px-7 py-4 text-center backdrop-blur-xs">
              <span className="font-display text-4xl font-extrabold sm:text-5xl">%{pct}</span>
              <span className="mt-1 text-xs font-bold uppercase tracking-wider text-white/90">
                {result.score} / {result.total} Doğru
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/15 p-3.5 backdrop-blur-xs">
              <p className="text-xs font-semibold text-white/80">Doğru</p>
              <p className="mt-1 font-display text-2xl font-extrabold">{result.score}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3.5 backdrop-blur-xs">
              <p className="text-xs font-semibold text-white/80">Yanlış</p>
              <p className="mt-1 font-display text-2xl font-extrabold">{wrongCount}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3.5 backdrop-blur-xs">
              <p className="text-xs font-semibold text-white/80">Boş</p>
              <p className="mt-1 font-display text-2xl font-extrabold">{blankCount}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3.5 backdrop-blur-xs">
              <p className="text-xs font-semibold text-white/80">Geçen Süre</p>
              <p className="mt-1 font-display text-2xl font-extrabold">{formatClock(result.duration_seconds)}</p>
            </div>
          </div>
        </div>

        {/* Profil Kayıt Durumu ve Aksiyonlar */}
        <div className="mt-6">
          {result.saved ? (
            <Alert tone="success" className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                Sonucun profilindeki <strong>Test Sonuçlarım</strong> bölümüne kaydedildi.
              </span>
              <ButtonLink to="/profil" variant="secondary" size="sm" icon={<User className="size-4" aria-hidden />}>
                Profilime Git
              </ButtonLink>
            </Alert>
          ) : (
            <Alert tone="warning" className="flex flex-wrap items-center justify-between gap-3">
              <span>Misafir olarak çözdün. Bu sonucu profiline kaydetmek için giriş yapabilirsin.</span>
              <Button size="sm" variant="sun" onClick={onOpenLogin} icon={<LogIn className="size-4" aria-hidden />}>
                Giriş Yap ve Kaydet
              </Button>
            </Alert>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="primary" onClick={handleRestart} icon={<RotateCcw className="size-4" aria-hidden />}>
            Testi Tekrar Çöz
          </Button>
          <ButtonLink to="/testler" variant="secondary">
            Diğer Testleri Gör
          </ButtonLink>
        </div>

        {/* Soru Bazlı Ayrıntılı İnceleme */}
        <section className="mt-10 space-y-4" aria-labelledby="review-heading">
          <h2 id="review-heading" className="text-xl font-extrabold">
            Soru Analizi ve Çözüm Açıklamaları
          </h2>

          {questions.map((q, i) => {
            const detail = result.details.find((d) => d.question_id === q.id)
            const selected = detail?.selected ?? null
            const correct = detail?.correct_option ?? q.correct_option ?? 0
            const isCorrect = detail?.is_correct ?? false

            return (
              <div key={q.id} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold tracking-wider text-muted uppercase">Soru {i + 1}</span>
                  {selected === null ? (
                    <Badge tone="neutral">Boş Bırakıldı</Badge>
                  ) : isCorrect ? (
                    <Badge tone="success">
                      <CheckCircle2 className="size-3.5" aria-hidden /> Doğru
                    </Badge>
                  ) : (
                    <Badge tone="danger">
                      <XCircle className="size-3.5" aria-hidden /> Yanlış
                    </Badge>
                  )}
                </div>

                <p className="mt-2 font-semibold text-ink">{q.question}</p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, optIdx) => {
                    const isRightOpt = optIdx === correct
                    const isPickedWrong = selected === optIdx && !isRightOpt
                    return (
                      <div
                        key={optIdx}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium',
                          isRightOpt
                            ? 'border-success bg-success-soft text-success'
                            : isPickedWrong
                              ? 'border-danger bg-danger-soft text-danger'
                              : 'border-line bg-paper/50 text-ink-soft',
                        )}
                      >
                        <span className="font-extrabold">{OPTION_LETTERS[optIdx]})</span>
                        <span className="flex-1">{opt}</span>
                        {isRightOpt && <CheckCircle2 className="size-4 shrink-0" aria-hidden />}
                        {isPickedWrong && <XCircle className="size-4 shrink-0" aria-hidden />}
                      </div>
                    )
                  })}
                </div>

                {(detail?.explanation ?? q.explanation) && (
                  <div className="mt-4 rounded-xl border border-brand/20 bg-brand-soft/60 px-4 py-3 text-sm text-ink">
                    <strong className="text-brand-dark">Çözüm: </strong>
                    {detail?.explanation ?? q.explanation}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      </div>
    )
  }

  // --- AKTİF TEST ÇÖZME EKRANI ---
  const selectedOpt = answers[currentQuestion.id]
  const isAnswered = selectedOpt !== undefined
  const isCorrectNow = hasInstantKey && isAnswered && selectedOpt === currentQuestion.correct_option
  const progressPct = Math.round(((currentIdx + 1) / questions.length) * 100)
  const timerTone = remainingSec <= 30 ? 'danger' : remainingSec <= 120 ? 'sun' : 'brand'

  return (
    <div className="container-page max-w-4xl py-8 sm:py-12">
      {/* Üst Bilgi ve Geri Sayım Barı */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/testler" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Testlerden çık
        </Link>

        <div className="flex items-center gap-2.5">
          {!userId && (
            <button
              type="button"
              onClick={onOpenLogin}
              className="rounded-full border border-sun-dark/30 bg-sun-soft px-3 py-1 text-xs font-bold text-ink hover:brightness-95"
            >
              Sonucu kaydetmek için giriş yap
            </button>
          )}
          <div
            aria-live="off"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 font-display text-sm font-extrabold tabular-nums',
              timerTone === 'danger'
                ? 'animate-pulse border-danger bg-danger-soft text-danger'
                : timerTone === 'sun'
                  ? 'border-sun-dark/40 bg-sun-soft text-sun-dark'
                  : 'border-line-strong bg-card text-ink',
            )}
          >
            <Clock className="size-4" aria-hidden />
            <span>{formatClock(remainingSec)}</span>
          </div>
        </div>
      </div>

      {/* Test Başlık & İlerleme Kartı */}
      <div className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-600 p-5 text-white shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {quiz.category && (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur-xs">
                {quiz.category.name}
              </span>
            )}
            {quiz.grade && (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur-xs">
                {quiz.grade}
              </span>
            )}
            <span className="rounded-full bg-[#12204a]/75 px-2.5 py-0.5 text-xs font-bold text-[#f9f7f0]">
              {difficultyLabels[quiz.difficulty]}
            </span>
          </div>
          <span className="text-xs font-bold text-white/90">
            Yanıtlanan: {answeredCount} / {questions.length}
          </span>
        </div>

        <h1 className="mt-2.5 font-display text-xl font-extrabold text-white sm:text-2xl">{quiz.title}</h1>

        {/* İlerleme çubuğu */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-sun transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Soru Gezinme Numaraları */}
      <div className="mt-5 flex flex-wrap items-center gap-2" role="navigation" aria-label="Soru numaraları">
        {questions.map((q, i) => {
          const picked = answers[q.id]
          const answered = picked !== undefined
          const right = answered && q.correct_option !== undefined && picked === q.correct_option
          const wrong = answered && q.correct_option !== undefined && picked !== q.correct_option
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIdx(i)}
              className={cn(
                'grid size-9 place-items-center rounded-xl border text-sm font-extrabold transition',
                i === currentIdx && 'ring-2 ring-brand ring-offset-2',
                right
                  ? 'border-success bg-success-soft text-success'
                  : wrong
                    ? 'border-danger bg-danger-soft text-danger'
                    : answered
                      ? 'border-brand bg-brand-soft text-brand-dark'
                      : 'border-line-strong bg-card text-ink-soft hover:border-ink dark:hover:border-sun/60',
              )}
              aria-current={i === currentIdx ? 'step' : undefined}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Aktif Soru Kartı */}
      <article className="card mt-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="eyebrow">
            Soru {currentIdx + 1} / {questions.length}
          </span>
          {quiz.category && <CategoryTag name={quiz.category.name} color={quiz.category.color} />}
        </div>

        <h2 className="mt-3 font-sans text-lg leading-relaxed font-bold text-ink sm:text-xl">
          {currentQuestion.question}
        </h2>

        <div className="mt-6 space-y-3" role="radiogroup" aria-label="Cevap seçenekleri">
          {currentQuestion.options.map((option, optIdx) => {
            const isPicked = selectedOpt === optIdx
            const isCorrectOpt = hasInstantKey && currentQuestion.correct_option === optIdx
            const showRight = isAnswered && isCorrectOpt
            const showWrong = isAnswered && isPicked && hasInstantKey && !isCorrectOpt

            return (
              <button
                key={optIdx}
                type="button"
                role="radio"
                aria-checked={isPicked}
                onClick={() => selectOption(optIdx)}
                disabled={hasInstantKey && isAnswered}
                className={cn(
                  'flex w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left transition',
                  showRight
                    ? 'border-success bg-success-soft text-ink'
                    : showWrong
                      ? 'border-danger bg-danger-soft text-ink'
                      : isPicked
                        ? 'border-brand bg-brand-soft text-ink'
                        : 'border-line bg-card text-ink-soft hover:border-brand hover:bg-paper/70 dark:hover:border-sun/60',
                  hasInstantKey && isAnswered && !showRight && !showWrong && 'opacity-65',
                )}
              >
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-xl text-sm font-extrabold',
                    showRight
                      ? 'bg-success text-white'
                      : showWrong
                        ? 'bg-danger text-white'
                        : isPicked
                          ? 'bg-brand text-white'
                          : 'bg-paper-deep text-ink',
                  )}
                >
                  {OPTION_LETTERS[optIdx]}
                </span>
                <span className="flex-1 text-[15px] font-semibold">{option}</span>
                {showRight && <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />}
                {showWrong && <XCircle className="size-5 shrink-0 text-danger" aria-hidden />}
              </button>
            )
          })}
        </div>

        {/* Anlık Doğru / Yanlış Geri Bildirimi */}
        {isAnswered && hasInstantKey && (
          <div
            role="status"
            className={cn(
              'mt-6 animate-fade-up rounded-2xl border p-4 sm:p-5',
              isCorrectNow
                ? 'border-success/40 bg-success-soft/80 text-ink'
                : 'border-danger/35 bg-danger-soft/80 text-ink',
            )}
          >
            <div className="flex items-center gap-2 font-bold">
              {isCorrectNow ? (
                <>
                  <CheckCircle2 className="size-5 text-success" aria-hidden />
                  <span className="text-success">Doğru cevap! Harika gidiyorsun.</span>
                </>
              ) : (
                <>
                  <XCircle className="size-5 text-danger" aria-hidden />
                  <span className="text-danger">
                    Yanlış cevap. Doğru seçenek: {OPTION_LETTERS[currentQuestion.correct_option ?? 0]}
                  </span>
                </>
              )}
            </div>
            {currentQuestion.explanation && (
              <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-ink-soft">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span>{currentQuestion.explanation}</span>
              </p>
            )}
          </div>
        )}

        {submitError && (
          <Alert tone="error" className="mt-5">
            {submitError}
          </Alert>
        )}

        {/* Alt Gezinme ve Bitirme */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Button
            variant="secondary"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            icon={<ArrowLeft className="size-4" aria-hidden />}
          >
            Önceki
          </Button>

          <div className="flex flex-wrap gap-2.5">
            {currentIdx < questions.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
              >
                Sonraki Soru <ArrowRight className="size-4" aria-hidden />
              </Button>
            ) : null}

            <Button
              variant={currentIdx === questions.length - 1 || answeredCount === questions.length ? 'sun' : 'secondary'}
              loading={submitting}
              onClick={() => void finishQuiz()}
              icon={<Flag className="size-4" aria-hidden />}
            >
              Testi Bitir
            </Button>
          </div>
        </div>
      </article>
    </div>
  )
}
