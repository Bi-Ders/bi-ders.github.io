/**
 * Bi Ders! — merkezi site yapılandırması
 * ------------------------------------------------------------
 * Proje adı, logo, iletişim bilgileri, sosyal medya bağlantıları
 * ve menü öğeleri bu dosyadan değiştirilebilir. Arayüzün geri
 * kalanı tüm bu değerleri buradan okur.
 */

export type NavItem = {
  label: string
  to: string
  description?: string
}

export type SocialPlatform = 'instagram' | 'youtube' | 'x' | 'linkedin' | 'github' | 'telegram'

export type SocialLink = {
  platform: SocialPlatform
  label: string
  href: string
}

export const siteConfig = {
  /** Görünen proje adı (logo yanındaki yazı) */
  name: 'Bi Ders!',
  /** Kısa / teknik ad (URL, localStorage anahtarları vb.) */
  shortName: 'biders',
  /** Logo yazısında vurgulanacak kısım (sarı nokta ile gösterilir) */
  logoText: { main: 'Bi Ders', accent: '!' },
  /** Kendi logonuzu kullanmak için public/ altına koyup yolunu yazın (örn: '/logo.svg'). Boşsa yerleşik logo kullanılır. */
  logoUrl: '',
  tagline: 'Öğrenmenin en kısa yolu: bi ders!',
  description:
    'Bi Ders!, ders notlarına, konu anlatımlarına, testlere, kitaplara ve öğrenci forumuna tek yerden ulaşabileceğiniz ücretsiz ve Türkçe bir eğitim portalıdır.',
  /** Yayın adresi (sonda / olmadan). OAuth dönüşleri için VITE_SITE_URL önceliklidir. */
  url: 'https://bi-ders.github.io',
  locale: 'tr-TR',
  foundedYear: 2026,

  contact: {
    email: 'iletisim@biders.org',
    phone: '+90 (212) 000 00 00',
    address: 'İstanbul, Türkiye',
    /** Formda gösterilecek tahmini yanıt süresi */
    responseTime: '1–2 iş günü',
  },

  social: [
    { platform: 'instagram', label: 'Instagram', href: 'https://instagram.com/biders' },
    { platform: 'youtube', label: 'YouTube', href: 'https://youtube.com/@biders' },
    { platform: 'x', label: 'X (Twitter)', href: 'https://x.com/biders' },
    { platform: 'github', label: 'GitHub', href: 'https://github.com/Bi-Ders' },
  ] satisfies SocialLink[],

  /** Üst menüdeki ana bölümler */
  mainNav: [
    { label: 'Dersler', to: '/dersler', description: 'Konu anlatımları ve ders notları' },
    { label: 'Testler', to: '/testler', description: 'Konu tarama ve deneme testleri' },
    { label: 'Forum', to: '/forum', description: 'Soru sor, birlikte çöz' },
    { label: 'Kitaplar', to: '/kitaplar', description: 'Ücretsiz kaynak kitaplar' },
    { label: 'Hakkımızda', to: '/hakkimizda' },
    { label: 'İletişim', to: '/iletisim' },
  ] satisfies NavItem[],

  /** Alt bilgideki yasal sayfalar */
  legalNav: [
    { label: 'Gizlilik Politikası', to: '/gizlilik' },
    { label: 'Kullanım Koşulları', to: '/kullanim-kosullari' },
    { label: 'KVKK Aydınlatma Metni', to: '/kvkk' },
    { label: 'Çerez Politikası', to: '/cerez-politikasi' },
  ] satisfies NavItem[],

  /** Ana sayfadaki kısa istatistikler */
  stats: [
    { value: '1.200+', label: 'Konu anlatımı' },
    { value: '350+', label: 'Test' },
    { value: '8.000+', label: 'Forum cevabı' },
    { value: '%100', label: 'Ücretsiz' },
  ],
} as const

export type SiteConfig = typeof siteConfig
