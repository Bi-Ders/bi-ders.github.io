import { createContext, useCallback, useContext, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { flushSync } from 'react-dom'

export type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  isDark: boolean
  setTheme: (next: Theme, event?: MouseEvent<HTMLElement>) => void
  toggleTheme: (event?: MouseEvent<HTMLElement>) => void
}

const STORAGE_KEY = 'biders-theme'

type ViewTransition = {
  ready: Promise<void>
  finished: Promise<void>
}

type DocumentWithTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition
}

function getInitialTheme(): Theme {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'dark'
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    /* depolama kapalıysa sistem temasını kullan */
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function syncDocumentTheme(next: Theme) {
  const root = document.documentElement
  const isDark = next === 'dark'
  root.classList.toggle('dark', isDark)
  root.style.colorScheme = isDark ? 'dark' : 'light'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', isDark ? '#12204a' : '#faf7f0')
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    syncDocumentTheme(theme)
  }, [theme])

  // Kullanıcı açıkça tercih kaydetmediyse sistem tema değişikliklerini canlı izle
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const onSystemChange = (e: MediaQueryListEvent) => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'dark' || saved === 'light') return
      } catch {
        /* ignore */
      }
      const next: Theme = e.matches ? 'dark' : 'light'
      syncDocumentTheme(next)
      setThemeState(next)
    }
    mq.addEventListener('change', onSystemChange)
    return () => mq.removeEventListener('change', onSystemChange)
  }, [])

  // Farklı sekmeler arasında tema senkronizasyonu
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      if (e.newValue === 'dark' || e.newValue === 'light') {
        syncDocumentTheme(e.newValue)
        setThemeState(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const applyThemeWithTransition = useCallback((next: Theme, event?: MouseEvent<HTMLElement>) => {
    const commit = () => {
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      syncDocumentTheme(next)
      setThemeState(next)
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const doc = document as DocumentWithTransition

    if (!doc.startViewTransition || prefersReducedMotion) {
      commit()
      return
    }

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2

    if (event) {
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX === 0 && event.clientY === 0) {
        // Klavye (Enter/Space) ile tetiklendiyse butonun merkezinden aç
        x = rect.left + rect.width / 2
        y = rect.top + rect.height / 2
      } else {
        x = event.clientX
        y = event.clientY
      }
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    const transition = doc.startViewTransition(() => {
      flushSync(commit)
    })

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 480,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        )
      })
      .catch(() => {
        // Geçiş desteklenmez veya iptal edilirse tema zaten uygulanmış olur
      })
  }, [])

  const toggleTheme = useCallback(
    (event?: MouseEvent<HTMLElement>) => {
      applyThemeWithTransition(theme === 'dark' ? 'light' : 'dark', event)
    },
    [theme, applyThemeWithTransition],
  )

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme: applyThemeWithTransition,
      toggleTheme,
    }),
    [theme, applyThemeWithTransition, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme, ThemeProvider içinde kullanılmalıdır.')
  return ctx
}
