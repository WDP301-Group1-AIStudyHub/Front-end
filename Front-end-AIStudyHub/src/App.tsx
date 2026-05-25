import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import LandingPage from "./landingpage";
import AppSidebarLayout from "./layouts/AppSidebarLayout";
import DashboardPage from "./pages/DashboardPage";
import LibraryPage from "./pages/LibraryPage";
import AIChatboxPage from "./pages/AIChatboxPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import NewAIChatboxPage from "./pages/new-AIChatboxPage";
import NewLibraryPage from "./pages/new-LibraryPage";
import { getCurrentUser } from "./services/authApi";
import { hasAuthSession } from "./services/authStorage";

function AuthLoading() {
  return (
    <div className="grid min-h-svh place-items-center bg-[#0e0e0e] text-[#e5e2e1]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
        Verifying session...
      </p>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!hasAuthSession()) {
      window.location.href = "/login";
      return;
    }

    getCurrentUser()
      .then(() => setVerified(true))
      .catch(() => {
        setVerified(false);
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      });
  }, []);

  if (!verified) {
    return <AuthLoading />;
  }

  return children;
}

function PublicAuthRoute({ children }: { children: ReactNode }) {
  const shouldRedirect = hasAuthSession();

  useEffect(() => {
    if (!shouldRedirect) {
      return;
    }

    window.location.href = "/dashboard";
  }, [shouldRedirect]);

  if (shouldRedirect) {
    return <AuthLoading />;
  }

  return children;
}

function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  if (path === "/dashboard") {
    return (
      <ProtectedRoute>
        <AppSidebarLayout>
          <DashboardPage />
        </AppSidebarLayout>
      </ProtectedRoute>
    );
  }

  if (path === "/library") {
    return (
      <ProtectedRoute>
        <AppSidebarLayout>
          <LibraryPage />
        </AppSidebarLayout>
      </ProtectedRoute>
    );
  }

  if (path === "/aichatbox") {
    return (
      <ProtectedRoute>
        <AppSidebarLayout>
          <AIChatboxPage />
        </AppSidebarLayout>
      </ProtectedRoute>
    );
  }

  if (path === "/new-aichatbox") {
    return (
      <ProtectedRoute>
        <AppSidebarLayout>
          <NewAIChatboxPage />
        </AppSidebarLayout>
      </ProtectedRoute>
    );
  }

  if (path === "/new-library") {
    return (
      <ProtectedRoute>
        <AppSidebarLayout>
          <NewLibraryPage />
        </AppSidebarLayout>
      </ProtectedRoute>
    );
  }

  if (path === "/login") {
    return (
      <PublicAuthRoute>
        <LoginPage />
      </PublicAuthRoute>
    );
  }

  if (path === "/register") {
    return (
      <PublicAuthRoute>
        <RegisterPage />
      </PublicAuthRoute>
    );
  }

  if (path === "/forgot-password") return <ForgotPasswordPage />;
  if (path === "/reset-password") return <ResetPasswordPage />;

  return <LandingPage />;
}

export default App;
