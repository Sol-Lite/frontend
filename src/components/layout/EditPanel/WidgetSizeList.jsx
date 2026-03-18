import { ChevronLeft, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'

/* ── 비율 계산 ──────────────────────────────────────────────
   패널 폭 = 2열 기준.
   너비: colSpan=1 → w-1/2,  colSpan=2 → w-full
   비율: 실제 대시보드 셀 비율 그대로
     1×1 → aspect-square
     2×1 → aspect-[2/1]
     1×2 → aspect-[1/2] (현재 실제 사용하지는 x)
     2×2 → aspect-square
─────────────────────────────────────────────────────────── */
function widthClass(colSpan) {
  return colSpan === 2 ? 'w-full' : 'w-1/2'
}

function aspectClass(colSpan, rowSpan) {
  if (colSpan === 1 && rowSpan === 2) return 'aspect-[1/2]'
  if (colSpan === 2 && rowSpan === 1) return 'aspect-[2/1]'
  if (colSpan === 2 && rowSpan === 2) return 'aspect-square'
  return 'aspect-square' // 1×1
}

function SizeBadge({ colSpan, rowSpan }) {
  return (
    <span className="text-[8px] font-semibold text-foreground-disabled bg-surface-muted px-1.5 py-0.5 rounded shrink-0">
      {colSpan}×{rowSpan}
    </span>
  )
}

/* ── 위젯별 미리보기 콘텐츠 ─────────────────────────────── */
function PreviewContent({ type }) {
  switch (type) {

    /* 계좌 잔고 — 소형 1×1 */
    case 'balance-sm':
      return (
        <div className="flex flex-col justify-between h-full">
          <span className="text-[9px] text-foreground-disabled">총 평가자산</span>
          <div>
            <div className="text-[14px] font-extrabold text-foreground leading-none">84,320,000</div>
            <div className="text-[10px] text-up font-semibold mt-1">▲ +2.61%</div>
          </div>
        </div>
      )

    /* 계좌 잔고 — 와이드 2×1 */
    case 'balance-lg':
      return (
        <div className="flex items-center justify-between h-full gap-3">
          <div className="flex flex-col justify-center gap-1">
            <span className="text-[9px] text-foreground-disabled">총 평가자산</span>
            <div className="text-[15px] font-extrabold text-foreground leading-none">84,320,000원</div>
            <div className="text-[10px] text-up font-semibold">▲ +2,152,000원 (+2.61%)</div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <div className="text-right">
              <div className="text-[9px] text-foreground-disabled">투자원금</div>
              <div className="text-[11px] font-semibold text-foreground">82,168,000</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-foreground-disabled">평가손익</div>
              <div className="text-[11px] font-semibold text-up">+2,152,000</div>
            </div>
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

    /* 주가/차트 — 차트형 1×1 */
    case 'stock-tall':
      return (
        <div className="flex flex-col h-full gap-1.5">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold text-foreground">삼성전자</span>
            <span className="text-[8px] text-foreground-disabled">1D</span>
          </div>
          <div className="flex-1 min-h-0 bg-background rounded-lg flex items-end px-1.5 pb-1.5 pt-2 gap-px">
            {[42, 58, 50, 72, 60, 68, 55, 80, 70, 85, 75, 90].map((h, i) => (
              <div key={i} className="flex-1 bg-up/50 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="shrink-0">
            <div className="text-[13px] font-extrabold text-foreground leading-none">75,400</div>
            <div className="text-[10px] text-up mt-0.5">▲ +1.62%</div>
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
        <div className="flex flex-col justify-between h-full">
          <span className="text-[9px] font-semibold text-foreground-disabled">KOSPI</span>
          <div className="flex-1 my-1.5 min-h-0 bg-background rounded flex items-end px-1 pb-1 pt-1 gap-px">
            {[50,55,48,60,52,58,54,62,56,65].map((h, i) => (
              <div key={i} className="flex-1 bg-up/50 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div>
            <div className="text-[14px] font-extrabold text-foreground leading-none">2,685.42</div>
            <div className="text-[10px] text-up font-medium mt-0.5">▲ +12.3 (+0.46%)</div>
          </div>
        </div>
      )

    /* 주요 지수 — 복합 2×1 */
    case 'index-wide':
      return (
        <div className="flex h-full divide-x divide-stroke">
          {[
            { name: 'KOSPI',  val: '2,685.42', chg: '+0.46%', up: true,  bars: [50,55,48,60,52,58,54,62] },
            { name: 'KOSDAQ', val: '868.15',   chg: '-0.21%', up: false, bars: [60,55,58,52,56,50,54,48] },
            { name: 'NASDAQ', val: '16,274',   chg: '+0.83%', up: true,  bars: [45,52,48,58,54,62,58,68] },
          ].map(({ name, val, chg, up, bars }) => (
            <div key={name} className="flex-1 flex flex-col justify-between items-center px-1 py-1">
              <div className="text-center">
                <span className="text-[9px] font-semibold text-foreground-disabled">{name}</span>
                <div className="text-[11px] font-extrabold text-foreground leading-none">{val}</div>
                <span className={`text-[9px] font-medium ${up ? 'text-up' : 'text-down'}`}>{chg}</span>
              </div>
              <div className="flex items-end gap-px h-6 w-full">
                {bars.map((h, i) => (
                  <div key={i} className={`flex-1 rounded-sm ${up ? 'bg-up/50' : 'bg-down/50'}`} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )

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
        <div className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-foreground-disabled">환율</span>
            <span className="text-[8px] text-foreground-disabled">09:30 기준</span>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-foreground-secondary">USD / KRW</div>
            <div className="text-[14px] font-extrabold text-foreground leading-none">1,378.50</div>
            <div className="text-[10px] text-down mt-0.5">▼ -2.30 (-0.17%)</div>
          </div>
        </div>
      )

    /* 환율 — 복합 2×1 */
    case 'exchange-wide':
      return (
        <div className="flex flex-col h-full gap-0.5">
          <span className="text-[7px] text-foreground-disabled text-right shrink-0">09:30 기준</span>
          <div className="flex flex-1 divide-x divide-stroke">
            {[
              { pair: 'USD/KRW', rate: '1,378.50', chg: '-0.17%', up: false, bars: [60,58,62,55,58,52,56,50] },
              { pair: 'JPY/KRW', rate: '9.18',     chg: '+0.11%', up: true,  bars: [45,48,50,52,49,54,52,56] },
              { pair: 'EUR/KRW', rate: '1,502.30', chg: '-0.05%', up: false, bars: [55,53,57,52,54,50,52,49] },
            ].map(({ pair, rate, chg, up, bars }) => (
              <div key={pair} className="flex-1 flex flex-col justify-between items-center px-1">
                <div className="text-center">
                  <span className="text-[9px] text-foreground-disabled">{pair}</span>
                  <div className="text-[11px] font-extrabold text-foreground leading-none">{rate}</div>
                  <span className={`text-[9px] ${up ? 'text-up' : 'text-down'}`}>{chg}</span>
                </div>
                <div className="flex items-end gap-px h-5 w-full">
                  {bars.map((h, i) => (
                    <div key={i} className={`flex-1 rounded-sm ${up ? 'bg-up/40' : 'bg-down/40'}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    /* 오늘의 시황 — 헤드라인 1×1 */
    case 'market-sm':
      return (
        <div className="flex flex-col h-full gap-2">
          <span className="text-[9px] font-semibold text-foreground-disabled">시황</span>
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
              '美 CPI 예상치 하회… 나스닥 1% 상승',
              'SK하이닉스 목표가 상향 조정',
              '원/달러 환율 1,378원 하락 마감',
              '코스피 외국인 순매수 이틀 연속',
            ].map((headline, i) => (
              <div key={i} className="flex items-start gap-1">
                <span className="text-[8px] text-foreground-disabled mt-px shrink-0">{i + 1}</span>
                <p className="text-[9px] text-foreground-secondary leading-snug">{headline}</p>
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

    /* 증권사 리포트 — 단일 1×1 */
    case 'report-sm':
      return (
        <div className="flex flex-col justify-between h-full">
          <span className="text-[8px] font-semibold text-foreground-disabled">리포트</span>
          <div>
            <div className="text-[9px] font-bold text-foreground leading-snug">삼성전자<br />목표가 상향</div>
            <div className="text-[8px] text-foreground-disabled mt-1">키움증권 · 3.18</div>
          </div>
        </div>
      )

    /* 증권사 리포트 — 목록형 2×1 */
    case 'report-wide':
      return (
        <div className="flex flex-col h-full gap-1">
          <span className="text-[8px] font-semibold text-foreground-disabled shrink-0">증권사 리포트</span>
          <div className="flex flex-col gap-2">
            {[
              { title: '삼성전자 목표가 상향',      firm: '키움증권',   date: '3.18' },
              { title: 'SK하이닉스 HBM 수요 긍정적', firm: '삼성증권',   date: '3.17' },
              { title: 'LG에너지 실적 전망 하향',   firm: 'NH투자증권', date: '3.16' },
              { title: '현대차 글로벌 판매 호조',   firm: '한투증권',   date: '3.15' },
            ].map(({ title, firm, date }, i) => (
              <div key={i}>
                <p className="text-[9px] text-foreground leading-snug">{title}</p>
                <span className="text-[7px] text-foreground-disabled">{firm} · {date}</span>
              </div>
            ))}
          </div>
        </div>
      )

    /* 계좌 잔고 — 대형 2×2 */
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

    /* 주요 지수 — 대형 2×2 */
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
          <span className="text-[9px] text-foreground-disabled shrink-0">섹터별 비중</span>
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

    /* 환율 — 대형 2×2 */
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

    /* 오늘의 시황 — 대형 2×2 */
    case 'market-2x2':
      return (
        <div className="flex flex-col h-full gap-1.5">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">오늘의 시황</span>
          <div className="flex flex-col gap-2">
            {[
              '美 CPI 예상치 하회… 나스닥 1% 상승',
              'SK하이닉스 목표가 상향 조정',
              '원/달러 환율 1,378원 하락 마감',
              '코스피 외국인 순매수 이틀 연속',
              '반도체 업황 긍정적… HBM 수요 증가',
            ].map((title, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-[8px] text-foreground-disabled shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-[9px] text-foreground leading-snug">{title}</p>
              </div>
            ))}
          </div>
        </div>
      )

    /* 관심종목 — 대형 2×2 */
    case 'watchlist-2x2':
      return (
        <div className="flex flex-col h-full gap-1">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">관심종목</span>
          <div className="flex flex-col gap-2">
            {[
              { name: '삼성전자',       price: '75,400',  pct: '+1.62%', up: true  },
              { name: '현대차',         price: '221,500', pct: '-0.43%', up: false },
              { name: 'LG에너지솔루션', price: '412,000', pct: '+0.91%', up: true  },
              { name: 'POSCO홀딩스',    price: '378,500', pct: '+0.53%', up: true  },
              { name: 'SK하이닉스',     price: '182,000', pct: '-0.82%', up: false },
            ].map(({ name, price, pct, up }) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-foreground">{name}</span>
                <div className="text-right">
                  <div className="text-[10px] font-semibold text-foreground">{price}</div>
                  <div className={`text-[9px] ${up ? 'text-up' : 'text-down'}`}>{pct}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    /* 증권사 리포트 — 대형 2×2 */
    case 'report-2x2':
      return (
        <div className="flex flex-col h-full gap-1.5">
          <span className="text-[9px] font-semibold text-foreground-disabled shrink-0">증권사 리포트</span>
          <div className="flex flex-col gap-2">
            {[
              { title: '삼성전자 목표가 상향',         firm: '키움증권',    date: '3.18', desc: '반도체 업황 회복 기대감' },
              { title: 'SK하이닉스 HBM 수요 긍정적',   firm: '삼성증권',    date: '3.17', desc: 'AI 서버 수요 지속 증가' },
              { title: 'LG에너지 실적 전망 하향',      firm: 'NH투자증권',  date: '3.16', desc: 'EV 시장 성장 둔화 우려' },
              { title: '현대차 글로벌 판매 호조 지속', firm: '한국투자증권', date: '3.15', desc: '북미 SUV 수요 견조' },
              { title: '삼성바이오 수주 확대 기대',    firm: '미래에셋',    date: '3.14', desc: 'CMO 수주 파이프라인 확대' },
              { title: 'NAVER 광고 회복세 긍정적',     firm: 'KB증권',      date: '3.13', desc: '디스플레이 광고 반등' },
            ].map(({ title, firm, date, desc }, i) => (
              <div key={i} className="border-b border-stroke last:border-0 pb-1.5 last:pb-0">
                <div className="flex items-start justify-between gap-1">
                  <span className="text-[10px] font-semibold text-foreground leading-snug">{title}</span>
                  <span className="text-[8px] text-foreground-disabled shrink-0 mt-0.5">{date}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[8px] text-primary">{firm}</span>
                  <span className="text-[8px] text-foreground-disabled">· {desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}

/* ── VariantPreview ─────────────────────────────────────── */
function VariantPreview({ variant }) {
  const { colSpan, rowSpan } = variant
  return (
    <div
      className={cn(
        'w-full border border-stroke rounded-xl p-3 bg-surface flex flex-col overflow-hidden',
        aspectClass(colSpan, rowSpan),
      )}
    >
      {/* 라벨 + 크기 배지 */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="text-[8px] font-semibold text-foreground-disabled uppercase tracking-[.06em]">
          {variant.label}
        </span>
        <SizeBadge colSpan={colSpan} rowSpan={rowSpan} />
      </div>
      {/* 미리보기 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PreviewContent type={variant.preview} />
      </div>
    </div>
  )
}

/* ── WidgetSizeList ─────────────────────────────────────── */
export default function WidgetSizeList({ widgetType, onBack }) {
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
          {widgetType.variants.map((variant) => (
            <div
              key={variant.id}
              className={cn('relative group', widthClass(variant.colSpan))}
            >
              <VariantPreview variant={variant} />
              {/* hover 추가 오버레이 */}
              <button
                aria-label={`${variant.label} 추가`}
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-primary/10 border border-primary flex items-center justify-center transition-opacity duration-[150ms]"
              >
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-primary-btn">
                  <Plus className="w-3.5 h-3.5 text-white" />
                </div>
              </button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-foreground-disabled mt-4 text-center">
          클릭하여 대시보드에 추가
        </p>
      </div>
    </>
  )
}
