import { Heart } from 'lucide-react'
import StockAvatar from '@/components/ui/StockAvatar'
import PriceChange from '@/components/ui/PriceChange'
import RatioBar from '@/components/ui/RatioBar'

/**
 * 시세 페이지 종목 행
 * grid: 32px 36px 1fr 100px 80px 90px 120px
 */
export default function StockRow({ stock, isWatched, onWatchToggle }) {
  const isTop = stock.rank === 1

  return (
    <div className="grid grid-cols-[32px_36px_1fr_100px_80px_90px_120px] items-center px-4 py-2.5 border-b border-stroke-subtle hover:bg-surface-subtle transition-colors duration-[100ms] cursor-pointer last:border-b-0">
      {/* 관심종목 */}
      <button
        aria-label={isWatched ? '관심종목 해제' : '관심종목 추가'}
        onClick={(e) => { e.stopPropagation(); onWatchToggle?.(stock.id) }}
        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors duration-[120ms] ${
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
      <div className="flex items-center gap-2.5">
        <StockAvatar name={stock.label} color={stock.color} size="md" />
        <span className="text-[13px] font-bold text-foreground">{stock.name}</span>
      </div>

      {/* 현재가 */}
      <div className="text-right text-[14px] font-bold text-foreground">
        {stock.price}
      </div>

      {/* 등락률 */}
      <div className="text-right">
        <PriceChange value={stock.change} className="text-[12px]" />
      </div>

      {/* 거래대금 */}
      <div className="text-right text-[12px] font-semibold text-foreground-secondary">
        {stock.volume}
      </div>

      {/* 매수/매도 비율 */}
      <div className="pl-2">
        <RatioBar buyRatio={stock.buyRatio} sellRatio={stock.sellRatio} />
      </div>
    </div>
  )
}
