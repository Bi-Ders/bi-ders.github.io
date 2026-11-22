import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Spinner } from './Feedback'

type Variant = 'primary' | 'secondary' | 'ghost' | 'sun' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition duration-150 select-none disabled:pointer-events-none disabled:opacity-55 active:translate-y-px'

const variants: Record<Variant, string> = {
  primary:
    'bg-ink text-paper hover:bg-ink-soft shadow-[0_2px_0_0_rgb(0_0_0/0.25)] dark:bg-sun dark:text-[#12204a] dark:hover:brightness-95',
  secondary:
    'bg-card text-ink border border-line-strong hover:border-ink hover:bg-paper dark:hover:border-sun/65 dark:hover:bg-[#203673]',
  ghost: 'text-ink hover:bg-ink/6 dark:hover:bg-white/8',
  sun: 'bg-sun text-[#12204a] hover:brightness-95 shadow-[0_2px_0_0_#12204a] border border-[#12204a] dark:border-sun/80 dark:shadow-[0_2px_0_0_#091129]',
  danger: 'bg-danger text-white hover:brightness-110 dark:bg-[#dc2626] dark:text-[#f9f7f0]',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-13 px-6 text-base',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  )
})

type ButtonLinkProps = LinkProps & { variant?: Variant; size?: Size; icon?: ReactNode }

export function ButtonLink({ variant = 'primary', size = 'md', icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  )
}
