import { create } from 'zustand'

const usePendingQueryStore = create((set, get) => ({
  pendingQuery: null,   // { text: string, stockCode: string | null, stockName: string | null }
  setPendingQuery: (text, stockCode = null, stockName = null) => set({ pendingQuery: { text, stockCode, stockName } }),
  consumePendingQuery: () => {
    const value = get().pendingQuery
    set({ pendingQuery: null })
    return value
  },
}))

export default usePendingQueryStore
