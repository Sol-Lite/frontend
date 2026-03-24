/**
 * 가격 등락 표시 컴포넌트
 *
 * @param {number}  value     - 등락률 (예: 1.62, -0.45)
 * @param {'text'|'badge'} variant - 표시 방식
 * @param {string}  className
 */
export default function PriceChange({ value, variant = 'text', className = '' }) {
  const isUp = value > 0
  const isZero = value === 0
  const sign = isUp ? '+' : isZero ? '' : '-'
  const absValue = Math.abs(value).toFixed(2)
  const label = `${sign}${absValue}%`

  const colorClass = isZero
    ? 'text-foreground-disabled'
    : isUp
    ? 'text-up'
    : 'text-down'

  if (variant === 'badge') {
    const bgClass = isUp ? 'bg-up-bg border-up-border' : isZero ? 'bg-surface-muted border-stroke' : 'bg-down-bg border-down-border'
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] border text-[9px] font-semibold ${colorClass} ${bgClass} ${className}`}
      >
        {label}
      </span>
    )
  }

  return (
    <span className={`font-bold ${colorClass} ${className}`}>
      {label}
    </span>
  )
}
