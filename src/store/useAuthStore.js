import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  user: null,           // { userId, email, name }
  accessToken: null,

  // 로그인 성공 시 호출
  setAuth: ({ accessToken, user, autoLogin }) => {
    const storage = autoLogin ? localStorage : sessionStorage
    storage.setItem('accessToken', accessToken)
    set({ isAuthenticated: true, user, accessToken })
  },

  // 앱 초기화 시 저장된 토큰 복원
  restoreAuth: () => {
    const accessToken =
      localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken')
    if (accessToken) {
      set({ isAuthenticated: true, accessToken })
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    sessionStorage.removeItem('accessToken')
    set({ isAuthenticated: false, user: null, accessToken: null })
  },
}))

export default useAuthStore
