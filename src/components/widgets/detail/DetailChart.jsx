import { useEffect, useRef } from 'react'
import { LineSeries, CandlestickSeries, createChart } from 'lightweight-charts'

function getColors() {
  const style = getComputedStyle(document.documentElement)
  return {
    up:        style.getPropertyValue('--color-up').trim()                  || '#E8393E',
    down:      style.getPropertyValue('--color-down').trim()                || '#0075E8',
    textMuted: style.getPropertyValue('--color-foreground-disabled').trim() || '#9CA3AF',
    primary:   style.getPropertyValue('--color-primary').trim()             || '#0046FF',
  }
}

/**
 * 상세 차트 — 선형 / 캔들 전환 지원
 * @param {{ time: number, value: number }[]}                       lineData
 * @param {{ time: number, open, high, low, close: number }[]}      candleData
 * @param {'line'|'candle'} chartType
 * @param {boolean} isMinute
 * @param {boolean} isUp
 * @param {string}  className
 */
export default function DetailChart({ lineData, candleData, chartType = 'line', isMinute, isUp, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const { up, down, textMuted, primary } = getColors()
    const lineColor = isUp ? up : down

    const chart = createChart(el, {
      width:  el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: { color: 'transparent' },
        textColor:  textMuted,
        fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, sans-serif',
        fontSize:   10,
      },
      grid: {
        vertLines: { color: '#F3F4F6' },
        horzLines: { color: '#F3F4F6' },
      },
      leftPriceScale:  { visible: false },
      rightPriceScale: {
        visible: true,
        borderVisible: false,
        textColor: textMuted,
      },
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
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
          }
          if (tickMarkType <= 1) return `${d.getMonth() + 1}월`
          return `${d.getMonth() + 1}/${d.getDate()}`
        },
      },
      crosshair: {
        vertLine: { color: primary, width: 1, style: 1, labelBackgroundColor: primary },
        horzLine: { color: primary, width: 1, style: 1, labelBackgroundColor: primary },
      },
      handleScroll: false,
      handleScale:  false,
    })

    if (chartType === 'candle') {
      const series = chart.addSeries(CandlestickSeries, {
        upColor:         up,
        downColor:       down,
        borderUpColor:   up,
        borderDownColor: down,
        wickUpColor:     up,
        wickDownColor:   down,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      if (candleData?.length) {
        series.setData(candleData)
        chart.timeScale().fitContent()
      }
    } else {
      const series = chart.addSeries(LineSeries, {
        lineColor,
        lineWidth:              2,
        priceLineVisible:       false,
        lastValueVisible:       false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius:  4,
      })
      if (lineData?.length) {
        series.setData(lineData)
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
  }, [lineData, candleData, chartType, isMinute, isUp]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={ref} className={`overflow-hidden ${className}`} />
}
