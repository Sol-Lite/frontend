import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { LAST_INVEST_PATH_KEY, LAST_INVEST_STATE_KEY } from '@/features/invest/navigation'

const TABS = [
  { label: '홈',  path: '/' },
  { label: '시세', path: '/market' },
  { label: '주문', path: '/invest' },
  { label: '잔고', path: '/asset' },
]

export default function NavTabs() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  function handleNavigate(path) {
    if (path !== '/invest') {
      navigate(path)
      return
    }

    const lastInvestPath = sessionStorage.getItem(LAST_INVEST_PATH_KEY) || '/invest'
    const savedState = sessionStorage.getItem(LAST_INVEST_STATE_KEY)

    let parsedState
    try {
      parsedState = savedState ? JSON.parse(savedState) : undefined
    } catch {
      parsedState = undefined
    }

    navigate(lastInvestPath, { state: parsedState })
  }

  return (
    <nav className="flex items-center gap-0.5 bg-background rounded-xl p-1">
      {TABS.map(({ label, path }) => (
        <button
          key={path}
          onClick={() => handleNavigate(path)}
          className={cn(
            'px-4 py-1.5 text-[12px] rounded-lg transition-colors duration-[150ms]',
            isActive(path)
              ? 'bg-surface text-foreground font-semibold shadow-sm'
              : 'text-foreground-disabled hover:text-foreground-secondary',
          )}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
