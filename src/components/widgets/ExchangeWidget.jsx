import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import useCurrencyRate from '@/hooks/useCurrencyRate'
import WidgetCard from './WidgetCard'
import ExchangeConfigModal from './ExchangeConfigModal'
import useWidgetStore from '@/store/useWidgetStore'
import { useDashboardSave } from '@/hooks/useDashboardSync'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'


const ALL_CURRENCIES = [
  { flag: '🇺🇸', pair: 'USD / KRW', code: 'USD' },
  { flag: '🇯🇵', pair: 'JPY / KRW', code: 'JPY' },
  { flag: '🇪🇺', pair: 'EUR / KRW', code: 'EUR' },
]

const DEFAULT_CURRENCIES = {
  'exchange-sm':  ['USD'],
  'exchange-2x2': ['USD', 'JPY', 'EUR'],
}

const LIVE_BY_CODE = { USD: 0, JPY: 1, EUR: 2 }

function formatRate(value) {
  if (value == null) return '—'
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}

function formatPct(drate) {
  if (drate == null) return ''
  return `${drate > 0 ? '+' : ''}${drate.toFixed(2)}%`
}

function RateDisplay({ live, rateClassName = 'text-widget-15' }) {
  const isUp = (live?.change ?? 0) > 0
  return (
    <>
      <div className={`${rateClassName} font-bold text-foreground leading-tight`}>
        {formatRate(live?.rate)}
      </div>
      {live?.change != null && (
        <div className={`text-widget-9 ${isUp ? 'text-up' : 'text-down'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(live.change)} ({formatPct(live.drate)})
        </div>
      )}
    </>
  )
}

export default function ExchangeWidget({ instanceId, variant = 'exchange-sm', colSpan = 1, rowSpan = 1, onDelete, config = {} }) {
  const { isAuthenticated, isRestoring } = useAuthStore()
  const updateWidgetConfig = useWidgetStore((s) => s.updateWidgetConfig)
  const { mutate: saveDashboard } = useDashboardSave()
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  const open = useWidgetDetailStore((s) => s.open)
  const handleCurrencyClick = (e, code) => {
    e.stopPropagation()
    open({ widgetTypeId: 'exchange', config: { currency: code } })
  }

  const liveUsd = useCurrencyRate('USD')
  const liveJpy = useCurrencyRate('JPY')
  const liveEur = useCurrencyRate('EUR')
  const allLive = [liveUsd, liveJpy, liveEur]

  const selectedCodes = config.currencies ?? DEFAULT_CURRENCIES[variant] ?? DEFAULT_CURRENCIES['exchange-sm']
  const currencies = selectedCodes.map((code) => ({
    ...ALL_CURRENCIES.find((c) => c.code === code),
    live: allLive[LIVE_BY_CODE[code]],
  }))

  function handleSave(newCurrencies) {
    updateWidgetConfig(instanceId, { currencies: newCurrencies })
    saveDashboard()
    setIsConfigOpen(false)
  }

  const configModal = isConfigOpen && (
    <ExchangeConfigModal
      variant={variant}
      currentCurrencies={selectedCodes}
      onSave={handleSave}
      onClose={() => setIsConfigOpen(false)}
    />
  )

  const settingsBtn = (
    <button
      onClick={(e) => { e.stopPropagation(); setIsConfigOpen(true) }}
      className="p-0.5 rounded text-foreground-disabled hover:text-foreground transition-colors"
    >
      <Settings2 className="w-3 h-3" />
    </button>
  )

  if (variant === 'exchange-2x2') {
    const primary = currencies[0]
    const rest    = currencies.slice(1)
    return (
      <>
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">환율</span>
            {settingsBtn}
          </div>
          <div
            className="shrink-0 cursor-pointer"
            onClick={(e) => handleCurrencyClick(e, primary?.code ?? 'USD')}
          >
            <div className="text-widget-9 text-foreground-disabled">{primary?.pair ?? 'USD / KRW'}</div>
            <RateDisplay live={primary?.live} rateClassName="text-widget-22" />
          </div>

          <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto">
            {rest.map(({ code, flag, pair, live }) => {
              const isUp = (live?.change ?? 0) > 0
              return (
                <div
                  key={pair}
                  className="flex items-center justify-between px-1 cursor-pointer rounded-lg hover:bg-surface-muted transition-colors"
                  onClick={(e) => handleCurrencyClick(e, code)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-widget-14">{flag}</span>
                    <span className="text-widget-10 text-foreground-secondary">{pair}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-widget-12 font-semibold text-foreground">{formatRate(live?.rate)}</span>
                    {live && (
                      <span className={`text-widget-9 ml-1.5 ${isUp ? 'text-up' : 'text-down'}`}>
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
            className="w-full py-1.5 rounded-xl bg-primary-light text-primary text-widget-10 font-bold hover:bg-primary-dim transition-colors duration-[150ms] mt-2 shrink-0"
          >
            환전하기 →
          </button>
          {!isRestoring && !isAuthenticated && <LockedOverlay message="환율 정보를 보려면" />}
        </WidgetCard>
        {configModal}
      </>
    )
  }

  /* exchange-sm (default, 1x1) */
  const smLive = currencies[0]?.live ?? null

  return (
    <>
      <WidgetCard
        colSpan={colSpan}
        rowSpan={rowSpan}
        onDelete={onDelete}
        onClick={(e) => handleCurrencyClick(e, 'USD')}
      >
        <div className="flex items-center justify-between shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">환율</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 text-center">
          <div className="text-widget-9 text-foreground-disabled">USD / KRW</div>
          <RateDisplay live={smLive} rateClassName="text-widget-18" />
        </div>
        {!isRestoring && !isAuthenticated && <LockedOverlay message="환율 정보를 보려면" />}
      </WidgetCard>
      {configModal}
    </>
  )
}
