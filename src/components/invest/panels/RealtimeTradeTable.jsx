import { cn } from '@/lib/cn'
import {
  formatNumber,
  formatSignedNumber,
  getDirectionClass,
} from '@/features/invest/formatters'

export default function RealtimeTradeTable({ rows, isLoading, errorMessage }) {
  if (isLoading && rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
        실시간 시세를 불러오는 중입니다.
      </div>
    )
  }

  if (errorMessage && rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-xs text-danger">
        {errorMessage}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
        표시할 실시간 시세가 없습니다.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-[1] grid grid-cols-[58px_68px_72px_72px_100px_72px] border-b border-stroke bg-surface-subtle px-2.5 py-1">
        {['시간', '체결가', '전일대비', '체결량', '누적거래량', '체결강도'].map((label) => (
          <span key={label} className={cn('text-[9px] font-semibold text-foreground-disabled', label === '시간' ? '' : 'text-right')}>
            {label}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={`${row.time}-${row.price}`}
          className="grid grid-cols-[58px_68px_72px_72px_100px_72px] items-center border-b border-stroke-subtle px-2.5 py-1"
        >
          <span className="text-[10px] text-foreground-disabled">{row.time}</span>
          <span className={cn('text-[11px] font-bold text-right', getDirectionClass(row.diff))}>
            {formatNumber(row.price)}
          </span>
          <span className={cn('text-[10px] text-right', getDirectionClass(row.diff))}>
            {formatSignedNumber(row.diff)}
          </span>
          <span className="text-[10px] text-right">{row.volume}</span>
          <span className="text-[10px] text-right">{row.accumulatedVolume}</span>
          <span className={cn('text-[10px] font-semibold text-right', row.isStrong ? 'text-up' : 'text-foreground-disabled')}>
            {row.strength}
          </span>
        </div>
      ))}
    </div>
  )
}
