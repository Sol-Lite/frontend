import { create } from 'zustand'
import { queryClient } from '@/lib/queryClient'
import useUIStore from '@/store/useUIStore'
import { applyThemeFromServer } from '@/lib/applyTheme'

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

async function silentRefresh() {
  const res = await fetch('/api/auth/token/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('refresh failed')
  return res.json()
}

const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  user: null,           // { userId, email, name }
  accessToken: null,
  showLoginModal: false,
  authModalView: 'login',
  isRestoring: true,    // 앱 초기화 중 상태 복원 여부

  // 로그인 성공 시 호출
  setAuth: ({ accessToken, user, autoLogin }) => {
    const storage = autoLogin ? localStorage : sessionStorage
    storage.setItem('accessToken', accessToken)
    storage.setItem('user', JSON.stringify(user))
    set({ isAuthenticated: true, user, accessToken })
  },

  // 앱 초기화 시 저장된 토큰 복원
  restoreAuth: async () => {
    const accessToken =
      localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken')

    if (!accessToken) {
      // 저장된 토큰 없음 — 쿠키(refresh token)가 살아있는지 silent refresh로 확인
      try {
        const data = await silentRefresh()
        const newToken = data.accessToken
        sessionStorage.setItem('accessToken', newToken)
        const userRes = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${newToken}` },
          credentials: 'include',
        })
        const user = userRes.ok ? await userRes.json() : null
        if (user) sessionStorage.setItem('user', JSON.stringify(user))
        set({ isAuthenticated: true, user, accessToken: newToken, isRestoring: false })
        applyThemeFromServer()
      } catch {
        set({ isRestoring: false })
      }
      return
    }

    const userStr = localStorage.getItem('user') ?? sessionStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null

    if (!isTokenExpired(accessToken)) {
      set({ isAuthenticated: true, user, accessToken, isRestoring: false })
      applyThemeFromServer()
      return
    }

    // 만료된 경우 refresh 시도
    try {
      const data = await silentRefresh()
      const newToken = data.accessToken
      const storage = localStorage.getItem('accessToken') ? localStorage : sessionStorage
      storage.setItem('accessToken', newToken)
      set({ isAuthenticated: true, user, accessToken: newToken, isRestoring: false })
      applyThemeFromServer()
    } catch {
      get().logout()
      set({ isRestoring: false })
    }
  },

  logout: ({ broadcast = true } = {}) => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    localStorage.removeItem('ui:theme')
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('user')
    queryClient.clear()
    useUIStore.getState().setTheme('light')
    set({ isAuthenticated: false, user: null, accessToken: null })
    if (broadcast && typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel('sol_auth')
      ch.postMessage({ type: 'LOGOUT' })
      ch.close()
    }
  },

  openLoginModal: (view = 'login') => {
    set({ showLoginModal: true, authModalView: view })
  },

  closeLoginModal: () => {
    set({ showLoginModal: false, authModalView: 'login' })
  },
}))

export default useAuthStore
