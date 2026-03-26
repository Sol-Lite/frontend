import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import WidgetCard from './WidgetCard'
import { cn } from '@/lib/cn'
import { orderApi } from '@/api/order'

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']

function fmtPrice(n) {
  return Number(n ?? 0).toLocaleString('ko-KR')
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr)
  return `${d.getMonth() + 1}.${d.getDate()}`
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildTradeMap(orders) {
  const map = {}
  orders.forEach((o) => {
    const raw = o.executedAt ?? o.requestedAt
    if (!raw) return
    const d = new Date(raw.length === 10 ? raw + 'T00:00:00' : raw)
    const k = dateKey(d)
    if (!map[k]) map[k] = []
    map[k].push({ s: o.stockName, buy: o.orderSide === 'BUY' })
  })
  return map
}

function buildMonthCells(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function buildWeekCells(date) {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return { d: d.getDate(), key: dateKey(d) }
  })
}

function useFilledOrders(enabled) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['orders', 'FILLED'],
    queryFn: () => orderApi.getOrders('FILLED'),
    enabled,
    staleTime: 30_000,
  })
  return { data, isLoading }
}

export default function TradeHistoryWidget({ variant = 'trade-list', colSpan = 1, rowSpan = 1, onDelete }) {
  const { isAuthenticated, isRestoring } = useAuthStore()
  const { data: orders, isLoading } = useFilledOrders(isAuthenticated && !isRestoring)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthLabel = `${year}년 ${month + 1}월`

  const tradeMap   = useMemo(() => buildTradeMap(orders), [orders])
  const monthCells = useMemo(() => buildMonthCells(year, month), [year, month])
  const weekCells  = useMemo(() => buildWeekCells(now), [year, month, now.getDate()])

  const recentTrades = useMemo(() =>
    orders.slice(0, 10).map((o) => ({
      name:  o.stockName,
      type:  o.orderSide === 'BUY' ? '매수' : '매도',
      qty:   `${o.filledQuantity ?? o.orderQuantity}주`,
      price: fmtPrice(o.orderPrice),
      date:  fmtDate(o.executedAt ?? o.requestedAt),
    })),
    [orders]
  )

  /* ── trade-3x2: 캘린더 + 목록 3×2 ── */
  if (variant === 'trade-3x2') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">거래내역</span>
          <span className="text-[9px] text-foreground-disabled">{monthLabel}</span>
        </div>
        <div className="flex flex-1 min-h-0 gap-4">
          {/* 좌: 캘린더 */}
          <div className="flex flex-col flex-1 min-h-0 min-w-0">
            <div className="grid grid-cols-7 gap-0.5 shrink-0 mb-1">
              {WEEK_DAYS.map((d) => (
                <div key={d} className="text-center text-[8px] font-semibold text-foreground-disabled">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0">
              {monthCells.map((d, i) => {
                const k = d ? dateKey(new Date(year, month, d)) : null
                const trades = k ? (tradeMap[k] ?? null) : null
                return (
                  <div key={i} className="flex flex-col items-start rounded p-0.5">
                    <span className={cn('text-[9px] leading-none mb-px', d ? 'text-foreground' : 'invisible')}>
                      {d ?? '0'}
                    </span>
                    {trades && trades.slice(0, 2).map((tr, j) => (
                      <div key={j} className="flex items-center gap-px w-full">
                        <div className={cn('w-0.5 rounded-full shrink-0 self-stretch', tr.buy ? 'bg-up' : 'bg-down')} />
                        <span className="text-[7px] leading-snug truncate text-foreground">{tr.s}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
          {/* 우: 목록 */}
          <div className="flex flex-col min-h-0 border-l border-stroke pl-4 shrink-0 w-[40%]">
            <span className="text-[9px] font-semibold text-foreground-disabled mb-1 shrink-0">거래 내역</span>
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5">
              {isLoading
                ? <div className="text-[9px] text-foreground-disabled">불러오는 중...</div>
                : recentTrades.length > 0 ? recentTrades.map(({ name, type, qty, price, date }) => (
                <div key={`${name}-${date}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={cn(
                      'text-[8px] font-semibold px-1 py-px rounded shrink-0',
                      type === '매수' ? 'text-up bg-up/10' : 'text-down bg-down/10',
                    )}>
                      {type}
                    </span>
                    <span className="text-[10px] text-foreground truncate">{name}</span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[9px] font-semibold text-foreground">{price}</span>
                    <span className="text-[8px] text-foreground-disabled">{qty} · {date}</span>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex items-center justify-center text-[9px] text-foreground-disabled">거래내역 없음</div>
              )}
            </div>
          </div>
        </div>
        {!isRestoring && !isAuthenticated && <LockedOverlay message="거래내역을 보려면" />}
      </WidgetCard>
    )
  }

  /* ── trade-wide: 주간 캘린더 2×1 ── */
  if (variant === 'trade-wide') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">거래내역</span>
          <span className="text-[9px] text-foreground-disabled">{monthLabel}</span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 shrink-0 mb-1">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="text-center text-[8px] font-semibold text-foreground-disabled">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0">
          {weekCells.map(({ d, key }, i) => {
            const trades = tradeMap[key] ?? null
            return (
              <div key={i} className="flex flex-col items-start rounded-lg p-1 bg-background/50">
                <span className="text-[9px] leading-none mb-1 text-foreground">{d}</span>
                {trades && trades.map((tr, j) => (
                  <div key={j} className="flex items-center gap-0.5 w-full mb-0.5">
                    <div className={cn('w-0.5 rounded-full shrink-0 self-stretch', tr.buy ? 'bg-up' : 'bg-down')} />
                    <span className="text-[8px] leading-snug truncate text-foreground">{tr.s}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
        {!isRestoring && !isAuthenticated && <LockedOverlay message="거래내역을 보려면" />}
      </WidgetCard>
    )
  }

  /* ── trade-cal: 월간 캘린더 2×2 ── */
  if (variant === 'trade-cal') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">거래내역</span>
          <span className="text-[9px] text-foreground-disabled">{monthLabel}</span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 shrink-0 mb-1">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="text-center text-[8px] font-semibold text-foreground-disabled">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0">
          {monthCells.map((d, i) => {
            const k = d ? `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null
            const trades = k ? (tradeMap[k] ?? null) : null
            return (
              <div key={i} className="flex flex-col items-start rounded p-0.5">
                <span className={cn('text-[9px] leading-none mb-px', d ? 'text-foreground' : 'invisible')}>
                  {d ?? '0'}
                </span>
                {trades && trades.slice(0, 2).map((tr, j) => (
                  <div key={j} className="flex items-center gap-px w-full">
                    <div className={cn('w-0.5 rounded-full shrink-0 self-stretch', tr.buy ? 'bg-up' : 'bg-down')} />
                    <span className="text-[7px] leading-snug truncate text-foreground">{tr.s}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
        {!isRestoring && !isAuthenticated && <LockedOverlay message="거래내역을 보려면" />}
      </WidgetCard>
    )
  }

  /* ── trade-list: 목록형 1×1 (default) ── */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">거래내역</span>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-y-auto">
        {isLoading
          ? <div className="text-[9px] text-foreground-disabled">불러오는 중...</div>
          : recentTrades.length > 0 ? recentTrades.map(({ name, type, qty, date }) => (
          <div key={`${name}-${date}`} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={cn(
                'text-[8px] font-semibold px-1 py-px rounded shrink-0',
                type === '매수' ? 'text-up bg-up/10' : 'text-down bg-down/10',
              )}>
                {type}
              </span>
              <span className="text-[10px] text-foreground truncate">{name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] text-foreground-disabled">{qty}</span>
              <span className="text-[8px] text-foreground-disabled">{date}</span>
            </div>
          </div>
        )) : (
          <div className="flex-1 flex items-center justify-center text-[9px] text-foreground-disabled">거래내역 없음</div>
        )}
      </div>
      {!isRestoring && !isAuthenticated && <LockedOverlay message="거래내역을 보려면" />}
    </WidgetCard>
  )
}
