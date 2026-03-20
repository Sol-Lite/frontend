import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'

const BASE = '/api/accounts'

async function get(path, options = {}) {
  const { headers: optionHeaders, ...restOptions } = options
  const headers = { ...optionHeaders }

  const accessToken = useAuthStore.getState().accessToken
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(`${BASE}${path}`, {
    headers,
    credentials: 'include',
    ...restOptions,
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

export const accountApi = {
  getMyAccount: () => get('/me'),
}

// React Query Hook
export const useMyAccount = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['account', 'me'],
    queryFn: () => accountApi.getMyAccount(),
    enabled: isAuthenticated, // 인증되었을 때만 호출
    staleTime: 1000 * 60 * 10, // 10분
  })
}
