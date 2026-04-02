import { useRef, useLayoutEffect } from 'react'
import useEditModeStore from '@/store/useEditModeStore'
import EditHandle from './EditHandle'
import { cn } from '@/lib/cn'

export default function WidgetCard({ children, className = '', onDelete, onClick }) {
  const { isEditMode, wiggleDelay, wiggleSyncKey } = useEditModeStore()
  const animRef = useRef(null)

  // key 트릭 대신 CSS 애니메이션만 명령형으로 재시작 — 자식 트리 언마운트 방지
  // wiggleSyncKey > 0: resyncWiggle 호출 시 (drag end), 0은 editMode 진입 초기값
  useLayoutEffect(() => {
    if (!isEditMode || wiggleSyncKey === 0) return
    const el = animRef.current
    if (!el) return
    el.style.animationName = 'none'
    void el.getBoundingClientRect() // force reflow
    el.style.animationName = ''
  }, [wiggleSyncKey, isEditMode])

  return (
    <div className={cn('h-full', className)}>
      {/* animation wrapper: relative는 EditHandle의 absolute 기준점 역할 */}
      <div
        ref={animRef}
        className={cn(
          'relative h-full',
          isEditMode
            ? 'animate-wiggle'
            : 'cursor-pointer',
        )}
        style={isEditMode ? { animationDelay: `${wiggleDelay}ms` } : undefined}
        onClick={!isEditMode ? onClick : undefined}
      >
        {isEditMode && <EditHandle onDelete={onDelete} />}
        <div
          className={cn(
            'h-full bg-surface border rounded-2xl p-[14px_16px] overflow-hidden',
            'flex flex-col',
            isEditMode
              ? 'border-stroke-input shadow-widget-edit'
              : 'border-stroke transition-[border-color,box-shadow] duration-[200ms] hover:border-widget-border-hover hover:shadow-widget-hover',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
