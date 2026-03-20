import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import useAuthStore from '@/store/useAuthStore'
import LoginModal from '@/components/auth/LoginModal'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
})

export default function App() {
  const showLoginModal = useAuthStore((s) => s.showLoginModal)
  const closeLoginModal = useAuthStore((s) => s.closeLoginModal)
  const isRestoring = useAuthStore((s) => s.isRestoring)

  useEffect(() => {
    useAuthStore.getState().restoreAuth()
  }, [])

  if (isRestoring) return null

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {showLoginModal && <LoginModal onClose={closeLoginModal} />}
    </QueryClientProvider>
  )
}
