import { useState } from 'react'
import FilterChip from '@/components/ui/FilterChip'
import PriceChange from '@/components/ui/PriceChange'
import StockRow from '@/components/market/StockRow'
import LiveDot from '@/components/ui/LiveDot'
import useMarketRanking from '@/features/market/useMarketRanking'
import useMarketIndices from '@/features/market/useMarketIndices'
import { MARKET_FILTERS, SORT_FILTERS } from '@/mocks/market'

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
    <div className="flex items-center gap-2 px-4 py-2 border-b border-stroke shrink-0 bg-surface">
      <div className="flex gap-1 shrink-0">
        {MARKET_FILTERS.map(({ key, label }) => (
          <FilterChip key={key} isActive={marketFilter === key} onClick={() => setMarketFilter(key)}>
            {label}
          </FilterChip>
        ))}
      </div>
      <div className="w-px h-4 bg-stroke-input shrink-0" />
      <div className="flex gap-1 shrink-0">
        {SORT_FILTERS.map(({ key, label }) => (
          <FilterChip key={key} isActive={sortFilter === key} onClick={() => setSortFilter(key)}>
            {label}
          </FilterChip>
        ))}
      </div>
    </div>
  )
}

const GRID_WITH_VOL    = 'grid-cols-[32px_36px_1fr_110px_80px_88px_120px]'
const GRID_WITHOUT_VOL = 'grid-cols-[32px_36px_1fr_110px_80px_120px]'

function StockTableHeader({ sortFilter }) {
  const showVolume = sortFilter in VOLUME_COL_LABEL
  const grid = showVolume ? GRID_WITH_VOL : GRID_WITHOUT_VOL

  return (
    <div className={`grid ${grid} items-center px-4 py-2 bg-surface-subtle border-b border-stroke text-[10px] font-semibold text-foreground-disabled`}>
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
  const [marketFilter, setMarketFilter] = useState('kr')
  const [sortFilter, setSortFilter]     = useState('volume_value')
  const [watched, setWatched]           = useState(new Set())

  const { stocks, isLoading, errorMessage } = useMarketRanking(sortFilter, marketFilter)

  const toggleWatch = (id) =>
    setWatched((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

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
            showVolume={sortFilter in VOLUME_COL_LABEL}
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
