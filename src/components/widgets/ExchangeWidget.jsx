import LiveDot from '@/components/ui/LiveDot'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import WidgetCard from './WidgetCard'
import { EXCHANGE } from '@/mocks/home'

const EXCHANGE_EXTENDED = [
  ...EXCHANGE,
  { flag: '🇪🇺', pair: 'EUR / KRW', rate: '1,502.30', change: -3.20, pct: '-0.21%' },
]

const WIDE_CHART_DATA = [
  { area: 'M0,3 L25,10 L50,17 L75,22 L100,27 L100,30 L0,30 Z',  line: '0,3 25,10 50,17 75,22 100,27'  },
  { area: 'M0,27 L33,20 L66,12 L100,3 L100,30 L0,30 Z',          line: '0,27 33,20 66,12 100,3'         },
]

const WIDE_3X1_CHART_DATA = [
  { area: 'M0,3 L25,10 L50,17 L75,22 L100,27 L100,30 L0,30 Z',  line: '0,3 25,10 50,17 75,22 100,27'  },
  { area: 'M0,27 L33,20 L66,12 L100,3 L100,30 L0,30 Z',          line: '0,27 33,20 66,12 100,3'         },
  { area: 'M0,3 L33,12 L66,20 L100,27 L100,30 L0,30 Z',          line: '0,3 33,12 66,20 100,27'         },
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

  if (variant === 'exchange-3x1') {
    const cols3x1 = [
      { ...EXCHANGE_EXTENDED[0], rateSize: 'text-[20px]', flex: '1.2', pr: 'pr-3', pl: '' },
      { ...EXCHANGE_EXTENDED[1], rateSize: 'text-[16px]', flex: '1',   pr: 'pr-2.5', pl: 'pl-2.5' },
      { ...EXCHANGE_EXTENDED[2], rateSize: 'text-[16px]', flex: '1',   pr: '',    pl: 'pl-2.5' },
    ]
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-1 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">환율</span>
          <LiveDot />
        </div>
        <div className="flex flex-1 min-h-0 divide-x divide-stroke">
          {cols3x1.map(({ pair, rate, change, rateSize, flex, pr, pl }, i) => {
            const isUp = change > 0
            const color = isUp ? 'var(--color-up)' : 'var(--color-down)'
            const fill  = isUp ? 'var(--color-up-fill)' : 'var(--color-down-fill)'
            const { area, line } = WIDE_3X1_CHART_DATA[i]
            return (
              <div key={pair} className={`flex flex-col justify-between ${pr} ${pl}`} style={{ flex }}>
                <div>
                  <div className="text-[9px] text-foreground-disabled">{pair}</div>
                  <div className={`${rateSize} font-bold text-foreground leading-tight`}>{rate}</div>
                  <div className={`text-[9px] ${isUp ? 'text-up' : 'text-down'}`}>
                    {isUp ? '▲' : '▼'} {Math.abs(change)}
                  </div>
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
        {!isAuthenticated && <LockedOverlay message="환율 정보를 보려면" />}
      </WidgetCard>
    )
  }

  if (variant === 'exchange-wide') {
    const cols2x1 = [
      { ...EXCHANGE[0], rateSize: 'text-[20px]', flex: '1.2', pr: 'pr-3', pl: '' },
      { ...EXCHANGE[1], rateSize: 'text-[16px]', flex: '1',   pr: '',    pl: 'pl-3' },
    ]
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-1 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">환율</span>
          <LiveDot />
        </div>
        <div className="flex flex-1 min-h-0 divide-x divide-stroke">
          {cols2x1.map(({ pair, rate, change, rateSize, flex, pr, pl }, i) => {
            const isUp = change > 0
            const color = isUp ? 'var(--color-up)' : 'var(--color-down)'
            const fill  = isUp ? 'var(--color-up-fill)' : 'var(--color-down-fill)'
            const { area, line } = WIDE_CHART_DATA[i]
            return (
              <div key={pair} className={`flex flex-col justify-between ${pr} ${pl}`} style={{ flex }}>
                <div>
                  <div className="text-[9px] text-foreground-disabled">{pair}</div>
                  <div className={`${rateSize} font-bold text-foreground leading-tight`}>{rate}</div>
                  <div className={`text-[9px] ${isUp ? 'text-up' : 'text-down'}`}>
                    {isUp ? '▲' : '▼'} {Math.abs(change)}
                  </div>
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
      <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase shrink-0">환율</span>
      <div className="flex-1 flex flex-col justify-center min-h-0">
        <div className="text-[9px] text-foreground-disabled">{usd.pair}</div>
        <div className="text-[18px] font-bold text-foreground leading-tight">{usd.rate}</div>
        <div className={`text-[9px] font-semibold mt-0.5 ${usd.change > 0 ? 'text-up' : 'text-down'}`}>
          {usd.change > 0 ? '▲' : '▼'} {Math.abs(usd.change)} ({usd.pct})
        </div>
      </div>
      {!isAuthenticated && <LockedOverlay message="환율 정보를 보려면" />}
    </WidgetCard>
  )
}
