import { useMemo } from 'react'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import WidgetCard from './WidgetCard'
import { useBalanceSummary, useDomesticHoldings, useOverseasHoldings, usePortfolioData } from '@/api/balance'
import { usePortfolioColors } from '@/features/portfolio/portfolioColors'

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

function parseRatio(value) {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function usePortfolio(enabled, topN = 3) {
  const { data: summary, isLoading: sl } = useBalanceSummary({ enabled })
  const { data: domestic = [], isLoading: dl } = useDomesticHoldings({ enabled })
  const { data: overseas = [], isLoading: ol } = useOverseasHoldings({ enabled })
  const { data: portfolio, isLoading: pl } = usePortfolioData({ enabled })

  return useMemo(() => {
    const isLoading = enabled && (sl || dl || ol || pl)
    if (isLoading) return { items: [], returnRate: null, isLoading: true }

    const domesticList = Array.isArray(domestic) ? domestic : []
    const overseasList = Array.isArray(overseas) ? overseas : []
    const portfolioItemsRaw = Array.isArray(portfolio?.items) ? portfolio.items : []

    const allHoldings = [...domesticList, ...overseasList]
      .filter((h) => (h.holdingQuantity ?? 0) > 0 || (h.availableQuantity ?? 0) > 0)
      .map((h) => ({
        ...h,
        evalKrw: Number(h.evalAmount ?? 0),
      }))
    const holdingByName = Object.fromEntries(allHoldings.map((h) => [h.stockName, h]))

    const orderedItems = portfolioItemsRaw.filter((item) => item.type === 'STOCK')
    const normalized = orderedItems.map((item) => {
      const holding = holdingByName[item.label]
      return {
        name: item.label,
        ratio: parseRatio(item.weight),
        evalKrw: Number(holding?.evalKrw ?? 0),
        stockCode: holding?.stockCode ?? null,
        marketType: holding?.marketType ?? null,
        type: 'STOCK',
      }
    })

    const totalRatio = normalized.reduce((sum, item) => sum + item.ratio, 0)
    if (totalRatio > 0 && normalized.length > 0) {
      const rounded = normalized.map((item) => ({
        ...item,
        ratio: Math.round((item.ratio / totalRatio) * 100),
      }))
      const roundedSum = rounded.reduce((sum, item) => sum + item.ratio, 0)
      rounded[rounded.length - 1].ratio += (100 - roundedSum)
      normalized.splice(0, normalized.length, ...rounded)
    }

    // 잔고 탭 보유종목과 동일하게 평가금액 내림차순 정렬
    normalized.sort((a, b) => (b.evalKrw ?? 0) - (a.evalKrw ?? 0))

    const top = normalized.slice(0, topN)
    const rest = normalized.slice(topN)
    const items = [...top]

    if (rest.length > 0) {
      items.push({
        name: '기타',
        ratio: Math.max(0, 100 - items.reduce((s, item) => s + item.ratio, 0)),
        stockCode: null,
        marketType: null,
        type: 'OTHER',
      })
    } else {
      const sum = items.reduce((s, item) => s + item.ratio, 0)
      if (items.length > 0) items[items.length - 1].ratio += (100 - sum)
    }

    const returnRate = summary?.accountProfitLossRate != null
      ? Number(summary.accountProfitLossRate)
      : 0

    const accountProfitLoss = summary?.accountProfitLoss != null
      ? Number(summary.accountProfitLoss)
      : null

    return { items, returnRate, accountProfitLoss, isLoading: false }
  }, [summary, domestic, overseas, portfolio, sl, dl, ol, pl, enabled, topN])
}

function buildConicStops(items, getColor) {
  const safeItems = (items ?? []).map((item, i) => ({
    ...item,
    ratio: parseRatio(item.ratio),
    color: getColor(item, i),
  }))
  const total = safeItems.reduce((sum, item) => sum + item.ratio, 0)
  if (!Number.isFinite(total) || total <= 0) return ''

  let start = 0
  return safeItems.map((item) => {
    const end = start + (item.ratio / total) * 100
    const stop = `${item.color} ${start.toFixed(3)}% ${end.toFixed(3)}%`
    start = end
    return stop
  }).join(', ')
}

export default function PortfolioWidget({ variant = 'portfolio-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const { isAuthenticated, isRestoring } = useAuthStore()
  const { open } = useWidgetDetailStore()
  const portfolio = usePortfolio(isAuthenticated && !isRestoring, 5)
  const { getColor, ready } = usePortfolioColors(portfolio.items)
  const conicStops = useMemo(() => buildConicStops(portfolio.items, getColor), [portfolio.items, getColor])

  const returnRateStr = portfolio.returnRate != null
    ? `${portfolio.returnRate >= 0 ? '+' : ''}${portfolio.returnRate.toFixed(2)}%`
    : '-'
  const returnRateColor = portfolio.returnRate == null ? 'text-foreground-disabled' : portfolio.returnRate >= 0 ? 'text-up' : 'text-down'
  const profitLossStr = portfolio.accountProfitLoss != null
    ? `${portfolio.accountProfitLoss >= 0 ? '+' : ''}${Math.round(portfolio.accountProfitLoss).toLocaleString('ko-KR')}원`
    : null

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
          <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
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
                <div className="relative w-16 h-16 rounded-full shrink-0" style={ready && conicStops ? { background: `conic-gradient(${conicStops})` } : undefined}>
                  {(!ready || !conicStops) && <div className="absolute inset-0 rounded-full bg-surface-muted" />}
                  <div className="absolute inset-[28%] rounded-full bg-surface" />
                </div>
                <div>
                  <div className="text-widget-9 text-foreground-disabled">총 수익률</div>
                  <div className={`text-widget-22 font-bold leading-tight ${returnRateColor}`}>{returnRateStr}</div>
                  {profitLossStr && (
                    <div className={`text-widget-9 mt-0.5 ${returnRateColor}`}>{profitLossStr}</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto">
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
            <div className="flex items-stretch gap-2.5 flex-1 min-h-0">
              <div className="relative w-14 h-14 rounded-full shrink-0 self-center" style={ready && conicStops ? { background: `conic-gradient(${conicStops})` } : undefined}>
                {(!ready || !conicStops) && <div className="absolute inset-0 rounded-full bg-surface-muted" />}
                <div className="absolute inset-[30%] rounded-full bg-surface" />
              </div>
              <div className="flex flex-col gap-1 min-w-0 flex-1 min-h-0 overflow-y-auto">
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
