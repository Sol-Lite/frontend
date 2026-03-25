import { useMemo } from 'react'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import WidgetCard from './WidgetCard'
import { useDomesticHoldings } from '@/api/balance'

const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
]

function usePortfolio(enabled) {
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

    const top = withValues.slice(0, 3)
    const rest = withValues.slice(3)

    const items = top.map((h, i) => ({
      name: h.name,
      ratio: Math.round((h.currentValue / total) * 100),
      color: CHART_COLORS[i],
    }))

    if (rest.length > 0) {
      items.push({
        name: '기타',
        ratio: 100 - items.reduce((s, item) => s + item.ratio, 0),
        color: CHART_COLORS[3],
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
  const portfolio = usePortfolio(isAuthenticated && !isRestoring)

  const conicStops = portfolio.items.reduce((acc, item, i) => {
    const start = portfolio.items.slice(0, i).reduce((s, x) => s + x.ratio, 0)
    acc.push(`${item.color} ${start}% ${start + item.ratio}%`)
    return acc
  }, []).join(', ')

  const returnRateStr = portfolio.returnRate != null
    ? `${portfolio.returnRate >= 0 ? '+' : ''}${portfolio.returnRate.toFixed(1)}%`
    : '-'

  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      {variant === 'portfolio-wide' ? (
        <>
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 비중</span>
            <span className="text-[10px] font-semibold text-up">{returnRateStr}</span>
          </div>
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            {portfolio.items.slice(0, 3).map((item) => (
              <div key={item.name}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px] text-foreground-secondary">{item.name}</span>
                  <span className="text-[10px] font-semibold text-foreground">{item.ratio}%</span>
                </div>
                <div className="h-[3px] bg-surface-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.ratio}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : variant === 'portfolio-2x2' ? (
        <>
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">섹터별 비중</span>
          </div>
          <div className="flex flex-col flex-1 gap-3">
            <div className="flex items-center gap-3 shrink-0">
              <div
                className="w-16 h-16 rounded-full shrink-0"
                style={{ background: `conic-gradient(${conicStops})` }}
              />
              <div>
                <div className="text-[9px] text-foreground-disabled">총 수익률</div>
                <div className="text-[22px] font-bold text-up leading-tight">{returnRateStr}</div>
                <div className="text-[9px] text-foreground-disabled mt-0.5">+4,280,000원</div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 flex-1">
              {portfolio.items.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[10px] text-foreground-tertiary">{item.name}</span>
                    <span className="text-[10px] font-semibold text-foreground">{item.ratio}%</span>
                  </div>
                  <div className="h-[4px] bg-surface-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.ratio}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* portfolio-sm (default) */
        <>
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 비중</span>
            <span className="text-[10px] font-semibold text-up">{returnRateStr}</span>
          </div>
          <div className="flex items-center gap-2.5 flex-1 min-h-0">
            <div
              className="w-14 h-14 rounded-full shrink-0"
              style={{ background: `conic-gradient(${conicStops})` }}
            />
            <div className="flex flex-col gap-1">
              {portfolio.items.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
                  <span className="text-[10px] text-foreground-secondary">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!isRestoring && !isAuthenticated && <LockedOverlay message="포트폴리오를 보려면" />}
    </WidgetCard>
  )
}
