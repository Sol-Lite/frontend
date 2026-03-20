import WidgetCard from './WidgetCard'
import { cn } from '@/lib/cn'

const TRADES = [
  { name: '삼성전자',       type: '매수', qty: '10주', price: '754,000',  date: '3.18' },
  { name: 'SK하이닉스',     type: '매도', qty: '5주',  price: '977,500',  date: '3.17' },
  { name: 'LG에너지솔루션', type: '매수', qty: '3주',  price: '1,146,000',date: '3.16' },
  { name: 'NAVER',          type: '매도', qty: '2주',  price: '420,000',  date: '3.15' },
  { name: '현대차',         type: '매수', qty: '7주',  price: '1,435,000',date: '3.14' },
]

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']
const WEEK_CELLS = [
  { d: 16, trades: null },
  { d: 17, trades: [{ s: '현대차',  buy: true  }] },
  { d: 18, trades: [{ s: '삼성',    buy: true  }, { s: 'NAVER', buy: false }] },
  { d: 19, trades: [{ s: 'LG에너',  buy: true  }] },
  { d: 20, trades: [{ s: 'SK하이',  buy: false }] },
  { d: 21, trades: [{ s: '삼성',    buy: true  }, { s: 'SK',    buy: false }] },
  { d: 22, trades: null },
]

const MONTH_CELLS = [
  null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, null,
]
const TRADE_MAP = {
  3:  [{ s: '삼성', t: true  }, { s: 'SK하이', t: false }],
  7:  [{ s: '현대차', t: true }],
  12: [{ s: 'LG에너', t: true  }, { s: 'NAVER',  t: false }],
  18: [{ s: '삼성',   t: true  }, { s: 'SK',     t: false }],
  25: [{ s: '포스코',  t: false }],
}

export default function TradeHistoryWidget({ variant = 'trade-list', colSpan = 1, rowSpan = 1, onDelete }) {
  /* ── trade-3x2: 캘린더 + 목록 3×2 ── */
  if (variant === 'trade-3x2') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">거래내역</span>
          <span className="text-[9px] text-foreground-disabled">2026년 3월</span>
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
              {MONTH_CELLS.map((d, i) => {
                const trades = d ? TRADE_MAP[d] : null
                return (
                  <div key={i} className="flex flex-col items-start rounded p-0.5">
                    <span className={cn('text-[9px] leading-none mb-px', d ? 'text-foreground' : 'invisible')}>
                      {d ?? '0'}
                    </span>
                    {trades && trades.slice(0, 2).map((tr, j) => (
                      <div key={j} className="flex items-center gap-px w-full">
                        <div className={cn('w-0.5 rounded-full shrink-0 self-stretch', tr.t ? 'bg-up' : 'bg-down')} />
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
              {TRADES.map(({ name, type, qty, price, date }) => (
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
              ))}
            </div>
          </div>
        </div>
      </WidgetCard>
    )
  }

  /* ── trade-wide: 주간 캘린더 2×1 ── */
  if (variant === 'trade-wide') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">거래내역</span>
          <span className="text-[9px] text-foreground-disabled">2026년 3월</span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 shrink-0 mb-1">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="text-center text-[8px] font-semibold text-foreground-disabled">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0">
          {WEEK_CELLS.map(({ d, trades }, i) => (
            <div key={i} className="flex flex-col items-start rounded-lg p-1 bg-background/50">
              <span className="text-[9px] leading-none mb-1 text-foreground">{d}</span>
              {trades && trades.map((tr, j) => (
                <div key={j} className="flex items-center gap-0.5 w-full mb-0.5">
                  <div className={cn('w-0.5 rounded-full shrink-0 self-stretch', tr.buy ? 'bg-up' : 'bg-down')} />
                  <span className="text-[8px] leading-snug truncate text-foreground">{tr.s}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* ── trade-cal: 월간 캘린더 2×2 ── */
  if (variant === 'trade-cal') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">거래내역</span>
          <span className="text-[9px] text-foreground-disabled">2026년 3월</span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 shrink-0 mb-1">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="text-center text-[8px] font-semibold text-foreground-disabled">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0">
          {MONTH_CELLS.map((d, i) => {
            const trades = d ? TRADE_MAP[d] : null
            return (
              <div key={i} className="flex flex-col items-start rounded p-0.5">
                <span className={cn('text-[9px] leading-none mb-px', d ? 'text-foreground' : 'invisible')}>
                  {d ?? '0'}
                </span>
                {trades && trades.slice(0, 2).map((tr, j) => (
                  <div key={j} className="flex items-center gap-px w-full">
                    <div className={cn('w-0.5 rounded-full shrink-0 self-stretch', tr.t ? 'bg-up' : 'bg-down')} />
                    <span className="text-[7px] leading-snug truncate text-foreground">{tr.s}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
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
        {TRADES.map(({ name, type, qty, date }) => (
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
        ))}
      </div>
    </WidgetCard>
  )
}
