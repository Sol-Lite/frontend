import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import PriceChange from '@/components/ui/PriceChange'
import { useWatchlist, watchlistApi } from '@/api/watchlist'
import useAuthStore from '@/store/useAuthStore'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'

function fmtPrice(n, market) {
  if (n == null) return '-'
  const isOverseas = market && !['KSE', 'KOSDAQ', 'KONEX'].includes(market)
  return isOverseas
    ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₩${Number(n).toLocaleString('ko-KR')}`
}

export default function WatchlistDetail() {
  const { isAuthenticated, isRestoring } = useAuthStore()
  const { data: items = [], isLoading } = useWatchlist({ enabled: isAuthenticated && !isRestoring })
  const open = useWidgetDetailStore((s) => s.open)

  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: (stockCode) => watchlistApi.removeFromWatchlist(stockCode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  function handleStockClick(item) {
    open({
      widgetTypeId: 'stock-chart',
      config: {
        stockCode:  item.stockCode,
        stockName:  item.stockName,
        marketType: item.marketType ?? null,
      },
    })
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* 헤더 */}
      <div className="shrink-0 px-10 py-3">
        <div className="max-w-2xl mx-auto pb-3 border-b border-stroke">
          <h2 className="text-[15px] font-bold text-foreground">관심 종목</h2>
        </div>
      </div>

      {/* 목록 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-10 py-2">
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <span className="text-xs text-foreground-disabled">불러오는 중...</span>
            </div>
          ) : !isAuthenticated ? (
            <div className="flex items-center justify-center h-20">
              <span className="text-xs text-foreground-disabled">로그인이 필요합니다</span>
            </div>
          ) : !items.length ? (
            <div className="flex items-center justify-center h-20">
              <span className="text-xs text-foreground-disabled">관심 종목이 없습니다</span>
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.stockCode}
                onClick={() => handleStockClick(item)}
                className="w-full text-left flex items-center gap-4 py-4 border-b border-stroke last:border-b-0 hover:opacity-75 transition-opacity group"
              >
                {/* 종목명 + 코드 */}
                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <span className="text-[14px] font-semibold text-foreground truncate">
                    {item.stockName}
                  </span>
                  <span className="text-[11px] text-foreground-disabled">{item.stockCode}</span>
                </div>

                {/* 가격 + 등락률 */}
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="text-[14px] font-semibold text-foreground">
                    {fmtPrice(item.currentPrice, item.marketType)}
                  </span>
                  <PriceChange value={item.changeRate} className="text-[12px] font-medium" />
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => { e.stopPropagation(); remove.mutate(item.stockCode) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-foreground-disabled hover:text-down hover:bg-surface-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
