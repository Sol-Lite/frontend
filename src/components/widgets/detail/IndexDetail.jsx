import { useState, useEffect } from 'react'
import PriceChange from '@/components/ui/PriceChange'
import TabChip from '@/components/ui/TabChip'
import DetailChart from './DetailChart'
import useMarketIndices from '@/features/market/useMarketIndices'
import useIndexChart from '@/features/market/useIndexChart'
import useForexChart from '@/features/market/useForexChart'
import { cn } from '@/lib/cn'

const SIDEBAR_ITEMS = [
  { type: 'index', code: '001',        label: 'KOSPI'   },
  { type: 'index', code: '301',        label: 'KOSDAQ'  },
  { type: 'index', code: 'NAS@IXIC',  label: 'NASDAQ'  },
  { type: 'index', code: 'SPI@SPX',   label: 'S&P 500' },
  { type: 'forex', code: 'USD',        symbol: 'USDKRW=X', label: 'USD/KRW' },
]

const PERIODS = ['1D', '1M', '3M', '1Y']

export default function IndexDetail({ config = {} }) {
  const initialCode = config.code ?? (config.currency === 'USD' ? 'USD' : '001')
  const [selected, setSelected]       = useState(() => SIDEBAR_ITEMS.find((i) => i.code === initialCode) ?? SIDEBAR_ITEMS[0])
  const [period, setPeriod]           = useState('3M')
  const [fetchPeriod, setFetchPeriod] = useState(null)
  const [chartType, setChartType]     = useState(
    () => localStorage.getItem('market.chartType') ?? 'candle',
  )

  useEffect(() => {
    localStorage.setItem('market.chartType', chartType)
  }, [chartType])

  // 인덱스 전환 시 fetchPeriod 리셋 (t3518 rate limit 대응)
  useEffect(() => {
    setFetchPeriod(null)
    const timer = setTimeout(() => setFetchPeriod(period), 1200)
    return () => clearTimeout(timer)
  }, [selected.code]) // eslint-disable-line react-hooks/exhaustive-deps

  // 기간 변경 시 debounce
  useEffect(() => {
    if (selected.type === 'index') {
      const timer = setTimeout(() => setFetchPeriod(period), 1200)
      return () => clearTimeout(timer)
    } else {
      setFetchPeriod(period)
    }
  }, [period, selected.type])

  const { indices } = useMarketIndices()

  // 두 훅 모두 호출 — enabled 조건으로 실제 요청 제어
  const { lineData: idxLine, candleData: idxCandle, isLoading: idxLoading, isIntraday: idxIsIntraday, error: idxError } =
    useIndexChart(selected.type === 'index' ? selected.code : null, selected.type === 'index' ? fetchPeriod : null)

  const { lineData: fxLine, candleData: fxCandle, isLoading: fxLoading, isIntraday: fxIsIntraday, error: fxError } =
    useForexChart(selected.type === 'forex' ? selected.symbol : null, selected.type === 'forex' ? fetchPeriod : null)

  const isForex    = selected.type === 'forex'
  const lineData   = isForex ? fxLine   : idxLine
  const candleData = isForex ? fxCandle : idxCandle
  const isLoading  = isForex ? fxLoading  : idxLoading
  const isIntraday = isForex ? fxIsIntraday : idxIsIntraday
  const error      = isForex ? fxError   : idxError
  const hasData    = chartType === 'candle' ? candleData.length > 0 : lineData.length > 0

  // 헤더용 현재가/등락률 — USD 포함 모두 indices에서 조회
  const selectedIdx = indices.find((i) => i.code === selected.code)
  const headerPrice = selectedIdx ? Number(selectedIdx.price).toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : '—'
  const headerRate  = selectedIdx?.changeRate ?? null
  const headerIsUp  = headerRate != null ? headerRate >= 0 : true

  function handleSelect(item) {
    setSelected(item)
    setPeriod('3M')
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── 좌측: 차트 영역 ── */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-stroke shrink-0">
          <div className="flex items-baseline gap-3">
            <span className="text-[15px] font-bold text-foreground">{selected.label}</span>
            <span className="text-[20px] font-extrabold text-foreground">{headerPrice}</span>
            {headerRate != null && <PriceChange value={headerRate} className="text-[13px]" />}
          </div>
          <div className="flex items-center gap-2">
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
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <TabChip key={p} isActive={period === p} onClick={() => setPeriod(p)}>
                  {p}
                </TabChip>
              ))}
            </div>
          </div>
        </div>

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
              isUp={headerIsUp}

              className="w-full h-full"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-[12px] text-foreground-disabled">데이터 없음</div>
          )}
        </div>
      </div>

      {/* ── 우측: 목록 ── */}
      <div className="w-[200px] shrink-0 border-l border-stroke flex flex-col py-2 overflow-y-auto">
        <p className="px-4 pt-2 pb-3 text-[11px] font-semibold text-foreground-disabled">시장</p>
        {SIDEBAR_ITEMS.map((item) => {
          const idx      = indices.find((i) => i.code === item.code)
          const itemPrice = idx ? Number(idx.price).toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : '—'
          const itemRate  = idx?.changeRate ?? null
          const itemIsUp  = itemRate != null ? itemRate >= 0 : true
          const isActive = item.code === selected.code

          return (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item)}
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
