import { create } from 'zustand'

const useStockDetailStore = create((set) => ({
  selectedStockId: null,
  openStock: (id) => set({ selectedStockId: id }),
  closeStock: () => set({ selectedStockId: null }),
}))

export default useStockDetailStore
