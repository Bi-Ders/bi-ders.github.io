import { siteConfig } from '../config/site'
import { usePageMeta } from '../hooks'
import { PageHeader } from '../components/ui/Display'

export type LegalSlug = 'gizlilik' | 'kullanim-kosullari' | 'kvkk' | 'cerez-politikasi'

const docs: Record<LegalSlug, { title: string; updated: string; sections: Array<{ h: string; p: string }> }> = {
  gizlilik: {
    title: 'Gizlilik Politikası',
    updated: '2026',
    sections: [
      {
        h: '1. Toplanan Veriler',
        p: `${siteConfig.name} üzerinde hesap oluşturduğunuzda yalnızca adınız, e-posta adresiniz ve profilinizde kendi isteğinizle paylaştığınız okul/sınıf gibi temel bilgiler saklanır.`,
      },
      {
        h: '2. Kullanım Amacı',
        p: 'Verileriniz yalnızca kimlik doğrulama, favorilerinizin ve test sonuçlarınızın saklanması ve forum etkileşimlerinin sağlanması için kullanılır; üçüncü taraflarla reklam amacıyla paylaşılmaz.',
      },
      {
        h: '3. İletişim',
        p: `Gizlilikle ilgili talepleriniz için ${siteConfig.contact.email} adresinden bize ulaşabilirsiniz.`,
      },
    ],
  },
  'kullanim-kosullari': {
    title: 'Kullanım Koşulları',
    updated: '2026',
    sections: [
      {
        h: '1. Topluluk Kuralları',
        p: 'Forum ve yorum alanlarında saygılı, yapıcı bir dil kullanılması zorunludur. Hakaret, spam veya telif hakkı ihlali içeren paylaşımlar moderatörler tarafından kaldırılır.',
      },
      {
        h: '2. İçerik Lisansı',
        p: `${siteConfig.name} üzerindeki özgün ders notları eğitim amacıyla ücretsiz kullanılabilir. Kaynak gösterilerek paylaşılması teşvik edilir.`,
      },
    ],
  },
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    updated: '2026',
    sections: [
      {
        h: 'Veri Sorumlusu',
        p: `6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca kişisel verileriniz, ${siteConfig.name} projesi kapsamında yalnızca eğitim hizmetinin sunulması amacıyla işlenir.`,
      },
      {
        h: 'Haklarınız',
        p: `Verilerinize erişme, düzeltilmesini veya silinmesini talep etme hakkına sahipsiniz. Başvurularınız için ${siteConfig.contact.email} adresine yazabilirsiniz.`,
      },
    ],
  },
  'cerez-politikasi': {
    title: 'Çerez Politikası',
    updated: '2026',
    sections: [
      {
        h: 'Zorunlu Çerezler ve Yerel Depolama',
        p: `${siteConfig.name}, oturumunuzun açık kalması ve Demo Modu tercihlerinizin hatırlanması için yalnızca zorunlu tarayıcı depolamasını (localStorage / oturum belirteçleri) kullanır. Üçüncü taraf reklam çerezi kullanılmaz.`,
      },
    ],
  },
}

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = docs[slug]
  usePageMeta(doc.title)

  return (
    <div>
      <PageHeader eyebrow="Yasal Bilgilendirme" title={doc.title} description={`Son güncelleme: ${doc.updated}`} />
      <article className="container-page prose-biders max-w-3xl py-10">
        {doc.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            <p>{s.p}</p>
          </section>
        ))}
      </article>
    </div>
  )
}
