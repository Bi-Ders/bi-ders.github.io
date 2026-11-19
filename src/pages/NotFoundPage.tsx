import { Compass } from 'lucide-react'
import { usePageMeta } from '../hooks'
import { SearchBar } from '../components/layout/SearchBar'
import { ButtonLink } from '../components/ui/Button'
import { EmptyState } from '../components/ui/Feedback'

export function NotFoundPage() {
  usePageMeta('Sayfa Bulunamadı (404)')
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={<Compass className="size-7" />}
        title="404 — Aradığın sayfa bulunamadı"
        description="Bağlantı hatalı olabilir veya sayfa taşınmış olabilir. Aşağıdan arama yapabilir ya da ana sayfaya dönebilirsin."
        action={
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            <SearchBar id="not-found-search" className="w-full" />
            <ButtonLink to="/">Ana Sayfaya Dön</ButtonLink>
          </div>
        }
      />
    </div>
  )
}
