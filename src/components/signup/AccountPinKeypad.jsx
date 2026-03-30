import { useEffect, useRef, useState } from 'react'
import KeyboardModule from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'
import '@/components/signup/accountPinKeypad.css'
import DecoyCursorOverlay from '@/components/signup/DecoyCursorOverlay'

const Keyboard = KeyboardModule.default ?? KeyboardModule.KeyboardReact ?? KeyboardModule

const DUMMY_KEYS = ['{mark-a}', '{mark-b}']
const ACTION_KEYS = ['{shuffle}', '{bksp}', '{done}', '{close}']
const LOCK_ICON = '<span class="sol-pin-keyboard__lock"><img src="/shc_symbol_ci.png" alt="" class="sol-pin-keyboard__lock-icon" /></span>'

const DISPLAY = {
  '{mark-a}': LOCK_ICON,
  '{mark-b}': LOCK_ICON,
  '{shuffle}': '재배열',
  '{bksp}': '⌫',
  '{done}': '완료',
  '{close}': '닫기',
}

const BUTTON_THEME = [
  {
    class: 'sol-pin-keyboard__dummy',
    buttons: DUMMY_KEYS.join(' '),
  },
  {
    class: 'sol-pin-keyboard__action',
    buttons: ACTION_KEYS.join(' '),
  },
  {
    class: 'sol-pin-keyboard__action--primary',
    buttons: '{done}',
  },
]

function shuffle(items) {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }

  return result
}

function shuffleDigits() {
  return shuffle(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'])
}

function shuffleInteractiveKeys() {
  return shuffle([...shuffleDigits(), ...DUMMY_KEYS])
}

function buildLayout(keys) {
  return {
    default: [
      keys.slice(0, 6).join(' '),
      keys.slice(6, 12).join(' '),
      ACTION_KEYS.join(' '),
    ],
  }
}

function pickRandomFlashButtons(keys, count) {
  return shuffle(keys).slice(0, Math.min(count, keys.length))
}

export default function AccountPinKeypad({
  isOpen,
  value,
  onChange,
  onDone,
  onClose,
  variant = 'both',
  disabled = false,
  showDecoyOverlay = true,
}) {
  const shellRef = useRef(null)
  const flashTimeoutRef = useRef(null)
  const [interactiveKeys, setInteractiveKeys] = useState(() => shuffleInteractiveKeys())
  const [flashButtons, setFlashButtons] = useState([])

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current)
      }
    }
  }, [])

  if (!isOpen) return null

  function triggerFlash(nextKeys) {
    setFlashButtons(pickRandomFlashButtons(nextKeys, 3))

    if (flashTimeoutRef.current) {
      window.clearTimeout(flashTimeoutRef.current)
    }

    flashTimeoutRef.current = window.setTimeout(() => {
      setFlashButtons([])
      flashTimeoutRef.current = null
    }, 180)
  }

  function reshuffleInteractiveKeys() {
    const nextKeys = shuffleInteractiveKeys()
    setInteractiveKeys(nextKeys)
    triggerFlash(nextKeys)
  }

  function handleKeyPress(button) {
    if (disabled) {
      return
    }

    if (/^\d$/.test(button)) {
      onChange(`${value}${button}`.slice(0, 4))
      reshuffleInteractiveKeys()
      return
    }

    if (button === '{bksp}') {
      onChange(value.slice(0, -1))
      reshuffleInteractiveKeys()
      return
    }

    if (button === '{shuffle}' || DUMMY_KEYS.includes(button)) {
      reshuffleInteractiveKeys()
      return
    }

    if (button === '{done}') {
      onDone()
      return
    }

    if (button === '{close}') {
      onClose()
    }
  }

  const keyboard = (
    <Keyboard
      baseClass="sol-pin-keyboard"
      layout={buildLayout(interactiveKeys)}
      display={DISPLAY}
      buttonTheme={
        flashButtons.length > 0
          ? [
            ...BUTTON_THEME,
            {
              class: 'sol-pin-keyboard__flash',
              buttons: flashButtons.join(' '),
            },
          ]
          : BUTTON_THEME
      }
      onKeyPress={handleKeyPress}
      useMouseEvents
      clickOnMouseDown
      disableButtonHold
      theme="sol-pin-keyboard-theme"
    />
  )

  return (
    <>
      {(variant === 'both' || variant === 'desktop') && (
        <div className="mt-3 hidden md:block">
          <div
            ref={shellRef}
            className="sol-pin-keypad-shell sol-pin-keypad-shell--desktop relative overflow-hidden rounded-2xl border border-stroke bg-surface-subtle p-4 shadow-[0_4px_16px_rgba(0,70,255,.08)]"
            data-pin-interactive="true"
          >
            {keyboard}
            {showDecoyOverlay && <DecoyCursorOverlay active containerRef={shellRef} count={4} />}
          </div>
        </div>
      )}

      {(variant === 'both' || variant === 'mobile') && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]" />
          <div className="fixed inset-x-0 bottom-0 z-[60]">
            <div
              className="mx-auto w-full max-w-[560px] rounded-t-[28px] bg-[#243056] px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+14px)] shadow-[0_-12px_30px_rgba(15,23,42,0.24)]"
              data-pin-interactive="true"
            >
              <div ref={shellRef} className="sol-pin-keypad-shell sol-pin-keypad-shell--mobile relative">
                {keyboard}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
