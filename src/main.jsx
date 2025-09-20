import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import './i18n.js'

const savedTheme = (() => {
  try { return localStorage.getItem('theme') } catch { return null }
})()
if (savedTheme) {
  const html = document.documentElement
  html.setAttribute('data-theme', savedTheme)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
