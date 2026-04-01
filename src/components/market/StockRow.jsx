import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import StockAvatar from '@/components/ui/StockAvatar'
import PriceChange from '@/components/ui/PriceChange'
import RatioBar from '@/components/ui/RatioBar'

export const MARKET_GRID_BY_SORT_FILTER = {
  volume_value: 'grid-cols-[28px_30px_minmax(0,1fr)_110px_80px_90px_96px]',
  volume: 'grid-cols-[28px_30px_minmax(0,1fr)_110px_80px_80px_90px]',
  market_cap: 'grid-cols-[28px_30px_minmax(0,1fr)_110px_80px_90px_82px]',
  rising: 'grid-cols-[28px_30px_minmax(0,1fr)_110px_80px_108px]',
  falling: 'grid-cols-[28px_30px_minmax(0,1fr)_110px_80px_108px]',
}

export function hasPrimaryMetricColumn(sortFilter) {
  return ['volume_value', 'volume', 'market_cap'].includes(sortFilter)
}

export function getMarketRowGrid(sortFilter, isForeign = false) {
  if (isForeign && (sortFilter === 'rising' || sortFilter === 'falling')) {
    return 'grid-cols-[28px_30px_minmax(0,1fr)_110px_80px]'
  }
  return MARKET_GRID_BY_SORT_FILTER[sortFilter] ?? MARKET_GRID_BY_SORT_FILTER.volume_value
}


export default function StockRow({ stock, sortFilter = 'volume_value', isForeign = false, isWatched, onWatchToggle, isModalMode = false, onStockClick }) {
  const navigate = useNavigate()
  const isTop = stock.rank === 1
  const grid = getMarketRowGrid(sortFilter, isForeign)
  const showVolume = hasPrimaryMetricColumn(sortFilter)
  const secondaryMetric = stock.secondaryMetric
  const marketType = stock.market ?? stock.marketType ?? null

  return (
    <div
      className={`grid ${grid} items-center px-4 py-2.5 border-b border-stroke-subtle hover:bg-surface-subtle transition-colors duration-[100ms] cursor-pointer last:border-b-0`}
      onClick={() => isModalMode ? onStockClick?.(stock) : navigate(`/invest/${stock.stockCode}`, { state: { stockName: stock.name, marketType, exchangeCode: stock.exchangeCode ?? null } })}
    >
      {/* 관심종목 */}
      <button
        aria-label={isWatched ? '관심종목 해제' : '관심종목 추가'}
        onClick={(e) => { e.stopPropagation(); onWatchToggle?.(stock.id) }}
        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-[120ms] ${
          isWatched ? 'text-primary' : 'text-stroke-input hover:text-primary'
        }`}
      >
        <Heart className="w-3.5 h-3.5" fill={isWatched ? 'currentColor' : 'none'} />
      </button>

      {/* 순위 */}
      <div className={`text-[13px] font-bold ${isTop ? 'text-primary' : 'text-foreground-disabled'}`}>
        {stock.rank}
      </div>

      {/* 종목명 */}
      <div className="flex items-center gap-2 min-w-0">
        <StockAvatar name={stock.name} stockCode={stock.stockCode} marketType={marketType} color={stock.color} size="md" />
        <span className="text-[13px] font-semibold text-foreground truncate">{stock.name}</span>
        {stock.consecutiveDays > 0 && (
          <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
            stock.change >= 0 ? 'bg-up-bg text-up' : 'bg-down-bg text-down'
          }`}>
            {stock.consecutiveDays}일{stock.change >= 0 ? '↑' : '↓'}
          </span>
        )}
      </div>

      {/* 현재가 */}
      <div className="text-right text-[13px] font-bold text-foreground">
        {stock.price}
      </div>

      {/* 등락률 */}
      <div className="text-right">
        <PriceChange value={stock.change} className="text-[12px]" />
      </div>

      {/* 거래대금 / 거래량 / 시가총액 */}
      {showVolume && (
        <div className="text-right text-[12px] font-medium text-foreground-secondary">
          {stock.metricValue ?? '—'}
        </div>
      )}

      {/* 보조 지표 */}
      {secondaryMetric != null && (
        <div className="flex h-full items-center pl-2">
          {secondaryMetric.buyRatio != null
            ? <RatioBar className="w-full" buyRatio={secondaryMetric.buyRatio} sellRatio={secondaryMetric.sellRatio} />
            : (
              <div className="w-full text-right text-[12px] font-medium text-foreground-secondary">
                {secondaryMetric.value ?? '—'}
              </div>
            )}
        </div>
      )}
    </div>
  )
}
