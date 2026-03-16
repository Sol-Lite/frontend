/**
 * 필터 선택 칩 (전체 / 국내 / 미국 등)
 *
 * @param {boolean}  isActive
 * @param {function} onClick
 * @param {ReactNode} children
 * @param {string}   className
 */
export default function FilterChip({ isActive, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1 rounded-[20px] text-[11px] font-semibold whitespace-nowrap transition-colors duration-[120ms]',
        isActive
          ? 'bg-primary text-white'
          : 'bg-surface-muted text-foreground-tertiary hover:bg-stroke-input',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
