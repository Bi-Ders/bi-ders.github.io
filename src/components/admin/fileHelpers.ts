import type { DocumentFormat } from '../../types'

/** Bir dosyayı boyut kontrolüyle Data URL olarak okur */
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

/**
 * Yüklenen kitap kapağı görselini canvas ile 480x640 (3:4) boyutuna sıkıştırıp
 * localStorage dostu küçük bir Data URL'ye dönüştürür.
 */
export function compressImageToDataUrl(file: File, maxW = 480, maxH = 640): Promise<string> {
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
        const webp = canvas.toDataURL('image/webp', 0.84)
        resolve(webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.84))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

/** Dosya uzantısından doküman formatını algılar */
export function detectDocumentFormat(filename: string): DocumentFormat {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return 'PPTX'
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'DOCX'
  return 'PDF'
}
