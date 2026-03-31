import { useEffect, useRef, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { Pencil, LayoutTemplate, X, ChevronLeft, ChevronRight, LayoutGrid, Plus, Loader2 } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import LiveDot from '@/components/ui/LiveDot'
import useEditModeStore from '@/store/useEditModeStore'
import useGridStore from '@/store/useGridStore'
import useWidgetStore from '@/store/useWidgetStore'
import useAuthStore from '@/store/useAuthStore'
import { cn } from '@/lib/cn'
import SortableWidgetCard from '@/components/widgets/SortableWidgetCard'
import PageEditModal from '@/components/layout/PageEditModal'
import { WIDGET_REGISTRY } from '@/components/widgets/widgetRegistry'
import { GRID_COLS, GRID_ROWS, GRID_GAP, MIN_GRID_WIDTH, MIN_GRID_HEIGHT, MIN_CELL_WIDTH, MIN_CELL_HEIGHT, MAX_PAGES, gridElementRef } from '@/lib/gridConstants'
import { DASHBOARD_PRESETS } from '@/data/dashboardPresets'
import { PreviewContent } from '@/components/layout/EditPanel/WidgetSizeList'
import { dashboardApi } from '@/api/dashboard'

function calcCellAspectRatio(colSpan, rowSpan, cellWidth, cellHeight) {
  const w = colSpan * cellWidth + (colSpan - 1) * GRID_GAP
  const h = rowSpan * cellHeight + (rowSpan - 1) * GRID_GAP
  return w / h
}

function PresetThumbnail({ widgets, large }) {
  // 미리보기 셀 크기 계산
  const containerHeight = large ? 420 : 152
  const cellHeight = (containerHeight - GRID_GAP * (GRID_ROWS - 1)) / GRID_ROWS
  const cellWidth = cellHeight // 1:1 셀 비율 가정

  return (
    <div className={cn('bg-background p-1.5 grid grid-cols-6 grid-rows-4 gap-[2px] aspect-[3/2]', large ? 'h-[420px]' : 'h-[152px]')}>
      {widgets.map((w, i) => {
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
              <PreviewContent type={w.variantId} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

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

function PresetPickerModal({ onClose, isAtLimit }) {
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [loadingCode, setLoadingCode]       = useState(null)
  const [error, setError]                   = useState(null)
  const { loadFromServer, switchPage }      = useWidgetStore()
  const queryClient                         = useQueryClient()

  function handleSelectSector(theme) {
    setLoadingCode(theme.code)
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
        sectorCode: theme.code,
      })

      // 방금 추가된 페이지에서 presetId 가져오기
      const addedPage = useWidgetStore.getState().pages.find((p) => p.id === tempPageId)

      // 임시 페이지로 전환
      switchPageFn(tempPageId)

      // 임시 상태에 프리셋 추가 (완료·저장 시 사용, presetId로 정확히 매칭)
      if (addedPage?.presetId) {
        addPendingPreset(addedPage.presetId, presetWidgets, selectedPreset.name, theme.code)
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
                    className="w-full aspect-[3/2] object-cover bg-background"
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
              <PresetThumbnail widgets={selectedPreset.widgets} large />
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

            <div className="grid grid-cols-5 gap-2">
              {SECTOR_THEMES.map((theme) => (
                <button
                  key={theme.code}
                  onClick={() => handleSelectSector(theme)}
                  disabled={!!loadingCode}
                  className="flex items-center justify-center h-8 rounded-lg border border-stroke bg-surface-muted text-[10px] font-semibold text-foreground hover:border-primary hover:text-primary hover:bg-primary-light transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingCode === theme.code
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : theme.displayName}
                </button>
              ))}
            </div>
          </>
        )}

      </div>
    </div>,
    document.body
  )
}

/* new-widget 드래그 중 삽입 예정 위치를 표시하는 placeholder.
   pointer-events-none으로 drag 이벤트를 그대로 통과시킨다. */
function PhantomSlot({ colSpan, rowSpan, gridCol, gridRow }) {
  return (
    <div
      className="rounded-2xl border-2 border-dashed border-primary bg-primary-light/30 pointer-events-none"
      style={
        gridCol && gridRow
          ? { gridColumn: `${gridCol} / span ${colSpan}`, gridRow: `${gridRow} / span ${rowSpan}` }
          : undefined
      }
    />
  )
}

export default function HomePage() {
  const { isEditMode, enterEditMode } = useEditModeStore()
  const { setCellSize, setPreviewCellSize } = useGridStore()
  const { widgets, isLoaded, removeWidget, phantomWidget, isDraggingNewWidget, pages, currentPageId, switchPage, snapshotWidgets } = useWidgetStore()
  const { isAuthenticated, isRestoring } = useAuthStore()
  const [isPageEditOpen, setIsPageEditOpen]         = useState(false)
  const [isPresetPickerOpen, setIsPresetPickerOpen] = useState(false)

  // 편집 모드 종료(완료·저장 또는 취소) 시 열려있는 모달 닫기
  useEffect(() => {
    if (!isEditMode) {
      setIsPageEditOpen(false)
      setIsPresetPickerOpen(false)
    }
  }, [isEditMode])

  const isAtPageLimit = pages.length >= MAX_PAGES

  // 로드 완료 전에는 위젯 미표시 (새로고침 flash 방지)
  // - 인증 확인 중(isRestoring): 대기
  // - 비로그인: 빈 대시보드 표시
  // - 로그인 + 서버 데이터 미도착: 대기
  const safeWidgets = (!isRestoring && (isLoaded || !isAuthenticated)) ? widgets : []
  const currentPageIndex = pages.findIndex((p) => p.id === currentPageId)
  const gridRef = useRef(null)
  const isEditModeRef = useRef(isEditMode)

  // 빈 대시보드에서도 드롭 가능하도록 그리드 전체를 droppable로 등록
  const { setNodeRef: setGridDroppableRef } = useDroppable({ id: 'dashboard-grid' })

  const setGridRef = useCallback((node) => {
    gridRef.current = node
    setGridDroppableRef(node)
    gridElementRef.current = node
  }, [setGridDroppableRef])

  useEffect(() => {
    isEditModeRef.current = isEditMode
  }, [isEditMode])

  useEffect(() => {
    const el = gridRef.current
    if (!el) return

    setCellSize(MIN_CELL_WIDTH, MIN_CELL_HEIGHT)

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const cellWidth = (width - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS
      const cellHeight = (height - GRID_GAP * (GRID_ROWS - 1)) / GRID_ROWS
      setCellSize(cellWidth, cellHeight)
      if (!isEditModeRef.current) {
        setPreviewCellSize(cellWidth, cellHeight)
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [setCellSize, setPreviewCellSize])

  // phantom은 좌표를 직접 보유 — 배열에 삽입하지 않고 displayWidgets 끝에 append
  // push-aside 미리보기: B를 push-aside 목적지로 임시 이동해 렌더링
  // → phantom(A의 목적지)과 B가 같은 셀에 겹치는 현상 방지
  const displayWidgets = (() => {
    if (!phantomWidget) return safeWidgets
    let base = safeWidgets
    if (phantomWidget.pushAsideId) {
      base = base.map((w) =>
        w.instanceId === phantomWidget.pushAsideId
          ? { ...w, gridCol: phantomWidget.pushAsideCol, gridRow: phantomWidget.pushAsideRow }
          : w,
      )
    }
    return [...base, { instanceId: '__phantom__', ...phantomWidget }]
  })()

  return (
    <>
    <div className="flex flex-col h-full overflow-hidden p-3 gap-2.5">
      {/* 서브바 */}
      <div className="flex items-center justify-between shrink-0 px-1 h-7">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-foreground">나의 대시보드</span>
          {isEditMode ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-light border border-primary-border">
              <Pencil className="w-2.5 h-2.5 text-primary" strokeWidth={2.5} />
              <span className="text-[10px] text-primary font-semibold">편집 중</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background border border-stroke">
              <LiveDot size="sm" />
              <span className="text-[10px] text-foreground-disabled">실시간 반영</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {pages.length > 1 && (
              <button
                aria-label="이전 페이지"
                onClick={() => currentPageIndex > 0 && switchPage(pages[currentPageIndex - 1].id)}
                disabled={currentPageIndex <= 0}
                className="w-4 h-4 flex items-center justify-center rounded text-foreground-disabled hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            )}
            <div className="flex items-center gap-1.5">
              {pages.map((page) => (
                <button
                  key={page.id}
                  aria-label={page.name}
                  onClick={() => switchPage(page.id)}
                  className={cn(
                    'rounded-full transition-all duration-150',
                    page.id === currentPageId
                      ? 'w-4 h-1.5 bg-primary'
                      : 'w-1.5 h-1.5 bg-stroke-input hover:bg-foreground-disabled',
                  )}
                />
              ))}
            </div>
            {pages.length > 1 && (
              <button
                aria-label="다음 페이지"
                onClick={() => currentPageIndex < pages.length - 1 && switchPage(pages[currentPageIndex + 1].id)}
                disabled={currentPageIndex >= pages.length - 1}
                className="w-4 h-4 flex items-center justify-center rounded text-foreground-disabled hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          {isEditMode && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => !isAtPageLimit && setIsPresetPickerOpen(true)}
                disabled={isAtPageLimit}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stroke-input bg-surface text-foreground-tertiary text-[11px] font-medium transition-all duration-[150ms]',
                  isAtPageLimit
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:border-primary hover:text-primary hover:bg-primary-light',
                )}
              >
                <LayoutTemplate className="w-[11px] h-[11px]" />
                위젯 프리셋
              </button>
              <button
                onClick={() => setIsPageEditOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stroke-input bg-surface text-foreground-tertiary text-[11px] font-medium hover:border-primary hover:text-primary hover:bg-primary-light transition-all duration-[150ms]"
              >
                <svg className="w-[11px] h-[11px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                페이지 편집
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 스크롤 래퍼 */}
      <div className={cn(
        'flex-1 min-h-0',
        isEditMode ? 'overflow-visible' : 'overflow-auto',
      )}>
        {/* 로그인 상태이고 위젯이 없을 때 빈 상태 안내 */}
        {isAuthenticated && isLoaded && safeWidgets.length === 0 && !isEditMode ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <LayoutGrid className="w-10 h-10 text-foreground-disabled" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-foreground">대시보드가 비어있어요</p>
              <p className="text-xs text-foreground-disabled">원하는 위젯을 추가해 나만의 대시보드를 만들어보세요.</p>
            </div>
            <button
              onClick={() => { snapshotWidgets(); enterEditMode() }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors duration-150 shadow-primary-btn"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              위젯 추가하기
            </button>
          </div>
        ) : (
        <div
          ref={setGridRef}
          className={cn(
            'grid grid-cols-6 grid-rows-4 gap-[10px] w-full h-full rounded-2xl transition-[outline] duration-[150ms]',
            isDraggingNewWidget && 'outline outline-2 outline-primary',
            isDraggingNewWidget && phantomWidget && 'bg-primary-light/30',
          )}
          style={{
            minWidth: `${MIN_GRID_WIDTH}px`,
            minHeight: `${MIN_GRID_HEIGHT}px`,
          }}
        >
          {displayWidgets.map((w) => {
            if (w.instanceId === '__phantom__') {
              return (
                <PhantomSlot
                  key="__phantom__"
                  colSpan={w.colSpan}
                  rowSpan={w.rowSpan}
                  gridCol={w.gridCol}
                  gridRow={w.gridRow}
                />
              )
            }
            const Component = WIDGET_REGISTRY[w.widgetTypeId]
            if (!Component) return null
            return (
              <SortableWidgetCard
                key={w.instanceId}
                instanceId={w.instanceId}
                colSpan={w.colSpan}
                rowSpan={w.rowSpan}
                gridCol={w.gridCol}
                gridRow={w.gridRow}
              >
                <Component
                  instanceId={w.instanceId}
                  variant={w.variantId}
                  colSpan={w.colSpan}
                  rowSpan={w.rowSpan}
                  config={w.config}
                  onDelete={() => removeWidget(w.instanceId)}
                />
              </SortableWidgetCard>
            )
          })}
        </div>
        )}
      </div>
    </div>

    {isPageEditOpen    && <PageEditModal onClose={() => setIsPageEditOpen(false)} />}
    {isPresetPickerOpen && (
      <PresetPickerModal
        isAtLimit={isAtPageLimit}
        onClose={() => setIsPresetPickerOpen(false)}
      />
    )}
    </>
  )
}
