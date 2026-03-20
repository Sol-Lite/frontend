import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

const BASE = '/api/accounts'

function request(path, method = 'GET', body = null) {
  const headers = {}
  if (method !== 'GET' && body) headers['Content-Type'] = 'application/json'
  return fetchWithAuth(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
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
