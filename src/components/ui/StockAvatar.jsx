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
  warning: 'bg-avatar-warning-bg border-avatar-warning-border text-warning',
  green:   'bg-avatar-green-bg border-avatar-green-border text-avatar-green-text',
  red:     'bg-up-bg border-up-border text-up',
  purple:  'bg-avatar-purple-bg border-avatar-purple-border text-avatar-purple-text',
  yellow:  'bg-avatar-yellow-bg border-avatar-yellow-border text-avatar-yellow-text',
  teal:    'bg-avatar-teal-bg border-avatar-teal-border text-avatar-teal-text',
  orange:  'bg-avatar-orange-bg border-avatar-orange-border text-avatar-orange-text',
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
