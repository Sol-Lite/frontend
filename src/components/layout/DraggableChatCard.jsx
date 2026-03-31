import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

/**
 * 채팅 카드에서 위젯 크기를 선택했을 때 카드 전체를 드래거블 + 흔들림 상태로 만드는 래퍼.
 * AppShell의 DndContext 안에서 동작하며, 드롭 시 new-widget 타입으로 처리된다.
 */
export default function DraggableChatCard({ msgId, widgetTypeId, variant, widgetConfig, children }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `chat-widget-${msgId}`,
    data: { type: 'new-widget', widgetTypeId, variant, widgetConfig },
  })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={['cursor-grab active:cursor-grabbing', isDragging ? 'opacity-50' : 'animate-wiggle'].join(' ')}
    >
      {children}
    </div>
  )
}
