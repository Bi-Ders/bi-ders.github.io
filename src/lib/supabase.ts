import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

function isValidUrl(value: string) {
  try {
    const u = new URL(value)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * Supabase yalnızca URL ve anahtar geçerliyse yapılandırılmış sayılır.
 * Aksi halde uygulama çökmeden "Demo Modu"na geçer.
 */
export const isSupabaseConfigured = isValidUrl(url) && anonKey.length > 20
export const isDemoMode = !isSupabaseConfigured

let client: SupabaseClient | null = null

if (isSupabaseConfigured) {
  try {
    client = createClient(url, anonKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'biders-auth',
      },
    })
  } catch (err) {
    console.error('[Bi Ders!] Supabase istemcisi oluşturulamadı, Demo Modu kullanılacak.', err)
    client = null
  }
} else if (import.meta.env.DEV) {
  console.info(
    '%c[Bi Ders!] Demo Modu',
    'font-weight:bold;color:#2f55d4',
    '— VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY tanımlı değil. Veriler src/data/mockData.ts dosyasından okunuyor.',
  )
}

/** Supabase istemcisi; Demo Modu'nda `null` döner. */
export const supabase = client

/** OAuth ve e-posta bağlantılarının döneceği temel adres */
export function getSiteUrl() {
  const fromEnv = (import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${window.location.origin}${base}`
}
