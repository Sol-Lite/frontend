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

function formatTz(epochSec, timezone, isMinute) {
  const d = new Date(epochSec * 1000)
  if (timezone) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(d)
    const get = (type) => parts.find((p) => p.type === type)?.value ?? '00'
    if (isMinute) return `${get('year')}/${get('month')}/${get('day')} ${get('hour')}:${get('minute')}`
    return `${get('year')}/${get('month')}/${get('day')}`
  }
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  if (isMinute) {
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${d.getFullYear()}/${m}/${dd} ${hh}:${mi}`
  }
  return `${d.getFullYear()}/${m}/${dd}`
}

function getTickLabel(epochSec, tickMarkType, timezone, isMinute) {
  const d = new Date(epochSec * 1000)
  if (timezone) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(d)
    const get = (type) => parts.find((p) => p.type === type)?.value ?? '00'
    if (isMinute) return `${get('hour')}:${get('minute')}`
    if (tickMarkType <= 1) return `${Number(get('month'))}월`
    return `${Number(get('month'))}/${Number(get('day'))}`
  }
  if (isMinute) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  if (tickMarkType <= 1) return `${d.getMonth() + 1}월`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/**
 * 상세 차트 — 선형 / 캔들 전환 지원
 * @param {{ time: number, value: number }[]}                       lineData
 * @param {{ time: number, open, high, low, close: number }[]}      candleData
 * @param {'line'|'candle'} chartType
 * @param {boolean} isMinute
 * @param {boolean} isUp
 * @param {string}  [timezone]  - IANA timezone (e.g. 'America/New_York'). 없으면 로컬 시간.
 * @param {string}  className
 */
export default function DetailChart({ lineData, candleData, chartType = 'line', isMinute, isUp, timezone, className = '' }) {
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
      localization: {
        timeFormatter: (time) => formatTz(time, timezone, isMinute),
      },
      timeScale: {
        visible:        true,
        timeVisible:    isMinute,
        secondsVisible: false,
        borderVisible:  false,
        ticksVisible:   false,
        fixLeftEdge:    true,
        fixRightEdge:   true,
        tickMarkFormatter: (time, tickMarkType) => getTickLabel(time, tickMarkType, timezone, isMinute),
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
  }, [lineData, candleData, chartType, isMinute, isUp, timezone]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={ref} className={`overflow-hidden ${className}`} />
}
