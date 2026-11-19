import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { siteConfig } from '../../config/site'
import { Logo } from '../ui/Display'
import { SocialIcon } from '../ui/BrandIcons'

export function Footer() {
  const year = new Date().getFullYear()
  const sections = siteConfig.mainNav.slice(0, 4)
  const quick = [
    { label: 'Ana Sayfa', to: '/' },
    { label: 'Arama', to: '/ara' },
    { label: 'Hakkımızda', to: '/hakkimizda' },
    { label: 'İletişim', to: '/iletisim' },
    { label: 'Giriş Yap', to: '/giris' },
  ]

  return (
    <footer className="mt-24 border-t border-ink bg-ink text-paper">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="inline-flex rounded-xl bg-paper px-3 py-2">
            <Logo />
          </div>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-paper/80">{siteConfig.description}</p>
          <ul className="mt-6 flex gap-2" aria-label="Sosyal medya">
            {siteConfig.social.map((s) => (
              <li key={s.platform}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid size-10 place-items-center rounded-xl border border-paper/20 text-paper/90 transition hover:border-sun hover:bg-sun hover:text-ink"
                >
                  <SocialIcon platform={s.platform} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <FooterColumn title="Bölümler" className="lg:col-span-2" links={sections} />
        <FooterColumn title="Hızlı Linkler" className="lg:col-span-2" links={quick} />

        <div className="lg:col-span-4">
          <h2 className="font-display text-sm font-bold tracking-[0.12em] text-sun uppercase">İletişim</h2>
          <ul className="mt-4 space-y-3 text-[15px] text-paper/85">
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
          <div className="mt-6 rounded-2xl border border-paper/15 bg-paper/5 p-4 text-sm text-paper/80">
            <strong className="text-paper">Proje hakkında:</strong> {siteConfig.name} gönüllü öğretmenler ve öğrenciler tarafından geliştirilen, reklamsız
            ve kâr amacı gütmeyen açık bir eğitim projesidir.
          </div>
        </div>
      </div>

      <div className="border-t border-paper/15">
        <div className="container-page flex flex-col gap-4 py-6 text-sm text-paper/70 md:flex-row md:items-center md:justify-between">
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

function FooterColumn({ title, links, className }: { title: string; links: ReadonlyArray<{ label: string; to: string }>; className?: string }) {
  return (
    <div className={className}>
      <h2 className="font-display text-sm font-bold tracking-[0.12em] text-sun uppercase">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-[15px]">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-paper/85 transition hover:text-sun">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
