import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Settings2 } from 'lucide-react'
import StockAvatar from '@/components/ui/StockAvatar'
import PriceChange from '@/components/ui/PriceChange'
import MiniChart from '@/components/ui/MiniChart'
import WidgetCard from './WidgetCard'
import StockSelectModal from './StockSelectModal'
import { HOME_STOCKS } from '@/mocks/home'
import { marketApi } from '@/api/market'
import useWidgetStore from '@/store/useWidgetStore'
import { useDashboardSave } from '@/hooks/useDashboardSync'
import { normalizeDailySeries, normalizeMinuteSeries } from '@/features/invest/domestic/normalize'
import { formatApiDate } from '@/features/invest/formatters'

// config.stockId(레거시) → 종목코드 매핑
const STOCK_CODE_MAP = {
  samsung: '005930',
  skhynix: '000660',
}

const PERIODS = ['1일', '1주', '1달', '3달']

const PERIOD_CONFIG = {
  '1일': { type: 'minute', ncnt: 5              },
  '1주': { type: 'daily',  period: 'DAILY',   days: 7   },
  '1달': { type: 'daily',  period: 'DAILY',   days: 30  },
  '3달': { type: 'daily',  period: 'WEEKLY',  days: 90  },
}

function fmtVolume(v) {
  if (v == null) return '-'
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`
  if (v >= 10_000) return `${Math.round(v / 10_000).toLocaleString('ko-KR')}만`
  return v.toLocaleString('ko-KR')
}


export default function StockChartWidget({ instanceId, variant = 'stock-sm', colSpan = 1, rowSpan = 1, onDelete, config = {} }) {
  const [activePeriod, setActivePeriod] = useState('1일')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const updateWidgetConfig = useWidgetStore((s) => s.updateWidgetConfig)
  const { mutate: saveDashboard } = useDashboardSave()

  const stockId      = config.stockId ?? 'samsung'
  const stockCode    = config.stockCode ?? STOCK_CODE_MAP[stockId]
  const stockName    = config.stockName ?? null
  const stockMeta    = HOME_STOCKS.find((s) => s.id === stockId) ?? HOME_STOCKS[0]

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

  const { data: priceData } = useQuery({
    queryKey: ['stock', 'price', stockCode],
    queryFn:  () => marketApi.getCurrentPrice(stockCode),
    enabled:  !!stockCode,
    staleTime: 5_000,
    refetchInterval: 10_000,
  })

  const queryClient = useQueryClient()

  // 위젯 마운트 시 모든 기간 데이터를 백그라운드 prefetch
  useEffect(() => {
    if (!stockCode) return
    const end = formatApiDate(new Date())
    Object.values(PERIOD_CONFIG).forEach((cfg) => {
      if (cfg.type === 'minute') {
        queryClient.prefetchQuery({
          queryKey: ['stock', 'minute-chart', stockCode, cfg.ncnt],
          queryFn:  () => marketApi.getMinuteChart(stockCode, { ncnt: cfg.ncnt }),
          staleTime: 60_000,
        })
      } else {
        const start = formatApiDate(new Date(Date.now() - cfg.days * 24 * 60 * 60 * 1000))
        queryClient.prefetchQuery({
          queryKey: ['stock', 'chart', cfg.period, stockCode, start, end],
          queryFn:  () => marketApi.getChart(stockCode, { period: cfg.period, startDate: start, endDate: end }),
          staleTime: 5 * 60 * 1000,
        })
      }
    })
  }, [stockCode, queryClient])

  const periodCfg = PERIOD_CONFIG[activePeriod]
  const isMinute  = periodCfg.type === 'minute'

  const endDate   = useMemo(() => formatApiDate(new Date()), [])
  const startDate = useMemo(
    () => isMinute ? null : formatApiDate(new Date(Date.now() - periodCfg.days * 24 * 60 * 60 * 1000)),
    [isMinute, periodCfg.days]
  )

  const { data: minuteRaw } = useQuery({
    queryKey: ['stock', 'minute-chart', stockCode, periodCfg.ncnt],
    queryFn:  () => marketApi.getMinuteChart(stockCode, { ncnt: periodCfg.ncnt }),
    enabled:  !!stockCode && isMinute,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const { data: chartRaw } = useQuery({
    queryKey: ['stock', 'chart', periodCfg.period, stockCode, startDate, endDate],
    queryFn:  () => marketApi.getChart(stockCode, { period: periodCfg.period, startDate, endDate }),
    enabled:  !!stockCode && !isMinute,
    staleTime: 5 * 60 * 1000,
  })

  const { miniChartData, latestCandle } = useMemo(() => {
    const series = isMinute
      ? normalizeMinuteSeries(minuteRaw?.data ?? minuteRaw)
      : normalizeDailySeries(chartRaw?.data)
    return {
      miniChartData: series.map((p, i) => ({ time: i, value: p.close })),
      latestCandle:  series[series.length - 1] ?? null,
    }
  }, [isMinute, minuteRaw, chartRaw])

  const hasPrice = priceData != null
  const stock = {
    ...stockMeta,
    name:      stockName ?? stockMeta.name,
    code:      stockCode ?? stockMeta.code,
    price:     priceData?.currentPrice != null
                 ? Number(priceData.currentPrice).toLocaleString('ko-KR')
                 : '-',
    change:    priceData?.changeRate ?? 0,
    changeAmt: priceData?.changeAmount != null
                 ? Math.abs(Number(priceData.changeAmount)).toLocaleString('ko-KR')
                 : '-',
    open:       latestCandle ? Number(latestCandle.open).toLocaleString('ko-KR') : '-',
    high:       latestCandle ? Number(latestCandle.high).toLocaleString('ko-KR') : '-',
    low:        latestCandle ? Number(latestCandle.low).toLocaleString('ko-KR')  : '-',
    volume:     priceData?.volume != null
                  ? fmtVolume(priceData.volume)
                  : latestCandle ? fmtVolume(latestCandle.volume) : '-',
    marketType: config.marketType ?? stockMeta.market ?? null,
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

  if (variant === 'stock-wide') {
    return (
      <>
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
          <div className="flex h-full gap-2.5 min-h-0">
            <div className="flex flex-col justify-between shrink-0">
              <div>
                <div className="flex items-center gap-1">
                  <div className="text-[11px] font-bold text-foreground leading-none">{stock.name}</div>
                  {settingsBtn}
                </div>
                <div className="text-[9px] text-foreground-disabled mt-0.5">{stock.code}{stock.marketType ? ` · ${stock.marketType}` : ''}</div>
              </div>
              <div>
                <div className={`text-[18px] font-bold leading-tight text-foreground`}>{stock.price}</div>
                {hasPrice
                  ? <div className={`text-[10px] ${isUp ? 'text-up' : 'text-down'}`}>
                      {isUp ? '▲' : '▼'} {stock.changeAmt}원 ({isUp ? '+' : ''}{stock.change}%)
                    </div>
                  : <div className="text-[10px] text-foreground-disabled">-</div>
                }
              </div>
            </div>
            <MiniChart data={miniChartData} isUp={isUp} className="flex-1 min-h-0" />
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
              <div className={`text-[20px] font-bold leading-tight text-foreground`}>{stock.price}</div>
              <PriceChange value={stock.change} className="text-[10px]" />
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0 mb-1.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={(e) => { e.stopPropagation(); setActivePeriod(p) }}
                className={`text-[9px] px-1.5 py-0.5 rounded font-medium transition-colors duration-[150ms] ${activePeriod === p ? 'bg-primary-light text-primary' : 'text-foreground-disabled hover:text-foreground'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <MiniChart data={miniChartData} isUp={isUp} className="flex-1 min-h-0 rounded-xl" />
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
              <div className={`text-[18px] font-bold leading-tight text-foreground`}>{stock.price}</div>
              <PriceChange value={stock.change} className="text-[10px]" />
            </div>
          </div>
          <MiniChart data={miniChartData} isUp={isUp} className="flex-1 min-h-0 rounded-xl my-1.5" />
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
          <span className="text-[12px] font-bold text-foreground leading-none">{stock.name}</span>
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
