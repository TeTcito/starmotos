// src/components/LoginView.tsx
import React, { useState, useEffect } from 'react';
import { Shield, Bike, Wrench, Tag } from 'lucide-react';
import { UserRole } from '../types/customer';
import { AdminLoginView } from './login/AdminLoginView';
import { CustomerLoginView } from './login/CustomerLoginView';
import { TallerLoginView } from './login/TallerLoginView';
import { GaranteLoginView } from './login/GaranteLoginView';
import { OFFICIAL_CORPORATE_ACCOUNTS, CorporateAccount } from '../data/authAccounts';

export { OFFICIAL_CORPORATE_ACCOUNTS };
export type { CorporateAccount };

interface Props {
  onLoginSuccess: (role: UserRole) => void;
}

function detectRoleFromUrl(): UserRole {
  if (typeof window === 'undefined') return 'cliente';

  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  // 1. Detección por Pathname directo
  if (path.includes('/admin')) return 'admin';
  if (path.includes('/taller')) return 'taller';
  if (path.includes('/marca') || path.includes('/garante') || path.includes('/garantia')) return 'garante';
  if (path.includes('/cliente')) return 'cliente';

  // 2. Detección por Hash (#/admin, #admin, etc.)
  if (hash.includes('admin')) return 'admin';
  if (hash.includes('taller')) return 'taller';
  if (hash.includes('marca') || hash.includes('garante') || hash.includes('garantia')) return 'garante';
  if (hash.includes('cliente')) return 'cliente';

  // 3. Detección por Query Params (?portal=admin o ?role=admin)
  if (search.includes('portal=admin') || search.includes('role=admin')) return 'admin';
  if (search.includes('portal=taller') || search.includes('role=taller')) return 'taller';
  if (search.includes('portal=marca') || search.includes('portal=garante') || search.includes('portal=garantia') || search.includes('role=garante')) return 'garante';
  if (search.includes('portal=cliente') || search.includes('role=cliente')) return 'cliente';

  // 4. Último rol recordado si está en la raíz
  const savedRole = localStorage.getItem('starmotos_preferred_login_role') as UserRole;
  if (savedRole && ['admin', 'cliente', 'taller', 'garante'].includes(savedRole)) {
    return savedRole;
  }

  return 'cliente';
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [activeRole, setActiveRole] = useState<UserRole>(detectRoleFromUrl);

  useEffect(() => {
    const handleUrlChange = () => {
      setActiveRole(detectRoleFromUrl());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  return (
    <div className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full bg-white flex flex-col lg:flex-row overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* ========================================================================= */}
      {/* LADO IZQUIERDO (2/3 DEL ANCHO): IMAGEN HERO A PANTALLA COMPLETA (DESKTOP)  */}
      {/* ========================================================================= */}
      <div className="hidden lg:block relative lg:w-2/3 h-full min-h-screen overflow-hidden shrink-0 bg-zinc-950 select-none">
        <img
          src="/login-motorcycle-cliff.jpg"
          alt="StarMotos Aventura y Precisión en Ruta"
          className="w-full h-full min-h-screen object-cover transition-transform duration-1000 ease-out hover:scale-105"
          style={{ objectPosition: '72% 50%' }}
        />

        {/* Gradiente cinematográfico inferior para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

        {/* Texto "Bienvenido" elegante sobre la imagen */}
        <div className="absolute bottom-6 left-6 sm:bottom-12 sm:left-12 z-10 select-none pointer-events-none max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-white/20 backdrop-blur-md text-white border border-white/30">
              {activeRole === 'admin' && '🛡️ Módulo Matriz Central'}
              {activeRole === 'cliente' && '🏍️ Portal del Propietario'}
              {activeRole === 'taller' && '🔧 Red Oficial de Sedes & Talleres'}
              {activeRole === 'garante' && '🏷️ Garantías Oficiales de Fábrica'}
            </span>
          </div>

          <h2 className="text-3xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
            Bienvenido
          </h2>
          <p className="text-xs sm:text-base text-zinc-100 mt-1.5 sm:mt-2 font-medium leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] max-w-lg">
            {activeRole === 'admin' && 'Panel centralizado de administración, facturación y control de la red StarMotos.'}
            {activeRole === 'cliente' && 'Seguimiento vehicular en vivo, historial de servicios técnicos y citas agendadas.'}
            {activeRole === 'taller' && 'Gestión de órdenes de trabajo, alistamiento PDI, mecánicos e inventario.'}
            {activeRole === 'garante' && 'Auditoría, validación técnica y despacho de repuestos oficiales para marcas asociadas.'}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LADO DERECHO: FORMULARIO INDEPENDIENTE SEGÚN EL ENLACE DEL ROL             */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/3 h-full flex flex-col justify-start sm:justify-center items-center bg-white px-4 py-3 sm:p-6 lg:p-8 overflow-y-auto scroll-smooth pb-44 sm:pb-8">
        {/* LOGO HEADER GLOBAL */}
        <div className="w-full max-w-md text-center pt-2 pb-3 shrink-0">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="p-1 rounded-full bg-gradient-to-tr from-blue-600 via-white to-red-600 shadow-sm">
              <img
                src="/starmotos-logo.jpg"
                alt="Logo StarMotos"
                className="w-8 h-8 rounded-full object-cover bg-white"
              />
            </div>
            <span className="text-xl font-black tracking-wider uppercase">
              <span className="text-blue-600">STAR</span>
              <span className="text-red-600">MOTOS</span>
            </span>
          </div>

          {/* IDENTIFICADOR EXCLUSIVO DEL PORTAL ACCEDIDO */}
          <div className="mt-2 text-center">
            {activeRole === 'admin' && (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200 shadow-xs">
                  <Shield className="w-3.5 h-3.5 text-red-600" />
                  Módulo Matriz Central
                </span>
                <h1 className="text-xl font-black text-zinc-900 tracking-tight mt-1">
                  Portal de Administración
                </h1>
                <p className="text-xs text-zinc-500 font-medium">
                  Acceso exclusivo para Gerencia y Dirección Matriz
                </p>
              </div>
            )}

            {activeRole === 'cliente' && (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 shadow-xs">
                  <Bike className="w-3.5 h-3.5 text-blue-600" />
                  Portal del Propietario
                </span>
                <h1 className="text-xl font-black text-zinc-900 tracking-tight mt-1">
                  Acceso a Clientes StarMotos
                </h1>
                <p className="text-xs text-zinc-500 font-medium">
                  Consulta de mantenimientos, historial y garantías de tu moto
                </p>
              </div>
            )}

            {activeRole === 'taller' && (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 shadow-xs">
                  <Wrench className="w-3.5 h-3.5 text-amber-700" />
                  Red Oficial de Sedes
                </span>
                <h1 className="text-xl font-black text-zinc-900 tracking-tight mt-1">
                  Portal de Jefes de Taller
                </h1>
                <p className="text-xs text-zinc-500 font-medium">
                  Gestión de órdenes de trabajo, alistamiento PDI y perfil de sede
                </p>
              </div>
            )}

            {activeRole === 'garante' && (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200 shadow-xs">
                  <Tag className="w-3.5 h-3.5 text-purple-700" />
                  Garantías de Fábrica
                </span>
                <h1 className="text-xl font-black text-zinc-900 tracking-tight mt-1">
                  Portal Garantías de Marca
                </h1>
                <p className="text-xs text-zinc-500 font-medium">
                  Auditoría, validación técnica y homologación de repuestos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RENDERIZADO EXCLUSIVO E INDEPENDIENTE DEL FORMULARIO */}
        <div className="w-full flex justify-center">
          {activeRole === 'admin' && (
            <AdminLoginView onLoginSuccess={onLoginSuccess} />
          )}

          {activeRole === 'cliente' && (
            <CustomerLoginView onLoginSuccess={onLoginSuccess} />
          )}

          {activeRole === 'taller' && (
            <TallerLoginView onLoginSuccess={onLoginSuccess} />
          )}

          {activeRole === 'garante' && (
            <GaranteLoginView onLoginSuccess={onLoginSuccess} />
          )}
        </div>
      </div>
    </div>
  );
};
