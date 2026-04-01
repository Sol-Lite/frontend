import { create } from 'zustand'
import { notificationApi } from '@/api/notification'

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  isLoading: false,

  setOpen: (open) => set({ isOpen: open }),

  reset: () => set({ notifications: [], unreadCount: 0, isOpen: false, isLoading: false }),

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const data = await notificationApi.getNotifications()
      set((state) => {
        // STOMP으로 받은 알림 중 API 응답에 없는 것(아직 DB 미반영)은 보존
        const apiIds = new Set(data.map((n) => n.notificationId))
        const stompOnly = state.notifications.filter((n) => !apiIds.has(n.notificationId))
        return { notifications: [...stompOnly, ...data], isLoading: false }
      })
    } catch (err) {
      console.warn('[Notification] 알림 목록 조회 실패:', err?.message)
      set({ isLoading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await notificationApi.getUnreadCount()
      set({ unreadCount: data.unreadCount ?? 0 })
    } catch (err) {
      console.warn('[Notification] 미읽은 수 조회 실패:', err?.message)
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }))
  },

  markAsRead: (notificationId) => {
    const target = get().notifications.find((n) => n.notificationId === notificationId)
    const wasUnread = target && !target.read
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.notificationId === notificationId ? { ...n, read: true } : n,
      ),
      unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }))
    notificationApi.markAsRead(notificationId).catch((err) => {
      console.warn('[Notification] 읽음 처리 실패:', err?.message)
    })
  },

  deleteNotification: (notificationId) => {
    const target = get().notifications.find((n) => n.notificationId === notificationId)
    const wasUnread = target && !target.read
    set((state) => ({
      notifications: state.notifications.filter((n) => n.notificationId !== notificationId),
      unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }))
    notificationApi.deleteNotification(notificationId).catch((err) => {
      console.warn('[Notification] 삭제 실패:', err?.message)
    })
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead()
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }))
    } catch (err) {
      console.warn('[Notification] 전체 읽음 처리 실패:', err?.message)
    }
  },
}))

export default useNotificationStore
