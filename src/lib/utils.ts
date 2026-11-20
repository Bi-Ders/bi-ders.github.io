import type { BookPaymentProvider, ContentType, Difficulty, ResourceModuleKey, Role } from '../types'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
const rtf = new Intl.RelativeTimeFormat('tr-TR', { numeric: 'auto' })

export function formatDate(value: string | null | undefined) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : dateFmt.format(d)
}

export function timeAgo(value: string | null | undefined) {
  if (!value) return ''
  const diff = (new Date(value).getTime() - Date.now()) / 1000
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit)
  }
  return 'az önce'
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat('tr-TR').format(n)
}

/** Türk Lirası biçimlendirme (0 veya boş ise Ücretsiz) */
export function formatPrice(price: number | null | undefined) {
  if (price == null || Number.isNaN(price) || price <= 0) return 'Ücretsiz'
  const hasDecimals = Math.round(price * 100) % 100 !== 0
  return `${new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(price)} ₺`
}

/** public/ altındaki varlıkları BASE_URL ile uyumlu hale getirir */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const trimmed = path.trim()
  if (!trimmed) return null
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed
  const base = import.meta.env.BASE_URL || '/'
  if (trimmed.startsWith('/')) {
    return `${base.replace(/\/$/, '')}${trimmed}`
  }
  return `${base.replace(/\/$/, '')}/${trimmed}`
}

/** Güvenli HTTP/HTTPS URL kontrolü */
export function isSafeHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim())
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

/** Harici ödeme linkinden sağlayıcı algılama (Shopier / iyzico / Diğer) */
export function detectPaymentProvider(url: string | null | undefined): { key: BookPaymentProvider; label: string } {
  if (!url) return { key: 'other', label: 'Harici Ödeme' }
  const lower = url.toLowerCase()
  if (lower.includes('shopier')) return { key: 'shopier', label: 'Shopier' }
  if (lower.includes('iyzi')) return { key: 'iyzico', label: 'iyzico' }
  return { key: 'other', label: 'Güvenli Ödeme' }
}

/** Bayt değerini okunabilir dosya boyutuna çevirir */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Türkçe karakterleri dönüştürerek URL dostu kısa ad üretir */
export function slugify(text: string) {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u' }
  return text
    .replace(/[çğıİöşü]/gi, (c) => map[c] ?? map[c.toLowerCase()] ?? c)
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Türkçe duyarlı, büyük/küçük harf ve aksan bağımsız arama eşleşmesi */
export function matches(haystack: Array<string | null | undefined>, needle: string) {
  const n = normalize(needle)
  if (!n) return true
  return haystack.some((h) => h && normalize(h).includes(n))
}

function normalize(s: string) {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function initials(name: string | null | undefined) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toLocaleUpperCase('tr-TR'))
    .join('')
}

export const roleLabels: Record<Role, string> = {
  student: 'Öğrenci',
  teacher: 'Öğretmen',
  admin: 'Yönetici',
}

export const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
}

export const contentTypeLabels: Record<ContentType, string> = {
  lesson: 'Konu Anlatımı',
  article: 'Makale',
  video: 'Video',
  document: 'Doküman',
}

export const resourceModuleLabels: Record<ResourceModuleKey, string> = {
  'ders-notlari': 'Ders Notları',
  sunular: 'Sunular',
  yazililar: 'Yazılılar',
  sinavlar: 'Sınavlar',
  evraklar: 'Evraklar',
}

export const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())
