import WidgetCard from './WidgetCard'

const MOCK_STOCK = { name: '삼성전자', code: '005930' }

const MOCK_NEWS = [
  { title: 'HBM 공급 본격화 — 엔비디아향 납품 재개', desc: '3분기 HBM3E 공급 계약 확인. AI 서버 수요 확대로 수혜 기대.' },
  { title: '외국인 6거래일 연속 순매수', desc: '누적 순매수 1.2조원. 반도체 업황 개선 기대에 외국인 수급 집중.' },
  { title: '파운드리 2나노 시범 생산 개시', desc: '하반기 양산 목표로 TSMC와 경쟁 본격화.' },
]

function StockChip() {
  return (
    <span className="text-[9px] font-semibold text-primary bg-primary-light px-1.5 py-px rounded shrink-0">
      {MOCK_STOCK.name}
    </span>
  )
}

export default function StockNewsWidget({ variant = 'stock-news-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const news = variant === 'stock-news-2x2' ? MOCK_NEWS : MOCK_NEWS.slice(0, variant === 'stock-news-wide' ? 2 : 3)

  if (variant === 'stock-news-wide' || variant === 'stock-news-2x2') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 뉴스</span>
          <StockChip />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
          {news.map((item, i) => (
            <div key={i} className="flex items-start gap-2 px-1">
              <span className="text-[10px] font-semibold text-primary shrink-0 mt-px">{i + 1}</span>
              <div>
                <p className="text-[10px] text-foreground-secondary leading-relaxed font-medium">{item.title}</p>
                {variant === 'stock-news-2x2' && (
                  <p className="text-[9px] text-foreground-disabled leading-relaxed mt-0.5">{item.desc}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* stock-news-sm (default) */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 뉴스</span>
        <StockChip />
      </div>
      <div className="flex-1 flex flex-col justify-between gap-1.5">
        <div className="flex gap-2 p-2 rounded-xl bg-primary-light border border-primary-dim">
          <div className="w-1 rounded-full bg-primary self-stretch shrink-0" />
          <p className="text-[10px] text-foreground-secondary leading-relaxed">{MOCK_NEWS[0].title}</p>
        </div>
        {MOCK_NEWS.slice(1, 3).map((item) => (
          <div key={item.title} className="flex gap-2 items-start px-1">
            <div className="w-[4px] h-[4px] rounded-full bg-foreground-disabled mt-1 shrink-0" />
            <p className="text-[10px] text-foreground-disabled leading-relaxed">{item.title}</p>
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
