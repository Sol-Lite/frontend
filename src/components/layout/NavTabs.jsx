import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'

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

  return (
    <nav className="flex items-center gap-0.5 bg-background rounded-xl p-1">
      {TABS.map(({ label, path }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
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
