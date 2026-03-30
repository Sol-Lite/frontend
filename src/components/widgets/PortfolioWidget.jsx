import { useMemo } from 'react'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import WidgetCard from './WidgetCard'
import { useDomesticHoldings } from '@/api/balance'

const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-other)',
]

function ItemBar({ item, barHeight = 'h-[3px]' }) {
  return (
    <div className="min-w-0">
      <div className="flex justify-between gap-2 mb-0.5">
        <span className="text-widget-10 text-foreground-secondary tracking-tight truncate">{item.name}</span>
        <span className="text-widget-10 font-semibold text-foreground shrink-0">{item.ratio}%</span>
      </div>
      <div className={`${barHeight} bg-surface-muted rounded-full overflow-hidden`}>
        <div className="h-full rounded-full" style={{ width: `max(2px, ${item.ratio}%)`, background: item.color }} />
      </div>
    </div>
  )
}

function usePortfolio(enabled, topN = 3) {
  const { data: holdings = [], isLoading } = useDomesticHoldings({ enabled })

  return useMemo(() => {
    if (isLoading) return { items: [], returnRate: null, isLoading: true }

    const withValues = holdings
      .map((h) => {
        const qty = h.holdingQuantity ?? h.availableQuantity ?? 0
        const curPrice = h.currentPrice ?? h.avgPrice ?? h.avgBuyPrice ?? 0
        const avgPrice = h.avgPrice ?? h.avgBuyPrice ?? 0
        return {
          name: h.stockName ?? h.stockCode,
          currentValue: curPrice * qty,
          investedValue: avgPrice * qty,
        }
      })
      .filter((h) => h.currentValue > 0)
      .sort((a, b) => b.currentValue - a.currentValue)

    const total = withValues.reduce((s, h) => s + h.currentValue, 0)
    const totalInvested = withValues.reduce((s, h) => s + h.investedValue, 0)

    if (total === 0) return { items: [], returnRate: null, isLoading: false }

    const top = withValues.slice(0, topN)
    const rest = withValues.slice(topN)

    const items = top.map((h, i) => ({
      name: h.name,
      ratio: Math.round((h.currentValue / total) * 100),
      color: CHART_COLORS[i],
    }))

    if (rest.length > 0) {
      items.push({
        name: '기타',
        ratio: 100 - items.reduce((s, item) => s + item.ratio, 0),
        color: CHART_COLORS[topN],
      })
    } else {
      const sum = items.reduce((s, item) => s + item.ratio, 0)
      if (items.length > 0) items[items.length - 1].ratio += (100 - sum)
    }

    const returnRate = totalInvested > 0
      ? ((total - totalInvested) / totalInvested) * 100
      : 0

    return { items, returnRate, isLoading: false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings, isLoading])
}

export default function PortfolioWidget({ variant = 'portfolio-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const { isAuthenticated, isRestoring } = useAuthStore()
  const { open } = useWidgetDetailStore()
  // 2×2는 최대 5종목+기타, 나머지는 3종목+기타
  const topN = variant === 'portfolio-2x2' ? 5 : 3
  const portfolio = usePortfolio(isAuthenticated && !isRestoring, topN)

  const conicStops = portfolio.items.reduce((acc, item, i) => {
    const start = portfolio.items.slice(0, i).reduce((s, x) => s + x.ratio, 0)
    acc.push(`${item.color} ${start}% ${start + item.ratio}%`)
    return acc
  }, []).join(', ')

  const returnRateStr = portfolio.returnRate != null
    ? `${portfolio.returnRate >= 0 ? '+' : ''}${portfolio.returnRate.toFixed(1)}%`
    : '-'
  const returnRateColor = portfolio.returnRate == null ? 'text-foreground-disabled' : portfolio.returnRate >= 0 ? 'text-up' : 'text-down'

  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={() => open({ widgetTypeId: 'balance', config: {} })}>
      {variant === 'portfolio-wide' ? (
        <>
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 비중</span>
            {portfolio.returnRate != null && (
              <span className={`text-widget-10 font-semibold ${returnRateColor}`}>{returnRateStr}</span>
            )}
          </div>
          <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-hidden">
            {portfolio.isLoading || portfolio.items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-widget-9 text-foreground-disabled">
                {portfolio.isLoading ? '불러오는 중...' : '보유 종목 없음'}
              </div>
            ) : portfolio.items.map((item) => (
              <ItemBar key={item.name} item={item} barHeight="h-[3px]" />
            ))}
          </div>
        </>
      ) : variant === 'portfolio-2x2' ? (
        <>
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 비중</span>
          </div>
          {portfolio.isLoading || portfolio.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-widget-9 text-foreground-disabled">
              {portfolio.isLoading ? '불러오는 중...' : '보유 종목 없음'}
            </div>
          ) : (
            <div className="flex flex-col flex-1 gap-3 min-h-0">
              <div className="flex items-center gap-3 shrink-0">
                <div
                  className="w-16 h-16 rounded-full shrink-0"
                  style={{ background: `conic-gradient(${conicStops})` }}
                />
                <div>
                  <div className="text-widget-9 text-foreground-disabled">총 수익률</div>
                  <div className={`text-widget-22 font-bold leading-tight ${returnRateColor}`}>{returnRateStr}</div>
                  <div className="text-widget-9 text-foreground-disabled mt-0.5">+4,280,000원</div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-hidden">
                {portfolio.items.map((item) => (
                  <ItemBar key={item.name} item={item} barHeight="h-[4px]" />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* portfolio-sm (default) */
        <>
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 비중</span>
            {portfolio.returnRate != null && (
              <span className={`text-widget-10 font-semibold ${returnRateColor}`}>{returnRateStr}</span>
            )}
          </div>
          {portfolio.isLoading || portfolio.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-widget-9 text-foreground-disabled">
              {portfolio.isLoading ? '불러오는 중...' : '보유 종목 없음'}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 flex-1 min-h-0">
              <div
                className="w-14 h-14 rounded-full shrink-0"
                style={{ background: `conic-gradient(${conicStops})` }}
              />
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                {portfolio.items.map((item) => (
                  <div key={item.name} className="flex items-center gap-1 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-widget-10 text-foreground-secondary tracking-tight truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!isRestoring && !isAuthenticated && <LockedOverlay message="포트폴리오를 보려면" />}
    </WidgetCard>
  )
}
