export default function FinancePanel({ data, isLoading }) {
  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">재무정보를 불러오는 중입니다.</div>
  }

  if (!data) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">재무정보가 없습니다.</div>
  }

  const items = [
    { label: '시가총액', value: `${data.marketCap}억` },
    { label: 'PER', value: data.per },
    { label: 'PBR', value: data.pbr },
    { label: 'EPS', value: data.eps },
    { label: 'BPS', value: data.bps },
    { label: 'ROE', value: `${data.roe}%` },
    { label: '자본금', value: `${data.capital}억` },
    { label: '외국인 보유', value: `${data.foreignRatio}%` },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-2.5">
      <div className="grid grid-cols-4 gap-1.5">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg bg-surface-subtle px-2.5 py-2">
            <div className="text-[8px] text-foreground-disabled">{item.label}</div>
            <div className="mt-0.5 text-[13px] font-extrabold text-foreground">{item.value ?? '-'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
