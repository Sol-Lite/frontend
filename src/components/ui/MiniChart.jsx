import { useEffect, useRef } from 'react'
import { CandlestickSeries, LineSeries, createChart } from 'lightweight-charts'

function getChartColors() {
  const style = getComputedStyle(document.documentElement)
  const up        = style.getPropertyValue('--color-up').trim()                  || '#E8393E'
  const down      = style.getPropertyValue('--color-down').trim()                || '#0075E8'
  const textMuted = style.getPropertyValue('--color-foreground-disabled').trim() || '#9CA3AF'
  const gridColor = style.getPropertyValue('--color-stroke').trim()              || '#EAECF0'
  return { up, down, textMuted, gridColor }
}

/**
 * 위젯용 미니 차트 (lightweight-charts)
 * @param {{ time: number, value: number }[]}                    data        - 라인용 (unix seconds)
 * @param {{ time: number, open, high, low, close: number }[]}  candleData  - 캔들용 (unix seconds)
 * @param {'line'|'candle'} chartType
 * @param {boolean} isMinute  - true면 X축에 시간(HH:MM), false면 날짜(M/D)
 * @param {boolean} isUp
 * @param {string}  className
 */
export default function MiniChart({ data, candleData, chartType = 'line', isMinute = false, isUp, className = '' }) {
  const ref       = useRef(null)
  const seriesRef = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const { up, down, textMuted, gridColor } = getChartColors()
    const lineColor = isUp ? up : down

    const chart = createChart(el, {
      width:  el.clientWidth,
      height: el.clientHeight,
      layout: {
        background:  { color: 'transparent' },
        textColor:   textMuted,
        fontFamily:  'Pretendard, -apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, sans-serif',
        fontSize:    9,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: gridColor, style: 2 },
      },
      leftPriceScale:  { visible: false },
      rightPriceScale: { visible: false },
      timeScale: {
        visible:        true,
        timeVisible:    isMinute,
        secondsVisible: false,
        borderVisible:  false,
        ticksVisible:   false,
        fixLeftEdge:    true,
        fixRightEdge:   true,
        tickMarkFormatter: (time, tickMarkType) => {
          const d = new Date(time * 1000)
          if (isMinute) {
            const hh = String(d.getHours()).padStart(2, '0')
            const mm = String(d.getMinutes()).padStart(2, '0')
            return `${hh}:${mm}`
          }
          if (tickMarkType <= 1) {
            // Year or Month tick
            return `${d.getMonth() + 1}월`
          }
          return `${d.getMonth() + 1}/${d.getDate()}`
        },
      },
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
  }, [data, candleData, chartType, isMinute]) // eslint-disable-line react-hooks/exhaustive-deps

  // 라인 모드: isUp 변경 시 색상만 업데이트
  useEffect(() => {
    if (!seriesRef.current || chartType === 'candle') return
    const { up, down } = getChartColors()
    seriesRef.current.applyOptions({ lineColor: isUp ? up : down })
  }, [isUp, chartType])

  return <div ref={ref} className={`overflow-hidden ${className}`} />
}
