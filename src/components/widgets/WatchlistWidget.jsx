import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import PriceChange from '@/components/ui/PriceChange'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import WidgetCard from './WidgetCard'
import StockSelectModal from './StockSelectModal'
import { useWatchlist, watchlistApi } from '@/api/watchlist'

function fmtPrice(n) {
  return `₩${Number(n ?? 0).toLocaleString('ko-KR')}`
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

export default function WatchlistWidget({ variant = 'watchlist-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const { isAuthenticated, isRestoring } = useAuthStore()
  const { data: items = [] } = useWatchlist({ enabled: isAuthenticated && !isRestoring })
  const { add, remove } = useWatchlistMutations()
  const [isAddOpen, setIsAddOpen] = useState(false)

  const list = items.slice(0, 5)

  function handleAdd({ stockCode }) {
    add.mutate(stockCode, { onSuccess: () => setIsAddOpen(false) })
  }

  function handleRemove(e, stockCode) {
    e.stopPropagation()
    remove.mutate(stockCode)
  }

  const addModal = isAddOpen && (
    <StockSelectModal
      onSave={handleAdd}
      onClose={() => setIsAddOpen(false)}
    />
  )

  const addBtn = (
    <button
      onClick={(e) => { e.stopPropagation(); setIsAddOpen(true) }}
      className="text-[10px] text-primary font-semibold hover:underline"
    >
      + 추가
    </button>
  )

  if (variant === 'watchlist-wide') {
    return (
      <>
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">관심 종목</span>
            {addBtn}
          </div>
          <div className="flex-1 flex flex-col gap-1.5 min-h-0">
            {list.length > 0 ? list.map(({ stockCode, stockName, currentPrice, changeRate }) => (
              <div key={stockCode} className="flex items-center justify-between gap-2 group">
                <span className="text-[10px] font-medium text-foreground truncate">{stockName}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-semibold text-foreground">{fmtPrice(currentPrice)}</span>
                  <PriceChange value={changeRate} className="text-[9px] font-medium" />
                  <button
                    onClick={(e) => handleRemove(e, stockCode)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-foreground-disabled hover:text-down"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="flex-1 flex items-center justify-center text-[9px] text-foreground-disabled">관심 종목 없음</div>
            )}
          </div>
          {!isRestoring && !isAuthenticated && <LockedOverlay message="관심 종목을 보려면" />}
        </WidgetCard>
        {addModal}
      </>
    )
  }

  /* watchlist-sm (default) */
  return (
    <>
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">관심 종목</span>
          {addBtn}
        </div>
        <div className="flex-1 flex flex-col gap-1.5 min-h-0">
          {list.length > 0 ? list.map(({ stockCode, stockName, changeRate }) => (
            <div key={stockCode} className="flex items-center justify-between group">
              <span className="text-[10px] font-medium text-foreground truncate">{stockName}</span>
              <div className="flex items-center gap-1 shrink-0">
                <PriceChange value={changeRate} className="text-[9px] font-semibold" />
                <button
                  onClick={(e) => handleRemove(e, stockCode)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-foreground-disabled hover:text-down"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )) : (
            <div className="flex-1 flex items-center justify-center text-[9px] text-foreground-disabled">관심 종목 없음</div>
          )}
        </div>
        {!isRestoring && !isAuthenticated && <LockedOverlay message="관심 종목을 보려면" />}
      </WidgetCard>
      {addModal}
    </>
  )
}
