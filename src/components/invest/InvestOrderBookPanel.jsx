import PriceChange from '@/components/ui/PriceChange'
import { formatNumber } from '@/features/invest/formatters'
import { ORDER_BOOK } from '@/mocks/invest'
import { cn } from '@/lib/cn'

export default function InvestOrderBookPanel({
  selectedPrice,
  currentPrice,
  changeRate,
  onSelectPrice,
}) {
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
