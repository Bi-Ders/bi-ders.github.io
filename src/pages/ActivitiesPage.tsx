import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Clock,
  ExternalLink,
  Gamepad2,
  Maximize2,
  Minimize2,
  Play,
  Plus,
  Puzzle,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, useLockBody, usePageMeta } from '../hooks'
import { createCustomActivity, getCategories, getInteractiveActivities, recordActivityPlay } from '../services/api'
import { allowedEmbedDomainsText, buildActivitySrcDoc, validateEmbedUrl } from '../lib/embedSandbox'
import { formatNumber } from '../lib/utils'
import { Avatar, Badge, CategoryTag, Chip, PageHeader } from '../components/ui/Display'
import { Button } from '../components/ui/Button'
import { Alert, EmptyState, ErrorState, GridSkeleton } from '../components/ui/Feedback'
import type { ActivityKind, ActivityProvider, InteractiveActivity } from '../types'

const KIND_LABELS: Record<ActivityKind, string> = {
  game: 'Eğitsel Oyun',
  activity: 'İnteraktif Etkinlik',
}

const PROVIDER_LABELS: Record<ActivityProvider, string> = {
  wordwall: 'Wordwall',
  h5p: 'H5P',
  html5: 'HTML5',
}

export function ActivitiesPage() {
  usePageMeta(
    'Oyun & Etkinlikler',
    'Wordwall, H5P ve güvenli HTML5 iframe oynatıcılı eğitsel oyunlar ve interaktif ders etkinlikleri.',
  )
  const { profile, user, openAuth } = useAuth()
  const [params, setParams] = useSearchParams()

  const kindParam = params.get('tur') ?? ''
  const kind: ActivityKind | undefined = kindParam === 'game' || kindParam === 'activity' ? kindParam : undefined
  const grade = params.get('sinif') ?? ''
  const categorySlug = params.get('ders') ?? ''
  const query = params.get('ara') ?? ''

  const [activeItem, setActiveItem] = useState<InteractiveActivity | null>(null)
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({})
  const [addOpen, setAddOpen] = useState(false)

  const categories = useAsync(() => getCategories(), [])
  const activities = useAsync(
    () =>
      getInteractiveActivities({
        kind,
        grade: grade || undefined,
        categorySlug: categorySlug || undefined,
        query: query || undefined,
      }),
    [kind, grade, categorySlug, query],
  )

  const setFilter = (key: 'tur' | 'sinif' | 'ders' | 'ara', val: string) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const clearFilters = () => setParams({}, { replace: true })
  const hasFilters = Boolean(kind || grade || categorySlug || query)

  const openPlayer = (item: InteractiveActivity) => {
    const currentCount = playCounts[item.id] ?? item.play_count
    const updated = recordActivityPlay(item.id, currentCount)
    setPlayCounts((prev) => ({ ...prev, [item.id]: updated }))
    setActiveItem(item)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Oyun & Etkinlikler · İnteraktif Öğrenme"
        title={
          <span className="inline-flex items-center gap-3">
            <span
              className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-sm"
              aria-hidden
            >
              <Gamepad2 className="size-5" />
            </span>
            <span>Oyun &amp; Etkinlikler</span>
          </span>
        }
        description="Eşleştirme, hafıza kartları, kronoloji sıralama, Wordwall, H5P ve güvenli HTML5 etkinlikleriyle eğlenerek pekiştir."
        actions={
          <Button
            variant="sun"
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => {
              if (!user) return openAuth('login')
              setAddOpen(true)
            }}
          >
            Embed Etkinlik Ekle
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Tür filtresi: Tümü / Eğitsel Oyun / İnteraktif Etkinlik */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Etkinlik türü filtresi">
              <Chip active={!kind} onClick={() => setFilter('tur', '')}>
                <Sparkles className="size-3.5" aria-hidden /> Tümü
              </Chip>
              <Chip active={kind === 'game'} onClick={() => setFilter('tur', 'game')}>
                <Gamepad2 className="size-3.5" aria-hidden /> Eğitsel Oyun
              </Chip>
              <Chip active={kind === 'activity'} onClick={() => setFilter('tur', 'activity')}>
                <Puzzle className="size-3.5" aria-hidden /> İnteraktif Etkinlik
              </Chip>
            </div>

            <Link to="/testler" className="text-xs font-bold text-brand hover:underline">
              Süreli çoktan seçmeli Online Testler →
            </Link>
          </div>

          {/* Arama + Sınıf + Temizle */}
          <div className="grid gap-3 md:grid-cols-12">
            <div className="relative md:col-span-5">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setFilter('ara', e.target.value)}
                placeholder="Oyun, etkinlik, Wordwall veya H5P ara…"
                aria-label="Oyun ve etkinliklerde ara"
                className="input pl-10"
              />
            </div>

            <div className="md:col-span-4">
              <select
                aria-label="Sınıf filtresi"
                value={grade}
                onChange={(e) => setFilter('sinif', e.target.value)}
                className="input"
              >
                <option value="">Tüm Sınıflar</option>
                {(activities.data?.grades ?? []).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center md:col-span-3">
              {hasFilters ? (
                <Button variant="secondary" className="w-full" onClick={clearFilters} icon={<RotateCcw className="size-4" />}>
                  Filtreleri Temizle
                </Button>
              ) : (
                <div className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-white/70 px-3 py-2.5 text-xs font-semibold text-muted">
                  <ShieldCheck className="size-4 text-success" aria-hidden />
                  <span>Güvenli Sandbox İframe</span>
                </div>
              )}
            </div>
          </div>

          {/* Ders filtresi */}
          <div className="flex flex-wrap gap-2">
            <Chip active={!categorySlug} onClick={() => setFilter('ders', '')}>
              Tüm Dersler
            </Chip>
            {(categories.data ?? []).map((c) => (
              <Chip key={c.id} active={categorySlug === c.slug} onClick={() => setFilter('ders', c.slug)}>
                {c.name}
              </Chip>
            ))}
          </div>
        </div>
      </PageHeader>

      <section className="container-page py-10">
        {activities.loading ? (
          <GridSkeleton count={6} />
        ) : activities.error ? (
          <ErrorState message={activities.error} onRetry={activities.reload} />
        ) : !activities.data?.items.length ? (
          <EmptyState
            icon={<Gamepad2 className="size-6" />}
            title="Bu filtrelerle eşleşen oyun veya etkinlik yok"
            description="Tür, sınıf veya ders filtresini değiştirerek tüm etkileşimli içerikleri keşfedebilirsin."
            action={
              hasFilters && (
                <Button variant="secondary" onClick={clearFilters}>
                  Filtreleri temizle
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activities.data.items.map((item) => {
              const plays = playCounts[item.id] ?? item.play_count
              return (
                <article key={item.id} className="card card-hover flex flex-col overflow-hidden">
                  {/* Gradyan Kapak */}
                  <div className={`relative flex h-36 flex-col justify-between bg-gradient-to-br ${item.gradient} p-4 text-white`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur-xs">
                        {item.kind === 'game' ? <Gamepad2 className="size-3.5" aria-hidden /> : <Puzzle className="size-3.5" aria-hidden />}
                        {KIND_LABELS[item.kind]}
                      </span>
                      <span className="rounded-md bg-ink/80 px-2 py-0.5 text-[11px] font-extrabold tracking-wide uppercase">
                        {PROVIDER_LABELS[item.provider]}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold tracking-wider uppercase opacity-90">{item.grade}</p>
                        <p className="truncate text-sm font-extrabold">{item.unit}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openPlayer(item)}
                        aria-label={`${item.title} oynat`}
                        className="grid size-10 shrink-0 place-items-center rounded-full bg-sun text-ink shadow-md transition hover:scale-105"
                      >
                        <Play className="ml-0.5 size-4 fill-current" aria-hidden />
                      </button>
                    </div>
                  </div>

                  {/* Gövde */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.category && <CategoryTag name={item.category.name} color={item.category.color} />}
                      <Badge tone="neutral">
                        <Clock className="size-3" aria-hidden /> {item.duration_minutes} dk
                      </Badge>
                    </div>

                    <h2 className="mt-3 text-lg leading-snug font-bold text-ink">{item.title}</h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{item.description}</p>

                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                      <span className="inline-flex items-center gap-2 font-medium text-ink-soft">
                        <Avatar name={item.author?.full_name} src={item.author?.avatar_url} size="sm" />
                        <span className="truncate">{item.author?.full_name ?? 'Bi Ders!'}</span>
                      </span>
                      <span className="font-semibold">{formatNumber(plays)} oynanma</span>
                    </div>

                    <Button
                      className="mt-4 w-full"
                      variant="primary"
                      size="sm"
                      onClick={() => openPlayer(item)}
                      icon={<Play className="size-4" aria-hidden />}
                    >
                      {item.kind === 'game' ? 'Oyunu Başlat' : 'Etkinliği Aç'}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {activeItem && <ActivityEmbedModal activity={activeItem} onClose={() => setActiveItem(null)} />}

      {addOpen && (
        <AddEmbedModal
          categories={categories.data ?? []}
          author={
            profile
              ? { id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url, role: profile.role }
              : null
          }
          onClose={() => setAddOpen(false)}
          onCreated={(created) => {
            setAddOpen(false)
            activities.reload()
            setActiveItem(created)
          }}
        />
      )}
    </div>
  )
}

function ActivityEmbedModal({ activity, onClose }: { activity: InteractiveActivity; onClose: () => void }) {
  useLockBody(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [reloadSeed, setReloadSeed] = useState(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const srcDoc = buildActivitySrcDoc(activity)
  const validatedExternal = activity.embed_url ? validateEmbedUrl(activity.embed_url) : null
  const safeExternalUrl = validatedExternal?.valid ? validatedExternal.normalized : null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${fullscreen ? 'p-0' : 'p-2 sm:p-5'}`}>
      <div className="absolute inset-0 animate-fade-in bg-ink/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-player-title"
        className={`relative flex flex-col overflow-hidden border border-line bg-paper shadow-[var(--shadow-pop)] ${
          fullscreen ? 'h-dvh w-screen rounded-none' : 'h-[88dvh] w-full max-w-5xl rounded-3xl'
        }`}
      >
        {/* Oynatıcı Üst Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{KIND_LABELS[activity.kind]}</Badge>
              <Badge tone="ink">{PROVIDER_LABELS[activity.provider]}</Badge>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                <ShieldCheck className="size-3.5" aria-hidden /> Güvenli İframe
              </span>
            </div>
            <h2 id="activity-player-title" className="mt-1 truncate text-base font-extrabold text-ink sm:text-lg">
              {activity.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReloadSeed((s) => s + 1)}
              icon={<RotateCcw className="size-4" aria-hidden />}
            >
              <span className="hidden sm:inline">Yenile</span>
            </Button>
            {safeExternalUrl && (
              <a
                href={safeExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line-strong bg-white px-3 text-sm font-semibold text-ink transition hover:border-ink"
              >
                <ExternalLink className="size-4" aria-hidden />
                <span className="hidden sm:inline">Kaynak</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setFullscreen((f) => !f)}
              aria-label={fullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
              className="grid size-9 place-items-center rounded-xl border border-line-strong bg-white text-ink transition hover:border-ink"
            >
              {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Oynatıcıyı kapat"
              className="grid size-9 place-items-center rounded-xl border border-line-strong bg-white text-ink transition hover:border-ink"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Güvenli Sandbox İframe Alanı */}
        <div className="relative flex-1 bg-paper-deep">
          {safeExternalUrl ? (
            <iframe
              key={`${activity.id}-${reloadSeed}`}
              src={safeExternalUrl}
              title={activity.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              referrerPolicy="no-referrer"
              allow="fullscreen"
              className="size-full border-0 bg-white"
            />
          ) : srcDoc ? (
            <iframe
              key={`${activity.id}-${reloadSeed}`}
              srcDoc={srcDoc}
              title={activity.title}
              sandbox="allow-scripts"
              className="size-full border-0 bg-paper"
            />
          ) : (
            <div className="grid size-full place-items-center p-8 text-center">
              <EmptyState
                icon={<Gamepad2 className="size-6" />}
                title="Geçerli bir embed içeriği bulunamadı"
                description="Bu etkinlik için güvenilir bir Wordwall, H5P veya HTML5 kaynağı tanımlı değil."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddEmbedModal({
  categories,
  author,
  onClose,
  onCreated,
}: {
  categories: Array<{ id: string; name: string }>
  author: InteractiveActivity['author']
  onClose: () => void
  onCreated: (item: InteractiveActivity) => void
}) {
  useLockBody(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<ActivityKind>('game')
  const [grade, setGrade] = useState('9. Sınıf')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [unit, setUnit] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (title.trim().length < 3) {
      setError('Başlık en az 3 karakter olmalıdır.')
      return
    }
    const check = validateEmbedUrl(embedUrl)
    if (!check.valid || !check.normalized || !check.provider) {
      setError(check.error ?? 'Geçersiz embed bağlantısı.')
      return
    }

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
        },
        author ?? null,
      )
      onCreated(created)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-ink/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-embed-title"
        className="relative max-h-[92dvh] w-full max-w-lg animate-pop-in overflow-y-auto rounded-t-3xl border border-line bg-paper p-6 shadow-[var(--shadow-pop)] sm:rounded-3xl sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-xl text-muted hover:bg-ink/5 hover:text-ink"
        >
          <X className="size-5" />
        </button>

        <p className="eyebrow">Wordwall · H5P · HTML5</p>
        <h2 id="add-embed-title" className="mt-1 text-2xl font-extrabold">
          Güvenli Embed Etkinlik Ekle
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          İzin verilen sağlayıcılar: <span className="font-semibold text-ink-soft">{allowedEmbedDomainsText}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="ae-title" className="label">
              Etkinlik / Oyun Başlığı
            </label>
            <input
              id="ae-title"
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Kesirler Çarkıfelek Oyunu"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ae-kind" className="label">
                Tür
              </label>
              <select
                id="ae-kind"
                className="input"
                value={kind}
                onChange={(e) => setKind(e.target.value as ActivityKind)}
              >
                <option value="game">Eğitsel Oyun</option>
                <option value="activity">İnteraktif Etkinlik</option>
              </select>
            </div>
            <div>
              <label htmlFor="ae-grade" className="label">
                Sınıf
              </label>
              <input
                id="ae-grade"
                className="input"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Örn: 8. Sınıf / LGS"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ae-cat" className="label">
                Ders
              </label>
              <select
                id="ae-cat"
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
            <div>
              <label htmlFor="ae-unit" className="label">
                Ünite
              </label>
              <input
                id="ae-unit"
                className="input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Örn: Kesirler"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ae-url" className="label">
              Embed URL veya iframe Kodu
            </label>
            <input
              id="ae-url"
              className="input"
              required
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://wordwall.net/embed/..."
            />
          </div>

          <div>
            <label htmlFor="ae-desc" className="label">
              Kısa Açıklama
            </label>
            <textarea
              id="ae-desc"
              rows={2}
              className="input resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Etkinliğin kazanımını kısaca yazın…"
            />
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit" loading={busy} icon={<Plus className="size-4" aria-hidden />}>
              Kaydet ve Aç
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
