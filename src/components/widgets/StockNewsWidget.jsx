import WidgetCard from './WidgetCard'

const MOCK_STOCK = { name: '삼성전자', code: '005930' }

const MOCK_NEWS = [
  { title: 'HBM 공급 본격화 — 엔비디아향 납품 재개', desc: '3분기 HBM3E 공급 계약 확인. AI 서버 수요 확대로 수혜 기대.' },
  { title: '외국인 6거래일 연속 순매수', desc: '누적 순매수 1.2조원. 반도체 업황 개선 기대에 외국인 수급 집중.' },
  { title: '파운드리 2나노 시범 생산 개시', desc: '하반기 양산 목표로 TSMC와 경쟁 본격화.' },
]

function StockChip({ showCode = false }) {
  return (
    <span className="text-widget-9 font-semibold text-primary bg-primary-light px-1.5 py-px rounded shrink-0">
      {MOCK_STOCK.name}{showCode && ` ${MOCK_STOCK.code}`}
    </span>
  )
}

export default function StockNewsWidget({ variant = 'stock-news-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  if (variant === 'stock-news-2x2') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 뉴스</span>
          <StockChip showCode />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
          {MOCK_NEWS.map((item, i) => (
            <div
              key={i}
              className={`px-2.5 py-2 rounded-xl border-l-[3px] ${
                i === 0
                  ? 'bg-primary-light border-primary'
                  : 'bg-surface-subtle border-stroke'
              }`}
            >
              <p className="text-widget-11 font-bold text-foreground leading-snug">{item.title}</p>
              <p className="text-widget-9 text-foreground-disabled leading-relaxed mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  if (variant === 'stock-news-wide') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 뉴스</span>
          <StockChip showCode />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
          {MOCK_NEWS.slice(0, 2).map((item, i) => (
            <div
              key={i}
              className={`px-2 py-1.5 rounded-lg border-l-[3px] ${
                i === 0
                  ? 'bg-primary-light border-primary'
                  : 'bg-surface-subtle border-stroke'
              }`}
            >
              <p className="text-widget-10 font-bold text-foreground leading-snug">{item.title}</p>
              <p className="text-widget-9 text-foreground-disabled leading-relaxed mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* stock-news-sm (default) — 헤드라인 3줄 */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 뉴스</span>
        <StockChip />
      </div>
      <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
        {MOCK_NEWS.map((item, i) => (
          <p
            key={i}
            className={`text-widget-10 leading-snug truncate ${
              i === 0 ? 'font-bold text-foreground' : 'text-foreground-disabled'
            }`}
          >
            {item.title}
          </p>
        ))}
      </div>
    </WidgetCard>
  )
}
