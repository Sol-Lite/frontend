import { fetchWithAuth } from '@/lib/fetchWithAuth'

const BASE = '/api/dashboards'

export const dashboardApi = {
  getMyDashboard: () => fetchWithAuth(`${BASE}/me`),
  saveMyDashboard: (payload) =>
    fetchWithAuth(`${BASE}/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
}
