import { useEffect, useMemo, useState } from 'react'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import WidgetCard from './WidgetCard'
import { useDomesticHoldings } from '@/api/balance'
import { extractDominantColor } from '@/lib/extractLogoColor'
import { getStockLogoUrl } from '@/lib/stockLogo'

const FALLBACK_COLORS = ['#0046FF', '#00C2A8', '#7B61FF', '#FF8C00', '#0035CC']
const OTHER_COLOR = 'var(--color-chart-other)'

function ItemBar({ item, color, barHeight = 'h-[3px]' }) {
  return (
    <div className="min-w-0">
      <div className="flex justify-between gap-2 mb-0.5">
        <span className="text-widget-10 text-foreground-secondary tracking-tight truncate">{item.name}</span>
        <span className="text-widget-10 font-semibold text-foreground shrink-0">{item.ratio}%</span>
      </div>
      <div className={`${barHeight} bg-surface-muted rounded-full overflow-hidden`}>
        <div className="h-full rounded-full" style={{ width: `max(2px, ${item.ratio}%)`, background: color }} />
      </div>
    </div>
  )
}

function usePortfolioColors(items) {
  const [colors, setColors] = useState({})

  useEffect(() => {
    if (!items?.length) {
      setColors({})
      return
    }

    let isCancelled = false

    items.forEach(async (item, i) => {
      const key = item.stockCode ?? `item_${i}`

      if (item.type === 'OTHER') {
        if (!isCancelled) setColors((prev) => ({ ...prev, [key]: OTHER_COLOR }))
        return
      }

      if (!item.stockCode) {
        if (!isCancelled) setColors((prev) => ({ ...prev, [key]: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }))
        return
      }

      const fallback = FALLBACK_COLORS[i % FALLBACK_COLORS.length]
      const url =
        getStockLogoUrl(item.marketType, item.stockCode) ??
        getStockLogoUrl('KOSPI', item.stockCode) ??
        getStockLogoUrl('KOSDAQ', item.stockCode)

      if (!url) {
        if (!isCancelled) setColors((prev) => ({ ...prev, [key]: fallback }))
        return
      }

      const color = await extractDominantColor(url, fallback)
      if (!isCancelled) setColors((prev) => ({ ...prev, [key]: color }))
    })

    return () => {
      isCancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items?.map((item) => `${item.stockCode ?? 'none'}:${item.marketType ?? ''}:${item.type ?? ''}`))])

  return (item, idx) => {
    const key = item.stockCode ?? `item_${idx}`
    if (item.type === 'OTHER') return OTHER_COLOR
    return colors[key] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
  }
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
          stockCode: h.stockCode ?? null,
          marketType: h.marketType ?? null,
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

    const items = top.map((h) => ({
      name: h.name,
      ratio: Math.round((h.currentValue / total) * 100),
      stockCode: h.stockCode,
      marketType: h.marketType,
      type: 'STOCK',
    }))

    if (rest.length > 0) {
      items.push({
        name: '기타',
        ratio: 100 - items.reduce((s, item) => s + item.ratio, 0),
        stockCode: null,
        marketType: null,
        type: 'OTHER',
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

function buildConicStops(items, getColor) {
  let start = 0
  return items.map((item, i) => {
    const end = start + item.ratio
    const stop = `${getColor(item, i)} ${start}% ${end}%`
    start = end
    return stop
  }).join(', ')
}

export default function PortfolioWidget({ variant = 'portfolio-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const { isAuthenticated, isRestoring } = useAuthStore()
  const { open } = useWidgetDetailStore()
  const topN = variant === 'portfolio-2x2' ? 5 : 3
  const portfolio = usePortfolio(isAuthenticated && !isRestoring, topN)
  const getColor = usePortfolioColors(portfolio.items)
  const conicStops = useMemo(() => buildConicStops(portfolio.items, getColor), [portfolio.items, getColor])

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
            ) : portfolio.items.map((item, i) => (
              <ItemBar key={item.name} item={item} color={getColor(item, i)} barHeight="h-[3px]" />
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
                <div className="relative w-16 h-16 rounded-full shrink-0" style={{ background: `conic-gradient(${conicStops})` }}>
                  <div className="absolute inset-[28%] rounded-full bg-surface" />
                </div>
                <div>
                  <div className="text-widget-9 text-foreground-disabled">총 수익률</div>
                  <div className={`text-widget-22 font-bold leading-tight ${returnRateColor}`}>{returnRateStr}</div>
                  <div className="text-widget-9 text-foreground-disabled mt-0.5">+4,280,000원</div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-hidden">
                {portfolio.items.map((item, i) => (
                  <ItemBar key={item.name} item={item} color={getColor(item, i)} barHeight="h-[4px]" />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
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
              <div className="relative w-14 h-14 rounded-full shrink-0" style={{ background: `conic-gradient(${conicStops})` }}>
                <div className="absolute inset-[30%] rounded-full bg-surface" />
              </div>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                {portfolio.items.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: getColor(item, i) }} />
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
