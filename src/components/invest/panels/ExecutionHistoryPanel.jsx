import StockAvatar from '@/components/ui/StockAvatar'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/features/invest/formatters'
import { EXECUTION_HISTORY } from '@/mocks/invest'

export default function ExecutionHistoryPanel() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-[1] grid grid-cols-[58px_minmax(0,1fr)_40px_72px_48px_90px] items-center border-b border-stroke bg-surface-subtle px-2.5 py-1">
        {['시간', '종목', '구분', '체결가', '수량', '금액'].map((label) => (
          <span key={label} className={cn('text-[9px] font-semibold text-foreground-disabled', label === '시간' || label === '종목' || label === '구분' ? '' : 'text-right')}>
            {label}
          </span>
        ))}
      </div>

      {EXECUTION_HISTORY.map((row) => {
        const isBuy = row.side === 'buy'

        return (
          <div
            key={`${row.time}-${row.name}-${row.side}`}
            className="grid grid-cols-[58px_minmax(0,1fr)_40px_72px_48px_90px] items-center gap-2 border-b border-stroke-subtle px-2.5 py-1.5"
          >
            <span className="text-[10px] text-foreground-disabled">{row.time}</span>
            <div className="flex min-w-0 items-center gap-1.5">
              <StockAvatar name={row.name} color={row.avatar} size="sm" />
              <span className="truncate text-[10px] font-semibold text-foreground">{row.name}</span>
            </div>
            <span
              className={cn(
                'rounded-[4px] px-1 py-0.5 text-center text-[8px] font-bold',
                isBuy ? 'bg-up-bg text-up' : 'bg-down-bg text-down',
              )}
            >
              {isBuy ? '매수' : '매도'}
            </span>
            <span className={cn('text-[10px] font-bold text-right', isBuy ? 'text-up' : 'text-down')}>
              {formatNumber(row.price)}
            </span>
            <span className="text-[10px] text-right">{row.quantity}</span>
            <span className="text-[10px] font-semibold text-right">{row.amount}</span>
          </div>
        )
      })}
    </div>
  )
}
