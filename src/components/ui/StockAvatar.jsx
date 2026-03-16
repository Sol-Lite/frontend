/**
 * 종목 원형 아이콘
 *
 * @param {string} name    - 종목명 (표시할 텍스트, 최대 2자)
 * @param {string} color   - 테마 색상 키: 'primary'|'warning'|'green'|'red'|'purple' (기본: 'primary')
 * @param {'sm'|'md'|'lg'} size
 * @param {string} className
 */
const COLOR_MAP = {
  primary: 'bg-primary-light border-primary-border text-primary',
  warning: 'bg-[#FFF3E0] border-[#FED7AA] text-warning',
  green:   'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]',
  red:     'bg-up-bg border-up-border text-up',
  purple:  'bg-[#F5F3FF] border-[#DDD6FE] text-[#7C3AED]',
}

const SIZE_MAP = {
  sm: 'w-7 h-7 text-[9px]',
  md: 'w-9 h-9 text-[10px]',
  lg: 'w-10 h-10 text-[10px]',
}

export default function StockAvatar({ name, color = 'primary', size = 'md', className = '' }) {
  const label = name?.slice(0, 2) ?? '?'

  return (
    <div
      className={`rounded-full border flex items-center justify-center font-extrabold shrink-0
        ${COLOR_MAP[color] ?? COLOR_MAP.primary}
        ${SIZE_MAP[size]}
        ${className}`}
    >
      {label}
    </div>
  )
}
