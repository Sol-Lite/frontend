import useCurrencyStore from '@/store/useCurrencyStore'

export default function useCurrencyRate(code) {
  return useCurrencyStore((s) => s.rates[code] ?? null)
}
