/**
 * Bi Ders! — Cloudflare R2 Dosya Yükleme & Silme Worker'ı
 * ------------------------------------------------------------
 * Endpoint'ler:
 *   POST   /upload  (multipart/form-data: file, folder?)
 *   DELETE /delete  (JSON: { key?: string, url?: string } veya query ?key=... / ?url=...)
 *
 * Güvenlik:
 *   - Authorization: Bearer <supabase_access_token> zorunludur.
 *   - Token SUPABASE_URL + SUPABASE_ANON_KEY ile doğrulanır.
 *   - profiles tablosundaki rol 'teacher' veya 'admin' değilse 403 döner.
 *   - Yalnızca izinli dosya türleri (webp, png, jpg, pdf, pptx, docx, zip) ve en fazla 25 MB kabul edilir.
 *   - Ücretsiz 10 GB R2 kotasını aşmamak için toplam bucket boyutu ~8 GB ile sınırlandırılır.
 */

export interface Env {
  BUCKET: R2Bucket
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  PUBLIC_CDN_URL?: string
  /** Toplam bucket boyut sınırı (bayt). Varsayılan: 8_000_000_000 (~8 GB) */
  MAX_BUCKET_SIZE_BYTES?: string
  /** İsteğe bağlı virgülle ayrılmış ek izinli CORS origin'leri */
  EXTRA_ALLOWED_ORIGINS?: string
}

const DEFAULT_CDN_URL = 'https://cdn.biders.org'
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB
const MAX_REQUEST_CONTENT_LENGTH = MAX_FILE_SIZE_BYTES + 1024 * 1024 // 26 MB (multipart üstbilgi payı)
const DEFAULT_MAX_BUCKET_SIZE_BYTES = 8 * 1000 * 1000 * 1000 // 8 GB (10 GB ücretsiz kota için güvenlik tamponu)
const MAX_BUCKET_LIST_PAGES = 200
const DEFAULT_ALLOWED_ORIGINS = ['https://biders.org', 'http://localhost:5173']

type AllowedFileSpec = {
  ext: 'webp' | 'png' | 'jpg' | 'pdf' | 'pptx' | 'docx' | 'zip'
  contentType: string
  acceptedMimes: ReadonlySet<string>
}

const ALLOWED_BY_EXT: Record<string, AllowedFileSpec> = {
  webp: {
    ext: 'webp',
    contentType: 'image/webp',
    acceptedMimes: new Set(['image/webp']),
  },
  png: {
    ext: 'png',
    contentType: 'image/png',
    acceptedMimes: new Set(['image/png']),
  },
  jpg: {
    ext: 'jpg',
    contentType: 'image/jpeg',
    acceptedMimes: new Set(['image/jpeg', 'image/jpg']),
  },
  jpeg: {
    ext: 'jpg',
    contentType: 'image/jpeg',
    acceptedMimes: new Set(['image/jpeg', 'image/jpg']),
  },
  pdf: {
    ext: 'pdf',
    contentType: 'application/pdf',
    acceptedMimes: new Set(['application/pdf']),
  },
  pptx: {
    ext: 'pptx',
    contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    acceptedMimes: new Set([
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/octet-stream',
    ]),
  },
  docx: {
    ext: 'docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    acceptedMimes: new Set([
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream',
    ]),
  },
  zip: {
    ext: 'zip',
    contentType: 'application/zip',
    acceptedMimes: new Set([
      'application/zip',
      'application/x-zip-compressed',
      'multipart/x-zip',
      'application/octet-stream',
    ]),
  },
}

function getAllowedOrigins(env: Env): Set<string> {
  const origins = new Set(DEFAULT_ALLOWED_ORIGINS)
  if (env.EXTRA_ALLOWED_ORIGINS) {
    for (const raw of env.EXTRA_ALLOWED_ORIGINS.split(',')) {
      const cleaned = raw.trim().replace(/\/$/, '')
      if (cleaned) origins.add(cleaned)
    }
  }
  return origins
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin')?.replace(/\/$/, '') ?? ''
  const allowed = getAllowedOrigins(env)
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
  if (origin && allowed.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  request: Request,
  env: Env,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request, env),
    },
  })
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  const token = match?.[1]?.trim()
  return token ? token : null
}

type AuthCheckResult =
  | { ok: true; userId: string; role: 'teacher' | 'admin' }
  | { ok: false; status: number; message: string }

/**
 * Supabase JWT token'ını SUPABASE_URL + SUPABASE_ANON_KEY ile doğrular ve
 * profiles tablosundaki rolün 'teacher' veya 'admin' olduğunu kontrol eder.
 */
async function verifyStaffAuth(request: Request, env: Env): Promise<AuthCheckResult> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return {
      ok: false,
      status: 500,
      message: 'Worker yapılandırması eksik (SUPABASE_URL / SUPABASE_ANON_KEY).',
    }
  }

  const token = extractBearerToken(request)
  if (!token) {
    return { ok: false, status: 401, message: 'Yetkilendirme başlığı (Bearer token) gerekli.' }
  }

  const supabaseBase = env.SUPABASE_URL.replace(/\/$/, '')

  // 1. Supabase Auth ile kullanıcıyı doğrula
  const userRes = await fetch(`${supabaseBase}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  })

  if (!userRes.ok) {
    return { ok: false, status: 401, message: 'Geçersiz veya süresi dolmuş oturum.' }
  }

  const userPayload = (await userRes.json()) as { id?: string }
  const userId = userPayload.id
  if (!userId) {
    return { ok: false, status: 401, message: 'Kullanıcı kimliği doğrulanamadı.' }
  }

  // 2. profiles tablosundan kullanıcı rolünü kontrol et
  const profileUrl = `${supabaseBase}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role&limit=1`
  const profileRes = await fetch(profileUrl, {
    method: 'GET',
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  if (!profileRes.ok) {
    return { ok: false, status: 403, message: 'Kullanıcı rolü doğrulanamadı.' }
  }

  const rows = (await profileRes.json()) as Array<{ role?: string }>
  const role = rows[0]?.role

  if (role !== 'teacher' && role !== 'admin') {
    return {
      ok: false,
      status: 403,
      message: 'Bu işlem için öğretmen veya yönetici yetkisi gereklidir.',
    }
  }

  return { ok: true, userId, role }
}

function slugifySegment(raw: string, maxLen = 40): string {
  const trMap: Record<string, string> = {
    ç: 'c',
    Ç: 'c',
    ğ: 'g',
    Ğ: 'g',
    ı: 'i',
    İ: 'i',
    ö: 'o',
    Ö: 'o',
    ş: 's',
    Ş: 's',
    ü: 'u',
    Ü: 'u',
  }
  return raw
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => trMap[c] ?? c)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen)
}

function sanitizeFolder(raw: string | File | null): string {
  if (typeof raw !== 'string') return 'uploads'
  const cleaned = slugifySegment(raw, 32)
  return cleaned || 'uploads'
}

function randomToken(bytes = 6): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  if (idx < 0 || idx === filename.length - 1) return ''
  return filename.slice(idx + 1).toLowerCase()
}

/** İlk baytlardan temel dosya imza doğrulaması (magic bytes) */
function hasValidSignature(ext: AllowedFileSpec['ext'], bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false
  switch (ext) {
    case 'png':
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    case 'jpg':
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    case 'webp':
      return (
        bytes.length >= 12 &&
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      )
    case 'pdf':
      return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
    case 'pptx':
    case 'docx':
    case 'zip':
      // ZIP / OOXML arşiv imzası (PK\x03\x04, PK\x05\x06 veya PK\x07\x08)
      return bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)
  }
}

function buildObjectKey(folder: string, filename: string, ext: AllowedFileSpec['ext']): string {
  const now = new Date()
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const stemRaw = filename.replace(/\.[^.]+$/, '')
  const stem = slugifySegment(stemRaw, 36) || 'dosya'
  const rand = randomToken(5)
  return `${folder}/${ym}/${stem}-${rand}.${ext}`
}

function extractKeyFromInput(rawKey: string | undefined, rawUrl: string | undefined, cdnBase: string): string | null {
  let candidate = (rawKey ?? '').trim()

  if (!candidate && rawUrl) {
    const trimmedUrl = rawUrl.trim()
    try {
      const parsed = new URL(trimmedUrl)
      const cdnParsed = new URL(cdnBase)
      if (parsed.origin !== cdnParsed.origin) return null
      candidate = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
    } catch {
      return null
    }
  }

  candidate = candidate.replace(/^\/+/, '')
  if (!candidate || candidate.includes('..') || candidate.includes('\\') || candidate.length > 300) {
    return null
  }
  // Yalnızca klasor/yil-ay/dosya.uzanti biçimindeki güvenli anahtarlara izin ver
  if (!/^[a-z0-9-]+\/\d{4}-\d{2}\/[a-z0-9._-]+$/i.test(candidate)) {
    return null
  }
  return candidate
}

function getMaxBucketSizeBytes(env: Env): number {
  if (!env.MAX_BUCKET_SIZE_BYTES) return DEFAULT_MAX_BUCKET_SIZE_BYTES
  const parsed = Number(env.MAX_BUCKET_SIZE_BYTES)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_BUCKET_SIZE_BYTES
  return Math.floor(parsed)
}

/**
 * Ücretsiz 10 GB R2 kotasını aşmamak için bucket içindeki tüm nesnelerin
 * toplam boyutunu hesaplar ve yeni dosya eklendiğinde ~8 GB sınırının
 * geçilip geçilmediğini kontrol eder.
 */
async function checkBucketQuota(
  bucket: R2Bucket,
  incomingBytes: number,
  maxBucketBytes: number,
): Promise<{ allowed: boolean; usedBytes: number; pageLimitHit: boolean }> {
  let usedBytes = 0
  let cursor: string | undefined

  for (let page = 0; page < MAX_BUCKET_LIST_PAGES; page++) {
    const listed = await bucket.list({ cursor, limit: 1000 })
    for (const obj of listed.objects) {
      usedBytes += obj.size
      if (usedBytes + incomingBytes > maxBucketBytes) {
        return { allowed: false, usedBytes, pageLimitHit: false }
      }
    }
    if (!listed.truncated) {
      return { allowed: true, usedBytes, pageLimitHit: false }
    }
    cursor = listed.cursor
  }

  // Güvenli tarafta kal: çok fazla nesne nedeniyle tam boyut hesaplanamadıysa yüklemeyi durdur.
  return { allowed: false, usedBytes, pageLimitHit: true }
}

async function handleUpload(request: Request, env: Env, userId: string): Promise<Response> {
  const contentTypeHeader = request.headers.get('Content-Type') ?? ''
  if (!contentTypeHeader.toLowerCase().includes('multipart/form-data')) {
    return jsonResponse({ error: 'İstek multipart/form-data biçiminde olmalıdır.' }, 400, request, env)
  }

  const contentLengthRaw = request.headers.get('Content-Length')
  if (contentLengthRaw) {
    const contentLength = Number(contentLengthRaw)
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_CONTENT_LENGTH) {
      return jsonResponse({ error: 'Dosya boyutu en fazla 25 MB olabilir.' }, 413, request, env)
    }
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonResponse({ error: 'Form verisi çözümlenemedi.' }, 400, request, env)
  }

  const fileEntry = formData.get('file')
  if (!(fileEntry instanceof File)) {
    return jsonResponse({ error: 'Yüklenecek "file" alanı bulunamadı.' }, 400, request, env)
  }

  if (fileEntry.size === 0) {
    return jsonResponse({ error: 'Boş dosya yüklenemez.' }, 400, request, env)
  }

  if (fileEntry.size > MAX_FILE_SIZE_BYTES) {
    return jsonResponse({ error: 'Dosya boyutu en fazla 25 MB olabilir.' }, 413, request, env)
  }

  const rawExt = getFileExtension(fileEntry.name)
  const spec = ALLOWED_BY_EXT[rawExt]
  if (!spec) {
    return jsonResponse(
      { error: 'Desteklenmeyen dosya türü. İzinli uzantılar: webp, png, jpg, pdf, pptx, docx, zip.' },
      400,
      request,
      env,
    )
  }

  const declaredMime = fileEntry.type.toLowerCase().trim()
  if (declaredMime && !spec.acceptedMimes.has(declaredMime)) {
    return jsonResponse(
      { error: `Dosya MIME türü (${declaredMime}) uzantı (.${spec.ext}) ile uyuşmuyor.` },
      400,
      request,
      env,
    )
  }

  const buffer = await fileEntry.arrayBuffer()
  if (buffer.byteLength === 0) {
    return jsonResponse({ error: 'Boş dosya yüklenemez.' }, 400, request, env)
  }
  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    return jsonResponse({ error: 'Dosya boyutu en fazla 25 MB olabilir.' }, 413, request, env)
  }

  const head = new Uint8Array(buffer.slice(0, 16))
  if (!hasValidSignature(spec.ext, head)) {
    return jsonResponse(
      { error: 'Dosya içeriği bildirilen dosya formatıyla uyuşmuyor.' },
      400,
      request,
      env,
    )
  }

  const maxBucketBytes = getMaxBucketSizeBytes(env)
  const quota = await checkBucketQuota(env.BUCKET, buffer.byteLength, maxBucketBytes)
  if (!quota.allowed) {
    return jsonResponse(
      {
        error: quota.pageLimitHit
          ? 'Depolama kotası doğrulanamadı; güvenlik nedeniyle yükleme durduruldu.'
          : 'Depolama kotası sınırına (~8 GB) ulaşıldı. Ücretsiz 10 GB kotayı aşmamak için yeni yükleme durduruldu; eski dosyaları temizleyip tekrar deneyin.',
        usedBytes: quota.usedBytes,
        limitBytes: maxBucketBytes,
      },
      507,
      request,
      env,
    )
  }

  const folder = sanitizeFolder(formData.get('folder'))
  const key = buildObjectKey(folder, fileEntry.name, spec.ext)
  const cdnBase = (env.PUBLIC_CDN_URL ?? DEFAULT_CDN_URL).replace(/\/$/, '')
  const safeOriginalName = fileEntry.name.replace(/[\r\n\0]/g, '').slice(0, 180)

  await env.BUCKET.put(key, buffer, {
    httpMetadata: {
      contentType: spec.contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    },
    customMetadata: {
      uploadedBy: userId,
      originalName: safeOriginalName,
    },
  })

  return jsonResponse(
    {
      url: `${cdnBase}/${key}`,
      key,
      size: buffer.byteLength,
      contentType: spec.contentType,
      bucketUsedBytes: quota.usedBytes + buffer.byteLength,
      bucketLimitBytes: maxBucketBytes,
    },
    201,
    request,
    env,
  )
}

async function handleDelete(request: Request, env: Env): Promise<Response> {
  const cdnBase = (env.PUBLIC_CDN_URL ?? DEFAULT_CDN_URL).replace(/\/$/, '')
  const urlObj = new URL(request.url)

  let rawKey = urlObj.searchParams.get('key') ?? undefined
  let rawUrl = urlObj.searchParams.get('url') ?? undefined

  if (!rawKey && !rawUrl) {
    try {
      const body = (await request.json()) as { key?: string; url?: string }
      rawKey = body.key
      rawUrl = body.url
    } catch {
      /* boş veya JSON olmayan gövde */
    }
  }

  const key = extractKeyFromInput(rawKey, rawUrl, cdnBase)
  if (!key) {
    return jsonResponse({ error: 'Silinecek geçerli bir R2 dosya anahtarı (key) veya CDN URL gerekli.' }, 400, request, env)
  }

  await env.BUCKET.delete(key)

  return jsonResponse({ ok: true, key }, 200, request, env)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) })
    }

    const { pathname } = new URL(request.url)

    if (pathname !== '/upload' && pathname !== '/delete') {
      return jsonResponse({ error: 'Endpoint bulunamadı.' }, 404, request, env)
    }

    if (pathname === '/upload' && request.method !== 'POST') {
      return jsonResponse({ error: 'Yalnızca POST desteklenir.' }, 405, request, env)
    }

    if (pathname === '/delete' && request.method !== 'DELETE') {
      return jsonResponse({ error: 'Yalnızca DELETE desteklenir.' }, 405, request, env)
    }

    const auth = await verifyStaffAuth(request, env)
    if (!auth.ok) {
      return jsonResponse({ error: auth.message }, auth.status, request, env)
    }

    try {
      if (pathname === '/upload') {
        return await handleUpload(request, env, auth.userId)
      }
      return await handleDelete(request, env)
    } catch (err) {
      console.error('[biders-r2-upload] İşlem hatası:', err)
      return jsonResponse({ error: 'Dosya işlemi sırasında beklenmeyen bir sunucu hatası oluştu.' }, 500, request, env)
    }
  },
}
