# Bi Ders! — Cloudflare R2 Upload Worker

Bu klasör, Supabase Storage yerine **Cloudflare R2** üzerine güvenli dosya yükleme (`POST /upload`) ve silme (`DELETE /delete`) işlemleri yapan Cloudflare Worker'ı içerir.

## Özellikler
- R2 binding adı: `BUCKET`
- `Authorization: Bearer <token>` başlığındaki Supabase JWT'yi doğrular ve `profiles.role` değerinin `teacher` veya `admin` olmasını şart koşar (aksi halde `403`).
- İzinli türler: `webp`, `png`, `jpg`, `pdf`, `pptx`, `docx`, `zip` (en fazla **25 MB**, uzantı + MIME + magic byte kontrolü).
- R2 dosya yolu: `<klasor>/<yil-ay>/<rastgele-slug>.<uzanti>`
- Yanıt: `{ "url": "https://cdn.biders.org/...", "key": "...", "size": ..., "contentType": "..." }`
- CORS: `https://biders.org` ve `http://localhost:5173`

## Kurulum ve Yayınlama

```bash
cd workers/r2-upload
npm install

# 1. R2 bucket'ı oluşturun (Cloudflare panelinde cdn.biders.org özel alan adını bağlayın)
npx wrangler r2 bucket create biders-files

# 2. Supabase secret değerlerini tanımlayın
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY

# 3. Yayınlayın
npm run deploy
```

Yayınladıktan sonra frontend `.env` dosyasında Worker adresini tanımlayın:

```env
VITE_UPLOAD_API_URL=https://upload.biders.org
```
