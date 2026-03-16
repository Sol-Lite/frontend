/**
 * 매수/매도 비율 바
 *
 * @param {number} buyRatio   - 매수 비율 0~100
 * @param {number} sellRatio  - 매도 비율 0~100
 * @param {string} className
 */
export default function RatioBar({ buyRatio, sellRatio, className = '' }) {
  return (
    <div className={className}>
      <div className="h-1 rounded-full overflow-hidden flex bg-stroke">
        <div className="bg-up h-full" style={{ width: `${buyRatio}%` }} />
        <div className="bg-down h-full" style={{ width: `${sellRatio}%` }} />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] font-semibold text-up">{buyRatio}</span>
        <span className="text-[9px] font-semibold text-down">{sellRatio}</span>
      </div>
    </div>
  )
}
