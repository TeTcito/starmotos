// src/App.tsx
import React, { useState, useEffect } from 'react';
import { UserRole } from './types/customer';
import { LoginView } from './components/LoginView';
import { CustomerPortal } from './CustomerPortal';
import { AdminPortal } from './AdminPortal';
import { TallerPortal } from './TallerPortal';
import { GarantePortal } from './GarantePortal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { initSupabaseRealtime } from './services/supabaseService';
import { initMobileKeyboardHelper } from './utils/mobileKeyboardHelper';

function App() {
  // Inicializar sincronización en tiempo real con Supabase y asistente de teclado móvil
  useEffect(() => {
    initSupabaseRealtime();
    initMobileKeyboardHelper();
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('starmotos_auth') === 'true';
  });

  const [role, setRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('starmotos_role') as UserRole;
    return savedRole || 'cliente';
  });

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setIsAuthenticated(true);
    localStorage.setItem('starmotos_role', selectedRole);
    localStorage.setItem('starmotos_auth', 'true');

    // Limpiar hash o redirigir según el rol para evitar colisiones de rutas previas
    if (selectedRole === 'admin') {
      window.location.hash = '#talleres';
    } else if (selectedRole === 'taller') {
      window.location.hash = '#perfil_taller';
    } else if (selectedRole === 'garante') {
      window.location.hash = '#solicitudes_garante';
    } else {
      window.location.hash = '#eventos';
    }
  };

  const handleLogout = () => {
    const logoutRole = role === 'garante' ? 'garantia' : role;
    setIsAuthenticated(false);
    localStorage.removeItem('starmotos_auth');
    localStorage.removeItem('starmotos_role');
    localStorage.setItem('starmotos_preferred_login_role', role);
    try {
      window.history.pushState(null, '', `/login/${logoutRole}`);
    } catch (_) {}
    window.location.hash = '';
  };

  return (
    <>
      {!isAuthenticated ? (
        <LoginView onLoginSuccess={handleLogin} />
      ) : (
        <>
          {role === 'admin' && <AdminPortal onLogout={handleLogout} />}
          {role === 'taller' && <TallerPortal onLogout={handleLogout} />}
          {role === 'garante' && <GarantePortal onLogout={handleLogout} />}
          {role === 'cliente' && <CustomerPortal onLogout={handleLogout} />}
        </>
      )}

      {/* PWA Install Prompt (solo móviles) */}
      <PWAInstallPrompt />
    </>
  );
}

export default App;
