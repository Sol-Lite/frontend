import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Minus, Plus, Search, Star } from 'lucide-react'
import { marketApi } from '@/api/market'
import InvestStockChart from '@/components/market/InvestStockChart'
import LiveDot from '@/components/ui/LiveDot'
import PriceChange from '@/components/ui/PriceChange'
import StockAvatar from '@/components/ui/StockAvatar'
import { cn } from '@/lib/cn'
import {
  CONDITION_OPTIONS,
  EXECUTION_HISTORY,
  HOLDING_SUMMARY,
  INVEST_STOCK,
  ORDER_BOOK,
  ORDER_TYPE_OPTIONS,
} from '@/mocks/invest'

const LEFT_TABS = [
  { key: 'daily', label: '일별시세' },
  { key: 'realtime', label: '실시간시세' },
]

const RIGHT_TABS = [
  { key: 'exec', label: '체결내역' },
  { key: 'pending', label: '미체결' },
  { key: 'holding', label: '내 주식' },
]

const QUICK_RATIOS = [
  { label: '10%', ratio: 0.1 },
  { label: '25%', ratio: 0.25 },
  { label: '50%', ratio: 0.5 },
  { label: '최대', ratio: 1 },
]

const CHART_PERIOD_OPTIONS = [
  { key: 'MINUTE', label: '분' },
  { key: 'DAILY', label: '일' },
  { key: 'WEEKLY', label: '주' },
  { key: 'MONTHLY', label: '월' },
  { key: 'YEARLY', label: '년' },
]

const MINUTE_INTERVAL_OPTIONS = [1, 3, 5, 10, 15, 30, 60]

const CHART_PERIOD_CONFIG = {
  MINUTE: {
    periodLabel: '분봉 차트',
  },
  DAILY: {
    apiPeriod: 'DAILY',
    lookbackDays: 180,
    periodLabel: '일봉 차트',
  },
  WEEKLY: {
    apiPeriod: 'WEEKLY',
    lookbackDays: 365 * 5,
    periodLabel: '주봉 차트',
  },
  MONTHLY: {
    apiPeriod: 'MONTHLY',
    lookbackDays: 365 * 15,
    periodLabel: '월봉 차트',
  },
  YEARLY: {
    apiPeriod: 'YEARLY',
    lookbackDays: 365 * 30,
    periodLabel: '년봉 차트',
  },
}

const DAY_MS = 24 * 60 * 60 * 1000

const STOCK_META_BY_CODE = {
  [INVEST_STOCK.code]: INVEST_STOCK,
}

function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return '-'
  return new Intl.NumberFormat('ko-KR').format(Math.round(value))
}

function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return '-'
  return `₩${formatNumber(value)}`
}

function formatSignedNumber(value) {
  if (value == null || Number.isNaN(value)) return '-'
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${formatNumber(Math.abs(value))}`
}

function formatSignedPercent(value) {
  if (value == null || Number.isNaN(value)) return '-'
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${Math.abs(value).toFixed(2)}%`
}

function getDirectionClass(value) {
  if (value > 0) return 'text-up'
  if (value < 0) return 'text-down'
  return 'text-foreground-disabled'
}

function formatApiDate(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(dateText) {
  if (!dateText) return '-'
  return dateText.slice(5).replace('-', '/')
}

function formatTradeTime(timestamp) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(timestamp)
}

function getChartPeriodConfig(periodKey) {
  return CHART_PERIOD_CONFIG[periodKey] ?? CHART_PERIOD_CONFIG.MINUTE
}

function getChartPeriodLabel(periodKey, minuteInterval) {
  if (periodKey === 'MINUTE') {
    return `${minuteInterval}분 차트`
  }

  return getChartPeriodConfig(periodKey).periodLabel
}

function resolveStockMeta(stockCode) {
  const known = STOCK_META_BY_CODE[stockCode]

  return {
    name: known?.name ?? stockCode,
    code: stockCode,
    market: known?.market ?? '-',
    sector: known?.sector ?? '-',
    availableAmount: known?.availableAmount ?? INVEST_STOCK.availableAmount,
    price: known?.price ?? INVEST_STOCK.price,
    diff: known?.diff ?? 0,
    changeRate: known?.changeRate ?? 0,
    open: known?.open ?? null,
    high: known?.high ?? null,
    low: known?.low ?? null,
    previousClose: known?.previousClose ?? null,
  }
}

function toLocalTimestamp(value, fallbackTime = '00:00:00') {
  if (typeof value === 'string') {
    const normalized = value.includes('T') ? value : `${value}T${fallbackTime}`
    return new Date(normalized).getTime()
  }

  if (Array.isArray(value)) {
    const [year = 1970, month = 1, day = 1, hour = 0, minute = 0, second = 0] = value
    return new Date(year, month - 1, day, hour, minute, second).getTime()
  }

  return Number.NaN
}

function extractDateKey(value) {
  if (typeof value === 'string') {
    return value.slice(0, 10)
  }

  if (Array.isArray(value)) {
    const [year = 1970, month = 1, day = 1] = value
    return `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`
  }

  return ''
}

function normalizeDailySeries(data) {
  return (data ?? [])
    .map((item) => ({
      date: extractDateKey(item.date),
      timestamp: toLocalTimestamp(item.date),
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
      volume: Number(item.volume),
    }))
    .sort((left, right) => left.timestamp - right.timestamp)
}

function normalizeMinuteSeries(data) {
  const normalized = (data ?? [])
    .map((item) => ({
      timestamp: toLocalTimestamp(item.datetime),
      sessionDate: extractDateKey(item.datetime),
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
      volume: Number(item.volume),
    }))
    .filter((item) => Number.isFinite(item.timestamp) && item.sessionDate)
    .sort((left, right) => left.timestamp - right.timestamp)

  const sessions = normalized.reduce((acc, item) => {
    const current = acc.get(item.sessionDate) ?? []
    current.push(item)
    acc.set(item.sessionDate, current)
    return acc
  }, new Map())

  const orderedSessionDates = Array.from(sessions.keys()).sort()
  const latestMeaningfulSession = [...orderedSessionDates]
    .reverse()
    .find((sessionDate) => (sessions.get(sessionDate) ?? []).some((item) => item.volume > 0))

  const targetSession = latestMeaningfulSession ?? orderedSessionDates.at(-1)
  return targetSession ? sessions.get(targetSession) ?? [] : []
}

function buildDailyRows(dailySeries) {
  return dailySeries
    .map((row, index, source) => {
      const previousClose = index > 0 ? source[index - 1].close : null
      const changeRate = previousClose ? ((row.close - previousClose) / previousClose) * 100 : 0

      return {
        date: formatDisplayDate(row.date),
        close: row.close,
        changeRate,
        volume: formatNumber(row.volume),
        open: row.open,
        high: row.high,
        low: row.low,
      }
    })
    .reverse()
}

function buildRealtimeRows(minuteSeries, previousClose) {
  let accumulatedVolume = 0

  const ascendingRows = minuteSeries.map((row, index, source) => {
    accumulatedVolume += row.volume
    const comparisonBase = previousClose ?? source[index - 1]?.close ?? row.close

    return {
      time: formatTradeTime(row.timestamp),
      price: row.close,
      diff: row.close - comparisonBase,
      volume: formatNumber(row.volume),
      accumulatedVolume: formatNumber(accumulatedVolume),
      strength: '-',
      isStrong: false,
    }
  })

  return ascendingRows.reverse()
}

function SectionTabs({ items, activeKey, onChange }) {
  return (
    <div className="flex border-b border-stroke px-2.5 shrink-0 bg-surface-subtle">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            'px-3 py-2.5 text-xs font-semibold transition-colors',
            activeKey === item.key
              ? 'text-primary border-b-2 border-primary'
              : 'text-foreground-disabled hover:text-foreground-secondary',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function MiniMetric({ label, value, tone = 'neutral' }) {
  return (
    <div className="py-0.5">
      <div className="text-[8px] text-foreground-disabled">{label}</div>
      <div
        className={cn(
          'text-[11px] font-bold',
          tone === 'up' && 'text-up',
          tone === 'down' && 'text-down',
          tone === 'neutral' && 'text-foreground',
        )}
      >
        {value}
      </div>
    </div>
  )
}

function StockOverview({
  stockMeta,
  currentPrice,
  changeAmount,
  changeRate,
  overview,
  chartSeries,
  chartPeriod,
  minuteInterval,
  chartLoading,
  chartErrorMessage,
  onChartPeriodChange,
  onMinuteIntervalChange,
  isLoading,
  errorMessage,
}) {
  const priceTone = getDirectionClass(changeAmount)
  const changeArrow = changeAmount > 0 ? '▲' : changeAmount < 0 ? '▼' : ''

  return (
    <section className="flex min-w-0 basis-0 flex-1 flex-col overflow-hidden border-r border-stroke bg-surface">
      <div className="px-[14px] py-2.5 border-b border-stroke shrink-0">
        <div className="flex items-center gap-2 rounded-[10px] border border-stroke-input bg-background px-3 py-2">
          <Search className="h-[13px] w-[13px] text-foreground-disabled shrink-0" />
          <span className="text-[13px] font-bold text-foreground">{stockMeta.name}</span>
          <span className="text-[11px] text-foreground-disabled">{stockMeta.code}</span>
          <div className="ml-auto flex items-center gap-1">
            <LiveDot size="sm" />
            <span className="text-[9px] text-live">실시간</span>
          </div>
        </div>
        {errorMessage && (
          <div className="mt-1.5 text-[10px] text-danger">{errorMessage}</div>
        )}
      </div>

      <div className="px-[14px] py-2.5 border-b border-stroke shrink-0">
        <div className="flex items-center gap-2">
          <StockAvatar name={stockMeta.name} size="lg" className="border-2" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-foreground leading-tight">{stockMeta.name}</div>
            <div className="mt-0.5 text-[9px] text-foreground-disabled">
              {stockMeta.code} · {stockMeta.market} · {stockMeta.sector}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={cn('text-[22px] font-black tracking-tight leading-none', priceTone)}>
              {isLoading && currentPrice == null ? '...' : formatNumber(currentPrice)}
            </div>
            <div className="mt-1 flex items-center justify-end gap-1">
              <span className={cn('text-[11px] font-bold', priceTone)}>
                {changeArrow}{formatNumber(Math.abs(changeAmount))}
              </span>
              {changeRate != null && !Number.isNaN(changeRate) && (
                <PriceChange value={changeRate} variant="badge" />
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="관심 종목"
            className="shrink-0 rounded-full border-[1.5px] border-stroke-input bg-surface px-2 py-1 text-[10px] font-semibold text-foreground-secondary transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
          >
            <Star className="h-3 w-3" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-0 border-b border-stroke px-[14px] py-1.5 shrink-0">
        <MiniMetric label="시가" value={formatNumber(overview.open)} />
        <MiniMetric label="고가" value={formatNumber(overview.high)} tone="up" />
        <MiniMetric label="저가" value={formatNumber(overview.low)} tone="down" />
        <MiniMetric label="전일종가" value={formatNumber(overview.previousClose)} />
      </div>

      <div className="flex flex-1 min-h-0 flex-col px-[14px] pt-2.5 pb-2">
        <InvestStockChart
          stockCode={stockMeta.code}
          stockName={stockMeta.name}
          series={chartSeries}
          selectedPeriod={chartPeriod}
          periodLabel={getChartPeriodLabel(chartPeriod, minuteInterval)}
          periodOptions={CHART_PERIOD_OPTIONS}
          minuteInterval={minuteInterval}
          minuteIntervalOptions={MINUTE_INTERVAL_OPTIONS}
          onPeriodChange={onChartPeriodChange}
          onMinuteIntervalChange={onMinuteIntervalChange}
          isLoading={chartLoading ?? isLoading}
          errorMessage={chartErrorMessage ?? errorMessage}
        />
      </div>
    </section>
  )
}

function OrderBookPanel({ selectedPrice, currentPrice, changeRate, onSelectPrice }) {
  return (
    <section className="flex w-[170px] shrink-0 flex-col overflow-hidden border-r border-stroke bg-surface">
      <div className="flex items-center justify-between border-b border-stroke px-2.5 py-2 shrink-0">
        <span className="text-[11px] font-bold text-foreground">호가창</span>
        <span className="text-[9px] text-foreground-disabled">잔량</span>
      </div>

      <div className="flex items-center justify-between bg-down-bg px-2 py-1 shrink-0">
        <span className="text-[9px] font-semibold text-down">매도잔량</span>
        <span className="text-[10px] font-bold text-down">{formatNumber(ORDER_BOOK.askTotal)}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {ORDER_BOOK.asks.map((row) => (
          <button
            key={`ask-${row.price}`}
            onClick={() => onSelectPrice(row.price)}
            className={cn(
              'relative flex w-full items-center justify-between px-2 py-[3px] text-left transition-colors hover:bg-down-bg/40',
              selectedPrice === row.price && 'bg-down-bg/70',
            )}
          >
            <div className="absolute inset-y-0 right-0 bg-down/10" style={{ width: `${row.depth}%` }} />
            <span className="relative text-xs font-bold text-down">{formatNumber(row.price)}</span>
            <span className="relative text-[10px] text-foreground-tertiary">{formatNumber(row.quantity)}</span>
          </button>
        ))}

        <div className="flex items-center justify-between border-y-2 border-up-border bg-up-bg px-2 py-1.5">
          <span className="text-[15px] font-black text-up">{formatNumber(currentPrice)}</span>
          {changeRate != null && !Number.isNaN(changeRate) && (
            <PriceChange value={changeRate} variant="badge" />
          )}
        </div>

        {ORDER_BOOK.bids.map((row) => (
          <button
            key={`bid-${row.price}`}
            onClick={() => onSelectPrice(row.price)}
            className={cn(
              'relative flex w-full items-center justify-between px-2 py-[3px] text-left transition-colors hover:bg-up-bg/40',
              selectedPrice === row.price && 'bg-up-bg/70',
            )}
          >
            <div className="absolute inset-y-0 right-0 bg-up/10" style={{ width: `${row.depth}%` }} />
            <span className="relative text-xs font-bold text-up">{formatNumber(row.price)}</span>
            <span className="relative text-[10px] text-foreground-tertiary">{formatNumber(row.quantity)}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-stroke bg-up-bg px-2 py-1 shrink-0">
        <span className="text-[9px] font-semibold text-up">매수잔량</span>
        <span className="text-[10px] font-bold text-up">{formatNumber(ORDER_BOOK.bidTotal)}</span>
      </div>
    </section>
  )
}

function OrderPanel({
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
            'w-full rounded-[10px] px-3 py-3 text-sm font-black transition-opacity shadow-sm',
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

function DailyPriceTable({ rows, isLoading, errorMessage }) {
  if (isLoading && rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
        일별 시세를 불러오는 중입니다.
      </div>
    )
  }

  if (errorMessage && rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-xs text-danger">
        {errorMessage}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
        표시할 일별 시세가 없습니다.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead className="sticky top-0 z-[1] bg-surface-subtle">
          <tr>
            <th className="border-b border-stroke px-2 py-1.5 text-left text-[10px] font-semibold text-foreground-disabled">일자</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">종가</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">등락률</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">거래량</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">시가</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">고가</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">저가</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.date}>
              <td className="border-b border-stroke-subtle px-2 py-1.5 font-semibold text-foreground-secondary">{row.date}</td>
              <td className={cn('border-b border-stroke-subtle px-2 py-1.5 text-right font-extrabold', getDirectionClass(row.changeRate))}>
                {formatNumber(row.close)}
              </td>
              <td className={cn('border-b border-stroke-subtle px-2 py-1.5 text-right', getDirectionClass(row.changeRate))}>
                {formatSignedPercent(row.changeRate)}
              </td>
              <td className="border-b border-stroke-subtle px-2 py-1.5 text-right">{row.volume}</td>
              <td className="border-b border-stroke-subtle px-2 py-1.5 text-right">{formatNumber(row.open)}</td>
              <td className="border-b border-stroke-subtle px-2 py-1.5 text-right text-up">{formatNumber(row.high)}</td>
              <td className="border-b border-stroke-subtle px-2 py-1.5 text-right text-down">{formatNumber(row.low)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RealtimeTradeTable({ rows, isLoading, errorMessage }) {
  if (isLoading && rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
        실시간 시세를 불러오는 중입니다.
      </div>
    )
  }

  if (errorMessage && rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-xs text-danger">
        {errorMessage}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
        표시할 실시간 시세가 없습니다.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-[1] grid grid-cols-[58px_68px_72px_72px_100px_72px] border-b border-stroke bg-surface-subtle px-2.5 py-1">
        {['시간', '체결가', '전일대비', '체결량', '누적거래량', '체결강도'].map((label) => (
          <span key={label} className={cn('text-[9px] font-semibold text-foreground-disabled', label === '시간' ? '' : 'text-right')}>
            {label}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={`${row.time}-${row.price}`}
          className="grid grid-cols-[58px_68px_72px_72px_100px_72px] items-center border-b border-stroke-subtle px-2.5 py-1"
        >
          <span className="text-[10px] text-foreground-disabled">{row.time}</span>
          <span className={cn('text-[11px] font-bold text-right', getDirectionClass(row.diff))}>
            {formatNumber(row.price)}
          </span>
          <span className={cn('text-[10px] text-right', getDirectionClass(row.diff))}>
            {formatSignedNumber(row.diff)}
          </span>
          <span className="text-[10px] text-right">{row.volume}</span>
          <span className="text-[10px] text-right">{row.accumulatedVolume}</span>
          <span className={cn('text-[10px] font-semibold text-right', row.isStrong ? 'text-up' : 'text-foreground-disabled')}>
            {row.strength}
          </span>
        </div>
      ))}
    </div>
  )
}

function ExecutionHistoryPanel() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-[1] grid grid-cols-[58px_minmax(0,1fr)_40px_72px_48px_90px] items-center border-b border-stroke bg-surface-subtle px-2.5 py-1">
        {['시간', '종목', '구분', '체결가', '수량', '금액'].map((label) => (
          <span key={label} className={cn('text-[9px] font-semibold text-foreground-disabled', label === '시간' || label === '종목' || label === '구분' ? '' : 'text-right')}>
            {label}
          </span>
        ))}
      </div>

      {EXECUTION_HISTORY.map((row) => {
        const isBuy = row.side === 'buy'

        return (
          <div
            key={`${row.time}-${row.name}-${row.side}`}
            className="grid grid-cols-[58px_minmax(0,1fr)_40px_72px_48px_90px] items-center gap-2 border-b border-stroke-subtle px-2.5 py-1.5"
          >
            <span className="text-[10px] text-foreground-disabled">{row.time}</span>
            <div className="flex min-w-0 items-center gap-1.5">
              <StockAvatar name={row.name} color={row.avatar} size="sm" />
              <span className="truncate text-[10px] font-semibold text-foreground">{row.name}</span>
            </div>
            <span
              className={cn(
                'rounded-[4px] px-1 py-0.5 text-center text-[8px] font-bold',
                isBuy ? 'bg-up-bg text-up' : 'bg-down-bg text-down',
              )}
            >
              {isBuy ? '매수' : '매도'}
            </span>
            <span className={cn('text-[10px] font-bold text-right', isBuy ? 'text-up' : 'text-down')}>
              {formatNumber(row.price)}
            </span>
            <span className="text-[10px] text-right">{row.quantity}</span>
            <span className="text-[10px] font-semibold text-right">{row.amount}</span>
          </div>
        )
      })}
    </div>
  )
}

function HoldingPanel() {
  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="grid grid-cols-2 gap-1.5">
        {HOLDING_SUMMARY.map((item) => (
          <div
            key={item.label}
            className={cn(
              'rounded-lg px-2.5 py-2',
              item.tone === 'neutral' && 'bg-surface-subtle',
              item.tone === 'accent' && 'bg-up-bg',
              item.tone === 'profit' && 'bg-up-bg',
            )}
          >
            <div className="mb-0.5 text-[8px] text-foreground-disabled">{item.label}</div>
            <div className={cn('text-[16px] font-extrabold', item.tone === 'profit' ? 'text-up' : 'text-foreground')}>
              {item.value}
            </div>
            {item.subValue && (
              <div className="mt-0.5 text-[9px] font-bold text-up">{item.subValue}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function BottomPanels({
  leftTab,
  rightTab,
  dailyRows,
  realtimeRows,
  isLoading,
  errorMessage,
  onLeftTabChange,
  onRightTabChange,
}) {
  return (
    <div className="flex h-[210px] shrink-0 overflow-hidden border-t-2 border-stroke bg-surface">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden border-r border-stroke">
        <SectionTabs items={LEFT_TABS} activeKey={leftTab} onChange={onLeftTabChange} />
        {leftTab === 'daily' ? (
          <DailyPriceTable rows={dailyRows} isLoading={isLoading} errorMessage={errorMessage} />
        ) : (
          <RealtimeTradeTable rows={realtimeRows} isLoading={isLoading} errorMessage={errorMessage} />
        )}
      </section>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <SectionTabs items={RIGHT_TABS} activeKey={rightTab} onChange={onRightTabChange} />
        {rightTab === 'exec' && <ExecutionHistoryPanel />}
        {rightTab === 'pending' && (
          <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
            미체결 주문이 없습니다.
          </div>
        )}
        {rightTab === 'holding' && <HoldingPanel />}
      </section>
    </div>
  )
}

export default function InvestPage() {
  const { stockCode: routeStockCode } = useParams()
  const stockCode = routeStockCode ?? INVEST_STOCK.code
  const stockMeta = resolveStockMeta(stockCode)

  const [side, setSide] = useState('buy')
  const [orderType, setOrderType] = useState('market')
  const [condition, setCondition] = useState('normal')
  const [quantity, setQuantity] = useState(100)
  const [selectedPrice, setSelectedPrice] = useState(stockMeta.price)
  const [leftTab, setLeftTab] = useState('daily')
  const [rightTab, setRightTab] = useState('exec')
  const [marketState, setMarketState] = useState({
    isLoading: true,
    errorMessage: '',
    priceData: null,
    dailySeries: [],
    minuteSeries: [],
  })
  const [selectedChartPeriod, setSelectedChartPeriod] = useState('MINUTE')
  const [selectedMinuteInterval, setSelectedMinuteInterval] = useState(5)
  const [chartState, setChartState] = useState({
    isLoading: true,
    errorMessage: '',
    series: [],
  })

  useEffect(() => {
    let isCancelled = false

    async function loadMarketData() {
      setMarketState({
        isLoading: true,
        errorMessage: '',
        priceData: null,
        dailySeries: [],
        minuteSeries: [],
      })

      try {
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 180 * DAY_MS)

        const [priceData, chartData, minuteChartData] = await Promise.all([
          marketApi.getCurrentPrice(stockCode),
          marketApi.getChart(stockCode, {
            period: 'DAILY',
            startDate: formatApiDate(startDate),
            endDate: formatApiDate(endDate),
          }),
          marketApi.getMinuteChart(stockCode, { ncnt: 1 }),
        ])

        if (isCancelled) return

        const normalizedDailySeries = normalizeDailySeries(chartData?.data)
        const normalizedMinuteSeries = normalizeMinuteSeries(minuteChartData?.data)
        const fallbackPrice = STOCK_META_BY_CODE[stockCode]?.price ?? INVEST_STOCK.price
        const nextCurrentPrice = priceData?.currentPrice
          ?? normalizedDailySeries.at(-1)?.close
          ?? fallbackPrice

        setMarketState({
          isLoading: false,
          errorMessage: '',
          priceData,
          dailySeries: normalizedDailySeries,
          minuteSeries: normalizedMinuteSeries,
        })
        setSelectedPrice(nextCurrentPrice)
        setOrderType('market')
      } catch (error) {
        if (isCancelled) return

        setMarketState({
          isLoading: false,
          errorMessage: error?.message ?? '시장 데이터를 불러오지 못했습니다.',
          priceData: null,
          dailySeries: [],
          minuteSeries: [],
        })
      }
    }

    loadMarketData()

    return () => {
      isCancelled = true
    }
  }, [stockCode])

  useEffect(() => {
    const usesBaseMinuteData = selectedChartPeriod === 'MINUTE' && selectedMinuteInterval === 1

    if (usesBaseMinuteData || selectedChartPeriod === 'DAILY') {
      return
    }

    let isCancelled = false

    async function loadChartSeries() {
      setChartState({
        isLoading: true,
        errorMessage: '',
        series: [],
      })

      try {
        let nextSeries = []

        if (selectedChartPeriod === 'MINUTE') {
          const minuteChartData = await marketApi.getMinuteChart(stockCode, { ncnt: selectedMinuteInterval })
          nextSeries = normalizeMinuteSeries(minuteChartData?.data)
        } else {
          const config = getChartPeriodConfig(selectedChartPeriod)
          const endDate = new Date()
          const startDate = new Date(endDate.getTime() - config.lookbackDays * DAY_MS)
          const chartData = await marketApi.getChart(stockCode, {
            period: config.apiPeriod,
            startDate: formatApiDate(startDate),
            endDate: formatApiDate(endDate),
          })

          nextSeries = normalizeDailySeries(chartData?.data)
        }

        if (isCancelled) return

        setChartState({
          isLoading: false,
          errorMessage: '',
          series: nextSeries,
        })
      } catch (error) {
        if (isCancelled) return

        setChartState({
          isLoading: false,
          errorMessage: error?.message ?? '차트 데이터를 불러오지 못했습니다.',
          series: [],
        })
      }
    }

    loadChartSeries()

    return () => {
      isCancelled = true
    }
  }, [stockCode, selectedChartPeriod, selectedMinuteInterval])

  const latestDaily = marketState.dailySeries.at(-1)
  const previousClose = marketState.dailySeries.at(-2)?.close ?? stockMeta.previousClose
  const currentPrice = marketState.priceData?.currentPrice ?? latestDaily?.close ?? stockMeta.price
  const changeAmount = marketState.priceData?.changeAmount
    ?? (currentPrice != null && previousClose != null ? currentPrice - previousClose : stockMeta.diff)
  const changeRate = marketState.priceData?.changeRate
    ?? (previousClose ? (changeAmount / previousClose) * 100 : stockMeta.changeRate)

  const overview = {
    open: latestDaily?.open ?? stockMeta.open,
    high: latestDaily?.high ?? stockMeta.high,
    low: latestDaily?.low ?? stockMeta.low,
    previousClose,
  }
  const usesBaseChartData = (selectedChartPeriod === 'MINUTE' && selectedMinuteInterval === 1)
    || selectedChartPeriod === 'DAILY'
  const chartSeries = selectedChartPeriod === 'MINUTE'
    ? selectedMinuteInterval === 1
      ? marketState.minuteSeries
      : chartState.series
    : selectedChartPeriod === 'DAILY'
      ? marketState.dailySeries
      : chartState.series
  const chartLoading = usesBaseChartData ? marketState.isLoading : chartState.isLoading
  const chartErrorMessage = usesBaseChartData ? marketState.errorMessage : chartState.errorMessage

  const dailyRows = buildDailyRows(marketState.dailySeries)
  const realtimeRows = buildRealtimeRows(marketState.minuteSeries, previousClose)

  const holdingQuantity = 100
  const availableAmount = stockMeta.availableAmount
  const marketPrice = currentPrice ?? stockMeta.price
  const unitPrice = orderType === 'limit' ? selectedPrice : marketPrice
  const maxOrderQuantity = side === 'buy'
    ? Math.max(1, Math.floor(availableAmount / Math.max(unitPrice, 1)))
    : holdingQuantity

  function getMaxOrderQuantity(nextSide = side, nextOrderType = orderType, nextSelectedPrice = selectedPrice) {
    const nextUnitPrice = nextOrderType === 'limit' ? nextSelectedPrice : marketPrice

    return nextSide === 'buy'
      ? Math.max(1, Math.floor(availableAmount / Math.max(nextUnitPrice, 1)))
      : holdingQuantity
  }

  function clampQuantity(nextValue, nextSide = side, nextOrderType = orderType, nextSelectedPrice = selectedPrice) {
    return Math.min(
      getMaxOrderQuantity(nextSide, nextOrderType, nextSelectedPrice),
      Math.max(1, nextValue),
    )
  }

  function handleQuantityDelta(delta) {
    setQuantity((prev) => clampQuantity(prev + delta))
  }

  function handleQuantityPreset(ratio) {
    const nextMaxOrderQuantity = getMaxOrderQuantity()
    const nextValue = ratio === 1
      ? nextMaxOrderQuantity
      : Math.max(1, Math.floor(nextMaxOrderQuantity * ratio))

    setQuantity(clampQuantity(nextValue))
  }

  function handleSideChange(nextSide) {
    const nextMaxOrderQuantity = getMaxOrderQuantity(nextSide)
    setSide(nextSide)
    setQuantity((prev) => Math.min(prev, nextMaxOrderQuantity))
  }

  function handleOrderTypeChange(nextOrderType) {
    const nextMaxOrderQuantity = getMaxOrderQuantity(side, nextOrderType)
    setOrderType(nextOrderType)
    setQuantity((prev) => Math.min(prev, nextMaxOrderQuantity))
  }

  function handleSelectPrice(price) {
    const nextMaxOrderQuantity = getMaxOrderQuantity(side, 'limit', price)
    setSelectedPrice(price)
    setOrderType('limit')
    setQuantity((prev) => Math.min(prev, nextMaxOrderQuantity))
  }

  return (
    <div className="h-full overflow-x-auto bg-surface">
      <div className="flex h-full min-h-0 min-w-[900px] flex-col bg-surface">
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <StockOverview
            stockMeta={stockMeta}
            currentPrice={currentPrice}
            changeAmount={changeAmount}
            changeRate={changeRate}
            overview={overview}
            chartSeries={chartSeries}
            chartPeriod={selectedChartPeriod}
            minuteInterval={selectedMinuteInterval}
            chartLoading={chartLoading}
            chartErrorMessage={chartErrorMessage}
            onChartPeriodChange={setSelectedChartPeriod}
            onMinuteIntervalChange={setSelectedMinuteInterval}
            isLoading={marketState.isLoading}
            errorMessage={marketState.errorMessage}
          />

          <OrderBookPanel
            selectedPrice={selectedPrice}
            currentPrice={currentPrice}
            changeRate={changeRate}
            onSelectPrice={handleSelectPrice}
          />

          <OrderPanel
            stockName={stockMeta.name}
            availableAmount={availableAmount}
            side={side}
            orderType={orderType}
            condition={condition}
            quantity={quantity}
            maxOrderQuantity={maxOrderQuantity}
            unitPrice={unitPrice}
            selectedPrice={selectedPrice}
            onSideChange={handleSideChange}
            onOrderTypeChange={handleOrderTypeChange}
            onConditionChange={setCondition}
            onQuantityDelta={handleQuantityDelta}
            onPresetApply={handleQuantityPreset}
          />
        </div>

        <BottomPanels
          leftTab={leftTab}
          rightTab={rightTab}
          dailyRows={dailyRows}
          realtimeRows={realtimeRows}
          isLoading={marketState.isLoading}
          errorMessage={marketState.errorMessage}
          onLeftTabChange={setLeftTab}
          onRightTabChange={setRightTab}
        />
      </div>
    </div>
  )
}
