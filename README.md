# Bi Ders! (`biders`)

Ücretsiz, modern ve mobil öncelikli Türkçe eğitim portalı.  
**Teknoloji yığını:** React + Vite + TypeScript + Tailwind CSS v4 + Supabase (Auth, PostgreSQL, Storage).

## Hızlı Başlangıç (Demo Modu)

Supabase anahtarı tanımlamadan hemen çalıştırabilirsiniz:

```bash
npm install
npm run dev
```

`VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` boş olduğunda uygulama otomatik olarak **Demo Modu**'na geçer:
- Tüm veriler `src/data/mockData.ts` dosyasından okunur.
- Giriş ekranında tek tıkla **Demo Öğrenci** (`/profil`) veya **Demo Öğretmen/Admin** (`/admin`) oturumu açabilirsiniz.

## Supabase Kurulumu

1. `.env.example` dosyasını `.env` olarak kopyalayın ve Supabase proje bilgilerinizi girin:
   ```bash
   cp .env.example .env
   ```
2. Supabase Dashboard → **SQL Editor** ekranında `supabase/schema.sql` dosyasının tamamını çalıştırın (tüm tablolar, tetikleyiciler, RPC fonksiyonları, Storage bucket'ları ve RLS politikaları kurulur).
3. Supabase Dashboard → **Authentication → URL Configuration**:
   - **Site URL:** `https://bi-ders.github.io` (veya özel alan adınız)
   - **Redirect URLs:** `https://bi-ders.github.io/auth/callback`, `https://bi-ders.github.io/sifre-yenile`, `http://localhost:5173/auth/callback`
4. Google ile giriş için **Authentication → Providers → Google** ayarlarını etkinleştirin.

## Yayınlama (GitHub Pages & Cloudflare Pages)

- **GitHub Pages:** `.github/workflows/deploy.yml` ile `main` dalına her push sonrası otomatik yayınlanır. Alt sayfaların yenilendiğinde 404 vermemesi için `public/404.html` + `index.html` SPA yönlendirme betiği (`rafgraph/spa-github-pages`) hazırdır.
- **Cloudflare Pages:** Derleme komutu `npm run build`, çıktı dizini `dist`. Alt sayfa yönlendirmesi için `public/_redirects` (`/* /index.html 200`) dahildir.

## Özelleştirme

Proje adı, logo, iletişim bilgileri, sosyal medya linkleri ve menü öğeleri tek bir dosyadan yönetilir: `src/config/site.ts`.