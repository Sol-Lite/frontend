/**
 * 기간 선택 칩 (1일 / 1주 / 1달 등)
 *
 * @param {boolean}  isActive
 * @param {function} onClick
 * @param {ReactNode} children
 * @param {string}   className
 */
export default function PeriodChip({ isActive, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors duration-[120ms]',
        isActive
          ? 'bg-foreground text-white'
          : 'bg-transparent text-foreground-disabled hover:text-foreground-secondary',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
