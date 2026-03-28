/**
 * 간단한 SVG 라인 스파크라인
 * @param {{ close: number }[]} data
 * @param {boolean} isUp  - true: 빨강(상승), false: 파랑(하락)
 */
export default function SparklineChart({ data = [], isUp = true, className = '' }) {
  if (data.length < 2) return <div className={className} />

  const prices = data.map((d) => d.close)
  const min    = Math.min(...prices)
  const max    = Math.max(...prices)
  const range  = max - min || 1

  const W = 80
  const H = 32
  const PAD = 2

  const points = prices
    .map((p, i) => {
      const x = PAD + (i / (prices.length - 1)) * (W - PAD * 2)
      const y = PAD + (1 - (p - min) / range) * (H - PAD * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const color = isUp ? 'var(--color-up)' : 'var(--color-down)'

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
