import { fetchWithAuth } from '@/lib/fetchWithAuth'

const STORAGE_KEY = 'pinCachedAt'
const CACHE_DURATION_MS = 30 * 60 * 1000 // 30분

function isPinCached() {
  const cachedAt = sessionStorage.getItem(STORAGE_KEY)
  if (!cachedAt) return false
  return Date.now() - Number(cachedAt) < CACHE_DURATION_MS
}

function cachePin() {
  sessionStorage.setItem(STORAGE_KEY, String(Date.now()))
}

function clearPin() {
  sessionStorage.removeItem(STORAGE_KEY)
}

async function verifyAndCachePin(pin) {
  await fetchWithAuth('/api/accounts/verify-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountPin: pin }),
  })
  cachePin()
}

export default function usePinAuth() {
  return { isPinCached, verifyAndCachePin, clearPin }
}
