import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import PriceChange from '@/components/ui/PriceChange'
import WidgetCard from './WidgetCard'
import IndexConfigModal from './IndexConfigModal'
import useMarketIndices from '@/features/market/useMarketIndices'
import useWidgetStore from '@/store/useWidgetStore'
import { useDashboardSave } from '@/hooks/useDashboardSync'

const INDEX_META = {
  '001':      { key: 'kospi',  label: 'KOSPI',   order: 0 },
  '101':      { key: 'kosdaq', label: 'KOSDAQ',  order: 1 },
  'NAS@IXIC': { key: 'nasdaq', label: 'NASDAQ',  order: 2 },
  'SPI@SPX':  { key: 'sp500',  label: 'S&P 500', order: 3 },
}

const DEFAULT_INDICES = {
  'index-sm':   ['001'],
  'index-wide': ['001', '101'],
  'index-3x1':  ['001', '101', 'NAS@IXIC'],
  'index-2x2':  ['001', '101', 'NAS@IXIC'],
}

function useIndices(selectedCodes) {
  const { indices: raw } = useMarketIndices()
  const byCode = Object.fromEntries(raw.map((idx) => [idx.code, idx]))
  return selectedCodes.map((code) => {
    const idx  = byCode[code]
    const meta = INDEX_META[code]
    return {
      code,
      key:    meta?.key   ?? code,
      label:  meta?.label ?? code,
      value:  idx ? Number(idx.price).toLocaleString('ko-KR') : '-',
      change: idx?.changeRate ?? null,
    }
  })
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

  const selectedCodes = config.indices ?? DEFAULT_INDICES[variant] ?? DEFAULT_INDICES['index-wide']
  const indices = useIndices(selectedCodes)

  function handleSave(newIndices) {
    updateWidgetConfig(instanceId, { indices: newIndices })
    saveDashboard()
    setIsConfigOpen(false)
  }

  if (variant === 'index-sm') {
    const shown = indices[0] ?? { key: 'kospi', label: 'KOSPI', value: '-', change: null }
    return (
      <>
        <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">주요 지수</span>
            <SettingsButton onClick={() => setIsConfigOpen(true)} />
          </div>
          <div className="flex-1 flex flex-col justify-center items-center text-center min-h-0">
            <div className="text-[9px] text-foreground-disabled">{shown.label}</div>
            <div className="text-[18px] font-bold text-foreground leading-tight">{shown.value}</div>
            {shown.change != null
              ? <PriceChange value={shown.change} className="text-[9px]" />
              : <span className="text-[9px] text-foreground-disabled">-</span>
            }
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
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">주요 지수</span>
            <SettingsButton onClick={() => setIsConfigOpen(true)} />
          </div>
          <div className="flex flex-1 min-h-0 divide-x divide-stroke mt-1">
            {indices.map((idx) => (
              <div key={idx.key} className="flex-1 flex flex-col justify-center items-center text-center px-2">
                <div className="text-[9px] text-foreground-disabled">{idx.label}</div>
                <div className="text-[17px] font-bold text-foreground leading-tight">{idx.value}</div>
                {idx.change != null
                  ? <PriceChange value={idx.change} className="text-[10px]" />
                  : <span className="text-[10px] text-foreground-disabled">-</span>
                }
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
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">주요 지수</span>
            <SettingsButton onClick={() => setIsConfigOpen(true)} />
          </div>
          <div className="flex flex-col flex-1 justify-center gap-3">
            {indices.map((idx) => (
              <div key={idx.key} className="flex-1 min-w-0">
                <div className="text-[9px] text-foreground-disabled">{idx.label}</div>
                <div className="text-[15px] font-bold text-foreground leading-tight">{idx.value}</div>
                {idx.change != null
                  ? <PriceChange value={idx.change} className="text-[10px]" />
                  : <span className="text-[10px] text-foreground-disabled">-</span>
                }
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
        <div className="flex items-center justify-between shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">주요 지수</span>
          <SettingsButton onClick={() => setIsConfigOpen(true)} />
        </div>
        <div className="flex flex-1 min-h-0 divide-x divide-stroke mt-1">
          {indices.map((idx) => (
            <div key={idx.key} className="flex-1 flex flex-col justify-center items-center text-center px-3 py-1">
              <div className="text-[9px] text-foreground-disabled">{idx.label}</div>
              <div className="text-[16px] font-bold text-foreground leading-tight">{idx.value}</div>
              {idx.change != null
                ? <PriceChange value={idx.change} className="text-[9px]" />
                : <span className="text-[9px] text-foreground-disabled">-</span>
              }
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
