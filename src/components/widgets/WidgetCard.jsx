export default function WidgetCard({ children, colSpan = 1, className = '' }) {
  return (
    <div
      className={[
        'bg-surface border border-stroke rounded-2xl p-[14px_16px]',
        'flex flex-col overflow-hidden cursor-pointer',
        'transition-[border-color,box-shadow,transform] duration-[200ms]',
        'hover:border-widget-border-hover hover:shadow-widget-hover hover:-translate-y-px',
        colSpan === 2 ? 'col-span-2' : 'col-span-1',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
