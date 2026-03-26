import { useEffect, useRef } from 'react'
import { CandlestickSeries, LineSeries, createChart } from 'lightweight-charts'

function getChartColors() {
  const style = getComputedStyle(document.documentElement)
  const up   = style.getPropertyValue('--color-up').trim()   || '#E8393E'
  const down = style.getPropertyValue('--color-down').trim() || '#0075E8'
  return { up, down }
}

/**
 * 위젯용 미니 차트 (lightweight-charts)
 * @param {{ time: number, value: number }[]}                    data        - 라인용 (unix seconds)
 * @param {{ time: number, open, high, low, close: number }[]}  candleData  - 캔들용 (unix seconds)
 * @param {'line'|'candle'} chartType
 * @param {boolean} isUp
 * @param {string}  className
 */
export default function MiniChart({ data, candleData, chartType = 'line', isUp, className = '' }) {
  const ref       = useRef(null)
  const seriesRef = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const { up, down } = getChartColors()
    const lineColor = isUp ? up : down

    const chart = createChart(el, {
      width:  el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: { color: 'transparent' },
        textColor:  'transparent',
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
      const series = chart.addSeries(CandlestickSeries, {
        upColor:         up,
        borderUpColor:   up,
        wickUpColor:     up,
        downColor:       down,
        borderDownColor: down,
        wickDownColor:   down,
        priceLineVisible:  false,
        lastValueVisible:  false,
      })
      seriesRef.current = series
      if (candleData?.length) {
        series.setData(candleData)
        chart.timeScale().fitContent()
      }
    } else {
      const series = chart.addSeries(LineSeries, {
        lineColor,
        lineWidth:              1.5,
        priceLineVisible:       false,
        lastValueVisible:       false,
        crosshairMarkerVisible: false,
      })
      seriesRef.current = series
      if (data?.length) {
        series.setData(data)
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
      seriesRef.current = null
    }
  }, [data, candleData, chartType]) // eslint-disable-line react-hooks/exhaustive-deps

  // 라인 모드: isUp 변경 시 색상만 업데이트
  useEffect(() => {
    if (!seriesRef.current || chartType === 'candle') return
    const { up, down } = getChartColors()
    seriesRef.current.applyOptions({ lineColor: isUp ? up : down })
  }, [isUp, chartType])

  return <div ref={ref} className={`overflow-hidden ${className}`} />
}
