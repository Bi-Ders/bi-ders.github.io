import { BookOpen, HeartHandshake, ShieldCheck, Users } from 'lucide-react'
import { siteConfig } from '../config/site'
import { usePageMeta } from '../hooks'
import { PageHeader } from '../components/ui/Display'
import { ButtonLink } from '../components/ui/Button'

const values = [
  {
    icon: <BookOpen className="size-5" />,
    title: 'Herkese açık ve ücretsiz',
    text: 'Nitelikli ders notlarına, testlere ve kaynak kitaplara ulaşmak için ücret duvarları olmamalı. Tüm temel içerikler sonsuza kadar ücretsizdir.',
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
    text: 'Öğretmenler konu anlatımı, test ve kitap önerileri ekleyebilir; içerikler topluluk geri bildirimleriyle sürekli güncellenir.',
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
              <div className="grid size-11 place-items-center rounded-xl border border-ink bg-sun-soft text-ink shadow-[0_2px_0_0_var(--color-ink)]" aria-hidden>
                {v.icon}
              </div>
              <h2 className="mt-4 text-xl font-bold">{v.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{v.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-3xl border border-ink bg-ink p-8 text-paper sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-extrabold text-paper">Öğretmen misin veya katkı sağlamak mı istiyorsun?</h2>
            <p className="mt-2 text-paper/80">Ders notu, soru veya kitap önerisi paylaşmak için bize ulaşabilirsin.</p>
          </div>
          <ButtonLink to="/iletisim" variant="sun" size="lg">
            İletişime Geç
          </ButtonLink>
        </div>
      </section>
    </div>
  )
}
