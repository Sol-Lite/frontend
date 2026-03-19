import LiveDot from '@/components/ui/LiveDot'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import WidgetCard from './WidgetCard'
import { EXCHANGE } from '@/mocks/home'

const EXCHANGE_EXTENDED = [
  ...EXCHANGE,
  { flag: '🇪🇺', pair: 'EUR / KRW', rate: '1,502.30', change: -0.05 },
]

function ExchangeRow({ flag, pair, rate, change }) {
  const isUp = change > 0
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-xl bg-surface-subtle">
      <span className="text-[16px]">{flag}</span>
      <div className="flex-1">
        <div className="text-[9px] text-foreground-disabled">{pair}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-[15px] font-bold text-foreground">{rate}</span>
          <span className={`text-[9px] ${isUp ? 'text-up' : 'text-down'}`}>
            {isUp ? '▲' : '▼'}{Math.abs(change)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ExchangeWidget({ variant = 'exchange-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const { isAuthenticated } = useAuthStore()
  const usd = EXCHANGE[0]

  if (variant === 'exchange-wide') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-1 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">환율</span>
          <LiveDot />
        </div>
        <div className="flex-1 flex divide-x divide-stroke">
          {EXCHANGE_EXTENDED.map(({ flag, pair, rate, change }) => {
            const isUp = change > 0
            return (
              <div key={pair} className="flex-1 flex flex-col items-center justify-center px-2 gap-1">
                <span className="text-[16px]">{flag}</span>
                <div className="text-center">
                  <div className="text-[9px] text-foreground-disabled">{pair.split(' / ')[0]} / KRW</div>
                  <div className="text-[13px] font-bold text-foreground">{rate}</div>
                  <div className={`text-[9px] ${isUp ? 'text-up' : 'text-down'}`}>
                    {isUp ? '▲' : '▼'} {Math.abs(change)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {!isAuthenticated && <LockedOverlay message="환율 정보를 보려면" />}
      </WidgetCard>
    )
  }

  if (variant === 'exchange-2x2') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-1 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">환율</span>
          <LiveDot />
        </div>
        <div className="shrink-0">
          <div className="text-[9px] text-foreground-disabled">USD / KRW</div>
          <div className="text-[22px] font-bold text-foreground leading-tight">{usd.rate}</div>
          <div className={`text-[10px] ${usd.change > 0 ? 'text-up' : 'text-down'}`}>
            {usd.change > 0 ? '▲' : '▼'} {Math.abs(usd.change)}
          </div>
        </div>
        <div className="h-10 bg-background rounded-xl flex items-end px-1.5 pb-1 gap-px my-2 shrink-0">
          {[60, 58, 62, 55, 58, 52, 56, 50, 54, 48, 52, 46].map((h, i) => (
            <div key={i} className="flex-1 bg-down/40 rounded-sm" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto">
          {EXCHANGE_EXTENDED.slice(1).map(({ flag, pair, rate, change }) => {
            const isUp = change > 0
            return (
              <div key={pair} className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">{flag}</span>
                  <span className="text-[10px] text-foreground-secondary">{pair}</span>
                </div>
                <div className="text-right">
                  <span className="text-[12px] font-semibold text-foreground">{rate}</span>
                  <span className={`text-[9px] ml-1.5 ${isUp ? 'text-up' : 'text-down'}`}>
                    {isUp ? '▲' : '▼'} {Math.abs(change)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-full py-1.5 rounded-xl bg-primary-light text-primary text-[10px] font-bold hover:bg-primary-dim transition-colors duration-[150ms] mt-2 shrink-0"
        >
          환전하기 →
        </button>
        {!isAuthenticated && <LockedOverlay message="환율 정보를 보려면" />}
      </WidgetCard>
    )
  }

  /* exchange-sm (default) */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">환율</span>
        <LiveDot />
      </div>
      <div className="flex-1 flex flex-col justify-between">
        {EXCHANGE.map((item) => <ExchangeRow key={item.pair} {...item} />)}
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
