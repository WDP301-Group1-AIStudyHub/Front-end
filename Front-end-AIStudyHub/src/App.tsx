import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, Link, useNavigate } from 'react-router-dom'
import LandingPage from './landingpage'
import AppSidebarLayout from './layouts/AppSidebarLayout'
import DashboardPage from './pages/DashboardPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import NewAIChatboxPage from './pages/new-AIChatboxPage'
import NewLibraryPage from './pages/new-LibraryPage'
import AboutPage from './pages/AboutPage'
import EvaluationPage from './pages/EvaluationPage'
import UserProfilePage from './pages/UserProfilePage'
import AdminActivityPage from './pages/admin/AdminActivityPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminDocumentsPage from './pages/admin/AdminDocumentsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import { LoadingState } from './components/shared/CelestialLoading'
import AppVideoBackground from './components/shared/AppVideoBackground'
import { getCurrentUser } from './services/authApi'
import { getStoredUser, hasAuthSession, storeAuthSession } from './services/authStorage'
import type { AuthUser } from './types/auth'

const demoAdminUser: AuthUser = {
  id: 'admin-001',
  avatar: 'https://i.pravatar.cc/150?img=11',
  createdAt: '2025-08-12T09:00:00.000Z',
  email: 'arjun.admin@aistudy.edu',
  fullName: 'Arjun Sharma',
  isActive: true,
  lastLoginAt: new Date().toISOString(),
  role: 'admin',
  status: 'active',
  updatedAt: new Date().toISOString(),
}

function AuthLoading() {
  return (
    <div className="celestial-page grid min-h-svh place-items-center">
      <LoadingState className="min-h-48 w-[min(100%,420px)]" label="Verifying session..." tone="gold" />
    </div>
  )
}

function AdminAccessDenied() {
  return (
    <AppSidebarLayout>
      <main className="celestial-page flex min-h-svh items-center justify-center p-6">
        <section className="celestial-card max-w-lg p-8 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
            Admin only
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Access denied</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This workspace is limited to administrator accounts. Sign in with an admin profile
            to manage users, metadata, and system activity.
          </p>
          <Link
            className="mt-6 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            to="/dashboard"
          >
            Back to dashboard
          </Link>
        </section>
      </main>
    </AppSidebarLayout>
  )
}

function ProtectedRoute({
  adminOnly = false,
  userOnly = false,
  children,
}: {
  adminOnly?: boolean
  userOnly?: boolean
  children: (user: AuthUser) => ReactNode
}) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [verified, setVerified] = useState(() => Boolean(getStoredUser() && hasAuthSession()))
  const [redirectToLogin, setRedirectToLogin] = useState(false)

  useEffect(() => {
    if (!hasAuthSession()) {
      setRedirectToLogin(true)
      return
    }

    const storedUser = getStoredUser()
    if (storedUser) {
      setUser(storedUser)
      setVerified(true)
    }

    getCurrentUser()
      .then((currentUser) => {
        const token = localStorage.getItem('ai-study-hub:access-token') || 'mock-admin-token'
        storeAuthSession(token, currentUser)
        setUser(currentUser)
        setVerified(true)
      })
      .catch(() => {
        if (storedUser) {
          setUser(storedUser)
          setVerified(true)
          return
        }
        setRedirectToLogin(true)
      })
  }, [])

  if (redirectToLogin) {
    return <Navigate to="/login" replace />
  }

  if (!verified || !user) {
    return <AuthLoading />
  }

  if (adminOnly && user.role !== 'admin') {
    return <AdminAccessDenied />
  }

  if (userOnly && user.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return children(user)
}

function PublicAuthRoute({ children }: { children: ReactNode }) {
  if (hasAuthSession()) {
    const storedUser = getStoredUser()
    return <Navigate to={storedUser?.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }
  return children
}

function routeWithShell(page: ReactNode) {
  return <AppSidebarLayout>{page}</AppSidebarLayout>
}

function DemoAdminBootstrap() {
  const navigate = useNavigate()
  useEffect(() => {
    storeAuthSession('mock-admin-token', demoAdminUser)
    navigate('/admin', { replace: true })
  }, [navigate])
  return <AuthLoading />
}

function App() {
  return (
    <>
      <AppVideoBackground />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<PublicAuthRoute><LoginPage /></PublicAuthRoute>} />
        <Route path="/register" element={<PublicAuthRoute><RegisterPage /></PublicAuthRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/demo-admin" element={<DemoAdminBootstrap />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute userOnly>{() => routeWithShell(<DashboardPage />)}</ProtectedRoute>}
        />
        <Route
          path="/library"
          element={<ProtectedRoute userOnly>{() => routeWithShell(<NewLibraryPage />)}</ProtectedRoute>}
        />
        <Route path="/new-library" element={<Navigate to="/library" replace />} />
        <Route
          path="/aichatbox"
          element={<ProtectedRoute userOnly>{() => routeWithShell(<NewAIChatboxPage />)}</ProtectedRoute>}
        />
        <Route path="/new-aichatbox" element={<Navigate to="/aichatbox" replace />} />
        <Route
          path="/evaluation"
          element={<ProtectedRoute userOnly>{() => routeWithShell(<EvaluationPage />)}</ProtectedRoute>}
        />
        <Route
          path="/profile"
          element={<ProtectedRoute>{() => routeWithShell(<UserProfilePage />)}</ProtectedRoute>}
        />
        <Route
          path="/admin"
          element={<ProtectedRoute adminOnly>{() => routeWithShell(<AdminDashboardPage />)}</ProtectedRoute>}
        />
        <Route
          path="/admin/users"
          element={<ProtectedRoute adminOnly>{() => routeWithShell(<AdminUsersPage />)}</ProtectedRoute>}
        />
        <Route
          path="/admin/documents"
          element={<ProtectedRoute adminOnly>{() => routeWithShell(<AdminDocumentsPage />)}</ProtectedRoute>}
        />
        <Route
          path="/admin/activity"
          element={<ProtectedRoute adminOnly>{() => routeWithShell(<AdminActivityPage />)}</ProtectedRoute>}
        />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </>
  )
}

export default App
