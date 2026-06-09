import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppErrorBoundary from './components/AppErrorBoundary'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary
      fallbackState={{
        message: 'SoulSync could not finish booting. Please reload the app and try again.',
        statusCode: 500,
        title: 'SoulSync Failed To Start',
      }}
    >
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
