import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import StockAvatar from '@/components/ui/StockAvatar'
import PriceChange from '@/components/ui/PriceChange'
import RatioBar from '@/components/ui/RatioBar'

const GRID_WITH_VOL    = 'grid-cols-[32px_36px_1fr_110px_80px_88px_120px]'
const GRID_WITHOUT_VOL = 'grid-cols-[32px_36px_1fr_110px_80px_120px]'


export default function StockRow({ stock, showVolume = true, isWatched, onWatchToggle }) {
  const navigate = useNavigate()
  const isTop = stock.rank === 1
  const grid = showVolume ? GRID_WITH_VOL : GRID_WITHOUT_VOL
  const secondaryMetric = stock.secondaryMetric ?? { value: '—' }

  return (
    <div
      className={`grid ${grid} items-center px-4 py-2.5 border-b border-stroke-subtle hover:bg-surface-subtle transition-colors duration-[100ms] cursor-pointer last:border-b-0`}
      onClick={() => navigate(`/invest/${stock.stockCode}`, { state: { stockName: stock.name, marketType: 'KOSPI' } })}
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
        <StockAvatar name={stock.name} stockCode={stock.stockCode} marketType={stock.market ?? stock.marketType} color={stock.color} size="md" />
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
      <div className="pl-2">
        {secondaryMetric.buyRatio != null
          ? <RatioBar buyRatio={secondaryMetric.buyRatio} sellRatio={secondaryMetric.sellRatio} />
          : (
            <div className="text-right text-[12px] font-medium text-foreground-secondary">
              {secondaryMetric.value ?? '—'}
            </div>
          )}
      </div>
    </div>
  )
}
