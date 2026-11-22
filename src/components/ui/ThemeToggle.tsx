import { useId, type MouseEvent } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'

/**
 * Bi Ders! renk paletine (#12204a, #f5b82e, #f9f7f0) özel minimal SVG güneş/ay ikonu.
 * Tema geçişinde maske ve ışınlar yumuşak biçimde dönerek morph olur.
 */
export function ThemeGlyph({ isDark, className }: { isDark: boolean; className?: string }) {
  const maskId = useId()

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-[19px] overflow-visible', className)}
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width="24" height="24" fill="white" />
          {/* Aydınlık modda ayı oluşturan kesik; karanlık modda güneş ortaya çıkarken kayar */}
          <circle
            cx={isDark ? 25 : 16.5}
            cy={isDark ? 4 : 7.5}
            r={isDark ? 0.5 : 5.8}
            fill="black"
            className="transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          />
        </mask>
      </defs>

      {/* Güneş ışınları — karanlık modda sıcak sarı (#f5b82e) olarak hafifçe dönerek açılır */}
      <g
        stroke="#f5b82e"
        strokeWidth="1.9"
        strokeLinecap="round"
        style={{
          transformOrigin: '12px 12px',
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-45deg) scale(0.45)',
          opacity: isDark ? 1 : 0,
        }}
        className="transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        <line x1="12" y1="2.1" x2="12" y2="4.2" />
        <line x1="12" y1="19.8" x2="12" y2="21.9" />
        <line x1="2.1" y1="12" x2="4.2" y2="12" />
        <line x1="19.8" y1="12" x2="21.9" y2="12" />
        <line x1="5" y1="5" x2="6.5" y2="6.5" />
        <line x1="17.5" y1="17.5" x2="19" y2="19" />
        <line x1="19" y1="5" x2="17.5" y2="6.5" />
        <line x1="6.5" y1="17.5" x2="5" y2="19" />
      </g>

      {/* Ana gövde: aydınlıkta #12204a hilal, karanlıkta #f5b82e güneş çekirdeği */}
      <circle
        cx="12"
        cy="12"
        r={isDark ? 5 : 6.7}
        mask={`url(#${maskId})`}
        fill={isDark ? '#f5b82e' : '#12204a'}
        style={{
          transformOrigin: '12px 12px',
          transform: isDark ? 'rotate(0deg)' : 'rotate(-18deg)',
        }}
        className="transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      />

      {/* Aydınlık modda hilalin yanında markaya özgü sıcak sarı yıldız noktası */}
      <circle
        cx="18.2"
        cy="6.2"
        r="1.35"
        fill="#f5b82e"
        style={{
          transformOrigin: '18.2px 6.2px',
          transform: isDark ? 'scale(0)' : 'scale(1)',
          opacity: isDark ? 0 : 1,
        }}
        className="transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
      />
    </svg>
  )
}

/** Masaüstü üst çubuk için minimal yuvarlak tema değiştirici */
export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme()
  const label = isDark ? 'Aydınlık Moda Geç' : 'Karanlık Moda Geç'

  return (
    <button
      id="theme-toggle"
      type="button"
      onClick={(e) => toggleTheme(e)}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      className={cn(
        'group relative grid size-10 shrink-0 place-items-center rounded-full border border-line-strong bg-card transition duration-200 hover:border-ink hover:bg-paper-deep active:scale-95 dark:border-line-strong dark:bg-card dark:hover:border-sun/70 dark:hover:bg-[#203673]',
        className,
      )}
    >
      <ThemeGlyph isDark={isDark} className="transition-transform duration-300 group-hover:scale-105" />
    </button>
  )
}

/** Mobil hamburger menüsü için şık tema değiştirme satırı */
export function ThemeToggleRow({ onAfterToggle }: { onAfterToggle?: () => void }) {
  const { isDark, toggleTheme } = useTheme()

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    toggleTheme(e)
    onAfterToggle?.()
  }

  return (
    <button
      id="mobile-theme-toggle"
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={handleClick}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line-strong bg-card px-4 py-3 text-left transition hover:border-ink dark:hover:border-sun/60"
    >
      <span className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-paper-deep dark:border-line-strong dark:bg-[#0d1838]">
          <ThemeGlyph isDark={isDark} />
        </span>
        <span>
          <span className="block text-sm font-bold text-ink">
            {isDark ? 'Aydınlık Mod' : 'Karanlık Mod'}
          </span>
          <span className="block text-xs text-muted">
            {isDark ? 'Sıcak kâğıt temasına geç' : 'Göz yormayan lacivert temaya geç'}
          </span>
        </span>
      </span>

      {/* Minimal anahtar göstergesi */}
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors duration-300',
          isDark
            ? 'border-sun/60 bg-sun/25'
            : 'border-line-strong bg-paper-deep',
        )}
      >
        <span
          className={cn(
            'size-4 rounded-full shadow-xs transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            isDark ? 'translate-x-5 bg-sun' : 'translate-x-0 bg-[#12204a]',
          )}
        />
      </span>
    </button>
  )
}
