import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// 첫 렌더 전 localStorage 값을 HTML 속성에 반영 (FOUC 방지)
document.documentElement.dataset.fontSize = localStorage.getItem('ui:fontSize') ?? 'md'
document.documentElement.dataset.theme    = localStorage.getItem('ui:theme')    ?? 'light'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
