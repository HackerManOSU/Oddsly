/* ++++++++++ IMPORTS ++++++++++ */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/* ++++++++++ AUTHORIZATION ++++++++++ */
import { AuthProvider } from './authorization/AuthContext.tsx'

/* ++++++++++ ALL CONTENT ++++++++++ */
import App from './App.tsx'

/* ++++++++++ STYLES ++++++++++ */
import './index.css'
createRoot(document.getElementById('root')!).render(
  <StrictMode>

    <AuthProvider>
      <App />
    </AuthProvider>
    
  </StrictMode>,
)

