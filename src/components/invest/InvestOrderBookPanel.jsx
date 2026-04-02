import PriceChange from '@/components/ui/PriceChange'
import { formatNumber, formatVisiblePrice } from '@/features/invest/formatters'
import { cn } from '@/lib/cn'

export default function InvestOrderBookPanel({
  selectedPrice,
  currentPrice,
  changeRate,
  orderBook,
  isLoading = false,
  errorMessage = '',
  onSelectPrice,
  marketType,
  displayCurrency,
  usdRate,
}) {
  const isUp = changeRate > 0
  const isDown = changeRate < 0

  if (isLoading && !orderBook) {
    return (
      <section className="flex w-[170px] shrink-0 flex-col overflow-hidden border-r border-stroke bg-surface">
        <div className="flex items-center justify-between border-b border-stroke px-2.5 py-2 shrink-0">
          <span className="text-[11px] font-bold text-foreground">호가창</span>
        </div>
        <div className="flex flex-1 items-center justify-center px-3 py-4">
          <span className="text-[10px] text-foreground-disabled">호가 정보를 불러오는 중입니다.</span>
        </div>
      </section>
    )
  }

  if (!orderBook) {
    return (
      <section className="flex w-[170px] shrink-0 flex-col overflow-hidden border-r border-stroke bg-surface">
        <div className="flex items-center justify-between border-b border-stroke px-2.5 py-2 shrink-0">
          <span className="text-[11px] font-bold text-foreground">호가창</span>
        </div>
        <div className="flex flex-1 items-center justify-center px-3 py-4">
          <span className="text-[10px] text-center text-danger">
            {errorMessage || '호가 정보를 불러오지 못했습니다.'}
          </span>
        </div>
      </section>
    )
  }

  return (
    <section className="flex w-[170px] shrink-0 flex-col overflow-hidden border-r border-stroke bg-surface">
      <div className="flex items-center justify-between border-b border-stroke px-2.5 py-2 shrink-0">
        <span className="text-[11px] font-bold text-foreground">호가창</span>
        <span className="text-[9px] text-foreground-disabled">잔량</span>
      </div>

      <div className="flex items-center justify-between bg-down-bg px-2 py-1 shrink-0">
        <span className="text-[9px] font-semibold text-down">매도잔량</span>
        <span className="text-[10px] font-bold text-down">{formatNumber(orderBook.askTotal)}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {orderBook.asks.map((row) => (
          <button
            key={`ask-${row.price}`}
            onClick={() => onSelectPrice(row.price)}
            className={cn(
              'relative flex w-full items-center justify-between px-2 py-[3px] text-left transition-colors hover:bg-down-bg/40',
              selectedPrice === row.price && 'bg-down-bg/70',
            )}
          >
            <div className="absolute inset-y-0 right-0 bg-down/10" style={{ width: `${row.depth}%` }} />
            <span className="relative text-xs font-bold text-down">{formatVisiblePrice(row.price, { marketType, displayCurrency, usdRate })}</span>
            <span className="relative text-[10px] text-foreground-tertiary">{formatNumber(row.quantity)}</span>
          </button>
        ))}

        <div
          className={cn(
            'flex items-center justify-between border-y-2 px-2 py-1.5',
            isUp && 'border-up-border bg-up-bg',
            isDown && 'border-down-border bg-down-bg',
            !isUp && !isDown && 'border-stroke bg-surface-muted',
          )}
        >
          <span
            className={cn(
              'text-[15px] font-black',
              isUp && 'text-up',
              isDown && 'text-down',
              !isUp && !isDown && 'text-foreground',
            )}
          >
            {formatVisiblePrice(currentPrice, { marketType, displayCurrency, usdRate })}
          </span>
          {changeRate != null && !Number.isNaN(changeRate) && (
            <PriceChange value={changeRate} variant="badge" />
          )}
        </div>

        {orderBook.bids.map((row) => (
          <button
            key={`bid-${row.price}`}
            onClick={() => onSelectPrice(row.price)}
            className={cn(
              'relative flex w-full items-center justify-between px-2 py-[3px] text-left transition-colors hover:bg-up-bg/40',
              selectedPrice === row.price && 'bg-up-bg/70',
            )}
          >
            <div className="absolute inset-y-0 right-0 bg-up/10" style={{ width: `${row.depth}%` }} />
            <span className="relative text-xs font-bold text-up">{formatVisiblePrice(row.price, { marketType, displayCurrency, usdRate })}</span>
            <span className="relative text-[10px] text-foreground-tertiary">{formatNumber(row.quantity)}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-stroke bg-up-bg px-2 py-1 shrink-0">
        <span className="text-[9px] font-semibold text-up">매수잔량</span>
        <span className="text-[10px] font-bold text-up">{formatNumber(orderBook.bidTotal)}</span>
      </div>
    </section>
  )
}
