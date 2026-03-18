import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  user: null,           // { userId, email, name }
  accessToken: null,
  refreshToken: null,

  // 로그인 성공 시 호출
  setAuth: ({ accessToken, refreshToken, user, autoLogin }) => {
    const storage = autoLogin ? localStorage : sessionStorage
    storage.setItem('accessToken', accessToken)
    storage.setItem('refreshToken', refreshToken)
    set({ isAuthenticated: true, user, accessToken, refreshToken })
  },

  // 앱 초기화 시 저장된 토큰 복원
  restoreAuth: () => {
    const accessToken =
      localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken')
    const refreshToken =
      localStorage.getItem('refreshToken') ?? sessionStorage.getItem('refreshToken')
    if (accessToken) {
      set({ isAuthenticated: true, accessToken, refreshToken })
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('refreshToken')
    set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null })
  },
}))

export default useAuthStore
