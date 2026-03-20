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
import useWidgetStore, { canPlaceAt, canReorderWidgets } from '@/store/useWidgetStore'
import useEditModeStore from '@/store/useEditModeStore'
import useGridStore from '@/store/useGridStore'
import { WIDGET_REGISTRY } from '@/components/widgets/widgetRegistry'
import { GRID_GAP, GRID_COLS, GRID_ROWS, gridElementRef } from '@/lib/gridConstants'

export default function AppShell() {
  const [activeDrag, setActiveDrag] = useState(null)
  const {
    widgets,
    reorderWidgets,
    setWidgetsOrder,
    commitLayout,
    addWidgetAt,
    setPhantom,
    clearPhantom,
    phantomWidget,
    setIsDraggingNewWidget,
    setIsDraggingExistingWidget,
  } = useWidgetStore()
  const { resyncWiggle } = useEditModeStore()
  const { cellWidth, cellHeight } = useGridStore()
  const preDragOrder = useRef(null)
  const lastOverId = useRef(null)
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
    if (type === 'existing-widget') {
      preDragOrder.current = [...widgets]
      lastOverId.current = null
      setIsDraggingExistingWidget(true)
    } else if (type === 'new-widget') {
      setIsDraggingNewWidget(true)
    }
  }

  /* new-widget 전용: 포인터가 위치한 빈 셀에 phantom 표시.
     existing-widget은 handleDragOver의 live reorder로 push-aside 처리. */
  function handleDragMove({ active }) {
    if (active.data.current?.type !== 'new-widget') return

    const el = gridElementRef.current
    if (!el || !cellWidth || !cellHeight) return

    const rect = el.getBoundingClientRect()
    const { x, y } = pointerPos.current

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      clearPhantom()
      return
    }

    const { variant } = active.data.current
    // 1-indexed target cell (포인터 셀의 top-left 기준)
    const targetCol = Math.max(1, Math.min(Math.floor((x - rect.left) / (cellWidth + GRID_GAP)) + 1, GRID_COLS))
    const targetRow = Math.max(1, Math.min(Math.floor((y - rect.top) / (cellHeight + GRID_GAP)) + 1, GRID_ROWS))

    if (canPlaceAt(widgets, targetCol, targetRow, variant.colSpan, variant.rowSpan)) {
      setPhantom({ gridCol: targetCol, gridRow: targetRow, colSpan: variant.colSpan, rowSpan: variant.rowSpan })
    } else {
      clearPhantom()
    }
  }

  /* existing-widget: 드래그 대상 위에서 live reorder → push-aside 효과.
     new-widget phantom은 handleDragMove에서 처리. */
  function handleDragOver({ active, over }) {
    const type = active.data.current?.type

    if (!over) {
      lastOverId.current = null
      if (type === 'new-widget') clearPhantom()
      return
    }

    if (over.id === lastOverId.current) return
    lastOverId.current = over.id

    if (type === 'existing-widget') {
      if (active.id === over.id) return
      if (canReorderWidgets(widgets, active.id, over.id)) {
        reorderWidgets(active.id, over.id)
      }
    }
  }

  function handleDragEnd({ active, over }) {
    window.removeEventListener('pointermove', onPointerMove)
    const savedPhantom = phantomWidget
    setActiveDrag(null)
    lastOverId.current = null
    clearPhantom()
    setIsDraggingNewWidget(false)
    setIsDraggingExistingWidget(false)
    resyncWiggle()

    const type = active.data.current?.type

    if (!over) {
      if (type === 'existing-widget' && preDragOrder.current) {
        setWidgetsOrder(preDragOrder.current)
      }
      preDragOrder.current = null
      return
    }

    preDragOrder.current = null

    if (type === 'new-widget' && savedPhantom) {
      const { widgetTypeId, variant } = active.data.current
      addWidgetAt(widgetTypeId, variant, savedPhantom.gridCol, savedPhantom.gridRow)
    } else if (type === 'existing-widget') {
      // arrayMove로 바뀐 배열 순서를 computeLayout으로 확정 → gridCol/gridRow commit
      commitLayout()
    }
  }

  function handleDragCancel() {
    window.removeEventListener('pointermove', onPointerMove)
    clearPhantom()
    setIsDraggingNewWidget(false)
    setIsDraggingExistingWidget(false)
    resyncWiggle()
    if (preDragOrder.current) {
      setWidgetsOrder(preDragOrder.current)
    }
    preDragOrder.current = null
    lastOverId.current = null
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
      onDragOver={handleDragOver}
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
