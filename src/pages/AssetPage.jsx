import { useState, useEffect } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import { getStockLogoUrl } from '@/lib/stockLogo'
import { extractDominantColor } from '@/lib/extractLogoColor'
import LiveDot from '@/components/ui/LiveDot'
import StockAvatar from '@/components/ui/StockAvatar'
import FilterChip from '@/components/ui/FilterChip'
import ExchangeModal from '@/components/asset/ExchangeModal'
import useAuthStore from '@/store/useAuthStore'
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

// ── Hero 섹션 ─────────────────────────────────────────────────────
function HeroSection({ data, user, onExchange }) {
  const { isLoading, totalAssets, accountProfit, accountProfitRate, isAccountProfit, krwDeposit, krwAvailable, usdBal } = data
  const blank = isLoading ? '-' : null

  return (
    <div className="shrink-0 bg-surface border-b border-stroke px-6 py-4">
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
              <div className="text-[13px] font-bold text-foreground">{blank ?? ('$' + fmt(usdBal))}</div>
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
    <div className="bg-surface rounded-2xl border border-stroke p-4 flex flex-col gap-3">
      <div className="text-[11px] font-bold text-foreground">계좌</div>
      <div className="h-px bg-stroke-subtle" />
      <div>
        <div className="text-[13px] font-bold text-foreground">{accountName}</div>
        <div className="text-[11px] text-foreground-disabled mt-0.5">{accountNumber}</div>
      </div>
      <div className="h-px bg-stroke-subtle" />
      <div className="flex flex-col gap-2">
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
    </div>
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
    { label: 'USD 현금', value: blank ?? ('$' + fmt(usdBal)), pnl: null },
  ]

  return (
    <div className="bg-surface rounded-2xl border border-stroke p-4 flex flex-col gap-2.5">
      <div className="text-[11px] font-bold text-foreground mb-0.5">자산 구성</div>
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
  )
}

// ── 자산 흐름 카드 ────────────────────────────────────────────────
function AssetFlowCard({ data }) {
  const { tradeCount, accountProfit, isAccountProfit, isLoading } = data

  // 거래 횟수 기반 간단한 bar sparkline (시각적 표현)
  const bars = [28, 35, 30, 45, 40, 55, 50, 62, 58, 70, 65, 78, 72, 85, 80, 92, 88, 96, 90, 100]

  return (
    <div className="bg-surface rounded-2xl border border-stroke p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold text-foreground">자산 흐름</div>
        <span className="text-[9px] text-foreground-disabled">누적 {tradeCount}회 거래</span>
      </div>

      {/* 스파크라인 바 차트 */}
      <div className="flex-1 flex items-end gap-px min-h-0 h-[60px]">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm h-[var(--bar-h)] ${isAccountProfit ? 'bg-up/40' : 'bg-down/40'}`}
            style={{ '--bar-h': `${h}%` }}
          />
        ))}
      </div>

      <div className="h-px bg-stroke-subtle" />

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-foreground-disabled">총 평가손익</span>
        <span className={`text-[14px] font-black ${isAccountProfit ? 'text-up' : 'text-down'}`}>
          {isLoading ? '-' : ((isAccountProfit ? '+' : '') + fmt(accountProfit ?? 0) + '원')}
        </span>
      </div>
    </div>
  )
}

// ── 로고 대표색 추출 훅 ───────────────────────────────────────────
const CASH_COLOR = '#9CA3AF'
const FALLBACK_COLORS = ['#0046FF', '#00C2A8', '#7B61FF', '#FF8C00', '#0035CC']

function useLogoColors(items) {
  const [colors, setColors] = useState({})

  useEffect(() => {
    if (!items?.length) return
    items.forEach(async (item, i) => {
      const key = item.stockCode ?? `cash_${i}`
      if (item.type === 'CASH') {
        setColors((prev) => ({ ...prev, [key]: CASH_COLOR }))
        return
      }
      if (!item.stockCode) {
        setColors((prev) => ({ ...prev, [key]: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }))
        return
      }
      const url =
        getStockLogoUrl(item.marketType, item.stockCode) ??
        getStockLogoUrl('KOSPI', item.stockCode) ??
        getStockLogoUrl('KOSDAQ', item.stockCode)
      if (!url) {
        setColors((prev) => ({ ...prev, [key]: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }))
        return
      }
      const color = await extractDominantColor(url, FALLBACK_COLORS[i % FALLBACK_COLORS.length])
      setColors((prev) => ({ ...prev, [key]: color }))
    })
  // items 배열 내용 변화 감지를 위해 JSON 직렬화
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items?.map((i) => i.stockCode))])

  return (item, idx) => {
    const key = item.stockCode ?? `cash_${idx}`
    return colors[key] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
  }
}

// ── 포트폴리오 파이차트 패널 (하단 좌) ───────────────────────────
function PortfolioPanel({ data }) {
  const { portfolioItems, stockProfitRate, isStockProfit, isLoading } = data

  const getColor = useLogoColors(portfolioItems)
  const hasItems = portfolioItems.length > 0

  const sortedItems = [...portfolioItems].sort((a, b) => b.weight - a.weight)

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
    <div className="flex-1 min-w-0 bg-surface rounded-2xl border border-stroke p-5 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="text-[11px] font-bold text-foreground">포트폴리오</div>
        {!isLoading && (
          <span className={`text-[11px] font-bold ${isStockProfit ? 'text-up' : 'text-down'}`}>
            수익률 {fmtRate(stockProfitRate)}
          </span>
        )}
      </div>

      {/* 도넛 차트 */}
      <div className="relative shrink-0 h-[260px]">
        {hasItems ? (
          <>
            <ReactECharts
              option={chartOption}
              className="w-full h-full"
              opts={{ renderer: 'svg' }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-[15px] font-black ${isStockProfit ? 'text-up' : 'text-down'}`}>
                {isLoading ? '-' : fmtRate(stockProfitRate)}
              </span>
              <span className="text-[9px] text-foreground-disabled mt-0.5">수익률</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-[11px] text-foreground-disabled">데이터 없음</span>
          </div>
        )}
      </div>

      {/* 레전드 */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 mt-2">
        {portfolioItems.length === 0 && !isLoading && (
          <p className="text-[11px] text-foreground-disabled text-center">보유 종목 없음</p>
        )}
        {sortedItems.map((item, i) => {
          const color = getColor(item, i)
          return (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-[3px] shrink-0 bg-[var(--dot-color)]" style={{ '--dot-color': color }} />
                <span className="text-[12px] text-foreground-secondary">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-[60px] h-1 rounded-full bg-surface-muted overflow-hidden">
                  <div className="h-full rounded-full w-[var(--bar-w)] bg-[var(--bar-color)]" style={{ '--bar-w': `${item.weight}%`, '--bar-color': color }} />
                </div>
                <span className="text-[11px] font-bold text-foreground w-8 text-right">{item.weight}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 보유 종목 행 ──────────────────────────────────────────────────
function HoldingRow({ h }) {
  const { stockName, stockCode, marketType, qty, cur, avg, evalKrw, pnl, pnlRate, isUp, isKrw } = h

  return (
    <div className="grid grid-cols-[1fr_80px_88px_108px] items-center px-4 py-2.5 border-b border-stroke-subtle cursor-pointer hover:bg-surface-subtle transition-colors">
      <div className="flex items-center gap-2.5">
        <StockAvatar name={stockName} stockCode={stockCode} marketType={marketType} size="md" />
        <div className="min-w-0">
          <div className="text-[12px] font-bold text-foreground truncate">{stockName}</div>
          <div className="text-[9px] text-foreground-disabled">{marketType}{!isKrw && ' 🇺🇸'}</div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-[12px] font-bold text-foreground">{fmt(qty)}주</div>
        <div className="text-[9px] text-foreground-disabled">
          {isKrw ? fmt(avg) : `$${Number(avg).toFixed(1)}`}
        </div>
      </div>

      <div className={`text-right text-[13px] font-extrabold ${isUp ? 'text-up' : 'text-down'}`}>
        {isKrw ? fmt(cur) : `$${Number(cur).toFixed(2)}`}
      </div>

      <div className="text-right">
        <div className={`text-[12px] font-extrabold ${isUp ? 'text-up' : 'text-down'}`}>
          {(isUp ? '+' : '') + fmt(Math.abs(pnl))}
        </div>
        <div className={`text-[9px] font-bold ${isUp ? 'text-up' : 'text-down'}`}>
          {fmtRate(pnlRate)}
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
    .sort((a, b) => b.evalKrw - a.evalKrw)

  const rows = filter === 'domestic' ? domesticRows
    : filter === 'overseas' ? overseasRows
    : allRows

  const totalEval = rows.reduce((s, h) => s + h.evalKrw, 0)
  const totalPnl = rows.reduce((s, h) => s + h.pnl, 0)
  const totalIsUp = totalPnl >= 0

  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const filters = [
    { key: 'all',      label: `전체 ${allRows.length}` },
    { key: 'domestic', label: `국내주식 ${domesticRows.length}` },
    { key: 'overseas', label: `해외주식 ${overseasRows.length}` },
  ]

  return (
    <div className="flex-1 min-w-0 bg-surface rounded-2xl border border-stroke flex flex-col overflow-hidden">

      {/* 헤더: 필터 + 시간 */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-stroke">
        <div className="flex items-center gap-1.5">
          {filters.map(({ key, label }) => (
            <FilterChip
              key={key}
              isActive={filter === key}
              onClick={() => setFilter(key)}
            >
              {label}
            </FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <LiveDot size="sm" />
          <span className="text-[9px] text-foreground-disabled">{timeStr} 기준</span>
        </div>
      </div>

      {/* 컬럼 헤더 */}
      <div className="shrink-0 grid grid-cols-[1fr_80px_88px_108px] items-center px-4 py-1.5 bg-surface-subtle border-b border-stroke text-[9px] font-semibold text-foreground-disabled">
        <span>종목</span>
        <span className="text-right">수량 / 평균가</span>
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
        <div className="shrink-0 grid grid-cols-[1fr_80px_88px_108px] items-center px-4 py-2.5 bg-primary-light border-t-2 border-primary-dim">
          <div className="text-[12px] font-extrabold text-primary">합계</div>
          <div />
          <div className="text-right text-[12px] font-bold text-foreground">{fmt(totalEval)}원</div>
          <div className={`text-right text-[12px] font-extrabold ${totalIsUp ? 'text-up' : 'text-down'}`}>
            {(totalIsUp ? '+' : '') + fmt(Math.abs(totalPnl))}원
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
  const { isAuthenticated, isRestoring, user } = useAuthStore()
  const data = useAssetPage(isAuthenticated && !isRestoring)
  const [showExchange, setShowExchange] = useState(false)

  if (!isRestoring && !isAuthenticated) return <AuthGuard />

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

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

      {/* 상단 카드 3열 */}
      <div className="shrink-0 grid grid-cols-3 gap-3 px-4 pt-3">
        <AccountCard data={data} />
        <AssetBreakdownCard data={data} />
        <AssetFlowCard data={data} />
      </div>

      {/* 하단 2열: 파이차트 + 보유종목 */}
      <div className="flex flex-1 min-h-0 gap-3 px-4 py-3">
        <PortfolioPanel data={data} />
        <HoldingsPanel data={data} />
      </div>

    </div>
  )
}
