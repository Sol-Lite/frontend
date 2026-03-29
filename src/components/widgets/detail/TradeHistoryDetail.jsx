import { useState, useMemo, useCallback } from 'react'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import StockAvatar from '@/components/ui/StockAvatar'
import { DayPicker } from 'react-day-picker'
import { ko } from 'react-day-picker/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { orderApi } from '@/api/order'
import useAuthStore from '@/store/useAuthStore'
import { cn } from '@/lib/cn'

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const FOREIGN_MARKETS = new Set(['NASDAQ', 'NYSE', 'AMEX'])

function fmtPrice(n, marketType) {
  if (n == null) return '-'
  return FOREIGN_MARKETS.has(marketType)
    ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₩${Number(n).toLocaleString('ko-KR')}`
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function buildTradeMap(orders) {
  // 날짜별 원본 목록 (리스트 패널용)
  const raw = {}
  orders.forEach((o) => {
    const dt = o.executedAt ?? o.requestedAt
    if (!dt) return
    const d = new Date(dt.length === 10 ? dt + 'T00:00:00' : dt)
    const k = dateKey(d)
    if (!raw[k]) raw[k] = []
    raw[k].push({
      stockCode:    o.stockCode,
      marketType:   o.marketType ?? null,
      exchangeCode: o.exchangeCode ?? null,
      name:  o.stockName,
      buy:   o.orderSide === 'BUY',
      qty:   o.filledQuantity ?? o.orderQuantity,
      price: o.orderPrice,
      date:  fmtDate(dt),
    })
  })

  // 캘린더 셀용: 종목 dedup 후 매수 최대 3건, 매도 최대 2건, 초과 시 '...' 하나
  const map = {}
  Object.entries(raw).forEach(([k, trades]) => {
    const seen = new Set()
    const buys = [], sells = []
    trades.forEach((t) => {
      const id = `${t.buy ? 'B' : 'S'}:${t.name}`
      if (seen.has(id)) return
      seen.add(id)
      ;(t.buy ? buys : sells).push(t.name)
    })
    const hasMore = buys.length > 3 || sells.length > 2
    map[k] = [
      ...buys.slice(0, 3).map((name) => ({ buy: true,  name })),
      ...sells.slice(0, 2).map((name) => ({ buy: false, name })),
      ...(hasMore ? [{ buy: null, name: '...' }] : []),
    ]
  })

  return { calMap: map, rawMap: raw }
}

export default function TradeHistoryDetail() {
  const { isAuthenticated, isRestoring } = useAuthStore()
  const open = useWidgetDetailStore((s) => s.open)

  const handleTradeClick = useCallback((trade) => {
    open({
      widgetTypeId: 'stock-chart',
      config: {
        stockCode:    trade.stockCode,
        stockName:    trade.name,
        marketType:   trade.marketType,
        exchangeCode: trade.exchangeCode,
      },
    })
  }, [open])
  const [selected, setSelected] = useState(null)
  const [month, setMonth] = useState(new Date())

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', 'FILLED'],
    queryFn:  () => orderApi.getOrders('FILLED'),
    enabled:  isAuthenticated && !isRestoring,
    staleTime: 30_000,
  })

  const { calMap, rawMap } = useMemo(() => buildTradeMap(orders), [orders])

  // 날짜 셀 커스텀 버튼
  const CustomDayButton = useCallback(({ day, modifiers, ...btnProps }) => {
    const key    = dateKey(day.date)
    const dow    = day.date.getDay()
    const trades = calMap[key] ?? []

    return (
      <button
        {...btnProps}
        className={cn(
          'w-full h-full flex flex-col items-start justify-start gap-1 rounded-xl transition-colors pb-1 overflow-hidden',
          modifiers.selected && '',
          !modifiers.selected && modifiers.today && '',
          !modifiers.selected && !modifiers.today && 'hover:bg-surface-muted',
          modifiers.outside && 'opacity-25 pointer-events-none',
        )}
      >
        {/* 상단 바 (날짜 포함) */}
        <div className={cn(
          'w-full shrink-0 flex items-center justify-center py-1',
          modifiers.today ? 'bg-primary' : 'bg-transparent',
        )}>
          <div className="flex flex-col items-center gap-0.5">
            <span className={cn(
              'text-[13px] leading-none font-medium',
              modifiers.today
                ? 'text-white font-bold'
                : dow === 6 ? 'text-up'
                : dow === 0 ? 'text-down'
                : 'text-foreground',
            )}>
              {day.date.getDate()}
            </span>
            {modifiers.selected && !modifiers.today && (
              <div className="w-4.5 h-[2px] rounded-full bg-primary" />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-px w-full px-1">
          {trades.map((tr, i) => (
            <div key={i} className="flex items-center gap-0.5 w-full min-w-0">
              {tr.buy !== null && <div className={cn('w-0.5 self-stretch rounded-full shrink-0', tr.buy ? 'bg-up' : 'bg-down')} />}
              <span className="text-[9px] leading-tight truncate text-foreground">
                {tr.name}
              </span>
            </div>
          ))}
        </div>
      </button>
    )
  }, [calMap])

  const CustomMonthCaption = useCallback(({ calendarMonth }) => {
    const d = calendarMonth.date
    const label = `${d.getMonth() + 1}월`
    const prevMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1)
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    return (
      <div className="mb-5">
        <div className="grid grid-cols-7 items-center">
          <div className="col-span-6 flex items-center gap-1">
            <button
              onClick={() => setMonth(prevMonth)}
              className="p-1.5 rounded-lg hover:bg-surface-muted transition-colors text-foreground-tertiary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center flex-1">
              <span className="text-[12px] text-foreground-disabled font-medium leading-none">{d.getFullYear()}년</span>
              <span className="text-[15px] font-bold text-foreground leading-tight">{label}</span>
            </div>
            <button
              onClick={() => setMonth(nextMonth)}
              className="p-1.5 rounded-lg hover:bg-surface-muted transition-colors text-foreground-tertiary"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => { setMonth(new Date()); setSelected(new Date()) }}
              className="text-[11px] font-medium text-primary hover:bg-primary-light px-2 py-1 rounded-lg transition-colors"
            >
              오늘
            </button>
          </div>
        </div>
      </div>
    )
  }, [setMonth, setSelected])

  const CustomWeekday = useCallback(({ children, ...props }) => {
    const label = String(children)
    const isSat = label === '토'
    const isSun = label === '일'
    return (
      <th
        {...props}
        className={cn(
          'text-center text-[11px] font-semibold pb-2 border-b border-stroke',
          isSat ? 'text-up' : isSun ? 'text-down' : 'text-foreground-disabled',
        )}
      >
        {children}
      </th>
    )
  }, [])

  // 오른쪽 패널에 표시할 거래 목록
  const displayTrades = useMemo(() => {
    if (selected) {
      return rawMap[dateKey(selected)] ?? []
    }
    const y = month.getFullYear()
    const m = month.getMonth()
    return Object.entries(rawMap)
      .filter(([k]) => {
        const d = new Date(k)
        return d.getFullYear() === y && d.getMonth() === m
      })
      .sort(([a], [b]) => b.localeCompare(a))
      .flatMap(([, trades]) => trades)
  }, [selected, rawMap, month])

  const panelLabel = selected
    ? `${selected.getMonth() + 1}월 ${selected.getDate()}일`
    : `${month.getMonth() + 1}월 전체`

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">

      {/* ── 왼쪽: 캘린더 ── */}
      <div className="flex flex-col border-r border-stroke p-6 w-[65%]">
        <DayPicker
          mode="single"
          locale={ko}
          selected={selected}
          onSelect={(date) => {
            if (!date) return
            setSelected((prev) =>
              prev && dateKey(prev) === dateKey(date) ? null : date
            )
          }}
          month={month}
          onMonthChange={setMonth}
          components={{ DayButton: CustomDayButton, Weekday: CustomWeekday, MonthCaption: CustomMonthCaption }}
          classNames={{
            root:            'w-full',
            months:          'w-full',
            month:           'w-full',
            month_caption:   '',
            nav:             'hidden',
            month_grid:      'w-full border-collapse',
            weekdays:        'grid grid-cols-7',
            weekday:         '',
            weeks:           'flex flex-col gap-1 mt-2',
            week:            'grid grid-cols-7 gap-1',
            day:             'aspect-square',
            day_button:      'w-full h-full',
          }}
        />
      </div>

      {/* ── 오른쪽: 거래 목록 ── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="shrink-0 px-6 pt-5 pb-3 border-b border-stroke flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-foreground">{panelLabel}</h3>
          {selected && (
            <button
              onClick={() => setSelected(null)}
              className="text-[11px] text-foreground-disabled hover:text-foreground-secondary transition-colors"
            >
              전체 보기
            </button>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <span className="text-xs text-foreground-disabled">불러오는 중...</span>
            </div>
          ) : displayTrades.length === 0 ? (
            <div className="flex items-center justify-center h-20">
              <span className="text-xs text-foreground-disabled">거래내역이 없습니다</span>
            </div>
          ) : (
            <div className="divide-y divide-stroke">
              {displayTrades.map((t, i) => (
                <div key={i} onClick={() => handleTradeClick(t)} className="flex items-center justify-between px-6 py-3.5 cursor-pointer hover:bg-surface-muted transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <StockAvatar name={t.name} stockCode={t.stockCode} marketType={t.marketType} size="sm" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-medium text-foreground truncate">{t.name}</span>
                      <span className={cn('text-[10px] font-semibold', t.buy ? 'text-up' : 'text-down')}>
                        {t.buy ? '매수' : '매도'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-0.5 ml-4">
                    <span className="text-[13px] font-semibold text-foreground tabular-nums">
                      {fmtPrice(t.price, t.marketType)}
                    </span>
                    <span className="text-[11px] text-foreground-disabled tabular-nums">
                      {t.qty}주 · {t.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
