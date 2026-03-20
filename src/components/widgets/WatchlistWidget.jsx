import PriceChange from '@/components/ui/PriceChange'
import WidgetCard from './WidgetCard'
import { WATCHLIST } from '@/mocks/home'

const WATCHLIST_EXTENDED = [
  ...WATCHLIST,
  { name: 'POSCO홀딩스', label: 'P',  color: 'warning', price: '₩378,500', change:  0.53, volume: '0.4조' },
  { name: 'SK하이닉스',  label: 'SK', color: 'yellow',  price: '₩195,500', change:  2.35, volume: '3.8조' },
]


export default function WatchlistWidget({ variant = 'watchlist-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  if (variant === 'watchlist-wide') {
    const items = WATCHLIST_EXTENDED.slice(0, 5)
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
        <div className="flex-1 flex flex-col gap-1.5 min-h-0">
          {items.map(({ name, price, change }) => (
            <div key={name} className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium text-foreground truncate">{name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-semibold text-foreground">{price}</span>
                <PriceChange value={change} className="text-[9px] font-medium" />
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* watchlist-sm (default) */
  const items = WATCHLIST_EXTENDED.slice(0, 5)
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
      <div className="flex-1 flex flex-col gap-1.5 min-h-0">
        {items.map((stock) => (
          <div key={stock.name} className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-foreground">{stock.name}</span>
            <PriceChange value={stock.change} className="text-[9px] font-semibold" />
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
