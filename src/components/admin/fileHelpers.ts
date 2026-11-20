import type { DocumentFormat } from '../../types'

/** Bir dosyayı boyut kontrolüyle Data URL olarak okur (Demo Modu) */
export function readFileAsDataUrl(file: File, maxBytes = 1_500_000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      const mb = (maxBytes / (1024 * 1024)).toFixed(1)
      reject(
        new Error(
          `Dosya boyutu Demo Modu sınırını (${mb} MB) aşıyor. Daha küçük bir dosya seçin veya harici dosya linki (URL) girin.`,
        ),
      )
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Dosya okunamadı.'))
    }
    reader.onerror = () => reject(new Error('Dosya okunurken bir hata oluştu.'))
    reader.readAsDataURL(file)
  })
}

function renderImageToCanvas(file: File, maxW: number, maxH: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Lütfen geçerli bir görsel dosyası (PNG, JPG, WebP) seçin.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Görsel okunamadı.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Görsel işlenemedi.'))
      img.onload = () => {
        const scale = Math.min(maxW / img.width, maxH / img.height, 1)
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Tarayıcı görsel sıkıştırmayı desteklemiyor.'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas)
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Yüklenen görseli canvas ile en fazla 1200px boyutuna küçültüp WebP File nesnesine
 * sıkıştırır (Cloudflare R2 yüklemeleri ve Demo Modu öncesi standart optimizasyon).
 */
export async function compressImageToWebPFile(
  file: File,
  maxDimension = 1200,
  quality = 0.84,
): Promise<File> {
  const canvas = await renderImageToCanvas(file, maxDimension, maxDimension)
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'gorsel'

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (webpBlob) => {
        if (webpBlob && webpBlob.type === 'image/webp') {
          resolve(webpBlob)
          return
        }
        canvas.toBlob(
          (jpgBlob) => {
            if (jpgBlob) resolve(jpgBlob)
            else reject(new Error('Görsel sıkıştırılamadı.'))
          },
          'image/jpeg',
          quality,
        )
      },
      'image/webp',
      quality,
    )
  })

  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  return new File([blob], `${baseName}.${ext}`, {
    type: blob.type || 'image/webp',
    lastModified: Date.now(),
  })
}

/**
 * Yüklenen görseli canvas ile en fazla 1200px WebP olarak sıkıştırıp
 * Demo Modu (localStorage) için Data URL'ye dönüştürür.
 */
export async function compressImageToDataUrl(file: File, maxW = 1200, maxH = 1200): Promise<string> {
  const canvas = await renderImageToCanvas(file, maxW, maxH)
  const webp = canvas.toDataURL('image/webp', 0.84)
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.84)
}

/** Dosya uzantısından doküman formatını algılar */
export function detectDocumentFormat(filename: string): DocumentFormat {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return 'PPTX'
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'DOCX'
  return 'PDF'
}
