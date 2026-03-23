import { cn } from '@/lib/cn'
import { formatCurrency, formatNumber } from '@/features/invest/formatters'
import { useDomesticHoldings } from '@/api/balance'
import StockAvatar from '@/components/ui/StockAvatar'

// FIXME: 실제 API 연동 후 제거
const MOCK_HOLDINGS = [
  { stockCode: '005930', marketType: 'KOSPI', stockName: '삼성전자',  holdingQuantity: 100, avgBuyPrice: 72300,  currentPrice: 74800  },
  { stockCode: '000660', marketType: 'KOSPI', stockName: 'SK하이닉스', holdingQuantity: 20,  avgBuyPrice: 180000, currentPrice: 194500 },
  { stockCode: '035420', marketType: 'KOSPI', stockName: 'NAVER',    holdingQuantity: 5,   avgBuyPrice: 195000, currentPrice: 211000 },
]

export default function HoldingPanel() {
  const { data, isLoading } = useDomesticHoldings()

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">불러오는 중...</div>
  }

  // FIXME: API 정상 연동 시 MOCK_HOLDINGS 제거
  const apiHoldings = data ?? null
  const holdings = apiHoldings?.length ? apiHoldings : MOCK_HOLDINGS

  if (!holdings.length) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">보유 종목이 없습니다.</div>
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-[1] grid grid-cols-[28px_minmax(0,1fr)_56px_72px_72px] items-center gap-2 border-b border-stroke bg-surface-subtle px-2.5 py-1">
        {['', '종목', '수량', '평균단가', '손익'].map((label) => (
          <span key={label} className={cn('text-[9px] font-semibold text-foreground-disabled', label === '종목' || label === '' ? '' : 'text-right')}>
            {label}
          </span>
        ))}
      </div>

      {holdings.map((h) => {
        const avgPrice     = h.avgPrice ?? h.avgBuyPrice ?? 0
        const quantity     = h.holdingQuantity ?? h.availableQuantity ?? 0
        const evalPrice    = h.currentPrice ?? avgPrice
        const profitLoss   = (evalPrice - avgPrice) * quantity
        const profitRate   = avgPrice > 0 ? ((evalPrice - avgPrice) / avgPrice) * 100 : 0
        const isProfit     = profitLoss >= 0

        return (
          <div
            key={h.stockCode}
            className="grid grid-cols-[28px_minmax(0,1fr)_56px_72px_72px] items-center gap-2 border-b border-stroke-subtle px-2.5 py-2"
          >
            <StockAvatar name={h.stockName ?? h.stockCode} stockCode={h.stockCode} marketType={h.marketType} size="sm" />
            <div className="min-w-0">
              <div className="truncate text-[10px] font-semibold text-foreground">{h.stockName ?? h.stockCode}</div>
              <div className="text-[9px] text-foreground-disabled">{formatCurrency(evalPrice)}</div>
            </div>
            <span className="text-[10px] text-right text-foreground">{formatNumber(quantity)}주</span>
            <span className="text-[10px] text-right text-foreground">{formatCurrency(avgPrice)}</span>
            <div className="text-right">
              <div className={cn('text-[10px] font-bold', isProfit ? 'text-up' : 'text-down')}>
                {isProfit ? '+' : ''}{formatCurrency(profitLoss)}
              </div>
              <div className={cn('text-[9px]', isProfit ? 'text-up' : 'text-down')}>
                {isProfit ? '+' : ''}{profitRate.toFixed(2)}%
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
