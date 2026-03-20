import { create } from 'zustand'

const useCurrencyStore = create((set) => ({
  rates: {},  // { USD: { rate, change, drate, offer, bid }, ... }

  setRate: (code, data) => set((state) => ({
    rates: { ...state.rates, [code]: data },
  })),
}))

export default useCurrencyStore
