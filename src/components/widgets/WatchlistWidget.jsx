import PriceChange from '@/components/ui/PriceChange'
import StockAvatar from '@/components/ui/StockAvatar'
import WidgetCard from './WidgetCard'
import { WATCHLIST } from '@/mocks/home'

export default function WatchlistWidget() {
  return (
    <WidgetCard>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">관심 종목</span>
        <button
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] text-primary font-semibold hover:underline"
        >
          + 추가
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-between gap-0.5">
        {WATCHLIST.map((stock, i) => (
          <div key={stock.name}>
            <div className="flex items-center gap-2 py-1 hover:bg-surface-subtle rounded-xl px-1 transition-colors cursor-pointer">
              <StockAvatar name={stock.label} color={stock.color} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-foreground leading-none">{stock.name}</div>
                <div className="text-[9px] text-foreground-disabled">{stock.price}</div>
              </div>
              <PriceChange value={stock.change} className="text-[10px]" />
            </div>
            {i < WATCHLIST.length - 1 && <div className="h-px bg-stroke-subtle mx-1" />}
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
