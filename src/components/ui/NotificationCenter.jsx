import { useEffect, useRef } from 'react'
import { Bell, Settings2, CheckCheck, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/useAuthStore'
import useNotificationStore from '@/store/useNotificationStore'
import useStompSubscription from '@/hooks/useStompSubscription'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}시간 전`
  return `${Math.floor(diffH / 24)}일 전`
}

function NotificationItem({ notification, onClose }) {
  const navigate = useNavigate()
  const markAsRead = useNotificationStore((s) => s.markAsRead)

  function handleClick() {
    if (!notification.read) {
      markAsRead(notification.notificationId)
    }
    if (notification.notificationType === 'PRICE_ALERT' && notification.referenceId) {
      navigate(`/invest/${notification.referenceId}`)
      onClose()
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 hover:bg-surface-muted transition-colors border-b border-stroke-subtle last:border-0 ${!notification.read ? 'bg-primary-light/50' : ''}`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${!notification.read ? 'bg-primary' : 'bg-transparent'}`}
        />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground leading-snug truncate">
            {notification.title}
          </p>
          <p className="text-[12px] text-foreground-secondary mt-0.5 leading-snug">
            {notification.message}
          </p>
          <p className="text-[11px] text-foreground-disabled mt-1">
            {timeAgo(notification.createdAt)}
          </p>
        </div>
      </div>
    </button>
  )
}

export default function NotificationCenter() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const {
    notifications,
    unreadCount,
    isOpen,
    isLoading,
    setOpen,
    fetchNotifications,
    fetchUnreadCount,
    addNotification,
    markAllAsRead,
    reset,
  } = useNotificationStore()

  const dropdownRef = useRef(null)

  // 실시간 알림 수신 (기존 useStompSubscription 훅 활용)
  const topic = isAuthenticated && user?.userId ? `/topic/notifications/${user.userId}` : null
  const latestNotification = useStompSubscription(topic)

  useEffect(() => {
    if (latestNotification) {
      addNotification(latestNotification)
    }
  }, [latestNotification, addNotification])

  // 로그인 시 미읽은 수 초기 조회, 로그아웃 시 상태 초기화
  useEffect(() => {
    if (isAuthenticated && user?.userId) {
      fetchUnreadCount()
    } else {
      reset()
    }
  }, [isAuthenticated, user?.userId, fetchUnreadCount, reset])

  // 드롭다운 열릴 때 목록 로드
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchNotifications()
    }
  }, [isOpen, isAuthenticated, fetchNotifications])

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, setOpen])

  if (!isAuthenticated) return null

  const badge = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 종 아이콘 버튼 */}
      <button
        onClick={() => setOpen(!isOpen)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-muted transition-colors"
        aria-label="알림센터"
      >
        <Bell className="w-4 h-4 text-foreground-secondary" strokeWidth={2} />
        {badge && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {badge}
          </span>
        )}
      </button>

      {/* 드롭다운 — z-[60]: 헤더(z-50) 위, 모달 아래 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-xl border border-stroke shadow-dropdown z-[60] overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stroke">
            <span className="text-[14px] font-bold text-foreground">알림센터</span>
            <div className="flex items-center gap-0.5">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-foreground-tertiary hover:bg-surface-muted transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" strokeWidth={2} />
                  모두 읽음
                </button>
              )}
              <button
                onClick={() => { setOpen(false); navigate('/notifications/settings') }}
                className="p-1.5 rounded-lg text-foreground-tertiary hover:bg-surface-muted transition-colors"
                aria-label="알림 설정"
              >
                <Settings2 className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-4 h-4 text-foreground-disabled animate-spin" strokeWidth={2} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-foreground-disabled">
                새로운 알림이 없습니다
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.notificationId}
                  notification={n}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
