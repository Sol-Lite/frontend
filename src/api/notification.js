import { fetchWithAuth } from '@/lib/fetchWithAuth'

function get(path) {
  return fetchWithAuth(path)
}

function put(path, body) {
  return fetchWithAuth(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function patch(path) {
  return fetchWithAuth(path, { method: 'PATCH' })
}

export const notificationApi = {
  getNotifications:       () => get('/api/notifications'),
  getUnreadCount:         () => get('/api/notifications/unread-count'),
  markAsRead:     (id)    => patch(`/api/notifications/${id}/read`),
  markAllAsRead:          () => patch('/api/notifications/read-all'),
  getSettings:            () => get('/api/notifications/settings'),
  updateSettings: (body)  => put('/api/notifications/settings', body),
}
