import { memo, useEffect, useRef, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AreaSeries, CandlestickSeries, HistogramSeries, createChart } from 'lightweight-charts'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

const COLORS = {
  background: '#FFFFFF',
  backgroundSubtle: '#F8F9FB',
  border: '#EAECF0',
  primary: '#0046FF',
  primaryArea: 'rgba(0, 70, 255, 0.08)',
  grid: '#F3F4F6',
  text: '#6B7280',
  textStrong: '#191F28',
  up: '#E8393E',
  down: '#0075E8',
  volumeUp: 'rgba(232, 57, 62, 0.28)',
  volumeDown: 'rgba(0, 117, 232, 0.28)',
}

function toChartTime(timestamp) {
  return Math.floor(timestamp / 1000)
}

function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return '-'
  return new Intl.NumberFormat('ko-KR').format(Math.round(value))
}

const InvestStockChart = memo(function InvestStockChart({
  stockCode,
  stockName,
  overview,
  series = [],
  selectedPeriod,
  periodLabel,
  periodOptions = [],
  minuteInterval,
  minuteIntervalOptions = [],
  onPeriodChange,
  onMinuteIntervalChange,
  isLoading,
  errorMessage,
}) {
  const containerRef = useRef(null)
  const [chartType, setChartType] = useState(
    () => localStorage.getItem('invest.chartType') ?? 'candle',
  )

  useEffect(() => {
    localStorage.setItem('invest.chartType', chartType)
  }, [chartType])

  const isIntraday = selectedPeriod === 'MINUTE'

  useEffect(() => {
    const container = containerRef.current

    if (!container || series.length === 0) return

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: COLORS.background },
        textColor: COLORS.text,
        fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, sans-serif',
      },
      grid: {
        vertLines: { color: COLORS.grid },
        horzLines: { color: COLORS.grid },
      },
      rightPriceScale: {
        borderVisible: false,
        autoScale: true,
        scaleMargins: {
          top: 0.14,
          bottom: 0.22,
        },
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: isIntraday,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: isIntraday ? 10 : 8,
      },
      crosshair: {
        vertLine: {
          color: COLORS.border,
          width: 1,
          labelBackgroundColor: COLORS.textStrong,
        },
        horzLine: {
          color: COLORS.border,
          width: 1,
          labelBackgroundColor: COLORS.textStrong,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    })

    if (chartType === 'candle') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: COLORS.up,
        borderUpColor: COLORS.up,
        wickUpColor: COLORS.up,
        downColor: COLORS.down,
        borderDownColor: COLORS.down,
        wickDownColor: COLORS.down,
        priceLineVisible: true,
        lastValueVisible: true,
      })

      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceScaleId: 'volume',
        priceFormat: { type: 'volume' },
        priceLineVisible: false,
        lastValueVisible: false,
      })

      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.78, bottom: 0 },
        visible: false,
        borderVisible: false,
      })

      candleSeries.setData(
        series.map((point) => ({
          time: toChartTime(point.timestamp),
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
        })),
      )

      volumeSeries.setData(
        series.map((point) => ({
          time: toChartTime(point.timestamp),
          value: point.volume,
          color: point.close >= point.open ? COLORS.volumeUp : COLORS.volumeDown,
        })),
      )
    } else {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: COLORS.primary,
        topColor: COLORS.primaryArea,
        bottomColor: 'rgba(0, 70, 255, 0)',
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      })

      areaSeries.setData(
        series.map((point) => ({
          time: toChartTime(point.timestamp),
          value: point.close,
        })),
      )
    }

    chart.timeScale().fitContent()

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      chart.applyOptions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [series, isIntraday, chartType])

  if (isLoading && series.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-stroke bg-surface text-xs text-foreground-disabled">
        시세 데이터를 불러오는 중입니다.
      </div>
    )
  }

  if (errorMessage && series.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-stroke bg-surface px-4 text-center text-xs text-danger">
        {errorMessage}
      </div>
    )
  }

  if (series.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-stroke bg-surface text-xs text-foreground-disabled">
        표시할 차트 데이터가 없습니다.
      </div>
    )
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-stroke bg-surface">
      <div className="flex items-center justify-between border-b border-stroke px-3 py-2">
        {overview && (
          <div className="flex items-center gap-2.5 text-[10px]">
            <span>
              <span className="mr-1 text-foreground-disabled">시가</span>
              <span className="font-semibold text-foreground">{formatNumber(overview.open)}</span>
            </span>
            <span className="select-none text-stroke-subtle">·</span>
            <span>
              <span className="mr-1 text-foreground-disabled">고가</span>
              <span className="font-semibold text-up">{formatNumber(overview.high)}</span>
            </span>
            <span className="select-none text-stroke-subtle">·</span>
            <span>
              <span className="mr-1 text-foreground-disabled">저가</span>
              <span className="font-semibold text-down">{formatNumber(overview.low)}</span>
            </span>
            <span className="select-none text-stroke-subtle">·</span>
            <span>
              <span className="mr-1 text-foreground-disabled">전일</span>
              <span className="font-semibold text-foreground">{formatNumber(overview.previousClose)}</span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg bg-surface-muted p-0.5">
            {[{ key: 'candle', label: '캔들' }, { key: 'line', label: '라인' }].map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => setChartType(type.key)}
                className={cn(
                  'rounded-md px-2.5 py-0.5 text-[10px] font-semibold transition-all',
                  chartType === type.key
                    ? 'bg-surface text-foreground shadow-control'
                    : 'text-foreground-disabled hover:text-foreground-secondary',
                )}
              >
                {type.label}
              </button>
            ))}
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors',
                  selectedPeriod === 'MINUTE'
                    ? 'bg-primary text-white'
                    : 'text-foreground-disabled hover:text-foreground-secondary',
                )}
              >
                <span>{minuteInterval}분</span>
                <ChevronDown className="h-2.5 w-2.5" strokeWidth={2.5} />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-50 min-w-[76px] rounded-lg border border-stroke bg-surface p-1 shadow-dropdown"
              >
                {minuteIntervalOptions.map((value) => (
                  <DropdownMenu.Item
                    key={value}
                    onSelect={() => onMinuteIntervalChange?.(value)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-semibold text-foreground-secondary outline-none transition-colors',
                      'data-[highlighted]:bg-surface-subtle data-[highlighted]:text-foreground',
                      minuteInterval === value && 'bg-surface-subtle text-foreground',
                    )}
                  >
                    <span>{value}분</span>
                    {minuteInterval === value && (
                      <span className="text-[9px] font-bold text-primary">현재</span>
                    )}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <div className="flex items-center rounded-lg bg-surface-muted p-0.5">
            {periodOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => onPeriodChange?.(option.key)}
                className={cn(
                  'rounded-md px-2.5 py-0.5 text-[10px] font-semibold transition-all',
                  selectedPeriod === option.key
                    ? 'bg-surface text-foreground shadow-control'
                    : 'text-foreground-disabled hover:text-foreground-secondary',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={containerRef} className="min-h-0 min-w-0 flex-1 bg-surface" />

      <div className="flex justify-end px-3 py-1.5">
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noreferrer"
          className="text-[9px] text-foreground-disabled underline-offset-2 hover:text-foreground-tertiary hover:underline"
        >
          Charts by TradingView
        </a>
      </div>
    </div>
  )
})

export default InvestStockChart
