import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { queryClient } from '@/lib/queryClient'
import useAuthStore from '@/store/useAuthStore'
import LoginModal from '@/components/auth/LoginModal'

export default function App() {
  const showLoginModal = useAuthStore((s) => s.showLoginModal)
  const closeLoginModal = useAuthStore((s) => s.closeLoginModal)
  const isRestoring = useAuthStore((s) => s.isRestoring)

  useEffect(() => {
    useAuthStore.getState().restoreAuth()
  }, [])

  useEffect(() => {
    return router.subscribe(() => {
      useAuthStore.getState().closeLoginModal()
    })
  }, [])

  if (isRestoring) return null

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {showLoginModal && <LoginModal onClose={closeLoginModal} />}
    </QueryClientProvider>
  )
}
