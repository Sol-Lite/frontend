import { fetchWithAuth } from '@/lib/fetchWithAuth'

export const chatApi = {
  sendMessage: (message, stockCode = null, stockName = null) =>
    fetchWithAuth('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        ...(stockCode ? { stock_code_hint: stockCode } : {}),
        ...(stockName ? { stock_name_hint: stockName } : {}),
      }),
    }),
}
