import type { ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { cn } from '../../lib/utils'

// ---------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------
export function Spinner({ size = 'md', className, label }: { size?: 'sm' | 'md' | 'lg'; className?: string; label?: string }) {
  const dim = { sm: 'size-4 border-2', md: 'size-6 border-[2.5px]', lg: 'size-10 border-[3px]' }[size]
  return (
    <span role="status" className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('animate-spin rounded-full border-current border-r-transparent', dim)} aria-hidden />
      <span className="sr-only">{label ?? 'Yükleniyor…'}</span>
    </span>
  )
}

export function PageSpinner({ label = 'Yükleniyor…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted">
      <Spinner size="lg" className="text-brand" label={label} />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

// ---------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}

export function CardSkeleton() {
  return (
    <div className="card p-5" aria-hidden>
      <Skeleton className="h-5 w-24" />
      <Skeleton className="mt-4 h-6 w-11/12" />
      <Skeleton className="mt-2 h-6 w-2/3" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <div className="mt-6 flex items-center gap-3">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  )
}

export function RowSkeleton() {
  return (
    <div className="flex items-start gap-4 px-5 py-4" aria-hidden>
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/3" />
      </div>
      <Skeleton className="hidden h-8 w-14 sm:block" />
    </div>
  )
}

export function GridSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-3', className)} role="status" aria-label="İçerik yükleniyor">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------
// Boş durum ve hata durumu
// ---------------------------------------------------------------
type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-card/70 px-6 py-14 text-center', className)}>
      {icon && (
        <div className="mb-4 grid size-14 place-items-center rounded-2xl border border-ink bg-sun-soft text-ink shadow-[0_2px_0_0_var(--color-ink)] dark:border-sun/45 dark:text-sun dark:shadow-none">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-[15px] text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-danger/30 bg-danger-soft px-6 py-10 text-center">
      <AlertTriangle className="size-8 text-danger" aria-hidden />
      <h3 className="mt-3 text-lg font-bold">Bir sorun oluştu</h3>
      <p className="mt-1 max-w-md text-[15px] text-ink-soft">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-line-strong bg-card px-4 py-2 text-sm font-semibold text-ink hover:bg-paper"
        >
          <RotateCcw className="size-4" aria-hidden /> Tekrar dene
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------
// Uyarı kutusu
// ---------------------------------------------------------------
export function Alert({ tone = 'info', children, className }: { tone?: 'info' | 'success' | 'error' | 'warning'; children: ReactNode; className?: string }) {
  const tones = {
    info: 'bg-brand-soft text-ink border-brand/25',
    success: 'bg-success-soft text-success border-success/25',
    error: 'bg-danger-soft text-danger border-danger/25',
    warning: 'bg-sun-soft text-ink border-sun-dark/25 dark:border-sun/35',
  }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-xl border px-4 py-3 text-sm font-medium', tones[tone], className)}>
      {children}
    </div>
  )
}
