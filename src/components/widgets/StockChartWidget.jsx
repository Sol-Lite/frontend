import StockAvatar from '@/components/ui/StockAvatar'
import PriceChange from '@/components/ui/PriceChange'
import WidgetCard from './WidgetCard'

export default function StockChartWidget({ stock }) {
  const isUp = stock.change > 0
  const strokeColor = isUp ? 'var(--color-up)' : 'var(--color-down)'
  const fillId = `spark-fill-${stock.id}`

  return (
    <WidgetCard>
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
