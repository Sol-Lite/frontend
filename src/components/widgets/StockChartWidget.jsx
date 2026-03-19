import { useId } from 'react'
import StockAvatar from '@/components/ui/StockAvatar'
import PriceChange from '@/components/ui/PriceChange'
import WidgetCard from './WidgetCard'
import { HOME_STOCKS } from '@/mocks/home'

export default function StockChartWidget({ variant = 'stock-sm', colSpan = 1, rowSpan = 1, onDelete, config = {} }) {
  const uid = useId()
  const stockId = config.stockId ?? 'samsung'
  const stock = HOME_STOCKS.find((s) => s.id === stockId) ?? HOME_STOCKS[0]
  const isUp = stock.change > 0
  const strokeColor = isUp ? 'var(--color-up)' : 'var(--color-down)'
  const fillId = `spark-fill-${uid}`

  if (variant === 'stock-tall') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-1 shrink-0">
          <div className="flex items-center gap-1.5">
            <StockAvatar name={stock.label} color={stock.color} size="sm" />
            <div className="text-[12px] font-bold text-foreground">{stock.name}</div>
          </div>
          <PriceChange value={stock.change} variant="badge" />
        </div>
        <div className="flex-1 min-h-0 bg-background rounded-xl flex items-end px-2 pb-2 pt-2 gap-px my-1">
          {[42, 58, 50, 72, 60, 68, 55, 80, 70, 85, 75, 90].map((h, i) => (
            <div key={i} className={`flex-1 rounded-sm ${isUp ? 'bg-up/50' : 'bg-down/50'}`} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="shrink-0">
          <div className={`text-[18px] font-bold leading-tight ${isUp ? 'text-up' : 'text-down'}`}>{stock.price}</div>
          <div className={`text-[10px] ${isUp ? 'text-up' : 'text-down'}`}>
            {isUp ? '▲' : '▼'} {stock.changeAmt}원 ({isUp ? '+' : ''}{stock.change}%)
          </div>
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
      <div className="flex items-center gap-2 mb-1">
        <StockAvatar name={stock.label} color={stock.color} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold leading-none truncate text-foreground">{stock.name}</div>
          <div className="text-[9px] text-foreground-disabled mt-0.5">{stock.code}</div>
        </div>
        <PriceChange value={stock.change} variant="badge" />
      </div>
      <div className="my-1">
        <div className={`text-[18px] font-bold leading-tight tracking-tight ${isUp ? 'text-up' : 'text-down'}`}>
          {stock.price}
        </div>
        <div className={`text-[10px] ${isUp ? 'text-up' : 'text-down'}`}>
          {isUp ? '▲' : '▼'} {stock.changeAmt}원 ({isUp ? '+' : ''}{stock.change}%)
        </div>
      </div>
      <div className="flex justify-between text-[9px] py-1.5 border-t border-stroke-subtle mb-1">
        <div className="text-center">
          <div className="text-foreground-disabled">시가</div>
          <div className="font-medium text-foreground-secondary">{stock.open}</div>
        </div>
        <div className="text-center">
          <div className="text-foreground-disabled">고가</div>
          <div className="font-medium text-up">{stock.high}</div>
        </div>
        <div className="text-center">
          <div className="text-foreground-disabled">저가</div>
          <div className="font-medium text-down">{stock.low}</div>
        </div>
      </div>
      <svg className="w-full" height="22" viewBox="0 0 120 22" preserveAspectRatio="none">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity=".15" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={stock.sparkPath} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={stock.fillPath} fill={`url(#${fillId})`} />
      </svg>
    </WidgetCard>
  )
}
