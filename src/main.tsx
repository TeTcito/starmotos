import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { cleanCorruptedMediaFromLocalStorage } from './services/mediaStorage'

// Limpiar proactivamente cualquier base64 corrupto en localStorage al arrancar
cleanCorruptedMediaFromLocalStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW error:', err);
    });
  });
}

