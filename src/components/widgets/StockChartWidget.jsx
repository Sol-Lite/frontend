import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Settings2 } from 'lucide-react'
import StockAvatar from '@/components/ui/StockAvatar'
import PriceChange from '@/components/ui/PriceChange'
import MiniChart from '@/components/ui/MiniChart'
import WidgetCard from './WidgetCard'
import StockSelectModal from './StockSelectModal'
import { HOME_STOCKS } from '@/mocks/home'
import { marketApi, foreignMarketApi, getExchcd } from '@/api/market'
import useWidgetStore from '@/store/useWidgetStore'
import { useDashboardSave } from '@/hooks/useDashboardSync'
import useStompSubscription from '@/hooks/useStompSubscription'
import { normalizeDailySeries, normalizeMinuteSeries } from '@/features/invest/domestic/normalize'
import { normalizeForeignDailySeries, normalizeForeignMinuteSeries } from '@/features/invest/foreign/normalize'
import { formatApiDate } from '@/features/invest/formatters'

// config.stockId(레거시) → 종목코드 매핑
const STOCK_CODE_MAP = {
  samsung: '005930',
  skhynix: '000660',
}

const PERIODS = ['1일', '1주', '1달', '3달']

const OVERSEAS_MARKET_TYPES = ['NAS', 'NYS', 'AMS']

const PERIOD_CONFIG = {
  '1일': { type: 'minute', ncnt: 5 },
  '1주': { type: 'daily',  period: 'DAILY',  foreignPeriod: 'DAY', days: 7  },
  '1달': { type: 'daily',  period: 'DAILY',  foreignPeriod: 'DAY', days: 30 },
  '3달': { type: 'weekly', period: 'WEEKLY', foreignPeriod: 'DAY', days: 90 },
}

// 5분봉 버킷 타임스탬프 계산
function toMinuteBucketTime(chetime) {
  const hh = parseInt(chetime.slice(0, 2), 10)
  const mm = parseInt(chetime.slice(2, 4), 10)
  const bucketMm = Math.floor(mm / 5) * 5
  const now = new Date()
  const ts = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, bucketMm, 0).getTime()
  return Math.floor(ts / 1000) // unix seconds (lightweight-charts 기준)
}

function fmtVolume(v) {
  if (v == null) return '-'
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`
  if (v >= 10_000) return `${Math.round(v / 10_000).toLocaleString('ko-KR')}만`
  return v.toLocaleString('ko-KR')
}

export default function StockChartWidget({ instanceId, variant = 'stock-sm', colSpan = 1, rowSpan = 1, onDelete, config = {} }) {
  const [activePeriod, setActivePeriod] = useState(
    () => localStorage.getItem(`widget.period.${instanceId}`) ?? '1일'
  )
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [livePrice, setLivePrice]   = useState(null)
  const [liveCandle, setLiveCandle] = useState(null)
  const updateWidgetConfig = useWidgetStore((s) => s.updateWidgetConfig)
  const { mutate: saveDashboard } = useDashboardSave()

  const stockId    = config.stockId ?? 'samsung'
  const stockCode  = config.stockCode ?? STOCK_CODE_MAP[stockId]
  const stockName  = config.stockName ?? null
  const stockMeta  = HOME_STOCKS.find((s) => s.id === stockId) ?? HOME_STOCKS[0]
  const marketType = config.marketType ?? stockMeta.market ?? null
  const isOverseas = OVERSEAS_MARKET_TYPES.includes(marketType)
  const exchcd     = isOverseas ? getExchcd(marketType) : null

  // 종목 변경 시 실시간 상태 초기화
  useEffect(() => {
    setLivePrice(null)
    setLiveCandle(null)
  }, [stockCode])

  function handleStockSave({ stockCode: newCode, stockName: newName, marketType: newMarket }) {
    updateWidgetConfig(instanceId, { stockCode: newCode, stockName: newName, marketType: newMarket, stockId: undefined })
    saveDashboard()
    setIsConfigOpen(false)
  }

  const settingsBtn = (
    <button
      onClick={(e) => { e.stopPropagation(); setIsConfigOpen(true) }}
      className="p-0.5 rounded text-foreground-disabled hover:text-foreground transition-colors"
    >
      <Settings2 className="w-3 h-3" />
    </button>
  )

  function handlePeriodChange(p) {
    setActivePeriod(p)
    localStorage.setItem(`widget.period.${instanceId}`, p)
  }

  const periodTabs = (
    <div className="flex gap-1">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={(e) => { e.stopPropagation(); handlePeriodChange(p) }}
          className={`text-[9px] px-1.5 py-0.5 rounded font-medium transition-colors duration-[150ms] ${activePeriod === p ? 'bg-primary-light text-primary' : 'text-foreground-disabled hover:text-foreground'}`}
        >
          {p}
        </button>
      ))}
    </div>
  )

  // ── REST 초기 데이터 ────────────────────────────────────────────
  const { data: priceRaw } = useQuery({
    queryKey: isOverseas ? ['foreign', 'price', stockCode, exchcd] : ['stock', 'price', stockCode],
    queryFn:  isOverseas
      ? () => foreignMarketApi.getCurrentPrice(stockCode, exchcd)
      : () => marketApi.getCurrentPrice(stockCode),
    enabled:  !!stockCode,
    staleTime: 30_000,
  })

  // 해외 가격 응답 필드 통일 ({ price, rate, diff } → { currentPrice, changeRate, changeAmount })
  const priceData = isOverseas && priceRaw
    ? { currentPrice: priceRaw.price, changeRate: priceRaw.rate, changeAmount: priceRaw.diff }
    : priceRaw

  const queryClient = useQueryClient()

  useEffect(() => {
    if (!stockCode) return
    const end = formatApiDate(new Date())
    Object.values(PERIOD_CONFIG).forEach((cfg) => {
      if (cfg.type === 'minute') {
        if (isOverseas) {
          queryClient.prefetchQuery({
            queryKey: ['foreign', 'minuteChart', stockCode, exchcd, 5],
            queryFn:  () => foreignMarketApi.getMinuteChart(stockCode, exchcd, { nmin: 5 }),
            staleTime: 60_000,
          })
        } else {
          queryClient.prefetchQuery({
            queryKey: ['stock', 'minute-chart', stockCode, cfg.ncnt],
            queryFn:  () => marketApi.getMinuteChart(stockCode, { ncnt: cfg.ncnt }),
            staleTime: 60_000,
          })
        }
      } else {
        const start = formatApiDate(new Date(Date.now() - cfg.days * 24 * 60 * 60 * 1000))
        if (isOverseas) {
          queryClient.prefetchQuery({
            queryKey: ['foreign', 'chart', cfg.foreignPeriod, stockCode, exchcd, start, end],
            queryFn:  () => foreignMarketApi.getChart(stockCode, exchcd, { period: cfg.foreignPeriod, startDate: start, endDate: end }),
            staleTime: 5 * 60 * 1000,
          })
        } else {
          queryClient.prefetchQuery({
            queryKey: ['stock', 'chart', cfg.period, stockCode, start, end],
            queryFn:  () => marketApi.getChart(stockCode, { period: cfg.period, startDate: start, endDate: end }),
            staleTime: 5 * 60 * 1000,
          })
        }
      }
    })
  }, [stockCode, exchcd, isOverseas, queryClient])

  const periodCfg = PERIOD_CONFIG[activePeriod]
  const isMinute  = periodCfg.type === 'minute'

  const endDate   = useMemo(() => formatApiDate(new Date()), [])
  const startDate = useMemo(
    () => isMinute ? null : formatApiDate(new Date(Date.now() - periodCfg.days * 24 * 60 * 60 * 1000)),
    [isMinute, periodCfg.days]
  )

  const { data: minuteRaw } = useQuery({
    queryKey: isOverseas
      ? ['foreign', 'minuteChart', stockCode, exchcd, 5]
      : ['stock', 'minute-chart', stockCode, periodCfg.ncnt],
    queryFn: isOverseas
      ? () => foreignMarketApi.getMinuteChart(stockCode, exchcd, { nmin: 5 })
      : () => marketApi.getMinuteChart(stockCode, { ncnt: periodCfg.ncnt }),
    enabled:  !!stockCode && isMinute,
    staleTime: 60_000,
  })

  const { data: chartRaw } = useQuery({
    queryKey: isOverseas
      ? ['foreign', 'chart', periodCfg.foreignPeriod, stockCode, exchcd, startDate, endDate]
      : ['stock', 'chart', periodCfg.period, stockCode, startDate, endDate],
    queryFn: isOverseas
      ? () => foreignMarketApi.getChart(stockCode, exchcd, { period: periodCfg.foreignPeriod, startDate, endDate })
      : () => marketApi.getChart(stockCode, { period: periodCfg.period, startDate, endDate }),
    enabled:  !!stockCode && !isMinute,
    staleTime: 5 * 60 * 1000,
  })

  // ── STOMP 실시간 체결 구독 (국내 전용) ─────────────────────────
  const liveTrade = useStompSubscription(!isOverseas && stockCode ? `/topic/stock/trade/${stockCode}` : null)

  useEffect(() => {
    if (!liveTrade) return
    const price  = Number(liveTrade.price)
    const volume = Number(liveTrade.cvolume)
    if (!price || !volume) return

    const chetime = liveTrade.chetime ?? ''
    if (chetime.length < 4) return
    const time = toMinuteBucketTime(chetime)

    // 캔들 누적 (분봉 기간일 때만 차트 업데이트)
    if (isMinute) {
      setLiveCandle((prev) => {
        if (!prev || prev.time !== time) {
          return { time, open: price, high: price, low: price, close: price }
        }
        return { ...prev, high: Math.max(prev.high, price), low: Math.min(prev.low, price), close: price }
      })
    }

    const changeRate   = Number(liveTrade.drate ?? 0)
    const changeAmount = Number(liveTrade.change ?? 0) * (changeRate >= 0 ? 1 : -1)
    setLivePrice({ currentPrice: price, changeRate, changeAmount })
  }, [liveTrade, isMinute])

  // ── 차트 데이터 ────────────────────────────────────────────────
  const { candleData, latestCandle } = useMemo(() => {
    let series
    if (isMinute) {
      series = isOverseas
        ? normalizeForeignMinuteSeries(minuteRaw?.dataPoints)
        : normalizeMinuteSeries(minuteRaw?.data ?? minuteRaw)
    } else {
      series = isOverseas
        ? normalizeForeignDailySeries(chartRaw?.dataPoints)
        : normalizeDailySeries(chartRaw?.data)
    }

    // 분봉: 오늘 세션만 표시
    if (isMinute) {
      const today = new Date()
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const todaySeries = series.filter((p) => p.sessionDate === todayKey)
      if (todaySeries.length > 0) series = todaySeries
    }

    const toTime = (p) => Math.floor(p.timestamp / 1000)
    return {
      candleData:   series.map((p) => ({ time: toTime(p), open: p.open, high: p.high, low: p.low, close: p.close })),
      latestCandle: series[series.length - 1] ?? null,
    }
  }, [isMinute, isOverseas, minuteRaw, chartRaw])

  // ── 가격 표시용 (STOMP > REST 우선) ───────────────────────────
  const priceSource = livePrice ?? priceData
  const hasPrice = priceSource != null
  const stock = {
    ...stockMeta,
    name:      stockName ?? stockMeta.name,
    code:      stockCode ?? stockMeta.code,
    price:     priceSource?.currentPrice != null
                 ? Number(priceSource.currentPrice).toLocaleString('ko-KR')
                 : '-',
    change:    priceSource?.changeRate ?? 0,
    changeAmt: priceSource?.changeAmount != null
                 ? Math.abs(Number(priceSource.changeAmount)).toLocaleString('ko-KR')
                 : '-',
    open:       latestCandle ? Number(latestCandle.open).toLocaleString('ko-KR') : '-',
    high:       latestCandle ? Number(latestCandle.high).toLocaleString('ko-KR') : '-',
    low:        latestCandle ? Number(latestCandle.low).toLocaleString('ko-KR')  : '-',
    volume:     priceSource?.volume != null
                  ? fmtVolume(priceSource.volume)
                  : latestCandle ? fmtVolume(latestCandle.volume) : '-',
    marketType,
  }
  const isUp = stock.change > 0

  const selectModal = isConfigOpen && (
    <StockSelectModal
      currentCode={stockCode}
      currentName={stock.name}
      onSave={handleStockSave}
      onClose={() => setIsConfigOpen(false)}
    />
  )

  // ── variants ──────────────────────────────────────────────────

  if (variant === 'stock-wide') {
    return (
      <>
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
          <div className="flex h-full gap-2.5 min-h-0">
            <div className="flex flex-col shrink-0 justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <StockAvatar name={stock.name} stockCode={stock.code} marketType={stock.marketType} color={stock.color} size="sm" />
                  <div>
                    <div className="flex items-center gap-1">
                      <div className="text-[11px] font-bold text-foreground leading-none">{stock.name}</div>
                      {settingsBtn}
                    </div>
                    <div className="text-[9px] text-foreground-disabled mt-0.5">{stock.code}{stock.marketType ? ` · ${stock.marketType}` : ''}</div>
                  </div>
                </div>
                {periodTabs}
              </div>
              <div>
                <div className="text-[18px] font-bold leading-tight text-foreground">{stock.price}</div>
                {hasPrice
                  ? <div className={`text-[10px] ${isUp ? 'text-up' : 'text-down'}`}>
                      {isUp ? '▲' : '▼'} {stock.changeAmt}원 ({isUp ? '+' : ''}{stock.change}%)
                    </div>
                  : <div className="text-[10px] text-foreground-disabled">-</div>
                }
              </div>
            </div>
            <MiniChart candleData={candleData} liveCandle={isMinute ? liveCandle : null} isMinute={isMinute} className="flex-1 min-h-0" />
          </div>
        </WidgetCard>
        {selectModal}
      </>
    )
  }

  if (variant === 'stock-3x2') {
    return (
      <>
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
          <div className="flex items-start justify-between mb-1.5 shrink-0">
            <div className="flex items-center gap-2">
              <StockAvatar name={stock.name} stockCode={stock.code} marketType={stock.marketType} color={stock.color} size="sm" />
              <div>
                <div className="flex items-center gap-1">
                  <div className="text-[13px] font-bold text-foreground">{stock.name}</div>
                  {settingsBtn}
                </div>
                <div className="text-[9px] text-foreground-disabled">{stock.code}{stock.marketType ? ` · ${stock.marketType}` : ''}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[20px] font-bold leading-tight text-foreground">{stock.price}</div>
              <PriceChange value={stock.change} className="text-[10px]" />
            </div>
          </div>
          <div className="flex items-center shrink-0 mb-1.5">
            {periodTabs}
          </div>
          <MiniChart candleData={candleData} liveCandle={isMinute ? liveCandle : null} isMinute={isMinute} className="flex-1 min-h-0 rounded-xl" />
          <div className="flex justify-between shrink-0 mt-1.5">
            {[
              { label: '시가',  val: stock.open },
              { label: '고가',  val: stock.high },
              { label: '저가',  val: stock.low  },
              { label: '거래량', val: stock.volume },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <div className="text-[8px] text-foreground-disabled">{label}</div>
                <div className="text-[10px] font-semibold text-foreground">{val}</div>
              </div>
            ))}
          </div>
        </WidgetCard>
        {selectModal}
      </>
    )
  }

  if (variant === 'stock-2x2') {
    return (
      <>
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
          <div className="flex items-start justify-between mb-1.5 shrink-0">
            <div className="flex items-center gap-2">
              <StockAvatar name={stock.name} stockCode={stock.code} marketType={stock.marketType} color={stock.color} size="sm" />
              <div>
                <div className="flex items-center gap-1">
                  <div className="text-[13px] font-bold text-foreground">{stock.name}</div>
                  {settingsBtn}
                </div>
                <div className="text-[9px] text-foreground-disabled">{stock.code}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[18px] font-bold leading-tight text-foreground">{stock.price}</div>
              <PriceChange value={stock.change} className="text-[10px]" />
            </div>
          </div>
          <div className="flex shrink-0 mb-1">
            {periodTabs}
          </div>
          <MiniChart candleData={candleData} liveCandle={isMinute ? liveCandle : null} isMinute={isMinute} className="flex-1 min-h-0 rounded-xl mb-1.5" />
          <div className="flex justify-between shrink-0">
            {[
              { label: '시가', val: stock.open },
              { label: '고가', val: stock.high },
              { label: '저가', val: stock.low },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <div className="text-[9px] text-foreground-disabled">{label}</div>
                <div className="text-[11px] font-semibold text-foreground">{val}</div>
              </div>
            ))}
          </div>
        </WidgetCard>
        {selectModal}
      </>
    )
  }

  /* stock-sm (default) */
  return (
    <>
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <StockAvatar name={stock.name} stockCode={stock.code} marketType={stock.marketType} color={stock.color} size="sm" />
            <span className="text-[12px] font-bold text-foreground leading-none">{stock.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-foreground-disabled">{stock.code}</span>
            {settingsBtn}
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-end min-h-0">
          <div className="text-[18px] font-bold leading-tight tracking-tight text-foreground">
            {stock.price}
          </div>
          {hasPrice
            ? <div className={`text-[10px] mt-0.5 ${isUp ? 'text-up' : 'text-down'}`}>
                {isUp ? '▲' : '▼'} {stock.changeAmt}원 ({isUp ? '+' : ''}{stock.change}%)
              </div>
            : <div className="text-[10px] mt-0.5 text-foreground-disabled">-</div>
          }
        </div>
      </WidgetCard>
      {selectModal}
    </>
  )
}
