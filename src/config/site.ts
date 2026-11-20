/**
 * Bi Ders! — merkezi site yapılandırması
 * ------------------------------------------------------------
 * Proje adı, logo, iletişim bilgileri, sosyal medya bağlantıları
 * ve menü öğeleri bu dosyadan değiştirilebilir. Arayüzün geri
 * kalanı tüm bu değerleri buradan okur.
 */

import type { ModuleKey } from '../types'

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

export type ModuleIconName =
  | 'message-square'
  | 'presentation'
  | 'notebook-text'
  | 'gamepad-2'
  | 'clipboard-check'
  | 'file-pen-line'
  | 'award'
  | 'folder-open'

export type EducationModule = {
  key: ModuleKey
  label: string
  shortLabel: string
  to: string
  description: string
  icon: ModuleIconName
  gradient: string
  badge: string
}

export const GITHUB_REPO_URL = 'https://github.com/Bi-Ders/bi-ders.github.io'

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
    'Bi Ders!, ders notlarına, sunulara, oyun ve etkinliklere, online testlere, yazılılara, sınavlara, evraklara ve öğrenci forumuna tek yerden ulaşabileceğiniz ücretsiz ve açık kaynak Türkçe bir eğitim portalıdır.',
  /** Yayın adresi (sonda / olmadan). OAuth dönüşleri için VITE_SITE_URL önceliklidir. */
  url: 'https://bi-ders.github.io',
  githubUrl: GITHUB_REPO_URL,
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
    { platform: 'github', label: 'GitHub', href: GITHUB_REPO_URL },
  ] satisfies SocialLink[],

  /** 8 Ana Eğitim Modülü */
  educationModules: [
    {
      key: 'forum',
      label: 'Forum',
      shortLabel: 'Forum',
      to: '/forum',
      description: 'Soru sor, tartış ve toplulukla birlikte çöz',
      icon: 'message-square',
      gradient: 'from-indigo-600 via-blue-600 to-sky-500',
      badge: 'Topluluk',
    },
    {
      key: 'sunular',
      label: 'Sunular',
      shortLabel: 'Sunular',
      to: '/sunular',
      description: 'Akıllı tahta ve ders anlatım slaytları',
      icon: 'presentation',
      gradient: 'from-amber-500 via-orange-500 to-rose-500',
      badge: 'PPTX / PDF',
    },
    {
      key: 'ders-notlari',
      label: 'Ders Notları',
      shortLabel: 'Ders Notları',
      to: '/ders-notlari',
      description: 'Ünite özetleri, kavram haritaları ve föyler',
      icon: 'notebook-text',
      gradient: 'from-emerald-600 via-teal-600 to-cyan-500',
      badge: 'Özet & Föy',
    },
    {
      key: 'etkinlikler',
      label: 'Oyun & Etkinlikler',
      shortLabel: 'Oyun & Etkinlik',
      to: '/etkinlikler',
      description: 'Eğitsel oyunlar, Wordwall, H5P ve HTML5 etkinlikler',
      icon: 'gamepad-2',
      gradient: 'from-fuchsia-600 via-purple-600 to-indigo-600',
      badge: 'İnteraktif',
    },
    {
      key: 'testler',
      label: 'Online Test',
      shortLabel: 'Online Test',
      to: '/testler',
      description: 'Süreli çoktan seçmeli testler ve anlık puanlama',
      icon: 'clipboard-check',
      gradient: 'from-blue-700 via-indigo-700 to-violet-600',
      badge: 'Canlı Motor',
    },
    {
      key: 'yazililar',
      label: 'Yazılılar',
      shortLabel: 'Yazılılar',
      to: '/yazililar',
      description: 'Dönemlik yazılı soruları ve cevap anahtarları',
      icon: 'file-pen-line',
      gradient: 'from-rose-600 via-red-600 to-orange-500',
      badge: 'MEB Uyumlu',
    },
    {
      key: 'sinavlar',
      label: 'Sınavlar',
      shortLabel: 'Sınavlar',
      to: '/sinavlar',
      description: 'LGS, TYT, AYT deneme kitapçıkları ve çözümler',
      icon: 'award',
      gradient: 'from-slate-800 via-blue-900 to-indigo-800',
      badge: 'LGS / YKS',
    },
    {
      key: 'evraklar',
      label: 'Evraklar',
      shortLabel: 'Evraklar',
      to: '/evraklar',
      description: 'Yıllık planlar, zümre tutanakları ve öğretmen evrakları',
      icon: 'folder-open',
      gradient: 'from-teal-700 via-emerald-700 to-green-600',
      badge: 'Öğretmen',
    },
  ] satisfies EducationModule[],

  /** Üst menüdeki genel bağlantılar */
  mainNav: [
    { label: 'Dersler', to: '/dersler', description: 'Konu anlatımları ve makaleler' },
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
    { value: '1.200+', label: 'Ders notu ve sunu' },
    { value: '350+', label: 'Online test' },
    { value: '8.000+', label: 'Forum cevabı' },
    { value: '%100', label: 'Ücretsiz & Açık Kaynak' },
  ],
} as const

export type SiteConfig = typeof siteConfig
