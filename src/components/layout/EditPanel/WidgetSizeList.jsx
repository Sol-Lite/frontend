import { ChevronLeft, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import useGridStore from '@/store/useGridStore'
import useWidgetStore, { canFitInGrid } from '@/store/useWidgetStore'
import { GRID_GAP, MIN_CELL_WIDTH, MIN_CELL_HEIGHT } from '@/lib/gridConstants'

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

/* ── 위젯별 미리보기 콘텐츠 ─────────────────────────────── */
function PreviewContent({ type }) {
  switch (type) {

    /* 계좌 잔고 — 소형 1×1 */
    case 'balance-sm':
      return (
        <div className="flex flex-col justify-between h-full">
          <span className="text-[9px] font-semibold text-foreground-disabled">계좌 잔고</span>
          <div>
            <div className="text-[8px] text-foreground-disabled mb-0.5">총 평가자산</div>
            <div className="text-[14px] font-extrabold text-foreground leading-none">84,320,000</div>
            <div className="text-[10px] text-up font-semibold mt-1">▲ +2.61%</div>
          </div>
        </div>
      )

    /* 계좌 잔고 — 와이드 2×1 */
    case 'balance-lg':
      return (
        <div className="flex flex-col h-full gap-1.5">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">계좌 잔고</span>
          <div className="shrink-0">
            <div className="text-[8px] text-foreground-disabled">총 평가자산</div>
            <div className="text-[14px] font-extrabold text-foreground leading-none">84,320,000</div>
            <div className="text-[9px] text-up font-semibold">▲ +2,152,000 (+2.61%)</div>
          </div>
          <div className="h-px bg-stroke-subtle shrink-0" />
          <div className="flex gap-2 flex-1">
            {[
              { label: '투자원금', val: '82,168,000', color: 'text-foreground' },
              { label: '평가손익', val: '+2,152,000', color: 'text-up' },
              { label: '주문가능', val: '74,780,000', color: 'text-foreground' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex-1 min-w-0">
                <div className="text-[8px] text-foreground-disabled">{label}</div>
                <div className={`text-[10px] font-semibold truncate ${color}`}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )

    /* 주가/차트 — 카드형 1×1 */
    case 'stock-sm':
      return (
        <div className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-foreground">삼성전자</span>
            <span className="text-[8px] text-foreground-disabled">005930</span>
          </div>
          <div>
            <div className="text-[14px] font-extrabold text-foreground leading-none">75,400</div>
            <div className="text-[10px] text-up font-medium mt-0.5">▲ 1,200 (+1.62%)</div>
          </div>
        </div>
      )

    /* 주가/차트 — 와이드 2×1 */
    case 'stock-wide':
      return (
        <div className="flex h-full gap-2.5">
          <div className="flex flex-col justify-between shrink-0">
            <div>
              <div className="text-[10px] font-bold text-foreground">삼성전자</div>
              <div className="text-[8px] text-foreground-disabled">005930 · KOSPI</div>
            </div>
            <div>
              <div className="text-[14px] font-extrabold text-foreground leading-none">75,400</div>
              <div className="text-[10px] text-up mt-0.5">▲ +1,200 (+1.62%)</div>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex items-end gap-px pb-1 pt-2">
            {[35,48,42,55,48,62,55,70,60,78,68,88].map((h, i) => (
              <div key={i} className="flex-1 bg-up/50 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      )

    /* 실시간 순위 — 목록형 2×1 */
    case 'ranking-wide':
      return (
        <div className="flex flex-col h-full gap-1.5">
          <div className="flex gap-1.5 shrink-0">
            {['거래대금', '상승률', '거래량'].map((tab, i) => (
              <span key={tab} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${i === 0 ? 'bg-primary-light text-primary' : 'text-foreground-disabled'}`}>{tab}</span>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            {[
              ['1', '삼성전자',       '+1.62%', true ],
              ['2', 'SK하이닉스',     '+2.35%', true ],
              ['3', 'LG에너지솔루션', '-0.87%', false],
              ['4', 'POSCO홀딩스',    '+0.54%', true ],
              ['5', '현대차',         '-1.20%', false],
            ].map(([rank, name, chg, up]) => (
              <div key={rank} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-foreground-disabled w-3">{rank}</span>
                  <span className="text-[10px] font-medium text-foreground">{name}</span>
                </div>
                <span className={`text-[10px] font-semibold ${up ? 'text-up' : 'text-down'}`}>{chg}</span>
              </div>
            ))}
          </div>
        </div>
      )

    /* 실시간 순위 — 확장형 2×2 */
    case 'ranking-lg':
      return (
        <div className="flex flex-col h-full gap-1.5">
          <div className="flex gap-1.5 shrink-0">
            {['거래대금', '상승률', '거래량'].map((tab, i) => (
              <span key={tab} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${i === 0 ? 'bg-primary-light text-primary' : 'text-foreground-disabled'}`}>{tab}</span>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            {[
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
            ].map(([rank, name, chg, up]) => (
              <div key={rank} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-foreground-disabled w-4">{rank}</span>
                  <span className="text-[10px] font-medium text-foreground">{name}</span>
                </div>
                <span className={`text-[10px] font-semibold ${up ? 'text-up' : 'text-down'}`}>{chg}</span>
              </div>
            ))}
          </div>
        </div>
      )

    /* 주요 지수 — 단일 1×1 */
    case 'index-sm':
      return (
        <div className="flex flex-col h-full">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">주요 지수</span>
          <div className="flex-1 flex flex-col justify-center items-center text-center min-h-0">
            <div className="text-[8px] text-foreground-disabled">KOSPI</div>
            <div className="text-[15px] font-extrabold text-foreground leading-tight">2,685.42</div>
            <div className="text-[9px] text-up font-medium">▲ +0.46%</div>
          </div>
          <div className="h-[18px] w-full shrink-0">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              <path d="M0,27 L25,21 L50,14 L75,8 L100,3 L100,30 L0,30 Z" fill="rgba(232,57,62,0.1)" />
              <polyline points="0,27 25,21 50,14 75,8 100,3" fill="none" stroke="var(--color-up)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      )

    /* 주요 지수 — 복합 2×1 */
    case 'index-wide': {
      const WIDE_PATHS = [
        { area: 'M0,27 L25,21 L50,14 L75,8 L100,3 L100,30 L0,30 Z', line: '0,27 25,21 50,14 75,8 100,3' },
        { area: 'M0,3 L33,12 L66,20 L100,27 L100,30 L0,30 Z',        line: '0,3 33,12 66,20 100,27'      },
      ]
      return (
        <div className="flex flex-col h-full gap-1">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">주요 지수</span>
          <div className="flex flex-1 min-h-0 divide-x divide-stroke">
            {[
              { name: 'KOSPI',  val: '2,685', chg: '+0.46%', up: true,  ...WIDE_PATHS[0] },
              { name: 'KOSDAQ', val: '842',   chg: '-0.63%', up: false, ...WIDE_PATHS[1] },
            ].map(({ name, val, chg, up, area, line }) => {
              const color = up ? 'var(--color-up)' : 'var(--color-down)'
              const fill  = up ? 'rgba(232,57,62,0.1)' : 'rgba(0,117,232,0.1)'
              return (
                <div key={name} className="flex-1 flex flex-col justify-between items-center px-2 py-0.5">
                  <div className="text-center">
                    <span className="text-[9px] font-semibold text-foreground-disabled">{name}</span>
                    <div className="text-[12px] font-extrabold text-foreground leading-none">{val}</div>
                    <span className={`text-[9px] font-medium ${up ? 'text-up' : 'text-down'}`}>{chg}</span>
                  </div>
                  <div className="h-[16px] w-full shrink-0">
                    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                      <path d={area} fill={fill} />
                      <polyline points={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    /* 포트폴리오 — 파이차트 1×1 */
    case 'portfolio-sm':
      return (
        <div className="flex flex-col h-full gap-2">
          <span className="text-[9px] text-foreground-disabled">종목별 비중</span>
          <div className="flex items-center gap-2.5 flex-1 min-h-0">
            <div
              className="w-14 h-14 rounded-full shrink-0"
              style={{ background: 'conic-gradient(var(--color-chart-1) 0% 34%, var(--color-chart-2) 34% 54%, var(--color-chart-3) 54% 72%, var(--color-chart-4) 72% 100%)' }}
            />
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
            <span className="text-[10px] font-bold text-up">+5.2%</span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { name: '삼성전자',   pct: 34, color: 'bg-chart-1' },
              { name: 'SK하이닉스', pct: 20, color: 'bg-chart-2' },
              { name: '기타',       pct: 46, color: 'bg-chart-4' },
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

    /* 환율 — 단일 1×1 */
    case 'exchange-sm':
      return (
        <div className="flex flex-col h-full">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">환율</span>
          <div className="flex-1 flex flex-col justify-center min-h-0">
            <div className="text-[8px] text-foreground-disabled">USD / KRW</div>
            <div className="text-[15px] font-extrabold text-foreground leading-tight">1,378.50</div>
            <div className="text-[9px] font-semibold text-down mt-0.5">▼ −2.30 (−0.17%)</div>
          </div>
        </div>
      )

    /* 환율 — 복합 2×1 */
    case 'exchange-wide': {
      const EX_WIDE = [
        { pair: 'USD / KRW', rate: '1,378.50', chg: '▼ −2.30 (−0.17%)', up: false, flex: '1.2', pr: 'pr-3', pl: '', area: 'M0,3 L25,10 L50,17 L75,22 L100,27 L100,30 L0,30 Z', line: '0,3 25,10 50,17 75,22 100,27', rateSize: 'text-[13px]' },
        { pair: 'JPY / KRW', rate: '9.18',     chg: '▲ +0.05 (+0.54%)', up: true,  flex: '1',   pr: '',    pl: 'pl-3', area: 'M0,27 L33,20 L66,12 L100,3 L100,30 L0,30 Z',       line: '0,27 33,20 66,12 100,3',    rateSize: 'text-[11px]' },
      ]
      return (
        <div className="flex flex-col h-full gap-1">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">환율</span>
          <div className="flex flex-1 min-h-0 divide-x divide-stroke">
            {EX_WIDE.map(({ pair, rate, chg, up, flex, pr, pl, area, line, rateSize }) => {
              const color = up ? 'var(--color-up)' : 'var(--color-down)'
              const fill  = up ? 'rgba(232,57,62,0.1)' : 'rgba(0,117,232,0.1)'
              return (
                <div key={pair} className={`flex flex-col justify-between ${pr} ${pl}`} style={{ flex }}>
                  <div>
                    <div className="text-[8px] text-foreground-disabled">{pair}</div>
                    <div className={`${rateSize} font-extrabold text-foreground leading-tight`}>{rate}</div>
                    <span className={`text-[8px] ${up ? 'text-up' : 'text-down'}`}>{chg}</span>
                  </div>
                  <div className="h-[14px] w-full shrink-0">
                    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                      <path d={area} fill={fill} />
                      <polyline points={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    /* 오늘의 시황 — 헤드라인 1×1 */
    case 'market-sm':
      return (
        <div className="flex flex-col h-full gap-2">
          <span className="text-[9px] font-semibold text-foreground-disabled">오늘의 시황</span>
          <p className="text-[10px] text-foreground-secondary leading-snug">
            美 CPI 예상치 하회…<br />나스닥 1% 이상 상승.<br />반도체 섹터 강세.
          </p>
        </div>
      )

    /* 오늘의 시황 — 상세 2×1 */
    case 'market-wide':
      return (
        <div className="flex flex-col h-full gap-1.5">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">오늘의 시황</span>
          <div className="flex flex-col gap-1.5">
            {[
              { title: '美 CPI 예상치 하회… 나스닥 1% 상승', desc: '긴축 우려 완화. AI 관련주 반등.' },
              { title: '外人 순매수 4,200억 · 반도체↑',      desc: '삼성·SK하이닉스 강세.' },
            ].map(({ title, desc }, i) => (
              <div
                key={i}
                className={`px-1.5 py-1 rounded border-l-2 ${i === 0 ? 'bg-primary-light border-primary' : 'bg-surface-subtle border-stroke'}`}
              >
                <p className="text-[9px] font-bold text-foreground leading-snug">{title}</p>
                <p className="text-[8px] text-foreground-disabled leading-snug mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )

    /* 관심종목 — 컴팩트 1×1 */
    case 'watchlist-sm':
      return (
        <div className="flex flex-col h-full gap-1">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">관심종목</span>
          <div className="flex flex-col gap-1.5">
            {[
              { name: '삼성전자',   chg: '+1.62%', up: true  },
              { name: '현대차',     chg: '-0.43%', up: false },
              { name: 'LG에너지',   chg: '+0.91%', up: true  },
              { name: 'SK하이닉스', chg: '-0.82%', up: false },
              { name: 'NAVER',      chg: '-0.51%', up: false },
            ].map(({ name, chg, up }) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-foreground">{name}</span>
                <span className={`text-[9px] font-semibold ${up ? 'text-up' : 'text-down'}`}>{chg}</span>
              </div>
            ))}
          </div>
        </div>
      )

    /* 관심종목 — 목록형 2×1 */
    case 'watchlist-wide':
      return (
        <div className="flex flex-col h-full gap-1">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">관심종목</span>
          <div className="flex flex-col gap-1.5">
            {[
              { name: '삼성전자',       price: '75,400',  chg: '+1.62%', up: true  },
              { name: '현대차',         price: '221,500', chg: '-0.43%', up: false },
              { name: 'LG에너지솔루션', price: '412,000', chg: '+0.91%', up: true  },
              { name: 'POSCO홀딩스',    price: '378,500', chg: '+0.53%', up: true  },
              { name: 'SK하이닉스',     price: '182,000', chg: '-0.82%', up: false },
            ].map(({ name, price, chg, up }) => (
              <div key={name} className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium text-foreground truncate">{name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-semibold text-foreground">{price}</span>
                  <span className={cn('text-[9px] font-medium', up ? 'text-up' : 'text-down')}>{chg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

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
        <div className="flex flex-col h-full gap-1">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[9px] font-bold text-foreground">2026년 3월</span>
            <span className="text-[8px] text-foreground-disabled">3.16 ~ 3.22</span>
          </div>
          <div className="grid grid-cols-7 gap-0.5 shrink-0">
            {wDays.map((d) => (
              <div key={d} className="text-center text-[7px] font-semibold text-foreground-disabled">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 flex-1">
            {weekCells.map(({ d, trades }, i) => (
              <div
                key={i}
                className="flex flex-col items-start justify-start rounded p-1 bg-background/50"
              >
                <span className="text-[8px] leading-none mb-1 text-foreground">{d}</span>
                {trades && trades.map((tr, j) => (
                  <div key={j} className="flex items-center gap-0.5 w-full mb-0.5">
                    <div className={cn('w-0.5 rounded-full shrink-0 self-stretch', tr.buy ? 'bg-up' : 'bg-down')} />
                    <span className="text-[7px] leading-snug truncate text-foreground">{tr.s}</span>
                  </div>
                ))}
              </div>
            ))}
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
              { name: '삼성전자',   type: '매수', qty: '10주' },
              { name: 'SK하이닉스', type: '매도', qty: '5주'  },
              { name: 'LG에너지',   type: '매수', qty: '3주'  },
              { name: 'NAVER',      type: '매도', qty: '2주'  },
              { name: '현대차',     type: '매수', qty: '7주'  },
            ].map(({ name, type, qty }, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[10px] text-foreground">{name}</span>
                <div className="flex items-center gap-1">
                  <span className={`text-[8px] font-semibold px-1 py-px rounded ${type === '매수' ? 'text-up bg-up/10' : 'text-down bg-down/10'}`}>{type}</span>
                  <span className="text-[9px] text-foreground-disabled">{qty}</span>
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
        <div className="flex flex-col h-full gap-1">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[9px] font-bold text-foreground">2026년 3월</span>
            <span className="text-[8px] text-foreground-disabled">거래내역</span>
          </div>
          <div className="grid grid-cols-7 gap-0.5 shrink-0">
            {days.map((d) => (
              <div key={d} className="text-center text-[7px] font-semibold text-foreground-disabled">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 flex-1">
            {cells.map((d, i) => {
              const trades = d ? tradeMap[d] : null
              return (
                <div
                  key={i}
                  className="flex flex-col items-start justify-start rounded p-0.5"
                >
                  <span className={`text-[8px] leading-none mb-px ${d ? 'text-foreground' : ''}`}>
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
          <div className="flex flex-1 min-h-0 gap-3">
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-[8px] text-foreground-disabled">총 평가자산</div>
                <div className="text-[15px] font-extrabold text-foreground leading-none mt-0.5">84,320,000</div>
                <div className="text-[9px] text-up font-semibold mt-0.5">▲ +2,152,000원 (+2.61%)</div>
              </div>
              <div className="flex gap-3 shrink-0">
                <div>
                  <div className="text-[8px] text-foreground-disabled">투자원금</div>
                  <div className="text-[10px] font-semibold text-foreground">82,168,000</div>
                </div>
                <div>
                  <div className="text-[8px] text-foreground-disabled">주문가능</div>
                  <div className="text-[10px] font-semibold text-foreground">74,780,000</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col flex-1 min-w-0 pl-3 border-l border-stroke">
              <div className="text-[8px] text-foreground-disabled shrink-0">수익 추이 (30일)</div>
              <div className="flex-1 min-h-0 flex items-end gap-px my-1">
                {[30,38,35,50,55,65,70,80,85,92].map((h, i) => (
                  <div key={i} className="flex-1 bg-up/50 rounded-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="text-[8px] text-foreground-disabled text-right shrink-0">최고 +5.2%</div>
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
          <div className="flex-1 min-h-0 bg-background rounded-lg flex items-end px-1.5 pb-1 pt-1.5 gap-px">
            {[30, 45, 38, 60, 52, 65, 55, 70, 62, 78, 68, 85].map((h, i) => (
              <div key={i} className="flex-1 bg-up/50 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      )

    /* 주가/차트 — 대형 차트 2×2 */
    case 'stock-2x2':
      return (
        <div className="flex flex-col h-full gap-1.5">
          <div className="flex items-start justify-between shrink-0">
            <div>
              <div className="text-[11px] font-bold text-foreground">삼성전자</div>
              <div className="text-[9px] text-foreground-disabled">005930 · KOSPI</div>
            </div>
            <div className="text-right">
              <div className="text-[14px] font-extrabold text-foreground leading-none">75,400</div>
              <div className="text-[10px] text-up">▲ +1,200 (+1.62%)</div>
            </div>
          </div>
          <div className="flex-1 min-h-0 bg-background rounded-lg flex items-end px-2 pb-2 pt-2 gap-px">
            {[38, 52, 44, 58, 48, 62, 50, 68, 56, 72, 60, 78, 65, 82, 70, 88, 75, 90, 78, 85].map((h, i) => (
              <div key={i} className="flex-1 bg-up/50 rounded-sm" style={{ height: `${h}%` }} />
            ))}
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

    /* 주요 지수 — 3지수 3×1 */
    case 'index-3x1': {
      const IDX_3X1 = [
        { name: 'KOSPI',  val: '2,685.42', chg: '+0.46%', up: true,  area: 'M0,27 L25,21 L50,14 L75,8 L100,3 L100,30 L0,30 Z',  line: '0,27 25,21 50,14 75,8 100,3'  },
        { name: 'KOSDAQ', val: '868.15',   chg: '-0.21%', up: false, area: 'M0,3 L25,10 L50,17 L75,22 L100,27 L100,30 L0,30 Z',  line: '0,3 25,10 50,17 75,22 100,27' },
        { name: 'NASDAQ', val: '16,274',   chg: '+0.83%', up: true,  area: 'M0,27 L25,21 L50,14 L75,8 L100,3 L100,30 L0,30 Z',  line: '0,27 25,21 50,14 75,8 100,3'  },
      ]
      return (
        <div className="flex flex-col h-full gap-1">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">주요 지수</span>
          <div className="flex flex-1 min-h-0 divide-x divide-stroke">
            {IDX_3X1.map(({ name, val, chg, up, area, line }) => {
              const color = up ? 'var(--color-up)' : 'var(--color-down)'
              const fill  = up ? 'rgba(232,57,62,0.1)' : 'rgba(0,117,232,0.1)'
              return (
                <div key={name} className="flex-1 flex flex-col items-center px-2">
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="text-[8px] text-foreground-disabled">{name}</div>
                    <div className="text-[11px] font-extrabold text-foreground leading-tight">{val}</div>
                    <span className={`text-[9px] font-medium ${up ? 'text-up' : 'text-down'}`}>{chg}</span>
                  </div>
                  <div className="h-[18px] w-full shrink-0">
                    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                      <path d={area} fill={fill} />
                      <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    /* 주요 지수 — 대형 (구 2×2, 미사용) */
    case 'index-2x2':
      return (
        <div className="flex flex-col h-full gap-2">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">주요 지수</span>
          <div className="flex flex-col gap-2.5">
            {[
              { name: 'KOSPI',  val: '2,685.42', chg: '+12.3',  pct: '+0.46%', up: true,  bars: [50,55,48,60,52,58,54,62] },
              { name: 'KOSDAQ', val: '868.15',   chg: '-1.8',   pct: '-0.21%', up: false, bars: [60,55,58,52,56,50,54,48] },
              { name: 'NASDAQ', val: '16,274',   chg: '+135.2', pct: '+0.83%', up: true,  bars: [45,52,48,58,54,62,58,68] },
            ].map(({ name, val, chg, pct, up, bars }) => (
              <div key={name} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-semibold text-foreground-disabled">{name}</div>
                  <div className="text-[12px] font-extrabold text-foreground leading-none">{val}</div>
                  <div className={`text-[9px] font-medium ${up ? 'text-up' : 'text-down'}`}>{chg} ({pct})</div>
                </div>
                <div className="flex items-end gap-px h-7 shrink-0">
                  {bars.map((h, i) => (
                    <div key={i} className={`w-1 rounded-sm ${up ? 'bg-up/50' : 'bg-down/50'}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
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
    case 'stock-3x2':
      return (
        <div className="flex flex-col h-full gap-1.5">
          <div className="flex items-start justify-between shrink-0">
            <div>
              <div className="text-[11px] font-bold text-foreground">삼성전자</div>
              <div className="text-[8px] text-foreground-disabled">005930 · KOSPI · 반도체</div>
            </div>
            <div className="text-right">
              <div className="text-[14px] font-extrabold text-foreground leading-none">75,400</div>
              <div className="text-[9px] text-up">▲ +1,200 (+1.62%)</div>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {['1일', '1주', '1달', '3달'].map((t, i) => (
              <span key={t} className={`text-[8px] px-1.5 py-0.5 rounded ${i === 0 ? 'bg-primary-light text-primary font-semibold' : 'text-foreground-disabled'}`}>{t}</span>
            ))}
          </div>
          <div className="flex-1 min-h-0 bg-background rounded-lg flex items-end px-2 pb-2 gap-px">
            {[28,35,32,44,48,54,58,65,70,76,82,88,92,96].map((h, i) => (
              <div key={i} className="flex-1 bg-up/50 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between shrink-0">
            {[
              { label: '시가',  val: '74,200' },
              { label: '고가',  val: '75,800' },
              { label: '저가',  val: '73,900' },
              { label: '거래량', val: '12.4M'  },
              { label: '시총',  val: '450조'  },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <div className="text-[7px] text-foreground-disabled">{label}</div>
                <div className="text-[8px] font-semibold text-foreground">{val}</div>
              </div>
            ))}
          </div>
        </div>
      )

    /* 환율 — 3통화 3×1 */
    case 'exchange-3x1': {
      const EX_3X1 = [
        { pair: 'USD / KRW', rate: '1,378.50', chg: '▼ −2.30', up: false, flex: '1.2', pr: 'pr-3', pl: '',    rateSize: 'text-[13px]', area: 'M0,3 L25,10 L50,17 L75,22 L100,27 L100,30 L0,30 Z', line: '0,3 25,10 50,17 75,22 100,27' },
        { pair: 'JPY / KRW', rate: '9.18',     chg: '▲ +0.05', up: true,  flex: '1',   pr: 'pr-2', pl: 'pl-2', rateSize: 'text-[11px]', area: 'M0,27 L33,20 L66,12 L100,3 L100,30 L0,30 Z',       line: '0,27 33,20 66,12 100,3'     },
        { pair: 'EUR / KRW', rate: '1,502.30', chg: '▼ −3.20', up: false, flex: '1',   pr: '',    pl: 'pl-2', rateSize: 'text-[11px]', area: 'M0,3 L33,12 L66,20 L100,27 L100,30 L0,30 Z',        line: '0,3 33,12 66,20 100,27'     },
      ]
      return (
        <div className="flex flex-col h-full gap-1">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">환율</span>
          <div className="flex flex-1 min-h-0 divide-x divide-stroke">
            {EX_3X1.map(({ pair, rate, chg, up, flex, pr, pl, rateSize, area, line }) => {
              const color = up ? 'var(--color-up)' : 'var(--color-down)'
              const fill  = up ? 'rgba(232,57,62,0.1)' : 'rgba(0,117,232,0.1)'
              return (
                <div key={pair} className={`flex flex-col justify-between ${pr} ${pl}`} style={{ flex }}>
                  <div>
                    <div className="text-[8px] text-foreground-disabled">{pair}</div>
                    <div className={`${rateSize} font-extrabold text-foreground leading-tight`}>{rate}</div>
                    <span className={`text-[8px] ${up ? 'text-up' : 'text-down'}`}>{chg}</span>
                  </div>
                  <div className="h-[14px] w-full shrink-0">
                    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                      <path d={area} fill={fill} />
                      <polyline points={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                </div>
              )
            })}
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
          <div className="h-10 bg-background rounded-lg flex items-end px-1.5 pb-1 gap-px shrink-0">
            {[60, 58, 62, 55, 58, 52, 56, 50, 54, 48, 52, 46].map((h, i) => (
              <div key={i} className="flex-1 bg-down/40 rounded-sm" style={{ height: `${h}%` }} />
            ))}
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
    case 'stock-news-sm':
      return (
        <div className="flex flex-col h-full gap-2">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[9px] font-semibold text-foreground-disabled">종목별 뉴스</span>
            <span className="text-[8px] font-semibold text-primary bg-primary-light px-1.5 py-px rounded">삼성전자</span>
          </div>
          <p className="text-[10px] text-foreground-secondary leading-snug">
            HBM 공급 본격화…<br />엔비디아향 납품 재개.<br />외국인 순매수 지속.
          </p>
        </div>
      )

    /* 종목별 뉴스 — 상세 2×1 */
    case 'stock-news-wide':
      return (
        <div className="flex flex-col h-full gap-1.5">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[9px] font-semibold text-foreground-disabled">종목별 뉴스</span>
            <span className="text-[8px] font-semibold text-primary bg-primary-light px-1.5 py-px rounded">삼성전자</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {[
              { title: 'HBM 공급 본격화 — 엔비디아향 납품 재개', desc: 'AI 서버 수요 확대 수혜 기대.' },
              { title: '외국인 6거래일 연속 순매수',               desc: '누적 순매수 1.2조원.' },
            ].map(({ title, desc }, i) => (
              <div
                key={i}
                className={`px-1.5 py-1 rounded border-l-2 ${i === 0 ? 'bg-primary-light border-primary' : 'bg-surface-subtle border-stroke'}`}
              >
                <p className="text-[9px] font-bold text-foreground leading-snug">{title}</p>
                <p className="text-[8px] text-foreground-disabled leading-snug mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )

    /* 종목별 뉴스 — 대형 2×2 */
    case 'stock-news-2x2':
      return (
        <div className="flex flex-col h-full gap-1.5">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[9px] font-semibold text-foreground-disabled">종목별 뉴스</span>
            <span className="text-[8px] font-semibold text-primary bg-primary-light px-1.5 py-px rounded">삼성전자</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {[
              { title: 'HBM 공급 본격화 — 엔비디아향 납품 재개', desc: 'AI 서버 수요 확대 수혜 기대.' },
              { title: '외국인 6거래일 연속 순매수',               desc: '누적 순매수 1.2조원.' },
              { title: '파운드리 2나노 시범 생산 개시',            desc: 'TSMC와 경쟁 본격화.' },
            ].map(({ title, desc }, i) => (
              <div
                key={i}
                className={`px-1.5 py-1 rounded border-l-2 ${i === 0 ? 'bg-primary-light border-primary' : 'bg-surface-subtle border-stroke'}`}
              >
                <p className="text-[9px] font-bold text-foreground leading-snug">{title}</p>
                <p className="text-[8px] text-foreground-disabled leading-snug mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )

    /* 오늘의 시황 — 대형 2×2 */
    case 'market-2x2':
      return (
        <div className="flex flex-col h-full gap-1.5">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">오늘의 시황</span>
          <div className="flex flex-col gap-1.5">
            {[
              { title: '美 CPI 예상치 하회… 나스닥 1% 상승', desc: '인플레이션 둔화. AI 관련주 반등.' },
              { title: '外人 순매수 4,200억 · 반도체↑',      desc: '삼성·SK하이닉스 강세.' },
              { title: '원달러 1,378원 소폭 하락',            desc: '금리 인하 기대감 반영.' },
            ].map(({ title, desc }, i) => (
              <div
                key={i}
                className={`px-1.5 py-1 rounded border-l-2 ${i === 0 ? 'bg-primary-light border-primary' : 'bg-surface-subtle border-stroke'}`}
              >
                <p className="text-[9px] font-bold text-foreground leading-snug">{title}</p>
                <p className="text-[8px] text-foreground-disabled leading-snug mt-0.5">{desc}</p>
              </div>
            ))}
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
        { name: '삼성전자', type: '매수' }, { name: 'SK하이닉스', type: '매도' },
        { name: 'LG에너지', type: '매수' }, { name: 'NAVER',      type: '매도' },
        { name: '현대차',   type: '매수' },
      ]
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between shrink-0 mb-1">
            <span className="text-[9px] font-bold text-foreground">2026년 3월</span>
          </div>
          <div className="flex flex-1 min-h-0 gap-2">
          <div className="flex flex-col flex-1 min-h-0">
            <div className="grid grid-cols-7 gap-0.5 shrink-0">
              {days.map((d) => (
                <div key={d} className="text-center text-[6px] font-semibold text-foreground-disabled">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 flex-1">
              {cells.map((d, i) => {
                const ts = d ? tradeMap[d] : null
                return (
                  <div key={i} className="flex flex-col items-start rounded p-0.5">
                    <span className={`text-[7px] leading-none mb-px ${d ? 'text-foreground' : ''}`}>{d ?? ''}</span>
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
          <div className="flex flex-col border-l border-stroke pl-2 shrink-0 gap-1">
            <span className="text-[7px] font-semibold text-foreground-disabled shrink-0">거래 내역</span>
            {trades.map(({ name, type }, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className={`text-[6px] font-semibold px-1 py-px rounded shrink-0 ${type === '매수' ? 'text-up bg-up/10' : 'text-down bg-down/10'}`}>{type}</span>
                <span className="text-[8px] text-foreground truncate">{name}</span>
              </div>
            ))}
          </div>
          </div>
        </div>
      )
    }

    /* 증권사 리포트 — 단일 1×1 */
    case 'report-sm': {
      const r = { title: '삼성전자 목표가 9만원으로 상향', firm: '키움증권', desc: '반도체 업황 회복 기대감' }
      return (
        <div className="flex flex-col h-full justify-between">
          <div>
            <p className="text-[10px] font-bold text-foreground leading-snug">{r.title}</p>
            <p className="text-[8px] text-foreground-disabled mt-1">{r.desc}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-primary font-semibold">{r.firm}</span>
          </div>
        </div>
      )
    }

    /* 증권사 리포트 — 목록형 2×1 */
    case 'report-wide': {
      const reports = [
        { title: '삼성전자 목표가 상향', firm: '키움증권' },
        { title: 'SK하이닉스 HBM 수요 긍정적', firm: '삼성증권' },
        { title: 'LG에너지 실적 전망 하향', firm: 'NH투자' },
      ]
      return (
        <div className="flex flex-col gap-1.5 h-full">
          {reports.map(({ title, firm }) => (
            <div key={title} className="flex items-start justify-between gap-2">
              <p className="text-[9px] text-foreground leading-snug truncate">{title}</p>
              <span className="text-[8px] text-primary shrink-0">{firm}</span>
            </div>
          ))}
        </div>
      )
    }

    /* 증권사 리포트 — 상세 2×2 */
    case 'report-2x2': {
      const reports = [
        { title: '삼성전자 목표가 상향', firm: '키움증권', desc: '반도체 업황 회복 기대감' },
        { title: 'SK하이닉스 HBM 수요 긍정적', firm: '삼성증권', desc: 'AI 서버 수요 지속 증가' },
        { title: 'LG에너지 실적 전망 하향', firm: 'NH투자', desc: 'EV 시장 성장 둔화 우려' },
      ]
      return (
        <div className="flex flex-col gap-2 h-full">
          {reports.map(({ title, firm, desc }) => (
            <div key={title} className="border-b border-stroke last:border-0 pb-2 last:pb-0">
              <div className="flex items-start justify-between gap-1">
                <span className="text-[10px] font-semibold text-foreground leading-snug">{title}</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[8px] text-primary">{firm}</span>
                <span className="text-[8px] text-foreground-disabled">· {desc}</span>
              </div>
            </div>
          ))}
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

/* ── WidgetSizeList ─────────────────────────────────────── */
export default function WidgetSizeList({ widgetType, onBack }) {
  const { widgets, addWidget } = useWidgetStore()

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
              <div
                key={variant.id}
                className={cn('relative group', widthClass(variant.colSpan))}
              >
                <VariantPreview variant={variant} />
                {canAdd ? (
                  /* hover 추가 오버레이 */
                  <button
                    aria-label={`${variant.label} 추가`}
                    onClick={() => { addWidget(widgetType.id, variant); onBack() }}
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-primary/10 border border-primary flex items-center justify-center transition-opacity duration-[150ms]"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-primary-btn">
                      <Plus className="w-3.5 h-3.5 text-white" />
                    </div>
                  </button>
                ) : (
                  /* 공간 부족 오버레이 — 항상 표시 */
                  <div className="absolute inset-0 rounded-xl bg-background/60 border border-stroke flex items-center justify-center">
                    <span className="text-[10px] text-foreground-disabled font-medium">공간 부족</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-foreground-disabled mt-4 text-center">
          클릭하여 대시보드에 추가
        </p>
      </div>
    </>
  )
}
