import { useQuery } from '@tanstack/react-query'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import WidgetCard from './WidgetCard'
import { balanceApi, useDomesticHoldings } from '@/api/balance'

function fmt(n) {
  return Number(n ?? 0).toLocaleString('ko-KR')
}

function useBalance(enabled) {
  const { data: holdings = [], isLoading: holdingsLoading } = useDomesticHoldings({ enabled })
  const { data: cashData, isLoading: cashLoading } = useQuery({
    queryKey: ['balance', 'cash'],
    queryFn:  balanceApi.getCashBalances,
    enabled,
    staleTime: 30_000,
  })

  const isLoading = enabled && (holdingsLoading || cashLoading)

  if (isLoading) {
    return { total: '-', profit: '-', profitRate: '-', invested: '-', available: '-', isProfit: true, isLoading: true }
  }

  const krwEntry  = Array.isArray(cashData)
    ? (cashData.find((c) => c.currencyCode === 'KRW') ?? cashData[0])
    : cashData
  const cash      = krwEntry?.totalAmount ?? krwEntry?.availableAmount ?? 0
  const invested  = holdings.reduce((s, h) => s + (h.avgPrice ?? h.avgBuyPrice ?? 0) * (h.holdingQuantity ?? h.availableQuantity ?? 0), 0)
  const stockVal  = holdings.reduce((s, h) => s + (h.currentPrice ?? h.avgPrice ?? h.avgBuyPrice ?? 0) * (h.holdingQuantity ?? h.availableQuantity ?? 0), 0)
  const total     = stockVal + cash
  const profit    = stockVal - invested
  const profitRate = invested > 0 ? (profit / invested) * 100 : 0

  return {
    total:      fmt(total),
    profit:     (profit >= 0 ? '+' : '-') + fmt(Math.abs(profit)),
    profitRate: (profitRate >= 0 ? '+' : '') + profitRate.toFixed(2) + '%',
    invested:   fmt(invested),
    available:  fmt(krwEntry?.availableAmount ?? cash),
    isProfit:   profit >= 0,
    isLoading:  false,
  }
}

export default function BalanceWidget({ variant = 'balance-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const { isAuthenticated, isRestoring } = useAuthStore()
  const BALANCE = useBalance(isAuthenticated && !isRestoring)

  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <div className="mb-1 shrink-0">
        <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">계좌 잔고</span>
      </div>

      {variant === 'balance-lg' ? (
        <div className="flex flex-1 gap-3 min-h-0">
          <div className="flex flex-col justify-center flex-1 min-w-0">
            <div className="text-[11px] text-foreground-disabled">총 평가자산</div>
            <div className="text-widget-18 font-bold leading-tight tracking-tight text-foreground mt-0.5">
              {BALANCE.total}
            </div>
            {BALANCE.isLoading
              ? <div className="text-widget-9 text-foreground-disabled mt-0.5">-</div>
              : <div className={`text-widget-11 font-semibold mt-0.5 ${BALANCE.isProfit ? 'text-up' : 'text-down'}`}>{BALANCE.isProfit ? '▲' : '▼'} {BALANCE.profit} ({BALANCE.profitRate})</div>
            }
          </div>
          <div className="flex flex-col justify-center gap-2.0 shrink-0 border-l border-stroke pl-3">
            {[
              { label: '투자원금', val: BALANCE.invested, color: 'text-foreground' },
              { label: '평가손익', val: BALANCE.profit,   color: BALANCE.isProfit ? 'text-up' : 'text-down' },
              { label: '주문가능', val: BALANCE.available, color: 'text-foreground' },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <div className="text-widget-9 text-foreground-disabled">{label}</div>
                <div className={`text-widget-10 font-semibold ${color}`}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      ) : variant === 'balance-3x1' ? (
        <div className="flex flex-1 gap-4 min-h-0">
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-widget-9 text-foreground-disabled">총 평가자산</div>
              <div className="text-widget-22 font-bold leading-tight tracking-tight text-foreground mt-0.5">
                {BALANCE.total}
              </div>
              {BALANCE.isLoading
                ? <div className="text-widget-10 text-foreground-disabled mt-0.5">-</div>
                : <div className={`text-widget-9 font-semibold mt-0.5 ${BALANCE.isProfit ? 'text-up' : 'text-down'}`}>{BALANCE.isProfit ? '▲' : '▼'} {BALANCE.profit} ({BALANCE.profitRate})</div>
              }
            </div>
            <div className="flex gap-6 shrink-0">
              <div>
                <div className="text-widget-7 text-foreground-disabled">투자원금</div>
                <div className="text-widget-10 font-semibold text-foreground">{BALANCE.invested}</div>
              </div>
              <div>
                <div className="text-widget-7 text-foreground-disabled">주문가능</div>
                <div className="text-widget-10 font-semibold text-foreground">{BALANCE.available}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col flex-1 min-w-0 pl-4 border-l border-stroke">
            <div className="text-widget-9 text-foreground-disabled shrink-0">수익 추이 (30일)</div>
            <div className="flex-1 min-h-0 flex items-end gap-px my-2">
              {[30,38,35,50,55,65,70,80,85,92].map((h, i) => (
                <div key={i} className="flex-1 bg-up/50 rounded-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="text-widget-9 text-foreground-disabled text-right shrink-0">최고 +5.2%</div>
          </div>
        </div>
      ) : variant === 'balance-2x2' ? (
        <div className="flex flex-col flex-1 gap-2.5">
          <div>
            <div className="text-widget-10 text-foreground-disabled">총 평가자산</div>
            <div className="text-widget-22 font-bold leading-tight tracking-tight text-foreground mt-0.5">
              {BALANCE.total}<span className="text-widget-12 font-medium text-foreground-tertiary ml-0.5">원</span>
            </div>
            {BALANCE.isLoading
              ? <div className="text-widget-12 text-foreground-disabled mt-0.5">-</div>
              : <div className={`text-widget-12 font-semibold mt-0.5 ${BALANCE.isProfit ? 'text-up' : 'text-down'}`}>{BALANCE.isProfit ? '▲' : '▼'} {BALANCE.profit} ({BALANCE.profitRate})</div>
            }
          </div>
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {[
              { label: '투자원금', val: BALANCE.invested,    color: 'text-foreground' },
              { label: '평가손익', val: BALANCE.profit,      color: BALANCE.isProfit ? 'text-up' : 'text-down' },
              { label: '당일손익', val: '+342,000',          color: 'text-up' },
              { label: '수익률',   val: BALANCE.profitRate,  color: BALANCE.isProfit ? 'text-up' : 'text-down' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-background rounded-xl px-3 py-2">
                <div className="text-widget-9 text-foreground-disabled">{label}</div>
                <div className={`text-widget-12 font-bold ${color} mt-0.5`}>{val}</div>
              </div>
            ))}
          </div>
          <div className="flex-1 min-h-0 bg-background rounded-xl flex items-end px-2 pb-2 pt-2 gap-px">
            {[30, 45, 38, 60, 52, 65, 55, 70, 62, 78, 68, 85].map((h, i) => (
              <div key={i} className="flex-1 bg-up/50 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      ) : (
        /* balance-sm (default) */
        <div className="flex-1 flex flex-col justify-end min-h-0">
          <div className="text-widget-10 text-foreground-disabled mb-0.5">총 평가자산</div>
          <div className="text-widget-18 font-bold leading-tight tracking-tight text-foreground">
            {BALANCE.total}
          </div>
          {BALANCE.isLoading
            ? <div className="text-widget-11 text-foreground-disabled mt-1">-</div>
            : <div className={`text-widget-11 font-semibold mt-1 ${BALANCE.isProfit ? 'text-up' : 'text-down'}`}>{BALANCE.isProfit ? '▲' : '▼'} {BALANCE.profit} ({BALANCE.profitRate})</div>
          }
        </div>
      )}

      {!isRestoring && !isAuthenticated && <LockedOverlay message="계좌 정보를 보려면" />}
    </WidgetCard>
  )
}
