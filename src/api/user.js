import { fetchWithAuth } from '@/lib/fetchWithAuth'

const BASE = '/api/users'

function request(path, method = 'GET', body = null) {
  const headers = {}
  if (method !== 'GET' && body) headers['Content-Type'] = 'application/json'
  return fetchWithAuth(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

export const userApi = {
  getProfile: () => request('/me', 'GET'),
  updateProfile: (name, phone) => request('/me', 'PATCH', { name, phone }),
  changePassword: (currentPassword, newPassword) =>
    request('/me/password', 'PATCH', { currentPassword, newPassword, newPasswordConfirm: newPassword }),
}
