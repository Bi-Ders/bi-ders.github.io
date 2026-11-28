import { useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileUp,
  Gamepad2,
  Lightbulb,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { allowedEmbedDomainsText } from '../../lib/embedSandbox'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/Display'
import { Button } from '../ui/Button'

export type GuideTargetTab = 'resources' | 'activities' | 'quizzes' | 'books'

type GuideSection = {
  id: GuideTargetTab
  title: string
  subtitle: string
  routeHint: string
  badge: string
  badgeTone: 'brand' | 'sun' | 'success' | 'ink'
  icon: ReactNode
  ctaLabel: string
  steps: Array<{
    title: string
    detail: string
  }>
  tips: string[]
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'resources',
    title: 'Ders Notu, Sunu, Yazılı & Konu Anlatımı',
    subtitle: 'PDF/PPTX/DOCX kaynakları veya uzun konu anlatımı makalelerini ilgili modüle anında yayınla.',
    routeHint: '/ders-notlari · /sunular · /yazililar · /sinavlar · /evraklar · /dersler',
    badge: 'Doküman & Dersler',
    badgeTone: 'brand',
    icon: <BookOpen className="size-5" aria-hidden />,
    ctaLabel: 'Doküman & Ders Ekle',
    steps: [
      {
        title: 'Hedef modülü seç',
        detail:
          'İçeriğin nerede görüneceğini belirle: Ders Notları, Sunular, Yazılılar, Sınavlar, Evraklar veya doğrudan Konu Anlatımı (/dersler).',
      },
      {
        title: 'Temel bilgileri doldur',
        detail:
          'Başlık, ders kategorisi (Türkçe, Matematik, Fen Bilimleri vb.), sınıf seviyesi (5–8. Sınıf / LGS) ve ünite adını açık ve aranabilir şekilde yaz.',
      },
      {
        title: 'Dosya yükle veya bağlantı ekle',
        detail:
          'Bilgisayarından doğrudan PDF, PPTX, DOCX ya da görsel yükleyebilir (maks. 25 MB, görseller otomatik WebP sıkıştırılır) veya güvenli bir https:// dosya bağlantısı verebilirsin.',
      },
      {
        title: 'Özet, etiketler ve yayınlama',
        detail:
          'Kısa bir özet ve virgülle ayrılmış etiketler ekleyip "Kaydet ve Yayınla" düğmesine tıkla. İçerik ilgili modül sayfasında anında görünür.',
      },
    ],
    tips: [
      'Konu Anlatımı (/dersler) seçtiğinde zengin metin gövdesine başlık ve madde işaretleri ekleyerek okunabilirliği artırabilirsin.',
      'Dosya adlarında ve başlıklarda sınıf + ünite bilgisini kullanmak öğrencilerin aramada içeriği hızlı bulmasını sağlar.',
    ],
  },
  {
    id: 'books',
    title: 'Kitap Mağazası Kaydı',
    subtitle: 'Dijital veya basılı kaynak kitapları kapak görseli, örnek PDF ve satın alma bağlantısıyla sergile.',
    routeHint: '/kitaplar',
    badge: 'Kitap Mağazası',
    badgeTone: 'sun',
    icon: <BookMarked className="size-5" aria-hidden />,
    ctaLabel: 'Kitap Ekle',
    steps: [
      {
        title: 'Kitap ve yazar bilgilerini gir',
        detail:
          'Kitap adı, kategori, yazar adı, yayınevi, hedef sınıf seviyesi, sayfa sayısı ve yayın yılı bilgilerini eksiksiz doldur.',
      },
      {
        title: 'Kapak görseli ve örnek PDF ekle',
        detail:
          'Hazır branş kapaklarından seçebilir ya da kendi kapak görselini yükleyebilirsin (otomatik WebP olarak optimize edilir). İstersen öğrencilerin inceleyebilmesi için örnek PDF ekle.',
      },
      {
        title: 'Fiyat ve yönlendirme bağlantısı',
        detail:
          'Ücretli kitaplar için TL fiyatını ve güvenilir satış bağlantısını (Shopier, iyzico, Kitapyurdu, Trendyol vb.) ekle. Ücretsiz kaynaklar için fiyatı 0 bırakabilirsin.',
      },
      {
        title: 'Öne çıkan maddeler ve yayınla',
        detail:
          'Kitabın kazanımlarını veya öne çıkan özelliklerini satır satır yazıp kaydet. Eklediğin kitapları aynı ekrandan istediğin zaman düzenleyebilirsin.',
      },
    ],
    tips: [
      'Örnek PDF bölümü öğrencilerin kitabı satın almadan önce içeriği görmesini sağlar ve güven oluşturur.',
      'Dış satış bağlantılarının mutlaka https:// ile başlamasına dikkat et.',
    ],
  },
  {
    id: 'activities',
    title: 'Oyun & Etkileşimli Etkinlik',
    subtitle: 'Wordwall, PhET, H5P ve benzeri etkileşimli içerikleri güvenli iframe içinde öğrencilere sun.',
    routeHint: '/etkinlikler',
    badge: 'Oyun & Etkinlikler',
    badgeTone: 'success',
    icon: <Gamepad2 className="size-5" aria-hidden />,
    ctaLabel: 'Etkinlik Ekle',
    steps: [
      {
        title: 'Etkinlik türünü ve bilgilerini seç',
        detail:
          'İçeriğin "Oyun" mu yoksa "Etkinlik / Simülasyon" mu olduğunu seç; başlık, ders kategorisi, sınıf, ünite ve tahmini süreyi (dk) gir.',
      },
      {
        title: 'Güvenli yerleştirme (embed) URL’sini yapıştır',
        detail:
          'Desteklenen bir sağlayıcıdan aldığın https:// embed bağlantısını yapıştır. Sistem alan adını otomatik doğrular.',
      },
      {
        title: 'Canlı önizleme ile test et',
        detail:
          'Kaydetmeden önce "Önizlemeyi Göster" düğmesiyle etkinliğin tam ekran/iframe içinde sorunsuz açıldığını kontrol et.',
      },
      {
        title: 'Açıklama ve etiketlerle yayınla',
        detail:
          'Öğrencilere kısa bir oynanış veya kazanım notu yazıp yayınla. Etkinlik /etkinlikler sayfasında anında oynanabilir olur.',
      },
    ],
    tips: [
      `İzin verilen sağlayıcılar: ${allowedEmbedDomainsText}.`,
      'Paylaşım sayfası linki yerine doğrudan "Embed / Yerleştir" bağlantısını kullanmak daha temiz bir görünüm verir.',
    ],
  },
  {
    id: 'quizzes',
    title: 'Online Test (Quiz) Oluşturma',
    subtitle: 'Çoktan seçmeli, süreli ve çözümlü online testler hazırlayıp öğrencilerin anlık geri bildirim almasını sağla.',
    routeHint: '/testler',
    badge: 'Online Testler',
    badgeTone: 'ink',
    icon: <ClipboardCheck className="size-5" aria-hidden />,
    ctaLabel: 'Test Oluştur',
    steps: [
      {
        title: 'Test ayarlarını belirle',
        detail:
          'Test başlığı, ders kategorisi, sınıf seviyesi, zorluk derecesi (Kolay / Orta / Zor), süre sınırı (dakika) ve kısa açıklamayı doldur.',
      },
      {
        title: 'Soruları ve şıkları ekle',
        detail:
          'Her soru için soru kökünü ve en az 2, en fazla 5 seçeneği (A–E) yaz. "Yeni Soru Ekle" ile istediğin kadar soru ekleyebilir, oklarla sırasını değiştirebilirsin.',
      },
      {
        title: 'Doğru şıkkı işaretle ve çözüm ekle',
        detail:
          'Her soruda doğru cevabı seç. Öğrencilerin test bitiminde neden o şıkkın doğru olduğunu öğrenebilmesi için kısa bir çözüm açıklaması yaz.',
      },
      {
        title: 'Yayınla ve test ekranında kontrol et',
        detail:
          'Testi kaydettiğinde doğrudan /testler altında yayınlanır. Öğrenciler testi çözdüğünde puanları profil sayfalarına otomatik işlenir.',
      },
    ],
    tips: [
      'Sorularda çözüm açıklaması doldurmak, özellikle yanlış yapan öğrencilerin konuyu pekiştirmesinde çok etkilidir.',
      'Süre sınırını soru başına ortalama 1–1,5 dakika olacak şekilde belirleyebilirsin.',
    ],
  },
]

const QUICK_RULES = [
  {
    icon: <FileUp className="size-4" aria-hidden />,
    title: 'Dosya & Görsel Sınırları',
    text: 'Tek seferde en fazla 25 MB dosya yüklenebilir. Görseller otomatik olarak WebP formatına sıkıştırılır.',
  },
  {
    icon: <ShieldCheck className="size-4" aria-hidden />,
    title: 'Güvenli Bağlantılar & Telif',
    text: 'Yalnızca https:// bağlantıları kabul edilir. Paylaşılan tüm materyallerin telif ve kullanım haklarına uygun olduğundan emin ol.',
  },
  {
    icon: <Sparkles className="size-4" aria-hidden />,
    title: 'Anında Yayın & Düzenleme',
    text: 'Eklediğin içerikler ilgili eğitim modülünde anında yayınlanır; yönetici veya içerik sahibi olarak dilediğin zaman silebilir/güncelleyebilirsin.',
  },
]

export function ContentGuide({ onNavigateTab }: { onNavigateTab: (tab: GuideTargetTab) => void }) {
  const [selected, setSelected] = useState<'all' | GuideTargetTab>('all')

  const visibleSections =
    selected === 'all' ? GUIDE_SECTIONS : GUIDE_SECTIONS.filter((section) => section.id === selected)

  return (
    <div className="space-y-8">
      {/* Üst Karşılama & Hızlı Erişim Kartı */}
      <div className="card relative overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-sun-soft px-3 py-1 text-xs font-bold text-ink dark:border-sun/40 dark:bg-[#1e3168] dark:text-sun">
              <Compass className="size-3.5" aria-hidden />
              Öğretmen &amp; İçerik Üreticisi Rehberi
            </div>
            <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
              Bi Ders!&apos;e nasıl içerik eklenir?
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Ders notları, kitaplar, etkileşimli etkinlikler ve online testleri birkaç adımda oluşturup
              öğrencilerle paylaşabilirsin. Aşağıdan içerik türünü seçerek adım adım yönergeleri incele.
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2 sm:w-auto">
            {GUIDE_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelected((prev) => (prev === s.id ? 'all' : s.id))}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition',
                  selected === s.id
                    ? 'border-ink bg-sun-soft text-ink shadow-[0_2px_0_0_var(--color-ink)] dark:border-sun dark:bg-[#1e3168] dark:shadow-none'
                    : 'border-line-strong bg-paper/60 text-ink-soft hover:border-ink/50 hover:text-ink dark:bg-[#101c40] dark:hover:border-sun/50',
                )}
              >
                <span className="text-brand dark:text-sun">{s.icon}</span>
                <span className="truncate">{s.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filtre Çubuğu */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
          <span className="mr-1 text-xs font-semibold text-muted">Görüntüle:</span>
          <button
            type="button"
            onClick={() => setSelected('all')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-bold transition',
              selected === 'all'
                ? 'bg-ink text-paper dark:bg-sun dark:text-[#12204a]'
                : 'bg-paper-deep text-ink-soft hover:text-ink dark:bg-[#0d1838]',
            )}
          >
            Tümü (4 Modül)
          </button>
          {GUIDE_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition',
                selected === s.id
                  ? 'bg-ink text-paper dark:bg-sun dark:text-[#12204a]'
                  : 'bg-paper-deep text-ink-soft hover:text-ink dark:bg-[#0d1838]',
              )}
            >
              {s.badge}
            </button>
          ))}
        </div>
      </div>

      {/* Adım Adım İçerik Kartları */}
      <div className="grid gap-6 lg:grid-cols-2">
        {visibleSections.map((section) => (
          <article key={section.id} className="card flex flex-col justify-between p-6 sm:p-7">
            <div>
              {/* Kart Başlığı */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-ink bg-sun-soft text-ink shadow-[0_2px_0_0_var(--color-ink)] dark:border-sun/50 dark:bg-[#1e3168] dark:text-sun dark:shadow-none">
                    {section.icon}
                  </span>
                  <div>
                    <Badge tone={section.badgeTone}>{section.badge}</Badge>
                    <h3 className="mt-2 text-lg font-extrabold leading-snug text-ink">{section.title}</h3>
                  </div>
                </div>
              </div>

              <p className="mt-2.5 text-sm leading-relaxed text-muted">{section.subtitle}</p>
              <p className="mt-1.5 font-mono text-[11px] text-muted">{section.routeHint}</p>

              {/* Numaralı Adımlar */}
              <ol className="mt-5 space-y-3.5">
                {section.steps.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span
                      className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-extrabold text-paper dark:bg-sun dark:text-[#12204a]"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">{step.title}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* İpuçları */}
              <div className="mt-5 rounded-xl border border-line bg-paper/70 p-3.5 dark:bg-[#0d1838]/80">
                <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <Lightbulb className="size-3.5 text-brand dark:text-sun" aria-hidden />
                  İpuçları
                </p>
                <ul className="mt-2 space-y-1.5">
                  {section.tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Doğrudan Sekmeye Git Aksiyonu */}
            <div className="mt-6 flex items-center justify-end border-t border-line pt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onNavigateTab(section.id)}
              >
                {section.ctaLabel}
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </article>
        ))}
      </div>

      {/* Yayınlama Öncesi Genel Kurallar */}
      <section className="card p-6 sm:p-7" aria-labelledby="guide-rules-title">
        <h3 id="guide-rules-title" className="text-base font-extrabold text-ink">
          Yayınlama Öncesi Hızlı Kontrol Listesi
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {QUICK_RULES.map((rule) => (
            <div key={rule.title} className="rounded-xl border border-line bg-paper/60 p-4 dark:bg-[#0d1838]/70">
              <div className="flex items-center gap-2 text-sm font-bold text-ink">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand dark:bg-[#1e3168] dark:text-sun">
                  {rule.icon}
                </span>
                {rule.title}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{rule.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
