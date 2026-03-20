import { create } from 'zustand'

const useChatPanelStore = create((set) => ({
  mode: 'chat', // 'chat' | 'account-settings'

  setChatMode: () => set({ mode: 'chat' }),
  setAccountSettingsMode: () => set({ mode: 'account-settings' }),
}))

export default useChatPanelStore
