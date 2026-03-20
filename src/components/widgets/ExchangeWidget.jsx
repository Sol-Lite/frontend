import LiveDot from '@/components/ui/LiveDot'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import useCurrencyRate from '@/hooks/useCurrencyRate'
import WidgetCard from './WidgetCard'

const WIDE_CHART_DATA = [
  { area: 'M0,3 L25,10 L50,17 L75,22 L100,27 L100,30 L0,30 Z',  line: '0,3 25,10 50,17 75,22 100,27'  },
  { area: 'M0,27 L33,20 L66,12 L100,3 L100,30 L0,30 Z',          line: '0,27 33,20 66,12 100,3'         },
]

const WIDE_3X1_CHART_DATA = [
  { area: 'M0,3 L25,10 L50,17 L75,22 L100,27 L100,30 L0,30 Z',  line: '0,3 25,10 50,17 75,22 100,27'  },
  { area: 'M0,27 L33,20 L66,12 L100,3 L100,30 L0,30 Z',          line: '0,27 33,20 66,12 100,3'         },
  { area: 'M0,3 L33,12 L66,20 L100,27 L100,30 L0,30 Z',          line: '0,3 33,12 66,20 100,27'         },
]

const CURRENCIES = [
  { flag: '🇺🇸', pair: 'USD / KRW', code: 'USD' },
  { flag: '🇯🇵', pair: 'JPY / KRW', code: 'JPY' },
  { flag: '🇪🇺', pair: 'EUR / KRW', code: 'EUR' },
]

function formatRate(value) {
  if (value == null) return '—'
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}

function formatPct(drate) {
  if (drate == null) return ''
  return `${drate > 0 ? '+' : ''}${drate.toFixed(2)}%`
}

function RateDisplay({ live, rateClassName = 'text-[15px]' }) {
  const isUp = (live?.change ?? 0) > 0
  return (
    <>
      <div className={`${rateClassName} font-bold text-foreground leading-tight`}>
        {formatRate(live?.rate)}
      </div>
      {live && (
        <div className={`text-[9px] ${isUp ? 'text-up' : 'text-down'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(live.change)} ({formatPct(live.drate)})
        </div>
      )}
    </>
  )
}

export default function ExchangeWidget({ variant = 'exchange-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const { isAuthenticated, isRestoring } = useAuthStore()

  const liveUsd = useCurrencyRate('USD')
  const liveJpy = useCurrencyRate('JPY')
  const liveEur = useCurrencyRate('EUR')

  const liveRates = [liveUsd, liveJpy, liveEur]

  if (variant === 'exchange-3x1') {
    const cols = [
      { ...CURRENCIES[0], live: liveRates[0], rateSize: 'text-[20px]', flex: '1.2', pr: 'pr-3', pl: '' },
      { ...CURRENCIES[1], live: liveRates[1], rateSize: 'text-[16px]', flex: '1',   pr: 'pr-2.5', pl: 'pl-2.5' },
      { ...CURRENCIES[2], live: liveRates[2], rateSize: 'text-[16px]', flex: '1',   pr: '',    pl: 'pl-2.5' },
    ]
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-1 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">환율</span>
          <LiveDot />
        </div>
        <div className="flex flex-1 min-h-0 divide-x divide-stroke">
          {cols.map(({ pair, live, rateSize, flex, pr, pl }, i) => {
            const isUp = (live?.change ?? 0) > 0
            const color = isUp ? 'var(--color-up)' : 'var(--color-down)'
            const fill  = isUp ? 'var(--color-up-fill)' : 'var(--color-down-fill)'
            const { area, line } = WIDE_3X1_CHART_DATA[i]
            return (
              <div key={pair} className={`flex flex-col justify-between ${pr} ${pl}`} style={{ flex }}>
                <div>
                  <div className="text-[9px] text-foreground-disabled">{pair}</div>
                  <div className={`${rateSize} font-bold text-foreground leading-tight`}>{formatRate(live?.rate)}</div>
                  {live && (
                    <div className={`text-[9px] ${isUp ? 'text-up' : 'text-down'}`}>
                      {isUp ? '▲' : '▼'} {Math.abs(live.change)}
                    </div>
                  )}
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
    const cols = [
      { ...CURRENCIES[0], live: liveRates[0], rateSize: 'text-[20px]', flex: '1.2', pr: 'pr-3', pl: '' },
      { ...CURRENCIES[1], live: liveRates[1], rateSize: 'text-[16px]', flex: '1',   pr: '',    pl: 'pl-3' },
    ]
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-1 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">환율</span>
          <LiveDot />
        </div>
        <div className="flex flex-1 min-h-0 divide-x divide-stroke">
          {cols.map(({ pair, live, rateSize, flex, pr, pl }, i) => {
            const isUp = (live?.change ?? 0) > 0
            const color = isUp ? 'var(--color-up)' : 'var(--color-down)'
            const fill  = isUp ? 'var(--color-up-fill)' : 'var(--color-down-fill)'
            const { area, line } = WIDE_CHART_DATA[i]
            return (
              <div key={pair} className={`flex flex-col justify-between ${pr} ${pl}`} style={{ flex }}>
                <div>
                  <div className="text-[9px] text-foreground-disabled">{pair}</div>
                  <div className={`${rateSize} font-bold text-foreground leading-tight`}>{formatRate(live?.rate)}</div>
                  {live && (
                    <div className={`text-[9px] ${isUp ? 'text-up' : 'text-down'}`}>
                      {isUp ? '▲' : '▼'} {Math.abs(live.change)}
                    </div>
                  )}
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
        {!isRestoring && !isAuthenticated && <LockedOverlay message="환율 정보를 보려면" />}
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
          <RateDisplay live={liveUsd} rateClassName="text-[22px]" />
        </div>
        <div className="h-10 bg-background rounded-xl flex items-end px-1.5 pb-1 gap-px my-2 shrink-0">
          {[60, 58, 62, 55, 58, 52, 56, 50, 54, 48, 52, 46].map((h, i) => (
            <div key={i} className="flex-1 bg-down/40 rounded-sm" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto">
          {CURRENCIES.slice(1).map(({ flag, pair, code }, i) => {
            const live = liveRates[i + 1]
            const isUp = (live?.change ?? 0) > 0
            return (
              <div key={pair} className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">{flag}</span>
                  <span className="text-[10px] text-foreground-secondary">{pair}</span>
                </div>
                <div className="text-right">
                  <span className="text-[12px] font-semibold text-foreground">{formatRate(live?.rate)}</span>
                  {live && (
                    <span className={`text-[9px] ml-1.5 ${isUp ? 'text-up' : 'text-down'}`}>
                      {isUp ? '▲' : '▼'} {Math.abs(live.change)}
                    </span>
                  )}
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
        {!isRestoring && !isAuthenticated && <LockedOverlay message="환율 정보를 보려면" />}
      </WidgetCard>
    )
  }

  /* exchange-sm (default) */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase shrink-0">환율</span>
      <div className="flex-1 flex flex-col justify-center min-h-0">
        <div className="text-[9px] text-foreground-disabled">USD / KRW</div>
        <RateDisplay live={liveUsd} rateClassName="text-[18px]" />
      </div>
      {!isRestoring && !isAuthenticated && <LockedOverlay message="환율 정보를 보려면" />}
    </WidgetCard>
  )
}
