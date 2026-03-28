import { useState, useEffect } from 'react'
import PriceChange from '@/components/ui/PriceChange'
import TabChip from '@/components/ui/TabChip'
import DetailChart from './DetailChart'
import useMarketIndices from '@/features/market/useMarketIndices'
import useIndexChart from '@/features/market/useIndexChart'
import { cn } from '@/lib/cn'

const INDEX_LIST = [
  { code: '001',      label: 'KOSPI'   },
  { code: '301',      label: 'KOSDAQ'  },
  { code: 'NAS@IXIC', label: 'NASDAQ'  },
  { code: 'SPI@SPX',  label: 'S&P 500' },
]

const PERIODS = ['1D', '1M', '3M', '1Y']

export default function IndexDetail({ config = {} }) {
  const [code, setCode]               = useState(config.code ?? '001')
  const [period, setPeriod]           = useState('3M')
  const [fetchPeriod, setFetchPeriod] = useState(null)
  const [chartType, setChartType]     = useState(
    () => localStorage.getItem('index.chartType') ?? 'candle',
  )

  useEffect(() => {
    localStorage.setItem('index.chartType', chartType)
  }, [chartType])

  // t3518 rate limit(1 req/sec) 대응
  useEffect(() => {
    const timer = setTimeout(() => setFetchPeriod(period), 1200)
    return () => clearTimeout(timer)
  }, [period])

  // 지수 전환 시 fetchPeriod 리셋 후 재요청
  useEffect(() => {
    setFetchPeriod(null)
    const timer = setTimeout(() => setFetchPeriod(period), 1200)
    return () => clearTimeout(timer)
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  const { indices } = useMarketIndices()
  const currentMeta = INDEX_LIST.find((m) => m.code === code)
  const idx         = indices.find((i) => i.code === code)

  const price      = idx ? Number(idx.price).toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : '—'
  const changeRate = idx?.changeRate ?? null
  const isUp       = changeRate != null ? changeRate >= 0 : true

  const { lineData, candleData, isLoading, isIntraday, error } = useIndexChart(code, fetchPeriod)
  const hasData = chartType === 'candle' ? candleData.length > 0 : lineData.length > 0

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── 좌측: 차트 영역 ── */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stroke shrink-0">
          <div className="flex items-baseline gap-3">
            <span className="text-[15px] font-bold text-foreground">{currentMeta?.label ?? code}</span>
            <span className="text-[20px] font-extrabold text-foreground">{price}</span>
            {changeRate != null && <PriceChange value={changeRate} className="text-[13px]" />}
          </div>
          <div className="flex items-center gap-2">
            {/* 캔들/라인 토글 */}
            <div className="flex items-center rounded-lg bg-surface-muted p-0.5">
              {[{ key: 'candle', label: '캔들' }, { key: 'line', label: '라인' }].map((type) => (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setChartType(type.key)}
                  className={cn(
                    'rounded-md px-2.5 py-0.5 text-[10px] font-semibold transition-all',
                    chartType === type.key
                      ? 'bg-primary text-white shadow-control'
                      : 'text-foreground-disabled hover:text-foreground-secondary',
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* 기간 탭 */}
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <TabChip key={p} isActive={period === p} onClick={() => setPeriod(p)}>
                  {p}
                </TabChip>
              ))}
            </div>
          </div>
        </div>

        {/* 차트 */}
        <div className="flex-1 min-h-0 p-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-[12px] text-foreground-disabled">불러오는 중...</div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-[12px] text-status-negative">{error.message ?? 'API 오류'}</div>
          ) : hasData ? (
            <DetailChart
              lineData={lineData}
              candleData={candleData}
              chartType={chartType}
              isMinute={isIntraday}
              isUp={isUp}
              className="w-full h-full"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-[12px] text-foreground-disabled">데이터 없음</div>
          )}
        </div>
      </div>

      {/* ── 우측: 지수 목록 ── */}
      <div className="w-[200px] shrink-0 border-l border-stroke flex flex-col py-2 overflow-y-auto">
        <p className="px-4 pt-2 pb-3 text-[11px] font-semibold text-foreground-disabled">주가지수</p>
        {INDEX_LIST.map((item) => {
          const itemIdx   = indices.find((i) => i.code === item.code)
          const itemPrice = itemIdx ? Number(itemIdx.price).toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : '—'
          const itemRate  = itemIdx?.changeRate ?? null
          const itemIsUp  = itemRate != null ? itemRate >= 0 : true
          const isActive  = item.code === code

          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setCode(item.code)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-left transition-colors',
                isActive ? 'bg-surface-subtle' : 'hover:bg-surface-muted',
              )}
            >
              <span className={cn(
                'text-[12px] font-semibold w-[52px] shrink-0',
                isActive ? 'text-foreground' : 'text-foreground-secondary',
              )}>
                {item.label}
              </span>
              <span className="text-[12px] font-bold text-foreground tabular-nums flex-1 text-right">{itemPrice}</span>
              {itemRate != null ? (
                <span className={cn(
                  'text-[11px] font-semibold tabular-nums w-[46px] text-right shrink-0',
                  itemIsUp ? 'text-up' : 'text-down',
                )}>
                  {itemIsUp ? '+' : ''}{itemRate.toFixed(2)}%
                </span>
              ) : (
                <span className="w-[46px] shrink-0" />
              )}
            </button>
          )
        })}
      </div>

    </div>
  )
}
