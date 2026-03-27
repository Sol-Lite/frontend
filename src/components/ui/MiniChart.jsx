import { useEffect, useRef } from 'react'
import { CandlestickSeries, createChart } from 'lightweight-charts'

function getChartColors() {
  const style = getComputedStyle(document.documentElement)
  const up        = style.getPropertyValue('--color-up').trim()                  || '#E8393E'
  const down      = style.getPropertyValue('--color-down').trim()                || '#0075E8'
  const textMuted = style.getPropertyValue('--color-foreground-disabled').trim() || '#9CA3AF'
  return { up, down, textMuted }
}

/**
 * 위젯용 캔들 차트 (lightweight-charts)
 * @param {{ time: number, open, high, low, close: number }[]} candleData - 캔들 데이터 (unix seconds)
 * @param {{ time: number, open, high, low, close: number }}   liveCandle - STOMP 실시간 업데이트 포인트
 * @param {boolean} isMinute  - true면 X축 HH:MM / 좌측 고정, false면 M/D
 * @param {string}  className
 */
export default function MiniChart({ candleData, liveCandle, isMinute = false, className = '' }) {
  const ref       = useRef(null)
  const seriesRef = useRef(null)

  // 차트 생성 — candleData / isMinute 변경 시 재생성
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const { up, down, textMuted } = getChartColors()

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
        horzLines: { visible: false },
      },
      leftPriceScale:  { visible: false },
      rightPriceScale: {
        visible:       true,
        borderVisible: false,
        minimumWidth:  48,
        scaleMargins:  { top: 0.08, bottom: 0.08 },
      },
      localization: {
        priceFormatter: (price) => Math.round(price).toLocaleString('ko-KR'),
      },
      timeScale: {
        visible:        true,
        timeVisible:    isMinute,
        secondsVisible: false,
        borderVisible:  false,
        ticksVisible:   false,
        fixLeftEdge:    true,
        fixRightEdge:   !isMinute, // 분봉: 우측 열린 상태로 캔들이 오른쪽으로 추가됨
        tickMarkFormatter: (time, tickMarkType) => {
          const d = new Date(time * 1000)
          if (isMinute) {
            const hh = String(d.getHours()).padStart(2, '0')
            const mm = String(d.getMinutes()).padStart(2, '0')
            return `${hh}:${mm}`
          }
          if (tickMarkType <= 1) return `${d.getMonth() + 1}월`
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

    const series = chart.addSeries(CandlestickSeries, {
      upColor:         up,
      borderUpColor:   up,
      wickUpColor:     up,
      downColor:       down,
      borderDownColor: down,
      wickDownColor:   down,
      priceLineVisible: false,
      lastValueVisible: false,
    })
    seriesRef.current = series

    if (candleData?.length) {
      series.setData(candleData)
      if (isMinute) {
        // 장 시작~마감(09:00~15:30)을 고정 범위로 지정 → 캔들 폭이 일정하게 유지
        const today = new Date()
        const from = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0).getTime() / 1000
        const to   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30, 0).getTime() / 1000
        chart.timeScale().setVisibleRange({ from, to })
      } else {
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
  }, [candleData, isMinute])

  // STOMP 실시간 캔들 업데이트 — 차트 재생성 없이 마지막 봉만 갱신
  useEffect(() => {
    if (!seriesRef.current || !liveCandle) return
    seriesRef.current.update(liveCandle)
  }, [liveCandle])

  return <div ref={ref} className={`overflow-hidden ${className}`} />
}
