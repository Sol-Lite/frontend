import PriceChange from '@/components/ui/PriceChange'
import StockAvatar from '@/components/ui/StockAvatar'
import WidgetCard from './WidgetCard'
import { WATCHLIST } from '@/mocks/home'

const WATCHLIST_EXTENDED = [
  ...WATCHLIST,
  { name: 'POSCO홀딩스', label: 'P',  color: 'warning', price: '₩378,500', change:  0.53 },
  { name: 'SK하이닉스',  label: 'SK', color: 'yellow',  price: '₩195,500', change:  2.35 },
]

export default function WatchlistWidget({ variant = 'watchlist-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const items = variant === 'watchlist-sm' ? WATCHLIST : WATCHLIST_EXTENDED

  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">관심 종목</span>
        <button
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] text-primary font-semibold hover:underline"
        >
          + 추가
        </button>
      </div>
      <div className={`flex-1 flex flex-col gap-0.5 ${variant === 'watchlist-sm' ? 'justify-between' : 'min-h-0 overflow-y-auto'}`}>
        {items.map((stock, i) => (
          <div key={stock.name}>
            <div className="flex items-center gap-2 py-1 hover:bg-surface-subtle rounded-xl px-1 transition-colors cursor-pointer">
              <StockAvatar name={stock.label} color={stock.color} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-foreground leading-none">{stock.name}</div>
                <div className="text-[9px] text-foreground-disabled">{stock.price}</div>
              </div>
              <PriceChange value={stock.change} className="text-[10px]" />
            </div>
            {i < items.length - 1 && <div className="h-px bg-stroke-subtle mx-1" />}
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
