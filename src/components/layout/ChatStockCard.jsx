import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import StockAvatar from '@/components/ui/StockAvatar'
import PriceChange from '@/components/ui/PriceChange'
import MiniChart from '@/components/ui/MiniChart'
import { marketApi, foreignMarketApi } from '@/api/market'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import useStompSubscription from '@/hooks/useStompSubscription'
import { normalizeDailySeries, normalizeMinuteSeries } from '@/features/invest/domestic/normalize'
import { normalizeForeignDailySeries, normalizeForeignMinuteSeries } from '@/features/invest/foreign/normalize'
import { formatApiDate } from '@/features/invest/formatters'
import { getLatestMinuteSession } from '@/features/invest/marketData'

function fmtVolume(v) {
  if (v == null) return '-'
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`
  if (v >= 10_000) return `${Math.round(v / 10_000).toLocaleString('ko-KR')}만`
  return v.toLocaleString('ko-KR')
}

const OVERSEAS_MARKET_TYPES = ['NASDAQ', 'NYSE', 'AMEX']
const EXCHCD_BY_EXCHANGE_CODE = { NAS: '82', NYS: '81', AMS: '81' }
const EXCHCD_BY_MARKET_TYPE   = { NASDAQ: '82', NYSE: '81', AMEX: '81' }

const PERIODS = ['1일', '1주', '1달', '3달']

const PERIOD_CONFIG = {
  '1일': { type: 'minute', ncnt: 5,  nmin: 5,  filterToday: true,  tradingDays: null },
  '1주': { type: 'minute', ncnt: 30, nmin: 30, filterToday: false, tradingDays: 5,
           overseasType: 'daily', foreignPeriod: 'DAY', days: 7  },
  '1달': { type: 'minute', ncnt: 60, nmin: 60, filterToday: false, tradingDays: 20,
           overseasType: 'daily', foreignPeriod: 'DAY', days: 30 },
  '3달': { type: 'daily',  period: 'DAILY',  foreignPeriod: 'DAY', days: 90 },
}

function toMinuteBucketTime(chetime) {
  const hh = parseInt(chetime.slice(0, 2), 10)
  const mm = parseInt(chetime.slice(2, 4), 10)
  const bucketMm = Math.floor(mm / 5) * 5
  const now = new Date()
  const ts = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, bucketMm, 0).getTime()
  return Math.floor(ts / 1000)
}

function isWithinRegularSession(timestampMs) {
  const d = new Date(timestampMs)
  const minutes = d.getHours() * 60 + d.getMinutes()
  return minutes >= 9 * 60 && minutes <= 15 * 60 + 30
}

export default function ChatStockCard({ stockCode, stockName, marketType, exchangeCode }) {
  const [activePeriod, setActivePeriod] = useState('1일')
  const [livePrice, setLivePrice]   = useState(null)
  const [liveCandle, setLiveCandle] = useState(null)
  const openDetail = useWidgetDetailStore((s) => s.open)

  const isOverseas = OVERSEAS_MARKET_TYPES.includes(marketType)
  const exchcd = isOverseas
    ? (EXCHCD_BY_EXCHANGE_CODE[exchangeCode] ?? EXCHCD_BY_MARKET_TYPE[marketType] ?? '82')
    : null

  useEffect(() => {
    setLivePrice(null)
    setLiveCandle(null)
  }, [stockCode])

  const handleClick = () => {
    openDetail({
      widgetTypeId: 'stock-chart',
      config: { stockCode, stockName, marketType, exchangeCode, widgetPeriod: activePeriod },
    })
  }

  // ── REST 가격 ────────────────────────────────────────────────────
  const { data: priceRaw } = useQuery({
    queryKey: isOverseas ? ['foreign', 'price', stockCode, exchcd] : ['stock', 'price', stockCode],
    queryFn:  isOverseas
      ? () => foreignMarketApi.getCurrentPrice(stockCode, exchcd)
      : () => marketApi.getCurrentPrice(stockCode),
    enabled:  !!stockCode,
    staleTime: 30_000,
  })

  const priceData = isOverseas && priceRaw
    ? { currentPrice: priceRaw.price, changeRate: priceRaw.rate, changeAmount: priceRaw.diff }
    : priceRaw

  // ── 차트 prefetch ───────────────────────────────────────────────
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!stockCode) return
    const end = formatApiDate(new Date())
    Object.values(PERIOD_CONFIG).forEach((cfg) => {
      const effectiveCfgType = isOverseas ? (cfg.overseasType ?? cfg.type) : cfg.type
      if (effectiveCfgType === 'minute') {
        if (isOverseas) {
          queryClient.prefetchQuery({
            queryKey: ['foreign', 'minuteChart', stockCode, exchcd, cfg.nmin],
            queryFn:  () => foreignMarketApi.getMinuteChart(stockCode, exchcd, { nmin: cfg.nmin }),
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

  const periodCfg     = PERIOD_CONFIG[activePeriod]
  const effectiveType = isOverseas ? (periodCfg.overseasType ?? periodCfg.type) : periodCfg.type
  const isMinute      = effectiveType === 'minute'
  const isIntraday    = activePeriod === '1일'

  const endDate   = useMemo(() => formatApiDate(new Date()), [])
  const startDate = useMemo(
    () => isMinute ? null : formatApiDate(new Date(Date.now() - periodCfg.days * 24 * 60 * 60 * 1000)),
    [isMinute, periodCfg.days]
  )

  const { data: minuteRaw } = useQuery({
    queryKey: isOverseas
      ? ['foreign', 'minuteChart', stockCode, exchcd, periodCfg.nmin]
      : ['stock', 'minute-chart', stockCode, periodCfg.ncnt],
    queryFn: isOverseas
      ? () => foreignMarketApi.getMinuteChart(stockCode, exchcd, { nmin: periodCfg.nmin })
      : () => marketApi.getMinuteChart(stockCode, { ncnt: periodCfg.ncnt }),
    enabled:  !!stockCode && isMinute,
    staleTime: 60_000,
    refetchInterval: isOverseas && isMinute ? 60_000 : false,
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

  // ── STOMP 실시간 (국내 전용) ─────────────────────────────────────
  const liveTrade = useStompSubscription(!isOverseas && stockCode ? `/topic/stock/trade/${stockCode}` : null)

  useEffect(() => {
    if (!liveTrade) return
    const price  = Number(liveTrade.price)
    const volume = Number(liveTrade.cvolume)
    if (!price || !volume) return

    const chetime = liveTrade.chetime ?? ''
    if (chetime.length < 4) return
    const time = toMinuteBucketTime(chetime)

    if (isIntraday) {
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
  }, [liveTrade, isIntraday])

  // ── 차트 데이터 정규화 ───────────────────────────────────────────
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const { candleData, latestCandle, dayOpen, dayHigh, dayLow, dayVolume, isCurrentSession } = useMemo(() => {
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

    let isCurrentSession = true
    if (periodCfg.filterToday && !isOverseas) {
      const latestSession = getLatestMinuteSession(series)
      if (latestSession.length > 0) {
        const regularSession = latestSession.filter((p) => isWithinRegularSession(p.timestamp))
        series = regularSession.length > 0 ? regularSession : latestSession
      }
      isCurrentSession = series.some((p) => p.sessionDate === todayKey)
    } else if (periodCfg.tradingDays) {
      const dateKey = (p) => p.sessionDate ?? p.date
      const dates = [...new Set(series.map(dateKey))].sort()
      const cutoffDate = dates[Math.max(0, dates.length - periodCfg.tradingDays)]
      const filtered = series.filter((p) => dateKey(p) >= cutoffDate)
      if (filtered.length > 0) series = filtered
    }

    const toTime = (p) => Math.floor(p.timestamp / 1000)
    const latestCandle = series[series.length - 1] ?? null
    const dayOpen  = series[0]?.open ?? null
    const dayHigh  = series.length > 0 ? Math.max(...series.map((p) => p.high)) : null
    const dayLow   = series.length > 0 ? Math.min(...series.map((p) => p.low))  : null
    const dayVolume = series.length > 0 ? series.reduce((sum, p) => sum + (p.volume ?? 0), 0) : null
    return {
      candleData: series.map((p) => ({ time: toTime(p), open: p.open, high: p.high, low: p.low, close: p.close })),
      latestCandle,
      dayOpen,
      dayHigh,
      dayLow,
      dayVolume,
      isCurrentSession,
    }
  }, [isMinute, isOverseas, minuteRaw, chartRaw, periodCfg.filterToday, periodCfg.tradingDays, todayKey])

  const isForceFit = isIntraday && (isOverseas || !isCurrentSession)

  // ── 가격 표시 (STOMP > REST) ─────────────────────────────────────
  const priceSource = livePrice ?? priceData
  const hasPrice    = priceSource != null
  const isUp        = (priceSource?.changeRate ?? 0) > 0

  const stock = {
    price: priceSource?.currentPrice != null
      ? Number(priceSource.currentPrice).toLocaleString('ko-KR') : '-',
    change:    priceSource?.changeRate ?? 0,
    open:   dayOpen   != null ? Number(dayOpen).toLocaleString('ko-KR')  : '-',
    high:   dayHigh   != null ? Number(dayHigh).toLocaleString('ko-KR')  : '-',
    low:    dayLow    != null ? Number(dayLow).toLocaleString('ko-KR')   : '-',
    volume: priceSource?.volume != null
      ? fmtVolume(priceSource.volume)
      : dayVolume != null ? fmtVolume(dayVolume) : '-',
  }

  return (
    <div
      onClick={handleClick}
      className="bg-surface border border-stroke rounded-2xl p-3 cursor-pointer hover:bg-surface-alt transition-colors duration-150 w-full"
    >
      {/* 헤더: 종목 정보 + 가격 */}
      <div className="flex items-start justify-between mb-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <StockAvatar name={stockName} stockCode={stockCode} marketType={marketType} size="sm" />
          <div>
            <div className="text-widget-13 font-bold text-foreground">{stockName}</div>
            <div className="text-widget-9 text-foreground-disabled">
              {stockCode}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-widget-20 font-bold leading-tight text-foreground">{stock.price}</div>
          <PriceChange value={stock.change} className="text-widget-10" />
        </div>
      </div>

      {/* 기간 탭 */}
      <div className="flex items-center shrink-0 mb-1.5 gap-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={(e) => { e.stopPropagation(); setActivePeriod(p) }}
            className={`text-widget-9 px-1.5 py-0.5 rounded font-medium transition-colors duration-[150ms] ${
              activePeriod === p ? 'bg-primary-light text-primary' : 'text-foreground-disabled hover:text-foreground'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* 미니차트 */}
      <MiniChart
        candleData={candleData}
        liveCandle={isIntraday ? liveCandle : null}
        isIntraday={isIntraday}
        isForceFit={isForceFit}
        className="w-full h-[96px] rounded-xl mb-1.5"
      />

      {/* 시가/고가/저가/거래량 */}
      <div className="flex justify-between shrink-0 mt-1.5">
        {[
          { label: '시가',  val: stock.open },
          { label: '고가',  val: stock.high },
          { label: '저가',  val: stock.low  },
          { label: '거래량', val: stock.volume },
        ].map(({ label, val }) => (
          <div key={label} className="text-center">
            <div className="text-widget-9 text-foreground-disabled">{label}</div>
            <div className="text-widget-11 font-semibold text-foreground">{val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
