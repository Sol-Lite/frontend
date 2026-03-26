import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import useAuthStore from '@/store/useAuthStore'

function get(path) {
    return fetchWithAuth(path)
}

function post(path, body) {
    return fetchWithAuth(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

function del(path) {
    return fetchWithAuth(path, { method: 'DELETE' })
}

function patch(path, body) {
    return fetchWithAuth(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

export const watchlistApi = {
    getWatchlist: () => get('/api/watchlist'),
    addToWatchlist: (stockCode) => post('/api/watchlist', { stockCode }),
    removeFromWatchlist: (stockCode) => del(`/api/watchlist/${stockCode}`),
    updateOrder: (stockCodes) => patch('/api/watchlist/order', { stockCodes }),
}

export function useWatchlist({ enabled = true } = {}) {
    return useQuery({
        queryKey: ['watchlist'],
        queryFn: () => watchlistApi.getWatchlist(),
        enabled,
        staleTime: 1000 * 30,
    })
}

export function useWatchlistToggle() {
    const queryClient = useQueryClient()

    const add = useMutation({
        mutationFn: (stockCode) => watchlistApi.addToWatchlist(stockCode),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
    })

    const remove = useMutation({
        mutationFn: (stockCode) => watchlistApi.removeFromWatchlist(stockCode),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
    })

    return { add, remove }
}

export function useWatchlistSet() {
    const { isAuthenticated } = useAuthStore()
    const { data } = useWatchlist({ enabled: isAuthenticated })
    const { add, remove } = useWatchlistToggle()

    const watchedSet = useMemo(
        () => new Set((data ?? []).map((item) => item.stockCode)),
        [data],
    )

    const toggle = (stockCode) => {
        if (!isAuthenticated) return
        watchedSet.has(stockCode) ? remove.mutate(stockCode) : add.mutate(stockCode)
    }

    return { watchedSet, toggle }
}
