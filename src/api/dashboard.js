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
  deletePage: (pageId) =>
    fetchWithAuth(`${BASE}/${pageId}`, {
      method: 'DELETE',
    }),
  applyPreset: (payload) =>
    fetchWithAuth(`${BASE}/presets/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
}
