import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookMarked,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Hash,
  Layers,
  Maximize2,
  Printer,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync, useLockBody, usePageMeta } from '../hooks'
import { getBookBySlug, getBooks, isFavorite, toggleFavorite } from '../services/api'
import { assetUrl, cn, detectPaymentProvider, formatPrice, slugify } from '../lib/utils'
import { BookCover } from '../components/books/BookCover'
import { Avatar, Badge, CategoryTag } from '../components/ui/Display'
import { Button, ButtonLink, buttonClass } from '../components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback'
import type { Book } from '../types'

type PreviewMode = 'pdf' | 'reader'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildBookSampleHtml(book: Book): string {
  const pages = book.sample_pages?.length
    ? book.sample_pages
    : [
        {
          pageNumber: 1,
          heading: `${book.title} — Tanıtım ve Örnek İçerik`,
          content: book.description ?? 'Bi Ders! Yayınları eğitim kaynağı örnek sayfası.',
          highlights: book.highlights,
        },
      ]

  const sections = pages
    .map(
      (p) => `
      <section class="page">
        <div class="meta">Örnek Sayfa · s. ${p.pageNumber}</div>
        <h2>${escapeHtml(p.heading)}</h2>
        <p>${escapeHtml(p.content).replace(/\n/g, '<br />')}</p>
        ${p.highlights?.length ? `<ul>${p.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>` : ''}
        ${p.tip ? `<div class="tip"><strong>Öğretmen Notu:</strong> ${escapeHtml(p.tip)}</div>` : ''}
      </section>`,
    )
    .join('')

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(book.title)} — Örnek Sayfalar</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #12204a; background: #faf7f0; max-width: 820px; margin: 28px auto; padding: 0 24px; line-height: 1.65; }
    header { background: #12204a; color: #faf7f0; padding: 22px 26px; border-radius: 16px; border-bottom: 5px solid #f5b82e; }
    header h1 { margin: 6px 0 4px; font-size: 24px; }
    .eyebrow { font-size: 11px; font-weight: 800; letter-spacing: .12em; color: #f5b82e; text-transform: uppercase; }
    .page { margin: 20px 0; padding: 22px; background: #fff; border: 1px solid #e5dfd0; border-radius: 14px; }
    .meta { font-size: 12px; font-weight: 700; color: #2f55d4; margin-bottom: 6px; }
    .tip { margin-top: 14px; padding: 12px 14px; background: #fdf0cc; border-radius: 10px; font-size: 14px; }
    ul { margin: 12px 0 0 20px; }
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">Bi Ders! · Örnek Sayfa Önizlemesi</div>
    <h1>${escapeHtml(book.title)}</h1>
    <div>${escapeHtml(book.author ?? 'Bi Ders! Yayınları')} · ${escapeHtml(book.publisher ?? 'Bi Ders! Yayınları')}</div>
  </header>
  ${sections}
</body>
</html>`
}

/** Data URL (base64 PDF) için güvenli Blob URL üretir; normal URL'yi doğrudan döner */
function useResolvedPdfUrl(rawUrl: string | null): string | null {
  const resolved = assetUrl(rawUrl)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const isDataPdf = Boolean(resolved && resolved.startsWith('data:'))

  useEffect(() => {
    if (!isDataPdf || !resolved) return
    let active = true
    let created: string | null = null
    fetch(resolved)
      .then((res) => res.blob())
      .then((blob) => {
        if (!active) return
        created = URL.createObjectURL(blob)
        setBlobUrl(created)
      })
      .catch(() => undefined)
    return () => {
      active = false
      if (created) URL.revokeObjectURL(created)
    }
  }, [isDataPdf, resolved])

  if (!resolved) return null
  return isDataPdf ? blobUrl : resolved
}

export function BookDetailPage() {
  const { slug = '' } = useParams()
  const { user, openAuth } = useAuth()

  const loaded = useAsync(() => getBookBySlug(slug), [slug])
  const related = useAsync(() => getBooks({ limit: 4 }), [])

  const book = loaded.data
  usePageMeta(book?.title ?? 'Kitap Detayı', book?.description ?? undefined)

  if (loaded.loading) {
    return (
      <div className="container-page py-12">
        <Skeleton className="h-5 w-32" />
        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <Skeleton className="aspect-[3/4] w-full max-w-[300px] rounded-2xl lg:col-span-4" />
          <div className="space-y-4 lg:col-span-8">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
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

  if (!book) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<BookMarked className="size-6" />}
          title="Kitap bulunamadı"
          description="Aradığın kitap kaldırılmış veya bağlantısı değişmiş olabilir."
          action={<ButtonLink to="/kitaplar">Kitap Mağazasına Dön</ButtonLink>}
        />
      </div>
    )
  }

  const otherBooks = (related.data ?? []).filter((b) => b.id !== book.id).slice(0, 3)

  return (
    <BookDetailContent
      key={book.id}
      book={book}
      otherBooks={otherBooks}
      userId={user?.id ?? null}
      onOpenLogin={() => openAuth('login')}
    />
  )
}

function BookDetailContent({
  book,
  otherBooks,
  userId,
  onOpenLogin,
}: {
  book: Book
  otherBooks: Book[]
  userId: string | null
  onOpenLogin: () => void
}) {
  const [fav, setFav] = useState(false)
  const [favBusy, setFavBusy] = useState(false)
  const pdfSrc = useResolvedPdfUrl(book.file_url)
  const hasPdf = Boolean(pdfSrc)
  const hasReaderPages = Boolean(book.sample_pages?.length)

  const [previewMode, setPreviewMode] = useState<PreviewMode>(book.file_url ? 'pdf' : 'reader')
  const [pageIdx, setPageIdx] = useState(0)
  const [pdfFullscreen, setPdfFullscreen] = useState(false)

  useEffect(() => {
    if (!userId) return
    let active = true
    isFavorite(userId, 'book', book.id)
      .then((res) => {
        if (active) setFav(res)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [userId, book.id])

  const handleFavorite = async () => {
    if (!userId) return onOpenLogin()
    setFavBusy(true)
    try {
      setFav(await toggleFavorite(userId, 'book', book.id))
    } finally {
      setFavBusy(false)
    }
  }

  const provider = useMemo(
    () => (book.external_url ? detectPaymentProvider(book.external_url) : null),
    [book.external_url],
  )

  const isFree = book.price == null || book.price <= 0
  const priceLabel = formatPrice(book.price)

  const fallbackSamplePages = useMemo(
    () =>
      book.sample_pages?.length
        ? book.sample_pages
        : [
            {
              pageNumber: 1,
              heading: `${book.title} — Kitap Özeti ve Kapsamı`,
              content:
                book.description ??
                'Bu eğitim kaynağı Bi Ders! öğretmenleri tarafından güncel müfredata uygun olarak hazırlanmıştır.',
              highlights: book.highlights,
              tip: book.author_bio ?? undefined,
            },
          ],
    [book],
  )

  const currentSample = fallbackSamplePages[Math.min(pageIdx, fallbackSamplePages.length - 1)]!

  const handleDownloadSample = () => {
    if (pdfSrc) {
      const a = document.createElement('a')
      a.href = pdfSrc
      a.download = `${slugify(book.title) || book.id}-ornek.pdf`
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      a.remove()
      return
    }
    const html = buildBookSampleHtml(book)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slugify(book.title) || book.id}-ornek.html`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handlePrintSample = () => {
    const html = buildBookSampleHtml(book)
    const win = window.open('', '_blank', 'width=880,height=720')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div>
      {/* Üst Mağaza Vitrini */}
      <section className="border-b border-line bg-paper-deep/55">
        <div className="container-page py-8 sm:py-12">
          <nav aria-label="Sayfa yolu" className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted">
            <Link to="/kitaplar" className="inline-flex items-center gap-1.5 hover:text-ink">
              <ArrowLeft className="size-4" aria-hidden /> Tüm Kitaplar
            </Link>
            {book.category && (
              <>
                <span aria-hidden>/</span>
                <Link to={`/kitaplar?kategori=${book.category.slug}`} className="hover:text-ink">
                  {book.category.name}
                </Link>
              </>
            )}
          </nav>

          <div className="mt-7 grid items-start gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Sol: Kapak Vitrini */}
            <div className="flex flex-col items-center lg:col-span-5">
              <div className="relative flex w-full flex-col items-center rounded-3xl border border-line bg-paper p-6 shadow-[var(--shadow-card)] sm:p-8">
                <BookCover book={book} size="xl" />

                <div className="mt-6 grid w-full grid-cols-2 gap-2.5 text-center sm:grid-cols-3">
                  {book.page_count && (
                    <div className="rounded-xl border border-line bg-card px-3 py-2">
                      <p className="text-[11px] font-semibold text-muted">Sayfa</p>
                      <p className="font-display text-sm font-extrabold text-ink">{book.page_count} sf.</p>
                    </div>
                  )}
                  {book.published_year && (
                    <div className="rounded-xl border border-line bg-card px-3 py-2">
                      <p className="text-[11px] font-semibold text-muted">Basım</p>
                      <p className="font-display text-sm font-extrabold text-ink">{book.published_year}</p>
                    </div>
                  )}
                  {book.grade && (
                    <div className="col-span-2 rounded-xl border border-line bg-card px-3 py-2 sm:col-span-1">
                      <p className="text-[11px] font-semibold text-muted">Seviye</p>
                      <p className="truncate font-display text-sm font-extrabold text-ink">{book.grade}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sağ: Başlık, Fiyat, Harici Satın Alma ve Açıklama */}
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2.5">
                {book.category && <CategoryTag name={book.category.name} color={book.category.color} />}
                {book.grade && <Badge tone="brand">{book.grade}</Badge>}
                {book.publisher && <Badge tone="neutral">{book.publisher}</Badge>}
              </div>

              <h1 className="mt-3 text-3xl leading-tight font-extrabold sm:text-4xl">{book.title}</h1>

              {book.author && (
                <p className="mt-2.5 text-base font-medium text-ink-soft">
                  Yazar / Hazırlayan: <strong className="font-bold text-ink">{book.author}</strong>
                </p>
              )}

              {/* Fiyat Etiketi & Harici Satın Alma Kartı */}
              <div className="card mt-6 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold tracking-wider text-muted uppercase">
                      {isFree ? 'Açık Kaynak Erişim' : 'Kitap Fiyatı'}
                    </p>
                    <div className="mt-1 flex items-baseline gap-2.5">
                      <span
                        className={cn(
                          'font-display text-3xl font-extrabold sm:text-4xl',
                          isFree ? 'text-success' : 'text-ink',
                        )}
                      >
                        {priceLabel}
                      </span>
                      {!isFree && <span className="text-xs font-semibold text-muted">KDV Dahil</span>}
                    </div>
                  </div>

                  {provider && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-soft px-3 py-1.5 text-xs font-bold text-success">
                      <ShieldCheck className="size-4" aria-hidden />
                      {provider.label} Güvencesi
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {book.external_url ? (
                    <a
                      href={book.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass('sun', 'lg', 'flex-1 sm:flex-initial')}
                    >
                      <ShoppingBag className="size-4" aria-hidden />
                      <span>Satın Al</span>
                      <ExternalLink className="size-4 opacity-80" aria-hidden />
                    </a>
                  ) : hasPdf ? (
                    <Button
                      variant="sun"
                      size="lg"
                      onClick={handleDownloadSample}
                      icon={<Download className="size-4" aria-hidden />}
                    >
                      Ücretsiz PDF İndir
                    </Button>
                  ) : null}

                  <a href="#ornek-pdf" className={buttonClass('secondary', 'lg')}>
                    <FileText className="size-4" aria-hidden />
                    <span>Örnek Sayfa Önizle</span>
                  </a>

                  <Button
                    variant={fav ? 'primary' : 'secondary'}
                    size="lg"
                    loading={favBusy}
                    onClick={handleFavorite}
                    icon={fav ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                    aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                  >
                    {fav ? 'Kaydedildi' : 'Kaydet'}
                  </Button>
                </div>

                {book.external_url && (
                  <p className="mt-3.5 flex items-center gap-1.5 text-xs text-muted">
                    <ShieldCheck className="size-3.5 shrink-0 text-success" aria-hidden />
                    <span>
                      "Satın Al" butonu güvenli {provider?.label ?? 'harici'} ödeme sayfasını yeni sekmede açar.
                    </span>
                  </p>
                )}
              </div>

              {/* Kitap Açıklaması */}
              {book.description && (
                <div className="mt-6">
                  <h2 className="text-lg font-extrabold text-ink">Kitap Hakkında</h2>
                  <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-ink-soft">{book.description}</p>
                </div>
              )}

              {/* Öne Çıkan Özellikler */}
              {book.highlights && book.highlights.length > 0 && (
                <div className="mt-6 rounded-2xl border border-line bg-card p-5">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-ink uppercase">
                    <Sparkles className="size-4 text-brand" aria-hidden /> Bu Kitapta Neler Var?
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {book.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Künye Bilgileri */}
              <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <MetaItem icon={<Building2 className="size-4" />} label="Yayınevi" value={book.publisher ?? 'Bi Ders! Yayınları'} />
                <MetaItem icon={<Layers className="size-4" />} label="Sayfa" value={book.page_count ? `${book.page_count} sayfa` : '—'} />
                <MetaItem icon={<Calendar className="size-4" />} label="Yayın Yılı" value={book.published_year ? String(book.published_year) : '—'} />
                <MetaItem icon={<Hash className="size-4" />} label="ISBN" value={book.isbn ?? 'Dijital / Özel'} />
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Yazar / Öğretmen Bilgisi */}
      <section className="container-page pt-10">
        <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={book.author ?? 'Bi Ders!'} size="lg" />
            <div>
              <p className="eyebrow">Yazar / Öğretmen Bilgisi</p>
              <h2 className="mt-1 text-xl font-extrabold text-ink">{book.author ?? 'Bi Ders! Eğitim Ekibi'}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge tone="brand">
                  <GraduationCap className="size-3.5" aria-hidden />
                  {book.author_title ?? `${book.category?.name ?? 'Eğitim'} İçerik Yazarı`}
                </Badge>
                {book.publisher && <Badge tone="neutral">{book.publisher}</Badge>}
              </div>
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted">
                {book.author_bio ??
                  'Bi Ders! içerik ekibi ve alan uzmanları tarafından güncel MEB ve ÖSYM kazanımları doğrultusunda hazırlanmıştır.'}
              </p>
            </div>
          </div>

          {book.category && (
            <div className="flex shrink-0 flex-wrap gap-2">
              <ButtonLink to={`/dersler?kategori=${book.category.slug}`} variant="secondary" size="sm">
                <BookOpen className="size-4" aria-hidden /> {book.category.name} Dersleri
              </ButtonLink>
              <ButtonLink to={`/kitaplar?kategori=${book.category.slug}`} variant="ghost" size="sm">
                Diğer Kitapları <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            </div>
          )}
        </div>
      </section>

      {/* Örnek Sayfa PDF Önizlemesi */}
      <section id="ornek-pdf" className="container-page scroll-mt-24 pt-10 pb-14">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-paper-deep/65 px-5 py-4 sm:px-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="ink">PDF</Badge>
                <span className="eyebrow">İçerikten Seçme Sayfalar</span>
              </div>
              <h2 className="mt-1 text-xl font-extrabold text-ink">Örnek Sayfa PDF Önizlemesi</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasPdf && (
                <div className="inline-flex rounded-xl border border-line-strong bg-card p-1" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewMode === 'pdf'}
                    onClick={() => setPreviewMode('pdf')}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-bold transition',
                      previewMode === 'pdf' ? 'bg-ink text-paper dark:bg-sun dark:text-[#12204a]' : 'text-ink-soft hover:text-ink',
                    )}
                  >
                    PDF Görüntüleyici
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewMode === 'reader'}
                    onClick={() => setPreviewMode('reader')}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-bold transition',
                      previewMode === 'reader' ? 'bg-ink text-paper dark:bg-sun dark:text-[#12204a]' : 'text-ink-soft hover:text-ink',
                    )}
                  >
                    Sayfa Okuyucu {hasReaderPages ? `(${fallbackSamplePages.length})` : ''}
                  </button>
                </div>
              )}

              {pdfSrc && (
                <>
                  <a
                    href={pdfSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass('secondary', 'sm')}
                  >
                    <ExternalLink className="size-4" aria-hidden />
                    <span className="hidden sm:inline">Yeni Sekmede Aç</span>
                  </a>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPdfFullscreen(true)}
                    icon={<Maximize2 className="size-4" aria-hidden />}
                  >
                    <span className="hidden sm:inline">Tam Ekran</span>
                  </Button>
                </>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadSample}
                icon={<Download className="size-4" aria-hidden />}
              >
                Örnek İndir
              </Button>
            </div>
          </div>

          {previewMode === 'pdf' && pdfSrc ? (
            <div className="bg-paper-deep/40">
              <div className="relative h-[560px] w-full sm:h-[680px]">
                <iframe
                  src={`${pdfSrc}#toolbar=1&navpanes=0&view=FitH`}
                  title={`${book.title} örnek sayfa PDF önizlemesi`}
                  className="size-full border-0 bg-white"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-card px-5 py-3 text-xs text-muted">
                <span>Tarayıcın dahili PDF önizlemeyi desteklemiyorsa "Sayfa Okuyucu" sekmesine geçebilir veya PDF’i yeni sekmede açabilirsin.</span>
                <button
                  type="button"
                  onClick={() => setPreviewMode('reader')}
                  className="font-bold text-brand hover:underline"
                >
                  Sayfa Okuyucuya Geç →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-paper-deep/40 p-5 sm:p-8">
              <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line-strong bg-paper shadow-[var(--shadow-card)]">
                {/* Kitap sayfası üst bandı */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-sun bg-[#12204a] px-6 py-4 text-[#f9f7f0] dark:bg-[#0d1838]">
                  <div>
                    <p className="text-[11px] font-bold tracking-widest text-sun uppercase">
                      {book.publisher ?? 'Bi Ders! Yayınları'} · Örnek Sayfa
                    </p>
                    <p className="font-display text-base font-extrabold text-white">{book.title}</p>
                  </div>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
                    Sayfa {currentSample.pageNumber}
                  </span>
                </div>

                {/* Sayfa gövdesi */}
                <div className="space-y-5 p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="brand">
                      Önizleme {pageIdx + 1} / {fallbackSamplePages.length}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={handlePrintSample} icon={<Printer className="size-4" />}>
                      Yazdır
                    </Button>
                  </div>

                  <h3 className="text-2xl font-extrabold text-ink">{currentSample.heading}</h3>
                  <p className="whitespace-pre-line text-[15px] leading-7 text-ink-soft">{currentSample.content}</p>

                  {currentSample.highlights && currentSample.highlights.length > 0 && (
                    <div className="rounded-xl border border-line bg-card p-5">
                      <ul className="space-y-2 text-sm text-ink-soft">
                        {currentSample.highlights.map((line) => (
                          <li key={line} className="flex items-start gap-2.5">
                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentSample.tip && (
                    <div className="rounded-xl border border-sun-dark/25 bg-sun-soft p-4 text-sm text-ink">
                      <strong className="block text-xs font-extrabold tracking-wider text-sun-dark uppercase">
                        Öğretmen Notu
                      </strong>
                      <p className="mt-1 leading-relaxed">{currentSample.tip}</p>
                    </div>
                  )}
                </div>

                {/* Sayfa çevirme alt çubuğu */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-card px-6 py-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pageIdx === 0}
                    onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
                    icon={<ChevronLeft className="size-4" />}
                  >
                    Önceki Sayfa
                  </Button>

                  <div className="flex flex-wrap gap-1.5">
                    {fallbackSamplePages.map((p, idx) => (
                      <button
                        key={p.pageNumber}
                        type="button"
                        onClick={() => setPageIdx(idx)}
                        className={cn(
                          'rounded-lg border px-2.5 py-1 text-xs font-bold transition',
                          idx === pageIdx
                            ? 'border-ink bg-ink text-paper dark:border-sun dark:bg-sun dark:text-[#12204a]'
                            : 'border-line-strong bg-paper text-ink-soft hover:border-ink',
                        )}
                      >
                        s. {p.pageNumber}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pageIdx >= fallbackSamplePages.length - 1}
                    onClick={() => setPageIdx((i) => Math.min(fallbackSamplePages.length - 1, i + 1))}
                  >
                    Sonraki Sayfa <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Diğer Kitaplar */}
        {otherBooks.length > 0 && (
          <div className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Mağazadan Öneriler</p>
                <h2 className="mt-1 text-2xl font-extrabold">Diğer kitap ve kaynaklar</h2>
              </div>
              <Link to="/kitaplar" className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
                Tüm kitaplar <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {otherBooks.map((item) => (
                <Link key={item.id} to={`/kitaplar/${item.slug}`} className="card card-hover flex gap-4 p-4">
                  <BookCover book={item} size="sm" />
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      {item.category && <CategoryTag name={item.category.name} color={item.category.color} />}
                      <h3 className="mt-1 line-clamp-2 font-sans text-base font-bold text-ink">{item.title}</h3>
                      {item.author && <p className="mt-0.5 truncate text-xs text-muted">{item.author}</p>}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Badge tone={item.price && item.price > 0 ? 'sun' : 'success'}>{formatPrice(item.price)}</Badge>
                      <span className="text-xs font-bold text-brand">İncele →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {pdfFullscreen && pdfSrc && (
        <FullscreenPdfModal title={book.title} pdfUrl={pdfSrc} onClose={() => setPdfFullscreen(false)} />
      )}
    </div>
  )
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-card px-3.5 py-2.5">
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <span className="text-brand" aria-hidden>
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-1 truncate font-semibold text-ink">{value}</dd>
    </div>
  )
}

function FullscreenPdfModal({ title, pdfUrl, onClose }: { title: string; pdfUrl: string; onClose: () => void }) {
  useLockBody(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#091129]/85 backdrop-blur-xs">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-card px-4 py-3 sm:px-6">
        <p className="truncate font-display text-base font-extrabold text-ink">{title} — Örnek Sayfa PDF</p>
        <div className="flex items-center gap-2">
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'sm')}>
            <ExternalLink className="size-4" aria-hidden /> Yeni Sekme
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tam ekranı kapat"
            className="grid size-9 place-items-center rounded-xl border border-line-strong bg-card text-ink hover:border-ink dark:hover:border-sun/60"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
      <iframe src={pdfUrl} title={`${title} tam ekran PDF`} className="flex-1 border-0 bg-white" />
    </div>
  )
}
