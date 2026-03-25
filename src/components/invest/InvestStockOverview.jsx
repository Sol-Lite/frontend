import { Star } from 'lucide-react'
import InvestStockChart from '@/components/market/InvestStockChart'
import { useWatchlistSet } from '@/api/watchlist'
import InvestStockSearch from '@/components/invest/InvestStockSearch'
import LiveDot from '@/components/ui/LiveDot'
import PriceChange from '@/components/ui/PriceChange'
import StockAvatar from '@/components/ui/StockAvatar'
import {
  CHART_PERIOD_OPTIONS,
  MINUTE_INTERVAL_OPTIONS,
} from '@/features/invest/constants'
import {
  formatNumber,
  getDirectionClass,
} from '@/features/invest/formatters'
import { getChartPeriodLabel } from '@/features/invest/marketData'
import { cn } from '@/lib/cn'

export default function InvestStockOverview({
  stockMeta,
  currentPrice,
  changeAmount,
  changeRate,
  overview,
  chartSeries,
  chartPeriod,
  minuteInterval,
  chartLoading,
  chartErrorMessage,
  chartHistoryLoading,
  hasMoreChartHistory,
  onChartPeriodChange,
  onLoadMoreChartHistory,
  onMinuteIntervalChange,
  isLoading,
  errorMessage,
}) {
  const { watchedSet, toggle } = useWatchlistSet()
  const isWatched = watchedSet.has(stockMeta.code)
  const changeTone = getDirectionClass(changeAmount)
  const changeSign = changeAmount > 0 ? '+' : ''

  return (
    <section className="flex min-w-0 basis-0 flex-1 flex-col overflow-hidden border-r border-stroke bg-surface">
      <div className="border-b border-stroke px-[14px] py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <InvestStockSearch stockMeta={stockMeta} />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <LiveDot size="sm" />
            <span className="text-[9px] text-live">실시간</span>
          </div>
        </div>
        {errorMessage && (
          <div className="mt-1.5 text-[10px] text-danger">{errorMessage}</div>
        )}
      </div>

      <div className="border-b border-stroke px-[14px] py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <StockAvatar name={stockMeta.name} stockCode={stockMeta.code} marketType={stockMeta.market} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold leading-tight text-foreground">{stockMeta.name}</div>
            <div className="mt-0.5 text-[9px] text-foreground-disabled">
              {stockMeta.code} · {stockMeta.market} · {stockMeta.sector}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[22px] font-black leading-none tracking-tight text-foreground">
              {isLoading && currentPrice == null ? '...' : formatNumber(currentPrice)}
            </div>
            <div className="mt-1 flex items-center justify-end gap-1">
              <span className={cn('text-[11px] font-bold', changeTone)}>
                {changeSign}{formatNumber(changeAmount)}
              </span>
              {changeRate != null && !Number.isNaN(changeRate) && (
                <PriceChange value={changeRate} variant="text" className="text-[11px]" />
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label={isWatched ? '관심종목 해제' : '관심종목 추가'}
            onClick={() => toggle(stockMeta.code)}
            className={`shrink-0 rounded-full border-[1.5px] px-2 py-1 text-[10px] font-semibold transition-colors ${
              isWatched
                ? 'border-primary bg-primary-light text-primary'
                : 'border-stroke-input bg-surface text-foreground-secondary hover:border-primary hover:bg-primary-light hover:text-primary'
            }`}
          >
            <Star className="h-3 w-3" fill={isWatched ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-[14px] pb-2 pt-2.5">
        <InvestStockChart
          stockCode={stockMeta.code}
          stockName={stockMeta.name}
          overview={overview}
          series={chartSeries}
          selectedPeriod={chartPeriod}
          periodLabel={getChartPeriodLabel(chartPeriod, minuteInterval)}
          periodOptions={CHART_PERIOD_OPTIONS}
          minuteInterval={minuteInterval}
          minuteIntervalOptions={MINUTE_INTERVAL_OPTIONS}
          onPeriodChange={onChartPeriodChange}
          onLoadMoreHistory={onLoadMoreChartHistory}
          onMinuteIntervalChange={onMinuteIntervalChange}
          hasMoreHistory={hasMoreChartHistory}
          isLoading={chartLoading ?? isLoading}
          isLoadingMoreHistory={chartHistoryLoading}
          errorMessage={chartErrorMessage ?? errorMessage}
        />
      </div>
    </section>
  )
}
