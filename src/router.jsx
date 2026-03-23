import { createBrowserRouter } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import HomePage from '@/pages/HomePage'
import MarketPage from '@/pages/MarketPage'
import InvestPage from '@/pages/InvestPage'
import AssetPage from '@/pages/AssetPage'
import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import EmailVerifyPage from '@/pages/auth/EmailVerifyPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import PasswordResetPage from '@/pages/auth/PasswordResetPage'

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
    ],
  },
  { path: '/login',             element: <LoginPage /> },
  { path: '/signup',            element: <SignupPage /> },
  { path: '/email/verify',      element: <EmailVerifyPage /> },
  { path: '/forgot-password',   element: <ForgotPasswordPage /> },
  { path: '/password/reset',    element: <PasswordResetPage /> },
])
