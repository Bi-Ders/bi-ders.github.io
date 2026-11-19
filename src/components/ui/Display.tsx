import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../../config/site'
import { cn, initials, roleLabels } from '../../lib/utils'
import type { Role } from '../../types'

// ---------------------------------------------------------------
// Logo — site.ts içindeki logoUrl / logoText değerlerini kullanır
// ---------------------------------------------------------------
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-9', className)} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#12204A" />
      <path d="M14 18c6-2.5 12-2.5 18 1v28c-6-3.5-12-3.5-18-1z" fill="#FAF7F0" />
      <path d="M50 18c-6-2.5-12-2.5-18 1v28c6-3.5 12-3.5 18-1z" fill="#F5B82E" />
      <circle cx="49" cy="15" r="5" fill="#2F55D4" stroke="#12204A" strokeWidth="2" />
    </svg>
  )
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn('group inline-flex items-center gap-2.5', className)} aria-label={`${siteConfig.name} ana sayfa`}>
      {siteConfig.logoUrl ? (
        <img src={siteConfig.logoUrl} alt="" className="h-9 w-auto" />
      ) : (
        <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      )}
      {!compact && (
        <span className="font-display text-[22px] leading-none font-extrabold tracking-[-0.03em] text-ink">
          {siteConfig.logoText.main}
          <span className="text-brand">{siteConfig.logoText.accent}</span>
        </span>
      )}
    </Link>
  )
}

// ---------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------
const avatarColors = ['bg-brand text-white', 'bg-sun text-ink', 'bg-success text-white', 'bg-ink text-paper', 'bg-[#9A3B8C] text-white']

export function Avatar({ name, src, size = 'md', className }: { name: string | null | undefined; src?: string | null; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const dim = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg', xl: 'size-24 text-3xl' }[size]
  const color = avatarColors[(name ?? '').length % avatarColors.length]
  if (src) {
    return <img src={src} alt="" className={cn('shrink-0 rounded-full object-cover ring-2 ring-white', dim, className)} referrerPolicy="no-referrer" />
  }
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-full font-bold ring-2 ring-white', dim, color, className)} aria-hidden>
      {initials(name)}
    </span>
  )
}

// ---------------------------------------------------------------
// Rozetler
// ---------------------------------------------------------------
type BadgeTone = 'neutral' | 'brand' | 'sun' | 'success' | 'danger' | 'ink'

export function Badge({ tone = 'neutral', children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  const tones: Record<BadgeTone, string> = {
    neutral: 'bg-paper-deep text-ink-soft',
    brand: 'bg-brand-soft text-brand-dark',
    sun: 'bg-sun-soft text-sun-dark',
    success: 'bg-success-soft text-success',
    danger: 'bg-danger-soft text-danger',
    ink: 'bg-ink text-paper',
  }
  return <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold', tones[tone], className)}>{children}</span>
}

export function RoleBadge({ role }: { role: Role }) {
  const tone: BadgeTone = role === 'admin' ? 'ink' : role === 'teacher' ? 'brand' : 'neutral'
  return <Badge tone={tone}>{roleLabels[role]}</Badge>
}

export function CategoryTag({ name, color, className }: { name: string; color?: string | null; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft', className)}>
      <span className="size-2 rounded-full" style={{ backgroundColor: color ?? 'var(--color-brand)' }} aria-hidden />
      {name}
    </span>
  )
}

// ---------------------------------------------------------------
// Sayfa başlığı
// ---------------------------------------------------------------
export function PageHeader({ eyebrow, title, description, actions, children }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="border-b border-line bg-paper-deep/60">
      <div className="container-page py-10 sm:py-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl animate-fade-up">
            {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
            <h1 className="text-3xl font-extrabold sm:text-[42px] sm:leading-[1.1]">{title}</h1>
            {description && <p className="mt-3 text-[17px] leading-relaxed text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
        </div>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </header>
  )
}

// ---------------------------------------------------------------
// Filtre çipleri
// ---------------------------------------------------------------
export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition',
        active ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-white text-ink-soft hover:border-ink hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
