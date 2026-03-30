import { Sun, Moon } from 'lucide-react'
import useUIStore from '@/store/useUIStore'
import useAuthStore from '@/store/useAuthStore'
import { userApi } from '@/api/user'

const FONT_SIZE_CYCLE = { sm: 'md', md: 'lg', lg: 'sm' }

const FONT_SIZE_STYLE = {
  sm: { a: 'text-[9px]',  A: 'text-[12px]' },
  md: { a: 'text-[10px]', A: 'text-[14px]' },
  lg: { a: 'text-[11px]', A: 'text-[17px]' },
}

export function FontSizeButton() {
  const { fontSize, setFontSize } = useUIStore()
  const { a: aSize, A: ASize } = FONT_SIZE_STYLE[fontSize] ?? FONT_SIZE_STYLE.md

  function handleClick() {
    setFontSize(FONT_SIZE_CYCLE[fontSize] ?? 'md')
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-muted transition-colors"
      aria-label="글꼴 크기 변경"
    >
      <span className="text-foreground-secondary font-semibold leading-none select-none tracking-tight">
        <span className={aSize}>a</span><span className={ASize}>A</span>
      </span>
    </button>
  )
}

export function ThemeButton() {
  const { theme, setTheme } = useUIStore()
  const { isAuthenticated } = useAuthStore()

  function handleClick() {
    const next = theme === 'dark' ? 'light' : 'dark'
    const prev = theme
    setTheme(next)
    if (isAuthenticated) {
      userApi.updateTheme(next.toUpperCase()).catch(() => setTheme(prev))
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-muted transition-colors"
      aria-label="화면 테마 전환"
    >
      {theme === 'dark'
        ? <Moon className="w-4 h-4 text-foreground-secondary" strokeWidth={2} />
        : <Sun  className="w-4 h-4 text-foreground-secondary" strokeWidth={2} />
      }
    </button>
  )
}
