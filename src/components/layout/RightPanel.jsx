import useEditModeStore from '@/store/useEditModeStore'
import useRightPanelStore from '@/store/useRightPanelStore'
import EditPanel from './EditPanel'
import ChatPanel from './ChatPanel'
import AccountSettingsPanel from './AccountSettingsPanel'

export default function RightPanel() {
  const { isEditMode } = useEditModeStore()
  const mode = useRightPanelStore((s) => s.mode)

  if (isEditMode) return <EditPanel />

  return (
    <aside className="w-chat-panel flex flex-col bg-surface border-l border-stroke shrink-0">
      {mode === 'account-settings' ? (
        <AccountSettingsPanel />
      ) : (
        <ChatPanel />
      )}
    </aside>
  )
}
