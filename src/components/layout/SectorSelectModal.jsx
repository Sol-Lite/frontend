import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard'
import useWidgetStore from '@/store/useWidgetStore'

const THEMES = [
  { code: 'SEMICONDUCTOR',    displayName: '반도체' },
  { code: 'BATTERY',          displayName: '2차전지/배터리' },
  { code: 'AUTOMOTIVE',       displayName: '자동차/전장' },
  { code: 'IT_PLATFORM',      displayName: 'IT 플랫폼' },
  { code: 'ENERGY_CHEMICAL',  displayName: '에너지/화학' },
  { code: 'FINANCE',          displayName: '금융' },
  { code: 'SHIPBUILDING',     displayName: '조선' },
  { code: 'DEFENSE',          displayName: '방산' },
  { code: 'MANUFACTURING',    displayName: '인프라 & 산업재' },
  { code: 'ROBOT',            displayName: '로봇' },
]

export default function SectorSelectModal({ preset, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const { loadFromServer, switchPage } = useWidgetStore()
  const queryClient = useQueryClient()

  async function handleSelect(theme) {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        presetName: preset.name,
        theme: theme.code,
        widgets: preset.widgets.map((w) => ({
          widgetType: w.widgetTypeId,
          positionX:  w.gridCol,
          positionY:  w.gridRow,
          width:      w.colSpan,
          height:     w.rowSpan,
          configJson: JSON.stringify({ variantId: w.variantId }),
        })),
      }
      const response = await dashboardApi.applyPreset(payload)
      queryClient.setQueryData(['dashboard', 'me'], response)
      loadFromServer(response)
      const newPage = response[response.length - 1]
      switchPage(String(newPage.dashboardId))
      onClose()
    } catch (e) {
      setError(e?.message ?? '오류가 발생했습니다')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[6px]" onClick={!loading ? onClose : undefined} />

      <div className="relative bg-surface rounded-[20px] p-7 w-[560px] max-w-full border border-stroke shadow-modal animate-modal-in">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-base font-extrabold text-foreground">섹터 선택</h2>
            <p className="text-[11px] text-foreground-disabled mt-0.5">
              선택한 섹터의 상위 종목이 차트 위젯에 자동으로 설정됩니다
            </p>
          </div>
          <button
            aria-label="닫기"
            onClick={onClose}
            disabled={loading}
            className="w-7 h-7 rounded-full border border-stroke-input bg-surface-muted flex items-center justify-center text-foreground-tertiary hover:text-foreground transition-colors disabled:opacity-40"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-foreground-tertiary mb-4">
          <span className="font-semibold text-foreground">{preset.name}</span> 프리셋
        </p>

        {error && (
          <p className="mb-3 text-[11px] text-red-400">{error}</p>
        )}

        <div className="grid grid-cols-5 gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme.code}
              onClick={() => handleSelect(theme)}
              disabled={loading}
              className="flex items-center justify-center h-10 rounded-xl border border-stroke bg-surface-muted text-[11px] font-semibold text-foreground hover:border-primary hover:text-primary hover:bg-primary-light transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : theme.displayName}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
