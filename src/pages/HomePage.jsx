import { useEffect, useRef, useCallback, useState } from 'react'
import { Pencil, LayoutTemplate, LayoutGrid, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import LiveDot from '@/components/ui/LiveDot'
import useEditModeStore from '@/store/useEditModeStore'
import useGridStore from '@/store/useGridStore'
import useWidgetStore from '@/store/useWidgetStore'
import useAuthStore from '@/store/useAuthStore'
import { cn } from '@/lib/cn'
import SortableWidgetCard from '@/components/widgets/SortableWidgetCard'
import PresetPickerModal from '@/components/widgets/PresetPickerModal'
import PageEditModal from '@/components/layout/PageEditModal'
import { WIDGET_REGISTRY } from '@/components/widgets/widgetRegistry'
import { GRID_COLS, GRID_ROWS, GRID_GAP, MIN_GRID_WIDTH, MIN_GRID_HEIGHT, MIN_CELL_WIDTH, MIN_CELL_HEIGHT, MAX_PAGES, gridElementRef } from '@/lib/gridConstants'

const WIDGET_TYPES_DRAGGABLE_TO_CHAT = [
  'balance',
  'exchange',
  'stock-chart',
  'stock-news',
  'index',
  'ranking',
  'market-overview',
  'portfolio',
  'trade-history',
]

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
                widgetTypeId={w.widgetTypeId}
                config={w.config}
                canDragToChat={WIDGET_TYPES_DRAGGABLE_TO_CHAT.includes(w.widgetTypeId)}
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
