import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/style.css' // Updated to new TailAdmin styles
import './i18n'; // Import i18n configuration
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
