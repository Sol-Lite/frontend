const BASE = '/api/auth'

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

async function get(path, params) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  const res = await fetch(`${BASE}${path}${query}`)
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
  refreshToken:         (body)   => post('/token/refresh', body),
  requestPasswordReset: (body)   => post('/password/reset/request', body),
  confirmPasswordReset: (body)   => post('/password/reset/confirm', body),
  logout:               (body)   => post('/logout', body),
}
