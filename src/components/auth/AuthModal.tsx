import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLockBody } from '../../hooks'
import { AuthForm } from './AuthForm'

/** Header'daki "Giriş Yap" düğmesiyle açılan modal */
export function AuthModal() {
  const { authModal, closeAuth, openAuth, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDivElement>(null)
  useLockBody(authModal.open)

  // Giriş yapılınca modalı kapat
  useEffect(() => {
    if (user && authModal.open) closeAuth()
  }, [user, authModal.open, closeAuth])

  useEffect(() => {
    if (!authModal.open) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuth()
      // Basit odak tuzağı
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex]:not([tabindex="-1"])')
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('button, input')?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [authModal.open, closeAuth])

  if (!authModal.open) return null

  const next = location.pathname + location.search

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-[#091129]/50 backdrop-blur-[2px] dark:bg-[#050a1a]/75" onClick={closeAuth} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-auth-title"
        className="relative max-h-[92dvh] w-full animate-pop-in overflow-y-auto rounded-t-3xl border border-line bg-paper p-6 shadow-[var(--shadow-pop)] dark:bg-card sm:max-w-[460px] sm:rounded-3xl sm:p-8"
      >
        <button
          type="button"
          onClick={closeAuth}
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-xl text-muted transition hover:bg-ink/5 hover:text-ink dark:hover:bg-white/10"
          aria-label="Kapat"
        >
          <X className="size-5" />
        </button>
        <AuthForm
          idPrefix="modal-auth"
          initialMode={authModal.mode}
          next={next}
          onModeChange={(m) => openAuth(m)}
          onSuccess={() => {
            closeAuth()
            if (location.pathname === '/giris' || location.pathname === '/kayit') navigate('/profil')
          }}
        />
      </div>
    </div>
  )
}
