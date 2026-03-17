/**
 * 위젯 내 소형 탭 칩 (DESIGN.md §8 TabChip)
 *
 * @param {boolean} isActive
 * @param {function} onClick
 */
export default function TabChip({ children, isActive = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-[9px] py-[3px] text-[10px] font-semibold rounded-[6px] border-none cursor-pointer transition-colors duration-[150ms]',
        isActive
          ? 'bg-primary-light text-primary'
          : 'bg-transparent text-foreground-disabled hover:bg-surface-muted hover:text-foreground-secondary',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
