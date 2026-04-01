import { useEffect, useState } from 'react'
import { Settings2 } from 'lucide-react'
import WidgetCard from './WidgetCard'
import IndexConfigModal from './IndexConfigModal'
import useMarketIndices from '@/features/market/useMarketIndices'
import useWidgetStore from '@/store/useWidgetStore'
import useEditModeStore from '@/store/useEditModeStore'
import { useDashboardSave } from '@/hooks/useDashboardSync'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'

const INDEX_META = {
  '001':      { key: 'kospi',  label: 'KOSPI',   order: 0 },
  '301':      { key: 'kosdaq', label: 'KOSDAQ',  order: 1 },
  'NAS@IXIC': { key: 'nasdaq', label: 'NASDAQ',  order: 2 },
  'SPI@SPX':  { key: 'sp500',  label: 'S&P 500', order: 3 },
}

const DEFAULT_INDICES = {
  'index-sm':   ['001'],
  'index-wide': ['001', '301'],
  'index-3x1':  ['001', '301', 'NAS@IXIC'],
  'index-2x2':  ['001', '301', 'NAS@IXIC'],
}

function useIndices(selectedCodes) {
  const { indices: raw } = useMarketIndices()
  const byCode = Object.fromEntries(raw.map((idx) => [idx.code, idx]))
  return selectedCodes.map((code) => {
    const idx  = byCode[code]
    const meta = INDEX_META[code]
    return {
      code,
      key:        meta?.key   ?? code,
      label:      meta?.label ?? code,
      value:      idx ? Number(idx.price).toLocaleString('ko-KR') : '-',
      changeAmt:  idx?.change     ?? null,
      changeRate: idx?.changeRate ?? null,
    }
  })
}

function ChangeLabel({ changeAmt, changeRate, className = '' }) {
  if (changeAmt == null || changeRate == null) {
    return <span className={`text-foreground-disabled ${className}`}>-</span>
  }
  const isUp    = changeRate >= 0
  const color   = isUp ? 'text-up' : 'text-down'
  const sign    = isUp ? '+' : ''
  const absRate = Math.abs(changeRate).toFixed(2)
  const amt     = `${sign}${Number(changeAmt).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}`
  return (
    <span className={`${color} ${className}`}>{amt} ({absRate}%)</span>
  )
}

function SettingsButton({ onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="p-0.5 rounded text-foreground-disabled hover:text-foreground transition-colors"
    >
      <Settings2 className="w-3 h-3" />
    </button>
  )
}

export default function IndexWidget({ instanceId, variant = 'index-wide', colSpan = 2, rowSpan = 1, onDelete, config = {} }) {
  const updateWidgetConfig = useWidgetStore((s) => s.updateWidgetConfig)
  const { mutate: saveDashboard } = useDashboardSave()
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const { lockWidgetDrag, unlockWidgetDrag } = useEditModeStore()
  const open = useWidgetDetailStore((s) => s.open)

  useEffect(() => {
    if (!isConfigOpen) return undefined
    lockWidgetDrag()
    return () => unlockWidgetDrag()
  }, [isConfigOpen, lockWidgetDrag, unlockWidgetDrag])

  const selectedCodes = config.indices ?? DEFAULT_INDICES[variant] ?? DEFAULT_INDICES['index-wide']
  const indices = useIndices(selectedCodes)

  const handleIndexClick = (e, code) => {
    e.stopPropagation()
    open({ widgetTypeId: 'index', config: { code } })
  }

  function handleSave(newIndices) {
    updateWidgetConfig(instanceId, { indices: newIndices })
    saveDashboard()
    setIsConfigOpen(false)
  }

  if (variant === 'index-sm') {
    const shown = indices[0] ?? { code: '001', key: 'kospi', label: 'KOSPI', value: '-', change: null }
    return (
      <>
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={(e) => handleIndexClick(e, shown.code)}>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase shrink-0">주요 지수</span>
            <SettingsButton onClick={() => setIsConfigOpen(true)} />
          </div>
          <div className="relative flex-1 flex flex-col justify-center items-center text-center min-h-0 group">
            <div className="text-widget-9 text-foreground-disabled">{shown.label}</div>
            <div className="text-widget-18 font-bold text-foreground leading-tight">{shown.value}</div>
            <ChangeLabel changeAmt={shown.changeAmt} changeRate={shown.changeRate} className="text-widget-9" />
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </WidgetCard>
        {isConfigOpen && (
          <IndexConfigModal
            variant={variant}
            currentIndices={selectedCodes}
            onSave={handleSave}
            onClose={() => setIsConfigOpen(false)}
          />
        )}
      </>
    )
  }

  if (variant === 'index-3x1') {
    return (
      <>
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase shrink-0">주요 지수</span>
            <SettingsButton onClick={() => setIsConfigOpen(true)} />
          </div>
          <div className="flex flex-1 min-h-0 divide-x divide-stroke mt-1">
            {indices.map((idx) => (
              <div
                key={idx.key}
                className="relative flex-1 flex flex-col justify-center items-center text-center px-2 cursor-pointer group"
                onClick={(e) => handleIndexClick(e, idx.code)}
              >
                <div className="text-widget-9 text-foreground-disabled">{idx.label}</div>
                <div className="text-widget-17 font-bold text-foreground leading-tight">{idx.value}</div>
                <ChangeLabel changeAmt={idx.changeAmt} changeRate={idx.changeRate} className="text-widget-10" />
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </WidgetCard>
        {isConfigOpen && (
          <IndexConfigModal
            variant={variant}
            currentIndices={selectedCodes}
            onSave={handleSave}
            onClose={() => setIsConfigOpen(false)}
          />
        )}
      </>
    )
  }

  if (variant === 'index-2x2') {
    return (
      <>
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
          <div className="flex items-center gap-1.5 mb-2 shrink-0">
            <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase shrink-0">주요 지수</span>
            <SettingsButton onClick={() => setIsConfigOpen(true)} />
          </div>
          <div className="flex flex-col flex-1 justify-center gap-3">
            {indices.map((idx) => (
              <div
                key={idx.key}
                className="relative flex-1 min-w-0 cursor-pointer px-1 group"
                onClick={(e) => handleIndexClick(e, idx.code)}
              >
                <div className="text-widget-9 text-foreground-disabled">{idx.label}</div>
                <div className="text-widget-15 font-bold text-foreground leading-tight">{idx.value}</div>
                <ChangeLabel changeAmt={idx.changeAmt} changeRate={idx.changeRate} className="text-widget-10" />
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </WidgetCard>
        {isConfigOpen && (
          <IndexConfigModal
            variant={variant}
            currentIndices={selectedCodes}
            onSave={handleSave}
            onClose={() => setIsConfigOpen(false)}
          />
        )}
      </>
    )
  }

  /* index-wide (default) */
  return (
    <>
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase shrink-0">주요 지수</span>
          <SettingsButton onClick={() => setIsConfigOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 divide-x divide-stroke mt-1">
          {indices.map((idx) => (
            <div
              key={idx.key}
              className="relative flex-1 flex flex-col justify-center items-center text-center px-3 py-1 cursor-pointer group"
              onClick={(e) => handleIndexClick(e, idx.code)}
            >
              <div className="text-widget-9 text-foreground-disabled">{idx.label}</div>
              <div className="text-widget-16 font-bold text-foreground leading-tight">{idx.value}</div>
              <ChangeLabel changeAmt={idx.changeAmt} changeRate={idx.changeRate} className="text-widget-9" />
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </WidgetCard>
      {isConfigOpen && (
        <IndexConfigModal
          variant={variant}
          currentIndices={selectedCodes}
          onSave={handleSave}
          onClose={() => setIsConfigOpen(false)}
        />
      )}
    </>
  )
}
