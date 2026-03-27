import { useDomesticHoldings, useOverseasHoldings } from '@/api/balance'
import StockAvatar from '@/components/ui/StockAvatar'
import useAuthStore from '@/store/useAuthStore'
import { formatCurrency, formatNumber } from '@/features/invest/formatters'
import { cn } from '@/lib/cn'

export default function StockHoldingCard({ stockCode, displayCurrency, usdRate }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isRestoring     = useAuthStore((s) => s.isRestoring)

  const enabled = isAuthenticated && !isRestoring
  const { data: domestic = [], isLoading: dLoading } = useDomesticHoldings({ enabled })
  const { data: overseas = [], isLoading: oLoading } = useOverseasHoldings({ enabled })

  if (!isAuthenticated || isRestoring || dLoading || oLoading) return null

  const holding = [...domestic, ...overseas].find((h) => h.stockCode === stockCode)

  if (!holding) {
    return (
      <div className="shrink-0 border-t border-stroke px-[14px] py-3 bg-surface">
        <div className="text-[9px] font-semibold text-foreground-disabled mb-2">보유 현황</div>
        <div className="-mx-[14px] border-b border-stroke mb-3" />
        <div className="flex items-center justify-center py-1">
          <span className="text-[11px] text-foreground-disabled">해당 종목을 보유하고 있지 않음</span>
        </div>
      </div>
    )
  }

  const avgPrice   = holding.avgPrice ?? holding.avgBuyPrice ?? 0
  const quantity   = holding.holdingQuantity ?? holding.availableQuantity ?? 0
  const evalPrice  = holding.currentPrice ?? null
  const profitLoss = evalPrice != null ? (evalPrice - avgPrice) * quantity : null
  const profitRate = evalPrice != null && avgPrice > 0
    ? ((evalPrice - avgPrice) / avgPrice) * 100
    : null
  const isProfit   = profitLoss != null ? profitLoss >= 0 : false

  return (
    <div className="shrink-0 border-t border-stroke px-[14px] py-3 bg-surface">
      <div className="text-[9px] font-semibold text-foreground-disabled mb-2">보유 현황</div>
      <div className="-mx-[14px] border-b border-stroke mb-3" />
      <div className="flex items-center gap-2.5">
        <StockAvatar
          name={holding.stockName ?? stockCode}
          stockCode={stockCode}
          marketType={holding.marketType}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-foreground truncate">
            {holding.stockName ?? stockCode}
          </div>
          <div className="text-[9px] text-foreground-disabled mt-0.5">
            평균 {formatCurrency(avgPrice, { marketType: holding.marketType, displayCurrency, usdRate })}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] font-bold text-foreground">
            {formatNumber(quantity)}주
          </div>
          <div className={cn(
            'text-[10px] font-semibold mt-0.5',
            profitLoss == null ? 'text-foreground-disabled'
              : isProfit ? 'text-up' : 'text-down',
          )}>
            {profitLoss == null
              ? '-'
              : `${isProfit ? '+' : ''}${formatCurrency(profitLoss, { marketType: holding.marketType, displayCurrency, usdRate })} (${isProfit ? '+' : ''}${profitRate?.toFixed(2)}%)`
            }
          </div>
        </div>
      </div>
    </div>
  )
}
