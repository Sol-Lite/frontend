import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { X, Search, Heart } from 'lucide-react'
import { marketApi } from '@/api/market'

export default function WatchlistEditModal({ items, onAdd, onRemove, onClose }) {
  const [localItems, setLocalItems] = useState(() =>
    items.map((i) => ({ stockCode: i.stockCode, stockName: i.stockName, isWatched: true }))
  )
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 300)
    return () => clearTimeout(timer)
  }, [keyword])

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['stock', 'search', debouncedKeyword],
    queryFn: () => marketApi.searchStocks(debouncedKeyword),
    enabled: debouncedKeyword.trim().length >= 1,
    staleTime: 30_000,
  })

  function toggleTopItem(stockCode) {
    const item = localItems.find((i) => i.stockCode === stockCode)
    if (!item) return
    if (item.isWatched) {
      onRemove(stockCode)
      setLocalItems((prev) => prev.map((i) => i.stockCode === stockCode ? { ...i, isWatched: false } : i))
    } else {
      onAdd(stockCode)
      setLocalItems((prev) => prev.map((i) => i.stockCode === stockCode ? { ...i, isWatched: true } : i))
    }
  }

  function toggleSearchResult(stock) {
    const existing = localItems.find((i) => i.stockCode === stock.stockCode)
    if (existing) {
      toggleTopItem(stock.stockCode)
    } else {
      onAdd(stock.stockCode)
      setLocalItems((prev) => [...prev, { stockCode: stock.stockCode, stockName: stock.stockName, isWatched: true }])
    }
  }

  const localSet = new Map(localItems.map((i) => [i.stockCode, i.isWatched]))

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-modal w-[320px] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-widget-13 font-bold text-foreground">관심 종목 편집</span>
          <button
            aria-label="닫기"
            onClick={onClose}
            className="text-foreground-disabled hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 상단: 관심종목 목록 (로컬 state 기준) */}
        {localItems.length > 0 && (
          <div className="flex flex-col gap-0.5 max-h-[180px] overflow-y-auto mb-3">
            {localItems.map(({ stockCode, stockName, isWatched }) => (
              <div key={stockCode} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-surface-subtle">
                <span className={`text-widget-12 font-semibold ${isWatched ? 'text-foreground' : 'text-foreground-disabled'}`}>
                  {stockName}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-widget-10 text-foreground-disabled">{stockCode}</span>
                  <button
                    aria-label={isWatched ? '관심종목 해제' : '관심종목 추가'}
                    onClick={() => toggleTopItem(stockCode)}
                    className={`transition-colors ${isWatched ? 'text-primary hover:text-primary/60' : 'text-stroke-input hover:text-primary'}`}
                  >
                    <Heart className="w-3.5 h-3.5" fill={isWatched ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {localItems.length > 0 && <div className="h-px bg-stroke-subtle mb-3" />}

        {/* 검색 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-disabled" />
          <input
            autoFocus
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="종목명 또는 코드 검색"
            className="w-full pl-8 pr-3 py-2 text-widget-12 bg-background border border-stroke rounded-xl outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto">
          {isFetching && (
            <div className="text-widget-11 text-foreground-disabled text-center py-4">검색 중...</div>
          )}
          {!isFetching && debouncedKeyword.trim().length >= 1 && results.length === 0 && (
            <div className="text-widget-11 text-foreground-disabled text-center py-4">검색 결과 없음</div>
          )}
          {results.map((stock) => {
            const isWatched = localSet.get(stock.stockCode) ?? false
            return (
              <div key={stock.stockCode} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-surface-subtle">
                <span className="text-widget-12 font-semibold text-foreground">{stock.stockName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-widget-10 text-foreground-disabled">{stock.stockCode}</span>
                  <button
                    aria-label={isWatched ? '관심종목 해제' : '관심종목 추가'}
                    onClick={() => toggleSearchResult(stock)}
                    className={`transition-colors ${isWatched ? 'text-primary hover:text-primary/60' : 'text-stroke-input hover:text-primary'}`}
                  >
                    <Heart className="w-3.5 h-3.5" fill={isWatched ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}
