// src/App.tsx
import React, { useState, useEffect } from 'react';
import { UserRole } from './types/customer';
import { LoginView } from './components/LoginView';
import { CustomerPortal } from './CustomerPortal';
import { AdminPortal } from './AdminPortal';
import { TallerPortal } from './TallerPortal';
import { GarantePortal } from './GarantePortal';
import { GpsPortal } from './GpsPortal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { initSupabaseRealtime, syncAllFromSupabase } from './services/supabaseService';
import { initMobileKeyboardHelper } from './utils/mobileKeyboardHelper';

function detectInitialRole(): UserRole {
  if (typeof window === 'undefined') return 'cliente';
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase();

  if (search.includes('portal=admin') || search.includes('role=admin') || hash.includes('admin') || path.includes('/admin')) return 'admin';
  if (search.includes('portal=taller') || search.includes('role=taller') || hash.includes('taller') || path.includes('/taller')) return 'taller';
  if (
    search.includes('portal=marca') ||
    search.includes('portal=garante') ||
    search.includes('portal=garantia') ||
    search.includes('role=garante') ||
    hash.includes('garante') ||
    hash.includes('garantia') ||
    path.includes('/garantia') ||
    path.includes('/marca')
  ) {
    return 'garante';
  }
  if (search.includes('portal=gps') || search.includes('role=gps') || hash.includes('gps') || path.includes('/gps')) return 'gps';
  if (search.includes('portal=cliente') || search.includes('role=cliente') || hash.includes('cliente') || path.includes('/cliente')) return 'cliente';

  const savedRole = localStorage.getItem('starmotos_role') as UserRole;
  if (savedRole && ['admin', 'taller', 'garante', 'cliente', 'gps'].includes(savedRole)) return savedRole;
  const prefRole = localStorage.getItem('starmotos_preferred_login_role') as UserRole;
  if (prefRole && ['admin', 'taller', 'garante', 'cliente', 'gps'].includes(prefRole)) return prefRole;
  return 'cliente';
}

function App() {
  // Inicializar sincronización en tiempo real con Supabase y asistente de teclado móvil
  useEffect(() => {
    initSupabaseRealtime();
    initMobileKeyboardHelper();

    // Sincronización periódica de respaldo cada 45s para toda la red de sedes
    const syncInterval = setInterval(() => {
      syncAllFromSupabase();
    }, 45000);

    return () => clearInterval(syncInterval);
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('starmotos_auth') === 'true';
  });

  const [role, setRole] = useState<UserRole>(detectInitialRole);
  const [loginActiveRole, setLoginActiveRole] = useState<UserRole>(detectInitialRole);

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setLoginActiveRole(selectedRole);
    setIsAuthenticated(true);
    localStorage.setItem('starmotos_role', selectedRole);
    localStorage.setItem('starmotos_auth', 'true');

    // Sincronizar inmediatamente al iniciar sesión para cargar todos los datos de las sedes
    syncAllFromSupabase();

    // Limpiar hash o redirigir según el rol para evitar colisiones de rutas previas
    if (selectedRole === 'admin') {
      window.location.hash = '#talleres';
    } else if (selectedRole === 'taller') {
      window.location.hash = '#perfil_taller';
    } else if (selectedRole === 'garante') {
      window.location.hash = '#solicitudes_garante';
    } else if (selectedRole === 'gps') {
      window.location.hash = '#solicitudes_gps';
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
    setLoginActiveRole(role);
    try {
      window.history.pushState(null, '', `/?portal=${logoutRole}`);
    } catch (_) {}
    window.location.hash = '';
  };

  const activeAppRole = isAuthenticated ? role : loginActiveRole;

  return (
    <>
      {!isAuthenticated ? (
        <LoginView
          onLoginSuccess={handleLogin}
          onRoleActiveChange={setLoginActiveRole}
        />
      ) : (
        <>
          {role === 'admin' && <AdminPortal onLogout={handleLogout} />}
          {role === 'taller' && <TallerPortal onLogout={handleLogout} />}
          {role === 'garante' && <GarantePortal onLogout={handleLogout} />}
          {role === 'gps' && <GpsPortal onLogout={handleLogout} />}
          {role === 'cliente' && <CustomerPortal onLogout={handleLogout} />}
        </>
      )}

      {/* PWA Install Prompt — Adaptado a cada rol (Admin, Taller, Garante, Cliente) */}
      <PWAInstallPrompt currentRole={activeAppRole} />
    </>
  );
}

export default App;
