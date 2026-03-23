import { Minus, Plus } from 'lucide-react'
import { QUICK_RATIOS } from '@/features/invest/constants'
import { formatCurrency, formatNumber } from '@/features/invest/formatters'
import { ORDER_TYPE_OPTIONS } from '@/mocks/invest'
import { cn } from '@/lib/cn'
import AccountPinKeypad from '@/components/signup/AccountPinKeypad'

const SECTION_LABEL = 'mb-1.5 text-[10px] font-semibold uppercase tracking-[.04em] text-foreground-disabled'
const TYPE_BTN_BASE = 'flex-1 rounded-[9px] border-[1.5px] py-[7px] text-xs font-semibold transition-colors'
const TYPE_BTN_OFF  = 'border-stroke-input bg-surface text-foreground-tertiary'

const ORDER_KIND_LABEL = { market: '시장가', limit: '지정가', current: '현재가' }

export default function InvestOrderPanel({
  step = 'input',
  showPin = false,
  pin = '',
  pinError = '',
  stockName,
  availableAmount,
  holdingQuantity,
  side,
  orderType,
  quantity,
  unitPrice,
  selectedPrice,
  onSideChange,
  onOrderTypeChange,
  onSelectPrice,
  onQuantityDelta,
  onQuantityChange,
  onPresetApply,
  onSubmit,
  onConfirm,
  onBack,
  onPinChange,
  onPinDone,
  onPinClose,
  isSubmitting,
}) {
  const isBuy = side === 'buy'
  const totalAmount = quantity * unitPrice
  const isConfirm = step === 'confirm'

  const tone = isBuy
    ? {
        title:   'text-up',
        badge:   'bg-up text-white',
        button:  'bg-up text-white shadow-up-btn hover:opacity-90',
        helper:  'text-up',
        wrapper: 'border-up-border bg-up-bg/50',
        cta:     '매수 주문',
      }
    : {
        title:   'text-down',
        badge:   'bg-down text-white',
        button:  'bg-down text-white shadow-down-btn hover:opacity-90',
        helper:  'text-down',
        wrapper: 'border-down-border bg-down-bg/60',
        cta:     '매도 주문',
      }

  const availabilityLabel = isBuy ? '가능' : '보유'
  const availabilityValue = isBuy ? `${formatNumber(availableAmount)}원` : `${formatNumber(holdingQuantity ?? 0)}주`
  const priceLabel = orderType === 'limit' ? '지정가' : '현재가'

  return (
    <section className="flex w-[250px] shrink-0 flex-col overflow-hidden bg-surface">

      {/* 상단 탭 — 항상 고정 */}
      <div className="border-b border-stroke px-3 py-2.5 shrink-0">
        <div className="flex gap-0.5 rounded-[10px] bg-background p-0.5">
          {[{ key: 'buy', label: '매수' }, { key: 'sell', label: '매도' }].map((item) => {
            const isActive = side === item.key
            const activeClass = item.key === 'buy' ? 'bg-up text-white' : 'bg-down text-white'
            return (
              <button
                key={item.key}
                onClick={() => !isConfirm && onSideChange(item.key)}
                className={cn(
                  'flex-1 rounded-lg py-2 text-[13px] font-semibold transition-colors',
                  isActive ? activeClass : 'text-foreground-disabled',
                  isConfirm && 'cursor-default',
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="relative flex-1 min-h-0">

        {/* 입력 뷰 */}
        <div
          className={cn(
            'absolute inset-0 overflow-y-auto px-3 py-3 flex flex-col gap-3.5 transition-opacity duration-200',
            isConfirm ? 'opacity-0 pointer-events-none' : 'opacity-100',
          )}
        >
          {/* 주문 유형 */}
          <div>
            <div className={SECTION_LABEL}>주문 유형</div>
            <div className="flex gap-1">
              {ORDER_TYPE_OPTIONS.map((item) => {
                const isOn = orderType === item.key
                const onClass = isBuy
                  ? 'border-up bg-up-bg text-up font-bold'
                  : 'border-down bg-down-bg text-down font-bold'
                return (
                  <button
                    key={item.key}
                    onClick={() => onOrderTypeChange(item.key)}
                    className={cn(TYPE_BTN_BASE, isOn ? onClass : TYPE_BTN_OFF)}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 주문 수량 */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className={SECTION_LABEL.replace('mb-1.5 ', '')}>주문 수량</span>
              <span className="text-[10px] text-foreground-disabled">
                {availabilityLabel}{' '}
                <span className="font-bold text-primary">{availabilityValue}</span>
              </span>
            </div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <button type="button" onClick={() => onQuantityDelta(-1)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-stroke-input bg-surface text-foreground-secondary transition-colors hover:border-primary hover:text-primary">
                <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
              <div className="flex-1 rounded-[10px] border-[1.5px] border-stroke-input bg-surface px-3 py-1.5 text-center flex items-center justify-center focus-within:border-primary transition-colors">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (!isNaN(v)) onQuantityChange?.(v)
                  }}
                  onBlur={(e) => {
                    const v = parseInt(e.target.value, 10)
                    onQuantityChange?.(isNaN(v) || v < 1 ? 1 : v)
                  }}
                  className="w-full bg-transparent text-[20px] font-black text-foreground text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="ml-1 shrink-0 text-[10px] text-foreground-disabled">주</span>
              </div>
              <button type="button" onClick={() => onQuantityDelta(1)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-stroke-input bg-surface text-foreground-secondary transition-colors hover:border-primary hover:text-primary">
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex gap-1">
              {QUICK_RATIOS.map((item) => {
                const isMax = item.ratio === 1
                return (
                  <button key={item.label} onClick={() => onPresetApply(item.ratio)}
                    className={cn(
                      'flex-1 rounded-[7px] border-[1.5px] py-1.5 text-[10px] font-semibold transition-colors',
                      isMax
                        ? isBuy ? 'border-up-border bg-up-bg text-up' : 'border-down-border bg-down-bg text-down'
                        : 'border-stroke-input bg-surface-subtle text-foreground-tertiary hover:border-primary hover:text-primary',
                    )}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 주문 가격 */}
          <div>
            <div className={SECTION_LABEL}>주문 가격</div>
            <div className={cn(
              'rounded-[10px] border-[1.5px] bg-surface px-3 py-2.5 flex items-center justify-between transition-colors',
              orderType === 'limit' ? 'border-stroke-input focus-within:border-primary' : 'border-stroke-input',
            )}>
              {orderType === 'limit' ? (
                <input
                  type="number"
                  value={selectedPrice || ''}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (!isNaN(v) && v >= 0) onSelectPrice?.(v)
                  }}
                  className="w-full bg-transparent text-[17px] font-black text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  placeholder="0"
                />
              ) : (
                <span className="text-[17px] font-black text-foreground">{formatNumber(unitPrice)}</span>
              )}
              <span className="ml-1 shrink-0 text-[10px] font-medium text-foreground-disabled">원</span>
            </div>
          </div>

          {/* 주문 요약 */}
          <div className={cn('rounded-[10px] border-[1.5px] p-3', tone.wrapper)}>
            <div className="mb-2 flex items-center justify-between">
              <span className={cn('text-[10px] font-bold uppercase tracking-[.04em]', tone.title)}>
                {isBuy ? '매수 요약' : '매도 요약'}
              </span>
              <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold', tone.badge)}>
                {ORDER_TYPE_OPTIONS.find((o) => o.key === orderType)?.label}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                { label: '종목', value: stockName },
                { label: '수량', value: `${formatNumber(quantity)}주` },
                { label: '단가', value: formatCurrency(unitPrice) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-[10px]">
                  <span className="text-foreground-disabled">{label}</span>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
              ))}
              <div className="h-px bg-current opacity-20 my-0.5" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-foreground-disabled">
                  {isBuy ? '예상 합계' : '예상 매도금액'}
                </span>
                <span className={cn('text-[17px] font-black', tone.helper)}>
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 확인 + PIN 뷰 */}
        <div
          className={cn(
            'absolute inset-0 overflow-y-auto transition-opacity duration-200',
            isConfirm ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
        >
          {/* 주문 요약 (compact) */}
          <div className="px-4 pt-4 pb-2 flex flex-col gap-2">
            <div className={cn('text-[11px] font-bold uppercase tracking-wide', tone.title)}>
              주문 내용 확인
            </div>
            {[
              { label: '주문 유형', value: ORDER_KIND_LABEL[orderType] },
              { label: '주문 수량', value: `${formatNumber(quantity)}주` },
              { label: orderType === 'market' ? '현재가 (예상)' : '주문 단가', value: formatCurrency(unitPrice) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-[12px]">
                <span className="text-foreground-disabled">{label}</span>
                <span className="font-semibold text-foreground">{value}</span>
              </div>
            ))}
            <div className="h-px bg-stroke" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-foreground-disabled">
                {isBuy ? '예상 총 매수금액' : '예상 총 매도금액'}
              </span>
              <span className={cn('text-[20px] font-black', tone.title)}>
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* PIN 입력 영역 */}
          {showPin && (
            <div className="border-t border-stroke mt-1">
              <div className="px-4 pt-3 pb-1">
                <div className="text-[10px] font-semibold text-foreground-disabled uppercase tracking-wide">계좌 비밀번호</div>
              <div className="text-[9px] text-foreground-disabled mt-0.5 mb-2">인증 후 30분간 비밀번호를 기억해요</div>
                {/* 도트 */}
                <div className="flex justify-center gap-3 py-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-2.5 h-2.5 rounded-full transition-colors',
                        i < pin.length ? (isBuy ? 'bg-up' : 'bg-down') : 'bg-stroke-input',
                      )}
                    />
                  ))}
                </div>
                {pinError && (
                  <p className="text-center text-[10px] text-up mb-1">{pinError}</p>
                )}
              </div>
              <div className="sol-pin-keypad-compact px-3 pb-3">
                <AccountPinKeypad
                  isOpen
                  variant="desktop"
                  value={pin}
                  onChange={onPinChange}
                  onDone={onPinDone}
                  onClose={onPinClose}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 버튼 — 항상 고정 */}
      <div className="shrink-0 px-3 pb-4 pt-2 border-t border-stroke">
        {isConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={showPin ? onPinClose : onBack}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl border border-stroke-input text-[13px] font-semibold text-foreground-secondary hover:bg-surface-muted transition-colors disabled:opacity-50"
            >
              취소
            </button>
            {!showPin && (
              <button
                onClick={onConfirm}
                disabled={isSubmitting}
                className={cn('flex-1 py-3 rounded-xl text-[13px] font-bold transition-opacity disabled:opacity-60', tone.button)}
              >
                {isSubmitting ? '처리 중...' : (isBuy ? '매수 확정' : '매도 확정')}
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onSubmit}
            className={cn('w-full rounded-xl py-3 text-sm font-black', tone.button)}
          >
            {tone.cta} →
          </button>
        )}
      </div>

    </section>
  )
}
