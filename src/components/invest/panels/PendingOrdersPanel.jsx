import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/cn'
import { formatCurrency, formatNumber } from '@/features/invest/formatters'
import { orderApi } from '@/api/order'
import AccountPinKeypad from '@/components/signup/AccountPinKeypad'
import StockAvatar from '@/components/ui/StockAvatar'
import LockedOverlay from '@/components/ui/LockedOverlay'
import usePinAuth from '@/hooks/usePinAuth'
import useAuthStore from '@/store/useAuthStore'


export default function PendingOrdersPanel({ stockCode, marketType, displayCurrency, usdRate }) {
  const queryClient = useQueryClient()
  const { isPinCached, verifyAndCachePin } = usePinAuth()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isRestoring = useAuthStore((s) => s.isRestoring)
  const [pinOpen, setPinOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'PENDING'],
    queryFn: () => orderApi.getOrders('PENDING'),
    enabled: isAuthenticated && !isRestoring,
    staleTime: 1000 * 15,
  })

  const rows = data?.orders ?? data ?? []

  if (!isRestoring && !isAuthenticated) {
    return (
      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
          로그인 후 미체결 주문을 볼 수 있습니다.
        </div>
        <LockedOverlay message="미체결 주문을 보려면" />
      </div>
    )
  }

  async function executeAction(action) {
    if (action.type === 'all') {
      await orderApi.cancelAllPending()
    } else {
      setCancellingId(action.orderId)
      try {
        await orderApi.cancelOrder(action.orderId)
      } finally {
        setCancellingId(null)
      }
    }
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['balance'] })
  }

  async function requestCancel(action) {
    if (isPinCached()) {
      await executeAction(action)
    } else {
      setPendingAction(action)
      setPin('')
      setPinError('')
      setPinOpen(true)
    }
  }

  async function handlePinDone() {
    if (pin.length !== 4) { setPinError('4자리를 입력해주세요.'); return }
    setIsVerifying(true)
    setPinError('')
    try {
      await verifyAndCachePin(pin)
      setPinOpen(false)
      if (pendingAction) {
        await executeAction(pendingAction)
        setPendingAction(null)
      }
    } catch (err) {
      setPinError(err?.message ?? '비밀번호가 올바르지 않습니다.')
      setPin('')
    } finally {
      setIsVerifying(false)
    }
  }

  function handlePinClose() {
    setPinOpen(false)
    setPendingAction(null)
    setPin('')
    setPinError('')
  }

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">불러오는 중...</div>
  }

  if (!rows.length && !pinOpen) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">미체결 주문이 없습니다.</div>
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* 목록 */}
      <div className="h-full overflow-y-auto">
        <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-stroke bg-surface-subtle px-2.5 py-1">
          <div className="grid flex-1 grid-cols-[24px_minmax(0,1fr)_40px_60px_80px] gap-2">
            {['', '종목', '구분', '수량', '주문가'].map((label) => (
              <span key={label} className={cn('text-[9px] font-semibold text-foreground-disabled', label === '종목' ? '' : 'text-right')}>
                {label}
              </span>
            ))}
          </div>
          <button
            onClick={() => requestCancel({ type: 'all' })}
            className="ml-2 shrink-0 rounded-[5px] border border-stroke-input px-2 py-0.5 text-[9px] font-semibold text-foreground-secondary hover:border-down hover:text-down transition-colors"
          >
            전체 취소
          </button>
        </div>

        {rows.map((row) => {
          const isBuy = row.orderSide === 'BUY'
          const isCancelling = cancellingId === (row.orderId ?? row.id)
          const rowMarketType = row.marketType ?? (row.stockCode === stockCode ? marketType : null)
          return (
            <div key={row.orderId ?? row.id} className="flex items-center gap-2 border-b border-stroke-subtle px-2.5 py-1.5">
              <div className="grid flex-1 grid-cols-[24px_minmax(0,1fr)_40px_60px_80px] gap-2 items-center">
                <StockAvatar name={row.stockName ?? row.stockCode} stockCode={row.stockCode} marketType={rowMarketType} size="sm" />
                <span className="truncate text-[10px] font-semibold text-foreground">{row.stockName ?? row.stockCode}</span>
                <span className={cn('rounded-[4px] px-1 py-0.5 text-center text-[8px] font-bold', isBuy ? 'bg-up-bg text-up' : 'bg-down-bg text-down')}>
                  {isBuy ? '매수' : '매도'}
                </span>
                <span className="text-[10px] text-right">{formatNumber(row.orderQuantity ?? row.quantity)}주</span>
                <span className="text-[10px] font-semibold text-right">
                  {row.orderKind === 'MARKET'
                    ? '시장가'
                    : formatCurrency(row.orderPrice, { marketType: rowMarketType, displayCurrency, usdRate })}
                </span>
              </div>
              <button
                disabled={isCancelling}
                onClick={() => requestCancel({ type: 'single', orderId: row.orderId ?? row.id })}
                className="shrink-0 rounded-[5px] border border-stroke-input px-2 py-0.5 text-[9px] font-semibold text-foreground-secondary hover:border-down hover:text-down transition-colors disabled:opacity-50"
              >
                {isCancelling ? '취소 중' : '취소'}
              </button>
            </div>
          )
        })}
      </div>

      {/* PIN 오버레이 */}
      {pinOpen && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface px-4 gap-3">
          <div className="text-[12px] font-bold text-foreground">계좌 비밀번호</div>
          <div className="text-[10px] text-foreground-disabled -mt-1">인증 후 30분간 비밀번호를 기억해요</div>
          <div className="flex gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={cn('w-2.5 h-2.5 rounded-full transition-colors', i < pin.length ? 'bg-primary' : 'bg-stroke-input')} />
            ))}
          </div>
          {pinError && <p className="text-[10px] text-up">{pinError}</p>}
          {isVerifying && <p className="text-[10px] text-foreground-disabled">확인 중...</p>}
          <div className="sol-pin-keypad-compact w-full">
            <AccountPinKeypad
              isOpen
              variant="desktop"
              value={pin}
              onChange={setPin}
              onDone={handlePinDone}
              onClose={handlePinClose}
            />
          </div>
        </div>
      )}
    </div>
  )
}
