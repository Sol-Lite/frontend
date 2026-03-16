import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import HomePage from './pages/HomePage'
import MarketPage from './pages/MarketPage'
import InvestPage from './pages/InvestPage'
import AssetPage from './pages/AssetPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true,        element: <HomePage /> },
      { path: 'market',     element: <MarketPage /> },
      { path: 'invest',     element: <InvestPage /> },
      { path: 'asset',      element: <AssetPage /> },
    ],
  },
])
