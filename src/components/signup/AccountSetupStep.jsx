import { useEffect, useState } from 'react'
import { useController } from 'react-hook-form'
import AccountPinKeypad from '@/components/signup/AccountPinKeypad'
import { INVESTMENT_TYPE_OPTIONS } from '@/components/signup/signupSchema'

const INVESTMENT_TYPE_ACCENTS = ['#16A34A', '#4A8EF7', '#F6C445', '#FF8A1F', '#FF5A36']
const INVESTMENT_TYPE_GRADIENT =
  'linear-gradient(90deg, #16A34A 0%, #4A8EF7 25%, #F6C445 50%, #FF8A1F 75%, #FF5A36 100%)'
const INVESTMENT_SLIDER_INSET = 28

function getSliderAnchorStyle(index, total, inset) {
  const ratio = index / (total - 1)

  return {
    left: `calc(${inset}px + (100% - ${inset * 2}px) * ${ratio})`,
    transform: 'translateX(-50%)',
  }
}

function InvestmentTypeSlider({ value, error, onChange }) {
  const selectedIndex = INVESTMENT_TYPE_OPTIONS.findIndex((option) => option.value === value)
  const previewIndex = selectedIndex >= 0 ? selectedIndex : 2
  const selectedOption = selectedIndex >= 0 ? INVESTMENT_TYPE_OPTIONS[selectedIndex] : null
  const previewOption = INVESTMENT_TYPE_OPTIONS[previewIndex]
  const accentColor = INVESTMENT_TYPE_ACCENTS[previewIndex]
  const sliderPercent = (previewIndex / (INVESTMENT_TYPE_OPTIONS.length - 1)) * 100
  const fillBackgroundSize = sliderPercent > 0 ? `${10000 / sliderPercent}% 100%` : '100% 100%'

  function handleSliderChange(event) {
    const nextIndex = Number(event.target.value)
    onChange(INVESTMENT_TYPE_OPTIONS[nextIndex].value)
  }

  return (
    <div className="rounded-2xl border border-stroke bg-surface-subtle px-5 py-6">
      <div className="text-center">
        <h3
          className={[
            'text-[30px] font-black tracking-tight transition-colors md:text-[38px]',
            selectedOption ? '' : 'text-foreground-secondary',
          ].join(' ')}
          style={selectedOption ? { color: accentColor } : undefined}
        >
          {selectedOption ? selectedOption.label : '투자성향을 선택해 주세요'}
        </h3>
        <div
          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-[13px] font-bold text-white shadow-sm transition-colors"
          style={{
            backgroundColor: selectedOption ? accentColor : '#CBD5E1',
          }}
        >
          {selectedOption ? `${selectedIndex + 1}등급` : '5단계 성향 분석'}
        </div>
        <p className="mx-auto mt-4 max-w-[520px] text-[13px] leading-[1.8] text-foreground-secondary">
          {selectedOption
            ? selectedOption.description
            : '슬라이더를 움직이거나 각 구간을 눌러 본인에게 맞는 투자성향을 선택해 주세요.'}
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-[540px]">
        <div className="relative h-[104px]">
          {INVESTMENT_TYPE_OPTIONS.map((option, index) => {
            const isSelected = selectedIndex === index
            const anchorStyle = getSliderAnchorStyle(index, INVESTMENT_TYPE_OPTIONS.length, INVESTMENT_SLIDER_INSET)

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className="group absolute top-0 text-center"
                style={anchorStyle}
              >
                <div
                  className={[
                    'w-[92px] text-[11px] font-semibold leading-[1.4] transition-colors md:text-[12px]',
                    isSelected ? '' : 'text-foreground-tertiary group-hover:text-foreground-secondary',
                  ].join(' ')}
                  style={isSelected ? { color: INVESTMENT_TYPE_ACCENTS[index] } : undefined}
                >
                  {option.label}
                </div>
                <div className="mx-auto mt-3 h-7 w-px bg-stroke-input" />
              </button>
            )
          })}
          <div
            className="absolute bottom-4 h-[8px] rounded-full bg-[#E3E8F1]"
            style={{
              left: `${INVESTMENT_SLIDER_INSET}px`,
              right: `${INVESTMENT_SLIDER_INSET}px`,
            }}
          />
          <div
            className="absolute bottom-4 left-0 h-[8px] rounded-full"
            style={{
              left: `${INVESTMENT_SLIDER_INSET}px`,
              width:
                sliderPercent === 0
                  ? '0px'
                  : `calc((100% - ${INVESTMENT_SLIDER_INSET * 2}px) * ${sliderPercent / 100})`,
              background: INVESTMENT_TYPE_GRADIENT,
              backgroundSize: fillBackgroundSize,
              backgroundPosition: 'left center',
            }}
          />

          {INVESTMENT_TYPE_OPTIONS.map((option, index) => {
            const isSelected = selectedIndex === index
            const anchorStyle = getSliderAnchorStyle(index, INVESTMENT_TYPE_OPTIONS.length, INVESTMENT_SLIDER_INSET)

            return (
              <div
                key={option.value}
                className="absolute bottom-[10px] h-3 w-3 -translate-y-1/2 rounded-full border-2 bg-surface transition-colors"
                style={{
                  ...anchorStyle,
                  borderColor: isSelected ? INVESTMENT_TYPE_ACCENTS[index] : '#D6DEE9',
                  backgroundColor: isSelected ? INVESTMENT_TYPE_ACCENTS[index] : '#FFFFFF',
                }}
              />
            )
          })}

          <div
            className="pointer-events-none absolute bottom-4 h-8 w-8 rounded-full border border-stroke bg-surface shadow-[0_4px_14px_rgba(15,23,42,0.16)]"
            style={{
              left: `calc(${INVESTMENT_SLIDER_INSET}px + (100% - ${INVESTMENT_SLIDER_INSET * 2}px) * ${sliderPercent / 100})`,
              transform: 'translate(-50%, 50%)',
            }}
          />

          <input
            type="range"
            min="0"
            max={String(INVESTMENT_TYPE_OPTIONS.length - 1)}
            step="1"
            value={previewIndex}
            onChange={handleSliderChange}
            className="absolute bottom-0 z-10 h-10 cursor-pointer opacity-0"
            style={{
              left: `${INVESTMENT_SLIDER_INSET}px`,
              width: `calc(100% - ${INVESTMENT_SLIDER_INSET * 2}px)`,
            }}
            aria-label="투자성향 선택"
            aria-valuetext={previewOption.label}
          />
        </div>
      </div>

      {error && <p className="mt-2 text-[11px] text-up">{error}</p>}
    </div>
  )
}

function PinDots({ value, active }) {
  return (
    <div className="flex justify-center gap-2.5">
      {Array.from({ length: 4 }, (_, index) => {
        const filled = index < value.length

        return (
          <div
            key={index}
            className={[
              'flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors',
              active ? 'border-primary bg-primary-light' : 'border-stroke-input bg-surface-subtle',
            ].join(' ')}
          >
            <div
              className={[
                'h-2.5 w-2.5 rounded-full transition-colors',
                filled ? 'bg-primary' : active ? 'bg-primary/20' : 'bg-stroke-input',
              ].join(' ')}
            />
          </div>
        )
      })}
    </div>
  )
}

function PinField({ label, value, active, error, onClick }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-foreground-secondary mb-1.5">
        {label} <span className="text-up">*</span>
      </label>
      <button
        type="button"
        onClick={onClick}
        className={[
          'flex w-full justify-center bg-transparent py-1 text-center transition-opacity duration-[150ms] focus:outline-none',
          active ? 'opacity-100' : 'opacity-95 hover:opacity-100',
        ].join(' ')}
        data-pin-interactive="true"
      >
        <PinDots value={value} active={active} />
      </button>

      {error && <p className="mt-2 text-[11px] text-up">{error}</p>}
    </div>
  )
}

export default function AccountSetupStep({
  control,
  fieldErrors,
  isLoading,
  error,
  onBack,
  onSubmit,
}) {
  const { field: accountPinField } = useController({
    name: 'accountPin',
    control,
  })
  const { field: accountPinConfirmField } = useController({
    name: 'accountPinConfirm',
    control,
  })
  const { field: investmentTypeField } = useController({
    name: 'investmentType',
    control,
  })

  const [activePinField, setActivePinField] = useState('accountPin')
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  const accountPin = accountPinField.value ?? ''
  const accountPinConfirm = accountPinConfirmField.value ?? ''
  const isTypingConfirm = accountPinConfirm.length > 0 && accountPinConfirm.length < 4
  const accountPinConfirmError = isTypingConfirm ? undefined : fieldErrors.accountPinConfirm

  useEffect(() => {
    if (!isKeyboardOpen) return undefined

    function handlePointerDown(event) {
      if (event.target.closest('[data-pin-interactive="true"]')) return
      setIsKeyboardOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isKeyboardOpen])

  function handlePinChange(nextValue) {
    const sanitizedValue = nextValue.replace(/\D/g, '').slice(0, 4)

    if (activePinField === 'accountPin') {
      accountPinField.onChange(sanitizedValue)
      return
    }

    accountPinConfirmField.onChange(sanitizedValue)
  }

  function handlePinDone() {
    setIsKeyboardOpen(false)
  }

  function openKeyboard(fieldName) {
    setActivePinField(fieldName)
    setIsKeyboardOpen(true)
  }

  return (
    <div className={isKeyboardOpen ? 'pb-[320px] md:pb-0' : ''}>
      <div className="mb-7">
        <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-1">계좌 설정</h2>
        <p className="text-[13px] text-foreground-disabled leading-[1.8]">
          계좌 비밀번호와 투자성향을 설정하면 계좌 개설이 완료됩니다.
        </p>
      </div>

      <div className="rounded-2xl border border-stroke bg-surface px-5 py-5">
        <div className="space-y-4">
          <div className="space-y-4 md:space-y-5">
            <div>
              <PinField
                label="계좌 비밀번호"
                value={accountPin}
                active={activePinField === 'accountPin' && isKeyboardOpen}
                error={fieldErrors.accountPin}
                onClick={() => openKeyboard('accountPin')}
              />
              {activePinField === 'accountPin' && (
                <AccountPinKeypad
                  key="accountPin-desktop"
                  variant="desktop"
                  isOpen={isKeyboardOpen}
                  value={accountPin}
                  onChange={handlePinChange}
                  onDone={handlePinDone}
                  onClose={() => setIsKeyboardOpen(false)}
                />
              )}
            </div>

            <div>
              <PinField
                label="계좌 비밀번호 확인"
                value={accountPinConfirm}
                active={activePinField === 'accountPinConfirm' && isKeyboardOpen}
                error={accountPinConfirmError}
                onClick={() => openKeyboard('accountPinConfirm')}
              />
              {activePinField === 'accountPinConfirm' && (
                <AccountPinKeypad
                  key="accountPinConfirm-desktop"
                  variant="desktop"
                  isOpen={isKeyboardOpen}
                  value={accountPinConfirm}
                  onChange={handlePinChange}
                  onDone={handlePinDone}
                  onClose={() => setIsKeyboardOpen(false)}
                />
              )}
            </div>
          </div>

          <AccountPinKeypad
            key={`${activePinField}-mobile`}
            variant="mobile"
            isOpen={isKeyboardOpen}
            value={activePinField === 'accountPin' ? accountPin : accountPinConfirm}
            onChange={handlePinChange}
            onDone={handlePinDone}
            onClose={() => setIsKeyboardOpen(false)}
          />
        </div>

        <div className="mt-6">
          <label className="block text-[11px] font-semibold text-foreground-secondary mb-2">
            투자성향 <span className="text-up">*</span>
          </label>
          <InvestmentTypeSlider
            value={investmentTypeField.value}
            error={fieldErrors.investmentType}
            onChange={investmentTypeField.onChange}
          />
        </div>
      </div>

      {error && <p className="mt-4 text-[11px] text-up">{error}</p>}

      <div className="mt-7 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-[13px] rounded-xl border border-stroke-input bg-surface text-sm font-semibold text-foreground-secondary hover:bg-surface-subtle transition-colors"
        >
          이전
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="flex-[1.3] py-[13px] rounded-xl bg-primary text-white text-sm font-bold shadow-primary-btn hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? '계좌 개설 중...' : '계좌 만들기'}
        </button>
      </div>
    </div>
  )
}
