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
  const summaryTone = isBuy
    ? {
        wrapper: 'border-up-border bg-up-bg/60',
        title: 'text-up',
        badge: 'bg-up text-white',
        button: 'bg-up text-white hover:opacity-90',
        helper: 'text-up',
        label: '매수 요약',
        cta: '매수 주문',
      }
    : {
        wrapper: 'border-down-border bg-down-bg/70',
        title: 'text-down',
        badge: 'bg-down text-white',
        button: 'bg-down text-white hover:opacity-90',
        helper: 'text-down',
        label: '매도 요약',
        cta: '매도 주문',
      }

  const availabilityLabel = isBuy ? '가능' : '보유'
  const availabilityValue = isBuy ? `${formatNumber(availableAmount)}원` : '100주'
  const totalAmount = quantity * unitPrice
  const priceLabel = orderType === 'limit' ? '지정가' : '현재가'

  return (
    <section className="flex w-[250px] shrink-0 flex-col overflow-hidden bg-surface">
      <div className="border-b border-stroke px-3 py-2.5 shrink-0">
        <div className="flex gap-0.5 rounded-[10px] bg-background p-0.5">
          {[
            { key: 'buy', label: '매수' },
            { key: 'sell', label: '매도' },
          ].map((item) => {
            const isActive = side === item.key
            const activeClass = item.key === 'buy' ? 'bg-up text-white' : 'bg-down text-white'

            return (
              <button
                key={item.key}
                onClick={() => onSideChange(item.key)}
                className={cn(
                  'flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors',
                  isActive ? activeClass : 'text-foreground-disabled hover:text-foreground-secondary',
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-3">
          <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[.04em] text-foreground-disabled">
            주문 유형
          </div>
          <div className="flex gap-1">
            {ORDER_TYPE_OPTIONS.map((item) => (
              <button
                key={item.key}
                onClick={() => onOrderTypeChange(item.key)}
                className={cn(
                  'flex-1 rounded-[9px] border-[1.5px] px-2 py-[7px] text-xs font-semibold transition-colors',
                  orderType === item.key
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-stroke-input bg-surface text-foreground-tertiary',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[.04em] text-foreground-disabled">
            체결 조건
          </div>
          <div className="flex gap-1">
            {CONDITION_OPTIONS.map((item) => (
              <button
                key={item.key}
                onClick={() => onConditionChange(item.key)}
                className={cn(
                  'flex-1 rounded-[7px] border-[1.5px] px-1.5 py-1 text-[10px] font-semibold transition-colors',
                  condition === item.key
                    ? 'border-foreground-secondary bg-surface-muted text-foreground'
                    : 'border-stroke-input bg-surface text-foreground-tertiary',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[.04em] text-foreground-disabled">
              주문 수량
            </span>
            <span className="text-[9px] text-foreground-disabled">
              {availabilityLabel}{' '}
              <span className="font-bold text-primary">{availabilityValue}</span>
            </span>
          </div>

          <div className="mb-1.5 flex items-center gap-1.5">
            <button
              type="button"
              aria-label="수량 감소"
              onClick={() => onQuantityDelta(-1)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-stroke-input bg-surface-subtle text-foreground-secondary transition-colors hover:border-primary hover:text-primary"
            >
              <Minus className="h-4 w-4" strokeWidth={2.25} />
            </button>

            <div className="flex-1 rounded-[9px] border-[1.5px] border-stroke-input bg-surface px-3 py-1.5 text-center">
              <span className="text-[20px] font-black text-foreground">{formatNumber(quantity)}</span>
              <span className="ml-1 text-[10px] text-foreground-disabled">주</span>
            </div>

            <button
              type="button"
              aria-label="수량 증가"
              onClick={() => onQuantityDelta(1)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-stroke-input bg-surface-subtle text-foreground-secondary transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>

          <div className="flex gap-1">
            {QUICK_RATIOS.map((item) => {
              const isMax = item.ratio === 1

              return (
                <button
                  key={item.label}
                  onClick={() => onPresetApply(item.ratio)}
                  className={cn(
                    'flex-1 rounded-[7px] border-[1.5px] px-0 py-1.5 text-[10px] font-semibold transition-colors',
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

        <div className="mb-3">
          <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[.04em] text-foreground-disabled">
            주문 가격
          </div>
          <div className="rounded-[9px] border-[1.5px] border-stroke-input bg-surface-subtle px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-foreground-disabled">{priceLabel}</span>
              <span className="text-[16px] font-black text-foreground">
                {formatNumber(orderType === 'limit' ? selectedPrice : unitPrice)}
                <span className="ml-0.5 text-[10px] font-medium text-foreground-disabled">원</span>
              </span>
            </div>
          </div>
        </div>

        <div className={cn('mb-3 rounded-[10px] border-[1.5px] p-2.5', summaryTone.wrapper)}>
          <div className="mb-2 flex items-center justify-between">
            <span className={cn('text-[9px] font-bold uppercase tracking-[.04em]', summaryTone.title)}>
              {summaryTone.label}
            </span>
            <span className={cn('rounded-full px-1.5 py-0.5 text-[8px] font-bold', summaryTone.badge)}>
              {ORDER_TYPE_OPTIONS.find((item) => item.key === orderType)?.label}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-foreground-disabled">종목</span>
              <span className="font-bold text-foreground">{stockName}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-foreground-disabled">수량</span>
              <span className="font-bold text-foreground">{formatNumber(quantity)}주</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-foreground-disabled">단가</span>
              <span className="font-bold text-foreground">{formatCurrency(unitPrice)}</span>
            </div>
            <div className="h-px bg-current/20" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-foreground-disabled">
                {isBuy ? '예상 합계' : '예상 매도금액'}
              </span>
              <span className={cn('text-[18px] font-black', summaryTone.helper)}>
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={cn(
            'w-full rounded-[10px] px-3 py-3 text-sm font-black shadow-sm transition-opacity',
            summaryTone.button,
          )}
        >
          {summaryTone.cta} →
        </button>

        <p className="mt-1.5 text-center text-[9px] text-foreground-disabled">
          주문 전 비밀번호 확인이 필요합니다
        </p>

        <p className="mt-2 text-center text-[9px] text-foreground-disabled">
          최대 주문 가능 수량 {formatNumber(maxOrderQuantity)}주
        </p>
      </div>
    </section>
  )
}
