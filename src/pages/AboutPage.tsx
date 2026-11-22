import { BookOpen, Code2, ExternalLink, GitBranch, HeartHandshake, ShieldCheck, Users } from 'lucide-react'
import { siteConfig } from '../config/site'
import { usePageMeta } from '../hooks'
import { PageHeader } from '../components/ui/Display'
import { ButtonLink, buttonClass } from '../components/ui/Button'
import { SocialIcon } from '../components/ui/BrandIcons'

const values = [
  {
    icon: <BookOpen className="size-5" />,
    title: 'Herkese açık ve ücretsiz',
    text: 'Nitelikli ders notlarına, sunulara, testlere ve kaynak kitaplara ulaşmak için ücret duvarları olmamalı. Tüm temel içerikler sonsuza kadar ücretsizdir.',
  },
  {
    icon: <Users className="size-5" />,
    title: 'Toplulukla birlikte öğrenme',
    text: 'Öğrenciler takıldıkları soruları forumda paylaşır; diğer öğrenciler ve gönüllü öğretmenler anlaşılır çözümlerle destek olur.',
  },
  {
    icon: <ShieldCheck className="size-5" />,
    title: 'Sade, güvenli ve reklamsız',
    text: 'Dikkat dağıtan reklamlar ve takipçiler yerine, mobil cihazlarda bile hızlı açılan, yüksek okunaklılığa sahip bir çalışma ortamı.',
  },
  {
    icon: <HeartHandshake className="size-5" />,
    title: 'Gönüllü katkı',
    text: 'Öğretmenler konu anlatımı, yazılı, sunu, test ve etkinlik ekleyebilir; içerikler topluluk geri bildirimleriyle sürekli güncellenir.',
  },
]

export function AboutPage() {
  usePageMeta('Hakkımızda', `${siteConfig.name} hakkında bilgi edinin.`)

  return (
    <div>
      <PageHeader
        eyebrow="Hakkımızda"
        title={
          <>
            Eğitimde fırsat eşitliği için <span className="marker">{siteConfig.name}</span>
          </>
        }
        description={siteConfig.description}
      />

      <section className="container-page py-12">
        <div className="grid gap-5 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.title} className="card p-6">
              <div className="grid size-11 place-items-center rounded-xl border border-ink bg-sun-soft text-ink shadow-[0_2px_0_0_var(--color-ink)] dark:border-sun/45 dark:text-sun dark:shadow-none" aria-hidden>
                {v.icon}
              </div>
              <h2 className="mt-4 text-xl font-bold">{v.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{v.text}</p>
            </div>
          ))}
        </div>

        {/* Açık Kaynak ve GitHub Bilgilendirme Alanı */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-line bg-card shadow-[var(--shadow-card)]">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-dark">
                <Code2 className="size-3.5" aria-hidden /> Açık Kaynak Proje
              </div>
              <h2 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">
                Tamamen şeffaf ve topluluk tarafından geliştiriliyor
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
                {siteConfig.name} kaynak kodları GitHub üzerinde herkese açık olarak barındırılır. Hata bildirimi yapabilir, yeni özellik önerebilir veya pull request göndererek projeye doğrudan katkıda bulunabilirsin.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <GitBranch className="size-4 text-brand" aria-hidden /> Bi-Ders/bi-ders.github.io
                </span>
                <span>· MIT Lisansı · Reklamsız ve Kâr Amacı Gütmeyen</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-4 lg:items-end">
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass('primary', 'lg', 'w-full lg:w-auto')}
              >
                <SocialIcon platform="github" className="size-5" />
                <span>GitHub&apos;da İncele</span>
                <ExternalLink className="size-4" aria-hidden />
              </a>
              <p className="text-xs text-muted">{siteConfig.githubUrl}</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-6 rounded-3xl border border-[#12204a] bg-[#12204a] p-8 text-[#f9f7f0] dark:border-line dark:bg-[#0d1838] sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-extrabold text-[#f9f7f0]">Öğretmen misin veya katkı sağlamak mı istiyorsun?</h2>
            <p className="mt-2 text-[#f9f7f0]/80">Ders notu, sunu, yazılı, test veya etkinlik önerisi paylaşmak için bize ulaşabilirsin.</p>
          </div>
          <ButtonLink to="/iletisim" variant="sun" size="lg">
            İletişime Geç
          </ButtonLink>
        </div>
      </section>
    </div>
  )
}
