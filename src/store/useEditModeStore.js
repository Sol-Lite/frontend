import { create } from 'zustand'

// CSS --animate-wiggle duration과 동일하게 유지
export const WIGGLE_DURATION_MS = 1100

const useEditModeStore = create((set) => ({
  isEditMode: false,
  widgetDragLockCount: 0,

  // 편집 모드 진입 시 계산 — 모든 위젯이 동일 위상(phase)으로 시작하도록 동기화
  wiggleDelay: 0,
  // drop 시점마다 증가 → WidgetCard의 animation wrapper remount → 위상 재동기화
  wiggleSyncKey: 0,

  enterEditMode: () =>
    set({
      isEditMode: true,
      wiggleDelay: -(performance.now() % WIGGLE_DURATION_MS),
      wiggleSyncKey: 0,
    }),
  exitEditMode: () => set({ isEditMode: false }),
  saveLayout: () => set({ isEditMode: false }),

  // drop/cancel 시 호출 — wiggleDelay 재계산 + wiggleSyncKey 증가로 전체 재동기화
  resyncWiggle: () =>
    set((state) => ({
      wiggleDelay: -(performance.now() % WIGGLE_DURATION_MS),
      wiggleSyncKey: state.wiggleSyncKey + 1,
    })),

  lockWidgetDrag: () =>
    set((state) => ({ widgetDragLockCount: state.widgetDragLockCount + 1 })),

  unlockWidgetDrag: () =>
    set((state) => ({ widgetDragLockCount: Math.max(0, state.widgetDragLockCount - 1) })),
}))

export default useEditModeStore
