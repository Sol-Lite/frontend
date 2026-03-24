import { cn } from '@/lib/cn'
import { formatCurrency, formatNumber } from '@/features/invest/formatters'
import { useDomesticHoldings } from '@/api/balance'
import StockAvatar from '@/components/ui/StockAvatar'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'


export default function HoldingPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isRestoring = useAuthStore((s) => s.isRestoring)
  const { data, isLoading } = useDomesticHoldings({ enabled: isAuthenticated && !isRestoring })

  if (!isRestoring && !isAuthenticated) {
    return (
      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
          로그인 후 보유 종목을 볼 수 있습니다.
        </div>
        <LockedOverlay message="보유 종목을 보려면" />
      </div>
    )
  }

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">불러오는 중...</div>
  }

  const holdings = data ?? []

  if (!holdings.length) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">보유 종목이 없습니다.</div>
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-[1] grid grid-cols-[28px_minmax(0,1fr)_56px_72px_72px] items-center gap-2 border-b border-stroke bg-surface-subtle px-2.5 py-1">
        {['', '종목', '수량', '평균단가', '손익'].map((label) => (
          <span key={label} className={cn('text-[9px] font-semibold text-foreground-disabled', label === '종목' || label === '' ? '' : 'text-right')}>
            {label}
          </span>
        ))}
      </div>

      {holdings.map((h) => {
        const avgPrice     = h.avgPrice ?? h.avgBuyPrice ?? 0
        const quantity     = h.holdingQuantity ?? h.availableQuantity ?? 0
        const evalPrice    = h.currentPrice ?? avgPrice
        const profitLoss   = (evalPrice - avgPrice) * quantity
        const profitRate   = avgPrice > 0 ? ((evalPrice - avgPrice) / avgPrice) * 100 : 0
        const isProfit     = profitLoss >= 0

        return (
          <div
            key={h.stockCode}
            className="grid grid-cols-[28px_minmax(0,1fr)_56px_72px_72px] items-center gap-2 border-b border-stroke-subtle px-2.5 py-2"
          >
            <StockAvatar name={h.stockName ?? h.stockCode} stockCode={h.stockCode} marketType={h.marketType} size="sm" />
            <div className="min-w-0">
              <div className="truncate text-[10px] font-semibold text-foreground">{h.stockName ?? h.stockCode}</div>
              <div className="text-[9px] text-foreground-disabled">{formatCurrency(evalPrice)}</div>
            </div>
            <span className="text-[10px] text-right text-foreground">{formatNumber(quantity)}주</span>
            <span className="text-[10px] text-right text-foreground">{formatCurrency(avgPrice)}</span>
            <div className="text-right">
              <div className={cn('text-[10px] font-bold', isProfit ? 'text-up' : 'text-down')}>
                {isProfit ? '+' : ''}{formatCurrency(profitLoss)}
              </div>
              <div className={cn('text-[9px]', isProfit ? 'text-up' : 'text-down')}>
                {isProfit ? '+' : ''}{profitRate.toFixed(2)}%
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
