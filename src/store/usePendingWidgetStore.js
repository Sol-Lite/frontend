import { create } from 'zustand'

const usePendingWidgetStore = create((set) => ({
  pendingMsgId: null,
  widgetTypeId: null,
  variant: null,
  setPending: (msgId, widgetTypeId, variant) =>
    set({ pendingMsgId: msgId, widgetTypeId, variant }),
  clearPending: () =>
    set({ pendingMsgId: null, widgetTypeId: null, variant: null }),
}))

export default usePendingWidgetStore
