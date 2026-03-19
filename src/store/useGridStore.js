import { create } from 'zustand'

const useGridStore = create((set) => ({
  cellWidth: 0,
  cellHeight: 0,
  setCellSize: (cellWidth, cellHeight) => set({ cellWidth, cellHeight }),

  // EditPanel 미리보기용 — edit mode 진입 전 마지막 full-grid 셀 크기
  // 창 최대화 상태를 기준으로 올바른 위젯 비율을 제공
  previewCellWidth: 0,
  previewCellHeight: 0,
  setPreviewCellSize: (previewCellWidth, previewCellHeight) =>
    set({ previewCellWidth, previewCellHeight }),
}))

export default useGridStore
