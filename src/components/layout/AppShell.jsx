import { useState, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import AppHeader from './AppHeader'
import RightPanel from './RightPanel'
import useWidgetStore, { canPlaceAt } from '@/store/useWidgetStore'
import useEditModeStore from '@/store/useEditModeStore'
import useGridStore from '@/store/useGridStore'
import { WIDGET_REGISTRY } from '@/components/widgets/widgetRegistry'
import { GRID_GAP, GRID_COLS, GRID_ROWS, gridElementRef } from '@/lib/gridConstants'

export default function AppShell() {
  const [activeDrag, setActiveDrag] = useState(null)
  const {
    widgets,
    addWidgetAt,
    moveWidgetTo,
    setPhantom,
    clearPhantom,
    phantomWidget,
    setIsDraggingNewWidget,
  } = useWidgetStore()
  const { resyncWiggle } = useEditModeStore()
  const { cellWidth, cellHeight } = useGridStore()
  const pointerPos = useRef({ x: 0, y: 0 })

  // 포인터 좌표를 drag 중에만 추적 (handleDragMove에서 사용)
  // 동일 참조로 등록·해제할 수 있도록 useRef에 저장
  const onPointerMove = useRef((e) => { pointerPos.current = { x: e.clientX, y: e.clientY } }).current

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleDragStart({ active }) {
    const type = active.data.current?.type
    setActiveDrag({ id: active.id, data: active.data.current })
    window.addEventListener('pointermove', onPointerMove)
    if (type === 'new-widget') {
      setIsDraggingNewWidget(true)
    }
  }

  /* 포인터 좌표 → 1-indexed grid cell → phantom 업데이트.
     new-widget, existing-widget 모두 처리.
     포인터가 빈 셀 위에 있을 때만 phantom 표시, 점유 셀 위면 phantom 제거. */
  function handleDragMove({ active }) {
    const type = active.data.current?.type
    if (type !== 'new-widget' && type !== 'existing-widget') return

    const el = gridElementRef.current
    if (!el || !cellWidth || !cellHeight) return

    const rect = el.getBoundingClientRect()
    const { x, y } = pointerPos.current

    // 그리드 영역 밖이면 phantom 제거
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      clearPhantom()
      return
    }

    // 1-indexed target cell (포인터가 가리키는 셀의 top-left 기준)
    const targetCol = Math.max(1, Math.min(Math.floor((x - rect.left) / (cellWidth + GRID_GAP)) + 1, GRID_COLS))
    const targetRow = Math.max(1, Math.min(Math.floor((y - rect.top) / (cellHeight + GRID_GAP)) + 1, GRID_ROWS))

    if (type === 'new-widget') {
      const { variant } = active.data.current
      if (canPlaceAt(widgets, targetCol, targetRow, variant.colSpan, variant.rowSpan)) {
        setPhantom({ gridCol: targetCol, gridRow: targetRow, colSpan: variant.colSpan, rowSpan: variant.rowSpan })
      } else {
        clearPhantom()
      }
    } else {
      // existing-widget: excludeId로 자기 자신 셀을 빈 셀로 간주
      const activeWidget = widgets.find((w) => w.instanceId === active.id)
      if (!activeWidget) return
      if (canPlaceAt(widgets, targetCol, targetRow, activeWidget.colSpan, activeWidget.rowSpan, active.id)) {
        setPhantom({
          gridCol: targetCol,
          gridRow: targetRow,
          colSpan: activeWidget.colSpan,
          rowSpan: activeWidget.rowSpan,
          activeId: active.id,
        })
      } else {
        clearPhantom()
      }
    }
  }

  function handleDragEnd({ active }) {
    window.removeEventListener('pointermove', onPointerMove)
    const savedPhantom = phantomWidget
    setActiveDrag(null)
    clearPhantom()
    setIsDraggingNewWidget(false)
    resyncWiggle()

    const type = active.data.current?.type

    if (type === 'new-widget' && savedPhantom) {
      const { widgetTypeId, variant } = active.data.current
      addWidgetAt(widgetTypeId, variant, savedPhantom.gridCol, savedPhantom.gridRow)
    } else if (type === 'existing-widget' && savedPhantom?.activeId) {
      moveWidgetTo(savedPhantom.activeId, savedPhantom.gridCol, savedPhantom.gridRow)
    }
  }

  function handleDragCancel() {
    window.removeEventListener('pointermove', onPointerMove)
    clearPhantom()
    setIsDraggingNewWidget(false)
    resyncWiggle()
    setActiveDrag(null)
  }

  // ── DragOverlay 렌더링 ────────────────────────────────────
  let overlayContent = null

  if (activeDrag && cellWidth && cellHeight) {
    const type = activeDrag.data?.type

    if (type === 'existing-widget') {
      const w = widgets.find((w) => w.instanceId === activeDrag.id)
      const Comp = w ? WIDGET_REGISTRY[w.widgetTypeId] : null
      if (Comp && w) {
        const ow = w.colSpan * cellWidth + (w.colSpan - 1) * GRID_GAP
        const oh = w.rowSpan * cellHeight + (w.rowSpan - 1) * GRID_GAP
        overlayContent = (
          <div className="opacity-90 shadow-widget-edit cursor-grabbing" style={{ width: ow, height: oh }}>
            <Comp variant={w.variantId} colSpan={w.colSpan} rowSpan={w.rowSpan} config={w.config} />
          </div>
        )
      }
    } else if (type === 'new-widget') {
      const { widgetTypeId, variant } = activeDrag.data
      const Comp = WIDGET_REGISTRY[widgetTypeId]
      if (Comp) {
        const ow = variant.colSpan * cellWidth + (variant.colSpan - 1) * GRID_GAP
        const oh = variant.rowSpan * cellHeight + (variant.rowSpan - 1) * GRID_GAP
        overlayContent = (
          <div className="opacity-90 shadow-widget-edit cursor-grabbing" style={{ width: ow, height: oh }}>
            <Comp variant={variant.id} colSpan={variant.colSpan} rowSpan={variant.rowSpan} />
          </div>
        )
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col h-screen overflow-hidden">
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-hidden bg-background">
            <Outlet />
          </main>
          <RightPanel />
        </div>
      </div>
      <DragOverlay>{overlayContent}</DragOverlay>
    </DndContext>
  )
}
