import { useState } from 'react'
import { Search } from 'lucide-react'
import FilterChip from '@/components/ui/FilterChip'
import PriceChange from '@/components/ui/PriceChange'
import StockRow from '@/components/market/StockRow'
import LiveDot from '@/components/ui/LiveDot'
import { MARKET_INDICES, MARKET_FILTERS, SORT_FILTERS, STOCKS } from '@/mocks/market'

function MarketIndexBar() {
  return (
    <div className="flex items-center border-b border-stroke shrink-0 overflow-x-auto bg-surface">
      {MARKET_INDICES.map((idx, i) => {
        const isUp = idx.change > 0
        return (
          <div
            key={idx.key}
            className={`flex items-center gap-2.5 px-4 py-2.5 shrink-0 ${i < MARKET_INDICES.length - 1 ? 'border-r border-stroke-subtle' : ''}`}
          >
            <div>
              <div className="text-[10px] font-semibold text-foreground-disabled mb-0.5">{idx.label}</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[16px] font-extrabold text-foreground">{idx.value}</span>
                <PriceChange value={idx.change} className="text-[11px]" />
              </div>
            </div>
            <svg width="56" height="28" viewBox="0 0 56 28" fill="none">
              <path d={idx.path} stroke={isUp ? 'var(--color-up)' : 'var(--color-down)'} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        )
      })}
    </div>
  )
}

function FilterBar({ marketFilter, setMarketFilter, sortFilter, setSortFilter, search, setSearch }) {
  return (
    <div className="flex items-center gap-2 px-5 py-2 border-b border-stroke shrink-0 bg-surface overflow-x-auto">
      <div className="flex gap-1 shrink-0">
        {MARKET_FILTERS.map(({ key, label }) => (
          <FilterChip key={key} isActive={marketFilter === key} onClick={() => setMarketFilter(key)}>{label}</FilterChip>
        ))}
      </div>

      <div className="w-px h-4 bg-stroke-input shrink-0" />

      <div className="flex gap-1 shrink-0">
        {SORT_FILTERS.map(({ key, label }) => (
          <FilterChip key={key} isActive={sortFilter === key} onClick={() => setSortFilter(key)}>{label}</FilterChip>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1.5 bg-background border border-stroke-input rounded-[10px] px-3 py-1.5 shrink-0">
        <Search className="w-3 h-3 text-foreground-disabled" />
        <input
          aria-label="종목 검색"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="종목 검색"
          className="w-[90px] bg-transparent text-[11px] text-foreground-secondary outline-none placeholder:text-foreground-disabled"
        />
      </div>
    </div>
  )
}

function StockTableHeader() {
  return (
    <div className="grid grid-cols-[32px_36px_1fr_100px_80px_90px_120px] items-center px-4 py-1.5 bg-surface-subtle border-b-2 border-stroke text-[10px] font-semibold text-foreground-disabled">
      <div />
      <div>순위</div>
      <div>종목명</div>
      <div className="text-right">현재가</div>
      <div className="text-right">등락률</div>
      <div className="text-right">거래대금</div>
      <div className="text-right">매수 비율</div>
    </div>
  )
}

export default function MarketPage() {
  const [marketFilter, setMarketFilter] = useState('all')
  const [sortFilter, setSortFilter]     = useState('volume_value')
  const [search, setSearch]             = useState('')
  const [watched, setWatched]           = useState(new Set())

  const toggleWatch = (id) =>
    setWatched((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const filtered = STOCKS
    .filter((s) => marketFilter === 'all' || s.market === marketFilter)
    .filter((s) => s.name.includes(search) || s.label.includes(search))
  // TODO: sortFilter 기반 정렬은 API 연동 시 구현

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface">
      <MarketIndexBar />
      <FilterBar
        marketFilter={marketFilter} setMarketFilter={setMarketFilter}
        sortFilter={sortFilter}     setSortFilter={setSortFilter}
        search={search}             setSearch={setSearch}
      />
      <div className="flex-1 overflow-y-auto">
        <StockTableHeader />
        {filtered.map((stock) => (
          <StockRow
            key={stock.id}
            stock={stock}
            isWatched={watched.has(stock.id)}
            onWatchToggle={toggleWatch}
          />
        ))}
      </div>
      <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 border-t border-stroke bg-surface">
        <LiveDot size="sm" />
        <span className="text-[10px] text-foreground-disabled">실시간 · 장중 기준</span>
      </div>
    </div>
  )
}
