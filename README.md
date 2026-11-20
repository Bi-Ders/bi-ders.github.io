# Bi Ders! (`biders`)

> **Öğrenmenin en kısa yolu: bi ders!**  
> Açık kaynak, ücretsiz, reklamsız ve **PWA** destekli mobil öncelikli eğitim platformu.

🌐 **Canlı Demo:** [https://bi-ders.github.io/](https://bi-ders.github.io/)  
📦 **GitHub Deposu:** [https://github.com/Bi-Ders/bi-ders.github.io](https://github.com/Bi-Ders/bi-ders.github.io)  
📄 **Lisans:** [MIT](./LICENSE)

---

## Vizyon ve Öne Çıkanlar

**Bi Ders!**, öğrencilerin ve öğretmenlerin nitelikli ders materyallerine hiçbir ücret duvarına veya dikkat dağıtıcı reklama takılmadan tek bir noktadan ulaşabilmesi için geliştirilen açık kaynak bir eğitim platformudur.

- **%100 Ücretsiz, Reklamsız ve Açık Kaynak:** Tüm temel eğitim materyalleri, testler ve topluluk alanları herkese açıktır.
- **PWA (Progressive Web App) & Mobil Öncelikli:** `public/manifest.json`, `apple-touch-icon.png` ve uyarlanabilir (`maskable`) ikon setiyle iOS ve Android cihazlarda **"Ana Ekrana Ekle"** destekli, tam ekran (`standalone`) uygulama deneyimi sunar.
- **Yüksek Kontrastlı ve Erişilebilir Arayüz:** Kâğıt (krem) zemin ve lacivert mürekkep tipografiyle göz yormayan, tamamen Türkçe tasarım sistemi; yükleme iskeletleri (skeleton/spinner) ve boş durum ekranları.
- **Çevrimdışı / Demo Modu:** Supabase yapılandırılmasa bile uygulama çökmez; tüm modüller ve yönetim paneli `localStorage` kalıcılığıyla eksiksiz denenebilir.

---

## Teknoloji Yığını

| Katman | Teknoloji |
| --- | --- |
| **Arayüz & Derleme** | React 19, Vite 8, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`) |
| **Yönlendirme** | React Router v7 (`BrowserRouter` + GitHub Pages & Cloudflare Pages SPA desteği) |
| **İkonlar** | Lucide React + yerel marka SVG ikonları |
| **Arka Uç & Depolama** | Supabase (Auth — Google OAuth & E-posta/Şifre, PostgreSQL + RLS, Storage) |
| **Kod Kalitesi** | TypeScript (`tsc -b`), Oxlint (`npm run lint`) |

---

## 8 Ana Eğitim Modülü

| Modül | Rota | Özellikler |
| --- | --- | --- |
| **Forum** | `/forum`, `/forum/:id` | Yeni konu açma, cevap yazma, beğeni, kabul edilen çözüm işaretleme, çözüldü/açık durum filtreleri, favorilere ekleme ve öğretmen/yönetici moderasyonu (sabitle, kilitle, sil). |
| **Sunular** | `/sunular` | Akıllı tahta ve ders anlatım slaytları (PPTX / PDF); sınıf, ders ve ünite filtreleme, önizleme ve yazdırma/indirme. |
| **Ders Notları** | `/ders-notlari` | Ünite özetleri, kavram haritaları, formül kartları ve föyler; filtreleme, önizleme ve PDF olarak kaydetme. |
| **Oyun & Etkinlikler** | `/etkinlikler` | **Wordwall, H5P, LearningApps, PhET, Genially** (ayrıca GeoGebra, Educaplay, Scratch, Liveworksheets, Desmos) için alan adı beyaz listeli güvenli HTTPS sandbox `iframe` oynatıcısı, tam ekran modu, özel embed ekleme ve çevrimdışı çalışan yerleşik HTML5 `srcDoc` etkinlik üreticisi. |
| **Online Test** | `/testler`, `/testler/:id` | Geri sayım sayaçlı (`mm:ss`, süre dolduğunda otomatik gönderim), anlık doğru/yanlış geri bildirimli ve açıklamalı çoktan seçmeli test motoru; sonuçlar sunucu tarafında (`submit_quiz` RPC) puanlanıp profil geçmişine kaydedilir. |
| **Yazılılar** | `/yazililar` | MEB uyumlu dönemlik açık uçlu ve klasik yazılı senaryoları ile cevap anahtarları. |
| **Sınavlar** | `/sinavlar` | LGS, TYT ve AYT tam deneme kitapçıkları, branş denemeleri ve çözüm kılavuzları. |
| **Evraklar** | `/evraklar` | Ünitelendirilmiş yıllık planlar, zümre tutanakları, BEP formları ve sınav analiz şablonları. |

---

## Kitap Mağazası, Yönetim Paneli ve Diğer Özellikler

### Kitap Mağazası ve Detay Sayfası (`/kitaplar`, `/kitaplar/:slug`)
- Özgün kitap kapakları (`public/books/*.webp`) ve dinamik tipografik kapak yedeklemesi (`BookCover.tsx`).
- Sınıf, ders kategorisi ve metin aramasıyla filtreleme, favorilere kaydetme.
- **Kitap Detay Sayfası (`/kitaplar/:slug`):**
  - Yerleşik **örnek PDF önizleyici** (`public/books/samples/*.pdf`) ve etkileşimli sayfa okuyucu / yazdırma görünümü.
  - Ücretli kaynaklar için harici ödeme sağlayıcısı algılamalı (**Shopier**, **iyzico** veya özel güvenli ödeme bağlantısı) satın alma yönlendirmesi.

### Yönetim Paneli (`/admin`)
Yalnızca `teacher` ve `admin` rolündeki kullanıcıların erişebildiği, rol korumalı (`ProtectedRoute`) yönetim merkezi:
- **Doküman & Dersler (`ResourceManager`):** Sunular, Ders Notları, Yazılılar, Sınavlar, Evraklar ve genel konu anlatımlarını dosya yükleyerek veya bağlantı ekleyerek oluşturma ve silme.
- **Oyun & Etkinlikler (`ActivityManager`):** HTTPS ve alan adı doğrulamalı Wordwall / H5P / HTML5 etkinlik ekleme, önizleme ve yönetme.
- **Online Testler (`QuizManager`):** Soru, şık (A–E), doğru cevap, çözüm açıklaması, zorluk ve süre tanımlayarak canlı test yayınlama.
- **Kitap Mağazası (`BookManager`):** Kapak görseli yükleme (otomatik sıkıştırma) veya hazır kapak seçimi, örnek PDF yükleme, fiyat ve Shopier/iyzico bağlantısı düzenleme.
- **İletişim Mesajları & Kullanıcı Yönetimi (yalnızca `admin`):** İletişim formundan gelen mesajları okuma ve kullanıcı rollerini (`student`, `teacher`, `admin`) güncelleme.

### Ek Sayfalar ve Yetenekler
- **Dersler & Konu Anlatımları (`/dersler`, `/dersler/:slug`):** Markdown destekli makale/ders okuyucu, etiketler ve favori kaydı.
- **Birleşik Türkçe Arama (`/ara`):** Ders notları, modül dokümanları, etkinlikler, forum, testler ve kitaplar arasında tek arama çubuğuyla Türkçe karakter duyarlı arama.
- **Profilim (`/profil`):** Profil bilgileri düzenleme, favorilerim listesi ve çözülen online test sonuçları geçmişi.
- **Kimlik Doğrulama (`/giris`, `/kayit`, `/auth/callback`, `/sifre-yenile`):** Google OAuth, E-posta + Şifre, şifre yenileme akışı, her sayfadan açılabilen giriş modalı ve Demo Modu tek tık giriş düğmeleri.
- **Kurumsal & Yasal Sayfalar:** Hakkımızda (`/hakkimizda`), İletişim (`/iletisim`), Gizlilik Politikası (`/gizlilik`), Kullanım Koşulları (`/kullanim-kosullari`), KVKK (`/kvkk`), Çerez Politikası (`/cerez-politikasi`).

---

## Klasör Mimarisi

```text
bi-ders.github.io/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Pages otomatik derleme ve yayınlama
├── public/
│   ├── 404.html                    # GitHub Pages SPA yönlendirme betiği
│   ├── _redirects                  # Cloudflare Pages SPA kuralı (/* /index.html 200)
│   ├── manifest.json               # PWA manifest (standalone, tema rengi, ikonlar)
│   ├── site.webmanifest            # Ek web manifest uyumluluğu
│   ├── favicon.svg                 # Ana vektörel logo ve favicon
│   ├── favicon.ico                 # Çoklu boyut (16/32/48) ICO favicon
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png        # iOS Ana Ekrana Ekle simgesi (180x180)
│   ├── icon-192.png                # PWA simgesi (192x192)
│   ├── icon-512.png                # PWA simgesi (512x512)
│   ├── icon-maskable-512.png       # Android uyarlanabilir (maskable) simge
│   └── books/
│       ├── *.webp                  # Özgün kitap kapak görselleri
│       └── samples/*.pdf           # Örnek kitap önizleme PDF dosyaları
├── src/
│   ├── assets/
│   │   └── hero.webp               # Ana sayfa illüstrasyonu
│   ├── components/
│   │   ├── admin/
│   │   │   ├── ActivityManager.tsx # Oyun & Etkinlik yönetimi
│   │   │   ├── BookManager.tsx     # Kitap mağazası ve örnek PDF yönetimi
│   │   │   ├── QuizManager.tsx     # Online test ve soru oluşturucu
│   │   │   ├── ResourceManager.tsx # Modül dokümanları ve ders yönetimi
│   │   │   └── fileHelpers.ts      # Görsel sıkıştırma ve dosya okuma yardımcıları
│   │   ├── auth/
│   │   │   ├── AuthForm.tsx        # Giriş / kayıt / şifre sıfırlama + Demo girişi
│   │   │   ├── AuthModal.tsx       # Erişilebilir giriş/kayıt modalı
│   │   │   └── ProtectedRoute.tsx  # Oturum ve rol bazlı rota koruması
│   │   ├── books/
│   │   │   └── BookCover.tsx       # Kitap kapak bileşeni
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Üst menü, 8 modül şeridi, arama ve mobil menü
│   │   │   ├── Footer.tsx          # Alt bilgi, iletişim ve yasal bağlantılar
│   │   │   ├── Layout.tsx          # Sayfa kabuğu ve Demo Modu bilgi çubuğu
│   │   │   └── SearchBar.tsx       # Hızlı arama bileşeni
│   │   ├── modules/
│   │   │   └── ModuleIcon.tsx      # 8 eğitim modülü ikon eşleştiricisi
│   │   └── ui/
│   │       ├── BrandIcons.tsx      # Sosyal medya ve Google SVG ikonları
│   │       ├── Button.tsx          # Düğme ve bağlantı düğmesi bileşenleri
│   │       ├── Display.tsx         # Logo, Avatar, Rozet, PageHeader, Chip
│   │       └── Feedback.tsx        # Spinner, Skeleton, EmptyState, ErrorState, Alert
│   ├── config/
│   │   └── site.ts                 # Merkezi site adı, logo, iletişim, sosyal medya ve modül ayarları
│   ├── context/
│   │   └── AuthContext.tsx         # Supabase Auth + Demo Modu oturum yönetimi
│   ├── data/
│   │   ├── mockData.ts             # Demo Modu temel verileri (profiller, dersler, forum, testler, kitaplar)
│   │   └── mockResources.ts        # 8 modül dokümanları, etkinlikler ve soru bankası örnek verileri
│   ├── hooks/
│   │   └── index.ts                # useAsync, usePageMeta, useDismiss, useLockBody
│   ├── lib/
│   │   ├── embedSandbox.ts         # İzinli iframe alan adı doğrulayıcı ve HTML5 srcDoc üreticisi
│   │   ├── supabase.ts             # Güvenli Supabase istemcisi (env boşsa null → Demo Modu)
│   │   └── utils.ts                # Türkçe tarih/arama, slugify, ödeme sağlayıcı algılama
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── ForumPage.tsx           & ForumDetailPage.tsx
│   │   ├── ResourceModulePage.tsx  # Sunular, Ders Notları, Yazılılar, Sınavlar, Evraklar
│   │   ├── ActivitiesPage.tsx      # Oyun & Etkinlikler + sandbox oynatıcı
│   │   ├── QuizzesPage.tsx         & QuizRunnerPage.tsx
│   │   ├── LessonsPage.tsx         & LessonDetailPage.tsx
│   │   ├── BooksPage.tsx           & BookDetailPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── AboutPage.tsx           & ContactPage.tsx
│   │   ├── AuthPage.tsx            # Giriş, Kayıt, OAuth Callback, Şifre Yenileme
│   │   ├── ProfilePage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── LegalPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── services/
│   │   └── api.ts                  # Supabase / Demo Modu (localStorage) soyut veri katmanı
│   ├── types/
│   │   └── index.ts                # Ortak TypeScript tip tanımları
│   ├── App.tsx                     # BrowserRouter rota tablosu ve ErrorBoundary
│   ├── index.css                   # Tailwind CSS v4 tasarım jetonları ve bileşen stilleri
│   └── main.tsx                    # Uygulama giriş noktası
├── supabase/
│   └── schema.sql                  # Tablolar, tetikleyiciler, submit_quiz RPC, RLS ve Storage politikaları
├── .env.example                    # Ortam değişkeni şablonu
├── index.html                      # SEO, PWA etiketleri ve GitHub Pages SPA yönlendirme betiği
└── vite.config.ts                  # Vite + React + Tailwind v4 yapılandırması
```

---

## Hızlı Başlangıç (Demo Modu)

Supabase anahtarı girmeden projeyi saniyeler içinde yerel ortamda çalıştırabilirsiniz:

```bash
git clone https://github.com/Bi-Ders/bi-ders.github.io.git
cd bi-ders.github.io
npm install
npm run dev
```

`VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` boş bırakıldığında uygulama otomatik olarak **Demo Modu**'na geçer:
- Tüm veriler `src/data/mockData.ts` ve `src/data/mockResources.ts` dosyalarından okunur.
- Profil düzenleme, favoriler, yeni forum konuları/cevapları, çözülen test sonuçları ve `/admin` panelinden eklenen doküman, etkinlik, test ve kitaplar tarayıcının **`localStorage`** alanında kalıcı olarak saklanır.
- Giriş ekranında tek tıkla **Demo Öğrenci** (`/profil`) veya **Demo Öğretmen/Admin** (`/admin`) oturumu açabilirsiniz.

### Geliştirme Komutları

```bash
npm run dev       # Geliştirme sunucusunu başlatır
npm run build     # TypeScript kontrolü (tsc -b) ve üretim derlemesi (dist/)
npm run preview   # Derlenmiş dist/ çıktısını yerelde önizler
npm run lint      # Oxlint ile statik kod analizi yapar
```

---

## Supabase Kurulumu

Gerçek veritabanı, kimlik doğrulama ve dosya depolama için:

1. `.env.example` dosyasını `.env` olarak kopyalayıp Supabase proje bilgilerinizi girin:
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_SUPABASE_URL=https://<proje-kimliginiz>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-public-key>
   VITE_SITE_URL=https://bi-ders.github.io
   ```
2. **Supabase Dashboard → SQL Editor** üzerinden [`supabase/schema.sql`](./supabase/schema.sql) dosyasının tamamını çalıştırın. Bu betik tekrar çalıştırılabilir (idempotent) olup şu yapıları kurar:
   - Tablolar: `profiles`, `categories`, `contents`, `forum_topics`, `forum_replies`, `quizzes`, `quiz_questions`, `quiz_answer_keys`, `quiz_results`, `books`, `favorites`, `contact_messages`, `reports`.
   - Güvenlik tetikleyicileri (rol yükseltme koruması, otomatik profil oluşturma, forum sayaçları) ve sunucu tarafı test puanlama fonksiyonu (`submit_quiz`).
   - Tüm tablolar ve Storage bucket'ları (`avatars`, `content-files`, `book-covers`, `book-files`, `forum-attachments`) için sıkı **Row Level Security (RLS)** politikaları.
3. İlk yönetici (`admin`) hesabını atamak için SQL Editor'de şu sorguyu çalıştırın:
   ```sql
   update public.profiles
      set role = 'admin'
    where id = (select id from auth.users where email = 'siz@ornek.com');
   ```
4. **Authentication → URL Configuration** ekranında yönlendirme adreslerini tanımlayın:
   - **Site URL:** `https://bi-ders.github.io` (veya özel alan adınız)
   - **Redirect URLs:**
     - `https://bi-ders.github.io/auth/callback`
     - `https://bi-ders.github.io/sifre-yenile`
     - `http://localhost:5173/auth/callback`
5. Google ile giriş için **Authentication → Providers → Google** sağlayıcısını etkinleştirin.

---

## Yayınlama (GitHub Pages & Cloudflare Pages)

Proje standart `BrowserRouter` kullanır ve alt sayfalarda (örn. `/forum`, `/kitaplar/temel-matematik-konu-anlatimi`) sayfa yenilendiğinde 404 hatası alınmaması için her iki platforma da hazırdır:

### GitHub Pages
- [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) iş akışı, `main` dalına her push sonrasında projeyi otomatik derleyip yayınlar.
- Depo ayarlarında **Settings → Pages → Build and deployment → Source** seçeneğini **GitHub Actions** yapın.
- Supabase kullanacaksanız **Settings → Secrets and variables → Actions** altına `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` sırlarını ekleyin (tanımlanmazsa site Demo Modu'nda sorunsuz yayınlanır).
- Alt sayfa yönlendirmesi [`public/404.html`](./public/404.html) ve [`index.html`](./index.html) içindeki `rafgraph/spa-github-pages` betiğiyle sağlanır.

### Cloudflare Pages
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- Alt sayfa yönlendirmesi [`public/_redirects`](./public/_redirects) (`/* /index.html 200`) dosyası ile otomatik çalışır.
- Özel alan adıyla yayınlarken `VITE_SITE_URL` ortam değişkenini yeni alan adınıza göre güncelleyin ve Supabase Redirect URLs listesine ekleyin.

---

## Özelleştirme

- **Marka, Logo, İletişim, Sosyal Medya ve 8 Modül:** Tüm ayarlar tek bir dosyadan yönetilir → [`src/config/site.ts`](./src/config/site.ts) (varsayılan logo `/favicon.svg`, iletişim konumu `Bolu, Türkiye`).
- **PWA Ayarları:** Uygulama adı, tema rengi ve ana ekran simgeleri [`public/manifest.json`](./public/manifest.json) üzerinden düzenlenir.

---

## Katkıda Bulunma ve Lisans

Hata bildirimleri, yeni ders materyali önerileri ve pull request'ler memnuniyetle karşılanır. Proje [MIT Lisansı](./LICENSE) ile lisanslanmıştır.