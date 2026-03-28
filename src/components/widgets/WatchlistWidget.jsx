import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings2 } from 'lucide-react'
import PriceChange from '@/components/ui/PriceChange'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import WidgetCard from './WidgetCard'
import WatchlistEditModal from './WatchlistEditModal'
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
  const { data: items = [], isError } = useWatchlist({ enabled: isAuthenticated && !isRestoring })
  const { add, remove } = useWatchlistMutations()
  const [isEditOpen, setIsEditOpen] = useState(false)

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
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">관심 종목</span>
            {editBtn}
          </div>
          <div className="flex-1 flex flex-col gap-1 min-h-0 overflow-y-auto">
            {isError
              ? <span className="text-widget-10 text-foreground-disabled">불러오기에 실패했습니다</span>
              : list.length > 0 ? list.map(({ stockCode, stockName, currentPrice, changeRate }) => (
              <div key={stockCode} className="flex items-center justify-between gap-2 shrink-0">
                <span className="text-widget-10 font-medium text-foreground truncate">{stockName}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-widget-10 font-semibold text-foreground">{fmtPrice(currentPrice)}</span>
                  <PriceChange value={changeRate} className="text-widget-9 font-medium" />
                </div>
              </div>
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
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">관심 종목</span>
          {editBtn}
        </div>
        <div className="flex-1 flex flex-col gap-1 min-h-0 overflow-y-auto">
          {isError
            ? <span className="text-widget-10 text-foreground-disabled">불러오기에 실패했습니다</span>
            : list.length > 0 ? list.map(({ stockCode, stockName, changeRate }) => (
            <div key={stockCode} className="flex items-center justify-between shrink-0">
              <span className="text-widget-10 font-medium text-foreground truncate">{stockName}</span>
              <PriceChange value={changeRate} className="text-widget-9 font-semibold shrink-0" />
            </div>
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
