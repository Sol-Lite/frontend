import useAuthStore from '@/store/useAuthStore'

const BASE = '/api/auth'

async function post(path, body, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // 로그인/회원가입 제외 - accessToken 필요
  if (!path.includes('/login') && !path.includes('/signup') && !path.includes('/email/verify') && !path.includes('/password/reset') && !path.includes('/token/refresh')) {
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
  }

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    credentials: 'include',
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

async function get(path, params, options = {}) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  const headers = { ...options.headers }

  // accessToken 필요한 경우
  if (!path.includes('/email/verify/status')) {
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
  }

  const res = await fetch(`${BASE}${path}${query}`, {
    headers,
    credentials: 'include',
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

export const authApi = {
  signup:               (body)   => post('/signup', body),
  login:                (body)   => post('/login', body),
  sendVerifyEmail:      (body)   => post('/email/verify/send', body),
  confirmVerifyEmail:   (body)   => post('/email/verify/confirm', body),
  getEmailVerifyStatus: (email)  => get('/email/verify/status', { email }),
  refreshToken:         ()       => post('/token/refresh', {}),
  requestPasswordReset: (body)   => post('/password/reset/request', body),
  confirmPasswordReset: (body)   => post('/password/reset/confirm', body),
  logout:               ()       => post('/logout', {}),
}
