import type { Difficulty, Role, ContentType } from '../types'

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

export const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())
