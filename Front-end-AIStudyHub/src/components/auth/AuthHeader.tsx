import PublicNav from '../shared/PublicNav'

export default function AuthHeader({ action }: { action: 'Sign Up' | 'Sign In' | 'Register' }) {
  const href = action === 'Sign In' ? '/login' : '/register'

  return <PublicNav ctaHref={href} ctaLabel={action} dashboardHref="/" showLogin={false} />
}
