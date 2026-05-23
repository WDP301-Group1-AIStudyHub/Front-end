import LandingPage from './landingpage'
import DashboardPage from './pages/DashboardPage'
import LibraryPage from './pages/LibraryPage'
import AIChatboxPage from './pages/AIChatboxPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/dashboard')      return <DashboardPage />
  if (path === '/library')         return <LibraryPage />
  if (path === '/aichatbox')       return <AIChatboxPage />
  if (path === '/login')          return <LoginPage />
  if (path === '/register')       return <RegisterPage />
  if (path === '/forgot-password') return <ForgotPasswordPage />
  if (path === '/reset-password') return <ResetPasswordPage />

  return <LandingPage />
}

export default App
