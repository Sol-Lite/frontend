import { cn } from '@/lib/cn'
import {
  formatDisplayDate,
  formatSignedNumber,
  formatVisiblePrice,
  getDirectionClass,
} from '@/features/invest/formatters'

export default function InvestorTable({ data, isLoading, marketType, displayCurrency, usdRate }) {
  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">투자자 정보를 불러오는 중입니다.</div>
  }

  if (!data) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">투자자 정보가 없습니다.</div>
  }

  const rows = Array.isArray(data) ? data : [data]

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead className="sticky top-0 z-[1] bg-surface-subtle">
          <tr>
            <th className="border-b border-stroke px-2.5 py-1.5 text-left text-[9px] font-semibold text-foreground-disabled">일자</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">종가</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">외인 순매수</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">기관 순매수</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">개인 순매수</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.date}-${i}`} className="even:bg-surface-subtle hover:bg-surface-muted">
              <td className="whitespace-nowrap px-2.5 py-1.5 text-foreground-secondary">{formatDisplayDate(row.date)}</td>
              <td className="whitespace-nowrap px-2.5 py-1.5 text-right font-bold">
                {formatVisiblePrice(row.close, { marketType, displayCurrency, usdRate })}
              </td>
              <td className={cn('whitespace-nowrap px-2.5 py-1.5 text-right font-semibold', getDirectionClass(row.foreignNetBuy))}>
                {formatSignedNumber(row.foreignNetBuy)}
              </td>
              <td className={cn('whitespace-nowrap px-2.5 py-1.5 text-right font-semibold', getDirectionClass(row.institutionNetBuy))}>
                {formatSignedNumber(row.institutionNetBuy)}
              </td>
              <td className={cn('whitespace-nowrap px-2.5 py-1.5 text-right font-semibold', getDirectionClass(row.individualNetBuy))}>
                {formatSignedNumber(row.individualNetBuy)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
