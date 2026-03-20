import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import StockAvatar from '@/components/ui/StockAvatar'
import PriceChange from '@/components/ui/PriceChange'
import RatioBar from '@/components/ui/RatioBar'

const GRID_WITH_VOL    = 'grid-cols-[32px_36px_1fr_110px_80px_88px_120px]'
const GRID_WITHOUT_VOL = 'grid-cols-[32px_36px_1fr_110px_80px_120px]'

function StockLogo({ stockCode, name, color }) {
  const [stage, setStage] = useState(0)
  // 0 = KOSPI, 1 = KOSDAQ, 2 = avatar fallback

  if (stage === 2) return <StockAvatar name={name.slice(0, 2)} color={color} size="md" />

  const dir = stage === 0 ? 'KOSPI-logo' : 'KOSDAQ-logo'
  return (
    <img
      src={`/${dir}/${stockCode}.png`}
      alt={name}
      className="w-8 h-8 shrink-0 rounded-full object-contain bg-surface-subtle"
      onError={() => setStage((s) => s + 1)}
    />
  )
}

export default function StockRow({ stock, showVolume = true, isWatched, onWatchToggle }) {
  const navigate = useNavigate()
  const isTop = stock.rank === 1
  const grid = showVolume ? GRID_WITH_VOL : GRID_WITHOUT_VOL

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
          isWatched ? 'text-up' : 'text-stroke-input hover:text-up'
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
        <StockLogo stockCode={stock.stockCode} name={stock.name} color={stock.color} />
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
          {stock.volume ?? '—'}
        </div>
      )}

      {/* 거래 비율 */}
      <div className="pl-2">
        {stock.buyRatio != null
          ? <RatioBar buyRatio={stock.buyRatio} sellRatio={stock.sellRatio} />
          : <span className="text-[11px] text-foreground-disabled select-none">—</span>
        }
      </div>
    </div>
  )
}
