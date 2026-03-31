import { useCallback } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Grid2X2Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import useEditModeStore from '@/store/useEditModeStore'

/**
 * 대시보드 위젯을 dnd-kit draggable + droppable item으로 래핑.
 * - SortableContext/useSortable 미사용 → droppableRects 구독 루프 방지
 * - grid col-span / row-span 처리
 * - isEditMode일 때만 카드 전체 drag 활성화 (existing-widget)
 * - 비편집모드에서 hover 시 핸들 버튼만 drag 활성화 (widget-to-chat)
 * - isDragging 시 원본 자리 placeholder 유지 (opacity: 0)
 */
export default function SortableWidgetCard({
  instanceId,
  colSpan = 1,
  rowSpan = 1,
  gridCol,
  gridRow,
  widgetTypeId,
  config = {},
  children,
}) {
  const { isEditMode, widgetDragLockCount } = useEditModeStore()
  const isDragLocked = widgetDragLockCount > 0

  // 편집모드 전용 — 카드 전체 draggable (existing-widget)
  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: instanceId,
    disabled: !isEditMode || isDragLocked,
    data: { type: 'existing-widget', instanceId },
  })

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: instanceId,
    data: { type: 'existing-widget', instanceId },
  })

  // 비편집모드 전용 — 핸들 버튼 draggable (widget-to-chat)
  const {
    attributes: handleAttrs,
    listeners: handleListeners,
    setNodeRef: setHandleRef,
  } = useDraggable({
    id: `wtc-handle-${instanceId}`,
    disabled: isEditMode || isDragLocked,
    data: { type: 'widget-to-chat', instanceId, widgetTypeId, config },
  })

  const setNodeRef = useCallback(
    (node) => {
      setDraggableRef(node)
      setDroppableRef(node)
    },
    [setDraggableRef, setDroppableRef],
  )

  return (
    <div
      ref={setNodeRef}
      className={cn('relative h-full group', isEditMode && !isDragLocked && 'cursor-grab', isDragging && 'opacity-0')}
      style={
        gridCol && gridRow
          ? { gridColumn: `${gridCol} / span ${colSpan}`, gridRow: `${gridRow} / span ${rowSpan}` }
          : undefined
      }
      {...attributes}
      {...listeners}
    >
      {children}

      {/* 비편집모드 hover 핸들 — widget-to-chat drag 진입점 */}
      {!isEditMode && (
        <button
          ref={setHandleRef}
          aria-label="채팅으로 질문하기"
          className={cn(
            'absolute top-2 right-2 z-10 p-1 rounded',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            'bg-surface border border-stroke text-foreground-secondary',
            'hover:text-primary cursor-grab active:cursor-grabbing',
          )}
          {...handleAttrs}
          {...handleListeners}
        >
          <Grid2X2Plus size={13} />
        </button>
      )}
    </div>
  )
}
