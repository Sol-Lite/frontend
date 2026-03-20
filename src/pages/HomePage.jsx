import { useEffect, useRef, useCallback } from 'react'
import { Pencil } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import LiveDot from '@/components/ui/LiveDot'
import useEditModeStore from '@/store/useEditModeStore'
import useGridStore from '@/store/useGridStore'
import useWidgetStore, { canFitInGrid } from '@/store/useWidgetStore'
import { cn } from '@/lib/cn'
import AddWidgetSlot from '@/components/widgets/AddWidgetSlot'
import SortableWidgetCard from '@/components/widgets/SortableWidgetCard'
import { WIDGET_REGISTRY } from '@/components/widgets/widgetRegistry'
import { GRID_COLS, GRID_ROWS, GRID_GAP, MIN_GRID_WIDTH, MIN_GRID_HEIGHT, MIN_CELL_WIDTH, MIN_CELL_HEIGHT, gridElementRef } from '@/lib/gridConstants'

/* new-widget 드래그 중 삽입 예정 위치를 표시하는 placeholder.
   pointer-events-none으로 drag 이벤트를 그대로 통과시킨다. */
function PhantomSlot({ colSpan, rowSpan }) {
  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-dashed border-primary bg-primary-light/30 pointer-events-none',
        colSpan === 3 ? 'col-span-3' : colSpan === 2 ? 'col-span-2' : 'col-span-1',
        rowSpan === 2 ? 'row-span-2' : '',
      )}
    />
  )
}

export default function HomePage() {
  const { isEditMode } = useEditModeStore()
  const { setCellSize, setPreviewCellSize } = useGridStore()
  const { widgets, removeWidget, phantomWidget, isDraggingNewWidget } = useWidgetStore()
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

  // phantom을 지정 인덱스에 삽입한 display 전용 배열
  const displayWidgets = phantomWidget
    ? [
        ...widgets.slice(0, phantomWidget.insertIndex),
        { instanceId: '__phantom__', colSpan: phantomWidget.colSpan, rowSpan: phantomWidget.rowSpan },
        ...widgets.slice(phantomWidget.insertIndex),
      ]
    : widgets

  return (
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
              return <PhantomSlot key="__phantom__" colSpan={w.colSpan} rowSpan={w.rowSpan} />
            }
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
          {!isEditMode && !phantomWidget && canFitInGrid(widgets, 1, 1) && <AddWidgetSlot />}
        </div>
      </div>
    </div>
  )
}
