import { fetchWithAuth } from '@/lib/fetchWithAuth'

export const chatApi = {
  sendMessage: (message) =>
    fetchWithAuth('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }),
}
