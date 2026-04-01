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

const ETF_ISSUER_STYLES = [
  { matchers: ['KODEX', '삼성'], label: 'KX', ring: 'from-blue-500 to-sky-400', fill: 'from-slate-950 via-blue-900 to-sky-500', text: 'text-white' },
  { matchers: ['TIGER', '미래에셋'], label: 'TG', ring: 'from-orange-400 to-amber-300', fill: 'from-orange-600 via-amber-500 to-yellow-300', text: 'text-slate-950' },
  { matchers: ['RISE', 'KBSTAR', 'KB'], label: 'KB', ring: 'from-yellow-300 to-amber-200', fill: 'from-stone-950 via-yellow-500 to-amber-300', text: 'text-slate-950' },
  { matchers: ['KOSEF', '키움', 'KIWOOM'], label: 'KW', ring: 'from-violet-400 to-fuchsia-300', fill: 'from-violet-700 via-fuchsia-600 to-pink-400', text: 'text-white' },
  { matchers: ['SOL', '신한'], label: 'SH', ring: 'from-blue-300 to-cyan-200', fill: 'from-blue-950 via-blue-700 to-cyan-400', text: 'text-white' },
  { matchers: ['HANARO', '하나'], label: 'HN', ring: 'from-emerald-300 to-teal-200', fill: 'from-emerald-900 via-emerald-600 to-teal-400', text: 'text-white' },
  { matchers: ['ACE', '한국투자'], label: 'AC', ring: 'from-indigo-300 to-violet-200', fill: 'from-indigo-950 via-indigo-700 to-violet-400', text: 'text-white' },
  { matchers: ['ARIRANG', '한화'], label: 'AR', ring: 'from-rose-300 to-orange-200', fill: 'from-rose-700 via-red-500 to-orange-300', text: 'text-white' },
  { matchers: ['PLUS', '한화'], label: 'PL', ring: 'from-orange-300 to-rose-200', fill: 'from-orange-700 via-orange-500 to-rose-300', text: 'text-white' },
  { matchers: ['TIMEFOLIO'], label: 'TF', ring: 'from-cyan-300 to-sky-200', fill: 'from-cyan-950 via-cyan-700 to-sky-400', text: 'text-white' },
 ]

function getInitials(name = '') {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  const latin = trimmed.replace(/[^A-Za-z0-9]/g, '')
  if (latin.length >= 2) return latin.slice(0, 2).toUpperCase()
  const korean = [...trimmed.replace(/\s+/g, '')]
  return korean.slice(0, 2).join('')
}

function pickIssuerStyle(name = '') {
  const upper = name.toUpperCase()
  return ETF_ISSUER_STYLES.find(({ matchers }) => matchers.some((matcher) => upper.includes(matcher.toUpperCase()))) ?? null
}

function looksLikeEtfProduct(name = '') {
  const upper = name.toUpperCase()
  const etfHints = [
    'ETF',
    'ETN',
    '레버리지',
    '인버스',
    '2X',
    'KODEX',
    'TIGER',
    'KOSEF',
    'KBSTAR',
    'RISE',
    'ACE',
    'SOL',
    'HANARO',
    'ARIRANG',
    'PLUS',
    'TIMEFOLIO',
  ]
  return etfHints.some((hint) => upper.includes(hint))
}

function isDomesticEtf(name = '', marketType) {
  if (!['KOSPI', 'KOSDAQ'].includes(marketType)) return false
  return looksLikeEtfProduct(name) && Boolean(pickIssuerStyle(name))
}

function getMonogramTheme(name = '', stockCode = '', marketType = '') {
  const seed = `${name}${stockCode}${marketType}`
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 9973
  const themes = [
    { shell: 'from-slate-950 via-slate-800 to-slate-700', accent: 'from-cyan-400 to-sky-300', text: 'text-white' },
    { shell: 'from-blue-950 via-indigo-800 to-violet-700', accent: 'from-fuchsia-300 to-violet-200', text: 'text-white' },
    { shell: 'from-emerald-950 via-teal-800 to-cyan-700', accent: 'from-emerald-300 to-cyan-200', text: 'text-white' },
    { shell: 'from-zinc-950 via-stone-800 to-amber-700', accent: 'from-amber-300 to-yellow-200', text: 'text-white' },
    { shell: 'from-rose-950 via-red-800 to-orange-700', accent: 'from-orange-300 to-rose-200', text: 'text-white' },
  ]
  return themes[hash % themes.length]
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
  const [failedUrls, setFailedUrls] = useState(() => new Set())

  const sizeClass = SIZE_MAP[size] ?? SIZE_MAP.md
  const base = `rounded-full border shrink-0 overflow-hidden flex items-center justify-center ${sizeClass} ${className}`

  const src = urls.find((url) => !failedUrls.has(url))
  const initials = getInitials(name)
  const issuerStyle = pickIssuerStyle(name)
  const domesticEtf = isDomesticEtf(name, marketType)
  const monogramTheme = getMonogramTheme(name, stockCode, marketType)

  if (src) {
    return (
      <div className={`${base} border-stroke bg-surface`}>
        <img
          key={src}
          src={src}
          alt={name}
          className="w-full h-full object-cover scale-110"
          onError={() => setFailedUrls((prev) => new Set(prev).add(src))}
        />
      </div>
    )
  }

  if (domesticEtf && issuerStyle) {
    return (
      <div className={`${base} border-white/70 bg-gradient-to-br ${issuerStyle.ring} p-[1.5px]`}>
        <div className={`relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${issuerStyle.fill} ${issuerStyle.text}`}>
          <span className="text-[8px] font-black tracking-[-0.08em] leading-none">{issuerStyle.label}</span>
          <span className="absolute bottom-[18%] text-[5px] font-bold uppercase tracking-[0.18em] opacity-80">ETF</span>
        </div>
      </div>
    )
  }

  if (['NASDAQ', 'NYSE', 'AMEX'].includes(marketType)) {
    return (
      <div className={`${base} border-white/10 bg-gradient-to-br ${monogramTheme.shell}`}>
        <div className="relative flex h-full w-full items-center justify-center">
          <span className={`text-[11px] font-black tracking-[-0.08em] leading-none ${monogramTheme.text}`}>{initials}</span>
          <span className={`absolute bottom-[16%] h-[4px] w-[4px] rounded-full bg-gradient-to-br ${monogramTheme.accent} shadow-avatar-monogram-dot`} />
        </div>
      </div>
    )
  }

  return (
    <div className={`${base} relative border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 font-extrabold ${COLOR_MAP[color] ?? COLOR_MAP.primary}`}>
      <span className="relative tracking-[-0.08em]">{initials}</span>
    </div>
  )
}
