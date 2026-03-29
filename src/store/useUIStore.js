import { create } from 'zustand'

const STORAGE_KEY_FONT  = 'ui:fontSize'
const STORAGE_KEY_THEME = 'ui:theme'

const useUIStore = create((set) => ({
  fontSize: localStorage.getItem(STORAGE_KEY_FONT)  ?? 'md',
  theme:    localStorage.getItem(STORAGE_KEY_THEME) ?? 'light',

  setFontSize: (fontSize) => {
    localStorage.setItem(STORAGE_KEY_FONT, fontSize)
    document.documentElement.dataset.fontSize = fontSize
    set({ fontSize })
  },

  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY_THEME, theme)
    document.documentElement.dataset.theme = theme
    set({ theme })
  },
}))

export default useUIStore
