import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings2 } from 'lucide-react'
import PriceChange from '@/components/ui/PriceChange'
import StockAvatar from '@/components/ui/StockAvatar'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import useEditModeStore from '@/store/useEditModeStore'
import WidgetCard from './WidgetCard'
import WatchlistEditModal from './WatchlistEditModal'
import { useWatchlist, watchlistApi } from '@/api/watchlist'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import { isForeignMarketType } from '@/features/invest/formatters'
import useWatchlistQuote from '@/features/market/useWatchlistQuote'

const EXCHANGE_CODE_BY_MARKET_TYPE = { NASDAQ: 'NAS', NYSE: 'NYS', AMEX: 'AMS' }

function fmtPrice(n, marketType) {
  if (n == null) return null
  return isForeignMarketType(marketType)
    ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₩${Number(n).toLocaleString('ko-KR')}`
}

function useWatchlistMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['watchlist'] })

  const add = useMutation({
    mutationFn: (stockCode) => watchlistApi.addToWatchlist(stockCode),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (stockCode) => watchlistApi.removeFromWatchlist(stockCode),
    onSuccess: invalidate,
  })

  return { add, remove }
}

function WatchlistWideRow({ item, onStockClick }) {
  const resolvedItem = useWatchlistQuote(item)

  return (
    <div
      onClick={(e) => onStockClick(e, resolvedItem)}
      className="flex items-center justify-between gap-2 cursor-pointer pl-1.5 border-l-2 border-l-transparent hover:border-l-primary transition-colors"
    >
      <div className="flex items-center gap-2 min-w-0">
        <StockAvatar name={resolvedItem.stockName ?? resolvedItem.stockCode} stockCode={resolvedItem.stockCode} marketType={resolvedItem.marketType} size="sm" />
        <span className="text-widget-10 font-medium text-foreground truncate">{resolvedItem.stockName}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {fmtPrice(resolvedItem.currentPrice, resolvedItem.marketType) && (
          <span className="text-widget-10 font-semibold text-foreground tabular-nums">
            {fmtPrice(resolvedItem.currentPrice, resolvedItem.marketType)}
          </span>
        )}
        <PriceChange value={resolvedItem.changeRate} className="text-widget-9 font-medium" />
      </div>
    </div>
  )
}

function WatchlistCompactRow({ item, onStockClick }) {
  const resolvedItem = useWatchlistQuote(item)

  return (
    <div
      onClick={(e) => onStockClick(e, resolvedItem)}
      className="flex items-center justify-between cursor-pointer pl-1.5 border-l-2 border-l-transparent hover:border-l-primary transition-colors"
    >
      <span className="text-widget-10 font-medium text-foreground truncate">{resolvedItem.stockName}</span>
      <PriceChange value={resolvedItem.changeRate} className="text-widget-9 font-semibold shrink-0" />
    </div>
  )
}

export default function WatchlistWidget({ variant = 'watchlist-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const { isAuthenticated, isRestoring } = useAuthStore()
  const { data: items = [], isError } = useWatchlist({ enabled: isAuthenticated && !isRestoring })
  const { add, remove } = useWatchlistMutations()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const { lockWidgetDrag, unlockWidgetDrag } = useEditModeStore()
  const openDetail = useWidgetDetailStore((s) => s.open)

  useEffect(() => {
    if (!isEditOpen) return undefined
    lockWidgetDrag()
    return () => unlockWidgetDrag()
  }, [isEditOpen, lockWidgetDrag, unlockWidgetDrag])

  function handleWidgetClick() {
    openDetail({ widgetTypeId: 'watchlist', config: {} })
  }

  function handleStockClick(e, item) {
    e.stopPropagation()
    const marketType   = item.marketType ?? null
    const exchangeCode = item.exchangeCode ?? EXCHANGE_CODE_BY_MARKET_TYPE[marketType] ?? null
    openDetail({
      widgetTypeId: 'stock-chart',
      config: { stockCode: item.stockCode, stockName: item.stockName, marketType, exchangeCode },
    })
  }

  const list = items

  function handleAdd(stockCode) {
    add.mutate(stockCode)
  }

  function handleRemove(stockCode) {
    remove.mutate(stockCode)
  }

  const editBtn = (
    <button
      aria-label="관심 종목 편집"
      onClick={(e) => { e.stopPropagation(); setIsEditOpen(true) }}
      className="text-foreground-disabled hover:text-foreground transition-colors"
    >
      <Settings2 className="w-3 h-3" />
    </button>
  )

  const editModal = isEditOpen && (
    <WatchlistEditModal
      items={items}
      onAdd={handleAdd}
      onRemove={handleRemove}
      onClose={() => setIsEditOpen(false)}
    />
  )

  if (variant === 'watchlist-wide') {
    return (
      <>
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleWidgetClick}>
          <div className="flex items-center gap-1.5 mb-2 shrink-0">
            <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase shrink-0">관심종목</span>
            {editBtn}
          </div>
          <div className="flex-1 flex flex-col gap-1 min-h-0 overflow-y-auto">
            {isError
              ? <span className="text-widget-10 text-foreground-disabled">불러오기에 실패했습니다</span>
              : list.length > 0 ? list.map((item) => (
              <WatchlistWideRow
                key={item.stockCode}
                item={item}
                onStockClick={handleStockClick}
              />
            )) : (
              <div className="flex-1 flex items-center justify-center text-widget-9 text-foreground-disabled">관심 종목 없음</div>
            )}
          </div>
          {!isRestoring && !isAuthenticated && <LockedOverlay message="관심 종목을 보려면" />}
        </WidgetCard>
        {editModal}
      </>
    )
  }

  /* watchlist-sm (default) */
  return (
    <>
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleWidgetClick}>
        <div className="flex items-center gap-1.5 mb-2 shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase shrink-0">관심종목</span>
          {editBtn}
        </div>
        <div className="flex-1 flex flex-col gap-1 min-h-0 overflow-y-auto">
          {isError
            ? <span className="text-widget-10 text-foreground-disabled">불러오기에 실패했습니다</span>
            : list.length > 0 ? list.map((item) => (
            <WatchlistCompactRow
              key={item.stockCode}
              item={item}
              onStockClick={handleStockClick}
            />
          )) : (
            <div className="flex-1 flex items-center justify-center text-widget-9 text-foreground-disabled">관심 종목 없음</div>
          )}
        </div>
        {!isRestoring && !isAuthenticated && <LockedOverlay message="관심 종목을 보려면" />}
      </WidgetCard>
      {editModal}
    </>
  )
}
