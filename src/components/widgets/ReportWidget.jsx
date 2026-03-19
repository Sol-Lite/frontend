import WidgetCard from './WidgetCard'

const REPORTS = [
  { title: '삼성전자 목표가 상향',          firm: '키움증권',    date: '3.18', desc: '반도체 업황 회복 기대감' },
  { title: 'SK하이닉스 HBM 수요 긍정적',    firm: '삼성증권',    date: '3.17', desc: 'AI 서버 수요 지속 증가' },
  { title: 'LG에너지 실적 전망 하향',       firm: 'NH투자증권',  date: '3.16', desc: 'EV 시장 성장 둔화 우려' },
  { title: '현대차 글로벌 판매 호조 지속',  firm: '한국투자증권', date: '3.15', desc: '북미 SUV 수요 견조' },
  { title: '삼성바이오 수주 확대 기대',     firm: '미래에셋',    date: '3.14', desc: 'CMO 수주 파이프라인 확대' },
  { title: 'NAVER 광고 회복세 긍정적',      firm: 'KB증권',      date: '3.13', desc: '디스플레이 광고 반등' },
]

export default function ReportWidget({ variant = 'report-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  /* ── report-wide: 목록형 2×1 ── */
  if (variant === 'report-wide') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">증권사 리포트</span>
        </div>
        <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto">
          {REPORTS.slice(0, 4).map(({ title, firm, date }) => (
            <div key={title} className="flex items-start justify-between gap-2">
              <p className="text-[10px] text-foreground leading-snug truncate">{title}</p>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] text-primary">{firm}</span>
                <span className="text-[8px] text-foreground-disabled">{date}</span>
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* ── report-2x2: 상세 목록형 2×2 ── */
  if (variant === 'report-2x2') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">증권사 리포트</span>
        </div>
        <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto">
          {REPORTS.map(({ title, firm, date, desc }) => (
            <div key={title} className="border-b border-stroke last:border-0 pb-2 last:pb-0">
              <div className="flex items-start justify-between gap-1">
                <span className="text-[11px] font-semibold text-foreground leading-snug">{title}</span>
                <span className="text-[9px] text-foreground-disabled shrink-0 mt-0.5">{date}</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] text-primary">{firm}</span>
                <span className="text-[9px] text-foreground-disabled">· {desc}</span>
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* ── report-sm: 단일 카드 1×1 (default) ── */
  const latest = REPORTS[0]
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">증권사 리포트</span>
      </div>
      <div className="flex-1 flex flex-col justify-between min-h-0">
        <div>
          <p className="text-[12px] font-bold text-foreground leading-snug">{latest.title}</p>
          <p className="text-[10px] text-foreground-disabled mt-1">{latest.desc}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-primary font-semibold">{latest.firm}</span>
          <span className="text-[9px] text-foreground-disabled">· {latest.date}</span>
        </div>
      </div>
    </WidgetCard>
  )
}
