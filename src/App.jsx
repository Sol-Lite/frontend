import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import useAuthStore from '@/store/useAuthStore'

export default function App() {
  useEffect(() => {
    useAuthStore.getState().restoreAuth()
  }, [])

  return <RouterProvider router={router} />
}
