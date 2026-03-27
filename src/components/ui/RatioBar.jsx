/**
 * 매수/매도 비율 바
 *
 * @param {number} buyRatio   - 매수 비율 0~100
 * @param {number} sellRatio  - 매도 비율 0~100
 * @param {string} className
 */
export default function RatioBar({ buyRatio, sellRatio, className = '' }) {
  return (
    <div className={`relative h-8 ${className}`}>
      <div className="absolute inset-x-0 top-1/2 flex h-1 -translate-y-1/2 overflow-hidden rounded-full bg-stroke">
        <div className="bg-up h-full" style={{ width: `${buyRatio}%` }} />
        <div className="bg-down h-full" style={{ width: `${sellRatio}%` }} />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-between">
        <span className="text-[9px] font-semibold text-up">{buyRatio}</span>
        <span className="text-[9px] font-semibold text-down">{sellRatio}</span>
      </div>
    </div>
  )
}
