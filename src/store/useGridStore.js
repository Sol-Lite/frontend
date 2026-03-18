import { create } from 'zustand'

const useGridStore = create((set) => ({
  cellWidth: 0,
  cellHeight: 0,
  gap: 10,
  setCellSize: (cellWidth, cellHeight) => set({ cellWidth, cellHeight }),
}))

export default useGridStore
