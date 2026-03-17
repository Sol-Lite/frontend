import LiveDot from '@/components/ui/LiveDot'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import WidgetCard from './WidgetCard'
import { BALANCE } from '@/mocks/home'

export default function BalanceWidget() {
  const { isAuthenticated } = useAuthStore()

  return (
    <WidgetCard className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">계좌 잔고</span>
        <LiveDot />
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[10px] text-foreground-disabled mb-0.5">총 평가자산</div>
          <div className="text-[18px] font-bold leading-tight tracking-tight text-foreground">
            {BALANCE.total}
            <span className="text-[11px] font-medium text-foreground-tertiary ml-0.5">원</span>
          </div>
          <div className="text-[11px] font-semibold text-up mt-0.5">▲ {BALANCE.profit} ({BALANCE.profitRate})</div>
        </div>
        <div className="flex flex-col gap-1 pt-2 border-t border-stroke-subtle mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px]">🇰🇷</span>
              <span className="text-[10px] text-foreground-tertiary">KRW</span>
            </div>
            <span className="text-[10px] font-semibold text-foreground-secondary">{BALANCE.krw}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px]">🇺🇸</span>
              <span className="text-[10px] text-foreground-tertiary">USD</span>
            </div>
            <span className="text-[10px] font-semibold text-foreground-secondary">{BALANCE.usd}</span>
          </div>
        </div>
      </div>
      {!isAuthenticated && <LockedOverlay message="계좌 정보를 보려면" />}
    </WidgetCard>
  )
}
