import { create } from 'zustand'

const STORAGE_KEY = 'ui:fontSize'

const useUIStore = create((set) => ({
  fontSize: localStorage.getItem(STORAGE_KEY) ?? 'md',

  setFontSize: (fontSize) => {
    localStorage.setItem(STORAGE_KEY, fontSize)
    set({ fontSize })
  },
}))

export default useUIStore
