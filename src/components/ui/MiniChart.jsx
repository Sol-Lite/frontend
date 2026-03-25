import { useEffect, useRef } from 'react'
import { AreaSeries, createChart } from 'lightweight-charts'

function getChartColors() {
  const style = getComputedStyle(document.documentElement)
  const up   = style.getPropertyValue('--color-up').trim()   || '#E8393E'
  const down = style.getPropertyValue('--color-down').trim() || '#0075E8'
  return {
    upLine:   up,
    downLine: down,
    upFill:   `${up}33`,    // 20% opacity
    downFill: `${down}33`,
  }
}

/**
 * 위젯용 미니 라인+에리어 차트 (lightweight-charts)
 * @param {{ time: number, value: number }[]} data  - unix seconds
 * @param {boolean} isUp
 * @param {string}  className
 */
export default function MiniChart({ data, isUp, className = '' }) {
  const ref       = useRef(null)
  const seriesRef = useRef(null)

  // 차트·시리즈 생성 — data가 바뀔 때만 재생성
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const { upLine, downLine, upFill, downFill } = getChartColors()

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

    const series = chart.addSeries(AreaSeries, {
      lineColor:              isUp ? upLine : downLine,
      topColor:               isUp ? upFill : downFill,
      bottomColor:            'rgba(0,0,0,0)',
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
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  // isUp 변경 시 차트 재생성 없이 시리즈 색상만 업데이트
  useEffect(() => {
    if (!seriesRef.current) return
    const { upLine, downLine, upFill, downFill } = getChartColors()
    seriesRef.current.applyOptions({
      lineColor: isUp ? upLine : downLine,
      topColor:  isUp ? upFill : downFill,
    })
  }, [isUp])

  return <div ref={ref} className={`overflow-hidden ${className}`} />
}
