import { useState } from 'react'
import FilterChip from '@/components/ui/FilterChip'
import PriceChange from '@/components/ui/PriceChange'
import StockRow, {
  getMarketRowGrid,
  hasPrimaryMetricColumn,
} from '@/components/market/StockRow'
import LiveDot from '@/components/ui/LiveDot'
import useMarketRanking from '@/features/market/useMarketRanking'
import useMarketIndices from '@/features/market/useMarketIndices'
import { MARKET_FILTERS, SORT_FILTERS } from '@/mocks/market'
import { useWatchlistSet } from '@/api/watchlist'

const VOLUME_COL_LABEL = {
  volume_value: '거래대금 순',
  volume:       '거래량 순',
  market_cap:   '시가총액 순',
}

const SECONDARY_COL_LABEL = {
  volume_value: '전일 거래대금',
  volume: '전일 거래량',
  rising: '거래 비율',
  falling: '거래 비율',
  market_cap: '시장점유율',
}

function MarketIndexBar() {
  const { indices } = useMarketIndices()

  return (
    <div className="flex items-center border-b border-stroke shrink-0 bg-surface">
      {indices.map((idx) => {
        return (
          <div
            key={idx.code}
            className="flex-1 flex items-center gap-2.5 px-4 py-2.5 border-r border-stroke-subtle last:border-r-0"
          >
            <div>
              <div className="text-[10px] font-semibold text-foreground-disabled mb-0.5">{idx.name}</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[16px] font-extrabold text-foreground">
                  {idx.price != null
                    ? Number(idx.price).toLocaleString('ko-KR', { maximumFractionDigits: 2 })
                    : '—'}
                </span>
                {idx.changeRate != null && <PriceChange value={idx.changeRate} className="text-[11px]" />}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FilterBar({ marketFilter, setMarketFilter, sortFilter, setSortFilter }) {
  return (
    <div className="flex items-center gap-3 px-4 py-1.5 border-b border-stroke shrink-0 bg-surface">
      {MARKET_FILTERS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setMarketFilter(key)}
          className={`text-[12px] font-semibold pb-1 border-b-2 transition-colors ${
            marketFilter === key
              ? 'text-foreground border-primary'
              : 'text-foreground-disabled border-transparent hover:text-foreground'
          }`}
        >
          {label}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-1.5">
        {SORT_FILTERS.map(({ key, label }) => (
          <FilterChip key={key} isActive={sortFilter === key} onClick={() => setSortFilter(key)}>
            {label}
          </FilterChip>
        ))}
      </div>
    </div>
  )
}

function StockTableHeader({ sortFilter }) {
  const showVolume = hasPrimaryMetricColumn(sortFilter)
  const grid = getMarketRowGrid(sortFilter)

  return (
    <div className={`grid ${grid} items-center px-4 py-2.5 border-b border-stroke-subtle text-[10px] font-semibold text-foreground-disabled`}>
      <div />
      <div>순위</div>
      <div>종목명</div>
      <div className="text-right">현재가</div>
      <div className="text-right">등락률</div>
      {showVolume && <div className="text-right">{VOLUME_COL_LABEL[sortFilter]}</div>}
      <div className="text-right">{SECONDARY_COL_LABEL[sortFilter]}</div>
    </div>
  )
}

export default function MarketPage() {
  return <MarketContent />
}

export function MarketContent({ initialSortFilter, onStockClick, isModalMode = false }) {
  const [marketFilter, setMarketFilter] = useState('kr')
  const [sortFilter, setSortFilter]     = useState(initialSortFilter ?? 'volume_value')
  const { watchedSet, toggle }          = useWatchlistSet()

  const { stocks, isLoading, errorMessage } = useMarketRanking(sortFilter, marketFilter)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface">
      <MarketIndexBar />
      <FilterBar
        marketFilter={marketFilter} setMarketFilter={setMarketFilter}
        sortFilter={sortFilter}     setSortFilter={setSortFilter}
      />
      <div className="flex-1 overflow-y-auto">
        <StockTableHeader sortFilter={sortFilter} />
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-[12px] text-foreground-disabled">
            불러오는 중...
          </div>
        )}
        {!isLoading && errorMessage && (
          <div className="flex items-center justify-center py-16 text-[12px] text-foreground-disabled">
            {errorMessage}
          </div>
        )}
        {!isLoading && !errorMessage && stocks.map((stock) => (
          <StockRow
            key={stock.id}
            stock={stock}
            sortFilter={sortFilter}
            isWatched={watchedSet.has(stock.stockCode)}
            onWatchToggle={toggle}
            isModalMode={isModalMode}
            onStockClick={onStockClick}
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
