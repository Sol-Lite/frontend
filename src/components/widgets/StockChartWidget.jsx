import { useState } from 'react'
import StockAvatar from '@/components/ui/StockAvatar'
import PriceChange from '@/components/ui/PriceChange'
import WidgetCard from './WidgetCard'
import { HOME_STOCKS } from '@/mocks/home'

const PERIODS = ['1일', '1주', '1달', '3달']

export default function StockChartWidget({ variant = 'stock-sm', colSpan = 1, rowSpan = 1, onDelete, config = {} }) {
  const [activePeriod, setActivePeriod] = useState('1일')
  const stockId = config.stockId ?? 'samsung'
  const stock = HOME_STOCKS.find((s) => s.id === stockId) ?? HOME_STOCKS[0]
  const isUp = stock.change > 0

  if (variant === 'stock-wide') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex h-full gap-2.5 min-h-0">
          <div className="flex flex-col justify-between shrink-0">
            <div>
              <div className="text-[11px] font-bold text-foreground leading-none">{stock.name}</div>
              <div className="text-[9px] text-foreground-disabled">{stock.code} · KOSPI</div>
            </div>
            <div>
              <div className={`text-[18px] font-bold leading-tight ${isUp ? 'text-up' : 'text-down'}`}>{stock.price}</div>
              <div className={`text-[10px] ${isUp ? 'text-up' : 'text-down'}`}>
                {isUp ? '▲' : '▼'} {stock.changeAmt}원 ({isUp ? '+' : ''}{stock.change}%)
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex items-end gap-px pb-1 pt-2">
            {[35,48,42,55,48,62,55,70,60,78,68,88].map((h, i) => (
              <div key={i} className={`flex-1 rounded-sm ${isUp ? 'bg-up/50' : 'bg-down/50'}`} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </WidgetCard>
    )
  }

  if (variant === 'stock-3x2') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-start justify-between mb-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <StockAvatar name={stock.label} color={stock.color} size="sm" />
            <div>
              <div className="text-[13px] font-bold text-foreground">{stock.name}</div>
              <div className="text-[9px] text-foreground-disabled">{stock.code} · KOSPI · 반도체</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-[20px] font-bold leading-tight ${isUp ? 'text-up' : 'text-down'}`}>{stock.price}</div>
            <PriceChange value={stock.change} className="text-[10px]" />
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0 mb-1.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={(e) => { e.stopPropagation(); setActivePeriod(p) }}
              className={`text-[9px] px-1.5 py-0.5 rounded font-medium transition-colors duration-[150ms] ${activePeriod === p ? 'bg-primary-light text-primary' : 'text-foreground-disabled hover:text-foreground'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 bg-background rounded-xl flex items-end px-2 pb-2 pt-2 gap-px">
          {[28,35,32,44,48,54,58,65,70,76,82,88,92,96].map((h, i) => (
            <div key={i} className={`flex-1 rounded-sm ${isUp ? 'bg-up/50' : 'bg-down/50'}`} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between shrink-0 mt-1.5">
          {[
            { label: '시가',  val: stock.open },
            { label: '고가',  val: stock.high },
            { label: '저가',  val: stock.low  },
            { label: '거래량', val: '12.4M'   },
            { label: '시총',  val: '450조'    },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <div className="text-[8px] text-foreground-disabled">{label}</div>
              <div className="text-[10px] font-semibold text-foreground">{val}</div>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  if (variant === 'stock-2x2') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-start justify-between mb-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <StockAvatar name={stock.label} color={stock.color} size="sm" />
            <div>
              <div className="text-[13px] font-bold text-foreground">{stock.name}</div>
              <div className="text-[9px] text-foreground-disabled">{stock.code}</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-[18px] font-bold leading-tight ${isUp ? 'text-up' : 'text-down'}`}>{stock.price}</div>
            <PriceChange value={stock.change} className="text-[10px]" />
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-background rounded-xl flex items-end px-2 pb-2 pt-2 gap-px my-1.5">
          {[38, 52, 44, 58, 48, 62, 50, 68, 56, 72, 60, 78, 65, 82, 70, 88, 75, 90, 78, 85].map((h, i) => (
            <div key={i} className={`flex-1 rounded-sm ${isUp ? 'bg-up/50' : 'bg-down/50'}`} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between shrink-0">
          {[
            { label: '시가', val: stock.open },
            { label: '고가', val: stock.high },
            { label: '저가', val: stock.low },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <div className="text-[9px] text-foreground-disabled">{label}</div>
              <div className="text-[11px] font-semibold text-foreground">{val}</div>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* stock-sm (default) */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <div className="flex items-center justify-between mb-1 shrink-0">
        <span className="text-[12px] font-bold text-foreground leading-none">{stock.name}</span>
        <span className="text-[9px] text-foreground-disabled">{stock.code}</span>
      </div>
      <div className="flex-1 flex flex-col justify-center min-h-0">
        <div className={`text-[18px] font-bold leading-tight tracking-tight ${isUp ? 'text-up' : 'text-down'}`}>
          {stock.price}
        </div>
        <div className={`text-[10px] mt-0.5 ${isUp ? 'text-up' : 'text-down'}`}>
          {isUp ? '▲' : '▼'} {stock.changeAmt}원 ({isUp ? '+' : ''}{stock.change}%)
        </div>
      </div>
    </WidgetCard>
  )
}
