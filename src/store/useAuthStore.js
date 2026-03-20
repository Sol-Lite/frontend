import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  user: null,           // { userId, email, name }
  accessToken: null,
  showLoginModal: false,
  isRestoring: true,    // 앱 초기화 중 상태 복원 여부

  // 로그인 성공 시 호출
  setAuth: ({ accessToken, user, autoLogin }) => {
    const storage = autoLogin ? localStorage : sessionStorage
    storage.setItem('accessToken', accessToken)
    storage.setItem('user', JSON.stringify(user))
    set({ isAuthenticated: true, user, accessToken })
  },

  // 앱 초기화 시 저장된 토큰 복원
  restoreAuth: () => {
    const accessToken =
      localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken')
    if (accessToken) {
      const userStr = localStorage.getItem('user') ?? sessionStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      set({ isAuthenticated: true, user, accessToken, isRestoring: false })
    } else {
      set({ isRestoring: false })
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('user')
    set({ isAuthenticated: false, user: null, accessToken: null })
  },

  openLoginModal: () => {
    set({ showLoginModal: true })
  },

  closeLoginModal: () => {
    set({ showLoginModal: false })
  },
}))

export default useAuthStore
