import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import StockAvatar from '@/components/ui/StockAvatar'

/**
 * 채팅창 주문 카드
 * @param {string}  name        - 종목명 (예: '삼성전자')
 * @param {string}  stockCode   - 종목코드 (예: '005930')
 * @param {string}  marketType  - 'KOSPI' | 'KOSDAQ' | 'NYSE' | ...
 * @param {number}  price       - 현재가
 * @param {number}  changeRate  - 등락률 (예: 1.84)
 * @param {string}  color       - StockAvatar 색상 테마
 * @param {function} onDetail   - 상세보기 클릭 콜백
 * @param {function} onBuy      - 매수 확인 클릭 콜백 (quantity 전달)
 * @param {function} onSell     - 매도 확인 클릭 콜백 (quantity 전달)
 */
export default function ChatOrderCard({
  name,
  stockCode,
  marketType = 'KOSPI',
  price,
  changeRate,
  color = 'primary',
  onDetail,
  onBuy,
  onSell,
}) {
  const [quantity, setQuantity] = useState(1)

  const isUp = changeRate >= 0
  const estimatedAmount = (price * quantity).toLocaleString()

  function decrease() {
    setQuantity((q) => Math.max(1, q - 1))
  }

  function increase() {
    setQuantity((q) => q + 1)
  }

  return (
    <div className="bg-surface border border-stroke rounded-2xl p-4 w-full">

      {/* 종목 정보 */}
      <div className="flex items-center gap-3 mb-3">
        <StockAvatar
          name={name}
          stockCode={stockCode}
          marketType={marketType}
          color={color}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-[11px] text-foreground-tertiary truncate">{name}</p>
            <button
              onClick={onDetail}
              className="shrink-0 w-4 h-4 flex items-center justify-center rounded-full hover:bg-surface-subtle transition-colors duration-150"
            >
              <ArrowUpRight className="w-3 h-3 text-foreground-tertiary" />
            </button>
          </div>
          <p className="text-[22px] font-black text-foreground leading-tight">
            {price.toLocaleString()}원
          </p>
          <p className={`text-[11px] font-semibold ${isUp ? 'text-up' : 'text-down'}`}>
            {isUp ? '+' : ''}{changeRate}%
          </p>
        </div>
      </div>

      {/* 수량 */}
      <div className="flex items-center gap-3 mb-2.5">
        <span className="text-[12px] text-foreground-secondary shrink-0">수량</span>
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={decrease}
            className="w-7 h-7 rounded-lg border border-stroke flex items-center justify-center text-[15px] font-bold text-foreground-secondary hover:bg-surface-subtle transition-colors duration-150"
          >
            -
          </button>
          <div className="flex-1 text-center py-1 border border-stroke rounded-lg text-[13px] font-semibold text-foreground">
            {quantity}주
          </div>
          <button
            onClick={increase}
            className="w-7 h-7 rounded-lg border border-stroke flex items-center justify-center text-[15px] font-bold text-foreground-secondary hover:bg-surface-subtle transition-colors duration-150"
          >
            +
          </button>
        </div>
      </div>

      {/* 예상금액 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] text-foreground-secondary">예상금액</span>
        <span className="text-[13px] font-bold text-foreground">{estimatedAmount}원</span>
      </div>

      {/* 매도/매수 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={() => onSell?.(quantity)}
          className="flex-1 py-2.5 rounded-xl bg-down text-white text-[13px] font-bold hover:opacity-90 transition-opacity duration-150"
        >
          매도 확인
        </button>
        <button
          onClick={() => onBuy?.(quantity)}
          className="flex-1 py-2.5 rounded-xl bg-up text-white text-[13px] font-bold hover:opacity-90 transition-opacity duration-150"
        >
          매수 확인
        </button>
      </div>

    </div>
  )
}
