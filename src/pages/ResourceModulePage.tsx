import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Download,
  Eye,
  FileText,
  Filter,
  Layers,
  Printer,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { siteConfig } from '../config/site'
import { useAsync, useLockBody, usePageMeta } from '../hooks'
import { getCategories, getModuleResources, recordResourceDownload } from '../services/api'
import { formatDate, formatNumber, slugify } from '../lib/utils'
import { ModuleIcon } from '../components/modules/ModuleIcon'
import { Avatar, Badge, CategoryTag, Chip, PageHeader } from '../components/ui/Display'
import { Button } from '../components/ui/Button'
import { Alert, EmptyState, ErrorState, GridSkeleton } from '../components/ui/Feedback'
import type { ModuleResource, ResourceModuleKey } from '../types'

type ModuleMeta = {
  eyebrow: string
  title: string
  description: string
  unitMetric: string
  searchPlaceholder: string
}

const MODULE_META: Record<ResourceModuleKey, ModuleMeta> = {
  sunular: {
    eyebrow: 'Sunular ve Slayt Arşivi',
    title: 'Akıllı tahta ve ders sunuları',
    description: 'Sınıf, ders ve üniteye göre filtrelenmiş akıllı tahta uyumlu sunuları önizle ve ücretsiz indir.',
    unitMetric: 'slayt',
    searchPlaceholder: 'Sunu başlığı, konu veya ünite ara…',
  },
  'ders-notlari': {
    eyebrow: 'Ders Notları ve Özet Föyler',
    title: 'Düzenli ders notları ve föyler',
    description: 'Konu özetleri, formül kartları ve sınava hazırlık ders notlarını hemen incele veya PDF olarak kaydet.',
    unitMetric: 'sayfa',
    searchPlaceholder: 'Ders notu, formül veya ünite ara…',
  },
  yazililar: {
    eyebrow: 'Yazılı Sınav Arşivi',
    title: 'MEB uyumlu yazılılar ve cevap anahtarları',
    description: 'Açık uçlu ve klasik yazılı senaryolarını sınıf, ders ve üniteye göre filtreleyip indir.',
    unitMetric: 'sayfa',
    searchPlaceholder: 'Yazılı dönemi, sınıf veya ders ara…',
  },
  sinavlar: {
    eyebrow: 'Deneme ve Sınav Kitapçıkları',
    title: 'LGS, TYT ve AYT deneme sınavları',
    description: 'Güncel müfredata uygun tam deneme kitapçıkları, branş denemeleri ve ayrıntılı çözüm kılavuzları.',
    unitMetric: 'sayfa',
    searchPlaceholder: 'TYT, AYT, LGS veya branş denemesi ara…',
  },
  evraklar: {
    eyebrow: 'Öğretmen Evrak ve Şablonları',
    title: 'Yıllık planlar, zümre ve resmi evraklar',
    description: 'Ünitelendirilmiş yıllık planlar, zümre tutanakları, BEP formları ve sınav analiz çizelgeleri.',
    unitMetric: 'sayfa',
    searchPlaceholder: 'Yıllık plan, zümre, BEP veya analiz ara…',
  },
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildPrintableHtml(resource: ModuleResource, moduleLabel: string): string {
  const sectionsHtml = resource.preview_sections
    .map(
      (s) => `
      <section class="sec">
        <h2>${escapeHtml(s.heading)}</h2>
        <p>${escapeHtml(s.content).replace(/\n/g, '<br />')}</p>
        ${
          s.items?.length
            ? `<ul>${s.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
            : ''
        }
      </section>`,
    )
    .join('')

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(resource.title)} — Bi Ders!</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #12204a; max-width: 820px; margin: 32px auto; padding: 0 24px; line-height: 1.65; }
    header { border-bottom: 3px solid #12204a; padding-bottom: 16px; margin-bottom: 24px; }
    .eyebrow { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #2f55d4; }
    h1 { margin: 8px 0; font-size: 26px; }
    .meta { font-size: 13px; color: #545d7a; }
    .sec { margin: 22px 0; padding: 16px 20px; border: 1px solid #e5dfd0; border-radius: 12px; background: #faf7f0; }
    .sec h2 { margin: 0 0 8px; font-size: 18px; }
    .sec p { margin: 0; }
    .sec ul { margin: 10px 0 0 20px; }
    footer { margin-top: 32px; font-size: 12px; color: #545d7a; border-top: 1px solid #e5dfd0; padding-top: 12px; }
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">Bi Ders! · ${escapeHtml(moduleLabel)} · ${escapeHtml(resource.format)}</div>
    <h1>${escapeHtml(resource.title)}</h1>
    <div class="meta">${escapeHtml(resource.grade)} · ${escapeHtml(resource.category?.name ?? 'Genel')} · Ünite: ${escapeHtml(resource.unit)}</div>
  </header>
  <p>${escapeHtml(resource.summary)}</p>
  ${sectionsHtml}
  <footer>Kaynak: Bi Ders! (${siteConfig.url}) — Ücretsiz ve açık kaynak eğitim platformu.</footer>
</body>
</html>`
}

export function ResourceModulePage({ module }: { module: ResourceModuleKey }) {
  const modConfig = siteConfig.educationModules.find((m) => m.key === module)!
  const meta = MODULE_META[module]
  usePageMeta(modConfig.label, meta.description)

  const [params, setParams] = useSearchParams()
  const grade = params.get('sinif') ?? ''
  const categorySlug = params.get('ders') ?? ''
  const unit = params.get('unite') ?? ''
  const query = params.get('ara') ?? ''

  const [previewItem, setPreviewItem] = useState<ModuleResource | null>(null)
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>({})
  const [toast, setToast] = useState<string | null>(null)

  const categories = useAsync(() => getCategories(), [])
  const resources = useAsync(
    () =>
      getModuleResources(module, {
        grade: grade || undefined,
        categorySlug: categorySlug || undefined,
        unit: unit || undefined,
        query: query || undefined,
      }),
    [module, grade, categorySlug, unit, query],
  )

  const setFilter = (key: 'sinif' | 'ders' | 'unite' | 'ara', val: string) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val)
    else next.delete(key)
    if (key === 'sinif' || key === 'ders') {
      next.delete('unite')
    }
    setParams(next, { replace: true })
  }

  const clearFilters = () => setParams({}, { replace: true })
  const hasFilters = Boolean(grade || categorySlug || unit || query)

  const handleDownload = (resource: ModuleResource) => {
    const currentCount = downloadCounts[resource.id] ?? resource.download_count
    const nextCount = recordResourceDownload(resource.id, currentCount)
    setDownloadCounts((prev) => ({ ...prev, [resource.id]: nextCount }))

    if (resource.file_url) {
      if (resource.file_url.startsWith('data:')) {
        const ext = resource.format.toLowerCase()
        const a = document.createElement('a')
        a.href = resource.file_url
        a.download = `${slugify(resource.title) || resource.id}.${ext}`
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        window.open(resource.file_url, '_blank', 'noopener,noreferrer')
      }
    } else {
      const html = buildPrintableHtml(resource, modConfig.label)
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slugify(resource.title) || resource.id}.html`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }

    setToast(`"${resource.title}" indirildi (${resource.format}).`)
  }

  return (
    <div>
      <PageHeader
        eyebrow={meta.eyebrow}
        title={
          <span className="inline-flex items-center gap-3">
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${modConfig.gradient} text-white shadow-sm`}
              aria-hidden
            >
              <ModuleIcon name={modConfig.icon} className="size-5" />
            </span>
            <span>{meta.title}</span>
          </span>
        }
        description={meta.description}
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-12">
            {/* Arama */}
            <div className="relative md:col-span-4">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setFilter('ara', e.target.value)}
                placeholder={meta.searchPlaceholder}
                aria-label={`${modConfig.label} içinde ara`}
                className="input pl-10"
              />
            </div>

            {/* Sınıf filtresi */}
            <div className="md:col-span-3">
              <select
                aria-label="Sınıf filtresi"
                value={grade}
                onChange={(e) => setFilter('sinif', e.target.value)}
                className="input"
              >
                <option value="">Tüm Sınıflar</option>
                {(resources.data?.grades ?? []).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Ünite filtresi */}
            <div className="md:col-span-3">
              <select
                aria-label="Ünite filtresi"
                value={unit}
                onChange={(e) => setFilter('unite', e.target.value)}
                className="input"
              >
                <option value="">Tüm Üniteler</option>
                {(resources.data?.units ?? []).map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Temizle */}
            <div className="flex items-center md:col-span-2">
              {hasFilters ? (
                <Button variant="secondary" className="w-full" onClick={clearFilters} icon={<RotateCcw className="size-4" />}>
                  Temizle
                </Button>
              ) : (
                <div className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-card/80 px-3 py-2.5 text-xs font-semibold text-muted">
                  <Filter className="size-3.5" aria-hidden />
                  <span>{resources.data?.items.length ?? 0} doküman</span>
                </div>
              )}
            </div>
          </div>

          {/* Ders filtresi çipleri */}
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
        {toast && (
          <Alert tone="success" className="mb-6 flex items-center justify-between gap-3">
            <span>{toast}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-lg p-1 hover:bg-success/10"
              aria-label="Bildirimi kapat"
            >
              <X className="size-4" />
            </button>
          </Alert>
        )}

        {resources.loading ? (
          <GridSkeleton count={4} />
        ) : resources.error ? (
          <ErrorState message={resources.error} onRetry={resources.reload} />
        ) : !resources.data?.items.length ? (
          <EmptyState
            icon={<FileText className="size-6" />}
            title="Bu filtrelerle eşleşen doküman bulunamadı"
            description="Sınıf, ders veya ünite seçimini değiştirerek diğer kaynakları görebilirsin."
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
            {resources.data.items.map((item) => {
              const dlCount = downloadCounts[item.id] ?? item.download_count
              return (
                <article key={item.id} className="card card-hover flex flex-col overflow-hidden">
                  {/* Tailwind CSS Gradyan Kapak */}
                  <div className={`relative flex h-36 flex-col justify-between bg-gradient-to-br ${item.gradient} p-4 text-white`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur-xs">
                        {item.grade}
                      </span>
                      <span className="rounded-md bg-[#12204a]/80 px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-[#f9f7f0] uppercase">
                        {item.format}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold tracking-wider uppercase opacity-90">
                          {item.category?.name ?? 'Genel'}
                        </p>
                        <p className="truncate text-sm font-extrabold">{item.unit}</p>
                      </div>
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/20 backdrop-blur-xs" aria-hidden>
                        <ModuleIcon name={modConfig.icon} className="size-4" />
                      </span>
                    </div>
                  </div>

                  {/* Kart İçeriği */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.category && <CategoryTag name={item.category.name} color={item.category.color} />}
                      <Badge tone="neutral">
                        <Layers className="size-3" aria-hidden /> {item.page_count} {meta.unitMetric}
                      </Badge>
                      <Badge tone="neutral">{item.file_size}</Badge>
                    </div>

                    <h2 className="mt-3 text-lg leading-snug font-bold text-ink">{item.title}</h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{item.summary}</p>

                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                      <span className="inline-flex items-center gap-2 font-medium text-ink-soft">
                        <Avatar name={item.author?.full_name} src={item.author?.avatar_url} size="sm" />
                        <span className="truncate">{item.author?.full_name ?? 'Bi Ders!'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <Download className="size-3.5" aria-hidden /> {formatNumber(dlCount)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPreviewItem(item)}
                        icon={<Eye className="size-4" aria-hidden />}
                      >
                        Önizle
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDownload(item)}
                        icon={<Download className="size-4" aria-hidden />}
                      >
                        İndir
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {previewItem && (
        <DocumentPreviewModal
          resource={previewItem}
          moduleLabel={modConfig.label}
          unitMetric={meta.unitMetric}
          downloadCount={downloadCounts[previewItem.id] ?? previewItem.download_count}
          onClose={() => setPreviewItem(null)}
          onDownload={() => handleDownload(previewItem)}
        />
      )}
    </div>
  )
}

function DocumentPreviewModal({
  resource,
  moduleLabel,
  unitMetric,
  downloadCount,
  onClose,
  onDownload,
}: {
  resource: ModuleResource
  moduleLabel: string
  unitMetric: string
  downloadCount: number
  onClose: () => void
  onDownload: () => void
}) {
  useLockBody(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handlePrint = () => {
    const html = buildPrintableHtml(resource, moduleLabel)
    const win = window.open('', '_blank', 'width=860,height=720')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-[#091129]/55 backdrop-blur-[2px] dark:bg-[#050a1a]/75" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-preview-title"
        className="relative flex max-h-[92dvh] w-full max-w-3xl animate-pop-in flex-col overflow-hidden rounded-t-3xl border border-line bg-paper shadow-[var(--shadow-pop)] sm:rounded-3xl"
      >
        {/* Gradyan üst başlık */}
        <div className={`relative bg-gradient-to-br ${resource.gradient} p-6 text-white sm:p-7`}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Önizlemeyi kapat"
            className="absolute top-4 right-4 grid size-9 place-items-center rounded-xl bg-white/15 text-white transition hover:bg-white/25"
          >
            <X className="size-5" />
          </button>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 backdrop-blur-xs">{moduleLabel}</span>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 backdrop-blur-xs">{resource.grade}</span>
            <span className="rounded-md bg-[#12204a]/80 px-2 py-0.5 text-[#f9f7f0] uppercase">{resource.format}</span>
          </div>
          <h2 id="doc-preview-title" className="mt-3 pr-10 font-display text-2xl font-extrabold text-white">
            {resource.title}
          </h2>
          <p className="mt-1.5 text-sm text-white/90">
            {resource.category?.name ?? 'Genel'} · Ünite: {resource.unit} · {resource.page_count} {unitMetric} · {resource.file_size}
          </p>
        </div>

        {/* Önizleme gövdesi */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <p className="text-[15px] leading-relaxed text-ink-soft">{resource.summary}</p>

          {resource.file_url && (
            <div className="rounded-2xl border border-brand/25 bg-brand-soft/45 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-ink">
                  Ekli Dosya ({resource.format} · {resource.file_size})
                </span>
                {!resource.file_url.startsWith('data:') && (
                  <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-brand hover:underline"
                  >
                    Dosyayı Yeni Sekmede Aç →
                  </a>
                )}
              </div>
              {(resource.file_url.startsWith('data:application/pdf') ||
                resource.file_url.toLowerCase().endsWith('.pdf')) && (
                <iframe
                  src={resource.file_url}
                  title={`${resource.title} PDF önizleme`}
                  className="mt-3 h-80 w-full rounded-xl border border-line bg-white"
                />
              )}
            </div>
          )}

          <div className="space-y-4">
            {resource.preview_sections.map((section, idx) => (
              <div key={section.heading} className="rounded-2xl border border-line bg-card p-5">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-brand-soft text-xs font-extrabold text-brand-dark">
                    {idx + 1}
                  </span>
                  <h3 className="text-base font-bold text-ink">{section.heading}</h3>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{section.content}</p>
                {section.items && section.items.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-line/70 pt-3 text-sm text-ink-soft">
                    {section.items.map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <Sparkles className="mt-1 size-3.5 shrink-0 text-brand" aria-hidden />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>
              Hazırlayan: <strong className="text-ink">{resource.author?.full_name ?? 'Bi Ders!'}</strong> · {formatDate(resource.published_at)}
            </span>
            <span>{formatNumber(downloadCount)} kez indirildi</span>
          </div>
        </div>

        {/* Alt eylem çubuğu */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-card px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Kapat
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint} icon={<Printer className="size-4" aria-hidden />}>
              Yazdır / PDF
            </Button>
            <Button variant="sun" size="sm" onClick={onDownload} icon={<Download className="size-4" aria-hidden />}>
              Dokümanı İndir
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
