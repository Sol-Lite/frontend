import { cn } from '@/lib/cn'
import {
  formatNumber,
  formatSignedPercent,
  getDirectionClass,
} from '@/features/invest/formatters'

export default function DailyPriceTable({ rows, isLoading, errorMessage }) {
  if (isLoading && rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
        일별 시세를 불러오는 중입니다.
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
        표시할 일별 시세가 없습니다.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead className="sticky top-0 z-[1] bg-surface-subtle">
          <tr>
            <th className="border-b border-stroke px-2.5 py-1.5 text-left text-[9px] font-semibold text-foreground-disabled">일자</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">종가</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">등락률</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">거래량</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">시가</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">고가</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">저가</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.date} className="even:bg-surface-subtle hover:bg-surface-muted">
              <td className="whitespace-nowrap px-2.5 py-1.5 font-semibold text-foreground-secondary">{row.date}</td>
              <td className={cn('whitespace-nowrap px-2.5 py-1.5 text-right font-extrabold', getDirectionClass(row.changeRate))}>
                {formatNumber(row.close)}
              </td>
              <td className={cn('whitespace-nowrap px-2.5 py-1.5 text-right', getDirectionClass(row.changeRate))}>
                {formatSignedPercent(row.changeRate)}
              </td>
              <td className="whitespace-nowrap px-2.5 py-1.5 text-right text-foreground-secondary">{row.volume}</td>
              <td className="whitespace-nowrap px-2.5 py-1.5 text-right">{formatNumber(row.open)}</td>
              <td className="whitespace-nowrap px-2.5 py-1.5 text-right text-up">{formatNumber(row.high)}</td>
              <td className="whitespace-nowrap px-2.5 py-1.5 text-right text-down">{formatNumber(row.low)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
