import { useEffect, useRef, useCallback, useState } from 'react'
import { Pencil, LayoutTemplate, X, ChevronRight, LayoutGrid, Plus } from 'lucide-react'
import { useDashboardSave } from '@/hooks/useDashboardSync'
import { useDroppable } from '@dnd-kit/core'
import LiveDot from '@/components/ui/LiveDot'
import useEditModeStore from '@/store/useEditModeStore'
import useGridStore from '@/store/useGridStore'
import useWidgetStore from '@/store/useWidgetStore'
import useAuthStore from '@/store/useAuthStore'
import { cn } from '@/lib/cn'
import SortableWidgetCard from '@/components/widgets/SortableWidgetCard'
import PageEditModal from '@/components/layout/PageEditModal'
import { WIDGET_REGISTRY } from '@/components/widgets/widgetRegistry'
import { GRID_COLS, GRID_ROWS, GRID_GAP, MIN_GRID_WIDTH, MIN_GRID_HEIGHT, MIN_CELL_WIDTH, MIN_CELL_HEIGHT, gridElementRef } from '@/lib/gridConstants'
import { DASHBOARD_PRESETS } from '@/data/dashboardPresets'
import { PreviewContent } from '@/components/layout/EditPanel/WidgetSizeList'

function PresetThumbnail({ widgets }) {
  return (
    <div className="bg-background h-[152px] p-1.5 grid grid-cols-6 grid-rows-4 gap-[2px]">
      {widgets.map((w, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-[3px] border border-stroke bg-surface min-w-0 min-h-0"
          style={{
            gridColumn: `${w.gridCol} / span ${w.colSpan}`,
            gridRow:    `${w.gridRow} / span ${w.rowSpan}`,
          }}
        >
          <div className="absolute top-0 left-0 w-[400%] h-[400%] origin-top-left scale-[0.25] p-3">
            <PreviewContent type={w.variantId} />
          </div>
        </div>
      ))}
    </div>
  )
}

function PresetPickerModal({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[6px]" onClick={onClose} />

      <div className="relative bg-surface rounded-[20px] p-7 w-[860px] max-w-full border border-stroke shadow-modal animate-modal-in">
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
              onClick={() => onSelect(preset)}
              className="text-left rounded-[14px] border border-stroke hover:border-primary hover:shadow-widget-hover transition-all duration-150 overflow-hidden group"
            >
              <PresetThumbnail widgets={preset.widgets} />
              <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-stroke-subtle">
                <div>
                  <div className="text-[12px] font-bold text-foreground">{preset.name}</div>
                  <div className="text-[10px] text-foreground-disabled mt-0.5">{preset.description}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-foreground-disabled group-hover:text-primary transition-colors shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
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
  const { isEditMode } = useEditModeStore()
  const { setCellSize, setPreviewCellSize } = useGridStore()
  const { widgets, isLoaded, removeWidget, phantomWidget, isDraggingNewWidget, pages, currentPageId, switchPage } = useWidgetStore()
  const { isAuthenticated, isRestoring } = useAuthStore()
  const [isPageEditOpen, setIsPageEditOpen]         = useState(false)
  const [isPresetPickerOpen, setIsPresetPickerOpen] = useState(false)
  const { applyPageChanges } = useWidgetStore()
  const { mutate: saveDashboard } = useDashboardSave()

  function handleApplyPreset(preset) {
    const newId      = crypto.randomUUID()
    const newWidgets = preset.widgets.map((w) => ({ ...w, instanceId: crypto.randomUUID() }))
    const newPages   = [...pages, { id: newId, name: preset.name, widgets: newWidgets }]
    applyPageChanges(newPages, newId)
    setIsPresetPickerOpen(false)
    saveDashboard()
  }

  // 로드 완료 전에는 위젯 미표시 (새로고침 flash 방지)
  // - 인증 확인 중(isRestoring): 대기
  // - 비로그인: 빈 대시보드 표시
  // - 로그인 + 서버 데이터 미도착: 대기
  const safeWidgets = (!isRestoring && (isLoaded || !isAuthenticated)) ? widgets : []
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
          {isEditMode && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPresetPickerOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stroke-input bg-surface text-foreground-tertiary text-[11px] font-medium hover:border-primary hover:text-primary hover:bg-primary-light transition-all duration-[150ms]"
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
      </div>
    </div>

    {isPageEditOpen    && <PageEditModal onClose={() => setIsPageEditOpen(false)} />}
    {isPresetPickerOpen && (
      <PresetPickerModal
        onSelect={handleApplyPreset}
        onClose={() => setIsPresetPickerOpen(false)}
      />
    )}
    </>
  )
}
