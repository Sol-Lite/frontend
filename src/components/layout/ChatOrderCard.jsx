import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import { foreignMarketApi, getExchcd, marketApi } from '@/api/market'
import { useBuyableAmount, useDomesticHoldings, useOverseasHoldings } from '@/api/balance'
import useStompSubscription from '@/hooks/useStompSubscription'
import {
  DISPLAY_CURRENCY,
  formatCurrency,
  formatNumber,
  formatSignedPercent,
  formatVisiblePrice,
  isForeignMarketType,
} from '@/features/invest/formatters'
import StockAvatar from '@/components/ui/StockAvatar'

const EXCHANGE_CODE_BY_MARKET_TYPE = {
  NASDAQ: 'NAS',
  NYSE: 'NYS',
  AMEX: 'AMS',
}

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
  exchangeCode = null,
  price,
  changeRate,
  color = 'primary',
  onDetail,
  onBuy,
  onSell,
  isDisabled = false,
}) {
  const [quantity, setQuantity] = useState(1)
  const [quantityInput, setQuantityInput] = useState('1')
  const [actionLocked, setActionLocked] = useState(false)

  const isForeignMarket = isForeignMarketType(marketType)
  const displayCurrency = isForeignMarket ? DISPLAY_CURRENCY.USD : DISPLAY_CURRENCY.KRW
  const resolvedExchangeCode = exchangeCode ?? EXCHANGE_CODE_BY_MARKET_TYPE[marketType] ?? null
  const exchcd = isForeignMarket ? getExchcd(resolvedExchangeCode) : null

  const { data: priceRaw } = useQuery({
    queryKey: isForeignMarket
      ? ['foreign', 'price', stockCode, exchcd]
      : ['domestic', 'price', stockCode],
    queryFn: () => (
      isForeignMarket
        ? foreignMarketApi.getCurrentPrice(stockCode, exchcd)
        : marketApi.getCurrentPrice(stockCode)
    ),
    enabled: Boolean(stockCode) && (!isForeignMarket || Boolean(exchcd)),
    staleTime: 1000 * 5,
  })

  const liveQuote = useStompSubscription(stockCode
    ? (
        isForeignMarket
          ? `/topic/foreign/quote/${stockCode}`
          : `/topic/stock/trade/${stockCode}`
      )
    : null)
  const livePriceData = useMemo(() => {
    if (!liveQuote) return null

    const currentPrice = Number(liveQuote.price)
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) return null

    const liveChangeRate = Number(isForeignMarket ? liveQuote.rate : liveQuote.drate)
    return {
      currentPrice,
      changeRate: Number.isFinite(liveChangeRate) ? liveChangeRate : null,
    }
  }, [isForeignMarket, liveQuote])

  const restPriceData = useMemo(() => {
    if (!priceRaw) return null

    if (isForeignMarket) {
      return {
        currentPrice: Number(priceRaw.price),
        changeRate: Number(priceRaw.rate),
      }
    }

    return {
      currentPrice: Number(priceRaw.currentPrice),
      changeRate: Number(priceRaw.changeRate),
    }
  }, [isForeignMarket, priceRaw])

  const fallbackPrice = Number(price)
  const fallbackChangeRate = Number(changeRate)
  const resolvedPrice = [livePriceData?.currentPrice, restPriceData?.currentPrice, fallbackPrice]
    .find((value) => Number.isFinite(value) && value > 0) ?? null
  const resolvedChangeRate = [livePriceData?.changeRate, restPriceData?.changeRate, fallbackChangeRate]
    .find((value) => Number.isFinite(value)) ?? null
  const priceLabel = resolvedPrice != null
    ? formatVisiblePrice(resolvedPrice, { marketType, displayCurrency })
    : '시세 확인 중'
  const changeRateLabel = resolvedChangeRate != null ? formatSignedPercent(resolvedChangeRate) : '-'
  const isUp = resolvedChangeRate != null ? resolvedChangeRate >= 0 : true
  const estimatedAmountLabel = resolvedPrice != null
    ? formatCurrency(resolvedPrice * quantity, { marketType, displayCurrency })
    : '-'

  const { data: buyableData } = useBuyableAmount({
    stockCode,
    marketType,
  })
  const { data: domesticHoldingsData } = useDomesticHoldings({
    enabled: !isForeignMarket,
  })
  const { data: overseasHoldingsData } = useOverseasHoldings({
    enabled: isForeignMarket,
  })

  const holdingsData = isForeignMarket ? overseasHoldingsData : domesticHoldingsData
  const holdingRaw = holdingsData?.find?.((holding) => holding.stockCode === stockCode)
  const availableAmount = buyableData?.availableAmount
  const holdingQuantity = holdingRaw?.availableQuantity ?? holdingRaw?.holdingQuantity
  const availableAmountLabel = availableAmount != null
    ? formatCurrency(availableAmount, { marketType, displayCurrency })
    : '-'
  const holdingQuantityLabel = holdingQuantity != null ? `${formatNumber(holdingQuantity)}주` : '-'

  function decrease() {
    setQuantity((current) => {
      const nextQuantity = Math.max(1, current - 1)
      setQuantityInput(String(nextQuantity))
      return nextQuantity
    })
  }

  function increase() {
    setQuantity((current) => {
      const nextQuantity = current + 1
      setQuantityInput(String(nextQuantity))
      return nextQuantity
    })
  }

  function commitQuantity(nextValue) {
    const digitsOnly = String(nextValue ?? '').replace(/\D/g, '')
    const parsed = Number.parseInt(digitsOnly, 10)
    const nextQuantity = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
    setQuantity(nextQuantity)
    setQuantityInput(String(nextQuantity))
    return nextQuantity
  }

  function handleQuantityInputChange(value) {
    const digitsOnly = value.replace(/\D/g, '')
    if (!digitsOnly) {
      setQuantityInput('')
      return
    }

    const nextQuantity = Number.parseInt(digitsOnly, 10)
    setQuantity(nextQuantity)
    setQuantityInput(String(nextQuantity))
  }

  async function handleAction(nextSide) {
    const callback = nextSide === 'buy' ? onBuy : onSell
    if (actionLocked || isDisabled || !callback) return

    const committedQuantity = commitQuantity(quantityInput)
    setActionLocked(true)
    try {
      await callback(committedQuantity)
    } finally {
      setActionLocked(false)
    }
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
              disabled={actionLocked || isDisabled}
              className="shrink-0 w-4 h-4 flex items-center justify-center rounded-full hover:bg-surface-subtle transition-colors duration-150"
            >
              <ArrowUpRight className="w-3 h-3 text-foreground-tertiary" />
            </button>
          </div>
          <p className="text-[22px] font-black text-foreground leading-tight">
            {priceLabel}
          </p>
          <p className={`text-[11px] font-semibold ${isUp ? 'text-up' : 'text-down'}`}>
            {changeRateLabel}
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-4 text-[11px]">
        <div className="min-w-0 flex-1">
          <span className="text-foreground-disabled">주문가능금액</span>
          <p className="mt-0.5 truncate font-bold text-foreground">{availableAmountLabel}</p>
        </div>
        <div className="h-7 w-px shrink-0 bg-stroke" />
        <div className="min-w-0 flex-1 text-right">
          <span className="text-foreground-disabled">보유 수량</span>
          <p className="mt-0.5 font-bold text-foreground">{holdingQuantityLabel}</p>
        </div>
      </div>

      {/* 수량 */}
      <div className="flex items-center gap-3 mb-2.5">
        <span className="text-[12px] text-foreground-secondary shrink-0">수량</span>
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={decrease}
            disabled={actionLocked || isDisabled}
            className="w-7 h-7 rounded-lg border border-stroke flex items-center justify-center text-[15px] font-bold text-foreground-secondary hover:bg-surface-subtle transition-colors duration-150"
          >
            -
          </button>
          <div className="flex flex-1 items-center justify-center rounded-lg border border-stroke px-2 py-1">
            <input
              type="text"
              inputMode="numeric"
              value={quantityInput}
              onChange={(e) => handleQuantityInputChange(e.target.value)}
              onBlur={(e) => commitQuantity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
              disabled={actionLocked || isDisabled}
              className="w-full bg-transparent text-center text-[13px] font-semibold text-foreground outline-none"
            />
            <span className="ml-1 shrink-0 text-[11px] text-foreground-secondary">주</span>
          </div>
          <button
            onClick={increase}
            disabled={actionLocked || isDisabled}
            className="w-7 h-7 rounded-lg border border-stroke flex items-center justify-center text-[15px] font-bold text-foreground-secondary hover:bg-surface-subtle transition-colors duration-150"
          >
            +
          </button>
        </div>
      </div>

      {/* 예상금액 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] text-foreground-secondary">예상금액</span>
        <span className="text-[13px] font-bold text-foreground">{estimatedAmountLabel}</span>
      </div>

      {/* 매도/매수 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={() => handleAction('sell')}
          disabled={actionLocked || isDisabled}
          className="flex-1 py-2.5 rounded-xl bg-down text-white text-[13px] font-bold hover:opacity-90 transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-45"
        >
          매도 확인
        </button>
        <button
          onClick={() => handleAction('buy')}
          disabled={actionLocked || isDisabled}
          className="flex-1 py-2.5 rounded-xl bg-up text-white text-[13px] font-bold hover:opacity-90 transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-45"
        >
          매수 확인
        </button>
      </div>

    </div>
  )
}
