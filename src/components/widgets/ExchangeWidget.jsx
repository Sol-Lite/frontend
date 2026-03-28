import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import useCurrencyRate from '@/hooks/useCurrencyRate'
import useMarketIndices from '@/features/market/useMarketIndices'
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
  'exchange-sm':   ['USD'],
  'exchange-wide': ['USD', 'JPY'],
  'exchange-3x1':  ['USD', 'JPY', 'EUR'],
  'exchange-2x2':  ['USD', 'JPY', 'EUR'],
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

  if (variant === 'exchange-3x1') {
    const flexValues = ['1.2', '1', '1']
    const paddings   = [{ pr: 'pr-3', pl: '' }, { pr: 'pr-2.5', pl: 'pl-2.5' }, { pr: '', pl: 'pl-2.5' }]
    const rateSize   = ['text-[20px]', 'text-[16px]', 'text-[16px]']
    return (
      <>
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">환율</span>
            {settingsBtn}
          </div>
          <div className="flex flex-1 min-h-0 divide-x divide-stroke">
            {currencies.map(({ code, pair, live }, i) => {
              const isUp = (live?.change ?? 0) > 0
              const { pr, pl } = paddings[i] ?? { pr: '', pl: 'pl-2.5' }
              return (
                <div
                  key={pair}
                  className={`relative flex flex-col justify-center ${pr} ${pl} cursor-pointer group [flex:var(--flex-val)]`}
                  style={{ '--flex-val': flexValues[i] ?? '1' }}
                  onClick={(e) => handleCurrencyClick(e, code)}
                >
                  <div className="text-center">
                    <div className="text-[9px] text-foreground-disabled">{pair}</div>
                    <div className={`${rateSize[i] ?? 'text-[16px]'} font-bold text-foreground leading-tight`}>{formatRate(live?.rate)}</div>
                    {live && (
                      <div className={`text-[9px] ${isUp ? 'text-up' : 'text-down'}`}>
                        {isUp ? '▲' : '▼'} {Math.abs(live.change)}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )
            })}
          </div>
          {!isAuthenticated && <LockedOverlay message="환율 정보를 보려면" />}
        </WidgetCard>
        {configModal}
      </>
    )
  }

  if (variant === 'exchange-wide') {
    return (
      <>
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">환율</span>
            {settingsBtn}
          </div>
          <div className="flex flex-1 min-h-0 divide-x divide-stroke">
            {currencies.map(({ code, pair, live }, i) => {
              const isUp = (live?.change ?? 0) > 0
              const rateSize = i === 0 ? 'text-[20px]' : 'text-[16px]'
              const pr = i === 0 ? 'pr-3' : ''
              const pl = i > 0 ? 'pl-3' : ''
              const flex = i === 0 ? '1.2' : '1'
              return (
                <div
                  key={pair}
                  className={`relative flex flex-col justify-center ${pr} ${pl} cursor-pointer group [flex:var(--flex-val)]`}
                  style={{ '--flex-val': flex }}
                  onClick={(e) => handleCurrencyClick(e, code)}
                >
                  <div className="text-center">
                    <div className="text-[9px] text-foreground-disabled">{pair}</div>
                    <div className={`${rateSize} font-bold text-foreground leading-tight`}>{formatRate(live?.rate)}</div>
                    {live && (
                      <div className={`text-[9px] ${isUp ? 'text-up' : 'text-down'}`}>
                        {isUp ? '▲' : '▼'} {Math.abs(live.change)}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )
            })}
          </div>
          {!isRestoring && !isAuthenticated && <LockedOverlay message="환율 정보를 보려면" />}
        </WidgetCard>
        {configModal}
      </>
    )
  }

  if (variant === 'exchange-2x2') {
    const primary = currencies[0]
    const rest    = currencies.slice(1)
    return (
      <>
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">환율</span>
            {settingsBtn}
          </div>
          <div
            className="shrink-0 cursor-pointer"
            onClick={(e) => handleCurrencyClick(e, primary?.code ?? 'USD')}
          >
            <div className="text-[9px] text-foreground-disabled">{primary?.pair ?? 'USD / KRW'}</div>
            <RateDisplay live={primary?.live} rateClassName="text-[22px]" />
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
        {configModal}
      </>
    )
  }

  /* exchange-sm (default, 1x1) */
  const { indices } = useMarketIndices()
  const usdIdx = indices.find((i) => i.code === 'USD')
  const smLive = usdIdx
    ? { rate: usdIdx.price, change: usdIdx.change, drate: usdIdx.changeRate }
    : currencies[0]?.live ?? null

  return (
    <>
      <WidgetCard
        colSpan={colSpan}
        rowSpan={rowSpan}
        onDelete={onDelete}
        onClick={(e) => handleCurrencyClick(e, 'USD')}
      >
        <div className="flex items-center justify-between shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">환율</span>
        </div>
        <div className="flex-1 flex flex-col justify-center min-h-0">
          <div className="text-[9px] text-foreground-disabled">USD / KRW</div>
          <RateDisplay live={smLive} rateClassName="text-[18px]" />
        </div>
        {!isRestoring && !isAuthenticated && <LockedOverlay message="환율 정보를 보려면" />}
      </WidgetCard>
      {configModal}
    </>
  )
}
