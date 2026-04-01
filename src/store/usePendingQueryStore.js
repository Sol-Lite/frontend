import { create } from 'zustand'

const usePendingQueryStore = create((set, get) => ({
  pendingQuery: null,
  setPendingQuery: (text) => set({ pendingQuery: text }),
  consumePendingQuery: () => {
    const value = get().pendingQuery
    set({ pendingQuery: null })
    return value
  },
}))

export default usePendingQueryStore
