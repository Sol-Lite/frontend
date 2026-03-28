import { useQuery } from '@tanstack/react-query'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import WidgetCard from './WidgetCard'
import { balanceApi, useDomesticHoldings } from '@/api/balance'
import { cn } from '@/lib/cn'

function fmt(n) {
  return Math.floor(Number(n ?? 0)).toLocaleString('ko-KR')
}

function useBalance(enabled) {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['balance', 'summary'],
    queryFn:  balanceApi.getBalanceSummary,
    enabled,
    staleTime: 30_000,
  })
  const { data: assetFlow } = useQuery({
    queryKey: ['balance', 'flow', '1W'],
    queryFn:  () => balanceApi.getAssetFlow('1W'),
    enabled,
    staleTime: 30_000,
  })

  const isLoading = enabled && summaryLoading

  if (isLoading) {
    return { total: '-', profit: '-', profitRate: '-', invested: '-', available: '-', isProfit: true, isLoading: true, flowPoints: [] }
  }

  const cashList  = summary?.cashBalances ?? []
  const krwEntry  = cashList.find((c) => c.currencyCode === 'KRW') ?? {}
  const total     = Number(summary?.totalAssets ?? 0)
  const profit    = Number(summary?.accountProfitLoss ?? 0)
  const profitRate = Number(summary?.accountProfitLossRate ?? 0)
  const invested  = total - profit - Number(krwEntry.totalAmount ?? 0)

  const flowPoints = (assetFlow?.points ?? []).map((p) => Number(p.cumulativeReturnRate ?? 0))
  const maxRate    = flowPoints.reduce((m, r) => Math.max(m, Math.abs(r)), 0)

  return {
    total:      fmt(total),
    profit:     (profit >= 0 ? '+' : '-') + fmt(Math.abs(profit)),
    profitRate: (profitRate >= 0 ? '+' : '') + profitRate.toFixed(2) + '%',
    invested:   fmt(Math.max(0, invested)),
    available:  fmt(Number(krwEntry.availableAmount ?? krwEntry.totalAmount ?? 0)),
    isProfit:   profit >= 0,
    isLoading:  false,
    flowPoints,
    maxRate,
  }
}

export default function BalanceWidget({ variant = 'balance-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const { isAuthenticated, isRestoring } = useAuthStore()
  const BALANCE = useBalance(isAuthenticated && !isRestoring)
  const open = useWidgetDetailStore((s) => s.open)

  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={() => open({ widgetTypeId: 'balance', config: {} })}>
      <div className="mb-2 shrink-0">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">계좌 잔고</span>
      </div>

      {variant === 'balance-lg' ? (
        <div className="flex flex-col flex-1 gap-1.5 min-h-0">
          <div className="shrink-0">
            <div className="text-[8px] text-foreground-disabled">총 평가자산</div>
            <div className="text-[18px] font-bold leading-tight tracking-tight text-foreground mt-0.5">
              {BALANCE.total}
            </div>
            {BALANCE.isLoading
              ? <div className="text-[9px] text-foreground-disabled mt-0.5">-</div>
              : <div className={`text-[9px] font-semibold mt-0.5 ${BALANCE.isProfit ? 'text-up' : 'text-down'}`}>{BALANCE.isProfit ? '▲' : '▼'} {BALANCE.profit} ({BALANCE.profitRate})</div>
            }
          </div>
          <div className="h-px bg-stroke-subtle shrink-0" />
          <div className="flex gap-2 flex-1 items-start">
            {[
              { label: '투자원금', val: BALANCE.invested, color: 'text-foreground' },
              { label: '평가손익', val: BALANCE.profit,   color: BALANCE.isProfit ? 'text-up' : 'text-down' },
              { label: '주문가능', val: BALANCE.available, color: 'text-foreground' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex-1 min-w-0">
                <div className="text-[10px] text-foreground-disabled">{label}</div>
                <div className={`text-[13px] font-semibold truncate ${color}`}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      ) : variant === 'balance-3x1' ? (
        <div className="flex flex-1 gap-4 min-h-0">
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-[9px] text-foreground-disabled">총 평가자산</div>
              <div className="text-[22px] font-bold leading-tight tracking-tight text-foreground mt-0.5">
                {BALANCE.total}
              </div>
              {BALANCE.isLoading
                ? <div className="text-[10px] text-foreground-disabled mt-0.5">-</div>
                : <div className={`text-[10px] font-semibold mt-0.5 ${BALANCE.isProfit ? 'text-up' : 'text-down'}`}>{BALANCE.isProfit ? '▲' : '▼'} {BALANCE.profit} ({BALANCE.profitRate})</div>
              }
            </div>
            <div className="flex gap-6 shrink-0">
              <div>
                <div className="text-[9px] text-foreground-disabled">투자원금</div>
                <div className="text-[11px] font-semibold text-foreground">{BALANCE.invested}</div>
              </div>
              <div>
                <div className="text-[9px] text-foreground-disabled">주문가능</div>
                <div className="text-[11px] font-semibold text-foreground">{BALANCE.available}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col flex-1 min-w-0 pl-4 border-l border-stroke">
            <div className="text-[9px] text-foreground-disabled shrink-0">수익 추이 (7일)</div>
            <div className="flex-1 min-h-0 relative my-2">
              {BALANCE.flowPoints.length > 1 ? (() => {
                const pts = BALANCE.flowPoints
                const min = Math.min(...pts)
                const max = Math.max(...pts)
                const range = max - min || 1
                const W = 100 / (pts.length - 1)
                const isUp = pts[pts.length - 1] >= pts[0]
                return (
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline
                      points={pts.map((r, i) => {
                        const x = i * W
                        const y = 10 + (1 - (r - min) / range) * 80
                        return `${x},${y}`
                      }).join(' ')}
                      fill="none"
                      stroke={isUp ? 'var(--color-up)' : 'var(--color-down)'}
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    {pts.map((r, i) => {
                      const x = i * W
                      const y = 10 + (1 - (r - min) / range) * 80
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="3"
                          fill={r >= 0 ? 'var(--color-up)' : 'var(--color-down)'}
                          vectorEffect="non-scaling-stroke"
                        />
                      )
                    })}
                  </svg>
                )
              })() : (
                <div className="absolute inset-0 flex items-center justify-center text-[8px] text-foreground-disabled">데이터 없음</div>
              )}
            </div>
            {BALANCE.flowPoints.length > 0 && (
              <div className={cn('text-[9px] text-right shrink-0', BALANCE.flowPoints[BALANCE.flowPoints.length - 1] >= 0 ? 'text-up' : 'text-down')}>
                {`${BALANCE.flowPoints[BALANCE.flowPoints.length - 1] >= 0 ? '+' : ''}${BALANCE.flowPoints[BALANCE.flowPoints.length - 1].toFixed(2)}%`}
              </div>
            )}
          </div>
        </div>
      ) : variant === 'balance-2x2' ? (
        <div className="flex flex-col flex-1 gap-2.5">
          <div>
            <div className="text-[10px] text-foreground-disabled">총 평가자산</div>
            <div className="text-[22px] font-bold leading-tight tracking-tight text-foreground mt-0.5">
              {BALANCE.total}<span className="text-[12px] font-medium text-foreground-tertiary ml-0.5">원</span>
            </div>
            {BALANCE.isLoading
              ? <div className="text-[12px] text-foreground-disabled mt-0.5">-</div>
              : <div className={`text-[12px] font-semibold mt-0.5 ${BALANCE.isProfit ? 'text-up' : 'text-down'}`}>{BALANCE.isProfit ? '▲' : '▼'} {BALANCE.profit} ({BALANCE.profitRate})</div>
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
                <div className="text-[9px] text-foreground-disabled">{label}</div>
                <div className={`text-[12px] font-bold ${color} mt-0.5`}>{val}</div>
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
          <div className="text-[10px] text-foreground-disabled mb-0.5">총 평가자산</div>
          <div className="text-[18px] font-bold leading-tight tracking-tight text-foreground">
            {BALANCE.total}
          </div>
          {BALANCE.isLoading
            ? <div className="text-[11px] text-foreground-disabled mt-1">-</div>
            : <div className={`text-[11px] font-semibold mt-1 ${BALANCE.isProfit ? 'text-up' : 'text-down'}`}>{BALANCE.isProfit ? '▲' : '▼'} {BALANCE.profit} ({BALANCE.profitRate})</div>
          }
        </div>
      )}

      {!isRestoring && !isAuthenticated && <LockedOverlay message="계좌 정보를 보려면" />}
    </WidgetCard>
  )
}
