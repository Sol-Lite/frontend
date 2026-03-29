import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Search } from 'lucide-react'
import { marketApi } from '@/api/market'

export default function StockSelectModal({ currentCode, currentName, onSave, onClose }) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-xl w-[320px] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-widget-13 font-bold text-foreground">종목 선택</span>
          <button onClick={onClose} className="text-foreground-disabled hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

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

        <div className="flex flex-col gap-0.5 max-h-[240px] overflow-y-auto">
          {keyword.trim().length === 0 && currentCode && (
            <div className="px-3 py-2.5 rounded-xl bg-primary-light border border-primary-border">
              <div className="flex items-center justify-between">
                <span className="text-widget-12 font-semibold text-primary">{currentName ?? currentCode}</span>
                <span className="text-widget-10 text-primary/70">{currentCode}</span>
              </div>
              <div className="text-widget-9 text-primary/60 mt-0.5">현재 선택</div>
            </div>
          )}

          {isFetching && (
            <div className="text-widget-11 text-foreground-disabled text-center py-4">검색 중...</div>
          )}

          {!isFetching && debouncedKeyword.trim().length >= 1 && results.length === 0 && (
            <div className="text-widget-11 text-foreground-disabled text-center py-4">검색 결과 없음</div>
          )}

          {results.map((stock) => (
            <button
              key={stock.stockCode}
              onClick={() => onSave({ stockCode: stock.stockCode, stockName: stock.stockName, marketType: stock.marketType, exchangeCode: stock.exchangeCode })}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-subtle transition-colors text-left"
            >
              <span className="text-widget-12 font-semibold text-foreground">{stock.stockName}</span>
              <span className="text-widget-10 text-foreground-disabled">{stock.stockCode}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
