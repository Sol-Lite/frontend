import { memo, useEffect, useRef, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CandlestickSeries, CrosshairMode, HistogramSeries, LineSeries, createChart } from 'lightweight-charts'
import { ChevronDown } from 'lucide-react'
import { formatVisiblePrice } from '@/features/invest/formatters'
import { cn } from '@/lib/cn'
import useUIStore from '@/store/useUIStore'

const LIGHT_COLORS = {
  background:      '#FFFFFF',
  primary:         '#0046FF',
  grid:            '#F3F4F6',
  text:            '#6B7280',
  up:              '#E8393E',
  down:            '#0075E8',
  volumeUp:        'rgba(232, 57, 62, 0.28)',
  volumeDown:      'rgba(0, 117, 232, 0.28)',
}

const DARK_COLORS = {
  background:      '#181B24',
  primary:         '#0046FF',
  grid:            '#252836',
  text:            '#8A8D93',
  up:              '#E8393E',
  down:            '#0075E8',
  volumeUp:        'rgba(232, 57, 62, 0.28)',
  volumeDown:      'rgba(0, 117, 232, 0.28)',
}

function toChartTime(timestamp) {
  return Math.floor(timestamp / 1000)
}

function formatChartDateTime(time, { isIntraday }) {
  const date = new Date(time * 1000)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')

  return isIntraday ? `${yyyy}/${mm}/${dd} ${hh}:${mi}` : `${yyyy}/${mm}/${dd}`
}

const InvestStockChart = memo(function InvestStockChart({
  stockCode,
  overview,
  series = [],
  selectedPeriod,
  periodOptions = [],
  minuteInterval,
  minuteIntervalOptions = [],
  onPeriodChange,
  onMinuteIntervalChange,
  onLoadMoreHistory,
  hasMoreHistory = false,
  isLoading,
  isLoadingMoreHistory = false,
  errorMessage,
  marketType,
  displayCurrency,
  usdRate,
}) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const areaSeriesRef = useRef(null)
  const initialFitDoneRef = useRef(false)
  const seriesDataRef = useRef(series)
  const visibleLogicalRangeRef = useRef(null)
  const onLoadMoreHistoryRef = useRef(onLoadMoreHistory)
  const hasMoreHistoryRef = useRef(hasMoreHistory)
  const isLoadingMoreHistoryRef = useRef(isLoadingMoreHistory)
  const lastHistoryAnchorRef = useRef(null)
  const previousLogicalFromRef = useRef(null)

  useEffect(() => {
    seriesDataRef.current = series
  }, [series])

  useEffect(() => {
    onLoadMoreHistoryRef.current = onLoadMoreHistory
  }, [onLoadMoreHistory])

  useEffect(() => {
    hasMoreHistoryRef.current = hasMoreHistory
  }, [hasMoreHistory])

  useEffect(() => {
    isLoadingMoreHistoryRef.current = isLoadingMoreHistory
  }, [isLoadingMoreHistory])

  useEffect(() => {
    lastHistoryAnchorRef.current = null
    previousLogicalFromRef.current = null
    visibleLogicalRangeRef.current = null
  }, [stockCode, selectedPeriod, minuteInterval])

  const theme = useUIStore((s) => s.theme)

  const [chartType, setChartType] = useState(
    () => localStorage.getItem('invest.chartType') ?? 'candle',
  )

  useEffect(() => {
    localStorage.setItem('invest.chartType', chartType)
  }, [chartType])

  const isIntraday = selectedPeriod === 'MINUTE'
// Effect 1: 차트 생성 — chartType / isIntraday / theme 바뀔 때만 재생성
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: colors.background },
        textColor: colors.text,
        fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, sans-serif',
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      rightPriceScale: {
        borderVisible: false,
        autoScale: true,
        scaleMargins: { top: 0.14, bottom: 0.22 },
      },
      leftPriceScale: { visible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: isIntraday,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: isIntraday ? 10 : 8,
        tickMarkFormatter: (time) => {
          const formatted = formatChartDateTime(time, { isIntraday })
          return isIntraday ? formatted.slice(11) : formatted.slice(5)
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: colors.primary, width: 1, style: 1, labelBackgroundColor: colors.primary },
        horzLine: { color: colors.primary, width: 1, style: 1, labelBackgroundColor: colors.primary },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      localization: {
        locale: 'ko-KR',
        dateFormat: 'yyyy/MM/dd',
        priceFormatter: (price) => formatVisiblePrice(price, { marketType, displayCurrency, usdRate }),
        timeFormatter: (time) => formatChartDateTime(time, { isIntraday }),
      },
    })

    chartRef.current = chart
    initialFitDoneRef.current = false

    const current = seriesDataRef.current
    const restoreVisibleRange = () => {
      const savedRange = visibleLogicalRangeRef.current
      if (savedRange) {
        chart.timeScale().setVisibleLogicalRange(savedRange)
      } else {
        chart.timeScale().fitContent()
      }
      initialFitDoneRef.current = true
    }

    if (chartType === 'candle') {
      candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: colors.up,
        borderUpColor: colors.up,
        wickUpColor: colors.up,
        downColor: colors.down,
        borderDownColor: colors.down,
        wickDownColor: colors.down,
        priceLineVisible: true,
        lastValueVisible: true,
      })

      volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
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

      areaSeriesRef.current = null

      if (current.length > 0) {
        candleSeriesRef.current.setData(
          current.map((p) => ({ time: toChartTime(p.timestamp), open: p.open, high: p.high, low: p.low, close: p.close })),
        )
        volumeSeriesRef.current.setData(
          current.map((p) => ({
            time: toChartTime(p.timestamp),
            value: p.volume,
            color: p.close >= p.open ? colors.volumeUp : colors.volumeDown,
          })),
        )
        restoreVisibleRange()
      }
    } else {
      areaSeriesRef.current = chart.addSeries(LineSeries, {
        lineColor: colors.primary,
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      })

      candleSeriesRef.current = null
      volumeSeriesRef.current = null

      if (current.length > 0) {
        areaSeriesRef.current.setData(
          current.map((p) => ({ time: toChartTime(p.timestamp), value: p.close })),
        )
        restoreVisibleRange()
      }
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      chart.applyOptions({ width: entry.contentRect.width, height: entry.contentRect.height })
    })

    resizeObserver.observe(container)

    const handleVisibleLogicalRangeChange = (logicalRange) => {
      if (logicalRange) {
        visibleLogicalRangeRef.current = logicalRange
      }

      if (!logicalRange || !hasMoreHistoryRef.current || isLoadingMoreHistoryRef.current) {
        return
      }

      const currentFrom = logicalRange.from
      if (!Number.isFinite(currentFrom)) return

      const previousFrom = previousLogicalFromRef.current
      previousLogicalFromRef.current = currentFrom
      if (previousFrom == null || currentFrom >= previousFrom) {
        return
      }

      const activeSeries = candleSeriesRef.current ?? areaSeriesRef.current
      if (!activeSeries) return

      const earliestPoint = seriesDataRef.current[0]
      if (!earliestPoint) return

      const barsInfo = activeSeries.barsInLogicalRange(logicalRange)
      if (!barsInfo || barsInfo.barsBefore >= 20) return

      if (lastHistoryAnchorRef.current === earliestPoint.timestamp) {
        return
      }

      lastHistoryAnchorRef.current = earliestPoint.timestamp
      void onLoadMoreHistoryRef.current?.()
    }

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange)

    return () => {
      visibleLogicalRangeRef.current = chart.timeScale().getVisibleLogicalRange()
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange)
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
      areaSeriesRef.current = null
    }
  }, [chartType, displayCurrency, isIntraday, marketType, theme, usdRate])

  // Effect 2: 데이터 업데이트 — series 바뀔 때만 (차트 재생성 없음)
  useEffect(() => {
    if (series.length === 0) return

    if (candleSeriesRef.current) {
      candleSeriesRef.current.setData(
        series.map((point) => ({
          time: toChartTime(point.timestamp),
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
        })),
      )
      volumeSeriesRef.current?.setData(
        series.map((point) => ({
          time: toChartTime(point.timestamp),
          value: point.volume,
          color: point.close >= point.open ? LIGHT_COLORS.volumeUp : LIGHT_COLORS.volumeDown,
        })),
      )
    }

    if (areaSeriesRef.current) {
      areaSeriesRef.current.setData(
        series.map((point) => ({
          time: toChartTime(point.timestamp),
          value: point.close,
        })),
      )
    }

    if (!initialFitDoneRef.current && chartRef.current) {
      chartRef.current.timeScale().fitContent()
      initialFitDoneRef.current = true
    }
  }, [series])

  const overlay =
    isLoading && series.length === 0 ? (
      <div className="absolute inset-0 flex items-center justify-center text-xs text-foreground-disabled">
        시세 데이터를 불러오는 중입니다.
      </div>
    ) : errorMessage && series.length === 0 ? (
      <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-danger">
        {errorMessage}
      </div>
    ) : series.length === 0 ? (
      <div className="absolute inset-0 flex items-center justify-center text-xs text-foreground-disabled">
        표시할 차트 데이터가 없습니다.
      </div>
    ) : null

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-stroke bg-surface">
      <div className="flex items-center justify-between border-b border-stroke px-3 py-2">
        {overview && (
          <div className="flex items-center gap-2.5 text-[10px]">
            <span>
              <span className="mr-1 text-foreground-disabled">시가</span>
              <span className="font-semibold text-foreground">{formatVisiblePrice(overview.open, { marketType, displayCurrency, usdRate })}</span>
            </span>
            <span className="select-none text-stroke-subtle">·</span>
            <span>
              <span className="mr-1 text-foreground-disabled">고가</span>
              <span className="font-semibold text-up">{formatVisiblePrice(overview.high, { marketType, displayCurrency, usdRate })}</span>
            </span>
            <span className="select-none text-stroke-subtle">·</span>
            <span>
              <span className="mr-1 text-foreground-disabled">저가</span>
              <span className="font-semibold text-down">{formatVisiblePrice(overview.low, { marketType, displayCurrency, usdRate })}</span>
            </span>
            <span className="select-none text-stroke-subtle">·</span>
            <span>
              <span className="mr-1 text-foreground-disabled">전일</span>
              <span className="font-semibold text-foreground">{formatVisiblePrice(overview.previousClose, { marketType, displayCurrency, usdRate })}</span>
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
                    ? 'bg-primary text-white shadow-control'
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
                    ? 'bg-primary text-white shadow-control'
                    : 'text-foreground-disabled hover:text-foreground-secondary',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative min-h-0 min-w-0 flex-1">
        <div ref={containerRef} className="h-full w-full bg-surface" />
        {isLoadingMoreHistory && series.length > 0 && (
          <div className="absolute left-3 top-3 rounded-md bg-surface/90 px-2 py-1 text-[10px] font-medium text-foreground-secondary shadow-sm">
            이전 차트 로딩 중
          </div>
        )}
{overlay}
      </div>

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
