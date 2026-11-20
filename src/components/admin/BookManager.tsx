import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  BookMarked,
  ExternalLink,
  FileUp,
  ImagePlus,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { createBook, deleteBook, getBooks, updateBook } from '../../services/api'
import { useAsync } from '../../hooks'
import { detectPaymentProvider, formatPrice, isSafeHttpUrl } from '../../lib/utils'
import { compressImageToDataUrl, readFileAsDataUrl } from './fileHelpers'
import { BookCover } from '../books/BookCover'
import { Badge } from '../ui/Display'
import { Button } from '../ui/Button'
import { Alert, EmptyState, ErrorState, RowSkeleton } from '../ui/Feedback'
import type { Book, Category } from '../../types'

const PRESET_COVERS = [
  { label: 'Matematik', path: '/books/temel-matematik.webp' },
  { label: 'Edebiyat', path: '/books/calikusu.webp' },
  { label: 'Fizik', path: '/books/fizik-formul-defteri.webp' },
  { label: 'Kimya', path: '/books/kimya-soru-bankasi.webp' },
  { label: 'İngilizce', path: '/books/ydt-kelime-kartlari.webp' },
]

export function BookManager({
  categories,
  userId,
  onChanged,
}: {
  categories: Category[]
  userId: string
  onChanged: () => void
}) {
  const formTopRef = useRef<HTMLFormElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [author, setAuthor] = useState('')
  const [authorTitle, setAuthorTitle] = useState('')
  const [authorBio, setAuthorBio] = useState('')
  const [publisher, setPublisher] = useState('Bi Ders! Yayınları')
  const [grade, setGrade] = useState('TYT')
  const [price, setPrice] = useState('199')
  const [externalUrl, setExternalUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [uploadedPdfName, setUploadedPdfName] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState('240')
  const [publishedYear, setPublishedYear] = useState('2026')
  const [isbn, setIsbn] = useState('')
  const [description, setDescription] = useState('')
  const [highlightsRaw, setHighlightsRaw] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ text: string; slug?: string } | null>(null)

  const books = useAsync(() => getBooks(), [])

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setCategoryId(categories[0]?.id ?? '')
    setAuthor('')
    setAuthorTitle('')
    setAuthorBio('')
    setPublisher('Bi Ders! Yayınları')
    setGrade('TYT')
    setPrice('199')
    setExternalUrl('')
    setCoverUrl('')
    setFileUrl('')
    setUploadedPdfName(null)
    setPageCount('240')
    setPublishedYear('2026')
    setIsbn('')
    setDescription('')
    setHighlightsRaw('')
  }

  const startEdit = (book: Book) => {
    setError(null)
    setSuccess(null)
    setEditingId(book.id)
    setTitle(book.title)
    setCategoryId(book.category_id ?? '')
    setAuthor(book.author ?? '')
    setAuthorTitle(book.author_title ?? '')
    setAuthorBio(book.author_bio ?? '')
    setPublisher(book.publisher ?? '')
    setGrade(book.grade ?? '')
    setPrice(book.price != null ? String(book.price) : '0')
    setExternalUrl(book.external_url ?? '')
    setCoverUrl(book.cover_url ?? '')
    setFileUrl(book.file_url ?? '')
    setUploadedPdfName(book.file_url?.startsWith('data:') ? 'Yüklenmiş Örnek PDF' : null)
    setPageCount(book.page_count ? String(book.page_count) : '')
    setPublishedYear(book.published_year ? String(book.published_year) : '2026')
    setIsbn(book.isbn ?? '')
    setDescription(book.description ?? '')
    setHighlightsRaw((book.highlights ?? []).join('\n'))
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleCoverUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const compressed = await compressImageToDataUrl(file)
      setCoverUrl(compressed)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      e.target.value = ''
    }
  }

  const handlePdfUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const dataUrl = await readFileAsDataUrl(file, 1_500_000)
      setFileUrl(dataUrl)
      setUploadedPdfName(file.name)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (title.trim().length < 2) {
      setError('Kitap başlığı en az 2 karakter olmalıdır.')
      return
    }
    if (externalUrl.trim() && !isSafeHttpUrl(externalUrl)) {
      setError('Satın alma linki geçerli bir https:// adresi olmalıdır (Shopier / iyzico URL).')
      return
    }
    if (
      coverUrl.trim() &&
      !coverUrl.trim().startsWith('/') &&
      !coverUrl.trim().startsWith('data:image/') &&
      !isSafeHttpUrl(coverUrl)
    ) {
      setError('Kapak görseli için geçerli bir URL girin, görsel yükleyin veya otomatik kapak için boş bırakın.')
      return
    }
    if (
      fileUrl.trim() &&
      !fileUrl.trim().startsWith('/') &&
      !fileUrl.trim().startsWith('data:') &&
      !isSafeHttpUrl(fileUrl)
    ) {
      setError('Örnek PDF için geçerli bir URL girin veya dosya yükleyin.')
      return
    }

    const numericPrice = price.trim() === '' ? 0 : Number(price.replace(',', '.'))
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      setError('Fiyat 0 veya pozitif bir sayı olmalıdır.')
      return
    }

    const highlights = highlightsRaw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const payload = {
      title,
      category_id: categoryId || null,
      author,
      author_title: authorTitle,
      author_bio: authorBio,
      publisher,
      isbn,
      description,
      grade,
      price: numericPrice,
      cover_url: coverUrl.trim() || null,
      file_url: fileUrl.trim() || null,
      external_url: externalUrl.trim() || null,
      page_count: pageCount ? Number(pageCount) : null,
      published_year: publishedYear ? Number(publishedYear) : null,
      highlights,
    }

    setBusy(true)
    try {
      if (editingId) {
        const updated = await updateBook(editingId, payload)
        books.reload()
        onChanged()
        setSuccess({
          text: `"${updated.title}" kitabı güncellendi.`,
          slug: updated.slug,
        })
        resetForm()
      } else {
        const created = await createBook(payload, userId)
        books.reload()
        onChanged()
        setSuccess({
          text: `"${created.title}" kitabı mağazaya eklendi ve /kitaplar sayfasında yayında.`,
          slug: created.slug,
        })
        resetForm()
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (book: Book) => {
    setError(null)
    try {
      await deleteBook(book.id)
      if (editingId === book.id) resetForm()
      books.setData((prev) => prev?.filter((b) => b.id !== book.id) ?? prev)
      onChanged()
      setSuccess({ text: `"${book.title}" kitabı mağazadan kaldırıldı.` })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const previewCategory = categories.find((c) => c.id === categoryId) ?? null
  const previewPriceNum = price.trim() === '' ? 0 : Number(price.replace(',', '.'))
  const providerInfo = externalUrl.trim() ? detectPaymentProvider(externalUrl) : null

  return (
    <div className="space-y-8">
      <form ref={formTopRef} onSubmit={handleSubmit} className="card p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Kitap Mağazası (/kitaplar)</p>
            <h2 className="mt-1 text-xl font-extrabold text-ink">
              {editingId ? 'Kitap Bilgilerini Düzenle' : 'Yeni Kitap Ekle'}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Kapak görseli URL’si boş bırakılırsa sitenin temasına uyumlu otomatik kapak üretilir; dilersen bilgisayarından kapak görseli ve örnek PDF yükleyebilirsin.
            </p>
          </div>

          {editingId && (
            <Button variant="secondary" size="sm" onClick={resetForm} icon={<X className="size-4" />}>
              Düzenlemeyi İptal Et
            </Button>
          )}
        </div>

        <div className="mt-6 grid gap-7 lg:grid-cols-12">
          {/* Sol: Form Alanları */}
          <div className="space-y-4 lg:col-span-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="bk-title" className="label">
                  Kitap Başlığı *
                </label>
                <input
                  id="bk-title"
                  className="input"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: AYT Geometri Konu Anlatımı ve Soru Bankası"
                />
              </div>

              <div>
                <label htmlFor="bk-cat" className="label">
                  Ders / Kategori
                </label>
                <select
                  id="bk-cat"
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
                <label htmlFor="bk-grade" className="label">
                  Sınıf / Seviye
                </label>
                <input
                  id="bk-grade"
                  className="input"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="Örn: TYT, AYT, 10–11. Sınıf"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bk-author" className="label">
                  Yazar / Öğretmen Adı
                </label>
                <input
                  id="bk-author"
                  className="input"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Örn: Murat Demir"
                />
              </div>

              <div>
                <label htmlFor="bk-author-title" className="label">
                  Yazar Unvanı / Branşı
                </label>
                <input
                  id="bk-author-title"
                  className="input"
                  value={authorTitle}
                  onChange={(e) => setAuthorTitle(e.target.value)}
                  placeholder="Örn: Matematik Öğretmeni · Bi Ders! Ekibi"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bk-author-bio" className="label">
                Yazar / Öğretmen Hakkında (Kısa Bilgi)
              </label>
              <input
                id="bk-author-bio"
                className="input"
                value={authorBio}
                onChange={(e) => setAuthorBio(e.target.value)}
                placeholder="Detay sayfasındaki yazar kartında gösterilecek kısa biyografi…"
              />
            </div>

            {/* Fiyat & Harici Satın Alma Linki */}
            <div className="grid gap-4 rounded-2xl border border-line bg-paper/75 p-4 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <label htmlFor="bk-price" className="label">
                  Fiyat (₺)
                </label>
                <input
                  id="bk-price"
                  type="number"
                  min={0}
                  step="1"
                  className="input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0 = Ücretsiz"
                />
                <p className="mt-1 text-[11px] text-muted">0 bırakılırsa "Ücretsiz" görünür.</p>
              </div>

              <div className="sm:col-span-8">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="bk-buy-url" className="label">
                    Harici Satın Alma Linki (Shopier / iyzico URL)
                  </label>
                  {providerInfo && (
                    <Badge tone="success">
                      <ShieldCheck className="size-3" aria-hidden /> {providerInfo.label}
                    </Badge>
                  )}
                </div>
                <input
                  id="bk-buy-url"
                  type="url"
                  className="input"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://www.shopier.com/... veya https://iyzi.link/..."
                />
              </div>
            </div>

            {/* Kapak Görseli + Örnek PDF */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-paper/75 p-4">
                <label htmlFor="bk-cover" className="label">
                  Kapak Görseli (URL veya Yükle)
                </label>
                <input
                  id="bk-cover"
                  className="input text-sm"
                  value={coverUrl.startsWith('data:image/') ? '' : coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="Boş bırak = Otomatik Kapak"
                />
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 py-1.5 text-xs font-bold text-ink hover:border-ink">
                    <ImagePlus className="size-3.5 text-brand" aria-hidden />
                    <span>Görsel Yükle</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleCoverUpload} />
                  </label>
                  {coverUrl && (
                    <button
                      type="button"
                      onClick={() => setCoverUrl('')}
                      className="rounded-lg px-2 py-1 text-xs font-bold text-muted hover:bg-white hover:text-ink"
                    >
                      Otomatik Kapağa Dön
                    </button>
                  )}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {PRESET_COVERS.map((preset) => (
                    <button
                      key={preset.path}
                      type="button"
                      onClick={() => setCoverUrl(preset.path)}
                      className="rounded-md border border-line bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-soft hover:border-ink hover:text-ink"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-paper/75 p-4">
                <label htmlFor="bk-pdf" className="label">
                  Örnek Sayfa PDF (URL veya Yükle)
                </label>
                <input
                  id="bk-pdf"
                  className="input text-sm"
                  value={fileUrl.startsWith('data:') ? '' : fileUrl}
                  onChange={(e) => {
                    setFileUrl(e.target.value)
                    setUploadedPdfName(null)
                  }}
                  placeholder="/books/samples/...pdf veya https://..."
                />
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 py-1.5 text-xs font-bold text-ink hover:border-ink">
                    <FileUp className="size-3.5 text-brand" aria-hidden />
                    <span>PDF Yükle</span>
                    <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={handlePdfUpload} />
                  </label>
                  {uploadedPdfName && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-1 text-[11px] font-bold text-success">
                      {uploadedPdfName}
                      <button
                        type="button"
                        onClick={() => {
                          setFileUrl('')
                          setUploadedPdfName(null)
                        }}
                        aria-label="Yüklenen PDF'i kaldır"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  Boş bırakılsa bile detay sayfasında otomatik örnek sayfa okuyucu oluşturulur.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label htmlFor="bk-pub" className="label">
                  Yayınevi
                </label>
                <input
                  id="bk-pub"
                  className="input"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="Bi Ders! Yayınları"
                />
              </div>
              <div>
                <label htmlFor="bk-pages" className="label">
                  Sayfa
                </label>
                <input
                  id="bk-pages"
                  type="number"
                  min={1}
                  className="input"
                  value={pageCount}
                  onChange={(e) => setPageCount(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="bk-year" className="label">
                  Yıl
                </label>
                <input
                  id="bk-year"
                  type="number"
                  min={1800}
                  max={2100}
                  className="input"
                  value={publishedYear}
                  onChange={(e) => setPublishedYear(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bk-desc" className="label">
                  Kitap Açıklaması
                </label>
                <textarea
                  id="bk-desc"
                  rows={3}
                  className="input resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kitabın hedef kitlesini, ünite yapısını ve öne çıkan yönlerini yazın…"
                />
              </div>

              <div>
                <label htmlFor="bk-hl" className="label">
                  Öne Çıkan Özellikler (Her satıra 1 madde)
                </label>
                <textarea
                  id="bk-hl"
                  rows={3}
                  className="input resize-y"
                  value={highlightsRaw}
                  onChange={(e) => setHighlightsRaw(e.target.value)}
                  placeholder={'Yeni müfredata %100 uyumlu\n300 çözümlü örnek soru\nQR kodlu ek online testler'}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bk-isbn" className="label">
                  ISBN (Opsiyonel)
                </label>
                <input
                  id="bk-isbn"
                  className="input"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-605-9124-00-0"
                />
              </div>
            </div>
          </div>

          {/* Sağ: Canlı Kapak ve Kart Önizlemesi */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 rounded-2xl border border-line bg-paper-deep/65 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="eyebrow flex items-center gap-1">
                  <Sparkles className="size-3.5" aria-hidden /> Canlı Kapak Önizleme
                </span>
                <Badge tone={coverUrl ? 'brand' : 'sun'}>
                  {coverUrl ? (coverUrl.startsWith('data:') ? 'Yüklenen Görsel' : 'Özel Görsel') : 'Otomatik Kapak'}
                </Badge>
              </div>

              <div className="mt-4 flex justify-center">
                <BookCover
                  book={{
                    title: title || 'Yeni Kitap Başlığı',
                    author: author || 'Bi Ders! Eğitim Ekibi',
                    grade: grade || 'TYT',
                    cover_url: coverUrl || null,
                    category: previewCategory,
                  }}
                  size="lg"
                />
              </div>

              <div className="mt-4 rounded-xl border border-line bg-white p-3.5 text-center">
                <p className="line-clamp-2 font-sans text-sm font-bold text-ink">
                  {title || 'Yeni Kitap Başlığı'}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">{author || 'Yazar adı'}</p>
                <div className="mt-2.5 flex items-center justify-center gap-2">
                  <Badge tone={!Number.isNaN(previewPriceNum) && previewPriceNum > 0 ? 'sun' : 'success'}>
                    {formatPrice(Number.isNaN(previewPriceNum) ? 0 : previewPriceNum)}
                  </Badge>
                  {providerInfo && (
                    <Badge tone="neutral">
                      <ShoppingBag className="size-3" aria-hidden /> {providerInfo.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert tone="error" className="mt-5">
            {error}
          </Alert>
        )}
        {success && (
          <Alert tone="success" className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <span>{success.text}</span>
            {success.slug && (
              <Link to={`/kitaplar/${success.slug}`} className="inline-flex items-center gap-1 font-bold underline">
                Kitap Detay Sayfasını Aç <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            )}
          </Alert>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2.5 border-t border-line pt-5">
          {editingId && (
            <Button variant="ghost" onClick={resetForm}>
              Vazgeç
            </Button>
          )}
          <Button
            type="submit"
            variant="sun"
            loading={busy}
            icon={editingId ? <Save className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          >
            {editingId ? 'Değişiklikleri Kaydet' : 'Kitabı Mağazaya Ekle'}
          </Button>
        </div>
      </form>

      {/* Kayıtlı Kitaplar Listesi */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-extrabold text-ink">
            Mağazadaki Kitaplar ({books.data?.length ?? 0})
          </h3>
          <Link to="/kitaplar" className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">
            Kitap Mağazası <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>

        <div className="card divide-y divide-line overflow-hidden">
          {books.loading ? (
            <>
              <RowSkeleton />
              <RowSkeleton />
            </>
          ) : books.error ? (
            <div className="p-5">
              <ErrorState message={books.error} onRetry={books.reload} />
            </div>
          ) : !books.data?.length ? (
            <div className="p-6">
              <EmptyState icon={<BookMarked className="size-6" />} title="Mağazada kitap bulunmuyor" />
            </div>
          ) : (
            books.data.map((b) => {
              const prov = b.external_url ? detectPaymentProvider(b.external_url) : null
              const isEditing = editingId === b.id
              return (
                <div
                  key={b.id}
                  className={`flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition ${
                    isEditing ? 'bg-sun-soft/45' : 'hover:bg-paper/60'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <BookCover book={b} size="xs" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={b.price && b.price > 0 ? 'sun' : 'success'}>{formatPrice(b.price)}</Badge>
                        {b.category && <Badge tone="brand">{b.category.name}</Badge>}
                        {prov && <Badge tone="neutral">{prov.label}</Badge>}
                        {b.file_url && <Badge tone="neutral">Örnek PDF</Badge>}
                      </div>
                      <Link
                        to={`/kitaplar/${b.slug}`}
                        className="mt-1 block truncate font-semibold text-ink hover:text-brand"
                      >
                        {b.title}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {b.author ?? '—'} · {b.publisher ?? 'Bi Ders!'} · {b.grade ?? 'Genel'}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <Link
                      to={`/kitaplar/${b.slug}`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-line-strong bg-white px-2.5 text-xs font-bold text-ink hover:border-ink"
                    >
                      Detay <ExternalLink className="size-3" aria-hidden />
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => startEdit(b)}
                      icon={<Pencil className="size-3.5" aria-hidden />}
                      className="h-8 px-2.5 text-xs"
                    >
                      Düzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleDelete(b)}
                      aria-label={`${b.title} sil`}
                      className="h-8 px-2 text-danger hover:bg-danger-soft"
                      icon={<Trash2 className="size-4" />}
                    >
                      <span className="sr-only">Sil</span>
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
