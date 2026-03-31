import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import useWidgetStore from '@/store/useWidgetStore'
import { cn } from '@/lib/cn'
import { DASHBOARD_PRESETS } from '@/data/dashboardPresets'
import { PreviewContent } from '@/components/layout/EditPanel/WidgetSizeList'
import { marketApi } from '@/api/market'
import { GRID_COLS, GRID_ROWS, GRID_GAP, MAX_PAGES } from '@/lib/gridConstants'

const SECTOR_THEMES = [
  { code: 'SEMICONDUCTOR',   displayName: '반도체' },
  { code: 'BATTERY',         displayName: '2차전지/배터리' },
  { code: 'AUTOMOTIVE',      displayName: '자동차/전장' },
  { code: 'IT_PLATFORM',     displayName: 'IT 플랫폼' },
  { code: 'ENERGY_CHEMICAL', displayName: '에너지/화학' },
  { code: 'FINANCE',         displayName: '금융' },
  { code: 'SHIPBUILDING',    displayName: '조선' },
  { code: 'DEFENSE',         displayName: '방산' },
  { code: 'MANUFACTURING',   displayName: '인프라 & 산업재' },
  { code: 'ROBOT',           displayName: '로봇' },
]

function calcCellAspectRatio(colSpan, rowSpan, cellWidth, cellHeight) {
  const w = colSpan * cellWidth + (colSpan - 1) * GRID_GAP
  const h = rowSpan * cellHeight + (rowSpan - 1) * GRID_GAP
  return w / h
}

function PresetThumbnail({ widgets, large, sectorStocks }) {
  // 미리보기 셀 크기 계산
  const containerHeight = large ? 420 : 152
  const cellHeight = (containerHeight - GRID_GAP * (GRID_ROWS - 1)) / GRID_ROWS
  const cellWidth = cellHeight // 1:1 셀 비율 가정

  // 위젯들을 크기순(colSpan * rowSpan)으로 정렬하고 인덱스 부여
  const widgetsWithIndex = widgets.map((w, i) => ({
    ...w,
    originalIndex: i,
    size: w.colSpan * w.rowSpan,
  }))
  .sort((a, b) => b.size - a.size) // 큰 순서부터
  .map((w, idx) => ({ ...w, globalIndex: idx }))

  const widgetMap = new Map(widgetsWithIndex.map(w => [w.originalIndex, w.globalIndex]))

  return (
    <div className={cn('bg-background p-1.5 grid grid-cols-6 grid-rows-4 gap-[2px] aspect-[3/2]', large ? 'h-[420px]' : 'h-[152px]')}>
      {widgets.map((w, i) => {
        const globalIndex = widgetMap.get(i)
        const ratio = calcCellAspectRatio(w.colSpan, w.rowSpan, cellWidth, cellHeight)
        return (
          <div
            key={i}
            className="relative overflow-hidden rounded-[3px] border border-stroke bg-surface min-w-0 min-h-0"
            style={{
              gridColumn: `${w.gridCol} / span ${w.colSpan}`,
              gridRow:    `${w.gridRow} / span ${w.rowSpan}`,
              aspectRatio: ratio,
            }}
          >
            <div className="absolute top-0 left-0 w-[150%] h-[150%] origin-top-left scale-[0.6667] p-1.5">
              <PreviewContent type={w.variantId} sectorStocks={sectorStocks} typeIndex={globalIndex} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function PresetPickerModal({ onClose, isAtLimit }) {
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [selectedSectorCode, setSelectedSectorCode] = useState(null)
  const [sectorStocks, setSectorStocks]     = useState(null)
  const [loadingCode, setLoadingCode]       = useState(null)
  const [error, setError]                   = useState(null)

  async function handleSelectSector(theme) {
    setSelectedSectorCode(theme.code)
    setLoadingCode(theme.code)
    setError(null)
    try {
      const stocks = await marketApi.getThemeRanking(theme.code, { type: 'market-cap' })
      setSectorStocks(stocks)
    } catch (e) {
      setError('상위 종목을 불러올 수 없습니다')
    } finally {
      setLoadingCode(null)
    }
  }

  function handleConfirm() {
    if (!selectedSectorCode || !selectedPreset) return

    setLoadingCode(selectedSectorCode)
    setError(null)
    try {
      // 프리셋으로 생성될 위젯들 변환
      const presetWidgets = selectedPreset.widgets.map((w, i) => ({
        instanceId: `widget-${Date.now()}-${i}`,
        widgetTypeId: w.widgetTypeId,
        variantId: w.variantId,
        gridCol: w.gridCol,
        gridRow: w.gridRow,
        colSpan: w.colSpan,
        rowSpan: w.rowSpan,
        config: { variantId: w.variantId },
      }))

      const store = useWidgetStore.getState()
      const { pages, addTempPage, switchPage: switchPageFn, addPendingPreset } = store

      const tempPageId = `temp-preset-${Date.now()}`

      // 새 임시 페이지 추가 + presetInfo 포함 (삭제 시 pendingPresets에서도 제거하기 위함)
      addTempPage(tempPageId, selectedPreset.name, presetWidgets, {
        name: selectedPreset.name,
        sectorCode: selectedSectorCode,
      })

      // 방금 추가된 페이지에서 presetId 가져오기
      const addedPage = useWidgetStore.getState().pages.find((p) => p.id === tempPageId)

      // 임시 페이지로 전환
      switchPageFn(tempPageId)

      // 임시 상태에 프리셋 추가 (완료·저장 시 사용, presetId로 정확히 매칭)
      if (addedPage?.presetId) {
        addPendingPreset(addedPage.presetId, presetWidgets, selectedPreset.name, selectedSectorCode)
      }

      onClose()
    } catch (e) {
      setError('오류가 발생했습니다')
    } finally {
      setLoadingCode(null)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[6px]"
        onClick={!loadingCode ? onClose : undefined}
      />

      <div className="relative bg-surface rounded-[20px] p-7 w-[860px] max-w-full border border-stroke shadow-modal animate-modal-in">

        {/* ── Step 1: 프리셋 목록 ── */}
        {!selectedPreset && (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-base font-extrabold text-foreground">위젯 프리셋</h2>
                <p className="text-[11px] text-foreground-disabled mt-0.5">
                  선택한 프리셋으로 새 페이지가 추가됩니다
                </p>
              </div>
              <button
                aria-label="닫기"
                onClick={onClose}
                className="w-7 h-7 rounded-full border border-stroke-input bg-surface-muted flex items-center justify-center text-foreground-tertiary hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3.5">
              {DASHBOARD_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  disabled={isAtLimit}
                  className={cn(
                    'text-left rounded-[14px] border border-stroke overflow-hidden group transition-all duration-150',
                    isAtLimit
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-primary hover:shadow-widget-hover',
                  )}
                >
                  <img
                    src={`/preset-thumbnails/${preset.imageId}.png`}
                    alt={preset.name}
                    className="w-full aspect-[2266/1444] object-cover bg-background"
                  />
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-stroke-subtle">
                    <div>
                      <div className="text-[12px] font-bold text-foreground">{preset.name}</div>
                      <div className="text-[10px] text-foreground-disabled mt-0.5">
                        {isAtLimit ? `페이지는 최대 ${MAX_PAGES}개까지 추가 가능` : preset.description}
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-foreground-disabled group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 2: 선택한 프리셋 미리보기 + 섹터 선택 ── */}
        {selectedPreset && (
          <>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <button
                  aria-label="뒤로"
                  onClick={() => { setSelectedPreset(null); setError(null) }}
                  disabled={!!loadingCode}
                  className="w-7 h-7 rounded-full border border-stroke-input bg-surface-muted flex items-center justify-center text-foreground-tertiary hover:text-foreground transition-colors disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">섹터 선택</h2>
                  <p className="text-[11px] text-foreground-disabled mt-0.5">
                    <span className="font-semibold text-foreground">{selectedPreset.name}</span> 프리셋
                  </p>
                </div>
              </div>
              <button
                aria-label="닫기"
                onClick={onClose}
                disabled={!!loadingCode}
                className="w-7 h-7 rounded-full border border-stroke-input bg-surface-muted flex items-center justify-center text-foreground-tertiary hover:text-foreground transition-colors disabled:opacity-40"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 미리보기 카드 */}
            <div className="rounded-[14px] border border-primary overflow-hidden mb-5">
              <PresetThumbnail widgets={selectedPreset.widgets} large sectorStocks={sectorStocks} />
              <div className="px-3.5 py-2.5 border-t border-stroke-subtle">
                <div className="text-[12px] font-bold text-foreground">{selectedPreset.name}</div>
                <div className="text-[10px] text-foreground-disabled mt-0.5">{selectedPreset.description}</div>
              </div>
            </div>

            {/* 섹터 선택 */}
            <p className="text-[11px] text-foreground-disabled mb-3">
              선택한 섹터의 상위 종목이 차트 위젯에 자동으로 설정됩니다
            </p>

            {error && <p className="mb-3 text-[11px] text-danger">{error}</p>}

            <div className="grid grid-cols-5 gap-2 mb-4">
              {SECTOR_THEMES.map((theme) => (
                <button
                  key={theme.code}
                  onClick={() => handleSelectSector(theme)}
                  disabled={!!loadingCode}
                  className={cn(
                    'flex items-center justify-center h-8 rounded-lg border text-[10px] font-semibold transition-all duration-150',
                    selectedSectorCode === theme.code
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-stroke bg-surface-muted text-foreground hover:border-primary hover:text-primary hover:bg-primary-light',
                    loadingCode && 'disabled:opacity-40 disabled:cursor-not-allowed'
                  )}
                >
                  {loadingCode === theme.code
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : theme.displayName}
                </button>
              ))}
            </div>

            {/* 확인 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => { setSelectedPreset(null); setSelectedSectorCode(null) }}
                disabled={!!loadingCode}
                className="flex-1 px-3 py-1.5 rounded-xl border border-stroke-input text-[12px] text-foreground-tertiary font-medium hover:bg-surface-muted transition-colors duration-[150ms] disabled:opacity-50"
              >
                뒤로
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedSectorCode || !!loadingCode}
                className="flex-1 px-3 py-1.5 rounded-xl bg-primary text-white text-[12px] font-semibold hover:bg-primary-hover transition-colors duration-[150ms] shadow-primary-btn disabled:opacity-50"
              >
                {loadingCode ? '추가 중…' : '확인'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>,
    document.body
  )
}
