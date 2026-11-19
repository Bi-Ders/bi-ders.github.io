import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../types'
import { EmptyState, PageSpinner } from '../ui/Feedback'
import { ButtonLink } from '../ui/Button'

/**
 * Yetki korumalı rota.
 * Not: Bu yalnızca arayüz korumasıdır; gerçek güvenlik supabase/schema.sql
 * içindeki RLS politikalarıyla veritabanında sağlanır.
 */
export function ProtectedRoute({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageSpinner label="Oturum kontrol ediliyor…" />

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/giris?next=${next}`} replace />
  }

  if (roles && (!role || !roles.includes(role))) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={<ShieldAlert className="size-7" />}
          title="Bu sayfaya erişim yetkiniz yok"
          description="Yönetim paneli yalnızca öğretmen ve yönetici hesapları içindir. Yetki almak için site yöneticisiyle iletişime geçebilirsiniz."
          action={
            <ButtonLink to="/profil" variant="secondary">
              Profilime dön
            </ButtonLink>
          }
        />
      </div>
    )
  }

  return <>{children}</>
}
