import { Star } from 'lucide-react'
import InvestStockChart from '@/components/market/InvestStockChart'
import InvestStockSearch from '@/components/invest/InvestStockSearch'
import LiveDot from '@/components/ui/LiveDot'
import PriceChange from '@/components/ui/PriceChange'
import StockAvatar from '@/components/ui/StockAvatar'
import { getStockLogoUrl } from '@/lib/stockLogo'
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

function MiniMetric({ label, value, tone = 'neutral' }) {
  return (
    <div className="py-0.5">
      <div className="text-[8px] text-foreground-disabled">{label}</div>
      <div
        className={cn(
          'text-[11px] font-bold',
          tone === 'up' && 'text-up',
          tone === 'down' && 'text-down',
          tone === 'neutral' && 'text-foreground',
        )}
      >
        {value}
      </div>
    </div>
  )
}

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
  onChartPeriodChange,
  onMinuteIntervalChange,
  isLoading,
  errorMessage,
}) {
  const priceTone = getDirectionClass(changeAmount)
  const changeArrow = changeAmount > 0 ? '▲' : changeAmount < 0 ? '▼' : ''

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
          {getStockLogoUrl(stockMeta.market, stockMeta.code) ? (
            <img
              src={getStockLogoUrl(stockMeta.market, stockMeta.code)}
              alt={stockMeta.name}
              className="h-9 w-9 shrink-0 rounded-full border-2 border-stroke bg-background object-contain"
              onError={(e) => { e.target.replaceWith(Object.assign(document.createElement('span'), { className: e.target.className, textContent: stockMeta.name.slice(0, 2) })) }}
            />
          ) : (
            <StockAvatar name={stockMeta.name} size="lg" className="border-2" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold leading-tight text-foreground">{stockMeta.name}</div>
            <div className="mt-0.5 text-[9px] text-foreground-disabled">
              {stockMeta.code} · {stockMeta.market} · {stockMeta.sector}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className={cn('text-[22px] font-black leading-none tracking-tight', priceTone)}>
              {isLoading && currentPrice == null ? '...' : formatNumber(currentPrice)}
            </div>
            <div className="mt-1 flex items-center justify-end gap-1">
              <span className={cn('text-[11px] font-bold', priceTone)}>
                {changeArrow}{formatNumber(Math.abs(changeAmount))}
              </span>
              {changeRate != null && !Number.isNaN(changeRate) && (
                <PriceChange value={changeRate} variant="badge" />
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="관심 종목"
            className="shrink-0 rounded-full border-[1.5px] border-stroke-input bg-surface px-2 py-1 text-[10px] font-semibold text-foreground-secondary transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
          >
            <Star className="h-3 w-3" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-0 border-b border-stroke px-[14px] py-1.5 shrink-0">
        <MiniMetric label="시가" value={formatNumber(overview.open)} />
        <MiniMetric label="고가" value={formatNumber(overview.high)} tone="up" />
        <MiniMetric label="저가" value={formatNumber(overview.low)} tone="down" />
        <MiniMetric label="전일종가" value={formatNumber(overview.previousClose)} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-[14px] pb-2 pt-2.5">
        <InvestStockChart
          stockCode={stockMeta.code}
          stockName={stockMeta.name}
          series={chartSeries}
          selectedPeriod={chartPeriod}
          periodLabel={getChartPeriodLabel(chartPeriod, minuteInterval)}
          periodOptions={CHART_PERIOD_OPTIONS}
          minuteInterval={minuteInterval}
          minuteIntervalOptions={MINUTE_INTERVAL_OPTIONS}
          onPeriodChange={onChartPeriodChange}
          onMinuteIntervalChange={onMinuteIntervalChange}
          isLoading={chartLoading ?? isLoading}
          errorMessage={chartErrorMessage ?? errorMessage}
        />
      </div>
    </section>
  )
}
