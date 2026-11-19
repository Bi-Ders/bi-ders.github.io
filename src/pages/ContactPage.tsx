import { useState, type FormEvent } from 'react'
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react'
import { siteConfig } from '../config/site'
import { useAuth } from '../context/AuthContext'
import { usePageMeta } from '../hooks'
import { sendContactMessage } from '../services/api'
import { isEmail } from '../lib/utils'
import { PageHeader } from '../components/ui/Display'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Feedback'

export function ContactPage() {
  usePageMeta('İletişim', `${siteConfig.name} ekibine ulaşın.`)
  const { user, profile } = useAuth()

  const [name, setName] = useState(profile?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) return setError('Lütfen adını ve soyadını yaz.')
    if (!isEmail(email)) return setError('Geçerli bir e-posta adresi gir.')
    if (message.trim().length < 10) return setError('Mesajın en az 10 karakter olmalı.')

    setBusy(true)
    try {
      await sendContactMessage({ name: name.trim(), email: email.trim(), subject: subject.trim() || null, message: message.trim() }, user?.id)
      setSent(true)
      setSubject('')
      setMessage('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="İletişim"
        title="Bize ulaşın"
        description="Hata bildirimi, içerik önerisi, öğretmen başvurusu veya herhangi bir sorunuz için formu doldurabilirsiniz."
      />

      <section className="container-page grid gap-8 py-12 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <div className="card p-6">
            <h2 className="text-lg font-bold">İletişim Bilgileri</h2>
            <ul className="mt-4 space-y-3.5 text-sm text-ink-soft">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <a href={`mailto:${siteConfig.contact.email}`} className="font-medium hover:text-ink hover:underline">
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <a href={`tel:${siteConfig.contact.phone.replace(/[^\d+]/g, '')}`} className="font-medium hover:text-ink hover:underline">
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span>{siteConfig.contact.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span>Tahmini yanıt süresi: {siteConfig.contact.responseTime}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="card p-6 sm:p-8 lg:col-span-8">
          <h2 className="text-xl font-bold">Mesaj Gönder</h2>
          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="label">
                  Ad Soyad
                </label>
                <input id="contact-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adın Soyadın" required />
              </div>
              <div>
                <label htmlFor="contact-email" className="label">
                  E-posta
                </label>
                <input id="contact-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@eposta.com" required />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="label">
                Konu (isteğe bağlı)
              </label>
              <input id="contact-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Örn. İçerik önerisi, hata bildirimi…" />
            </div>

            <div>
              <label htmlFor="contact-message" className="label">
                Mesajın
              </label>
              <textarea
                id="contact-message"
                rows={5}
                className="input min-h-32 resize-y"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mesajını buraya yaz (en az 10 karakter)…"
                required
              />
            </div>

            {error && <Alert tone="error">{error}</Alert>}
            {sent && <Alert tone="success">Mesajın bize ulaştı, teşekkür ederiz! En kısa sürede dönüş yapacağız.</Alert>}

            <Button type="submit" size="lg" loading={busy} icon={<Send className="size-4" aria-hidden />}>
              Mesajı Gönder
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}
