import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import StockAvatar from '@/components/ui/StockAvatar'
import PriceChange from '@/components/ui/PriceChange'
import SparklineChart from '@/components/ui/SparklineChart'
import { useWatchlist, watchlistApi } from '@/api/watchlist'
import useAuthStore from '@/store/useAuthStore'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import useSparkline from '@/features/market/useSparkline'
import { isForeignMarketType } from '@/features/invest/formatters'
import { cn } from '@/lib/cn'

const EXCHANGE_CODE_BY_MARKET_TYPE = { NASDAQ: 'NAS', NYSE: 'NYS', AMEX: 'AMS' }

function fmtPrice(n, marketType) {
  if (n == null) return '-'
  const isOverseas = isForeignMarketType(marketType)
  return isOverseas
    ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₩${Number(n).toLocaleString('ko-KR')}`
}

function fmtChange(change, marketType) {
  if (change == null) return null
  const isOverseas = isForeignMarketType(marketType)
  const abs  = Math.abs(Number(change))
  const sign = Number(change) >= 0 ? '+' : '-'
  return isOverseas
    ? `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${sign}₩${abs.toLocaleString('ko-KR')}`
}

function WatchlistRow({ item, onStockClick, onRemove }) {
  const isOverseas = isForeignMarketType(item.marketType)
  const changeAmt  = fmtChange(item.change ?? item.changeAmount, item.marketType)
  const isUp       = (item.changeRate ?? 0) >= 0

  const exchangeCode = item.exchangeCode ?? EXCHANGE_CODE_BY_MARKET_TYPE[item.marketType] ?? null
  const { data: sparkData = [] } = useSparkline(item.stockCode, item.marketType, exchangeCode)

  return (
    <button
      onClick={() => onStockClick(item)}
      className="w-full text-left flex items-center gap-3 px-8 py-3 border-b border-stroke last:border-b-0 hover:bg-surface-muted transition-colors group"
    >
      {/* 로고 */}
      <StockAvatar
        name={item.stockName}
        stockCode={item.stockCode}
        marketType={item.marketType}
        size="md"
      />

      {/* 종목명 + 코드 */}
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span className="text-[13px] font-semibold text-foreground truncate leading-tight">
          {item.stockName}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-foreground-disabled">{item.stockCode}</span>
          {isOverseas && (
            <span className="text-[9px] font-medium text-foreground-disabled bg-surface-subtle rounded px-1 py-px">
              {item.marketType}
            </span>
          )}
        </div>
      </div>

      {/* 스파크라인 */}
      <SparklineChart
        data={sparkData}
        isUp={isUp}
        className="w-[80px] h-8 shrink-0"
      />

      {/* 현재가 */}
      <div className="w-[96px] text-right">
        <span className="text-[13px] font-bold text-foreground tabular-nums">
          {fmtPrice(item.currentPrice, item.marketType)}
        </span>
      </div>

      {/* 등락 (금액 + 율) */}
      <div className={cn(
        'w-[100px] flex flex-col items-end gap-0.5 tabular-nums',
        isUp ? 'text-up' : 'text-down',
      )}>
        {changeAmt && (
          <span className="text-[12px] font-semibold">{changeAmt}</span>
        )}
        <PriceChange value={item.changeRate} className="text-[11px] font-medium" />
      </div>

      {/* 삭제 버튼 */}
      <div className="w-8 flex justify-center">
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item.stockCode) }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-foreground-disabled hover:text-down hover:bg-surface-subtle"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </button>
  )
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
    const marketType   = item.marketType ?? null
    const exchangeCode = item.exchangeCode ?? EXCHANGE_CODE_BY_MARKET_TYPE[marketType] ?? null
    open({
      widgetTypeId: 'stock-chart',
      config: { stockCode: item.stockCode, stockName: item.stockName, marketType, exchangeCode },
    })
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="shrink-0 px-8 pt-4 pb-3 border-b border-stroke">
        <h2 className="text-[15px] font-bold text-foreground">관심 종목</h2>
      </div>

      {/* 컬럼 헤더 */}
      {items.length > 0 && (
        <div className="shrink-0 px-8 py-2 flex items-center gap-3 text-[10px] font-semibold text-foreground-disabled border-b border-stroke">
          <span className="w-8 shrink-0" />
          <span className="flex-1">종목</span>
          <span className="w-[80px]" />
          <span className="w-[96px] text-right">현재가</span>
          <span className="w-[100px] text-right">등락</span>
          <span className="w-8" />
        </div>
      )}

      {/* 목록 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
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
            <WatchlistRow
              key={item.stockCode}
              item={item}
              onStockClick={handleStockClick}
              onRemove={(code) => remove.mutate(code)}
            />
          ))
        )}
      </div>
    </div>
  )
}
