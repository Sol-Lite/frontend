import { Minus, Plus } from 'lucide-react'
import { QUICK_RATIOS } from '@/features/invest/constants'
import {
  formatCurrency,
  formatNumber,
} from '@/features/invest/formatters'
import {
  CONDITION_OPTIONS,
  ORDER_TYPE_OPTIONS,
} from '@/mocks/invest'
import { cn } from '@/lib/cn'

const SECTION_LABEL = 'mb-1.5 text-[10px] font-semibold uppercase tracking-[.04em] text-foreground-disabled'

const TYPE_BTN_BASE = 'flex-1 rounded-[9px] border-[1.5px] py-[7px] text-xs font-semibold transition-colors'
const TYPE_BTN_ON   = 'border-primary bg-primary-light text-primary font-bold'
const TYPE_BTN_OFF  = 'border-stroke-input bg-surface text-foreground-tertiary hover:border-primary/40'

export default function InvestOrderPanel({
  stockName,
  availableAmount,
  side,
  orderType,
  condition,
  quantity,
  maxOrderQuantity,
  unitPrice,
  selectedPrice,
  onSideChange,
  onOrderTypeChange,
  onConditionChange,
  onQuantityDelta,
  onPresetApply,
}) {
  const isBuy = side === 'buy'

  const tone = isBuy
    ? {
        wrapper:    'border-up-border bg-up-bg/50',
        title:      'text-up',
        badge:      'bg-up text-white',
        button:     'bg-up text-white shadow-[0_4px_14px_rgba(232,57,62,.30)] hover:opacity-90',
        helper:     'text-up',
        label:      '매수 요약',
        cta:        '매수 주문',
      }
    : {
        wrapper:    'border-down-border bg-down-bg/60',
        title:      'text-down',
        badge:      'bg-down text-white',
        button:     'bg-down text-white shadow-[0_4px_14px_rgba(0,117,232,.25)] hover:opacity-90',
        helper:     'text-down',
        label:      '매도 요약',
        cta:        '매도 주문',
      }

  const availabilityLabel = isBuy ? '가능' : '보유'
  const availabilityValue = isBuy ? `${formatNumber(availableAmount)}원` : '100주'
  const totalAmount  = quantity * unitPrice
  const priceLabel   = orderType === 'limit' ? '지정가' : '현재가'

  return (
    <section className="flex w-[250px] shrink-0 flex-col overflow-hidden bg-surface">

      {/* 매수 / 매도 탭 */}
      <div className="border-b border-stroke px-3 py-2.5 shrink-0">
        <div className="flex gap-0.5 rounded-[10px] bg-background p-0.5">
          {[{ key: 'buy', label: '매수' }, { key: 'sell', label: '매도' }].map((item) => {
            const isActive = side === item.key
            const activeClass = item.key === 'buy' ? 'bg-up text-white' : 'bg-down text-white'
            return (
              <button
                key={item.key}
                onClick={() => onSideChange(item.key)}
                className={cn(
                  'flex-1 rounded-lg py-2 text-[13px] font-semibold transition-colors',
                  isActive ? activeClass : 'text-foreground-disabled hover:text-foreground-secondary',
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3.5">

        {/* 주문 유형 */}
        <div>
          <div className={SECTION_LABEL}>주문 유형</div>
          <div className="flex gap-1">
            {ORDER_TYPE_OPTIONS.map((item) => (
              <button
                key={item.key}
                onClick={() => onOrderTypeChange(item.key)}
                className={cn(TYPE_BTN_BASE, orderType === item.key ? TYPE_BTN_ON : TYPE_BTN_OFF)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 체결 조건 */}
        <div>
          <div className={SECTION_LABEL}>체결 조건</div>
          <div className="flex gap-1">
            {CONDITION_OPTIONS.map((item) => (
              <button
                key={item.key}
                onClick={() => onConditionChange(item.key)}
                className={cn(TYPE_BTN_BASE, condition === item.key ? TYPE_BTN_ON : TYPE_BTN_OFF)}
              >
                {item.label}
              </button>
            ))}
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
            <button
              type="button"
              aria-label="수량 감소"
              onClick={() => onQuantityDelta(-1)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-stroke-input bg-surface text-foreground-secondary transition-colors hover:border-primary hover:text-primary"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>

            <div className="flex-1 rounded-[10px] border-[1.5px] border-stroke-input bg-surface px-3 py-1.5 text-center">
              <span className="text-[20px] font-black text-foreground">{formatNumber(quantity)}</span>
              <span className="ml-1 text-[10px] text-foreground-disabled">주</span>
            </div>

            <button
              type="button"
              aria-label="수량 증가"
              onClick={() => onQuantityDelta(1)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-stroke-input bg-surface text-foreground-secondary transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>

          {/* 빠른 비율 */}
          <div className="flex gap-1">
            {QUICK_RATIOS.map((item) => {
              const isMax = item.ratio === 1
              return (
                <button
                  key={item.label}
                  onClick={() => onPresetApply(item.ratio)}
                  className={cn(
                    'flex-1 rounded-[7px] border-[1.5px] py-1.5 text-[10px] font-semibold transition-colors',
                    isMax
                      ? isBuy
                        ? 'border-up-border bg-up-bg text-up'
                        : 'border-down-border bg-down-bg text-down'
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
          <div className="rounded-[10px] border-[1.5px] border-stroke-input bg-surface px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-foreground-disabled">{priceLabel}</span>
              <span className="text-[17px] font-black text-foreground">
                {formatNumber(orderType === 'limit' ? selectedPrice : unitPrice)}
                <span className="ml-0.5 text-[10px] font-medium text-foreground-disabled">원</span>
              </span>
            </div>
          </div>
        </div>

        {/* 주문 요약 */}
        <div className={cn('rounded-[10px] border-[1.5px] p-3', tone.wrapper)}>
          <div className="mb-2 flex items-center justify-between">
            <span className={cn('text-[10px] font-bold uppercase tracking-[.04em]', tone.title)}>
              {tone.label}
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

        {/* CTA */}
        <div>
          <button
            type="button"
            className={cn(
              'w-full rounded-xl py-3 text-sm font-black transition-opacity',
              tone.button,
            )}
          >
            {tone.cta} →
          </button>
          <p className="mt-2 text-center text-[9px] text-foreground-disabled">
            주문 전 비밀번호 확인이 필요합니다
          </p>
          <p className="mt-1 text-center text-[9px] text-foreground-disabled">
            최대 주문 가능 수량 {formatNumber(maxOrderQuantity)}주
          </p>
        </div>

      </div>
    </section>
  )
}
