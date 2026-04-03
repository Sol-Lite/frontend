import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import { usePortfolioColors } from '@/features/portfolio/portfolioColors'
import StockAvatar from '@/components/ui/StockAvatar'
import { cn } from '@/lib/cn'
import ExchangeModal from '@/components/asset/ExchangeModal'
import useAuthStore from '@/store/useAuthStore'
import useUIStore from '@/store/useUIStore'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import { useMyAccount } from '@/api/account'
import { useAssetPage } from '@/features/asset/useAssetPage'


// ── 유틸 ──────────────────────────────────────────────────────────
function fmt(n) {
  return Math.round(Number(n ?? 0)).toLocaleString('ko-KR')
}
function fmtDate(d) {
  if (!d) return '-'
  const dt = new Date(d)
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
}
function fmtRate(r) {
  if (r == null) return '-'
  return (r >= 0 ? '+' : '') + Number(r).toFixed(2) + '%'
}
function fmtSigned(n, suffix = '') {
  const value = Number(n ?? 0)
  return `${value >= 0 ? '+' : '-'}${fmt(Math.abs(value))}${suffix}`
}
function fmtCompactCurrency(n) {
  const value = Number(n ?? 0)
  if (Math.abs(value) >= 100000000) return `${(value / 100000000).toFixed(1)}억`
  if (Math.abs(value) >= 10000) return `${(value / 10000).toFixed(0)}만`
  return fmt(value)
}
function fmtUsd(n) {
  return Number(n ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

const ASSET_FLOW_RANGES = [
  { key: '1W', label: '1주' },
  { key: '1M', label: '1달' },
  { key: 'ALL', label: '전체' },
]

const ASSET_FLOW_MODES = [
  { key: 'assets', label: '총자산' },
  { key: 'return', label: '누적수익률' },
]

// ── Hero 섹션 ─────────────────────────────────────────────────────
function HeroSection({ data, user, onExchange }) {
  const { isLoading, totalAssets, accountProfit, accountProfitRate, isAccountProfit, krwDeposit, krwAvailable, usdBal } = data
  const blank = isLoading ? '-' : null

  return (
    <div className="shrink-0 bg-surface border-b border-stroke px-6 py-2.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] text-foreground-disabled mb-1">
            {user?.name ?? '–'} 님의 총 평가자산
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-black text-foreground tracking-tight leading-none">
              {blank ?? fmt(totalAssets)}
            </span>
            <span className="text-[13px] text-foreground-disabled">원</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`text-[13px] font-bold ${isAccountProfit ? 'text-up' : 'text-down'}`}>
              {blank ?? ((isAccountProfit ? '+' : '') + fmt(accountProfit ?? 0) + '원')}
            </span>
            <span className={`text-[11px] font-semibold ${isAccountProfit ? 'text-up' : 'text-down'}`}>
              {blank ?? fmtRate(accountProfitRate)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[9px] font-semibold text-foreground-disabled mb-0.5">KRW 예수금</div>
              <div className="text-[13px] font-bold text-foreground">
                {blank ?? fmt(krwDeposit)}<span className="text-[10px] text-foreground-disabled ml-0.5">원</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-semibold text-foreground-disabled mb-0.5">주문가능금액</div>
              <div className="text-[13px] font-bold text-primary">
                {blank ?? fmt(krwAvailable)}<span className="text-[10px] text-foreground-disabled ml-0.5">원</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-semibold text-foreground-disabled mb-0.5">USD 잔고</div>
              <div className="text-[13px] font-bold text-foreground">{blank ?? ('$' + fmtUsd(usdBal))}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onExchange}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold shadow-primary-btn hover:bg-primary-hover transition-colors"
            >
              <ArrowLeftRight className="w-3 h-3" strokeWidth={2.5} />환전하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 계좌 카드 ─────────────────────────────────────────────────────
function AccountCard({ data }) {
  const { startDate, simReturn, isSimProfit, isLoading } = data
  const { data: accountInfo } = useMyAccount()

  const accountNumber = accountInfo?.accountNumber ?? '-'
  const accountName = accountInfo?.accountName ?? '종합계좌'

  return (
    <section className="flex h-full min-w-0 flex-col border-r border-stroke-subtle">
      <div className="flex min-h-[44px] items-center px-5">
        <div className="text-[13px] font-bold text-foreground">계좌</div>
      </div>
      <div className="h-px bg-stroke-subtle" />
      <div className="flex flex-1 flex-col gap-2 px-5 py-2.5">
        <div className="text-[13px] font-bold text-foreground">{accountName}</div>
        <div className="text-[11px] text-foreground-disabled mt-0.5">{accountNumber}</div>
      </div>
      <div className="flex flex-col gap-2 px-5 pb-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-foreground-disabled">현재 수익률</span>
          <span className={`text-[15px] font-black ${isSimProfit ? 'text-up' : 'text-down'}`}>
            {isLoading ? '-' : fmtRate(simReturn)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-foreground-disabled">시작일</span>
          <span className="text-[11px] font-semibold text-foreground">{fmtDate(startDate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-foreground-disabled">초기금</span>
          <span className="text-[11px] font-semibold text-foreground">1억원</span>
        </div>
      </div>
    </section>
  )
}

// ── 자산 구성 카드 ────────────────────────────────────────────────
function AssetBreakdownCard({ data }) {
  const { domesticEval, domesticPnl, overseasEval, overseasPnl, krwDeposit, usdBal, isLoading } = data
  const blank = isLoading ? '-' : null

  const domesticInvested = domesticEval - domesticPnl
  const overseasInvested = overseasEval - overseasPnl
  const domesticRate = domesticInvested > 0 ? (domesticPnl / domesticInvested) * 100 : 0
  const overseasRate = overseasInvested > 0 ? (overseasPnl / overseasInvested) * 100 : 0

  const rows = [
    {
      label: '국내주식',
      value: blank ?? fmt(domesticEval) + '원',
      pnl: domesticPnl,
      rate: domesticRate,
    },
    {
      label: '해외주식',
      value: blank ?? fmt(overseasEval) + '원',
      pnl: overseasPnl,
      rate: overseasRate,
    },
    { label: 'KRW 현금', value: blank ?? fmt(krwDeposit) + '원', pnl: null },
    { label: 'USD 현금', value: blank ?? ('$' + fmtUsd(usdBal)), pnl: null },
  ]

  return (
    <section className="flex h-full min-w-0 flex-col border-r border-stroke-subtle">
      <div className="flex min-h-[44px] items-center px-5">
        <div className="text-[13px] font-bold text-foreground">자산 구성</div>
      </div>
      <div className="h-px bg-stroke-subtle" />
      <div className="flex flex-1 flex-col gap-1.5 px-5 py-2.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-stroke-subtle last:border-0">
          <span className="text-[11px] text-foreground-secondary">{row.label}</span>
          <div className="text-right">
            <div className="text-[13px] font-bold text-foreground">{row.value}</div>
            {row.pnl != null && !isLoading && (
              <div className={`text-[10px] font-semibold ${row.pnl >= 0 ? 'text-up' : 'text-down'}`}>
                {(row.pnl >= 0 ? '+' : '') + fmt(row.pnl) + '원'} ({fmtRate(row.rate)})
              </div>
            )}
          </div>
        </div>
      ))}
      </div>
    </section>
  )
}

// ── 자산 흐름 카드 ────────────────────────────────────────────────
function AssetFlowCard({ data, assetFlowRange, onChangeAssetFlowRange }) {
  const { isAccountProfit, assetFlowPoints } = data
  const hasFlow = assetFlowPoints.length > 0
  const [mode, setMode] = useState('assets')
  const [chartOpacity, setChartOpacity] = useState(1)
  const pendingMode = useRef(null)
  const theme = useUIStore((s) => s.theme)
  const splitLineColor = theme === 'dark' ? '#252836' : '#F2F4F7'

  function handleModeChange(newMode) {
    if (newMode === mode) return
    pendingMode.current = newMode
    setChartOpacity(0)
  }

  function handleTransitionEnd() {
    if (pendingMode.current === null) return
    setMode(pendingMode.current)
    pendingMode.current = null
    setChartOpacity(1)
  }

  const isAssetMode = mode === 'assets'
  const seriesData = isAssetMode
    ? assetFlowPoints.map((point) => point.totalAssets)
    : assetFlowPoints.map((point) => point.cumulativeReturnRate)
  const chartColor = isAssetMode
    ? (isAccountProfit ? '#16A34A' : '#E11D48')
    : ((assetFlowPoints[assetFlowPoints.length - 1]?.cumulativeReturnRate ?? 0) >= 0 ? '#16A34A' : '#E11D48')

  const chartOption = {
    backgroundColor: 'transparent',
    grid: { left: 50, right: 10, top: 8, bottom: 16, containLabel: false },
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      confine: false,
      backgroundColor: '#FFFFFF',
      borderColor: '#EAECF0',
      borderWidth: 1,
      borderRadius: 10,
      padding: [10, 12],
      textStyle: { color: '#191F28' },
      extraCssText: 'box-shadow:0 8px 24px rgba(15,23,42,0.12); z-index: 9999;',
      formatter: (params) => {
        const point = params?.[0]
        if (!point) return ''
        const raw = assetFlowPoints[point.dataIndex]
        return [
          `<div style="font-size:12px;font-weight:700">${raw.date}</div>`,
          `<div style="margin-top:4px;font-size:12px">총자산 <b>${fmt(raw.totalAssets)}원</b></div>`,
          `<div style="font-size:12px">누적수익률 <b>${fmtRate(raw.cumulativeReturnRate)}</b></div>`,
          `<div style="font-size:12px">전일대비 <b>${fmtRate(raw.dailyReturnRate)}</b></div>`,
        ].join('')
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: assetFlowPoints.map((point) => point.date.slice(5).replace('-', '.')),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9CA3AF', fontSize: 10, margin: 12 },
    },
    yAxis: {
      type: 'value',
      splitNumber: 3,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: splitLineColor } },
      axisLabel: {
        color: '#9CA3AF',
        fontSize: 10,
        margin: 10,
        formatter: (value) => isAssetMode ? `${fmtCompactCurrency(value)}원` : fmtRate(value),
      },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        showSymbol: assetFlowPoints.length === 1,
        symbolSize: 7,
        data: seriesData,
        lineStyle: { width: 3, color: chartColor },
        itemStyle: { color: chartColor },
      },
    ],
  }

  return (
    <section className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="flex min-h-[44px] items-center justify-between gap-3 px-5">
        <div className="text-[13px] font-bold text-foreground">자산 흐름</div>
        <div className="flex items-center rounded-lg bg-surface-muted p-0.5">
          {ASSET_FLOW_MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleModeChange(key)}
              className={cn(
                'rounded-md px-2.5 py-0.5 text-[10px] font-semibold transition-all',
                mode === key
                  ? 'bg-primary text-white shadow-control'
                  : 'text-foreground-disabled hover:text-foreground-secondary',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-px bg-stroke-subtle" />
      <div className="flex justify-end px-5 py-1 shrink-0">
        <div className="flex items-center rounded-lg bg-surface-muted p-0.5">
          {ASSET_FLOW_RANGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onChangeAssetFlowRange(key)}
              className={cn(
                'rounded-md px-2.5 py-0.5 text-[10px] font-semibold transition-all',
                assetFlowRange === key
                  ? 'bg-primary text-white shadow-control'
                  : 'text-foreground-disabled hover:text-foreground-secondary',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex-1 min-h-0 overflow-hidden px-5 pb-3"
        style={{ opacity: chartOpacity, transition: 'opacity 150ms ease' }}
        onTransitionEnd={handleTransitionEnd}
      >
        {hasFlow ? (
          <ReactECharts option={chartOption} style={{ width: '100%', height: '100%' }} opts={{ renderer: 'svg' }} />
        ) : (
          <div className="flex items-center justify-center h-full text-[11px] text-foreground-disabled">
            데이터 없음
          </div>
        )}
      </div>

    </section>
  )
}


// ── 포트폴리오 파이차트 패널 (하단 좌) ───────────────────────────
function PortfolioPanel({ data }) {
  const { portfolioItems } = data

  const { getColor, ready } = usePortfolioColors(portfolioItems)
  const hasItems = portfolioItems.length > 0

  const sortedItems = [...portfolioItems].sort((a, b) => b.weight - a.weight)
  const primaryItems = sortedItems.slice(0, 5)
  const restWeight = sortedItems.slice(5).reduce((sum, item) => sum + item.weight, 0)
  const summaryItems = restWeight > 0
    ? [...primaryItems, { label: '기타', weight: restWeight, stockCode: null, marketType: null, type: 'STOCK' }]
    : primaryItems

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (p) =>
        `<div style="display:flex;flex-direction:column;gap:2px;min-width:100px">` +
          `<div style="display:flex;align-items:center;gap:6px">` +
            `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>` +
            `<span style="font-size:12px;font-weight:700;color:#191F28">${p.name}</span>` +
          `</div>` +
          `<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:2px">` +
            `<span style="font-size:10px;color:#9CA3AF">비중</span>` +
            `<span style="font-size:13px;font-weight:800;color:#0046FF">${p.value}%</span>` +
          `</div>` +
        `</div>`,
      backgroundColor: '#FFFFFF',
      borderColor: '#EAECF0',
      borderWidth: 1,
      borderRadius: 10,
      padding: [10, 12],
      extraCssText: 'box-shadow:0 4px 16px rgba(0,0,0,0.10);',
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '78%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: {
          borderWidth: 0,
        },
        emphasis: {
          scale: true,
          scaleSize: 6,
          itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.25)' },
        },
        data: sortedItems.map((item, i) => ({
          name: item.label,
          value: item.weight,
          itemStyle: { color: getColor(item, i) },
        })),
      },
    ],
  }

  return (
    <div className="flex min-h-0 w-[490px] shrink-0 flex-col overflow-hidden border-r border-stroke bg-surface">
      <div className="flex min-h-[44px] items-center border-b border-stroke px-4 py-2.5 shrink-0">
        <div className="text-[13px] font-bold text-foreground">포트폴리오</div>
      </div>

      <div className="flex min-h-0 flex-1 items-center gap-4 px-5 py-4">
        {hasItems ? (
          <>
            <div className="relative h-[260px] w-[260px] shrink-0">
              {ready && <ReactECharts
                option={chartOption}
                className="w-full h-full"
                opts={{ renderer: 'svg' }}
              />}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              {summaryItems.map((item, i) => {
                const color = getColor(item, i)
                return (
                  <div key={item.label} className="flex items-center justify-between gap-3 border-b border-stroke-subtle pb-2 last:border-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-[3px] bg-[var(--dot-color)]" style={{ '--dot-color': color }} />
                      <span className="truncate text-[12px] font-semibold text-foreground-secondary">{item.label}</span>
                    </div>
                    <span className="shrink-0 text-[18px] font-black text-foreground">{item.weight}%</span>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-[11px] text-foreground-disabled">데이터 없음</span>
          </div>
        )}
      </div>
    </div>
  )
}

const EXCHANGE_CODE_BY_MARKET_TYPE = { NASDAQ: 'NAS', NYSE: 'NYS', AMEX: 'AMS' }

// ── 보유 종목 행 ──────────────────────────────────────────────────
function HoldingRow({ h }) {
  const { stockName, stockCode, marketType, qty, cur, avg, investedLocal, pnl, pnlRate, isUp, isKrw, hasCurrentPrice } = h
  const open = useWidgetDetailStore((s) => s.open)

  function handleClick() {
    open({
      widgetTypeId: 'stock-chart',
      config: {
        stockCode,
        stockName,
        marketType,
        exchangeCode: EXCHANGE_CODE_BY_MARKET_TYPE[marketType] ?? null,
      },
    })
  }

  return (
    <div onClick={handleClick} className="grid grid-cols-[1fr_62px_82px_78px_92px] items-center px-4 py-2.5 border-b border-stroke-subtle cursor-pointer hover:bg-surface-subtle transition-colors">
      <div className="flex items-center gap-2.5">
        <StockAvatar name={stockName} stockCode={stockCode} marketType={marketType} size="md" />
        <div className="min-w-0">
          <div className="text-[12px] font-bold text-foreground truncate">{stockName}</div>
          <div className="text-[9px] text-foreground-disabled">{marketType}</div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-[12px] font-bold text-foreground">{fmt(qty)}주</div>
        <div className="text-[9px] text-foreground-disabled">
          {isKrw ? fmt(avg) : `$${Number(avg).toFixed(1)}`}
        </div>
      </div>

      <div className="text-right text-[11px] font-bold text-foreground-secondary">
        {isKrw ? `${fmtCompactCurrency(investedLocal)}원` : `$${fmtUsd(investedLocal)}`}
      </div>

      <div className={hasCurrentPrice ? `text-right text-[12px] font-extrabold ${isUp ? 'text-up' : 'text-down'}` : 'text-right text-[12px] font-bold text-foreground-disabled'}>
        {hasCurrentPrice
          ? (isKrw ? fmt(cur) : `$${Number(cur).toFixed(2)}`)
          : '-'}
      </div>

      <div className="text-right">
        <div className={pnl != null ? `text-[12px] font-extrabold ${isUp ? 'text-up' : 'text-down'}` : 'text-[12px] font-bold text-foreground-disabled'}>
          {pnl != null ? fmtSigned(pnl) : '-'}
        </div>
        <div className={pnlRate != null ? `text-[9px] font-bold ${isUp ? 'text-up' : 'text-down'}` : 'text-[9px] font-semibold text-foreground-disabled'}>
          {pnlRate != null ? fmtRate(pnlRate) : '-'}
        </div>
      </div>
    </div>
  )
}

// ── 보유 종목 패널 (하단 우) ──────────────────────────────────────
function HoldingsPanel({ data }) {
  const [filter, setFilter] = useState('all')
  const { domesticRows, overseasRows, isLoading } = data

  const allRows = [...domesticRows, ...overseasRows]
    .sort((a, b) => (b.evalKrw ?? 0) - (a.evalKrw ?? 0))

  const rows = filter === 'domestic' ? domesticRows
    : filter === 'overseas' ? overseasRows
    : allRows

  const totalEval = rows.reduce((s, h) => s + (h.evalKrw ?? 0), 0)
  const totalPnl = rows.reduce((s, h) => s + (h.pnl ?? 0), 0)
  const totalIsUp = totalPnl >= 0

  const filters = [
    { key: 'all',      label: '전체' },
    { key: 'domestic', label: '국내주식' },
    { key: 'overseas', label: '해외주식' },
  ]

  return (
    <div className="flex-1 min-w-0 bg-surface flex flex-col overflow-hidden">

      {/* 헤더: 필터 + 시간 */}
      <div className="shrink-0 flex min-h-[44px] items-center justify-between px-4 border-b border-stroke">
        <div className="text-[13px] font-bold text-foreground">보유종목</div>
        <div className="flex items-center rounded-lg bg-surface-muted p-0.5">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-md px-2.5 py-0.5 text-[10px] font-semibold transition-all',
                filter === key
                  ? 'bg-primary text-white shadow-control'
                  : 'text-foreground-disabled hover:text-foreground-secondary',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 컬럼 헤더 */}
      <div className="shrink-0 grid grid-cols-[1fr_62px_82px_78px_92px] items-center px-4 py-1.5 bg-surface-subtle border-b border-stroke text-[9px] font-semibold text-foreground-disabled">
        <span>종목</span>
        <span className="text-right">수량 / 평균단가</span>
        <span className="text-right">매수금액</span>
        <span className="text-right">현재가</span>
        <span className="text-right">평가손익</span>
      </div>

      {/* 종목 목록 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-20 text-[11px] text-foreground-disabled">
            불러오는 중…
          </div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="flex items-center justify-center h-20 text-[11px] text-foreground-disabled">
            보유 종목 없음
          </div>
        )}
        {rows.map((h) => <HoldingRow key={h.holdingId} h={h} />)}
      </div>

      {/* 합계 */}
      {!isLoading && rows.length > 0 && (
        <div className="shrink-0 flex items-center justify-between gap-6 border-t border-stroke bg-surface-subtle px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-foreground">합계</span>
            <span className="text-[9px] text-foreground-disabled">{rows.length}종목</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-[9px] text-foreground-disabled">평가금액</div>
              <div className="text-[12px] font-bold text-foreground">{fmt(totalEval)}원</div>
            </div>

            <div className="text-right">
              <div className="text-[9px] text-foreground-disabled">평가손익</div>
              <div className={`text-[12px] font-extrabold ${totalIsUp ? 'text-up' : 'text-down'}`}>
                {fmtSigned(totalPnl, '원')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 미인증 ────────────────────────────────────────────────────────
function AuthGuard() {
  const openLoginModal = useAuthStore((s) => s.openLoginModal)
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="text-[14px] text-foreground-secondary">로그인 후 자산을 확인할 수 있습니다</div>
      <button
        onClick={() => openLoginModal()}
        className="px-6 py-2 rounded-xl bg-primary text-white text-[13px] font-semibold shadow-primary-btn hover:bg-primary-hover transition-colors"
      >
        로그인
      </button>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────
export default function AssetPage() {
  return <AssetContent />
}

export function AssetContent() {
  const { isAuthenticated, isRestoring, user } = useAuthStore()
  const [assetFlowRange, setAssetFlowRange] = useState('1W')
  const data = useAssetPage(isAuthenticated && !isRestoring, assetFlowRange)
  const [showExchange, setShowExchange] = useState(false)

  if (!isRestoring && !isAuthenticated) return <AuthGuard />

  return (
    <div className="h-full overflow-x-auto bg-surface">
    <div className="flex flex-col h-full min-w-[900px] bg-surface">

      {/* 환전 모달 */}
      {showExchange && (
        <ExchangeModal
          onClose={() => setShowExchange(false)}
          krwBalance={data.krwAvailable}
          usdBalance={data.usdBal}
        />
      )}

      {/* Hero */}
      <HeroSection data={data} user={user} onExchange={() => setShowExchange(true)} />

      {/* 상단 요약 스트립 */}
      <div className="shrink-0 grid grid-cols-[0.88fr_0.98fr_1.14fr] border-b border-stroke bg-surface">
        <AccountCard data={data} />
        <AssetBreakdownCard data={data} />
        <AssetFlowCard
          data={data}
          assetFlowRange={assetFlowRange}
          onChangeAssetFlowRange={setAssetFlowRange}
        />
      </div>

      {/* 하단 2열 보드 */}
      <div className="flex flex-1 min-h-0 bg-surface">
        <PortfolioPanel data={data} />
        <HoldingsPanel data={data} />
      </div>

    </div>
    </div>
  )
}
