import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#252545',
              color: '#fff',
              borderRadius: '1rem',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '14px',
              fontFamily: 'Inter, system-ui, sans-serif',
              maxWidth: '360px',
            },
            success: {
              iconTheme: { primary: '#5DCAA5', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#F0997B', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
