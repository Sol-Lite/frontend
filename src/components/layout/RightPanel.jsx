import { cn } from '@/lib/cn'
import useEditModeStore from '@/store/useEditModeStore'
import useRightPanelStore from '@/store/useRightPanelStore'
import EditPanel from './EditPanel'
import ChatPanel from './ChatPanel'
import AccountSettingsPanel from './AccountSettingsPanel'
import NotificationSettingsPanel from './NotificationSettingsPanel'

export default function RightPanel({ isCompact = false }) {
  const { isEditMode } = useEditModeStore()
  const mode = useRightPanelStore((s) => s.mode)

  if (isEditMode) return <EditPanel />

  return (
    <aside className={cn(
      'flex flex-col bg-surface border-stroke shrink-0',
      isCompact ? 'flex-1 border-t' : 'w-chat-panel border-l',
    )}>
      {mode === 'account-settings' ? (
        <AccountSettingsPanel />
      ) : mode === 'notification-settings' ? (
        <NotificationSettingsPanel />
      ) : (
        <ChatPanel />
      )}
    </aside>
  )
}
