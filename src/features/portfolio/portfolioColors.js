import { useCallback, useEffect, useMemo, useState } from 'react'
import { getStockLogoUrl } from '@/lib/stockLogo'
import { extractDominantColor } from '@/lib/extractLogoColor'

const GRAY_COLOR = '#9CA3AF'
const FALLBACK_COLORS = ['#0046FF', '#00C2A8', '#7B61FF', '#FF8C00', '#0035CC']

function hashString(text) {
  let hash = 5381
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getStableKey(item, idx) {
  if (item?.type === 'OTHER') return 'other'
  if (item?.stockCode) return `stock:${item.stockCode}`
  const label = item?.name ?? item?.label ?? `item_${idx}`
  return `label:${String(label).trim().toLowerCase()}`
}

function getFallbackColor(item, idx) {
  const key = getStableKey(item, idx)
  return FALLBACK_COLORS[hashString(key) % FALLBACK_COLORS.length]
}

export function usePortfolioColors(items) {
  const [colors, setColors] = useState({})
  const [ready, setReady] = useState(false)

  const depsKey = useMemo(
    () => JSON.stringify((items ?? []).map((item, idx) => ({
      key: getStableKey(item, idx),
      stockCode: item?.stockCode ?? null,
      marketType: item?.marketType ?? null,
      type: item?.type ?? null,
    }))),
    [items],
  )

  useEffect(() => {
    if (!items?.length) { setReady(true); return }
    let cancelled = false
    setReady(false)

    Promise.all(items.map(async (item, idx) => {
      const key = getStableKey(item, idx)

      if (item?.type === 'OTHER' || item?.type === 'CASH') {
        return [key, GRAY_COLOR]
      }

      if (!item?.stockCode) {
        return [key, getFallbackColor(item, idx)]
      }

      const fallback = getFallbackColor(item, idx)
      const url =
        getStockLogoUrl(item.marketType, item.stockCode) ??
        getStockLogoUrl('KOSPI', item.stockCode) ??
        getStockLogoUrl('KOSDAQ', item.stockCode)

      if (!url) return [key, fallback]

      const color = await extractDominantColor(url, fallback)
      return [key, color]
    })).then((entries) => {
      if (!cancelled) {
        setColors(Object.fromEntries(entries))
        setReady(true)
      }
    })

    return () => { cancelled = true }
  }, [depsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const getColor = useCallback((item, idx = 0) => {
    const key = getStableKey(item, idx)
    if (item?.type === 'OTHER' || item?.type === 'CASH') return GRAY_COLOR
    return colors[key] ?? getFallbackColor(item, idx)
  }, [colors])

  return { getColor, ready }
}
