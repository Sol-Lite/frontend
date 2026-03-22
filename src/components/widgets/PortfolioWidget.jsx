import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import WidgetCard from './WidgetCard'
import { PORTFOLIO } from '@/mocks/home'

const CONIC_STOPS = PORTFOLIO.items.reduce((acc, item, i) => {
  const start = PORTFOLIO.items.slice(0, i).reduce((s, x) => s + x.ratio, 0)
  acc.push(`${item.color} ${start}% ${start + item.ratio}%`)
  return acc
}, []).join(', ')

export default function PortfolioWidget({ variant = 'portfolio-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const { isAuthenticated, isRestoring } = useAuthStore()

  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      {variant === 'portfolio-wide' ? (
        <>
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 비중</span>
            <span className="text-[10px] font-semibold text-up">{PORTFOLIO.returnRate}</span>
          </div>
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            {PORTFOLIO.items.slice(0, 3).map((item) => (
              <div key={item.name}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px] text-foreground-secondary">{item.name}</span>
                  <span className="text-[10px] font-semibold text-foreground">{item.ratio}%</span>
                </div>
                <div className="h-[3px] bg-surface-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.ratio}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : variant === 'portfolio-2x2' ? (
        <>
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">섹터별 비중</span>
          </div>
          <div className="flex flex-col flex-1 gap-3">
            <div className="flex items-center gap-3 shrink-0">
              <div
                className="w-16 h-16 rounded-full shrink-0"
                style={{ background: `conic-gradient(${CONIC_STOPS})` }}
              />
              <div>
                <div className="text-[9px] text-foreground-disabled">총 수익률</div>
                <div className="text-[22px] font-bold text-up leading-tight">{PORTFOLIO.returnRate}</div>
                <div className="text-[9px] text-foreground-disabled mt-0.5">+4,280,000원</div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 flex-1">
              {PORTFOLIO.items.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[10px] text-foreground-tertiary">{item.name}</span>
                    <span className="text-[10px] font-semibold text-foreground">{item.ratio}%</span>
                  </div>
                  <div className="h-[4px] bg-surface-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.ratio}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* portfolio-sm (default) */
        <>
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 비중</span>
            <span className="text-[10px] font-semibold text-up">{PORTFOLIO.returnRate}</span>
          </div>
          <div className="flex items-center gap-2.5 flex-1 min-h-0">
            <div
              className="w-14 h-14 rounded-full shrink-0"
              style={{ background: `conic-gradient(${CONIC_STOPS})` }}
            />
            <div className="flex flex-col gap-1">
              {PORTFOLIO.items.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
                  <span className="text-[10px] text-foreground-secondary">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!isRestoring && !isAuthenticated && <LockedOverlay message="포트폴리오를 보려면" />}
    </WidgetCard>
  )
}
