import useEditModeStore from '@/store/useEditModeStore'
import EditHandle from './EditHandle'

export default function WidgetCard({ children, colSpan = 1, className = '', onDelete }) {
  const { isEditMode } = useEditModeStore()

  return (
    <div
      className={[
        'relative',
        isEditMode
          ? 'animate-wiggle cursor-grab'
          : 'cursor-pointer transition-[transform] duration-[200ms] hover:-translate-y-px',
        colSpan === 2 ? 'col-span-2' : 'col-span-1',
        className,
      ].join(' ')}
    >
      {isEditMode && <EditHandle onDelete={onDelete} />}
      {/* 콘텐츠 클리핑 래퍼 — 핸들은 relative 부모 기준으로 바깥에 위치 */}
      <div
        className={[
          'h-full bg-surface border rounded-2xl p-[14px_16px]',
          'flex flex-col overflow-hidden',
          isEditMode
            ? 'border-stroke-input shadow-widget-edit'
            : 'border-stroke transition-[border-color,box-shadow] duration-[200ms] hover:border-widget-border-hover hover:shadow-widget-hover',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  )
}
