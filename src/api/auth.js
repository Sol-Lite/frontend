import { fetchWithAuth } from '@/lib/fetchWithAuth'

const BASE = '/api/auth'

const NO_AUTH_PATHS = ['/login', '/signup', '/email/verify', '/password/reset', '/token/refresh']

function post(path, body, options = {}) {
  const skipAuth = NO_AUTH_PATHS.some((p) => path.includes(p))
  return fetchWithAuth(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    skipAuth,
    ...options,
  })
}

function get(path, params, options = {}) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  const skipAuth = path.includes('/email/verify/status')
  return fetchWithAuth(`${BASE}${path}${query}`, {
    skipAuth,
    ...options,
  })
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
