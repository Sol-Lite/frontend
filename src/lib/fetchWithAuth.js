import useAuthStore from '@/store/useAuthStore'

let isRefreshing = false
let refreshSubscribers = []

// 탭 간 refresh/logout 동기화
const authChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('sol_auth')
  : null

authChannel?.addEventListener('message', ({ data }) => {
  if (data.type === 'TOKEN_REFRESHED') {
    const { accessToken } = data
    const storage = localStorage.getItem('accessToken') ? localStorage : sessionStorage
    storage.setItem('accessToken', accessToken)
    useAuthStore.setState({ accessToken })
  } else if (data.type === 'LOGOUT') {
    if (useAuthStore.getState().isAuthenticated) {
      useAuthStore.getState().logout({ broadcast: false })
      useAuthStore.getState().openLoginModal()
    }
  }
})

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

  if ((res.status !== 401 && res.status !== 403) || skipAuth) {
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
        // 다른 탭에 새 토큰 브로드캐스트
        authChannel?.postMessage({ type: 'TOKEN_REFRESHED', accessToken: newToken })
        onRefreshed(newToken)
      })
      .catch((err) => {
        const latestToken =
          localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken')
        const currentToken = useAuthStore.getState().accessToken
        if (latestToken && latestToken !== currentToken) {
          // 멀티탭: 다른 탭이 이미 rotation 완료
          useAuthStore.setState({ accessToken: latestToken })
          onRefreshed(latestToken)
        } else if (latestToken) {
          // refresh 실패했지만 토큰 존재 → 현재 토큰으로 재시도
          // (신규 발급 토큰 전파 지연, 일시적 refresh 서버 오류 등 흡수)
          onRefreshed(latestToken)
        } else {
          // 토큰 없음 → 완전 만료 → logout
          onRefreshFailed(err)
          useAuthStore.getState().logout({ broadcast: true })
          useAuthStore.getState().openLoginModal()
        }
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
