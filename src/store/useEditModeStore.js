import { create } from 'zustand'

// CSS --animate-wiggle duration과 동일하게 유지
export const WIGGLE_DURATION_MS = 900

const useEditModeStore = create((set) => ({
  isEditMode: false,

  // 편집 모드 진입 시 계산 — 모든 위젯이 동일 위상(phase)으로 시작하도록 동기화
  wiggleDelay: 0,

  enterEditMode: () =>
    set({
      isEditMode: true,
      wiggleDelay: -(performance.now() % WIGGLE_DURATION_MS),
    }),
  exitEditMode: () => set({ isEditMode: false }),
  saveLayout: () => set({ isEditMode: false }),
}))

export default useEditModeStore
