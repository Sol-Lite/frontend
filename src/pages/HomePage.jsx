import { useEffect, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import LiveDot from '@/components/ui/LiveDot'
import useEditModeStore from '@/store/useEditModeStore'
import useGridStore from '@/store/useGridStore'
import useWidgetStore, { canFitInGrid } from '@/store/useWidgetStore'
import { cn } from '@/lib/cn'
import AddWidgetSlot from '@/components/widgets/AddWidgetSlot'
import SortableWidgetCard from '@/components/widgets/SortableWidgetCard'
import { WIDGET_REGISTRY } from '@/components/widgets/widgetRegistry'
import { GRID_COLS, GRID_ROWS, GRID_GAP, MIN_GRID_WIDTH, MIN_GRID_HEIGHT, MIN_CELL_WIDTH, MIN_CELL_HEIGHT } from '@/lib/gridConstants'

export default function HomePage() {
  const { isEditMode } = useEditModeStore()
  const { setCellSize, setPreviewCellSize } = useGridStore()
  const { widgets, removeWidget, reorderWidgets } = useWidgetStore()
  const gridRef = useRef(null)
  const isEditModeRef = useRef(isEditMode)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleDragStart({ active }) {
    setActiveId(active.id)
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over || active.id === over.id) return
    reorderWidgets(active.id, over.id)
  }

  useEffect(() => {
    isEditModeRef.current = isEditMode
  }, [isEditMode])

  useEffect(() => {
    const el = gridRef.current
    if (!el) return

    // ResizeObserver 콜백은 비동기 → 초기값을 MIN으로 설정해 측정 전 공백 방지
    setCellSize(MIN_CELL_WIDTH, MIN_CELL_HEIGHT)

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const cellWidth = (width - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS
      const cellHeight = (height - GRID_GAP * (GRID_ROWS - 1)) / GRID_ROWS
      setCellSize(cellWidth, cellHeight)
      // EditPanel 미열림 상태(full grid)의 셀 크기만 preview 기준으로 저장
      if (!isEditModeRef.current) {
        setPreviewCellSize(cellWidth, cellHeight)
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [setCellSize, setPreviewCellSize])

  const activeWidget = activeId ? widgets.find((w) => w.instanceId === activeId) : null
  const ActiveComponent = activeWidget ? WIDGET_REGISTRY[activeWidget.widgetTypeId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
          {isEditMode && (
            <div className="flex items-center gap-2">
              {/* 페이지 인디케이터 */}
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-1.5 rounded-full bg-primary" />
                <div className="w-1.5 h-1.5 rounded-full bg-stroke-input" />
                <div className="w-1.5 h-1.5 rounded-full bg-stroke-input" />
              </div>
              <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stroke-input bg-surface text-foreground-tertiary text-[11px] font-medium hover:border-primary hover:text-primary hover:bg-primary-light transition-all duration-[150ms]">
                <svg className="w-[11px] h-[11px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                페이지 편집
              </button>
            </div>
          )}
        </div>

        {/* 스크롤 래퍼: 최솟값 이하로 줄어들면 스크롤 */}
        <div className={cn(
          'flex-1 min-h-0',
          isEditMode ? 'overflow-visible' : 'overflow-auto',
        )}>
          {/* 위젯 그리드: 6열 × 4행, 뷰포트 채움 / 최솟값 이하면 고정 */}
          <SortableContext items={widgets.map((w) => w.instanceId)} strategy={rectSortingStrategy}>
            <div
              ref={gridRef}
              className="grid grid-cols-6 grid-rows-4 grid-flow-dense gap-[10px] w-full h-full"
              style={{
                minWidth: `${MIN_GRID_WIDTH}px`,
                minHeight: `${MIN_GRID_HEIGHT}px`,
              }}
            >
              {widgets.map((w) => {
                const Component = WIDGET_REGISTRY[w.widgetTypeId]
                if (!Component) return null
                return (
                  <SortableWidgetCard
                    key={w.instanceId}
                    instanceId={w.instanceId}
                    colSpan={w.colSpan}
                    rowSpan={w.rowSpan}
                  >
                    <Component
                      variant={w.variantId}
                      colSpan={w.colSpan}
                      rowSpan={w.rowSpan}
                      config={w.config}
                      onDelete={() => removeWidget(w.instanceId)}
                    />
                  </SortableWidgetCard>
                )
              })}
              {!isEditMode && canFitInGrid(widgets, 1, 1) && <AddWidgetSlot />}
            </div>
          </SortableContext>
        </div>
      </div>

      {/* 드래그 중 마우스를 따라다니는 위젯 미리보기 */}
      <DragOverlay>
        {ActiveComponent && (
          <div className="opacity-90 rotate-1 scale-105 shadow-widget-edit rounded-2xl cursor-grabbing">
            <ActiveComponent
              variant={activeWidget.variantId}
              colSpan={activeWidget.colSpan}
              rowSpan={activeWidget.rowSpan}
              config={activeWidget.config}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
