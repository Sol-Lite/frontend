import { useQuery } from '@tanstack/react-query'
import StockAvatar from '@/components/ui/StockAvatar'
import LockedOverlay from '@/components/ui/LockedOverlay'
import { cn } from '@/lib/cn'
import { formatCurrency, formatNumber } from '@/features/invest/formatters'
import { orderApi } from '@/api/order'
import useAuthStore from '@/store/useAuthStore'


function formatTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

export default function ExecutionHistoryPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isRestoring = useAuthStore((s) => s.isRestoring)
  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'FILLED'],
    queryFn: () => orderApi.getOrders('FILLED'),
    enabled: isAuthenticated && !isRestoring,
    staleTime: 1000 * 30,
  })

  const rows = data?.orders ?? data ?? []

  if (!isRestoring && !isAuthenticated) {
    return (
      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
          로그인 후 체결내역을 볼 수 있습니다.
        </div>
        <LockedOverlay message="체결내역을 보려면" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
        불러오는 중...
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
        체결 내역이 없습니다.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-[1] grid grid-cols-[58px_minmax(0,1fr)_40px_72px_48px_90px] items-center border-b border-stroke bg-surface-subtle px-2.5 py-1">
        {['시간', '종목', '구분', '체결가', '수량', '금액'].map((label) => (
          <span key={label} className={cn('text-[9px] font-semibold text-foreground-disabled', label === '시간' || label === '종목' || label === '구분' ? '' : 'text-right')}>
            {label}
          </span>
        ))}
      </div>

      {rows.map((row) => {
        const isBuy = row.orderSide === 'BUY'
        const filledPrice = row.filledPrice ?? row.orderPrice ?? 0
        const filledQty = row.filledQuantity ?? row.orderQuantity ?? 0
        const total = filledPrice * filledQty

        return (
          <div
            key={row.orderId ?? row.id}
            className="grid grid-cols-[58px_minmax(0,1fr)_40px_72px_48px_90px] items-center gap-2 border-b border-stroke-subtle px-2.5 py-1.5"
          >
            <span className="text-[10px] text-foreground-disabled">{formatTime(row.filledAt ?? row.executedAt ?? row.requestedAt ?? row.createdAt)}</span>
            <div className="flex min-w-0 items-center gap-1.5">
              <StockAvatar name={row.stockName ?? row.stockCode} stockCode={row.stockCode} marketType={row.marketType} size="sm" />
              <span className="truncate text-[10px] font-semibold text-foreground">{row.stockName ?? row.stockCode}</span>
            </div>
            <span className={cn('rounded-[4px] px-1 py-0.5 text-center text-[8px] font-bold', isBuy ? 'bg-up-bg text-up' : 'bg-down-bg text-down')}>
              {isBuy ? '매수' : '매도'}
            </span>
            <span className={cn('text-[10px] font-bold text-right', isBuy ? 'text-up' : 'text-down')}>
              {formatNumber(filledPrice)}
            </span>
            <span className="text-[10px] text-right">{formatNumber(filledQty)}</span>
            <span className="text-[10px] font-semibold text-right">{formatCurrency(total)}</span>
          </div>
        )
      })}
    </div>
  )
}
