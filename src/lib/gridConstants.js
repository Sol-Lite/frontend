export const GRID_COLS = 6
export const GRID_ROWS = 4
export const GRID_GAP = 10

// 위젯 내부 콘텐츠가 overflow 나지 않는 최소 셀 크기
export const MIN_CELL_WIDTH = 140
export const MIN_CELL_HEIGHT = 130

export const MIN_GRID_WIDTH = MIN_CELL_WIDTH * GRID_COLS + GRID_GAP * (GRID_COLS - 1)
export const MIN_GRID_HEIGHT = MIN_CELL_HEIGHT * GRID_ROWS + GRID_GAP * (GRID_ROWS - 1)
