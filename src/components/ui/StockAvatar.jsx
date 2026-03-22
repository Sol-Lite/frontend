/**
 * 종목 원형 아이콘
 * stockCode + marketType → 로고 이미지 우선, 없으면 name 이니셜 폴백
 *
 * @param {string} name       - 종목명 (폴백 이니셜)
 * @param {string} stockCode  - 종목코드 (ex: '005930')
 * @param {string} marketType - 'KOSPI'|'KOSDAQ'|'NYSE'|'NASDAQ'|'AMEX'
 * @param {string} color      - 이니셜 테마 색상 (이미지 없을 때 사용)
 * @param {'sm'|'md'|'lg'} size
 * @param {string} className
 */
import { useState } from 'react'
import { getStockLogoUrl } from '@/lib/stockLogo'

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
  md: 'w-8 h-8 text-[10px]',
  lg: 'w-9 h-9 text-[10px]',
}

// marketType 모를 때 시도할 순서
function buildUrlQueue(stockCode, marketType) {
  if (!stockCode) return []
  if (marketType) {
    const primary = getStockLogoUrl(marketType, stockCode)
    // 국내 종목이면 KOSPI↔KOSDAQ 크로스 폴백
    if (marketType === 'KOSPI')  return [primary, getStockLogoUrl('KOSDAQ', stockCode)].filter(Boolean)
    if (marketType === 'KOSDAQ') return [primary, getStockLogoUrl('KOSPI',  stockCode)].filter(Boolean)
    return [primary].filter(Boolean)
  }
  // marketType 없으면 KOSPI → KOSDAQ 순서로
  return [getStockLogoUrl('KOSPI', stockCode), getStockLogoUrl('KOSDAQ', stockCode)].filter(Boolean)
}

export default function StockAvatar({ name, stockCode, marketType, color = 'primary', size = 'md', className = '' }) {
  const urls = buildUrlQueue(stockCode, marketType)
  const [urlIdx, setUrlIdx] = useState(0)

  const sizeClass = SIZE_MAP[size] ?? SIZE_MAP.md
  const base = `rounded-full border shrink-0 overflow-hidden flex items-center justify-center ${sizeClass} ${className}`

  const src = urls[urlIdx]

  if (src) {
    return (
      <div className={`${base} border-stroke bg-surface`}>
        <img
          key={src}
          src={src}
          alt={name}
          className="w-full h-full object-cover scale-110"
          onError={() => setUrlIdx((i) => i + 1)}
        />
      </div>
    )
  }

  return (
    <div className={`${base} font-extrabold ${COLOR_MAP[color] ?? COLOR_MAP.primary}`}>
      {name?.slice(0, 2) ?? '?'}
    </div>
  )
}
