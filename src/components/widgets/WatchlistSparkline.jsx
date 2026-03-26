import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CandlestickSeries, LineSeries, createChart } from 'lightweight-charts'
import { marketApi } from '@/api/market'
import { normalizeMinuteSeries } from '@/features/invest/domestic/normalize'

function getColors() {
  const style = getComputedStyle(document.documentElement)
  return {
    up:   style.getPropertyValue('--color-up').trim()   || '#E8393E',
    down: style.getPropertyValue('--color-down').trim() || '#0075E8',
  }
}

function toChartTime(timestamp) {
  return Math.floor(timestamp / 1000)
}

export default function WatchlistSparkline({ stockCode, chartType = 'line', isUp, className = '' }) {
  const containerRef = useRef(null)

  const { data: rawData } = useQuery({
    queryKey: ['watchlist-sparkline', stockCode],
    queryFn: () => marketApi.getMinuteChart(stockCode, { ncnt: 5 }),
    enabled: !!stockCode,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const series = useMemo(
    () => normalizeMinuteSeries(rawData?.data ?? rawData),
    [rawData],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const { up, down } = getColors()
    const lineColor = isUp ? up : down

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: { color: 'transparent' },
        textColor: 'transparent',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      leftPriceScale:  { visible: false },
      rightPriceScale: { visible: false },
      timeScale:       { visible: false },
      crosshair: {
        vertLine: { visible: false, labelVisible: false },
        horzLine: { visible: false, labelVisible: false },
      },
      handleScroll: false,
      handleScale:  false,
    })

    if (chartType === 'candle') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor:         up,
        borderUpColor:   up,
        wickUpColor:     up,
        downColor:       down,
        borderDownColor: down,
        wickDownColor:   down,
        priceLineVisible:  false,
        lastValueVisible:  false,
      })
      if (series.length > 0) {
        candleSeries.setData(
          series.map((p) => ({
            time:  toChartTime(p.timestamp),
            open:  p.open,
            high:  p.high,
            low:   p.low,
            close: p.close,
          })),
        )
        chart.timeScale().fitContent()
      }
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        lineColor,
        lineWidth:              1.5,
        priceLineVisible:       false,
        lastValueVisible:       false,
        crosshairMarkerVisible: false,
      })
      if (series.length > 0) {
        lineSeries.setData(
          series.map((p) => ({ time: toChartTime(p.timestamp), value: p.close })),
        )
        chart.timeScale().fitContent()
      }
    }

    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return
      chart.applyOptions({
        width:  entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      chart.remove()
    }
  }, [series, chartType, isUp])

  return <div ref={containerRef} className={`overflow-hidden ${className}`} />
}
