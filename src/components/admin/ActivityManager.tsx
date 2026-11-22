import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ExternalLink,
  Eye,
  Gamepad2,
  Plus,
  Puzzle,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { createCustomActivity, deleteActivity, getInteractiveActivities } from '../../services/api'
import { useAsync } from '../../hooks'
import { allowedEmbedDomainsText, validateEmbedUrl } from '../../lib/embedSandbox'
import { cn, formatNumber } from '../../lib/utils'
import { Badge } from '../ui/Display'
import { Button } from '../ui/Button'
import { Alert, EmptyState, ErrorState, RowSkeleton } from '../ui/Feedback'
import type { ActivityKind, ActivityProvider, AuthorSummary, Category } from '../../types'

const PROVIDER_LABELS: Record<ActivityProvider, string> = {
  wordwall: 'Wordwall',
  h5p: 'H5P',
  html5: 'HTML5',
}

const SAMPLE_EMBEDS: Array<{ label: string; url: string; kind: ActivityKind }> = [
  {
    label: 'Wordwall Örnek',
    url: 'https://wordwall.net/tr/embed/5c88e0d8c8a244f28852b53e3d97c4ef',
    kind: 'game',
  },
  {
    label: 'PhET Simülasyon',
    url: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_tr.html',
    kind: 'activity',
  },
  {
    label: 'H5P Örnek',
    url: 'https://h5p.org/h5p/embed/617',
    kind: 'activity',
  },
]

export function ActivityManager({
  categories,
  author,
  onChanged,
}: {
  categories: Category[]
  author: AuthorSummary
  onChanged: () => void
}) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<ActivityKind>('game')
  const [embedUrl, setEmbedUrl] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [grade, setGrade] = useState('9. Sınıf')
  const [unit, setUnit] = useState('')
  const [duration, setDuration] = useState('5')
  const [description, setDescription] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const activities = useAsync(() => getInteractiveActivities(), [])

  const urlCheck = useMemo(() => {
    if (!embedUrl.trim()) return null
    return validateEmbedUrl(embedUrl)
  }, [embedUrl])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (title.trim().length < 3) {
      setError('Oyun veya etkinlik başlığı en az 3 karakter olmalıdır.')
      return
    }
    const check = validateEmbedUrl(embedUrl)
    if (!check.valid || !check.normalized || !check.provider) {
      setError(check.error ?? 'Geçerli bir güvenli HTTPS embed adresi girin.')
      return
    }

    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    setBusy(true)
    try {
      const created = await createCustomActivity(
        {
          title,
          description,
          kind,
          provider: check.provider,
          grade,
          category_id: categoryId || null,
          unit,
          embed_url: check.normalized,
          duration_minutes: Number(duration) || 5,
          tags,
        },
        author,
      )
      activities.reload()
      onChanged()
      setSuccess(
        `"${created.title}" (${kind === 'game' ? 'Eğitsel Oyun' : 'İnteraktif Etkinlik'}) Oyun & Etkinlikler modülüne eklendi.`,
      )
      setTitle('')
      setEmbedUrl('')
      setUnit('')
      setDescription('')
      setTagsRaw('')
      setShowPreview(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string, itemTitle: string) => {
    setError(null)
    try {
      await deleteActivity(id)
      activities.setData((prev) =>
        prev ? { ...prev, items: prev.items.filter((a) => a.id !== id) } : prev,
      )
      onChanged()
      setSuccess(`"${itemTitle}" kaldırıldı.`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-7">
        <div>
          <p className="eyebrow">Oyun &amp; Etkinlikler (/etkinlikler)</p>
          <h2 className="mt-1 text-xl font-extrabold text-ink">Iframe Etkinlik veya Eğitsel Oyun Ekle</h2>
          <p className="mt-1 text-sm text-muted">
            Wordwall, H5P, LearningApps, PhET, GeoGebra veya Genially iframe kodlarını güvenli sandbox içinde yayınla.
          </p>
        </div>

        {/* Tür Seçimi: Eğitsel Oyun vs İnteraktif Etkinlik */}
        <div>
          <span className="label">İçerik Türü *</span>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setKind('game')}
              className={cn(
                'flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition',
                kind === 'game'
                  ? 'border-ink bg-sun-soft text-ink shadow-[0_2px_0_0_var(--color-ink)] dark:border-sun/60 dark:shadow-none'
                  : 'border-line bg-card text-ink-soft hover:border-ink dark:hover:border-sun/60',
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-paper dark:bg-sun dark:text-[#12204a]">
                <Gamepad2 className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-base font-extrabold text-ink">Eğitsel Oyun</p>
                <p className="mt-0.5 text-xs text-muted">
                  Eşleştirme, çarkıfelek, hafıza oyunu, sınıflandırma ve yarışmalar
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setKind('activity')}
              className={cn(
                'flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition',
                kind === 'activity'
                  ? 'border-ink bg-brand-soft text-ink shadow-[0_2px_0_0_var(--color-ink)] dark:border-brand/60 dark:shadow-none'
                  : 'border-line bg-card text-ink-soft hover:border-ink dark:hover:border-sun/60',
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white">
                <Puzzle className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-base font-extrabold text-ink">İnteraktif Etkinlik</p>
                <p className="mt-0.5 text-xs text-muted">
                  H5P çalışma kartları, PhET simülasyonları, kronoloji ve etkileşimli çalışma kağıtları
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="adm-act-title" className="label">
              Başlık *
            </label>
            <input
              id="adm-act-title"
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Kuvvet ve Hareket PhET Simülasyonu"
            />
          </div>

          <div>
            <label htmlFor="adm-act-cat" className="label">
              Ders / Kategori
            </label>
            <select
              id="adm-act-cat"
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
            <label htmlFor="adm-act-grade" className="label">
              Sınıf / Seviye
            </label>
            <input
              id="adm-act-grade"
              className="input"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Örn: 8. Sınıf / LGS"
            />
          </div>

          <div>
            <label htmlFor="adm-act-unit" className="label">
              Ünite / Konu
            </label>
            <input
              id="adm-act-unit"
              className="input"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Örn: Kuvvet ve Hareket"
            />
          </div>

          <div>
            <label htmlFor="adm-act-dur" className="label">
              Tahmini Süre (dk)
            </label>
            <input
              id="adm-act-dur"
              type="number"
              min={1}
              max={60}
              className="input"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>

        {/* Iframe URL / Kod Alanı */}
        <div className="rounded-2xl border border-line bg-paper/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="adm-act-url" className="label mb-0">
              Iframe Embed URL veya &lt;iframe&gt; Kodu *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_EMBEDS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setEmbedUrl(sample.url)
                    setKind(sample.kind)
                  }}
                  className="rounded-lg border border-line-strong bg-card px-2.5 py-1 text-[11px] font-bold text-ink-soft hover:border-ink hover:text-ink"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <input
            id="adm-act-url"
            className="input mt-2"
            required
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder='https://wordwall.net/embed/... veya <iframe src="https://..."></iframe>'
          />

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            {urlCheck ? (
              urlCheck.valid ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-success">
                  <ShieldCheck className="size-4" aria-hidden />
                  Geçerli güvenli embed ({PROVIDER_LABELS[urlCheck.provider!]})
                </span>
              ) : (
                <span className="font-semibold text-danger">{urlCheck.error}</span>
              )
            ) : (
              <span className="text-muted">Desteklenen sağlayıcılar: {allowedEmbedDomainsText}</span>
            )}

            {urlCheck?.valid && urlCheck.normalized && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowPreview((v) => !v)}
                icon={<Eye className="size-3.5" aria-hidden />}
              >
                {showPreview ? 'Önizlemeyi Gizle' : 'Iframe Önizle'}
              </Button>
            )}
          </div>

          {showPreview && urlCheck?.valid && urlCheck.normalized && (
            <div className="mt-3 overflow-hidden rounded-xl border border-line bg-white">
              <iframe
                src={urlCheck.normalized}
                title="Embed canlı önizleme"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                referrerPolicy="no-referrer"
                className="h-72 w-full border-0"
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="adm-act-desc" className="label">
              Kısa Açıklama
            </label>
            <textarea
              id="adm-act-desc"
              rows={2}
              className="input resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Öğrencilerin bu etkinlikte ne kazanacağını kısaca yazın…"
            />
          </div>

          <div>
            <label htmlFor="adm-act-tags" className="label">
              Etiketler (virgülle ayırın)
            </label>
            <input
              id="adm-act-tags"
              className="input"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="Örn: wordwall, eşleştirme, 9. sınıf"
            />
          </div>
        </div>

        {error && <Alert tone="error">{error}</Alert>}
        {success && (
          <Alert tone="success" className="flex flex-wrap items-center justify-between gap-2">
            <span>{success}</span>
            <Link to="/etkinlikler" className="inline-flex items-center gap-1 font-bold underline">
              Oyun &amp; Etkinliklerde Gör <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="sun" loading={busy} icon={<Plus className="size-4" aria-hidden />}>
            Etkinliği Yayınla
          </Button>
        </div>
      </form>

      {/* Kayıtlı Oyun ve Etkinlikler Listesi */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-extrabold text-ink">
            Kayıtlı Oyun &amp; Etkinlikler ({activities.data?.items.length ?? 0})
          </h3>
          <Link to="/etkinlikler" className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">
            Modüle Git <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>

        <div className="card divide-y divide-line overflow-hidden">
          {activities.loading ? (
            <>
              <RowSkeleton />
              <RowSkeleton />
            </>
          ) : activities.error ? (
            <div className="p-5">
              <ErrorState message={activities.error} onRetry={activities.reload} />
            </div>
          ) : !activities.data?.items.length ? (
            <div className="p-6">
              <EmptyState icon={<Gamepad2 className="size-6" />} title="Henüz etkinlik eklenmedi" />
            </div>
          ) : (
            activities.data.items.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-paper/60">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={a.kind === 'game' ? 'sun' : 'brand'}>
                      {a.kind === 'game' ? 'Eğitsel Oyun' : 'İnteraktif Etkinlik'}
                    </Badge>
                    <Badge tone="ink">{PROVIDER_LABELS[a.provider]}</Badge>
                    <Badge tone="neutral">{a.grade}</Badge>
                  </div>
                  <p className="mt-1.5 truncate font-semibold text-ink">{a.title}</p>
                  <p className="text-xs text-muted">
                    {a.category?.name ?? 'Genel'} · {a.unit} · {formatNumber(a.play_count)} oynanma
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to={`/etkinlikler?tur=${a.kind}`}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-line-strong bg-card px-2.5 text-xs font-bold text-ink hover:border-ink dark:hover:border-sun/60"
                  >
                    Sayfada Gör <ExternalLink className="size-3" aria-hidden />
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void handleDelete(a.id, a.title)}
                    aria-label={`${a.title} sil`}
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
