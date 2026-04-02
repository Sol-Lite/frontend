import { ChevronDown, ChevronLeft, Settings2 } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/cn'
import useGridStore from '@/store/useGridStore'
import useWidgetStore, { canFitInGrid } from '@/store/useWidgetStore'
import { GRID_GAP, MIN_CELL_WIDTH, MIN_CELL_HEIGHT } from '@/lib/gridConstants'
import StockAvatar from '@/components/ui/StockAvatar'
import { getStockPrice } from '@/data/stockPriceMap'

/* ── 너비 클래스 ─────────────────────────────────────────────
   EditPanel 가로폭을 3등분하여 colSpan 비율을 반영.
   6열 그리드 기준: 1열=소형(1/3), 2열=와이드(2/3), 3열=하프(full)
   colSpan=1 → w-1/3,  colSpan=2 → w-2/3,  colSpan≥3 → w-full
─────────────────────────────────────────────────────────── */
function widthClass(colSpan) {
  if (colSpan === 1) return 'w-1/3'
  if (colSpan === 2) return 'w-2/3'
  return 'w-full'
}

/* ── aspect-ratio 계산 ──────────────────────────────────────
   실제 그리드 셀 크기 기반 비율 사용.
   widthClass가 colSpan에 정확히 비례하므로 정규화 불필요.
   → 모든 rowSpan=1 위젯의 preview 높이가 자동으로 동일해짐.
─────────────────────────────────────────────────────────── */
function calcAspectRatio(colSpan, rowSpan, cw, ch) {
  const w = colSpan * cw + (colSpan - 1) * GRID_GAP
  const h = rowSpan * ch + (rowSpan - 1) * GRID_GAP
  return w / h
}

/* ── 캔들차트 미리보기 ───────────────────────────────────
   [cx, high_y, body_top, body_bot, low_y, isUp]
   SVG y: 값이 작을수록 화면 위(=고가), 클수록 아래(=저가)
─────────────────────────────────────────────────────── */
function buildPreviewCandles(count = 78) {
  const candles = []
  const minY = 5
  const maxY = 38
  const clamp = (v) => Math.max(minY, Math.min(maxY, v))
  const anchors = [
    [0.00, 33.0], // 시작
    [0.08, 31.0], // 초반 상승
    [0.15, 33.4], // 급 눌림
    [0.25, 27.6], // 반등
    [0.36, 24.8], // 상승
    [0.46, 27.3], // 재차 눌림
    [0.58, 20.6], // 강한 상승
    [0.68, 18.1], // 고점권 진입
    [0.78, 22.2], // 흔들림
    [0.88, 19.0], // 회복
    [1.00, 16.4], // 상승 마감
  ]
  const yAt = (t) => {
    for (let i = 0; i < anchors.length - 1; i += 1) {
      const [x1, y1] = anchors[i]
      const [x2, y2] = anchors[i + 1]
      if (t <= x2) {
        const p = (t - x1) / (x2 - x1)
        return y1 + (y2 - y1) * p
      }
    }
    return anchors[anchors.length - 1][1]
  }

  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1)
    const cx = 2 + t * 96
    const base = yAt(t)
    // 고주파 + 계단형 변동을 섞어 더 뾰족한 등락을 만든다.
    const microWave = Math.sin(i * 1.25) * 1.05 + Math.sin(i * 0.42) * 0.55
    const stepShock = ((i % 5) - 2) * 0.22 + ((i % 9) === 0 ? 0.75 : 0) - ((i % 11) === 0 ? 0.6 : 0)
    const mid = clamp(base + microWave + stepShock)
    const prevMid = i === 0 ? mid + 0.45 : (candles[i - 1][2] + candles[i - 1][3]) / 2
    // 몸통 길이를 다양화해서 실제 캔들 느낌 강화
    const body = 0.5 + ((i * 7) % 9) * 0.18
    // 윗꼬리/아랫꼬리 길이를 분리해 비대칭 + 가변 길이로 생성
    const wickUp = 0.35 + ((i * 5) % 7) * 0.24
    const wickDown = 0.3 + ((i * 9) % 8) * 0.2
    const isUp = mid <= prevMid
    const bodyTop = clamp(mid - body)
    const bodyBottom = clamp(mid + body)
    const highY = clamp(bodyTop - wickUp)
    const lowY = clamp(bodyBottom + wickDown)
    candles.push([cx, highY, bodyTop, bodyBottom, lowY, isUp])
  }
  return candles
}

const PREVIEW_CANDLES = buildPreviewCandles(65)
const PREVIEW_STOCK_NAME = '신한지주'
const PREVIEW_STOCK_CODE = '055550'
const PREVIEW_STOCK_MARKET = 'KOSPI'

function MiniCandleChart({ className = '', candleRatio = 1, volatility = 1 }) {
  const targetCount = Math.max(8, Math.round(PREVIEW_CANDLES.length * candleRatio))
  const sampledCandles = targetCount >= PREVIEW_CANDLES.length
    ? PREVIEW_CANDLES
    : Array.from({ length: targetCount }, (_, i) => {
      const idx = Math.floor((i * (PREVIEW_CANDLES.length - 1)) / (targetCount - 1))
      return PREVIEW_CANDLES[idx]
    })
  const clampY = (v) => Math.max(2, Math.min(40, v))
  const baseline = sampledCandles[sampledCandles.length - 1][3]
  const scaleY = (y) => clampY(baseline + (y - baseline) * volatility)
  const candles = volatility === 1
    ? sampledCandles
    : sampledCandles.map(([cx, ht, bt, bb, lb, isUp]) => [cx, scaleY(ht), scaleY(bt), scaleY(bb), scaleY(lb), isUp])
  const lastBodyBottom = candles[candles.length - 1][3]
  return (
    <div className={cn('h-full w-full rounded-lg bg-white p-1', className)}>
      <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="w-full h-full block">
        <line x1="0" y1={lastBodyBottom} x2="100" y2={lastBodyBottom} stroke="var(--color-up)" strokeWidth="0.7" strokeDasharray="1.5 1.5" vectorEffect="non-scaling-stroke" />
        {candles.map(([cx, ht, bt, bb, lb, isUp]) => {
          const color = isUp ? 'var(--color-up)' : 'var(--color-down)'
          return (
            <g key={cx}>
              <line x1={cx} y1={ht} x2={cx} y2={lb} stroke={color} strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
              <rect x={cx - 0.45} y={bt} width={0.9} height={Math.max(bb - bt, 0.6)} fill={color} rx="0" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ── 위젯별 미리보기 콘텐츠 ─────────────────────────────── */
export function PreviewContent({ type, sectorStocks, typeIndex = 0 }) {
  // sectorStocks가 있으면 전체 사용 (typeIndex로 선택)
  const stocks = sectorStocks ? sectorStocks : null

  switch (type) {

    /* 계좌 잔고 — 소형 1×1 */
    case 'balance-sm':
      return (
        <div className="flex flex-col justify-between h-full">
          <span className="text-[9px] font-semibold text-foreground-disabled">계좌 잔고</span>
          <div>
            <div className="text-[8px] text-foreground-disabled mb-0.5">총 평가자산</div>
            <div className="text-[14px] font-extrabold text-foreground leading-none">84,320,000</div>
            <div className="text-[10px] text-up font-semibold mt-1">▲ +2,140,000 (+2.61%)</div>
          </div>
        </div>
      )

    /* 계좌 잔고 — 와이드 2×1 */
    case 'balance-lg':
      return (
        <div className="flex flex-col h-full">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0 mb-1">계좌 잔고</span>
          <div className="flex flex-1 min-h-0 gap-3">
            {/* 좌: 총 평가자산 */}
            <div className="flex flex-col justify-end flex-1 min-w-0">
              <div className="text-[8px] text-foreground-disabled">총 평가자산</div>
              <div className="text-[15px] font-extrabold text-foreground leading-tight">84,320,000</div>
              <div className="text-[9px] text-up font-semibold mt-0.5">▲ +2,152,000 (+2.61%)</div>
            </div>
            {/* 우: 3항목 세로 배치 */}
            <div className="flex flex-col justify-end w-[42%] shrink-0">
              <div className="flex flex-col gap-1 border-l border-stroke pl-3">
                {[
                  { label: '투자원금', val: '82,168,000', color: 'text-foreground' },
                  { label: '평가손익', val: '+2,152,000', color: 'text-up' },
                  { label: '주문가능', val: '74,780,000', color: 'text-foreground' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="min-w-0">
                    <div className="text-[7px] text-foreground-disabled">{label}</div>
                    <div className={`text-[9px] font-semibold truncate ${color}`}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )

    /* 주가/차트 — 카드형 1×1 */
    case 'stock-sm': {
      const stock = stocks ? stocks[typeIndex] : null
      const name = stock?.name ?? PREVIEW_STOCK_NAME
      const code = stock?.stockCode ?? PREVIEW_STOCK_CODE
      const market = stock?.marketType ?? PREVIEW_STOCK_MARKET
      const price = (stock?.price && stock.price > 0) ? stock.price : (stock ? getStockPrice(stock.stockCode) : 99000)
      const change = stock?.change ?? 350
      const changeRate = stock?.changeRate ?? 0.79
      const isUp = change >= 0

      return (
        <div className="flex flex-col justify-between h-full">
          <div className="flex items-center gap-1 min-w-0">
            <StockAvatar name={name} stockCode={code} marketType={market} size="sm" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-foreground leading-none truncate">{name}</div>
              <div className="text-[8px] text-foreground-disabled mt-0.5">{code} · {market}</div>
            </div>
          </div>
          <div>
            <div className="text-[14px] font-extrabold text-foreground leading-none">{price.toLocaleString()}</div>
            <div className={`text-[10px] font-medium mt-0.5 ${isUp ? 'text-up' : 'text-down'}`}>{isUp ? '▲' : '▼'} {Math.abs(change).toLocaleString()} ({isUp ? '+' : ''}{changeRate.toFixed(2)}%)</div>
          </div>
        </div>
      )
    }

    /* 주가/차트 — 와이드 2×1 */
    case 'stock-wide': {
      const stock = stocks ? stocks[typeIndex] : null
      const name = stock?.name ?? PREVIEW_STOCK_NAME
      const code = stock?.stockCode ?? PREVIEW_STOCK_CODE
      const market = stock?.marketType ?? PREVIEW_STOCK_MARKET
      const price = (stock?.price && stock.price > 0) ? stock.price : (stock ? getStockPrice(stock.stockCode) : 99000)
      const change = stock?.change ?? 350
      const changeRate = stock?.changeRate ?? 0.79
      const isUp = change >= 0

      return (
        <div className="flex h-full gap-2.5">
          <div className="flex flex-col justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <StockAvatar name={name} stockCode={code} marketType={market} size="sm" />
              <div>
                <div className="text-[10px] font-bold text-foreground leading-none">{name}</div>
                <div className="text-[8px] text-foreground-disabled mt-0.5">{code} · {market}</div>
              </div>
            </div>
            <div>
              <div className="text-[14px] font-extrabold text-foreground leading-none">{price.toLocaleString()}</div>
              <div className={`text-[10px] mt-0.5 ${isUp ? 'text-up' : 'text-down'}`}>▲ {isUp ? '+' : ''}{change.toLocaleString()} ({isUp ? '+' : ''}{changeRate.toFixed(2)}%)</div>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <MiniCandleChart candleRatio={0.81} />
          </div>
        </div>
      )
    }

    /* 실시간 순위 — 목록형 2×1 */
    case 'ranking-wide': {
      const rankingData = stocks
        ? stocks.map(s => [
            String(s.rank),
            s.name,
            `${s.changeRate >= 0 ? '+' : ''}${s.changeRate.toFixed(2)}%`,
            true
          ])
        : [
            ['1', '삼성전자',       '+1.62%', true ],
            ['2', 'SK하이닉스',     '+2.35%', true ],
            ['3', 'LG에너지솔루션', '-0.87%', false],
            ['4', 'POSCO홀딩스',    '+0.54%', true ],
            ['5', '현대차',         '-1.20%', false],
          ]
      return (
        <div className="flex flex-col h-full gap-1.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">실시간 순위</span>
            <div className="flex gap-1.5">
            {['거래금', '급상승', '거래량'].map((tab, i) => (
              <span key={tab} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${i === 0 ? 'bg-primary-light text-primary' : 'text-foreground-disabled'}`}>{tab}</span>
            ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {rankingData.map(([rank, name, chg, up]) => (
              <div key={rank} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-foreground-disabled w-3">{rank}</span>
                  <span className="text-[10px] font-medium text-foreground">{name}</span>
                </div>
                <span className={`text-[10px] font-semibold ${up ? 'text-up' : 'text-down'}`}>{up ? '▲' : '▼'} {chg}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* 실시간 순위 — 확장형 2×2 */
    case 'ranking-lg': {
      const rankingData = sectorStocks
        ? sectorStocks.slice(0, 10).map(s => [
            String(s.rank),
            s.name,
            `${s.changeRate >= 0 ? '+' : ''}${s.changeRate.toFixed(2)}%`,
            true
          ])
        : [
            ['1',  '삼성전자',       '+1.62%', true ],
            ['2',  'SK하이닉스',     '+2.35%', true ],
            ['3',  'LG에너지솔루션', '-0.87%', false],
            ['4',  'POSCO홀딩스',    '+0.54%', true ],
            ['5',  '현대차',         '-1.20%', false],
            ['6',  '카카오',         '+0.38%', true ],
            ['7',  'NAVER',          '-0.92%', false],
            ['8',  'KB금융',         '+1.15%', true ],
            ['9',  '셀트리온',       '+2.40%', true ],
            ['10', '기아',           '+0.76%', true ],
          ]
      return (
        <div className="flex flex-col h-full gap-1.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">실시간 순위</span>
            <div className="flex gap-1.5">
            {['거래금', '급상승', '거래량'].map((tab, i) => (
              <span key={tab} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${i === 0 ? 'bg-primary-light text-primary' : 'text-foreground-disabled'}`}>{tab}</span>
            ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {rankingData.map(([rank, name, chg, up]) => (
              <div key={rank} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-foreground-disabled w-4">{rank}</span>
                  <span className="text-[10px] font-medium text-foreground">{name}</span>
                </div>
                <span className={`text-[10px] font-semibold ${up ? 'text-up' : 'text-down'}`}>{up ? '▲' : '▼'} {chg}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* 주요 지수 — 단일 1×1 */
    case 'index-sm':
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">주요 지수</span>
            <Settings2 className="w-2.5 h-2.5 text-foreground-disabled" />
          </div>
          <div className="flex-1 flex flex-col justify-center items-center text-center min-h-0">
            <div className="text-[8px] text-foreground-disabled">KOSPI</div>
            <div className="text-[15px] font-extrabold text-foreground leading-tight">2,685.42</div>
            <div className="text-[9px] text-up font-medium">▲ +0.46%</div>
          </div>
        </div>
      )

    /* 주요 지수 — 복합 2×1 */
    case 'index-wide':
      return (
        <div className="flex flex-col h-full gap-1">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">주요 지수</span>
            <Settings2 className="w-2.5 h-2.5 text-foreground-disabled" />
          </div>
          <div className="flex flex-1 min-h-0 divide-x divide-stroke">
            {[
              { name: 'KOSPI',  val: '2,685', chg: '+0.46%', up: true  },
              { name: 'KOSDAQ', val: '842',   chg: '-0.63%', up: false },
            ].map(({ name, val, chg, up }) => (
              <div key={name} className="flex-1 flex flex-col justify-center items-center text-center px-2">
                <span className="text-[9px] font-semibold text-foreground-disabled">{name}</span>
                <div className="text-[12px] font-extrabold text-foreground leading-none">{val}</div>
                <span className={`text-[9px] font-medium ${up ? 'text-up' : 'text-down'}`}>{chg}</span>
              </div>
            ))}
          </div>
        </div>
      )

    /* 포트폴리오 — 도넛차트 1×1 */
    case 'portfolio-sm':
      return (
        <div className="flex flex-col h-full gap-2">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[9px] text-foreground-disabled">종목별 비중</span>
            <span className="text-[10px] font-bold text-down">+5.2%</span>
          </div>
          <div className="flex items-center gap-2.5 flex-1 min-h-0">
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: 'conic-gradient(var(--color-chart-1) 0% 34%, var(--color-chart-2) 34% 54%, var(--color-chart-3) 54% 72%, var(--color-chart-4) 72% 100%)' }}
              />
              <div className="relative w-7 h-7 rounded-full bg-surface" />
            </div>
            <div className="flex flex-col gap-1">
              {[
                { name: '삼성', color: 'bg-chart-1' },
                { name: 'SK하이', color: 'bg-chart-2' },
                { name: 'LG에너', color: 'bg-chart-3' },
                { name: '기타', color: 'bg-chart-4' },
              ].map(({ name, color }) => (
                <div key={name} className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />
                  <span className="text-[8px] text-foreground-secondary">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    /* 포트폴리오 — 상세 2×1 */
    case 'portfolio-wide':
      return (
        <div className="flex flex-col h-full gap-1.5">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[9px] text-foreground-disabled">종목별 비중</span>
            <span className="text-[10px] font-bold text-down">+5.2%</span>
          </div>
          <div className="flex items-center gap-3 flex-1 min-h-0">
            <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: 'conic-gradient(var(--color-chart-1) 0% 34%, var(--color-chart-2) 34% 54%, var(--color-chart-3) 54% 72%, var(--color-chart-4) 72% 100%)' }}
              />
              <div className="relative w-6 h-6 rounded-full bg-surface" />
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                { name: '삼성전자',   pct: 34, color: 'bg-chart-1' },
                { name: 'SK하이닉스', pct: 20, color: 'bg-chart-2' },
                { name: 'LG에너지',   pct: 18, color: 'bg-chart-3' },
                { name: '기타',       pct: 28, color: 'bg-chart-4' },
              ].map(({ name, pct, color }) => (
                <div key={name} className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />
                  <span className="text-[8px] text-foreground-secondary">{name}</span>
                  <span className="text-[8px] font-semibold text-foreground ml-auto">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    /* 환율 — 단일 1×1 */
    case 'exchange-sm':
      return (
        <div className="flex flex-col h-full">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">환율</span>
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 text-center">
            <div className="text-[8px] text-foreground-disabled">USD / KRW</div>
            <div className="text-[15px] font-extrabold text-foreground leading-tight">1,378.50</div>
            <div className="text-[9px] font-semibold text-down mt-0.5">▼ −2.30 (−0.17%)</div>
          </div>
        </div>
      )

    /* 오늘의 시황 — 헤드라인 1×1 */
    case 'market-sm':
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-1 shrink-0 mb-1">
            <span className="text-[9px] font-semibold text-foreground-disabled uppercase tracking-[.04em]">오늘의 시황</span>
            <div className="flex gap-1">
              <span className="px-1.5 py-px text-[7px] font-semibold rounded bg-primary text-white">국내</span>
              <span className="px-1.5 py-px text-[7px] font-semibold rounded text-foreground-disabled">해외</span>
            </div>
          </div>
          <div className="flex items-start py-1.5 border-b border-stroke last:border-b-0">
            <p className="text-[8px] text-foreground leading-snug line-clamp-6">
              美 CPI 예상치 하회… 나스닥 1% 상승, 인플레이션 둔화 기대에 기술주 중심 매수세가 유입되며 반도체·소프트웨어 중심으로 상승 폭 확대
            </p>
          </div>
        </div>
      )

    /* 오늘의 시황 — 상세 2×1 */
    case 'market-wide':
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-1 shrink-0 mb-1">
            <span className="text-[9px] font-semibold text-foreground-disabled uppercase tracking-[.04em]">오늘의 시황</span>
            <div className="flex gap-1">
              <span className="px-1.5 py-px text-[7px] font-semibold rounded bg-primary text-white">국내</span>
              <span className="px-1.5 py-px text-[7px] font-semibold rounded text-foreground-disabled">해외</span>
            </div>
          </div>
          <div className="flex flex-col">
            {[
              { title: '美 CPI 예상치 하회… 나스닥 1% 상승', desc: '긴축 우려 완화. AI 관련주 반등.' },
              { title: '外人 순매수 4,200억 · 반도체↑',      desc: '삼성·SK하이닉스 강세.' },
            ].map(({ title, desc }, i) => (
              <div key={i} className="flex flex-col gap-0.5 py-1.5 border-b border-stroke last:border-b-0 pl-1.5 border-l-2 border-l-transparent">
                <p className="text-[9px] font-semibold text-foreground leading-snug">{title}</p>
                <p className="text-[8px] text-foreground-disabled leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )

    /* 관심종목 — 컴팩트 1×1 */
    case 'watchlist-sm': {
      const watchData = stocks
        ? stocks.slice(0, 5).map(s => ({
            name: s.name,
            chg: `${s.change >= 0 ? '+' : ''}${s.changeRate.toFixed(2)}%`,
            up: s.change >= 0
          }))
        : [
            { name: '삼성전자',   chg: '+1.62%', up: true  },
            { name: '현대차',     chg: '-0.43%', up: false },
            { name: 'LG에너지',   chg: '+0.91%', up: true  },
            { name: 'SK하이닉스', chg: '-0.82%', up: false },
            { name: 'NAVER',      chg: '-0.51%', up: false },
          ]

      return (
        <div className="flex flex-col h-full gap-1">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">관심종목</span>
            <Settings2 className="w-2.5 h-2.5 text-foreground-disabled" />
          </div>
          <div className="flex flex-col gap-1.5">
            {watchData.map(({ name, chg, up }) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-foreground">{name}</span>
                <span className={`text-[9px] font-semibold ${up ? 'text-up' : 'text-down'}`}>{chg}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* 관심종목 — 목록형 2×1 */
    case 'watchlist-wide': {
      const watchData = stocks
        ? stocks.slice(0, 3).map(s => ({
            name: s.name,
            code: s.stockCode,
            price: ((s.price && s.price > 0) ? s.price : getStockPrice(s.stockCode)).toLocaleString(),
            chg: `${s.change >= 0 ? '+' : ''}${s.changeRate.toFixed(2)}%`,
            up: s.change >= 0
          }))
        : [
            { name: '삼성전자',       code: '005930', price: '75,400',  chg: '+1.62%', up: true  },
            { name: '현대차',         code: '005380', price: '221,500', chg: '-0.43%', up: false },
            { name: 'LG에너지솔루션', code: '373220', price: '412,000', chg: '+0.91%', up: true  },
          ]

      return (
        <div className="flex flex-col h-full gap-1">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">관심종목</span>
            <Settings2 className="w-2.5 h-2.5 text-foreground-disabled" />
          </div>
          <div className="flex flex-col gap-1.5">
            {watchData.map(({ name, code, price, chg, up }) => (
              <div key={name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <StockAvatar name={name} stockCode={code} marketType="KOSPI" size="sm" />
                  <span className="text-[10px] font-medium text-foreground truncate">{name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-semibold text-foreground">{price}</span>
                  <span className={cn('text-[9px] font-medium', up ? 'text-up' : 'text-down')}>{chg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* 거래내역 — 주간 2×1 */
    case 'trade-wide': {
      const wDays = ['일', '월', '화', '수', '목', '금', '토']
      const weekCells = [
        { d: 16, trades: null },
        { d: 17, trades: [{ s: '현대차', buy: true  }] },
        { d: 18, trades: [{ s: '삼성',   buy: true  }, { s: 'NAVER',  buy: false }] },
        { d: 19, trades: [{ s: 'LG에너', buy: true  }] },
        { d: 20, trades: [{ s: 'SK하이', buy: false }] },
        { d: 21, trades: [{ s: '삼성',   buy: true  }, { s: 'SK',     buy: false }] },
        { d: 22, trades: null },
      ]
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-[9px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">거래내역</span>
            <span className="text-[8px] text-foreground-disabled">2026년 3월</span>
          </div>
          <div className="grid grid-cols-7 gap-0.5 shrink-0 mb-1">
            {wDays.map((d, i) => (
              <div key={d} className={cn('text-[7px] font-semibold text-center', i === 0 ? 'text-up' : i === 6 ? 'text-down' : 'text-foreground-disabled')}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 flex-1">
            {weekCells.map(({ d, trades }, i) => {
              const dateColor = i === 0 ? 'text-up' : i === 6 ? 'text-down' : 'text-foreground'
              return (
                <div key={i} className="flex flex-col items-start rounded-lg p-1 overflow-hidden">
                  <span className={`text-[8px] leading-none mb-1 shrink-0 w-full text-center ${dateColor}`}>{d}</span>
                  {trades && trades.map((tr, j) => (
                    <div key={j} className="flex items-center gap-0.5 w-full mb-0.5 shrink-0">
                      <div className={cn('w-0.5 rounded-full shrink-0 self-stretch', tr.buy ? 'bg-up' : 'bg-down')} />
                      <span className="text-[7px] leading-snug truncate text-foreground">{tr.s}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    /* 거래내역 — 목록형 1×1 */
    case 'trade-list':
      return (
        <div className="flex flex-col h-full gap-1">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">거래내역</span>
          <div className="flex flex-col gap-1.5">
            {[
              { name: '삼성전자',   type: '매수', qty: '10주', date: '3.18' },
              { name: 'SK하이닉스', type: '매도', qty: '5주',  date: '3.17' },
              { name: 'LG에너지',   type: '매수', qty: '3주',  date: '3.16' },
              { name: 'NAVER',      type: '매도', qty: '2주',  date: '3.15' },
              { name: '현대차',     type: '매수', qty: '7주',  date: '3.14' },
            ].map(({ name, type, qty, date }, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1 min-w-0">
                  <span className={`text-[7px] font-semibold px-1 py-px rounded shrink-0 ${type === '매수' ? 'text-up bg-up/10' : 'text-down bg-down/10'}`}>{type}</span>
                  <span className="text-[9px] text-foreground truncate">{name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[8px] text-foreground-disabled">{qty}</span>
                  <span className="text-[7px] text-foreground-disabled">{date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    /* 거래내역 — 캘린더 2×2 */
    case 'trade-cal': {
      const days = ['일', '월', '화', '수', '목', '금', '토']
      const cells = [null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, null]
      const tradeMap = {
        3:  [{ s: '삼성', t: true }, { s: 'SK하이', t: false }],
        7:  [{ s: '현대차', t: true }],
        12: [{ s: 'LG에너', t: true }, { s: 'NAVER', t: false }],
        18: [{ s: '삼성', t: true }, { s: 'SK', t: false }],
        25: [{ s: '포스코', t: false }],
      }
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-[9px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">거래내역</span>
            <span className="text-[8px] text-foreground-disabled">2026년 3월</span>
          </div>
          <div className="grid grid-cols-7 gap-0.5 shrink-0 mb-1">
            {days.map((d, i) => (
              <div key={d} className={cn('text-[7px] font-semibold text-center', i === 0 ? 'text-up' : i === 6 ? 'text-down' : 'text-foreground-disabled')}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 flex-1">
            {cells.map((d, i) => {
              const trades = d ? tradeMap[d] : null
              const col = i % 7
              const dateColor = col === 0 ? 'text-up' : col === 6 ? 'text-down' : 'text-foreground'
              return (
                <div
                  key={i}
                  className="flex flex-col items-center rounded p-0.5"
                >
                  <span className={`text-[8px] leading-none mb-px ${d ? dateColor : 'invisible'}`}>
                    {d ?? ''}
                  </span>
                  {trades && trades.slice(0, 2).map((tr, j) => (
                    <div key={j} className="flex items-center gap-px w-full">
                      <div className={`w-0.5 rounded-full shrink-0 self-stretch ${tr.t ? 'bg-up' : 'bg-down'}`} />
                      <span className="text-[6.5px] leading-snug truncate text-foreground">{tr.s}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    /* 계좌 잔고 — 확장형 3×1 */
    case 'balance-3x1':
      return (
        <div className="flex flex-col h-full">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0 mb-1">계좌 잔고</span>
          <div className="flex flex-col flex-1 min-h-0 gap-2">
            {/* 상: 금액 정보 */}
            <div className="flex flex-col shrink-0 gap-1">
              <div>
                <div className="text-[8px] text-foreground-disabled">총 평가자산</div>
                <div className="text-[15px] font-extrabold text-foreground leading-none mt-0.5">84,320,000</div>
                <div className="text-[8px] text-up font-semibold mt-0.5">▲ +2,152,000 (+2.61%)</div>
              </div>
              <div className="grid grid-cols-3">
                {[
                  { label: '투자원금', val: '82,168,000' },
                  { label: '평가손익', val: '+2,152,000' },
                  { label: '주문가능', val: '74,780,000' },
                ].map(({ label, val }) => (
                  <div key={label} className="min-w-0">
                    <div className="text-[7px] text-foreground-disabled">{label}</div>
                    <div className="text-[9px] font-semibold text-foreground truncate">{val}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* 하: 수익 추이 */}
            <div className="flex flex-col flex-1 min-h-0 border-t border-stroke pt-1">
              <div className="text-[8px] text-foreground-disabled shrink-0">수익 추이 (7일)</div>
              <div className="flex-1 min-h-0 flex mt-1">
                {/* y축 눈금 */}
                <div className="flex flex-col justify-between items-end pr-1 shrink-0 w-5">
                  <span className="text-[6px] text-foreground-disabled">+3%</span>
                  <span className="text-[6px] text-foreground-disabled">0%</span>
                  <span className="text-[6px] text-foreground-disabled">-1%</span>
                </div>
                {/* 차트 영역 */}
                <div className="flex flex-col flex-1 min-w-0">
                  <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="w-full flex-1 block">
                    <polyline points="0,20 17,18 33,19 50,13 67,10 83,6 100,2" fill="none" stroke="var(--color-up)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  </svg>
                  {/* x축 날짜 */}
                  <div className="flex justify-between">
                    {['03.26', '03.28', '03.30', '04.01'].map((d) => (
                      <span key={d} className="text-[6px] text-foreground-disabled">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )

    /* 계좌 잔고 — 대형 (구 2×2, 미사용) */
    case 'balance-2x2':
      return (
        <div className="flex flex-col h-full gap-2">
          <div>
            <span className="text-[9px] text-foreground-disabled">총 평가자산</span>
            <div className="text-[16px] font-extrabold text-foreground leading-none mt-0.5">84,320,000원</div>
            <div className="text-[10px] text-up font-semibold mt-0.5">▲ +2,152,000원 (+2.61%)</div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 shrink-0">
            {[
              { label: '투자원금', val: '82,168,000', color: 'text-foreground' },
              { label: '평가손익', val: '+2,152,000', color: 'text-up' },
              { label: '당일손익', val: '+342,000',   color: 'text-up' },
              { label: '수익률',   val: '+2.61%',     color: 'text-up' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-background rounded-lg px-2 py-1.5">
                <div className="text-[9px] text-foreground-disabled">{label}</div>
                <div className={`text-[11px] font-bold ${color}`}>{val}</div>
              </div>
            ))}
          </div>
          <div className="flex-1 min-h-0 bg-background rounded-lg overflow-hidden">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full block">
              <polyline points="0,27 10,22 20,24 30,18 40,20 50,13 60,15 70,8 80,10 90,5 100,2" fill="none" stroke="var(--color-up)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      )

    /* 주가/차트 — 대형 차트 2×2 */
    case 'stock-2x2': {
      const stock = stocks ? stocks[typeIndex] : null
      const name = stock?.name ?? PREVIEW_STOCK_NAME
      const code = stock?.stockCode ?? PREVIEW_STOCK_CODE
      const market = stock?.marketType ?? PREVIEW_STOCK_MARKET
      const price = (stock?.price && stock.price > 0) ? stock.price : (stock ? getStockPrice(stock.stockCode) : 99000)
      const change = stock?.change ?? 350
      const changeRate = stock?.changeRate ?? 0.79
      const isUp = change >= 0

      return (
        <div className="flex flex-col h-full gap-1.5">
          <div className="flex items-start justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <StockAvatar name={name} stockCode={code} marketType={market} size="sm" />
              <div>
                <div className="text-[11px] font-bold text-foreground leading-none">{name}</div>
                <div className="text-[9px] text-foreground-disabled mt-0.5">{code} · {market}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[14px] font-extrabold text-foreground leading-none">{price.toLocaleString()}</div>
              <div className={`text-[10px] ${isUp ? 'text-up' : 'text-down'}`}>▲ {isUp ? '+' : ''}{change.toLocaleString()} ({isUp ? '+' : ''}{changeRate.toFixed(2)}%)</div>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <MiniCandleChart candleRatio={0.81} />
          </div>
          <div className="flex justify-between shrink-0">
            {[
              { label: '시가',  val: '74,200' },
              { label: '고가',  val: '76,100' },
              { label: '저가',  val: '73,800' },
              { label: '거래량', val: '12.4M' },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <div className="text-[8px] text-foreground-disabled">{label}</div>
                <div className="text-[9px] font-semibold text-foreground">{val}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* 주요 지수 — 3지수 3×1 */
    case 'index-3x1':
      return (
        <div className="flex flex-col h-full gap-1">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">주요 지수</span>
            <Settings2 className="w-2.5 h-2.5 text-foreground-disabled" />
          </div>
          <div className="flex flex-1 min-h-0 divide-x divide-stroke">
            {[
              { name: 'KOSPI',  val: '2,685.42', chg: '+0.46%', up: true  },
              { name: 'KOSDAQ', val: '868.15',   chg: '-0.21%', up: false },
              { name: 'NASDAQ', val: '16,274',   chg: '+0.83%', up: true  },
            ].map(({ name, val, chg, up }) => (
              <div key={name} className="flex-1 flex flex-col justify-center items-center text-center px-2">
                <div className="text-[8px] text-foreground-disabled">{name}</div>
                <div className="text-[11px] font-extrabold text-foreground leading-tight">{val}</div>
                <span className={`text-[9px] font-medium ${up ? 'text-up' : 'text-down'}`}>{chg}</span>
              </div>
            ))}
          </div>
        </div>
      )

    /* 주요 지수 — 대형 (구 2×2, 미사용) */
    case 'index-2x2':
      return (
        <div className="flex flex-col h-full gap-2">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">주요 지수</span>
            <Settings2 className="w-2.5 h-2.5 text-foreground-disabled" />
          </div>
          <div className="flex flex-col justify-center gap-2.5 flex-1">
            {[
              { name: 'KOSPI',  val: '2,685.42', chg: '+0.46%', up: true  },
              { name: 'KOSDAQ', val: '868.15',   chg: '-0.21%', up: false },
              { name: 'NASDAQ', val: '16,274',   chg: '+0.83%', up: true  },
            ].map(({ name, val, chg, up }) => (
              <div key={name} className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold text-foreground-disabled">{name}</div>
                <div className="text-[12px] font-extrabold text-foreground leading-none">{val}</div>
                <div className={`text-[9px] font-medium ${up ? 'text-up' : 'text-down'}`}>{chg}</div>
              </div>
            ))}
          </div>
        </div>
      )

    /* 포트폴리오 — 대형 2×2 */
    case 'portfolio-2x2':
      
      return (
        <div className="flex flex-col h-full gap-2">
          <span className="text-[9px] text-foreground-disabled shrink-0">섹터별 비중</span>
          <div className="flex items-center gap-3 shrink-0">
            
            <div
              className="w-16 h-16 rounded-full shrink-0"
              style={{ background: 'conic-gradient(var(--color-chart-1) 0% 54%, var(--color-chart-2) 54% 72%, var(--color-chart-3) 72% 87%, var(--color-chart-4) 87% 100%)' }}
            />
            <div>
              <div className="text-[9px] text-foreground-disabled">총 수익률</div>
              <div className="text-[17px] font-extrabold text-up leading-none">+5.2%</div>
              <div className="text-[9px] text-foreground-disabled mt-0.5">+4,280,000원</div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {[
              { name: 'IT·반도체', pct: 54, color: 'bg-chart-1' },
              { name: '자동차',    pct: 18, color: 'bg-chart-2' },
              { name: '에너지',    pct: 15, color: 'bg-chart-3' },
              { name: '금융',      pct: 13, color: 'bg-chart-4' },
            ].map(({ name, pct, color }) => (
              <div key={name}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[9px] text-foreground-secondary">{name}</span>
                  <span className="text-[9px] font-semibold text-foreground">{pct}%</span>
                </div>
                <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    /* 주가/차트 — 풀 차트 3×2 */
    case 'stock-3x2': {
      const stock = stocks ? stocks[typeIndex] : null
      const name = stock?.name ?? PREVIEW_STOCK_NAME
      const code = stock?.stockCode ?? PREVIEW_STOCK_CODE
      const market = stock?.marketType ?? PREVIEW_STOCK_MARKET
      const price = (stock?.price && stock.price > 0) ? stock.price : (stock ? getStockPrice(stock.stockCode) : 99000)
      const change = stock?.change ?? 350
      const changeRate = stock?.changeRate ?? 0.79
      const isUp = change >= 0

      return (
        <div className="flex flex-col h-full gap-1.5">
          <div className="flex items-start justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <StockAvatar name={name} stockCode={code} marketType={market} size="sm" />
              <div>
                <div className="text-[11px] font-bold text-foreground leading-none">{name}</div>
                <div className="text-[8px] text-foreground-disabled mt-0.5">{code} · {market}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[14px] font-extrabold text-foreground leading-none">{price.toLocaleString()}</div>
              <div className={`text-[9px] ${isUp ? 'text-up' : 'text-down'}`}>▲ {isUp ? '+' : ''}{change.toLocaleString()} ({isUp ? '+' : ''}{changeRate.toFixed(2)}%)</div>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {['1일', '1주', '1달', '3달'].map((t, i) => (
              <span key={t} className={`text-[8px] px-1.5 py-0.5 rounded ${i === 0 ? 'bg-primary-light text-primary font-semibold' : 'text-foreground-disabled'}`}>{t}</span>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <MiniCandleChart candleRatio={0.9} volatility={1.65} />
          </div>
          <div className="flex justify-between shrink-0">
            {[
              { label: '시가',  val: '74,200' },
              { label: '고가',  val: '75,800' },
              { label: '저가',  val: '73,900' },
              { label: '거래량', val: '12.4M'  },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <div className="text-[7px] text-foreground-disabled">{label}</div>
                <div className="text-[8px] font-semibold text-foreground">{val}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* 환율 — 대형 (구 2×2, 미사용) */
    case 'exchange-2x2':
      return (
        <div className="flex flex-col h-full gap-2">
          <div className="shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-[9px] text-foreground-disabled">USD / KRW</div>
              <span className="text-[8px] text-foreground-disabled">09:30 기준</span>
            </div>
            <div className="text-[20px] font-extrabold text-foreground leading-none">1,378.50</div>
            <div className="text-[10px] text-down">▼ -2.30 (-0.17%)</div>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { pair: 'JPY / KRW', rate: '9.18',     chg: '+0.11%', up: true  },
              { pair: 'EUR / KRW', rate: '1,502.30', chg: '-0.05%', up: false },
              { pair: 'CNY / KRW', rate: '189.80',   chg: '+0.08%', up: true  },
            ].map(({ pair, rate, chg, up }) => (
              <div key={pair} className="flex items-center justify-between">
                <span className="text-[10px] text-foreground-secondary">{pair}</span>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-foreground">{rate}</span>
                  <span className={`text-[9px] ml-1.5 ${up ? 'text-up' : 'text-down'}`}>{chg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    /* 종목별 뉴스 — 헤드라인 1×1 */
    case 'stock-news-sm': {
      const stock = stocks ? stocks[typeIndex] : null
      const name = stock?.name ?? PREVIEW_STOCK_NAME
      const newsTitles = [
        `${name}, 분기 실적 기대감에 강세`,
        '배당 매력 부각, 기관 순매수 확대',
        '호재 반영 밸류에이션 재평가',
      ]

      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-1 shrink-0 mb-1">
            <span className="text-[9px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 뉴스</span>
            <span className="flex items-center gap-0.5 text-[8px] font-semibold text-primary shrink-0">
              {name}
              <ChevronDown size={9} />
            </span>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            {newsTitles.map((title, i) => (
              <div key={i} className="flex items-start gap-1.5 py-1 border-b border-stroke last:border-b-0 pl-2 border-l-2 border-l-transparent">
                <span className="text-[8px] font-bold text-primary mt-[1px] shrink-0">{i + 1}</span>
                <p className="text-[9px] text-foreground leading-snug line-clamp-2">{title}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* 종목별 뉴스 — 상세 2×1 */
    case 'stock-news-wide': {
      const stock = stocks ? stocks[typeIndex] : null
      const name = stock?.name ?? PREVIEW_STOCK_NAME
      const newsData = [
        { title: `${name}, 분기 실적 기대감에 강세`, source: '연합뉴스', at: '1시간 전' },
        { title: '배당 매력 부각, 기관 순매수 확대', source: '매일경제', at: '2시간 전' },
      ]

      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-1 shrink-0 mb-1">
            <span className="text-[9px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 뉴스</span>
            <span className="flex items-center gap-0.5 text-[8px] font-semibold text-primary shrink-0">
              {name}
              <ChevronDown size={9} />
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {newsData.map(({ title, source, at }, i) => (
              <div
                key={i}
                className="flex gap-2 py-2 border-b border-stroke last:border-b-0 pl-2 border-l-2 border-l-transparent"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold text-foreground leading-snug line-clamp-2">{title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[8px] text-foreground-disabled">{source}</span>
                    <span className="text-[8px] text-stroke">·</span>
                    <span className="text-[8px] text-foreground-disabled">{at}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* 종목별 뉴스 — 대형 2×2 */
    case 'stock-news-2x2': {
      const stock = stocks ? stocks[typeIndex] : null
      const name = stock?.name ?? PREVIEW_STOCK_NAME
      const newsData = [
        { title: `${name}, 분기 실적 기대감에 강세`, source: '연합뉴스', at: '1시간 전' },
        { title: '배당 매력 부각, 기관 순매수 확대', source: '매일경제', at: '2시간 전' },
        { title: '호재 반영 밸류에이션 재평가', source: '한국경제', at: '4시간 전' },
      ]

      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-1 shrink-0 mb-1">
            <span className="text-[9px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 뉴스</span>
            <span className="flex items-center gap-0.5 text-[8px] font-semibold text-primary shrink-0">
              {name}
              <ChevronDown size={9} />
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {newsData.map(({ title, source, at }, i) => (
              <div
                key={i}
                className="flex gap-2 py-2 border-b border-stroke last:border-b-0 pl-2 border-l-2 border-l-transparent"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold text-foreground leading-snug line-clamp-2">{title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[8px] text-foreground-disabled">{source}</span>
                    <span className="text-[8px] text-stroke">·</span>
                    <span className="text-[8px] text-foreground-disabled">{at}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* 오늘의 시황 — 대형 2×2 */
    case 'market-2x2':
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-1 shrink-0 mb-1">
            <span className="text-[9px] font-semibold text-foreground-disabled uppercase tracking-[.04em]">오늘의 시황</span>
            <div className="flex gap-1">
              <span className="px-1.5 py-px text-[7px] font-semibold rounded bg-primary text-white">국내</span>
              <span className="px-1.5 py-px text-[7px] font-semibold rounded text-foreground-disabled">해외</span>
            </div>
          </div>
          <div className="flex flex-col flex-1 min-h-0 gap-2">
            <div>
              <div className="text-[8px] font-semibold text-foreground-disabled uppercase tracking-[.04em]">국내 시황</div>
              <div className="mt-0.5 flex flex-col gap-0.5 py-1.5 border-b border-stroke pl-1.5 border-l-2 border-l-transparent">
                <p className="text-[9px] font-semibold text-foreground leading-snug">外人 순매수 4,200억 · 반도체↑</p>
                <p className="text-[8px] text-foreground-disabled leading-snug">삼성·SK하이닉스 강세, 코스피 상승 마감.</p>
              </div>
            </div>
            <div>
              <div className="text-[8px] font-semibold text-foreground-disabled uppercase tracking-[.04em]">해외 시황</div>
              <div className="mt-0.5 flex flex-col gap-0.5 py-1.5 border-b border-stroke pl-1.5 border-l-2 border-l-transparent">
                <p className="text-[9px] font-semibold text-foreground leading-snug">美 CPI 예상치 하회… 나스닥 1% 상승</p>
                <p className="text-[8px] text-foreground-disabled leading-snug">인플레이션 둔화 기대, 기술주 중심 반등.</p>
              </div>
            </div>
          </div>
        </div>
      )

    /* 거래내역 — 캘린더+목록 3×2 */
    case 'trade-3x2': {
      const days = ['일', '월', '화', '수', '목', '금', '토']
      const cells = [null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, null]
      const tradeMap = {
        3:  [{ s: '삼성', t: true }, { s: 'SK하이', t: false }],
        12: [{ s: 'LG에너', t: true }, { s: 'NAVER', t: false }],
        18: [{ s: '삼성', t: true }, { s: 'SK', t: false }],
        25: [{ s: '포스코', t: false }],
      }
      const trades = [
        { name: '삼성전자',   type: '매수', qty: '10주', price: '75,400', date: '3.18' },
        { name: 'SK하이닉스', type: '매도', qty: '5주',  price: '182,000', date: '3.17' },
        { name: 'LG에너지',   type: '매수', qty: '3주',  price: '412,000', date: '3.16' },
        { name: 'NAVER',      type: '매도', qty: '2주',  price: '215,500', date: '3.15' },
        { name: '현대차',     type: '매수', qty: '7주',  price: '221,500', date: '3.14' },
      ]
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-[9px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">거래내역</span>
            <span className="text-[8px] text-foreground-disabled">2026년 3월</span>
          </div>
          <div className="flex flex-1 min-h-0 gap-2">
            <div className="flex flex-col flex-1 min-h-0">
              <div className="grid grid-cols-7 gap-0.5 shrink-0 mb-1">
                {days.map((d, i) => (
                  <div key={d} className={cn('text-[6px] font-semibold text-center', i === 0 ? 'text-up' : i === 6 ? 'text-down' : 'text-foreground-disabled')}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 flex-1">
                {cells.map((d, i) => {
                  const ts = d ? tradeMap[d] : null
                  const col = i % 7
                  const dateColor = col === 0 ? 'text-up' : col === 6 ? 'text-down' : 'text-foreground'
                  return (
                    <div key={i} className="flex flex-col items-center rounded p-0.5">
                      <span className={`text-[7px] leading-none mb-px w-full text-center ${d ? dateColor : 'invisible'}`}>{d ?? ''}</span>
                      {ts && ts.slice(0, 2).map((tr, j) => (
                        <div key={j} className="flex items-center gap-px w-full">
                          <div className={`w-0.5 rounded-full shrink-0 self-stretch ${tr.t ? 'bg-up' : 'bg-down'}`} />
                          <span className="text-[6px] leading-snug truncate text-foreground">{tr.s}</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-col min-h-0 border-l border-stroke pl-2 shrink-0 w-[40%]">
              <span className="text-[7px] font-semibold text-foreground-disabled mb-1 shrink-0">거래 내역</span>
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
                {trades.map(({ name, type, qty, price, date }, i) => (
                  <div key={i} className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className={`text-[6px] font-semibold px-1 py-px rounded shrink-0 ${type === '매수' ? 'text-up bg-up/10' : 'text-down bg-down/10'}`}>{type}</span>
                      <span className="text-[8px] text-foreground truncate">{name}</span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[7px] font-semibold text-foreground">{price}</span>
                      <span className="text-[6px] text-foreground-disabled">{qty} · {date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    default:
      return null
  }
}

/* ── VariantPreview ─────────────────────────────────────── */
function VariantPreview({ variant }) {
  const { colSpan, rowSpan } = variant
  const { previewCellWidth, previewCellHeight } = useGridStore()
  const cw = previewCellWidth || MIN_CELL_WIDTH
  const ch = previewCellHeight || MIN_CELL_HEIGHT
  const ratio = calcAspectRatio(colSpan, rowSpan, cw, ch)

  /* 모든 variant에 동일한 scale(0.6667) 적용.
     내부 콘텐츠를 150% 크기로 렌더 후 축소 → 모든 텍스트·요소 크기가
     colSpan에 관계없이 동일한 비율로 표시됨. overflow-hidden으로 클리핑. */
  return (
    <div
      className="w-full border border-stroke rounded-xl bg-surface overflow-hidden relative"
      style={{ aspectRatio: ratio }}
    >
      <div className="absolute top-0 left-0 w-[150%] h-[150%] origin-top-left scale-[0.6667] p-3">
        <PreviewContent type={variant.preview} />
      </div>
    </div>
  )
}

/* ── DraggableVariantItem ───────────────────────────────── */
function DraggableVariantItem({ variant, widgetType, canAdd }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-widget-${variant.id}`,
    disabled: !canAdd,
    data: { type: 'new-widget', widgetTypeId: widgetType.id, variant },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative group',
        widthClass(variant.colSpan),
        canAdd ? 'cursor-grab' : 'cursor-default',
        isDragging && 'opacity-40',
      )}
      {...attributes}
      {...listeners}
    >
      <VariantPreview variant={variant} />
      {canAdd ? (
        /* hover 드래그 힌트 오버레이 — pointer-events-none으로 drag 이벤트 차단 안 함 */
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-primary/10 border border-primary flex items-center justify-center transition-opacity duration-[150ms] pointer-events-none">
          <span className="text-[10px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
            드래그하여 추가
          </span>
        </div>
      ) : (
        /* 공간 부족 오버레이 — 항상 표시 */
        <div className="absolute inset-0 rounded-xl bg-background/60 border border-stroke flex items-center justify-center pointer-events-none">
          <span className="text-[10px] text-foreground-disabled font-medium">공간 부족</span>
        </div>
      )}
    </div>
  )
}

/* ── WidgetSizeList ─────────────────────────────────────── */
export default function WidgetSizeList({ widgetType, onBack }) {
  const widgets = useWidgetStore((s) => s.widgets)

  return (
    <>
      {/* 헤더 */}
      <div className="px-4 pt-4 pb-3 border-b border-stroke shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[12px] text-foreground-tertiary hover:text-primary transition-colors duration-[150ms] mb-3"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          위젯 목록
        </button>
        <div className="text-[14px] font-bold text-foreground">{widgetType.name}</div>
        <div className="text-[11px] text-foreground-disabled mt-0.5">{widgetType.description}</div>
      </div>

      {/* 사이즈 variant 목록 — 2열 그리드, 2-col 위젯은 full-width */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="text-[10px] font-bold text-foreground-disabled uppercase tracking-[.07em] mb-3">
          크기 선택
        </div>
        <div className="flex flex-col gap-3">
          {widgetType.variants.map((variant) => {
            const canAdd = canFitInGrid(widgets, variant.colSpan, variant.rowSpan)
            return (
              <DraggableVariantItem
                key={variant.id}
                variant={variant}
                widgetType={widgetType}
                canAdd={canAdd}
              />
            )
          })}
        </div>
        <p className="text-[10px] text-foreground-disabled mt-4 text-center">
          대시보드로 드래그하여 추가
        </p>
      </div>
    </>
  )
}
