import PriceChange from '@/components/ui/PriceChange'
import StockAvatar from '@/components/ui/StockAvatar'
import WidgetCard from './WidgetCard'
import { WATCHLIST } from '@/mocks/home'

const WATCHLIST_EXTENDED = [
  ...WATCHLIST,
  { name: 'POSCO홀딩스', label: 'P',  color: 'warning', price: '₩378,500', change:  0.53, volume: '0.4조' },
  { name: 'SK하이닉스',  label: 'SK', color: 'yellow',  price: '₩195,500', change:  2.35, volume: '3.8조' },
]

const WATCHLIST_WITH_VOLUME = WATCHLIST.map((s, i) => ({
  ...s,
  volume: ['5.2조', '0.7조', '0.3조'][i] ?? '-',
}))

export default function WatchlistWidget({ variant = 'watchlist-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  if (variant === 'watchlist-wide') {
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
        {/* 테이블 헤더 */}
        <div className="flex items-center px-1 pb-1 border-b border-stroke-subtle shrink-0">
          <span className="flex-[2] text-[8px] text-foreground-disabled">종목</span>
          <span className="flex-[2] text-[8px] text-foreground-disabled text-right">현재가</span>
          <span className="flex-1 text-[8px] text-foreground-disabled text-right">등락</span>
          <span className="flex-1 text-[8px] text-foreground-disabled text-right">거래량</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {WATCHLIST_WITH_VOLUME.map((stock) => (
            <div key={stock.name} className="flex items-center px-1 py-1.5 hover:bg-surface-subtle rounded-xl transition-colors cursor-pointer">
              <span className="flex-[2] text-[10px] font-semibold text-foreground truncate">{stock.name}</span>
              <span className="flex-[2] text-[10px] text-foreground text-right">{stock.price}</span>
              <div className="flex-1 flex justify-end">
                <PriceChange value={stock.change} className="text-[10px]" />
              </div>
              <span className="flex-1 text-[9px] text-foreground-disabled text-right">{stock.volume}</span>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* watchlist-sm (default) */
  const items = WATCHLIST_EXTENDED.slice(0, 4)
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
      <div className="flex-1 flex flex-col gap-0.5 justify-between">
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
