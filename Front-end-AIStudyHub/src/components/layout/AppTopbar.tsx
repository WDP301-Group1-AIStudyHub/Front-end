import { useEffect, useState, type FormEvent } from 'react'
import { CircleUserRound, Search } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { getStoredUser } from '@/services/authStorage'

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/library': 'My Document',
  '/starred': 'Starred',
  '/trash': 'Trash',
  '/subjects': 'Subjects',
  '/study-materials': 'Study Materials',
  '/aichatbox': 'AI Chatbox',
  '/evaluation': 'Evaluation',
  '/evaluation/new': 'New benchmark question',
  '/evaluation/summary': 'Evaluation summary',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'Users',
  '/admin/documents': 'Documents',
  '/admin/activity': 'Activity Log',
}

function getRouteLabel(pathname: string, search: string) {
  if (pathname.startsWith('/documents/')) return 'Document details'
  if (pathname.startsWith('/library/study/')) return 'Study session'
  if (pathname.startsWith('/evaluation/run/')) return 'Run benchmark'
  if (pathname === '/library' && new URLSearchParams(search).get('view') === 'shared') {
    return 'Shared with me'
  }
  return routeLabels[pathname] ?? 'AI Study Hub'
}

export default function AppTopbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const storedUser = getStoredUser()
  const isAdmin = storedUser?.role === 'admin' || location.pathname.startsWith('/admin')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (location.pathname !== '/library') return
    setQuery(new URLSearchParams(location.search).get('q') ?? '')
  }, [location.pathname, location.search])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedQuery = query.trim()
    navigate(normalizedQuery ? `/library?q=${encodeURIComponent(normalizedQuery)}` : '/library')
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b border-border bg-background/95 px-4 py-2">
      <SidebarTrigger aria-label="Toggle navigation" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {getRouteLabel(location.pathname, location.search)}
        </p>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">
          {isAdmin ? 'Administration workspace' : 'AI Study Hub workspace'}
        </p>
      </div>

      {!isAdmin ? (
        <form className="relative w-[min(32rem,42vw)] max-md:hidden" onSubmit={handleSearch} role="search">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Search documents"
            className="h-9 bg-muted/60 pl-9 pr-3"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documents"
            type="search"
            value={query}
          />
        </form>
      ) : null}

      <Button asChild aria-label="Open settings" className="shrink-0" size="icon-sm" variant="ghost">
        <Link to="/settings">
          <CircleUserRound aria-hidden="true" />
          <span className="sr-only">Settings</span>
        </Link>
      </Button>
    </header>
  )
}
