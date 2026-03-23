import { useState } from 'react'
import { Heart, X } from 'lucide-react'
import StockAvatar from '@/components/ui/StockAvatar'
import LiveDot from '@/components/ui/LiveDot'
import PriceChange from '@/components/ui/PriceChange'
import useStockDetailStore from '@/store/useStockDetailStore'
import { HOME_STOCKS } from '@/mocks/home'
import { cn } from '@/lib/cn'

const PERIODS = ['1일', '1주', '1개월', '3개월', '1년']
const INFO_TABS = ['종목정보', '뉴스', '공시', 'AI 분석']

const MA_OPTIONS = [
  { key: 'ma5',  label: 'MA5',  colorClass: 'text-up',      bgClass: 'bg-up-bg',    borderClass: 'border-up-border'  },
  { key: 'ma20', label: 'MA20', colorClass: 'text-warning',  bgClass: 'bg-avatar-warning-bg', borderClass: 'border-avatar-warning-border' },
  { key: 'ma60', label: 'MA60', colorClass: 'text-down',     bgClass: 'bg-down-bg',  borderClass: 'border-down-border' },
]

/* 매도 호가 10행 (높은 가격 → 낮은 가격) */
const SELL_ORDERS = [
  { price: '76,500', qty: 324,   pct: 8  },
  { price: '76,400', qty: 512,   pct: 13 },
  { price: '76,300', qty: 892,   pct: 22 },
  { price: '76,200', qty: 1204,  pct: 30 },
  { price: '76,100', qty: 3410,  pct: 84 },
  { price: '76,000', qty: 2187,  pct: 54 },
  { price: '75,900', qty: 1562,  pct: 38 },
  { price: '75,800', qty: 2048,  pct: 50 },
  { price: '75,700', qty: 891,   pct: 22 },
  { price: '75,600', qty: 1340,  pct: 33 },
]

/* 매수 호가 10행 (높은 가격 → 낮은 가격) */
const BUY_ORDERS = [
  { price: '75,300', qty: 2891,  pct: 70  },
  { price: '75,200', qty: 1456,  pct: 35  },
  { price: '75,100', qty: 987,   pct: 24  },
  { price: '75,000', qty: 4230,  pct: 100 },
  { price: '74,900', qty: 1728,  pct: 42  },
  { price: '74,800', qty: 3104,  pct: 75  },
  { price: '74,700', qty: 892,   pct: 22  },
  { price: '74,600', qty: 1560,  pct: 38  },
  { price: '74,500', qty: 2340,  pct: 57  },
  { price: '74,400', qty: 1089,  pct: 27  },
]

const ORDER_TYPES = ['시장가', '지정가', '현재가']
const COND_TYPES = ['일반', 'IOC', 'FOK']

/* 주문 폼 (매수/매도 공통 구조) */
function OrderForm({ isBuy }) {
  const [orderType, setOrderType] = useState('시장가')
  const [cond, setCond] = useState('일반')
  const [qty, setQty] = useState(100)

  const btnColor = isBuy
    ? 'bg-up text-white shadow-[0_2px_8px_rgba(232,57,62,.3)]'
    : 'bg-down text-white shadow-[0_2px_8px_rgba(0,117,232,.3)]'

  return (
    <div className="px-3.5 pb-3 pt-2.5 border-t-2 border-stroke bg-background shrink-0">
      {/* 주문 유형 */}
      <div className="flex gap-1 mb-2">
        {ORDER_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={cn(
              'flex-1 py-1 rounded-[7px] border text-[10px] font-medium transition-colors duration-[150ms]',
              orderType === t
                ? 'border-primary bg-primary-light text-primary font-bold'
                : 'border-stroke-input bg-surface text-foreground-disabled',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {/* 체결 조건 */}
      <div className="flex gap-1 mb-2">
        {COND_TYPES.map((c) => (
          <button
            key={c}
            onClick={() => setCond(c)}
            className={cn(
              'flex-1 py-[3px] rounded-[6px] border text-[9px] font-medium transition-colors duration-[150ms]',
              cond === c
                ? 'border-foreground bg-surface-muted text-foreground font-bold'
                : 'border-stroke-input bg-surface text-foreground-disabled',
            )}
          >
            {c}
          </button>
        ))}
      </div>
      {/* 수량 */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] text-foreground-disabled font-semibold">주문 수량</span>
          <span className="text-[9px] text-foreground-disabled">
            가능 <span className="text-primary font-bold">99,000,000원</span>
          </span>
        </div>
        <div className="flex items-center gap-1 mb-1">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-7 h-7 rounded-[7px] border border-stroke-input bg-surface text-[14px] text-foreground flex items-center justify-center shrink-0"
          >
            −
          </button>
          <div className="flex-1 text-center py-1 bg-surface border border-stroke-input rounded-lg">
            <span className="text-[18px] font-black text-foreground">{qty}</span>
            <span className="text-[9px] text-foreground-disabled ml-0.5">주</span>
          </div>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-7 h-7 rounded-[7px] border border-stroke-input bg-surface text-[14px] text-foreground flex items-center justify-center shrink-0"
          >
            +
          </button>
        </div>
        <div className="flex gap-1">
          {['10%', '25%', '50%', '최대'].map((p) => (
            <button
              key={p}
              className={cn(
                'flex-1 py-1 rounded-[6px] border text-[9px] font-semibold transition-colors duration-[150ms]',
                p === '최대'
                  ? 'border-up-border bg-up-bg text-up'
                  : 'border-stroke-input bg-background text-foreground-disabled',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {/* 예상 금액 */}
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[9px] text-foreground-disabled">예상 금액</span>
        <span className="text-[13px] font-bold text-foreground">
          {(75400 * qty).toLocaleString()}원
        </span>
      </div>
      {/* 주문 버튼 */}
      <button className={cn('w-full py-2.5 rounded-[10px] text-[13px] font-extrabold', btnColor)}>
        {isBuy ? '매수' : '매도'}
      </button>
    </div>
  )
}

export default function StockDetailSheet() {
  const { selectedStockId, closeStock } = useStockDetailStore()
  const [activePeriod, setActivePeriod] = useState('1일')
  const [activeMA, setActiveMA] = useState({ ma5: true, ma20: true, ma60: true })
  const [activeInfoTab, setActiveInfoTab] = useState('종목정보')
  const [isBuy, setIsBuy] = useState(true)
  const [isWatched, setIsWatched] = useState(false)

  if (!selectedStockId) return null

  const stock = HOME_STOCKS.find((s) => s.id === selectedStockId) ?? HOME_STOCKS[0]
  const isUp = stock.change > 0
  const priceColorClass = isUp ? 'text-up' : 'text-down'
  const chartColor = isUp ? 'var(--color-up)' : 'var(--color-down)'
  const chartFillId = `chart-fill-${stock.id}`

  const toggleMA = (key) => setActiveMA((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="absolute inset-0 z-[9]">
      {/* Dim overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={closeStock}
      />

      {/* Sheet panel */}
      <div className="absolute bottom-0 left-0 right-0 h-[calc(100%-20px)] bg-surface rounded-t-[20px] shadow-modal z-[10] flex flex-col animate-sheet-in">

        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-2.5 pb-1.5 shrink-0">
          <div className="w-10 h-1 rounded-full bg-stroke" />
        </div>

        {/* 헤더 */}
        <div className="px-5 pb-3 border-b border-stroke shrink-0">
          <div className="flex items-center gap-3">
            {/* 아바타 */}
            <StockAvatar name={stock.label} color={stock.color} size="lg" className="!w-[42px] !h-[42px] !text-[10px]" />

            {/* 이름 + 코드 + 52주 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[17px] font-extrabold text-foreground">{stock.name}</span>
                <span className="text-[9px] text-foreground-disabled bg-background px-1.5 py-0.5 rounded-full">{stock.code}</span>
                <span className="text-[9px] text-foreground-disabled bg-background px-1.5 py-0.5 rounded-full">{stock.market}</span>
                <span className="flex items-center gap-1 ml-0.5">
                  <LiveDot size="sm" />
                  <span className="text-[9px] text-live">실시간</span>
                </span>
              </div>
              {/* 52주 범위 */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-down font-semibold whitespace-nowrap">{stock.week52Low}</span>
                <div className="relative flex-1 h-1 bg-stroke rounded-full max-w-[160px]">
                  <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-down to-up" style={{ width: `${stock.week52Pct}%` }} />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-up border-2 border-surface shadow-sm"
                    style={{ left: `${stock.week52Pct}%`, transform: 'translate(-50%, -50%)' }}
                  />
                </div>
                <span className="text-[9px] text-up font-semibold whitespace-nowrap">{stock.week52High}</span>
                <span className="text-[9px] text-foreground-disabled">52주범위</span>
              </div>
            </div>

            {/* 가격 */}
            <div className="text-right shrink-0">
              <div className={cn('text-[26px] font-black leading-none tracking-tight', priceColorClass)}>
                {stock.price}
              </div>
              <div className="flex items-center gap-1.5 justify-end mt-1">
                <span className={cn('text-[12px] font-bold', priceColorClass)}>
                  {isUp ? '▲' : '▼'} {stock.changeAmt}원
                </span>
                <PriceChange value={stock.change} variant="badge" className="text-[10px]" />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsWatched((v) => !v)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-[5px] rounded-[9px] border text-[10px] transition-colors duration-[150ms]',
                  isWatched
                    ? 'border-up-border bg-up-bg text-up'
                    : 'border-stroke bg-surface text-foreground-disabled hover:border-stroke-input',
                )}
              >
                <Heart className={cn('w-[11px] h-[11px]', isWatched && 'fill-current')} />
                관심
              </button>
              <button
                onClick={closeStock}
                aria-label="닫기"
                className="w-7 h-7 rounded-full bg-background border border-stroke flex items-center justify-center text-foreground-disabled hover:text-foreground transition-colors duration-[150ms]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 시트 바디 */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ◀ LEFT: 차트 + 정보 탭 */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-stroke">

            {/* 기간 + MA 토글 + 캔들/라인 */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-stroke shrink-0">
              <div className="flex bg-background rounded-[9px] p-0.5">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setActivePeriod(p)}
                    className={cn(
                      'px-2.5 py-[3px] rounded-[7px] text-[10px] font-semibold transition-colors duration-[150ms]',
                      activePeriod === p
                        ? 'bg-surface text-foreground shadow-sm'
                        : 'text-foreground-disabled',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              {MA_OPTIONS.map(({ key, label, colorClass, bgClass, borderClass }) => (
                <button
                  key={key}
                  onClick={() => toggleMA(key)}
                  className={cn(
                    'inline-flex items-center gap-1 px-[7px] py-[3px] rounded-[5px] border text-[9px] font-semibold transition-colors duration-[150ms]',
                    activeMA[key]
                      ? `${colorClass} ${bgClass} ${borderClass}`
                      : 'text-foreground-disabled border-stroke-input bg-surface',
                  )}
                >
                  <span
                    className={cn('w-[5px] h-[5px] rounded-full', activeMA[key] ? bgClass.replace('bg-', 'bg-') : 'bg-stroke')}
                    style={{ background: activeMA[key] ? `var(--color-${key === 'ma5' ? 'up' : key === 'ma20' ? 'warning' : 'down'})` : undefined }}
                  />
                  {label}
                </button>
              ))}
              <div className="flex gap-1 ml-1">
                <button className="px-2 py-[3px] rounded-[6px] border border-stroke-input bg-surface text-[9px] text-foreground-disabled transition-colors duration-[150ms] hover:border-primary hover:text-primary">캔들</button>
                <button className="px-2 py-[3px] rounded-[6px] border border-primary bg-primary-light text-[9px] text-primary font-bold">라인</button>
              </div>
            </div>

            {/* 차트 SVG */}
            <div className="flex-1 min-h-0 relative px-4 pt-2.5 pb-1">
              {/* y축 레이블 */}
              <div className="absolute left-4 top-2.5 bottom-7 flex flex-col justify-between pointer-events-none z-[2]">
                {['77,000', '76,000', '75,000', '74,000', '73,000'].map((v) => (
                  <span key={v} className="text-[9px] text-foreground-disabled">{v}</span>
                ))}
              </div>
              {/* 차트 영역 */}
              <div className="absolute left-12 right-4 top-2.5 bottom-7">
                <svg width="100%" height="100%" viewBox="0 0 500 180" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={chartFillId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity=".16" />
                      <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* 그리드 */}
                  {[28, 56, 84, 112].map((y) => (
                    <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="var(--color-stroke)" strokeWidth="1" />
                  ))}
                  {/* 그라데이션 채우기 */}
                  <path
                    d="M0,130 C40,120 70,108 110,96 S170,72 210,62 S270,48 310,36 S370,20 410,13 S460,6 500,3 L500,145 L0,145Z"
                    fill={`url(#${chartFillId})`}
                  />
                  {/* 가격선 */}
                  <path
                    d="M0,130 C40,120 70,108 110,96 S170,72 210,62 S270,48 310,36 S370,20 410,13 S460,6 500,3"
                    stroke={chartColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
                  />
                  {/* MA5 */}
                  {activeMA.ma5 && (
                    <path
                      d="M0,128 C40,118 70,106 110,94 S170,70 210,60 S270,46 310,34 S370,18 410,11 S460,4 500,1"
                      fill="none" stroke="var(--color-up)" strokeWidth="1" strokeDasharray="3,2" opacity=".6"
                    />
                  )}
                  {/* MA20 */}
                  {activeMA.ma20 && (
                    <path
                      d="M0,134 C40,126 70,118 110,108 S170,88 210,78 S270,64 310,52 S370,38 410,30 S460,22 500,18"
                      fill="none" stroke="var(--color-warning)" strokeWidth="1.2" opacity=".85"
                    />
                  )}
                  {/* MA60 */}
                  {activeMA.ma60 && (
                    <path
                      d="M0,140 C40,136 70,130 110,122 S170,108 210,100 S270,88 310,76 S370,62 410,54 S460,44 500,40"
                      fill="none" stroke="var(--color-down)" strokeWidth="1" opacity=".75"
                    />
                  )}
                  {/* 현재가 점 */}
                  <circle cx="500" cy="3" r="4" fill={chartColor} />
                  <circle cx="500" cy="3" r="8" fill={chartColor} opacity=".18" />
                  {/* 볼륨 바 */}
                  {[
                    [2, 14, false], [22, 19, true], [42, 11, false], [62, 23, true], [82, 8, false],
                    [102, 15, false], [122, 17, true], [142, 6, false], [162, 21, true], [182, 13, false],
                    [202, 17, false], [222, 19, true], [242, 10, false], [262, 15, true], [282, 17, false],
                    [302, 12, false], [322, 23, true], [342, 15, false], [362, 19, true], [382, 10, false],
                    [402, 17, true], [422, 19, false], [442, 12, false], [462, 24, true], [482, 18, true],
                  ].map(([x, h, isUpBar], i) => (
                    <rect
                      key={i}
                      x={x} y={180 - h} width="14" height={h} rx="2"
                      fill={isUpBar ? chartColor : 'var(--color-stroke-input)'}
                      opacity={isUpBar ? '.55' : '.85'}
                    />
                  ))}
                </svg>
              </div>
              {/* x축 시간 레이블 */}
              <div className="absolute left-12 right-4 bottom-1 flex justify-between">
                {['09:00', '10:30', '12:00', '13:30'].map((t) => (
                  <span key={t} className="text-[9px] text-foreground-disabled">{t}</span>
                ))}
                <span className="text-[9px] font-semibold" style={{ color: chartColor }}>14:32</span>
              </div>
            </div>

            {/* 정보 탭 */}
            <div className="border-t border-stroke shrink-0">
              <div className="flex border-b border-stroke px-4">
                {INFO_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveInfoTab(tab)}
                    className={cn(
                      'px-3 py-[7px] text-[11px] font-semibold border-b-2 -mb-px transition-colors duration-[150ms]',
                      activeInfoTab === tab
                        ? 'text-primary border-primary font-bold'
                        : 'text-foreground-disabled border-transparent',
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* 종목정보 컨텐츠 */}
              {activeInfoTab === '종목정보' && (
                <div className="px-4 py-2">
                  <div className="grid grid-cols-4 gap-[5px]">
                    {[
                      { label: '시가',    val: stock.open,      color: 'text-foreground',  bg: 'bg-background'  },
                      { label: '고가',    val: stock.high,      color: 'text-up',          bg: 'bg-up-bg'       },
                      { label: '저가',    val: stock.low,       color: 'text-down',        bg: 'bg-down-bg'     },
                      { label: '거래량',  val: stock.volume,    color: 'text-foreground',  bg: 'bg-background'  },
                      { label: '시가총액', val: stock.marketCap, color: 'text-foreground',  bg: 'bg-background'  },
                      { label: 'PER',     val: stock.per,       color: 'text-foreground',  bg: 'bg-background'  },
                      { label: 'PBR',     val: stock.pbr,       color: 'text-foreground',  bg: 'bg-background'  },
                      { label: '거래대금', val: stock.turnover,  color: 'text-foreground',  bg: 'bg-background'  },
                    ].map(({ label, val, color, bg }) => (
                      <div key={label} className={cn('rounded-lg px-2 py-1.5', bg)}>
                        <div className="text-[8px] text-foreground-disabled mb-0.5">{label}</div>
                        <div className={cn('text-[12px] font-bold', color)}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ▶ RIGHT: 호가창 + 주문 */}
          <div className="w-[300px] shrink-0 flex flex-col overflow-hidden">

            {/* 매수/매도 전환 */}
            <div className="px-3.5 py-2.5 border-b border-stroke shrink-0">
              <div className="flex bg-background rounded-[10px] p-[3px] gap-0.5">
                <button
                  onClick={() => setIsBuy(true)}
                  className={cn(
                    'flex-1 py-[7px] rounded-lg text-[12px] font-extrabold transition-all duration-[150ms]',
                    isBuy
                      ? 'bg-up text-white shadow-[0_2px_8px_rgba(232,57,62,.3)]'
                      : 'text-foreground-disabled',
                  )}
                >
                  매수
                </button>
                <button
                  onClick={() => setIsBuy(false)}
                  className={cn(
                    'flex-1 py-[7px] rounded-lg text-[12px] font-extrabold transition-all duration-[150ms]',
                    !isBuy
                      ? 'bg-down text-white shadow-[0_2px_8px_rgba(0,117,232,.3)]'
                      : 'text-foreground-disabled',
                  )}
                >
                  매도
                </button>
              </div>
            </div>

            {/* 호가창 */}
            <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
              {/* 매도잔량 헤더 */}
              <div className="flex justify-between px-3 py-[3px] bg-down-bg border-b border-stroke shrink-0">
                <span className="text-[9px] font-semibold text-down">매도잔량</span>
                <span className="text-[10px] font-bold text-down">14,118</span>
              </div>
              {/* 매도 호가 */}
              {SELL_ORDERS.map(({ price, qty, pct }) => (
                <div key={price} className="relative flex justify-between items-center px-3 py-[3px] border-b border-stroke/50 cursor-pointer hover:bg-down-bg/30 transition-colors duration-[100ms]">
                  <div className="absolute right-0 top-0 bottom-0 bg-down/7" style={{ width: `${pct}%` }} />
                  <span className="relative text-[12px] font-bold text-down">{price}</span>
                  <span className="relative text-[10px] text-foreground-secondary">{qty.toLocaleString()}</span>
                </div>
              ))}
              {/* 현재가 행 */}
              <div className="flex justify-between items-center px-3 py-[5px] bg-up-bg border-y-2 border-up-border shrink-0">
                <span className="text-[16px] font-black text-up">{stock.price}</span>
                <PriceChange value={stock.change} variant="badge" className="text-[9px]" />
              </div>
              {/* 매수 호가 */}
              {BUY_ORDERS.map(({ price, qty, pct }) => (
                <div key={price} className="relative flex justify-between items-center px-3 py-[3px] border-b border-stroke/50 cursor-pointer hover:bg-up-bg/30 transition-colors duration-[100ms]">
                  <div className="absolute left-0 top-0 bottom-0 bg-up/6" style={{ width: `${pct}%` }} />
                  <span className="relative text-[12px] font-bold text-up">{price}</span>
                  <span className="relative text-[10px] text-foreground-secondary">{qty.toLocaleString()}</span>
                </div>
              ))}
              {/* 매수잔량 */}
              <div className="flex justify-between px-3 py-[3px] bg-up-bg border-t border-up-border shrink-0">
                <span className="text-[9px] font-semibold text-up">매수잔량</span>
                <span className="text-[10px] font-bold text-up">20,276</span>
              </div>
            </div>

            {/* 주문 폼 */}
            <OrderForm isBuy={isBuy} />
          </div>
        </div>
      </div>
    </div>
  )
}
