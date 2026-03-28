import { create } from 'zustand'

const useWidgetDetailStore = create((set, get) => ({
  openWidget: null,  // { widgetTypeId, config }
  history:    [],    // 이전 위젯 스택
  isBack:     false, // back() 호출 여부 — 애니메이션 스킵용

  open: (widget) => set((s) => ({
    history:    s.openWidget ? [...s.history, s.openWidget] : s.history,
    openWidget: widget,
    isBack:     false,
  })),

  back: () => set((s) => {
    const prev = s.history[s.history.length - 1]
    return {
      history:    s.history.slice(0, -1),
      openWidget: prev ?? null,
      isBack:     true,
    }
  }),

  close: () => set({ openWidget: null, history: [], isBack: false }),

  canGoBack: () => get().history.length > 0,
}))

export default useWidgetDetailStore
