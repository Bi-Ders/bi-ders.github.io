import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

/** Basit async veri yükleme kancası: yükleniyor / hata / veri durumları */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const callId = useRef(0)

  const run = useCallback(() => {
    const id = ++callId.current
    setLoading(true)
    setError(null)
    fn()
      .then((res) => {
        if (id === callId.current) setData(res)
      })
      .catch((err: unknown) => {
        if (id === callId.current) setError(err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.')
      })
      .finally(() => {
        if (id === callId.current) setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
  }, [run])

  return { data, error, loading, reload: run, setData }
}

/** Sayfa başlığını ve meta açıklamasını ayarlar */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const prev = document.title
    document.title = title ? `${title} | Bi Ders!` : 'Bi Ders! — Ücretsiz Ders Notları, Testler ve Öğrenci Forumu'
    let meta: HTMLMetaElement | null = null
    let prevDesc: string | null = null
    if (description) {
      meta = document.querySelector('meta[name="description"]')
      prevDesc = meta?.getAttribute('content') ?? null
      meta?.setAttribute('content', description)
    }
    return () => {
      document.title = prev
      if (meta && prevDesc) meta.setAttribute('content', prevDesc)
    }
  }, [title, description])
}

/** Dışarı tıklama / Escape ile kapatma */
export function useDismiss<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])
  return ref
}

/** Gövde kaydırmasını kilitler (modal / mobil menü) */
export function useLockBody(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [locked])
}
