import PriceChange from '@/components/ui/PriceChange'
import WidgetCard from './WidgetCard'
import { useWatchlist } from '@/api/watchlist'
import useAuthStore from '@/store/useAuthStore'

export default function WatchlistWidget({ variant = 'watchlist-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const { isAuthenticated } = useAuthStore()
  const { data = [], isLoading, isError } = useWatchlist({ enabled: isAuthenticated })
  const items = data.slice(0, 5)

  const emptyMessage = !isAuthenticated
    ? '로그인 후 이용 가능합니다'
    : isError
      ? '불러오기에 실패했습니다'
      : items.length === 0
        ? '관심 종목을 추가해보세요'
        : null

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
        <div className="flex-1 flex flex-col gap-1.5 min-h-0">
          {isLoading && <span className="text-[10px] text-foreground-disabled">불러오는 중...</span>}
          {!isLoading && emptyMessage && <span className="text-[10px] text-foreground-disabled">{emptyMessage}</span>}
          {!isLoading && !emptyMessage && items.map((item) => (
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
        <button
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] text-primary font-semibold hover:underline"
        >
          + 추가
        </button>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 min-h-0">
        {isLoading && <span className="text-[10px] text-foreground-disabled">불러오는 중...</span>}
        {!isLoading && emptyMessage && <span className="text-[10px] text-foreground-disabled">{emptyMessage}</span>}
        {!isLoading && !emptyMessage && items.map((item) => (
          <div key={item.stockCode} className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-foreground">{item.stockName}</span>
            <PriceChange value={item.changeRate} className="text-[9px] font-semibold" />
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
