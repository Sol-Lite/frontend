import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import WidgetCard from './WidgetCard'
import { PORTFOLIO } from '@/mocks/home'

export default function PortfolioWidget() {
  const { isAuthenticated } = useAuthStore()

  return (
    <WidgetCard className="relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">포트폴리오</span>
        <span className="text-[10px] font-semibold text-primary">5종목</span>
      </div>
      <div className="flex items-center gap-2.5 flex-1">
        {/* 도넛 파이 차트 */}
        <div className="relative shrink-0">
          <div
            className="w-[52px] h-[52px] rounded-full"
            style={{ background: 'conic-gradient(var(--color-chart-1) 0% 34%, var(--color-chart-2) 34% 54%, var(--color-chart-3) 54% 69%, var(--color-chart-4) 69% 81%, var(--color-chart-5) 81% 100%)' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-surface shadow-inner flex items-center justify-center">
              <span className="text-[9px] font-bold text-up">{PORTFOLIO.returnRate}</span>
            </div>
          </div>
        </div>
        {/* 종목 비율 리스트 */}
        <div className="flex-1 flex flex-col gap-[3px]">
          {PORTFOLIO.items.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="w-[6px] h-[6px] rounded-sm shrink-0" style={{ background: item.color }} />
                <span className="text-[10px] text-foreground-tertiary">{item.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-[3px] rounded-full opacity-80" style={{ width: item.barWidth, background: item.color }} />
                <span className="text-[9px] font-medium text-foreground">{item.ratio}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {!isAuthenticated && <LockedOverlay message="포트폴리오를 보려면" />}
    </WidgetCard>
  )
}
