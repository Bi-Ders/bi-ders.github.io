# Bi Ders! — Cloudflare R2 Upload Worker

Bu klasör, Supabase Storage yerine **Cloudflare R2** üzerine güvenli dosya yükleme (`POST /upload`) ve silme (`DELETE /delete`) işlemleri yapan Cloudflare Worker'ı içerir.

## Özellikler
- R2 binding adı: `BUCKET` (`biders-media`)
- `Authorization: Bearer <token>` başlığındaki Supabase JWT'yi doğrular ve `profiles.role` değerinin `teacher` veya `admin` olmasını şart koşar (aksi halde `403`).
- İzinli türler: `webp`, `png`, `jpg`, `pdf`, `pptx`, `docx`, `zip` (en fazla **25 MB**, uzantı + MIME + magic byte kontrolü).
- Toplam bucket boyut güvenliği: ücretsiz 10 GB R2 kotasını aşmamak için yükleme öncesi toplam boyut **~8 GB** (`MAX_BUCKET_SIZE_BYTES=8000000000`) ile sınırlandırılır; sınır aşılırsa `507 Insufficient Storage` döner.
- R2 dosya yolu: `<klasor>/<yil-ay>/<rastgele-slug>.<uzanti>`
- Yanıt: `{ "url": "https://cdn.biders.org/...", "key": "...", "size": ..., "contentType": "...", "bucketUsedBytes": ..., "bucketLimitBytes": ... }`
- CORS: `https://biders.org`, `https://www.biders.org`, `https://bi-ders.github.io` ve `http://localhost:5173`

## Kurulum ve Yayınlama

```bash
cd workers/r2-upload
npm install

# 1. R2 bucket'ı oluşturun (Cloudflare panelinde cdn.biders.org özel alan adını bağlayın)
npx wrangler r2 bucket create biders-media

# 2. Supabase secret değerlerini tanımlayın (KESİNLİKLE service_role kullanmayın, sadece anon key)
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY

# 3. Yayınlayın
npm run deploy
```

R2 bucket (`biders-media`) CORS kuralı:

```json
[
  {
    "AllowedOrigins": [
      "https://biders.org",
      "https://www.biders.org",
      "https://bi-ders.github.io",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 86400
  }
]
```

Yayınladıktan sonra frontend ortam değişkenlerinde Worker adresini tanımlayın:

```env
VITE_UPLOAD_API_URL=https://upload.biders.org
```
