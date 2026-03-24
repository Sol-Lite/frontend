import { formatNumber } from '@/features/invest/formatters'

function formatEok(value) {
  const n = Number(String(value ?? '').replace(/,/g, '').trim())
  if (!n || isNaN(n)) return '-'
  if (n >= 10000) {
    const jo = Math.floor(n / 10000)
    const eok = n % 10000
    return eok > 0 ? `${formatNumber(jo)}조 ${formatNumber(eok)}억` : `${formatNumber(jo)}조`
  }
  return `${formatNumber(n)}억`
}

export default function FinancePanel({ data, isLoading }) {
  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">재무정보를 불러오는 중입니다.</div>
  }

  if (!data) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">재무정보가 없습니다.</div>
  }

  const items = [
    { label: '시가총액', value: formatEok(data.marketCap) },
    { label: 'PER', value: data.per ? `${data.per}배` : '-' },
    { label: 'PBR', value: data.pbr ? `${data.pbr}배` : '-' },
    { label: 'EPS', value: data.eps ? `${formatNumber(Number(data.eps))}원` : '-' },
    { label: 'BPS', value: data.bps ? `${formatNumber(Number(data.bps))}원` : '-' },
    { label: 'ROE', value: data.roe ? `${data.roe}%` : '-' },
    { label: '자본금', value: formatEok(data.capital) },
    { label: '외국인 보유', value: data.foreignRatio ? `${data.foreignRatio}%` : '-' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-2.5">
      <div className="grid grid-cols-4 gap-1.5">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg bg-surface-subtle px-2.5 py-2">
            <div className="text-[9px] font-semibold text-foreground-disabled">{item.label}</div>
            <div className="mt-0.5 text-[13px] font-extrabold text-foreground">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
