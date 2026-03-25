import PriceChange from '@/components/ui/PriceChange'
import WidgetCard from './WidgetCard'
import { useWatchlist } from '@/api/watchlist'
import useAuthStore from '@/store/useAuthStore'

export default function WatchlistWidget({ variant = 'watchlist-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const { isAuthenticated } = useAuthStore()
  const { data = [], isLoading } = useWatchlist({ enabled: isAuthenticated })
  const items = data.slice(0, 5)

  if (variant === 'watchlist-wide') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">관심 종목</span>
        </div>
        <div className="flex-1 flex flex-col gap-1.5 min-h-0">
          {isLoading && <span className="text-[10px] text-foreground-disabled">불러오는 중...</span>}
          {!isLoading && items.map((item) => (
            <div key={item.stockCode} className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium text-foreground truncate">{item.stockName}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-semibold text-foreground">
                  {Number(item.currentPrice).toLocaleString('ko-KR')}원
                </span>
                <PriceChange value={item.changeRate} className="text-[9px] font-medium" />
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* watchlist-sm (default) */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">관심 종목</span>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 min-h-0">
        {isLoading && <span className="text-[10px] text-foreground-disabled">불러오는 중...</span>}
        {!isLoading && items.map((item) => (
          <div key={item.stockCode} className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-foreground">{item.stockName}</span>
            <PriceChange value={item.changeRate} className="text-[9px] font-semibold" />
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
