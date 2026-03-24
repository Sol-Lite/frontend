import { cn } from '@/lib/cn'
import { formatNumber, formatSignedPercent } from '@/features/invest/formatters'

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

  const isTick = rows[0] && 'isBuy' in rows[0]

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead className="sticky top-0 z-[1] bg-surface-subtle">
          <tr>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">체결가</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">체결량</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">등락률</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">누적거래량</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">시간</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => isTick ? (
            <tr key={`${row.time}-${i}`} className="even:bg-surface-subtle hover:bg-surface-muted">
              <td className={cn('whitespace-nowrap px-2.5 py-1.5 text-right font-extrabold', row.isBuy ? 'text-up' : 'text-down')}>
                {formatNumber(row.price)}
              </td>
              <td className={cn('whitespace-nowrap px-2.5 py-1.5 text-right font-semibold', row.isBuy ? 'text-up' : 'text-down')}>
                {formatNumber(row.volume)}
              </td>
              <td className={cn('whitespace-nowrap px-2.5 py-1.5 text-right', row.changeRate > 0 ? 'text-up' : row.changeRate < 0 ? 'text-down' : 'text-foreground-disabled')}>
                {formatSignedPercent(row.changeRate)}
              </td>
              <td className="whitespace-nowrap px-2.5 py-1.5 text-right text-foreground-secondary">
                {formatNumber(row.totalVolume)}
              </td>
              <td className="whitespace-nowrap px-2.5 py-1.5 text-right text-foreground-disabled">
                {row.time}
              </td>
            </tr>
          ) : (
            <tr key={`${row.time}-${i}`} className="even:bg-surface-subtle hover:bg-surface-muted">
              <td className={cn('whitespace-nowrap px-2.5 py-1.5 text-right font-extrabold', row.diff > 0 ? 'text-up' : row.diff < 0 ? 'text-down' : '')}>
                {formatNumber(row.price)}
              </td>
              <td className="whitespace-nowrap px-2.5 py-1.5 text-right">
                {row.volume}
              </td>
              <td className={cn('whitespace-nowrap px-2.5 py-1.5 text-right', row.diff > 0 ? 'text-up' : row.diff < 0 ? 'text-down' : 'text-foreground-disabled')}>
                {row.diff !== 0 ? formatSignedPercent((row.diff / (row.price - row.diff)) * 100) : '-'}
              </td>
              <td className="whitespace-nowrap px-2.5 py-1.5 text-right text-foreground-secondary">
                {row.accumulatedVolume}
              </td>
              <td className="whitespace-nowrap px-2.5 py-1.5 text-right text-foreground-disabled">
                {row.time}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
