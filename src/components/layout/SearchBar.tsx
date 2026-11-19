import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { cn } from '../../lib/utils'

type SearchBarProps = {
  id: string
  className?: string
  size?: 'md' | 'lg'
  autoFocus?: boolean
  onSubmitted?: () => void
  placeholder?: string
}

/** Hızlı arama: /ara?q=... sayfasına yönlendirir */
export function SearchBar({ id, className, size = 'md', autoFocus, onSubmitted, placeholder = 'Konu, test, kitap ara…' }: SearchBarProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [value, setValue] = useState(params.get('q') ?? '')

  useEffect(() => {
    setValue(params.get('q') ?? '')
  }, [params])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    navigate(`/ara?q=${encodeURIComponent(q)}`)
    onSubmitted?.()
  }

  return (
    <form role="search" onSubmit={onSubmit} className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        Sitede ara
      </label>
      <Search
        className={cn('pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted', size === 'lg' ? 'size-5' : 'size-4')}
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        enterKeyHint="search"
        autoComplete="off"
        className={cn(
          'w-full rounded-xl border border-line-strong bg-white text-ink placeholder:text-muted/90 transition outline-none focus:border-brand focus:shadow-[0_0_0_4px_rgb(47_85_212/0.15)]',
          size === 'lg' ? 'h-14 pr-28 pl-11 text-base' : 'h-10 pr-3 pl-10 text-sm',
        )}
      />
      {size === 'lg' && (
        <button
          type="submit"
          className="absolute top-1/2 right-2 h-10 -translate-y-1/2 rounded-lg bg-ink px-4 text-sm font-semibold text-paper transition hover:bg-ink-soft"
        >
          Ara
        </button>
      )}
    </form>
  )
}
