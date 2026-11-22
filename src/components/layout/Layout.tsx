import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { FlaskConical, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Header } from './Header'
import { Footer } from './Footer'
import { AuthModal } from '../auth/AuthModal'

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-50 rounded-lg bg-ink px-4 py-2 text-paper dark:bg-sun dark:text-[#12204a] focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        İçeriğe geç
      </a>
      <DemoBanner />
      <Header />
      <ScrollToTop />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AuthModal />
    </div>
  )
}

function DemoBanner() {
  const { isDemo, user } = useAuth()
  const [hidden, setHidden] = useState(() => sessionStorage.getItem('biders:demo-banner') === '0')
  if (!isDemo || hidden) return null
  return (
    <div className="relative border-b border-[#12204a]/15 bg-sun text-[#12204a]">
      <div className="container-page flex items-center gap-2 py-2 pr-10 text-[13px] font-medium sm:justify-center">
        <FlaskConical className="size-4 shrink-0" aria-hidden />
        <p>
          <strong>Demo Modu:</strong> Supabase yapılandırılmadı, örnek veriler gösteriliyor.{' '}
          {!user && (
            <Link to="/giris" className="font-bold underline underline-offset-2">
              Demo hesapla giriş yap
            </Link>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem('biders:demo-banner', '0')
          setHidden(true)
        }}
        className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md hover:bg-[#12204a]/12"
        aria-label="Demo uyarısını kapat"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}
