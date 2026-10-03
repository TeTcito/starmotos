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
import { useSystemScheduleLock, calculateLockStatus } from './utils/systemScheduleLock';
import { SystemNightLockScreen } from './components/common/SystemNightLockScreen';

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

    // Sincronización inicial única al cargar la aplicación (el resto se gestiona en tiempo real por WebSockets sin gastar ancho de banda)
    syncAllFromSupabase();
  }, []);

  const [role, setRole] = useState<UserRole>(detectInitialRole);
  const [loginActiveRole, setLoginActiveRole] = useState<UserRole>(detectInitialRole);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const current = detectInitialRole();
    const lockStatus = calculateLockStatus();
    // Si el sistema está en horario de bloqueo nocturno y el rol no es admin, cerrar sesión automáticamente
    if (lockStatus.isLocked && current !== 'admin') {
      localStorage.removeItem(`starmotos_auth_${current}`);
      if (localStorage.getItem('starmotos_role') === current) {
        localStorage.removeItem('starmotos_auth');
        localStorage.removeItem('starmotos_role');
      }
      return false;
    }
    return (
      localStorage.getItem(`starmotos_auth_${current}`) === 'true' ||
      (localStorage.getItem('starmotos_auth') === 'true' && localStorage.getItem('starmotos_role') === current)
    );
  });

  // Sincronizar estado de rol y autenticación al cambiar URL o navegar entre portales
  useEffect(() => {
    const handleUrlChange = () => {
      const detected = detectInitialRole();
      setRole(detected);
      setLoginActiveRole(detected);
      const lockStatus = calculateLockStatus();
      if (lockStatus.isLocked && detected !== 'admin') {
        localStorage.removeItem(`starmotos_auth_${detected}`);
        setIsAuthenticated(false);
        return;
      }
      const isAuth =
        localStorage.getItem(`starmotos_auth_${detected}`) === 'true' ||
        (localStorage.getItem('starmotos_auth') === 'true' && localStorage.getItem('starmotos_role') === detected);
      setIsAuthenticated(isAuth);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Si la página se abre con query params (?portal=admin), normalizar la URL a la ruta canónica (/admin/, /taller/, etc.)
  // para que coincida exactamente con el scope de la PWA de Android/iOS y no intercepte otros enlaces.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const currentRole = detectInitialRole();
      const rolePaths: Record<UserRole, string> = {
        admin: '/admin/',
        taller: '/taller/',
        garante: '/garantia/',
        cliente: '/cliente/',
        gps: '/gps/',
      };
      const canonicalPath = rolePaths[currentRole];
      if (canonicalPath && path === '/' && window.location.search) {
        try {
          window.history.replaceState(null, '', `${canonicalPath}${window.location.hash}`);
        } catch (_) {}
      }
    }
  }, []);

  const handleLogout = () => {
    const rolePaths: Record<UserRole, string> = {
      admin: '/admin/',
      taller: '/taller/',
      garante: '/garantia/',
      cliente: '/cliente/',
      gps: '/gps/',
    };
    const logoutPath = rolePaths[role] || '/cliente/';
    setIsAuthenticated(false);
    localStorage.removeItem(`starmotos_auth_${role}`);

    // Si ya no queda ninguna sesión activa de otros roles, limpiar variables globales
    const anyOtherActive = ['admin', 'taller', 'garante', 'cliente', 'gps'].some(
      (r) => r !== role && localStorage.getItem(`starmotos_auth_${r}`) === 'true'
    );
    if (!anyOtherActive) {
      localStorage.removeItem('starmotos_auth');
      localStorage.removeItem('starmotos_role');
    }

    localStorage.setItem('starmotos_preferred_login_role', role);
    setLoginActiveRole(role);
    try {
      window.history.pushState(null, '', logoutPath);
    } catch (_) {}
    window.location.hash = '';
  };

  const activeAppRole = isAuthenticated ? role : loginActiveRole;
  const scheduleLock = useSystemScheduleLock();

  // Si el sistema entra en bloqueo (automático a las 10:00 PM o manual) y hay una sesión abierta de rol no admin: cerrar sesión inmediatamente
  useEffect(() => {
    if (scheduleLock.isLocked && isAuthenticated && role !== 'admin') {
      try {
        sessionStorage.setItem('starmotos_night_lock_kicked', 'true');
      } catch (_) {}
      handleLogout();
    }
  }, [scheduleLock.isLocked, isAuthenticated, role]);

  const handleLogin = (selectedRole: UserRole) => {
    // Si el sistema está bloqueado y no es admin, impedir inicio de sesión
    if (scheduleLock.isLocked && selectedRole !== 'admin') {
      alert('Acceso cerrado: Las sedes y demás roles se encuentran bloqueados por horario nocturno (10:00 PM a 07:00 AM). Solo la administración central puede ingresar.');
      return;
    }

    setRole(selectedRole);
    setLoginActiveRole(selectedRole);
    setIsAuthenticated(true);
    localStorage.setItem(`starmotos_auth_${selectedRole}`, 'true');
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

  return (
    <>
      {!isAuthenticated || (scheduleLock.isLocked && role !== 'admin') ? (
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
