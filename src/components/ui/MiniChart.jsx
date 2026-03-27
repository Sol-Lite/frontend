import { useEffect, useRef } from 'react'
import { CandlestickSeries, createChart } from 'lightweight-charts'

function getChartColors() {
  const style = getComputedStyle(document.documentElement)
  const up        = style.getPropertyValue('--color-up').trim()                  || '#E8393E'
  const down      = style.getPropertyValue('--color-down').trim()                || '#0075E8'
  const textMuted = style.getPropertyValue('--color-foreground-disabled').trim() || '#9CA3AF'
  return { up, down, textMuted }
}

// 미국 EDT 여부 판별 (3~11월 근사, US DST: 3월 둘째 일요일 ~ 11월 첫째 일요일)
function isUSEDT(unixSeconds) {
  const month = new Date(unixSeconds * 1000).getUTCMonth() + 1
  return month >= 3 && month <= 11
}

/**
 * 위젯용 캔들 차트 (lightweight-charts)
 * @param {{ time: number, open, high, low, close: number }[]} candleData - 캔들 데이터 (unix seconds)
 * @param {{ time: number, open, high, low, close: number }}   liveCandle - STOMP 실시간 업데이트 포인트
 * @param {boolean} isMinute   - true면 X축 HH:MM / 좌측 고정, false면 M/D
 * @param {boolean} isOverseas - 해외주식 여부 (분봉 X축 ET→KST 변환 적용)
 * @param {string}  className
 */
export default function MiniChart({ candleData, liveCandle, isMinute = false, isOverseas = false, className = '' }) {
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
          if (isMinute && isOverseas) {
            // 해외 분봉: LS loctime은 미국 ET (현지시간)이 KST로 오해석된 상태
            // JS가 "09:30:00"을 KST로 파싱 → 00:30 UTC
            // 실제 KST: ET+14h(EST) 또는 ET+13h(EDT) → +22h/+23h로 보정
            const addH = isUSEDT(time) ? 22 : 23
            const d = new Date((time + addH * 3600) * 1000)
            return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
          }
          // 국내 분봉 / 일봉: UTC+9h → KST
          const d = new Date((time + 9 * 3600) * 1000)
          if (isMinute) {
            return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
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
      priceLineVisible: false,
      lastValueVisible: false,
    })
    seriesRef.current = series

    if (candleData?.length) {
      series.setData(candleData)
    }
    if (isMinute) {
      // 09:00~15:25 사이 5분봉 최대 78개 슬롯을 고정 → 캔들 폭이 일정하게 유지
      // setVisibleRange는 데이터 밖 시간을 빈 공간으로 처리하지 못해 setVisibleLogicalRange 사용
      chart.timeScale().setVisibleLogicalRange({ from: -0.5, to: 77.5 })
    } else if (candleData?.length) {
      chart.timeScale().fitContent()
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
  }, [candleData, isMinute, isOverseas])

  // STOMP 실시간 캔들 업데이트 — 차트 재생성 없이 마지막 봉만 갱신
  useEffect(() => {
    if (!seriesRef.current || !liveCandle) return
    seriesRef.current.update(liveCandle)
  }, [liveCandle])

  return <div ref={ref} className={`overflow-hidden ${className}`} />
}
