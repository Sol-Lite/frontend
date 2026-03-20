import { useState, useRef, useEffect } from 'react'
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
import useWidgetStore, { canFitInGrid, canReorderWidgets, findInsertIndex } from '@/store/useWidgetStore'

import useGridStore from '@/store/useGridStore'
import { WIDGET_REGISTRY } from '@/components/widgets/widgetRegistry'
import { GRID_GAP, GRID_COLS, GRID_ROWS, gridElementRef } from '@/lib/gridConstants'

export default function AppShell() {
  const [activeDrag, setActiveDrag] = useState(null)
  const {
    widgets,
    reorderWidgets,
    addWidgetAt,
    setWidgetsOrder,
    setPhantom,
    clearPhantom,
    phantomWidget,
    setIsDraggingNewWidget,
  } = useWidgetStore()
  const { cellWidth, cellHeight } = useGridStore()
  const preDragOrder = useRef(null)
  const lastOverId = useRef(null)
  const pointerPos = useRef({ x: 0, y: 0 })

  // 포인터 좌표를 실시간으로 추적 (handleDragMove에서 사용)
  useEffect(() => {
    const onMove = (e) => { pointerPos.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleDragStart({ active }) {
    const type = active.data.current?.type
    setActiveDrag({ id: active.id, data: active.data.current })
    if (type === 'existing-widget') {
      preDragOrder.current = [...widgets]
      lastOverId.current = null
    } else if (type === 'new-widget') {
      setIsDraggingNewWidget(true)
    }
  }

  /* new-widget 드래그 중 포인터 좌표 → grid cell → insertIndex 계산.
     onDragOver보다 높은 빈도로 발생해 더 정확한 위치를 반영한다. */
  function handleDragMove({ active }) {
    if (active.data.current?.type !== 'new-widget') return
    const el = gridElementRef.current
    if (!el || !cellWidth || !cellHeight) return

    const { variant } = active.data.current
    if (!canFitInGrid(widgets, variant.colSpan, variant.rowSpan)) {
      clearPhantom()
      return
    }

    const rect = el.getBoundingClientRect()
    const { x, y } = pointerPos.current

    // 그리드 영역 밖이면 phantom 제거
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      clearPhantom()
      return
    }

    const col = Math.max(0, Math.min(Math.floor((x - rect.left) / (cellWidth + GRID_GAP)), GRID_COLS - 1))
    const row = Math.max(0, Math.min(Math.floor((y - rect.top) / (cellHeight + GRID_GAP)), GRID_ROWS - 1))
    const insertIndex = findInsertIndex(widgets, row, col)
    setPhantom({ insertIndex, colSpan: variant.colSpan, rowSpan: variant.rowSpan })
  }

  function handleDragOver({ active, over }) {
    const type = active.data.current?.type

    if (!over) {
      lastOverId.current = null
      if (type === 'new-widget') clearPhantom()
      return
    }

    if (over.id === lastOverId.current) return
    lastOverId.current = over.id

    // existing-widget 재정렬만 처리 (new-widget phantom은 handleDragMove에서 처리)
    if (type === 'existing-widget') {
      if (active.id === over.id) return
      if (canReorderWidgets(widgets, active.id, over.id)) {
        reorderWidgets(active.id, over.id)
      }
    }
  }

  function handleDragEnd({ active, over }) {
    const savedPhantom = phantomWidget
    setActiveDrag(null)
    lastOverId.current = null
    clearPhantom()
    setIsDraggingNewWidget(false)

    const type = active.data.current?.type

    if (!over) {
      if (type === 'existing-widget' && preDragOrder.current) {
        setWidgetsOrder(preDragOrder.current)
      }
      preDragOrder.current = null
      return
    }

    preDragOrder.current = null

    if (type === 'new-widget') {
      // savedPhantom이 있어야만 대시보드 위에 유효하게 hover했다고 판단
      // phantom 없으면 EditPanel 영역에서 drop한 것으로 간주해 추가하지 않음
      const isOverDashboard =
        savedPhantom != null &&
        (over.id === 'dashboard-grid' || widgets.some((w) => w.instanceId === over.id))
      if (isOverDashboard) {
        const { widgetTypeId, variant } = active.data.current
        addWidgetAt(widgetTypeId, variant, savedPhantom.insertIndex)
      }
    }
    // existing-widget: onDragOver에서 이미 reorder 완료
  }

  function handleDragCancel() {
    clearPhantom()
    setIsDraggingNewWidget(false)
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
