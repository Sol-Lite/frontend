import { create } from 'zustand'

const useEditModeStore = create((set) => ({
  isEditMode: false,
  enterEditMode: () => set({ isEditMode: true }),
  exitEditMode: () => set({ isEditMode: false }),
  saveLayout: () => set({ isEditMode: false }),
}))

export default useEditModeStore
