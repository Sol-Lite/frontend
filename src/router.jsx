import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import HomePage from '@/pages/HomePage'
import MarketPage from '@/pages/MarketPage'
import InvestPage from '@/pages/InvestPage'
import AssetPage from '@/pages/AssetPage'
import SignupPage from '@/pages/auth/SignupPage'
import EmailVerifyPage from '@/pages/auth/EmailVerifyPage'
import PasswordResetPage from '@/pages/auth/PasswordResetPage'
import PinResetPage from '@/pages/auth/PinResetPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true,        element: <HomePage /> },
      { path: 'market',     element: <MarketPage /> },
      { path: 'invest',     element: <InvestPage /> },
      { path: 'invest/:stockCode', element: <InvestPage /> },
      { path: 'asset',      element: <AssetPage /> },
      { path: 'password/reset', element: <PasswordResetPage /> },
      { path: 'account/pin/reset', element: <PinResetPage /> },
    ],
  },
  { path: '/signup',            element: <SignupPage /> },
  { path: '/email/verify',      element: <EmailVerifyPage /> },
  { path: '/forgot-password',   element: <Navigate to="/" replace state={{ openAuthModal: 'forgot' }} /> },
])
