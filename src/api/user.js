import useAuthStore from '@/store/useAuthStore'

const BASE = '/api/users'

async function request(path, method = 'GET', body = null, options = {}) {
  const { headers: optionHeaders, ...restOptions } = options
  const headers = { ...optionHeaders }

  const accessToken = useAuthStore.getState().accessToken
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  if (method !== 'GET' && body) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
    ...restOptions,
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

export const userApi = {
  getProfile: () => request('/me', 'GET'),
  changePassword: (currentPassword, newPassword) =>
    request('/me/password', 'PATCH', { currentPassword, newPassword, newPasswordConfirm: newPassword }),
}
