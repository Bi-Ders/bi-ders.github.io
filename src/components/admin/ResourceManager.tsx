import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ExternalLink,
  FileText,
  FileUp,
  Link2,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  createContent,
  createModuleResource,
  deleteContent,
  deleteModuleResource,
  deleteUploadedFile,
  getAllModuleResources,
  getManagedContents,
  isR2UploadConfigured,
  uploadFile,
} from '../../services/api'
import { useAsync } from '../../hooks'
import {
  cn,
  contentTypeLabels,
  formatDate,
  formatFileSize,
  isSafeHttpUrl,
  resourceModuleLabels,
} from '../../lib/utils'
import { compressImageToWebPFile, detectDocumentFormat } from './fileHelpers'
import { Badge, Chip } from '../ui/Display'
import { Button } from '../ui/Button'
import { Alert, EmptyState, ErrorState, RowSkeleton } from '../ui/Feedback'
import type {
  AuthorSummary,
  Category,
  ContentType,
  DocumentFormat,
  ResourceModuleKey,
} from '../../types'

type TargetOption = ResourceModuleKey | 'lesson'

const TARGET_OPTIONS: Array<{ value: TargetOption; label: string; route: string; hint: string }> = [
  { value: 'ders-notlari', label: 'Ders Notları', route: '/ders-notlari', hint: 'Özet föyler ve kavram haritaları' },
  { value: 'sunular', label: 'Sunular', route: '/sunular', hint: 'Akıllı tahta ve ders slaytları' },
  { value: 'yazililar', label: 'Yazılılar', route: '/yazililar', hint: 'Dönemlik yazılı ve cevap anahtarları' },
  { value: 'sinavlar', label: 'Sınavlar', route: '/sinavlar', hint: 'LGS, TYT, AYT deneme kitapçıkları' },
  { value: 'evraklar', label: 'Evraklar', route: '/evraklar', hint: 'Yıllık plan, zümre ve BEP formları' },
  { value: 'lesson', label: 'Konu Anlatımı (/dersler)', route: '/dersler', hint: 'Makale ve konu anlatımı sayfası' },
]

const GRADE_SUGGESTIONS = [
  '8. Sınıf / LGS',
  '9. Sınıf',
  '10. Sınıf',
  '11. Sınıf',
  '12. Sınıf / AYT',
  'TYT',
  'Öğretmen / Genel',
]

export function ResourceManager({
  categories,
  author,
  userId,
  isAdmin,
  onChanged,
}: {
  categories: Category[]
  author: AuthorSummary
  userId: string
  isAdmin: boolean
  onChanged: () => void
}) {
  const [target, setTarget] = useState<TargetOption>('ders-notlari')
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [grade, setGrade] = useState('9. Sınıf')
  const [unit, setUnit] = useState('')
  const [format, setFormat] = useState<DocumentFormat>('PDF')
  const [contentType, setContentType] = useState<ContentType>('lesson')
  const [pageCount, setPageCount] = useState('8')
  const [fileSize, setFileSize] = useState('1.2 MB')
  const [sourceMode, setSourceMode] = useState<'link' | 'file'>('link')
  const [fileUrl, setFileUrl] = useState('')
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const [uploadedR2Key, setUploadedR2Key] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [summary, setSummary] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')

  const [listFilter, setListFilter] = useState<'all' | TargetOption>('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ text: string; href: string; linkLabel: string } | null>(null)

  const r2Enabled = isR2UploadConfigured()
  const resources = useAsync(() => getAllModuleResources(), [])
  const lessons = useAsync(() => getManagedContents(userId, isAdmin), [userId, isAdmin])

  const handleFilePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const prepared = file.type.startsWith('image/') ? await compressImageToWebPFile(file, 1200) : file
      const folder = target === 'lesson' ? 'contents' : target
      const uploaded = await uploadFile(prepared, { folder, maxDemoBytes: 1_500_000 })
      if (uploadedR2Key) {
        void deleteUploadedFile(uploadedR2Key, { silent: true })
      }
      setFileUrl(uploaded.url)
      setUploadedName(prepared.name)
      setUploadedR2Key(uploaded.key)
      setFormat(detectDocumentFormat(prepared.name))
      setFileSize(formatFileSize(uploaded.size))
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '))
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const clearAttachment = () => {
    if (uploadedR2Key) {
      void deleteUploadedFile(uploadedR2Key, { silent: true })
    }
    setFileUrl('')
    setUploadedName(null)
    setUploadedR2Key(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (title.trim().length < 3) {
      setError('Başlık en az 3 karakter olmalıdır.')
      return
    }
    if (sourceMode === 'link' && fileUrl.trim() && !isSafeHttpUrl(fileUrl)) {
      setError('Harici dosya linki geçerli bir https:// veya http:// adresi olmalıdır.')
      return
    }

    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8)

    setBusy(true)
    try {
      if (target === 'lesson') {
        const created = await createContent(
          {
            title,
            summary,
            body: bodyText || summary,
            type: contentType,
            category_id: categoryId || null,
            grade,
            file_url: fileUrl.trim() || null,
            tags,
          },
          author,
        )
        lessons.reload()
        onChanged()
        setSuccess({
          text: `"${created.title}" konusu yayınlandı ve /dersler sayfasına eklendi.`,
          href: `/dersler/${created.slug}`,
          linkLabel: 'Konuyu Görüntüle',
        })
      } else {
        const created = await createModuleResource(
          {
            module: target,
            title,
            summary,
            grade,
            category_id: categoryId || null,
            unit: unit || 'Genel',
            format,
            file_size: fileSize || '1.0 MB',
            page_count: Number(pageCount) || 4,
            file_url: fileUrl.trim() || null,
            preview_content: bodyText || undefined,
            tags: tags.length ? tags : [resourceModuleLabels[target].toLocaleLowerCase('tr-TR')],
          },
          author,
        )
        resources.reload()
        onChanged()
        const meta = TARGET_OPTIONS.find((o) => o.value === target)!
        setSuccess({
          text: `"${created.title}" dokümanı ${meta.label} modülüne eklendi.`,
          href: meta.route,
          linkLabel: `${meta.label} Sayfasına Git`,
        })
      }

      setTitle('')
      setUnit('')
      setSummary('')
      setBodyText('')
      setTagsRaw('')
      setFileUrl('')
      setUploadedName(null)
      setUploadedR2Key(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteResource = async (id: string, itemTitle: string) => {
    setError(null)
    try {
      await deleteModuleResource(id)
      resources.setData((prev) => prev?.filter((r) => r.id !== id) ?? prev)
      onChanged()
      setSuccess({ text: `"${itemTitle}" dokümanı kaldırıldı.`, href: '', linkLabel: '' })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleDeleteLesson = async (id: string, itemTitle: string) => {
    setError(null)
    try {
      await deleteContent(id)
      lessons.setData((prev) => prev?.filter((c) => c.id !== id) ?? prev)
      onChanged()
      setSuccess({ text: `"${itemTitle}" konu anlatımı kaldırıldı.`, href: '', linkLabel: '' })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const visibleResources =
    listFilter === 'lesson'
      ? []
      : (resources.data ?? []).filter((r) => listFilter === 'all' || r.module === listFilter)

  const visibleLessons =
    listFilter === 'all' || listFilter === 'lesson' ? (lessons.data ?? []) : []

  return (
    <div className="space-y-8">
      {/* İçerik / Doküman Ekleme Formu */}
      <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-7">
        <div>
          <p className="eyebrow">Yeni Materyal Ekle</p>
          <h2 className="mt-1 text-xl font-extrabold text-ink">
            Ders Notu, Sunu, Yazılı, Sınav veya Evrak Yayınla
          </h2>
          <p className="mt-1 text-sm text-muted">
            Eklenen materyal seçtiğin modül sayfasında anında listelenir; dosya yükleyebilir veya harici PDF/Drive bağlantısı ekleyebilirsin.
          </p>
        </div>

        {/* Hedef Modül Seçimi */}
        <div>
          <span className="label">Hedef Modül</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {TARGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTarget(opt.value)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left transition',
                  target === opt.value
                    ? 'border-ink bg-ink text-paper shadow-xs'
                    : 'border-line-strong bg-white text-ink-soft hover:border-ink hover:text-ink',
                )}
              >
                <span className="block text-xs font-extrabold">{opt.label}</span>
                <span
                  className={cn(
                    'mt-0.5 block truncate text-[11px]',
                    target === opt.value ? 'text-paper/75' : 'text-muted',
                  )}
                >
                  {opt.route}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="res-title" className="label">
              Başlık *
            </label>
            <input
              id="res-title"
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                target === 'sunular'
                  ? 'Örn: Fonksiyonlar Akıllı Tahta Sunumu (24 Slayt)'
                  : target === 'yazililar'
                    ? 'Örn: 10. Sınıf Matematik 1. Dönem 2. Yazılı (Açık Uçlu)'
                    : target === 'evraklar'
                      ? 'Örn: 2026–2027 10. Sınıf Fizik Yıllık Planı'
                      : 'Örn: İntegral Kuralları ve Alan Hesabı Özet Föyü'
              }
            />
          </div>

          <div>
            <label htmlFor="res-cat" className="label">
              Ders / Kategori
            </label>
            <select
              id="res-cat"
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="res-grade" className="label">
              Sınıf / Seviye
            </label>
            <input
              id="res-grade"
              list="admin-grade-list"
              className="input"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Örn: 10. Sınıf"
            />
            <datalist id="admin-grade-list">
              {GRADE_SUGGESTIONS.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </div>

          {target !== 'lesson' ? (
            <>
              <div>
                <label htmlFor="res-unit" className="label">
                  Ünite / Konu
                </label>
                <input
                  id="res-unit"
                  className="input"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Örn: Türev, Yıllık Plan…"
                />
              </div>

              <div>
                <label htmlFor="res-format" className="label">
                  Dosya Formatı
                </label>
                <select
                  id="res-format"
                  className="input"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as DocumentFormat)}
                >
                  <option value="PDF">PDF</option>
                  <option value="PPTX">PPTX (Sunu)</option>
                  <option value="DOCX">DOCX (Word)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="res-pages" className="label">
                    {target === 'sunular' ? 'Slayt' : 'Sayfa'}
                  </label>
                  <input
                    id="res-pages"
                    type="number"
                    min={1}
                    max={999}
                    className="input"
                    value={pageCount}
                    onChange={(e) => setPageCount(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="res-size" className="label">
                    Boyut
                  </label>
                  <input
                    id="res-size"
                    className="input"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="1.2 MB"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="res-ctype" className="label">
                İçerik Türü
              </label>
              <select
                id="res-ctype"
                className="input"
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
              >
                <option value="lesson">Konu Anlatımı</option>
                <option value="article">Makale</option>
                <option value="document">Doküman</option>
                <option value="video">Video Ders</option>
              </select>
            </div>
          )}
        </div>

        {/* Dosya Yükleme veya Harici Link */}
        <div className="rounded-2xl border border-line bg-paper/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-ink">Dosya / Kaynak Bağlantısı</span>
            <div className="inline-flex rounded-xl border border-line-strong bg-white p-0.5">
              <button
                type="button"
                onClick={() => {
                  setSourceMode('link')
                  if (uploadedName) clearAttachment()
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition',
                  sourceMode === 'link' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink',
                )}
              >
                <Link2 className="size-3.5" aria-hidden /> Harici Link
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('file')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition',
                  sourceMode === 'file' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink',
                )}
              >
                <Upload className="size-3.5" aria-hidden /> Dosya Yükle
              </button>
            </div>
          </div>

          {sourceMode === 'link' ? (
            <div className="mt-3">
              <label htmlFor="res-url" className="sr-only">
                Harici dosya bağlantısı
              </label>
              <input
                id="res-url"
                type="url"
                className="input"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/... veya doğrudan .pdf / .pptx / .docx linki (opsiyonel)"
              />
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink">
                <FileUp className="size-4 text-brand" aria-hidden />
                <span>{uploading ? 'Yükleniyor…' : 'PDF / PPTX / DOCX / ZIP Seç'}</span>
                <input
                  type="file"
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.webp,.png,.jpg,.jpeg,application/pdf"
                  className="sr-only"
                  disabled={uploading}
                  onChange={handleFilePick}
                />
              </label>

              {uploadedName ? (
                <span className="inline-flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-3 py-1.5 text-xs font-bold text-success">
                  <FileText className="size-3.5" aria-hidden />
                  {uploadedName} ({fileSize})
                  <button
                    type="button"
                    onClick={clearAttachment}
                    aria-label="Yüklenen dosyayı kaldır"
                    className="rounded p-0.5 hover:bg-success/15"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ) : (
                <span className="text-xs text-muted">
                  {r2Enabled
                    ? 'Cloudflare R2’ye en fazla 25 MB (PDF, PPTX, DOCX, ZIP, görsel) yükleyebilirsiniz.'
                    : 'Demo Modu için en fazla 1.5 MB dosya tarayıcıda saklanır; büyük dosyalar için Harici Link kullanabilirsiniz.'}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor="res-summary" className="label">
              Kısa Özet
            </label>
            <textarea
              id="res-summary"
              rows={3}
              className="input resize-y"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Dokümanın kapsamı ve kazanımları hakkında 1–2 cümlelik özet…"
            />
          </div>

          <div>
            <label htmlFor="res-body" className="label">
              {target === 'lesson' ? 'Konu Anlatımı İçeriği (## başlık, - madde destekli)' : 'Önizleme Metni / Örnek İçerik'}
            </label>
            <textarea
              id="res-body"
              rows={3}
              className="input resize-y"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Önizleme penceresinde gösterilecek konu özeti, formüller veya örnek sorular…"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full sm:max-w-md">
            <label htmlFor="res-tags" className="label">
              Etiketler (virgülle ayırın)
            </label>
            <input
              id="res-tags"
              className="input"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="Örn: tyt, matematik, özet föy"
            />
          </div>

          <Button type="submit" variant="sun" loading={busy} disabled={uploading} icon={<Plus className="size-4" aria-hidden />}>
            İçeriği Yayınla
          </Button>
        </div>

        {error && <Alert tone="error">{error}</Alert>}
        {success && (
          <Alert tone="success" className="flex flex-wrap items-center justify-between gap-2">
            <span>{success.text}</span>
            {success.href && (
              <Link to={success.href} className="inline-flex items-center gap-1 font-bold underline">
                {success.linkLabel} <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            )}
          </Alert>
        )}
      </form>

      {/* Kayıtlı Materyaller Listesi */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-extrabold text-ink">
            Yayınlanan Dokümanlar ve Dersler ({visibleResources.length + visibleLessons.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <Chip active={listFilter === 'all'} onClick={() => setListFilter('all')}>
              Tümü
            </Chip>
            {TARGET_OPTIONS.map((opt) => (
              <Chip key={opt.value} active={listFilter === opt.value} onClick={() => setListFilter(opt.value)}>
                {opt.value === 'lesson' ? 'Konu Anlatımları' : opt.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="card divide-y divide-line overflow-hidden">
          {resources.loading || lessons.loading ? (
            <>
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </>
          ) : resources.error || lessons.error ? (
            <div className="p-5">
              <ErrorState
                message={resources.error ?? lessons.error ?? 'İçerikler yüklenemedi.'}
                onRetry={() => {
                  resources.reload()
                  lessons.reload()
                }}
              />
            </div>
          ) : visibleResources.length === 0 && visibleLessons.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<FileText className="size-6" />} title="Bu kategoride kayıtlı içerik yok" />
            </div>
          ) : (
            <>
              {visibleResources.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-paper/60">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="brand">{resourceModuleLabels[r.module]}</Badge>
                      <Badge tone="ink">{r.format}</Badge>
                      <Badge tone="neutral">{r.grade}</Badge>
                      {r.file_url && <Badge tone="success">Dosya Ekli</Badge>}
                    </div>
                    <p className="mt-1.5 truncate font-semibold text-ink">{r.title}</p>
                    <p className="text-xs text-muted">
                      {r.category?.name ?? 'Genel'} · {r.unit} · {r.file_size} · {formatDate(r.published_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      to={`/${r.module}`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-line-strong bg-white px-2.5 text-xs font-bold text-ink hover:border-ink"
                    >
                      Modülde Gör <ExternalLink className="size-3" aria-hidden />
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleDeleteResource(r.id, r.title)}
                      aria-label={`${r.title} sil`}
                      className="h-8 px-2 text-danger hover:bg-danger-soft"
                      icon={<Trash2 className="size-4" />}
                    >
                      <span className="sr-only">Sil</span>
                    </Button>
                  </div>
                </div>
              ))}

              {visibleLessons.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-paper/60">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="sun">{contentTypeLabels[c.type]}</Badge>
                      {c.grade && <Badge tone="neutral">{c.grade}</Badge>}
                    </div>
                    <Link to={`/dersler/${c.slug}`} className="mt-1.5 block truncate font-semibold text-ink hover:text-brand">
                      {c.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {c.category?.name ?? 'Genel'} · {c.author?.full_name ?? '—'} · {formatDate(c.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      to={`/dersler/${c.slug}`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-line-strong bg-white px-2.5 text-xs font-bold text-ink hover:border-ink"
                    >
                      Görüntüle <ExternalLink className="size-3" aria-hidden />
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleDeleteLesson(c.id, c.title)}
                      aria-label={`${c.title} sil`}
                      className="h-8 px-2 text-danger hover:bg-danger-soft"
                      icon={<Trash2 className="size-4" />}
                    >
                      <span className="sr-only">Sil</span>
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
