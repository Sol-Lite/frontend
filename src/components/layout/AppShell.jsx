import { useState } from 'react'
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
import useWidgetStore from '@/store/useWidgetStore'
import { WIDGET_REGISTRY } from '@/components/widgets/widgetRegistry'

export default function AppShell() {
  const [activeDrag, setActiveDrag] = useState(null)
  const { widgets, reorderWidgets, addWidget } = useWidgetStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleDragStart({ active }) {
    setActiveDrag({ id: active.id, data: active.data.current })
  }

  function handleDragEnd({ active, over }) {
    setActiveDrag(null)
    if (!over) return
    const { type } = active.data.current ?? {}

    if (type === 'existing-widget' && active.id !== over.id) {
      reorderWidgets(active.id, over.id)
    } else if (type === 'new-widget') {
      // 대시보드 grid 위 또는 grid 내 어느 위젯 위에 드롭해도 추가
      const isOverDashboard =
        over.id === 'dashboard' || widgets.some((w) => w.instanceId === over.id)
      if (isOverDashboard) {
        const { widgetTypeId, variant } = active.data.current
        addWidget(widgetTypeId, variant)
      }
    }
  }

  // DragOverlay: existing-widget 드래그 시 위젯 미리보기
  let overlayContent = null
  if (activeDrag?.data?.type === 'existing-widget') {
    const w = widgets.find((w) => w.instanceId === activeDrag.id)
    const Comp = w ? WIDGET_REGISTRY[w.widgetTypeId] : null
    if (Comp && w) {
      overlayContent = (
        <div className="opacity-90 rotate-1 scale-105 shadow-widget-edit rounded-2xl cursor-grabbing">
          <Comp variant={w.variantId} colSpan={w.colSpan} rowSpan={w.rowSpan} config={w.config} />
        </div>
      )
    }
  } else if (activeDrag?.data?.type === 'new-widget') {
    const { variant } = activeDrag.data
    overlayContent = (
      <div className="opacity-90 rotate-1 scale-105 rounded-2xl bg-surface border-2 border-primary shadow-widget-edit cursor-grabbing flex items-center justify-center px-3 py-2">
        <span className="text-[11px] text-primary font-semibold">{variant?.label}</span>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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
