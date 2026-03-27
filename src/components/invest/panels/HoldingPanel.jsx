import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { formatCurrency, formatNumber } from '@/features/invest/formatters'
import { buildInvestNavigationState } from '@/features/invest/navigation'
import { useDomesticHoldings, useOverseasHoldings } from '@/api/balance'
import StockAvatar from '@/components/ui/StockAvatar'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'


export default function HoldingPanel({ displayCurrency, usdRate }) {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isRestoring = useAuthStore((s) => s.isRestoring)
  const { data: domestic = [], isLoading: domesticLoading } = useDomesticHoldings({ enabled: isAuthenticated && !isRestoring })
  const { data: overseas = [], isLoading: overseasLoading } = useOverseasHoldings({ enabled: isAuthenticated && !isRestoring })

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

  if (domesticLoading || overseasLoading) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">불러오는 중...</div>
  }

  const holdings = [...domestic, ...overseas]

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
        const hasCurrentPrice = h.currentPrice != null
        const evalPrice    = hasCurrentPrice ? h.currentPrice : null
        const profitLoss   = hasCurrentPrice ? (evalPrice - avgPrice) * quantity : null
        const profitRate   = hasCurrentPrice && avgPrice > 0 ? ((evalPrice - avgPrice) / avgPrice) * 100 : null
        const isProfit     = profitLoss != null ? profitLoss >= 0 : false

        return (
          <div
            key={h.stockCode}
            className="grid grid-cols-[28px_minmax(0,1fr)_56px_72px_72px] items-center gap-2 border-b border-stroke-subtle px-2.5 py-2"
          >
            <button
              type="button"
              onClick={() => navigate(`/invest/${h.stockCode}`, { state: buildInvestNavigationState(h) })}
              className="col-span-2 grid grid-cols-[28px_minmax(0,1fr)] items-center gap-2 text-left transition-opacity hover:opacity-80"
            >
              <StockAvatar name={h.stockName ?? h.stockCode} stockCode={h.stockCode} marketType={h.marketType} size="sm" />
              <div className="min-w-0">
                <div className="truncate text-[10px] font-semibold text-foreground">{h.stockName ?? h.stockCode}</div>
                <div className="text-[9px] text-foreground-disabled">
                  {hasCurrentPrice ? formatCurrency(evalPrice, { marketType: h.marketType, displayCurrency, usdRate }) : '-'}
                </div>
              </div>
            </button>
            <span className="text-[10px] text-right text-foreground">{formatNumber(quantity)}주</span>
            <span className="text-[10px] text-right text-foreground">
              {formatCurrency(avgPrice, { marketType: h.marketType, displayCurrency, usdRate })}
            </span>
            <div className="text-right">
              <div className={cn('text-[10px] font-bold', profitLoss == null ? 'text-foreground-disabled' : isProfit ? 'text-up' : 'text-down')}>
                {profitLoss == null ? '-' : `${isProfit ? '+' : ''}${formatCurrency(profitLoss, { marketType: h.marketType, displayCurrency, usdRate })}`}
              </div>
              <div className={cn('text-[9px]', profitRate == null ? 'text-foreground-disabled' : isProfit ? 'text-up' : 'text-down')}>
                {profitRate == null ? '-' : `${isProfit ? '+' : ''}${profitRate.toFixed(2)}%`}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
