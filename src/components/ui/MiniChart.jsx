import { useEffect, useRef } from 'react'
import { CandlestickSeries, createChart } from 'lightweight-charts'

function getPriceScaleMargins(height) {
  const h = Math.max(1, height || 0)

  // 작은 위젯에서도 우측 가격 라벨이 상/하단에 걸리지 않도록 px 기반으로 여백 환산
  let top = Math.max(0.22, Math.min(0.46, 22 / h))
  let bottom = Math.max(0.12, Math.min(0.28, 14 / h))

  // 플롯 영역이 지나치게 줄어들지 않게 합계 상한 적용
  const maxTotal = 0.74
  if (top + bottom > maxTotal) {
    const ratio = maxTotal / (top + bottom)
    top *= ratio
    bottom *= ratio
  }

  return { top, bottom }
}

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
 * @param {boolean} isIntraday - true(1일): X축 HH:MM, 78슬롯 고정, 우측 오픈 / false: M/D, fitContent
 * @param {string}  className
 */
export default function MiniChart({ candleData, liveCandle, isIntraday = false, tickOffset = 9 * 3600, forcefit = false, className = '' }) {
  const ref      = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)

  // 차트 생성 — candleData / isIntraday 변경 시 재생성
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const { up, down, textMuted } = getChartColors()

    const priceScaleMargins = getPriceScaleMargins(el.clientHeight)

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
        scaleMargins:  priceScaleMargins,
      },
      localization: {
        priceFormatter: (price) => Math.round(price).toLocaleString('ko-KR'),
      },
      timeScale: {
        visible:        true,
        timeVisible:    isIntraday,
        secondsVisible: false,
        borderVisible:  false,
        ticksVisible:   false,
        fixLeftEdge:    true,
        fixRightEdge:   !isIntraday, // 1일 분봉: 우측 열린 상태로 캔들이 오른쪽으로 추가됨
        tickMarkFormatter: (time, tickMarkType) => {
          const d = new Date((time + tickOffset) * 1000)
          if (isIntraday) {
            const hh = String(d.getUTCHours()).padStart(2, '0')
            const mm = String(d.getUTCMinutes()).padStart(2, '0')
            return `${hh}:${mm}`
          }
          if (tickMarkType <= 1) return `${d.getUTCMonth() + 1}월`
          return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`
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
      priceLineVisible: true,
      priceLineWidth:   1,
      lastValueVisible: true,
    })
    chartRef.current  = chart
    seriesRef.current = series

    if (candleData?.length) {
      series.setData(candleData)
    }
    if (isIntraday && !forcefit) {
      // 국내 1일: 09:00~15:25 사이 5분봉 최대 78개 슬롯을 고정 → 캔들 폭이 일정하게 유지
      chart.timeScale().setVisibleLogicalRange({ from: -0.5, to: 77.5 })
    } else if (candleData?.length) {
      chart.timeScale().fitContent()
    }

    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return
      const margins = getPriceScaleMargins(entry.contentRect.height)
      chart.applyOptions({
        width:  entry.contentRect.width,
        height: entry.contentRect.height,
        rightPriceScale: {
          scaleMargins: margins,
        },
      })
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current  = null
      seriesRef.current = null
    }
  }, [candleData, isIntraday, tickOffset, forcefit])

  // STOMP 실시간 캔들 업데이트 — 차트 재생성 없이 마지막 봉만 갱신
  // isIntraday: 새 버킷이 78슬롯 밖으로 나갈 수 있으므로 최신 캔들이 보이도록 scrollToRealTime
  useEffect(() => {
    if (!seriesRef.current || !liveCandle) return
    seriesRef.current.update(liveCandle)
    if (isIntraday && chartRef.current) {
      chartRef.current.timeScale().scrollToRealTime()
    }
  }, [liveCandle, isIntraday])

  return <div ref={ref} className={className} />
}
