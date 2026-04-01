import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
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
  const flowDates  = (assetFlow?.points ?? []).map((p) => (p.date ?? '').slice(5).replace('-', '.'))
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
    flowDates,
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
        <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">계좌 잔고</span>
      </div>

      {variant === 'balance-lg' ? (
        <div className="flex flex-1 gap-3 min-h-0">
          <div className="flex flex-col justify-end flex-1 min-w-0">
            <div className="text-widget-11 text-foreground-disabled">총 평가자산</div>
            <div className="text-widget-18 font-bold leading-tight tracking-tight text-foreground mt-0.5">
              {BALANCE.total}
            </div>
            {BALANCE.isLoading
              ? <div className="text-widget-9 text-foreground-disabled mt-0.5">-</div>
              : <div className={`text-widget-11 font-semibold mt-0.5 ${BALANCE.isProfit ? 'text-up' : 'text-down'}`}>{BALANCE.isProfit ? '▲' : '▼'} {BALANCE.profit} ({BALANCE.profitRate})</div>
            }
          </div>
          <div className="flex flex-col justify-end min-w-0 w-[42%] shrink-0">
            <div className="flex flex-col gap-1 border-l border-stroke pl-3">
              {[
                { label: '투자원금', val: BALANCE.invested, color: 'text-foreground' },
                { label: '평가손익', val: BALANCE.profit,   color: BALANCE.isProfit ? 'text-up' : 'text-down' },
                { label: '주문가능', val: BALANCE.available, color: 'text-foreground' },
              ].map(({ label, val, color }) => (
                <div key={label} className="min-w-0">
                  <div className="text-widget-7 text-foreground-disabled">{label}</div>
                  <div className={`text-widget-10 font-semibold truncate ${color}`}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : variant === 'balance-3x1' ? (
        <div className="flex flex-col flex-1 min-h-0 gap-3">
          {/* 상: 금액 정보 */}
          <div className="flex flex-col shrink-0 gap-1.5">
            <div>
              <div className="text-widget-10 text-foreground-disabled">총 평가자산</div>
              <div className="text-widget-22 font-bold leading-tight tracking-tight text-foreground mt-0.5">
                {BALANCE.total}
              </div>
              {BALANCE.isLoading
                ? <div className="text-widget-10 text-foreground-disabled mt-0.5">-</div>
                : <div className={`text-widget-11 font-semibold mt-0.5 ${BALANCE.isProfit ? 'text-up' : 'text-down'}`}>{BALANCE.isProfit ? '▲' : '▼'} {BALANCE.profit} ({BALANCE.profitRate})</div>
              }
            </div>
            <div className="grid grid-cols-3">
              {[
                { label: '투자원금', val: BALANCE.invested, color: 'text-foreground' },
                { label: '평가손익', val: BALANCE.profit,   color: BALANCE.isProfit ? 'text-up' : 'text-down' },
                { label: '주문가능', val: BALANCE.available, color: 'text-foreground' },
              ].map(({ label, val, color }) => (
                <div key={label} className="min-w-0">
                  <div className="text-widget-7 text-foreground-disabled">{label}</div>
                  <div className={`text-widget-10 font-semibold truncate ${color}`}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          {/* 하: 수익 추이 */}
          <div className="flex flex-col flex-1 min-h-0 border-t border-stroke pt-2">
            <div className="text-widget-9 text-foreground-disabled shrink-0">수익 추이 (7일)</div>
            <div className="flex-1 min-h-0 relative">
              {BALANCE.flowPoints.length > 1 ? (() => {
                const pts = BALANCE.flowPoints
                const isUp = pts[pts.length - 1] >= pts[0]
                const lineColor = isUp ? 'var(--color-up)' : 'var(--color-down)'
                const chartOption = {
                  backgroundColor: 'transparent',
                  grid: { left: 28, right: 4, top: 4, bottom: 16, containLabel: false },
                  tooltip: { show: false },
                  xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: BALANCE.flowDates,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: 'var(--color-foreground-disabled)', fontSize: 8, margin: 4 },
                  },
                  yAxis: {
                    type: 'value',
                    scale: true,
                    splitNumber: 2,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: {
                      color: 'var(--color-foreground-disabled)',
                      fontSize: 8,
                      margin: 4,
                      formatter: (v) => (v >= 0 ? '+' : '') + v.toFixed(1) + '%',
                    },
                  },
                  series: [{
                    type: 'line',
                    smooth: true,
                    showSymbol: pts.length === 1,
                    symbolSize: 5,
                    data: pts,
                    lineStyle: { width: 2, color: lineColor },
                    itemStyle: { color: lineColor },
                  }],
                }
                return (
                  <ReactECharts
                    option={chartOption}
                    style={{ width: '100%', height: '100%' }}
                    opts={{ renderer: 'svg' }}
                  />
                )
              })() : (
                <div className="absolute inset-0 flex items-center justify-center text-widget-9 text-foreground-disabled">데이터 없음</div>
              )}
            </div>
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
            : <div className={`text-widget-10 font-semibold mt-1 ${BALANCE.isProfit ? 'text-up' : 'text-down'}`}>{BALANCE.isProfit ? '▲' : '▼'} {BALANCE.profit} ({BALANCE.profitRate})</div>
          }
        </div>
      )}

      {!isRestoring && !isAuthenticated && <LockedOverlay message="계좌 정보를 보려면" />}
    </WidgetCard>
  )
}
