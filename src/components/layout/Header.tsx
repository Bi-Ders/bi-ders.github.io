import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, Search, User, X } from 'lucide-react'
import { siteConfig } from '../../config/site'
import { useAuth } from '../../context/AuthContext'
import { useDismiss, useLockBody } from '../../hooks'
import { cn, roleLabels } from '../../lib/utils'
import { ModuleIcon } from '../modules/ModuleIcon'
import { Avatar, Logo } from '../ui/Display'
import { Button } from '../ui/Button'
import { ThemeToggle, ThemeToggleRow } from '../ui/ThemeToggle'
import { SearchBar } from './SearchBar'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors',
    isActive
      ? 'text-ink after:absolute after:inset-x-3 after:-bottom-[13px] after:h-[3px] after:rounded-full after:bg-sun'
      : 'text-ink-soft hover:bg-ink/5 hover:text-ink dark:hover:bg-white/6',
  )

const moduleLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-bold whitespace-nowrap transition',
    isActive
      ? 'bg-ink text-paper shadow-xs dark:bg-sun dark:text-[#12204a]'
      : 'text-ink-soft hover:bg-card hover:text-ink dark:hover:bg-[#192b5e]',
  )

export function Header() {
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Sayfa değişince mobil menüyü kapat
  useEffect(() => setMobileOpen(false), [location.pathname, location.search])
  useLockBody(mobileOpen)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/92 backdrop-blur-md supports-[backdrop-filter]:bg-paper/82 dark:bg-[#12204a]/92 dark:supports-[backdrop-filter]:bg-[#12204a]/84">
      {/* Üst Satır: Logo, Genel Menü, Arama, Tema, Hesap */}
      <div className="container-page flex h-16 items-center gap-3 lg:gap-4">
        <Logo className="shrink-0" />

        <nav aria-label="Genel menü" className="hidden items-center gap-0.5 lg:flex">
          {siteConfig.mainNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <SearchBar id="header-search" className="ml-auto hidden w-full max-w-xs md:block lg:max-w-sm" />

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {/* Masaüstünde arama çubuğu ile profil/giriş butonu arasında minimal tema ikonu */}
          <ThemeToggle className="hidden lg:grid" />

          {loading ? (
            <div className="skeleton h-10 w-24 rounded-xl" aria-hidden />
          ) : user ? (
            <UserMenu />
          ) : (
            <LoginButton />
          )}

          <button
            type="button"
            className="grid size-10 place-items-center rounded-xl border border-line-strong bg-card text-ink transition hover:border-ink dark:hover:border-sun/60 lg:hidden"
            aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Alt Satır: 8 Ana Eğitim Modülü Hızlı Erişim Menüsü */}
      <div className="border-t border-line/70 bg-paper-deep/65 dark:bg-[#0d1838]/90">
        <nav
          aria-label="Eğitim modülleri"
          className="container-page flex items-center gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {siteConfig.educationModules.map((mod) => (
            <NavLink key={mod.key} to={mod.to} className={moduleLinkClass}>
              <ModuleIcon name={mod.icon} className="size-3.5" />
              <span>{mod.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
    </header>
  )
}

function LoginButton() {
  const { openAuth } = useAuth()
  return (
    <Button id="header-login" size="sm" onClick={() => openAuth('login')} icon={<LogIn className="size-4" aria-hidden />} className="h-10">
      <span>Giriş Yap</span>
    </Button>
  )
}

function UserMenu() {
  const { profile, isStaff, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const ref = useDismiss<HTMLDivElement>(open, close)
  const location = useLocation()
  useEffect(close, [location.pathname, close])

  const name = profile?.full_name ?? 'Hesabım'

  return (
    <div className="relative" ref={ref}>
      <button
        id="user-menu-button"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-card pr-2.5 pl-1 transition hover:border-ink dark:hover:border-sun/60"
      >
        <Avatar name={name} src={profile?.avatar_url} size="sm" className="ring-0" />
        <span className="hidden max-w-[120px] truncate text-sm font-semibold sm:block">{name.split(' ')[0]}</span>
        <ChevronDown className={cn('size-4 text-muted transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div role="menu" aria-labelledby="user-menu-button" className="card absolute right-0 mt-2 w-64 origin-top-right animate-pop-in overflow-hidden p-1.5">
          <div className="border-b border-line px-3 pt-2 pb-3">
            <p className="truncate font-semibold text-ink">{name}</p>
            <p className="truncate text-xs text-muted">
              {profile?.email ? `${profile.email} · ` : ''}
              {profile ? roleLabels[profile.role] : ''}
            </p>
          </div>
          <div className="py-1">
            <MenuLink to="/profil" icon={<User className="size-4" />}>
              Profilim
            </MenuLink>
            {isStaff && (
              <MenuLink to="/admin" icon={<LayoutDashboard className="size-4" />}>
                Yönetim Paneli
              </MenuLink>
            )}
          </div>
          <div className="border-t border-line pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close()
                void signOut()
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-danger transition hover:bg-danger-soft"
            >
              <LogOut className="size-4" aria-hidden /> Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuLink({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link role="menuitem" to={to} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper hover:text-ink dark:hover:bg-[#0d1838]">
      <span className="text-muted" aria-hidden>
        {icon}
      </span>
      {children}
    </Link>
  )
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const { user, isStaff, openAuth, signOut } = useAuth()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 top-[108px] z-30 animate-fade-in bg-[#091129]/40 dark:bg-[#050a1a]/70 lg:hidden" onClick={onClose} aria-hidden />
      <div id="mobile-menu" className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-7rem)] animate-pop-in overflow-y-auto border-b border-line bg-paper shadow-[var(--shadow-pop)] lg:hidden">
        <div className="container-page py-5">
          <SearchBar id="mobile-search" className="md:hidden" onSubmitted={onClose} />

          {/* Mobilde tema değiştirici satırı */}
          <div className="mt-4 md:mt-0">
            <ThemeToggleRow />
          </div>

          <p className="eyebrow mt-5">8 Eğitim Modülü</p>
          <nav aria-label="Mobil eğitim modülleri" className="mt-2.5 grid grid-cols-2 gap-2">
            {siteConfig.educationModules.map((mod) => (
              <NavLink
                key={mod.key}
                to={mod.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition',
                    isActive
                      ? 'border-ink bg-ink text-paper dark:border-sun dark:bg-sun dark:text-[#12204a]'
                      : 'border-line bg-card text-ink hover:border-ink dark:hover:border-sun/60',
                  )
                }
              >
                <ModuleIcon name={mod.icon} className="size-4 shrink-0" />
                <span className="truncate">{mod.label}</span>
              </NavLink>
            ))}
          </nav>

          <p className="eyebrow mt-5">Genel Sayfalar</p>
          <nav aria-label="Mobil menü" className="mt-2 grid gap-1 sm:grid-cols-2">
            {siteConfig.mainNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col rounded-xl px-4 py-2.5 transition',
                    isActive
                      ? 'bg-ink text-paper dark:bg-sun dark:text-[#12204a]'
                      : 'hover:bg-card',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="text-sm font-semibold">{item.label}</span>
                    {item.description && (
                      <span className={cn('text-xs', isActive ? 'text-paper/75 dark:text-[#12204a]/75' : 'text-muted')}>
                        {item.description}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-5 border-t border-line pt-5">
            {user ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <Link to="/profil" className="flex items-center gap-2 rounded-xl border border-line-strong bg-card px-4 py-3 font-semibold text-ink">
                  <User className="size-4" aria-hidden /> Profilim
                </Link>
                {isStaff && (
                  <Link to="/admin" className="flex items-center gap-2 rounded-xl border border-line-strong bg-card px-4 py-3 font-semibold text-ink">
                    <LayoutDashboard className="size-4" aria-hidden /> Yönetim Paneli
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    void signOut()
                  }}
                  className="flex items-center gap-2 rounded-xl border border-danger/30 bg-card px-4 py-3 font-semibold text-danger"
                >
                  <LogOut className="size-4" aria-hidden /> Çıkış Yap
                </button>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  onClick={() => {
                    onClose()
                    openAuth('login')
                  }}
                  icon={<LogIn className="size-4" aria-hidden />}
                >
                  Giriş Yap
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    onClose()
                    openAuth('register')
                  }}
                >
                  Ücretsiz Kayıt Ol
                </Button>
              </div>
            )}
          </div>

          <p className="mt-5 flex items-center gap-2 text-xs text-muted md:hidden">
            <Search className="size-3.5" aria-hidden /> İpucu: Arama sonuçları dersler, testler, forum ve kitapları kapsar.
          </p>
        </div>
      </div>
    </>
  )
}
