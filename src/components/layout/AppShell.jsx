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
import useWidgetStore, { canFitInGrid, canReorderWidgets } from '@/store/useWidgetStore'

import useGridStore from '@/store/useGridStore'
import { WIDGET_REGISTRY } from '@/components/widgets/widgetRegistry'
import { GRID_GAP } from '@/lib/gridConstants'

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

  function handleDragOver({ active, over }) {
    if (!over) return
    if (over.id === lastOverId.current) return
    lastOverId.current = over.id

    const type = active.data.current?.type

    if (type === 'existing-widget') {
      if (active.id === over.id) return
      if (canReorderWidgets(widgets, active.id, over.id)) {
        reorderWidgets(active.id, over.id)
      }
    } else if (type === 'new-widget') {
      const { variant } = active.data.current
      if (!canFitInGrid(widgets, variant.colSpan, variant.rowSpan)) {
        clearPhantom()
        return
      }
      const overIndex = widgets.findIndex((w) => w.instanceId === over.id)
      const insertIndex = overIndex !== -1 ? overIndex : widgets.length
      setPhantom({ insertIndex, colSpan: variant.colSpan, rowSpan: variant.rowSpan })
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
      const isOverDashboard = widgets.some((w) => w.instanceId === over.id)
      if (isOverDashboard) {
        const { widgetTypeId, variant } = active.data.current
        const insertIndex = savedPhantom?.insertIndex ?? widgets.length
        addWidgetAt(widgetTypeId, variant, insertIndex)
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
