import { cn } from '@/lib/cn'
import { formatNumber, formatDisplayDate } from '@/features/invest/formatters'

function getOpinionClass(opinion) {
  if (!opinion) return ''
  const upper = opinion.toUpperCase()
  if (upper.includes('BUY') || upper.includes('매수')) return 'text-up font-bold'
  if (upper.includes('SELL') || upper.includes('매도')) return 'text-down font-bold'
  return 'text-foreground-disabled'
}

export default function OpinionTable({ data, isLoading }) {
  const opinions = data?.opinions ?? []

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">투자의견을 불러오는 중입니다.</div>
  }

  if (opinions.length === 0) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">투자의견이 없습니다.</div>
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead className="sticky top-0 z-[1] bg-surface-subtle">
          <tr>
            <th className="border-b border-stroke px-2.5 py-1.5 text-left text-[9px] font-semibold text-foreground-disabled">일자</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-left text-[9px] font-semibold text-foreground-disabled">증권사</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-left text-[9px] font-semibold text-foreground-disabled">의견</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">목표가</th>
            <th className="border-b border-stroke px-2.5 py-1.5 text-right text-[9px] font-semibold text-foreground-disabled">이전 목표가</th>
          </tr>
        </thead>
        <tbody>
          {opinions.map((row, i) => (
            <tr key={`${row.date}-${row.brokerName}-${i}`} className="even:bg-surface-subtle hover:bg-surface-muted">
              <td className="whitespace-nowrap px-2.5 py-1.5 text-foreground-secondary">{formatDisplayDate(row.date)}</td>
              <td className="whitespace-nowrap px-2.5 py-1.5 font-semibold">{row.brokerName}</td>
              <td className={cn('whitespace-nowrap px-2.5 py-1.5', getOpinionClass(row.opinion))}>{row.opinion}</td>
              <td className="whitespace-nowrap px-2.5 py-1.5 text-right font-bold">{formatNumber(row.targetPrice)}</td>
              <td className="whitespace-nowrap px-2.5 py-1.5 text-right text-foreground-disabled">{formatNumber(row.previousTargetPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
