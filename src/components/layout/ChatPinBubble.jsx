import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { orderApi, ORDER_SIDE, ORDER_KIND } from '@/api/order'
import usePinAuth from '@/hooks/usePinAuth'
import AccountPinKeypad from '@/components/signup/AccountPinKeypad'

/**
 * 채팅창 PIN 입력 버블
 * 매수/매도 확인 후 PIN 검증 → 주문 실행까지 self-contained
 */
export default function ChatPinBubble({ stockCode, marketType, name, side, quantity }) {
  const queryClient = useQueryClient()
  const { verifyAndCachePin } = usePinAuth()

  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rememberPin, setRememberPin] = useState(true)
  const [done, setDone] = useState(false)

  const isBuy = side === 'buy'
  const tone = isBuy ? 'text-up' : 'text-down'
  const dotColor = isBuy ? 'bg-up' : 'bg-down'

  async function handlePinDone() {
    if (pin.length !== 4) { setError('4자리를 입력해주세요.'); return }
    setSubmitting(true)
    setError('')
    try {
      await verifyAndCachePin(pin, rememberPin)
      await orderApi.placeOrder({
        stockCode,
        marketType,
        orderSide: ORDER_SIDE[side],
        orderKind: ORDER_KIND.market,
        orderChannel: 'CHAT',
        orderQuantity: quantity,
      })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setDone(true)
    } catch (err) {
      setError(err?.message ?? '비밀번호가 올바르지 않습니다.')
      setPin('')
    } finally {
      setSubmitting(false)
    }
  }

  // ── 완료 상태 ─────────────────────────────────────────────────
  if (done) {
    return (
      <div className="bg-surface-muted rounded-[0_16px_16px_16px] px-3.5 py-2.5 max-w-[85%]">
        <p className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${tone}`}>
          주문 접수 완료
        </p>
        <p className="text-[13px] text-foreground">
          <span className="font-bold">{name}</span> {isBuy ? '매수' : '매도'} {quantity}주 주문이 접수되었습니다.
        </p>
      </div>
    )
  }

  // ── PIN 입력 상태 ─────────────────────────────────────────────
  return (
    <div className="bg-surface-muted rounded-[0_16px_16px_16px] px-3 py-3 w-[240px] flex flex-col gap-2">
      {/* PIN 도트 */}
      <div className="flex justify-center gap-2 py-1">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i < pin.length ? dotColor : 'bg-stroke-input'
            }`}
          />
        ))}
      </div>

      {/* 에러 */}
      {error && (
        <p className="text-center text-[10px] text-down">{error}</p>
      )}

      {/* 키패드 */}
      <div className="sol-pin-keypad-compact">
        <AccountPinKeypad
          isOpen
          variant="desktop"
          value={pin}
          onChange={setPin}
          onDone={handlePinDone}
          onClose={() => setPin('')}
        />
      </div>

      {/* 30분 기억 */}
      <label
        className={`flex cursor-pointer items-center justify-between rounded-[10px] border px-2 py-1.5 transition-colors ${
          rememberPin
            ? 'border-primary-border bg-primary-light'
            : 'border-stroke-input bg-surface hover:bg-surface-subtle'
        }`}
      >
        <input
          type="checkbox"
          checked={rememberPin}
          onChange={(e) => setRememberPin(e.target.checked)}
          className="sr-only"
        />
        <span className={`text-[9px] font-semibold ${rememberPin ? 'text-primary' : 'text-foreground-secondary'}`}>
          30분간 비밀번호 기억하기
        </span>
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-[6px] border-[1.5px] text-[10px] font-black transition-colors ${
            rememberPin
              ? 'border-primary bg-primary text-white'
              : 'border-stroke-input bg-surface text-transparent'
          }`}
        >
          ✓
        </span>
      </label>
    </div>
  )
}
