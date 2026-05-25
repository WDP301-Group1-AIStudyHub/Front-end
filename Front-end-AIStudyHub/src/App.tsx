import { useEffect, useState, type ReactNode } from 'react'
import LandingPage from './landingpage'
import AppSidebarLayout from './layouts/AppSidebarLayout'
import DashboardPage from './pages/DashboardPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import NewAIChatboxPage from './pages/new-AIChatboxPage'
import NewLibraryPage from './pages/new-LibraryPage'
import AdminActivityPage from './pages/admin/AdminActivityPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminDocumentsPage from './pages/admin/AdminDocumentsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
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
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Verifying session...
      </p>
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
          <a className="mt-6 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground" href="/dashboard">
            Back to dashboard
          </a>
        </section>
      </main>
    </AppSidebarLayout>
  )
}

function ProtectedRoute({
  adminOnly = false,
  children,
}: {
  adminOnly?: boolean
  children: (user: AuthUser) => ReactNode
}) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [verified, setVerified] = useState(() => Boolean(getStoredUser() && hasAuthSession()))

  useEffect(() => {
    if (!hasAuthSession()) {
      window.location.href = '/login'
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

        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      })
  }, [])

  if (!verified || !user) {
    return <AuthLoading />
  }

  if (adminOnly && user.role !== 'admin') {
    return <AdminAccessDenied />
  }

  return children(user)
}

function PublicAuthRoute({ children }: { children: ReactNode }) {
  const shouldRedirect = hasAuthSession()

  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = '/dashboard'
    }
  }, [shouldRedirect])

  if (shouldRedirect) {
    return <AuthLoading />
  }

  return children
}

function routeWithShell(page: ReactNode) {
  return <AppSidebarLayout>{page}</AppSidebarLayout>
}

function DemoAdminBootstrap() {
  useEffect(() => {
    storeAuthSession('mock-admin-token', demoAdminUser)
    window.location.href = '/admin'
  }, [])

  return <AuthLoading />
}

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/demo-admin') {
    return <DemoAdminBootstrap />
  }

  if (path === '/dashboard') {
    return (
      <ProtectedRoute>
        {() => routeWithShell(<DashboardPage />)}
      </ProtectedRoute>
    )
  }

  if (path === '/library' || path === '/new-library') {
    return (
      <ProtectedRoute>
        {() => routeWithShell(<NewLibraryPage />)}
      </ProtectedRoute>
    )
  }

  if (path === '/aichatbox' || path === '/new-aichatbox') {
    return (
      <ProtectedRoute>
        {() => routeWithShell(<NewAIChatboxPage />)}
      </ProtectedRoute>
    )
  }

  if (path === '/admin') {
    return (
      <ProtectedRoute adminOnly>
        {() => routeWithShell(<AdminDashboardPage />)}
      </ProtectedRoute>
    )
  }

  if (path === '/admin/users') {
    return (
      <ProtectedRoute adminOnly>
        {() => routeWithShell(<AdminUsersPage />)}
      </ProtectedRoute>
    )
  }

  if (path === '/admin/documents') {
    return (
      <ProtectedRoute adminOnly>
        {() => routeWithShell(<AdminDocumentsPage />)}
      </ProtectedRoute>
    )
  }

  if (path === '/admin/activity') {
    return (
      <ProtectedRoute adminOnly>
        {() => routeWithShell(<AdminActivityPage />)}
      </ProtectedRoute>
    )
  }

  if (path === '/login') {
    return (
      <PublicAuthRoute>
        <LoginPage />
      </PublicAuthRoute>
    )
  }

  if (path === '/register') {
    return (
      <PublicAuthRoute>
        <RegisterPage />
      </PublicAuthRoute>
    )
  }

  if (path === '/forgot-password') return <ForgotPasswordPage />
  if (path === '/reset-password') return <ResetPasswordPage />

  return <LandingPage />
}

export default App
