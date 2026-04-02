import useEditModeStore from '@/store/useEditModeStore'
import useRightPanelStore from '@/store/useRightPanelStore'
import EditPanel from './EditPanel'
import ChatPanel from './ChatPanel'
import AccountSettingsPanel from './AccountSettingsPanel'
import NotificationSettingsPanel from './NotificationSettingsPanel'
import { markWidgetDetailOutsideInteractionIgnored } from '@/lib/widgetDetailDismissGuard'

export default function RightPanel() {
  const { isEditMode } = useEditModeStore()
  const mode = useRightPanelStore((s) => s.mode)

  if (isEditMode) return <EditPanel />

  return (
    <aside
      data-chat-panel-root
      onPointerDownCapture={markWidgetDetailOutsideInteractionIgnored}
      onFocusCapture={markWidgetDetailOutsideInteractionIgnored}
      className="w-chat-panel flex flex-col bg-surface border-l border-stroke shrink-0"
    >
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
