import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './index.css'

// Registra o service worker quando o app é servido de um host remoto (PWA no
// navegador OU app Capacitor carregando via server.url). Em modo offline isso
// mantém o shell em cache. Pulamos quando os assets já são locais (localhost).
const isRemoteHost = location.protocol === 'https:' && location.hostname !== 'localhost';
if (isRemoteHost && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
