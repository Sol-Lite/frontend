import LiveDot from '@/components/ui/LiveDot'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import WidgetCard from './WidgetCard'
import { EXCHANGE } from '@/mocks/home'

export default function ExchangeWidget() {
  const { isAuthenticated } = useAuthStore()

  return (
    <WidgetCard className="relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">환율</span>
        <LiveDot />
      </div>
      <div className="flex-1 flex flex-col justify-between">
        {EXCHANGE.map((item) => {
          const isUp = item.change > 0
          return (
            <div key={item.pair} className="flex items-center gap-2 py-1.5 px-2 rounded-xl bg-surface-subtle">
              <span className="text-[16px]">{item.flag}</span>
              <div className="flex-1">
                <div className="text-[9px] text-foreground-disabled">{item.pair}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[15px] font-bold text-foreground">{item.rate}</span>
                  <span className={`text-[9px] ${isUp ? 'text-up' : 'text-down'}`}>
                    {isUp ? '▲' : '▼'}{Math.abs(item.change)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-full py-1.5 rounded-xl bg-primary-light text-primary text-[10px] font-bold hover:bg-primary-dim transition-colors duration-[150ms]"
        >
          환전하기 →
        </button>
      </div>
      {!isAuthenticated && <LockedOverlay message="환율 정보를 보려면" />}
    </WidgetCard>
  )
}
