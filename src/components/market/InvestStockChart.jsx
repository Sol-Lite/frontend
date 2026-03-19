import { memo, useEffect, useRef } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CandlestickSeries, HistogramSeries, createChart } from 'lightweight-charts'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

const COLORS = {
  background: '#FFFFFF',
  backgroundSubtle: '#F8F9FB',
  border: '#EAECF0',
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
        borderColor: COLORS.border,
        scaleMargins: {
          top: 0.08,
          bottom: 0.22,
        },
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        borderColor: COLORS.border,
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
      priceFormat: {
        type: 'volume',
      },
      priceLineVisible: false,
      lastValueVisible: false,
    })

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.78,
        bottom: 0,
      },
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
  }, [series, isIntraday])

  if (isLoading && series.length === 0) {
    return (
      <div className="flex flex-1 min-h-[320px] items-center justify-center rounded-xl border border-stroke bg-surface text-xs text-foreground-disabled">
        시세 데이터를 불러오는 중입니다.
      </div>
    )
  }

  if (errorMessage && series.length === 0) {
    return (
      <div className="flex flex-1 min-h-[320px] items-center justify-center rounded-xl border border-stroke bg-surface px-4 text-center text-xs text-danger">
        {errorMessage}
      </div>
    )
  }

  if (series.length === 0) {
    return (
      <div className="flex flex-1 min-h-[320px] items-center justify-center rounded-xl border border-stroke bg-surface text-xs text-foreground-disabled">
        표시할 차트 데이터가 없습니다.
      </div>
    )
  }

  return (
    <div className="flex min-h-[320px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-stroke bg-surface">
      <div className="flex items-center justify-between border-b border-stroke bg-surface-subtle px-3 py-2">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[.04em] text-foreground-disabled">
            Lightweight Charts
          </div>
          <div className="mt-0.5 text-[13px] font-bold text-foreground">{stockName}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap justify-end gap-1">
            {periodOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => onPeriodChange?.(option.key)}
                className={cn(
                  'rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors',
                  selectedPeriod === option.key
                    ? 'border-primary bg-primary text-white'
                    : 'border-stroke bg-surface text-foreground-secondary hover:border-primary hover:text-primary',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {selectedPeriod === 'MINUTE' && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-foreground bg-surface px-2.5 py-1 text-[10px] font-semibold text-foreground transition-colors hover:bg-surface-subtle"
                >
                  <span>{minuteInterval}분</span>
                  <ChevronDown className="h-3 w-3" strokeWidth={2.25} />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={6}
                  className="z-50 min-w-[76px] rounded-lg border border-stroke bg-surface p-1 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
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
          )}
          <div className="text-[9px] text-foreground-disabled">
            {periodLabel} · {stockCode}
          </div>
        </div>
      </div>

      <div ref={containerRef} className="min-h-[260px] min-w-0 flex-1 bg-surface" />

      <div className="flex items-center justify-between border-t border-stroke bg-surface-subtle px-3 py-1.5 text-[9px] text-foreground-disabled">
        <span>현재가 {formatNumber(series.at(-1)?.close)}</span>
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Charts by TradingView
        </a>
      </div>
    </div>
  )
})

export default InvestStockChart
