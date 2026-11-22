import { Link } from 'react-router-dom'
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { siteConfig } from '../../config/site'
import { Logo } from '../ui/Display'
import { SocialIcon } from '../ui/BrandIcons'

export function Footer() {
  const year = new Date().getFullYear()
  const moduleLinks = siteConfig.educationModules.map((m) => ({ label: m.label, to: m.to }))
  const quick = [
    { label: 'Ana Sayfa', to: '/' },
    { label: 'Dersler', to: '/dersler' },
    { label: 'Kitaplar', to: '/kitaplar' },
    { label: 'Arama', to: '/ara' },
    { label: 'Hakkımızda', to: '/hakkimizda' },
    { label: 'İletişim', to: '/iletisim' },
  ]

  return (
    <footer className="mt-24 border-t border-[#12204a] bg-[#12204a] text-[#f9f7f0] dark:border-line dark:bg-[#0d1838]">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="inline-flex rounded-xl bg-[#faf7f0] px-3 py-2 dark:border dark:border-line dark:bg-[#192b5e]">
            <Logo />
          </div>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#f9f7f0]/80">{siteConfig.description}</p>
          <ul className="mt-6 flex gap-2" aria-label="Sosyal medya">
            {siteConfig.social.map((s) => (
              <li key={s.platform}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="grid size-10 place-items-center rounded-xl border border-[#f9f7f0]/20 text-[#f9f7f0]/90 transition hover:border-sun hover:bg-sun hover:text-[#12204a]"
                >
                  <SocialIcon platform={s.platform} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <FooterColumn title="Eğitim Modülleri" className="lg:col-span-3" links={moduleLinks} twoCols />
        <FooterColumn title="Hızlı Linkler" className="lg:col-span-2" links={quick} />

        <div className="lg:col-span-3">
          <h2 className="font-display text-sm font-bold tracking-[0.12em] text-sun uppercase">İletişim</h2>
          <ul className="mt-4 space-y-3 text-[15px] text-[#f9f7f0]/85">
            <li>
              <a href={`mailto:${siteConfig.contact.email}`} className="inline-flex items-center gap-2.5 hover:text-sun">
                <Mail className="size-4 shrink-0" aria-hidden /> {siteConfig.contact.email}
              </a>
            </li>
            <li>
              <a href={`tel:${siteConfig.contact.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2.5 hover:text-sun">
                <Phone className="size-4 shrink-0" aria-hidden /> {siteConfig.contact.phone}
              </a>
            </li>
            <li className="inline-flex items-center gap-2.5">
              <MapPin className="size-4 shrink-0" aria-hidden /> {siteConfig.contact.address}
            </li>
          </ul>
          <div className="mt-6 rounded-2xl border border-[#f9f7f0]/15 bg-[#f9f7f0]/6 p-4 text-sm text-[#f9f7f0]/80">
            <strong className="text-[#f9f7f0]">Açık kaynak eğitim:</strong> {siteConfig.name} gönüllü öğretmenler ve öğrenciler tarafından geliştirilen, reklamsız
            ve açık kaynak bir eğitim projesidir.
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 font-semibold text-sun hover:underline"
            >
              <SocialIcon platform="github" className="size-3.5" />
              GitHub Deposunu İncele
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-[#f9f7f0]/15">
        <div className="container-page flex flex-col gap-4 py-6 text-sm text-[#f9f7f0]/70 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {siteConfig.name} Tüm hakları saklıdır.
          </p>
          <nav aria-label="Yasal bağlantılar">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {siteConfig.legalNav.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-sun">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
  className,
  twoCols,
}: {
  title: string
  links: ReadonlyArray<{ label: string; to: string }>
  className?: string
  twoCols?: boolean
}) {
  return (
    <div className={className}>
      <h2 className="font-display text-sm font-bold tracking-[0.12em] text-sun uppercase">{title}</h2>
      <ul className={`mt-4 gap-x-4 gap-y-2.5 text-[15px] ${twoCols ? 'grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-2' : 'space-y-2.5'}`}>
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-[#f9f7f0]/85 transition hover:text-sun">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
