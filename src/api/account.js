import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'

const BASE = '/api/accounts'

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

export const accountApi = {
  getMyAccount: () => request('/me', 'GET'),
  changePin: (currentPin, newPin) => request('/me/pin', 'PATCH', { currentPin, newPin }),
  reset: (accountPin) => request('/reset', 'POST', { accountPin }),
  closeAccount: (accountPin) => request('', 'DELETE', { accountPin }),
}

// React Query Hook
export const useMyAccount = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['account', 'me'],
    queryFn: () => accountApi.getMyAccount(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10,
  })
}
