import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { orderApi, ORDER_SIDE, ORDER_KIND } from '@/api/order'
import usePinAuth from '@/hooks/usePinAuth'
import AccountPinKeypad from '@/components/signup/AccountPinKeypad'
import DecoyCursorOverlay from '@/components/signup/DecoyCursorOverlay'

/**
 * 채팅창 PIN 입력 버블
 * 매수/매도 확인 후 PIN 검증 → 주문 실행까지 self-contained
 */
export default function ChatPinBubble({
  stockCode,
  marketType,
  side,
  quantity,
  idempotencyKey,
  onClose,
  onSuccess,
  onError,
}) {
  const queryClient = useQueryClient()
  const { verifyAndCachePin } = usePinAuth()

  const shellRef = useRef(null)
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rememberPin, setRememberPin] = useState(false)

  const isBuy = side === 'buy'
  const dotColor = isBuy ? 'bg-up' : 'bg-down'

  function handleClose() {
    if (submitting) return
    setPin('')
    onClose?.()
  }

  async function handlePinDone() {
    if (submitting) return
    if (pin.length !== 4) {
      onError?.('4자리를 입력해주세요.')
      return
    }
    setSubmitting(true)
    try {
      await verifyAndCachePin(pin, rememberPin)
      await orderApi.placeOrder({
        stockCode,
        marketType,
        orderSide: ORDER_SIDE[side],
        orderKind: ORDER_KIND.market,
        orderChannel: 'CHAT',
        orderQuantity: quantity,
        idempotencyKey,
      })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setPin('')
      setRememberPin(false)
      onSuccess?.()
    } catch (err) {
      onError?.(err?.message ?? '비밀번호가 올바르지 않습니다.')
      setPin('')
    } finally {
      setSubmitting(false)
    }
  }

  // ── PIN 입력 상태 ─────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col gap-2">
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

      {/* 키패드 */}
      <div ref={shellRef} className="sol-pin-keypad-compact">
        <AccountPinKeypad
          isOpen
          variant="desktop"
          value={pin}
          onChange={setPin}
          onDone={handlePinDone}
          onClose={handleClose}
          disabled={submitting}
          showDecoyOverlay={false}
        />
      </div>
      {typeof document !== 'undefined'
        ? createPortal(
          <DecoyCursorOverlay active containerRef={shellRef} count={4} />,
          document.body
        )
        : null}

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
          disabled={submitting}
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
