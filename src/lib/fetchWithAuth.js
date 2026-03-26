import useAuthStore from '@/store/useAuthStore'

let isRefreshing = false
let refreshSubscribers = []

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb)
}

function onRefreshFailed(err) {
  const pending = [...refreshSubscribers]
  refreshSubscribers = []
  pending.forEach((cb) => cb(null, err))
}

async function refreshToken() {
  const res = await fetch('/api/auth/token/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('refresh failed')
  return res.json()
}

export async function fetchWithAuth(url, options = {}) {
  const { skipAuth = false, ...fetchOptions } = options

  const headers = { ...fetchOptions.headers }

  if (!skipAuth) {
    const token = useAuthStore.getState().accessToken
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...fetchOptions, headers, credentials: 'include' })

  if (res.status !== 401 || skipAuth) {
    const text = await res.text()
    const data = text ? tryParseJson(text) : null
    if (!res.ok) throw data ?? { message: '요청에 실패했습니다.' }
    return data
  }

  // 401 처리: 모든 요청(첫 번째 포함)을 subscriber에 먼저 등록
  const retryPromise = new Promise((resolve, reject) => {
    addRefreshSubscriber(async (newToken, refreshErr) => {
      if (!newToken) {
        reject(refreshErr ?? new Error('refresh failed'))
        return
      }
      try {
        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` }
        const retryRes = await fetch(url, { ...fetchOptions, headers: retryHeaders, credentials: 'include' })
        const text = await retryRes.text()
        const data = text ? tryParseJson(text) : null
        if (!retryRes.ok) throw data ?? { message: '요청에 실패했습니다.' }
        resolve(data)
      } catch (err) {
        reject(err)
      }
    })
  })

  // 로그아웃 상태면 refresh 시도 안 함
  if (!useAuthStore.getState().isAuthenticated) {
    onRefreshFailed(new Error('not authenticated'))
    return retryPromise
  }

  // 첫 번째 요청만 refresh 수행
  if (!isRefreshing) {
    isRefreshing = true
    refreshToken()
      .then((data) => {
        const newToken = data.accessToken
        const storage = localStorage.getItem('accessToken') ? localStorage : sessionStorage
        storage.setItem('accessToken', newToken)
        useAuthStore.setState({ accessToken: newToken })
        onRefreshed(newToken)
      })
      .catch((err) => {
        onRefreshFailed(err)
        useAuthStore.getState().logout()
        useAuthStore.getState().openLoginModal()
      })
      .finally(() => {
        isRefreshing = false
      })
  }

  return retryPromise
}

function tryParseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}
