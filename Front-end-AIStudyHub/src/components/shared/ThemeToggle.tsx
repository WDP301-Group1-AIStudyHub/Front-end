import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '../../useTheme'

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={compact ? 'rounded-full' : 'gap-2 rounded-full px-3'}
      onClick={toggleTheme}
      size={compact ? 'icon-sm' : 'sm'}
      type="button"
      variant="outline"
    >
      {isDark ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
      {!compact ? <span>{isDark ? 'Dark' : 'Light'}</span> : null}
    </Button>
  )
}
