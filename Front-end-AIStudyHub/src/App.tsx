import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, Link, useNavigate } from 'react-router-dom'
import AppSidebarLayout from './layouts/AppSidebarLayout'
import { LoadingState } from './components/shared/CelestialLoading'
import BackgroundUploadWidget from './components/upload/BackgroundUploadWidget'
import ConflictModal from './components/upload/ConflictModal'
import { getCurrentUser } from './services/authApi'
import { getStoredToken, getStoredUser, hasAuthSession, storeAuthSession } from './services/authStorage'
import type { AuthUser } from './types/auth'

const LandingPage = lazy(() => import('./landingpage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const NewLibraryPage = lazy(() => import('./pages/new-LibraryPage'));
const DocumentDetailPage = lazy(() => import('./pages/DocumentDetailPage'));
const StudyMaterialsPage = lazy(() => import('./pages/StudyMaterialsPage'));
const StudyMaterialsListPage = lazy(() => import('./pages/StudyMaterialsListPage'));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage'));
const NewAIChatboxPage = lazy(() => import('./pages/new-AIChatboxPage'));
const EvaluationPage = lazy(() => import('./pages/evaluation/EvaluationPage'));
const NewQuestion = lazy(() => import('./pages/evaluation/NewQuestion'));
const RunBenchmark = lazy(() => import('./pages/evaluation/RunBenchmark'));
const Summary = lazy(() => import('./pages/evaluation/Summary'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminDocumentsPage = lazy(() => import('./pages/admin/AdminDocumentsPage'));
const AdminActivityPage = lazy(() => import('./pages/admin/AdminActivityPage'));

const demoAdminUser: AuthUser = {
  id: "admin-001",
  createdAt: "2025-08-12T09:00:00.000Z",
  email: "arjun.admin@aistudy.edu",
  fullName: "Arjun Sharma",
  isActive: true,
  lastLoginAt: new Date().toISOString(),
  role: "admin",
  status: "active",
  updatedAt: new Date().toISOString(),
};

function AuthLoading() {
  return (
    <div className="moonlit-page grid min-h-svh place-items-center">
      <LoadingState className="min-h-48 w-[min(100%,420px)]" label="Verifying session..." tone="gold" />
    </div>
  );
}

function AdminAccessDenied() {
  return (
    <AppSidebarLayout>
      <main className="moonlit-page flex min-h-svh items-center justify-center p-6">
        <section className="botanical-bento max-w-lg p-8 text-center">
          <p className="botanical-kicker mb-3 justify-center">
            Admin only
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Access denied
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This workspace is limited to administrator accounts. Sign in with an
            admin profile to manage users, metadata, and system activity.
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
  );
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
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [verified, setVerified] = useState(() =>
    Boolean(getStoredUser() && hasAuthSession())
  );
  const [redirectToLogin, setRedirectToLogin] = useState(false);

  useEffect(() => {
    if (!hasAuthSession()) {
      setRedirectToLogin(true);
      return;
    }

    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setVerified(true);
    }

    getCurrentUser()
      .then((currentUser) => {
        const token = getStoredToken() || "mock-admin-token";
        storeAuthSession(token, currentUser);
        setUser(currentUser);
        setVerified(true);
      })
      .catch(() => {
        if (storedUser) {
          setUser(storedUser);
          setVerified(true);
          return;
        }
        setRedirectToLogin(true);
      });
  }, []);

  if (redirectToLogin) {
    return <Navigate to="/login" replace />;
  }

  if (!verified || !user) {
    return <AuthLoading />;
  }

  if (adminOnly && user.role !== "admin") {
    return <AdminAccessDenied />;
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
  return children;
}

function routeWithShell(page: ReactNode) {
  return <AppSidebarLayout>{page}</AppSidebarLayout>;
}

function DemoAdminBootstrap() {
  const navigate = useNavigate();
  useEffect(() => {
    storeAuthSession("mock-admin-token", demoAdminUser);
    navigate("/admin", { replace: true });
  }, [navigate]);
  return <AuthLoading />;
}

function App() {
  return (
    <>
      <Suspense fallback={<AuthLoading />}>
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
          <Route
            path="/documents/:id"
            element={<ProtectedRoute userOnly>{() => routeWithShell(<DocumentDetailPage />)}</ProtectedRoute>}
          />
          <Route
            path="/study-materials"
            element={<ProtectedRoute userOnly>{() => routeWithShell(<StudyMaterialsListPage />)}</ProtectedRoute>}
          />
          <Route
            path="/library/study/:materialId"
            element={<ProtectedRoute userOnly>{() => routeWithShell(<StudyMaterialsPage />)}</ProtectedRoute>}
          />
          <Route
            path="/subjects"
            element={<ProtectedRoute userOnly>{() => routeWithShell(<SubjectsPage />)}</ProtectedRoute>}
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
            path="/evaluation/new"
            element={<ProtectedRoute userOnly>{() => routeWithShell(<NewQuestion />)}</ProtectedRoute>}
          />
          <Route
            path="/evaluation/run/:questionId"
            element={<ProtectedRoute userOnly>{() => routeWithShell(<RunBenchmark />)}</ProtectedRoute>}
          />
          <Route
            path="/evaluation/summary"
            element={<ProtectedRoute userOnly>{() => routeWithShell(<Summary />)}</ProtectedRoute>}
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
      </Suspense>
      <BackgroundUploadWidget />
      <ConflictModal />
    </>
  )
}

export default App;
