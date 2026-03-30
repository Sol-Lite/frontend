import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import AccountPinKeypad from '@/components/signup/AccountPinKeypad'
import DecoyCursorOverlay from '@/components/signup/DecoyCursorOverlay'

export default function ChatExchangePinBubble({
  onClose,
  onSubmit,
  onError,
}) {
  const shellRef = useRef(null)
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rememberPin, setRememberPin] = useState(false)

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
      await onSubmit?.({ pin, rememberPin })
      setPin('')
      setRememberPin(false)
    } catch {
      setPin('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex justify-center gap-2 py-1">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i < pin.length ? 'bg-primary' : 'bg-stroke-input'
            }`}
          />
        ))}
      </div>

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
          document.body,
        )
        : null}

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
