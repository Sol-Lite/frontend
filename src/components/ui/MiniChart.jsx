import { useEffect, useRef } from 'react'
import { AreaSeries, createChart } from 'lightweight-charts'

const UP_LINE     = 'rgb(232,57,62)'
const DOWN_LINE   = 'rgb(0,117,232)'
const UP_FILL     = 'rgba(232,57,62,0.2)'
const DOWN_FILL   = 'rgba(0,117,232,0.2)'
const TRANSPARENT = 'rgba(0,0,0,0)'

/**
 * 위젯용 미니 라인+에리어 차트 (lightweight-charts)
 * @param {{ time: number, value: number }[]} data  - unix seconds
 * @param {boolean} isUp
 * @param {string}  className
 */
export default function MiniChart({ data, isUp, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

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
      lineColor:             isUp ? UP_LINE   : DOWN_LINE,
      topColor:              isUp ? UP_FILL   : DOWN_FILL,
      bottomColor:           TRANSPARENT,
      lineWidth:             1.5,
      priceLineVisible:      false,
      lastValueVisible:      false,
      crosshairMarkerVisible: false,
    })

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
    }
  }, [data, isUp])

  return <div ref={ref} className={`overflow-hidden ${className}`} />
}
