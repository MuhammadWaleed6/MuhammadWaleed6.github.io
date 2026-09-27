import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// PrimeReact base theme + icons (overridden by our design system tokens)
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'

import './styles/main.css'
import './styles/portfolio.css'
import './styles/admin.css'

import App from './App'
import { AuthProvider } from './hooks/useAuth'
import { SiteSettingsProvider } from './hooks/useSiteSettings'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SiteSettingsProvider>
          <App />
        </SiteSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
