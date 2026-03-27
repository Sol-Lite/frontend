import { create } from 'zustand'

const useWidgetDetailStore = create((set) => ({
  openWidget: null, // { widgetTypeId, config }
  open:  (widget) => set({ openWidget: widget }),
  close: ()       => set({ openWidget: null }),
}))

export default useWidgetDetailStore
