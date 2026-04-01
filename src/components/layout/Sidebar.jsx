import { LayoutGrid, TrendingUp, ArrowLeftRight, Wallet } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'

const ITEMS = [
  { icon: LayoutGrid,     path: '/',       label: '홈' },
  { icon: TrendingUp,     path: '/market', label: '시세' },
  { icon: ArrowLeftRight, path: '/invest', label: '주문' },
  { icon: Wallet,         path: '/asset',  label: '자산' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  return (
    <aside className="w-sidebar flex flex-col items-center py-3 gap-1 bg-surface border-r border-stroke shrink-0">
      {ITEMS.map(({ icon: Icon, path, label }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          title={label}
          className={cn(
            'w-9 h-9 flex items-center justify-center rounded-xl transition-colors duration-[150ms]',
            isActive(path)
              ? 'bg-primary-light text-primary'
              : 'text-foreground-disabled hover:text-foreground-secondary hover:bg-background',
          )}
        >
          <Icon className="w-[18px] h-[18px]" strokeWidth={isActive(path) ? 2.5 : 2} />
        </button>
      ))}
    </aside>
  )
}
