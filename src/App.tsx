import { Component, type ErrorInfo, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { LessonsPage } from './pages/LessonsPage'
import { LessonDetailPage } from './pages/LessonDetailPage'
import { QuizzesPage } from './pages/QuizzesPage'
import { QuizRunnerPage } from './pages/QuizRunnerPage'
import { ForumPage } from './pages/ForumPage'
import { ForumDetailPage } from './pages/ForumDetailPage'
import { ResourceModulePage } from './pages/ResourceModulePage'
import { ActivitiesPage } from './pages/ActivitiesPage'
import { BooksPage } from './pages/BooksPage'
import { BookDetailPage } from './pages/BookDetailPage'
import { SearchPage } from './pages/SearchPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { AuthCallbackPage, AuthPage, ResetPasswordPage } from './pages/AuthPage'
import { ProfilePage } from './pages/ProfilePage'
import { AdminPage } from './pages/AdminPage'
import { LegalPage } from './pages/LegalPage'
import { NotFoundPage } from './pages/NotFoundPage'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Bi Ders!] Beklenmeyen arayüz hatası:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-page flex min-h-dvh flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-extrabold">Bir şeyler ters gitti</h1>
          <p className="mt-2 max-w-md text-muted">Sayfayı yenileyerek tekrar deneyebilirsiniz.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-paper dark:bg-sun dark:text-[#12204a]"
          >
            Sayfayı Yenile
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter basename={basename}>
            <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />

              {/* 8 Ana Eğitim Modülü */}
              <Route path="forum" element={<ForumPage />} />
              <Route path="forum/:id" element={<ForumDetailPage />} />
              <Route path="sunular" element={<ResourceModulePage key="sunular" module="sunular" />} />
              <Route path="ders-notlari" element={<ResourceModulePage key="ders-notlari" module="ders-notlari" />} />
              <Route path="etkinlikler" element={<ActivitiesPage />} />
              <Route path="testler" element={<QuizzesPage />} />
              <Route path="testler/:id" element={<QuizRunnerPage />} />
              <Route path="yazililar" element={<ResourceModulePage key="yazililar" module="yazililar" />} />
              <Route path="sinavlar" element={<ResourceModulePage key="sinavlar" module="sinavlar" />} />
              <Route path="evraklar" element={<ResourceModulePage key="evraklar" module="evraklar" />} />

              {/* Genel içerik sayfaları */}
              <Route path="dersler" element={<LessonsPage />} />
              <Route path="dersler/:slug" element={<LessonDetailPage />} />
              <Route path="kitaplar" element={<BooksPage />} />
              <Route path="kitaplar/:slug" element={<BookDetailPage />} />
              <Route path="ara" element={<SearchPage />} />
              <Route path="hakkimizda" element={<AboutPage />} />
              <Route path="iletisim" element={<ContactPage />} />

              {/* Kimlik doğrulama */}
              <Route path="giris" element={<AuthPage mode="login" />} />
              <Route path="kayit" element={<AuthPage mode="register" />} />
              <Route path="auth/callback" element={<AuthCallbackPage />} />
              <Route path="sifre-yenile" element={<ResetPasswordPage />} />

              {/* Korumalı sayfalar */}
              <Route
                path="profil"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute roles={['teacher', 'admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />

              {/* Yasal sayfalar */}
              <Route path="gizlilik" element={<LegalPage slug="gizlilik" />} />
              <Route path="kullanim-kosullari" element={<LegalPage slug="kullanim-kosullari" />} />
              <Route path="kvkk" element={<LegalPage slug="kvkk" />} />
              <Route path="cerez-politikasi" element={<LegalPage slug="cerez-politikasi" />} />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
