// src/components/login/TallerLoginView.tsx
import React, { useState } from 'react';
import {
  Wrench,
  Building2,
  Lock,
  Mail,
  Phone,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Bike,
  Tag,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UserRole, WorkshopManagerAccount } from '../../types/customer';
import {
  getStoredWorkshops,
  getStoredWorkshopManagers,
  saveStoredWorkshopManager,
} from '../../data/mockMultiRoleData';
import { OFFICIAL_CORPORATE_ACCOUNTS } from '../../data/authAccounts';

interface Props {
  onLoginSuccess: (role: UserRole) => void;
}

export const TallerLoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCredentialsGuide, setShowCredentialsGuide] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const workshops = getStoredWorkshops();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Registro sencillo
  const [registerForm, setRegisterForm] = useState({
    name: '',
    workshopId: workshops[0]?.id || 'matriz-la-mana',
    customWorkshopName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanUser = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    if (!cleanUser || !cleanPassword) {
      setErrorMessage('Por favor ingrese su correo electrónico de taller y su contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const customPwd = localStorage.getItem(`starmotos_pwd_${cleanUser}`);

      // 1. Cuentas oficiales de sede/taller
      const corporateAccount = OFFICIAL_CORPORATE_ACCOUNTS[cleanUser];
      if (corporateAccount && corporateAccount.role === 'taller') {
        const isPasswordValid =
          corporateAccount.passwords.includes(cleanPassword) ||
          cleanPassword === customPwd;

        if (!isPasswordValid) {
          setErrorMessage('Contraseña incorrecta para la sede oficial. Verifique su clave.');
          return;
        }

        if (corporateAccount.workshopId) {
          localStorage.setItem('starmotos_taller_active_ws', corporateAccount.workshopId);
        }

        setSuccessMessage('¡Ingreso autorizado de taller! Abriendo perfil y configuración de sede...');
        setTimeout(() => {
          onLoginSuccess('taller');
        }, 400);
        return;
      }

      // 2. Jefes de taller registrados dinámicamente
      const storedManagers = getStoredWorkshopManagers();
      const matchedManager = storedManagers.find(
        (m) => m.email.trim().toLowerCase() === cleanUser
      );

      if (matchedManager) {
        const savedPwd =
          matchedManager.password ||
          localStorage.getItem(`starmotos_mgr_pwd_${cleanUser}`) ||
          customPwd;

        const isPwdValid = savedPwd
          ? cleanPassword === savedPwd
          : cleanPassword === 'StarMotos@2026' || cleanPassword === 'Taller2026';

        if (!isPwdValid) {
          setErrorMessage('Contraseña incorrecta para el jefe de taller. Verifique sus datos.');
          return;
        }

        if (matchedManager.workshopId) {
          localStorage.setItem('starmotos_taller_active_ws', matchedManager.workshopId);
        }

        setSuccessMessage(`¡Bienvenido, ${matchedManager.name}! Ingresando al taller...`);
        setTimeout(() => {
          onLoginSuccess('taller');
        }, 400);
        return;
      }

      setErrorMessage(
        `No se encontró ninguna sede o jefe de taller con "${loginEmail}". Si eres nuevo jefe de taller, puedes registrarte fácilmente.`
      );
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (
      !registerForm.name.trim() ||
      !registerForm.email.trim() ||
      !registerForm.phone.trim() ||
      !registerForm.password.trim() ||
      !registerForm.confirmPassword.trim()
    ) {
      setErrorMessage('Por favor complete todos los campos requeridos.');
      return;
    }

    if (registerForm.password.length < 6) {
      setErrorMessage('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    const cleanEmail = registerForm.email.trim().toLowerCase();
    const selectedWorkshop = workshops.find((w) => w.id === registerForm.workshopId);
    const workshopName = registerForm.customWorkshopName.trim() || selectedWorkshop?.name || 'StarMotos Taller Oficial';

    const newManager: WorkshopManagerAccount = {
      id: `mgr-${Date.now()}`,
      name: registerForm.name.trim(),
      workshopId: registerForm.workshopId,
      workshopName: workshopName,
      email: cleanEmail,
      phone: registerForm.phone.trim(),
      password: registerForm.password.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`starmotos_mgr_pwd_${cleanEmail}`, registerForm.password.trim());
      saveStoredWorkshopManager(newManager);
      localStorage.setItem('starmotos_taller_active_ws', newManager.workshopId);
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('¡Jefe de taller registrado con éxito! Ingresando al panel...');
      setTimeout(() => {
        onLoginSuccess('taller');
      }, 600);
    }, 500);
  };

  return (
    <div className="w-full max-w-md my-auto py-2 sm:py-4 animate-fade-in">
      {/* Encabezado */}
      <div className="mb-4 sm:mb-6 text-center">
        <div className="inline-flex p-2.5 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-700 text-white shadow-xl shadow-amber-600/20 mb-2.5">
          <Wrench className="w-9 h-9 sm:w-11 sm:h-11 text-white" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-0.5">
          <span className="h-px w-5 bg-gradient-to-r from-transparent to-amber-500" />
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-700 font-mono">
            Red de Sedes & Talleres
          </span>
          <span className="h-px w-5 bg-gradient-to-l from-transparent to-amber-500" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">
          {isRegisterMode ? 'Registro de Jefe de Taller' : 'Portal Jefes de Taller'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          {isRegisterMode
            ? 'Registro simplificado para encargados de sedes y talleres mecánicos.'
            : 'Gestión de órdenes de trabajo, alistamientos, garantías de sede y mecánicos.'}
        </p>

        {/* Conmutador Registro / Login */}
        <div className="mt-2.5">
          {!isRegisterMode ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs text-zinc-700">
              <span>¿Nuevo jefe de taller?</span>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="text-amber-800 hover:text-amber-950 font-black underline cursor-pointer"
              >
                Regístrate aquí
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Iniciar Sesión</span>
            </button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {errorMessage && (
        <div className="mb-3.5 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2 animate-shake">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-3.5 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ===================== FORMULARIO INICIO DE SESIÓN ===================== */}
      {!isRegisterMode ? (
        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1 sm:mb-1.5">
              Correo Electrónico de la Sede o Jefe
            </label>
            <div className="relative">
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="ej: sede.la-mana@starmotos.com"
                className="w-full pl-9 pr-3.5 py-2.5 sm:py-3 bg-white border border-zinc-300 hover:border-zinc-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-none text-zinc-800 font-medium text-xs sm:text-sm placeholder:text-zinc-400 rounded-xl transition-all"
                required
                autoFocus
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1 sm:mb-1.5">
              Contraseña de Taller
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 sm:py-3 bg-white border border-zinc-300 hover:border-zinc-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-none text-zinc-800 font-medium text-xs sm:text-sm placeholder:text-zinc-400 rounded-xl transition-all"
                required
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-100 rounded-full transition cursor-pointer text-zinc-500 hover:text-zinc-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center space-x-2 text-xs text-zinc-700 cursor-pointer select-none font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
              />
              <span>Recordar sesión</span>
            </label>
            <span className="text-[11px] text-zinc-400 font-mono">Panel Operativo</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-md shadow-amber-600/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm mt-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verificando Sede...</span>
              </>
            ) : (
              'Ingresar al Panel de Taller'
            )}
          </button>
        </form>
      ) : (
        /* ===================== REGISTRO SENCILLO DE JEFE DE TALLER ===================== */
        <form onSubmit={handleRegisterSubmit} className="space-y-3 animate-fade-in">
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Nombre Completo del Jefe de Taller <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                placeholder="Ej: Daniel Meza"
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs sm:text-sm outline-none focus:border-amber-600"
              />
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Sede / Taller Asignado <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={registerForm.workshopId}
                onChange={(e) => setRegisterForm({ ...registerForm, workshopId: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs sm:text-sm outline-none focus:border-amber-600 cursor-pointer"
              >
                {workshops.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.city})
                  </option>
                ))}
              </select>
              <Building2 className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                placeholder="jefe@starmotos.com"
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                WhatsApp / Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={registerForm.phone}
                onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                placeholder="0991234567"
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                placeholder="Mín 6 car."
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Confirmar <span className="text-red-500">*</span>
              </label>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                placeholder="Repetir"
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-3 rounded-xl text-xs sm:text-sm font-bold transition shadow-md shadow-amber-600/20 cursor-pointer flex items-center justify-center gap-1.5 mt-2"
          >
            {isLoading ? 'Registrando Jefe de Taller...' : 'Crear Cuenta de Jefe de Taller'}
          </button>
        </form>
      )}

      {/* Guía Rápida de Sedes Oficiales */}
      <div className="mt-4 pt-3 border-t border-zinc-200">
        <button
          type="button"
          onClick={() => setShowCredentialsGuide(!showCredentialsGuide)}
          className="w-full flex items-center justify-between px-3 py-2 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/80 rounded-xl text-amber-900 transition cursor-pointer text-xs font-bold"
        >
          <div className="flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Ver Sedes Oficiales Autorizadas</span>
          </div>
          {showCredentialsGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showCredentialsGuide && (
          <div className="mt-2.5 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 text-xs text-zinc-700 animate-fade-in font-mono max-h-60 overflow-y-auto">
            <div className="flex justify-between items-center pb-1.5 border-b border-zinc-200 font-sans font-bold text-zinc-900">
              <span>Sede Oficial (Click para autocompletar)</span>
              <span className="text-zinc-500 font-normal">Clave Genérica</span>
            </div>
            {workshops.map((ws) => (
              <div
                key={ws.id}
                className="flex justify-between items-center cursor-pointer hover:bg-white p-1.5 rounded transition border border-transparent hover:border-amber-200"
                onClick={() => {
                  setLoginEmail(ws.email || '');
                  setLoginPassword('StarMotos@2026');
                }}
                title={`Click para seleccionar ${ws.name}`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-zinc-900 font-bold font-sans truncate text-[11px]">{ws.name}</span>
                  <span className="text-amber-800 font-mono text-[10px] truncate">{ws.email}</span>
                </div>
                <span className="text-zinc-600 shrink-0 text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded">StarMotos@2026</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
