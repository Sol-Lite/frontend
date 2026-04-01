import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { marketApi } from '@/api/market'
import { getStockLogoUrl } from '@/lib/stockLogo'
import { cn } from '@/lib/cn'

export default function InvestStockSearch({ stockMeta }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!keyword.trim()) {
      setResults([])
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await marketApi.searchStocks(keyword.trim())
        setResults(data ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [keyword])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setOpen(false)
    setKeyword('')
    setResults([])
    setLoading(false)
  }, [stockMeta.code])

  function handleSelect(stock) {
    setOpen(false)
    setKeyword('')
    navigate(`/invest/${stock.stockCode}`, {
      state: {
        stockName: stock.stockName,
        stockNameEn: stock.stockNameEn,
        marketType: stock.marketType,
        exchangeCode: stock.exchangeCode,
      },
    })
  }

  function handleOpen() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-full items-center gap-2 rounded-[10px] border border-stroke-input bg-background px-3 py-2 text-left transition-colors hover:border-primary"
      >
        <Search className="h-[13px] w-[13px] shrink-0 text-foreground-disabled" />
        <span className="text-[13px] font-medium text-foreground-disabled">종목 검색</span>
      </button>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-[10px] border border-primary bg-background px-3 py-2">
        <Search className="h-[13px] w-[13px] shrink-0 text-primary" />
        <input
          ref={inputRef}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="종목명 또는 종목코드 검색"
          className="min-w-0 flex-1 bg-transparent text-[13px] font-bold text-foreground outline-none placeholder:font-normal placeholder:text-foreground-disabled"
        />
        {keyword && (
          <button type="button" onClick={() => setKeyword('')} className="text-foreground-disabled hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {(results.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[280px] overflow-y-auto rounded-lg border border-stroke bg-surface shadow-lg">
          {loading && results.length === 0 && (
            <div className="px-3 py-4 text-center text-[11px] text-foreground-disabled">검색 중...</div>
          )}
          {results.map((stock) => (
            <button
              key={`${stock.marketType}-${stock.stockCode}`}
              type="button"
              onClick={() => handleSelect(stock)}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-background',
                stock.stockCode === stockMeta.code && 'bg-primary-light',
              )}
            >
              <img
                src={getStockLogoUrl(stock.marketType, stock.stockCode)}
                alt={stock.stockName}
                className="h-6 w-6 shrink-0 rounded-full bg-background object-contain"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold text-foreground">{stock.stockName}</div>
                <div className="text-[10px] text-foreground-disabled">
                  {stock.stockCode}
                  {stock.exchangeCode && ` · ${stock.exchangeCode}`}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {keyword && !loading && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-stroke bg-surface px-3 py-4 text-center text-[11px] text-foreground-disabled shadow-lg">
          검색 결과가 없습니다
        </div>
      )}
    </div>
  )
}
