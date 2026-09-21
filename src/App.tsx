// src/App.tsx
import React from 'react';
import { CustomerPortal } from './CustomerPortal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

function App() {
  return (
    <>
      <CustomerPortal />
      <PWAInstallPrompt />
    </>
  );
}

export default App;
