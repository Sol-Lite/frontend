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
import useWidgetStore, { canPlaceAt, canSwap } from '@/store/useWidgetStore'
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
    swapWidgets,
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
     new-widget / existing-widget 모두 처리.

     existing-widget 배치 규칙:
       1. 빈 셀 위 → 드래그 위젯만 그 위치로 이동 (phantom 표시)
       2. 점유 셀 위 → canSwap 통과 시에만 swap 허용 (phantom 표시)
       3. 그 외 → phantom 제거 (drop 불가)
     → 드래그한 위젯 외 다른 위젯은 절대 의도치 않게 이동하지 않음. */
  function handleDragMove({ active }) {
    const type = active.data.current?.type
    if (type !== 'new-widget' && type !== 'existing-widget') return

    const el = gridElementRef.current
    if (!el || !cellWidth || !cellHeight) return

    const rect = el.getBoundingClientRect()
    const { x, y } = pointerPos.current

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      clearPhantom()
      return
    }

    // 1-indexed target cell (포인터 셀의 top-left 기준)
    const targetCol = Math.max(1, Math.min(Math.floor((x - rect.left) / (cellWidth + GRID_GAP)) + 1, GRID_COLS))
    const targetRow = Math.max(1, Math.min(Math.floor((y - rect.top) / (cellHeight + GRID_GAP)) + 1, GRID_ROWS))

    if (type === 'new-widget') {
      const { variant } = active.data.current
      if (canPlaceAt(widgets, targetCol, targetRow, variant.colSpan, variant.rowSpan)) {
        setPhantom({ gridCol: targetCol, gridRow: targetRow, colSpan: variant.colSpan, rowSpan: variant.rowSpan })
      } else {
        clearPhantom()
      }
      return
    }

    // existing-widget
    const activeWidget = widgets.find((w) => w.instanceId === active.id)
    if (!activeWidget) return

    // Case 1: 빈 셀 → 이동
    if (canPlaceAt(widgets, targetCol, targetRow, activeWidget.colSpan, activeWidget.rowSpan, active.id)) {
      setPhantom({
        gridCol: targetCol,
        gridRow: targetRow,
        colSpan: activeWidget.colSpan,
        rowSpan: activeWidget.rowSpan,
        activeId: active.id,
      })
      return
    }

    // Case 2: 점유 셀 → 해당 위젯과 swap 가능 여부 확인
    const targetWidget = widgets.find(
      (w) =>
        w.instanceId !== active.id &&
        targetCol >= w.gridCol && targetCol < w.gridCol + w.colSpan &&
        targetRow >= w.gridRow && targetRow < w.gridRow + w.rowSpan,
    )
    if (targetWidget && canSwap(widgets, active.id, targetWidget.instanceId)) {
      // phantom은 active 위젯이 이동할 자리(= targetWidget의 top-left)에 표시
      setPhantom({
        gridCol: targetWidget.gridCol,
        gridRow: targetWidget.gridRow,
        colSpan: activeWidget.colSpan,
        rowSpan: activeWidget.rowSpan,
        activeId: active.id,
        swapWithId: targetWidget.instanceId,
      })
    } else {
      clearPhantom()
    }
  }

  function handleDragOver({ active, over }) {
    // phantom은 handleDragMove(pointer 좌표 기반)에서 관리
    // new-widget이 그리드 외부로 벗어났을 때 phantom 제거 보조
    if (!over && active.data.current?.type === 'new-widget') clearPhantom()
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
      if (savedPhantom.swapWithId) {
        swapWidgets(savedPhantom.activeId, savedPhantom.swapWithId)
      } else {
        moveWidgetTo(savedPhantom.activeId, savedPhantom.gridCol, savedPhantom.gridRow)
      }
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
