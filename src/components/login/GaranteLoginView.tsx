// src/components/login/GaranteLoginView.tsx
import React, { useState } from 'react';
import {
  Tag,
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
  Wrench,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Briefcase,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { UserRole, GaranteProfile } from '../../types/customer';
import {
  getStoredGarantes,
  saveStoredGarante,
  INITIAL_GARANTE_PROFILE,
} from '../../data/mockMultiRoleData';
import { OFFICIAL_CORPORATE_ACCOUNTS } from '../../data/authAccounts';
import { cloudSaveGarante } from '../../services/supabaseService';

interface Props {
  onLoginSuccess: (role: UserRole) => void;
}

export const GaranteLoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCredentialsGuide, setShowCredentialsGuide] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Registro Completo de Marca / Garante
  const [registerForm, setRegisterForm] = useState({
    companyName: '',
    ruc: '',
    contactName: '',
    roleTitle: '',
    email: '',
    phone: '',
    address: '',
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
      setErrorMessage('Por favor ingrese su correo de marca/garante y su contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const customPwd = localStorage.getItem(`starmotos_pwd_${cleanUser}`);

      // 1. Cuentas oficiales de garantes
      const corporateAccount = OFFICIAL_CORPORATE_ACCOUNTS[cleanUser];
      if (corporateAccount && corporateAccount.role === 'garante') {
        const isPasswordValid =
          corporateAccount.passwords.includes(cleanPassword) ||
          cleanPassword === customPwd;

        if (!isPasswordValid) {
          setErrorMessage('Contraseña incorrecta para el garante oficial. Verifique su clave autorizada.');
          return;
        }

        try {
          const storedGarantes = getStoredGarantes();
          const matched = storedGarantes.find((g) => g.email.trim().toLowerCase() === cleanUser) || INITIAL_GARANTE_PROFILE;
          localStorage.setItem('starmotos_shared_garante_profile', JSON.stringify(matched));
          localStorage.setItem('starmotos_active_garante_email', matched.email);
          localStorage.setItem('starmotos_active_garante_id', matched.id);
          window.dispatchEvent(new Event('starmotos_garante_profile_updated'));
        } catch (_) {}

        setSuccessMessage('¡Ingreso autorizado de Garante Oficial! Accediendo al panel...');
        setTimeout(() => {
          onLoginSuccess('garante');
        }, 400);
        return;
      }

      // 2. Garantes y Marcas registradas dinámicamente
      const storedGarantes = getStoredGarantes();
      const matchedGarante = storedGarantes.find(
        (g) => g.email.trim().toLowerCase() === cleanUser
      );

      if (matchedGarante) {
        const savedPwd =
          matchedGarante.password ||
          localStorage.getItem(`starmotos_garante_pwd_${cleanUser}`) ||
          customPwd;

        const isPwdValid = savedPwd
          ? cleanPassword === savedPwd
          : cleanPassword === 'StarMotos@Garante2026' || cleanPassword === 'StarMotos@2026';

        if (!isPwdValid) {
          setErrorMessage('Contraseña incorrecta para la cuenta de marca ingresada.');
          return;
        }

        try {
          localStorage.setItem('starmotos_shared_garante_profile', JSON.stringify(matchedGarante));
          localStorage.setItem('starmotos_active_garante_email', matchedGarante.email);
          localStorage.setItem('starmotos_active_garante_id', matchedGarante.id);
          window.dispatchEvent(new Event('starmotos_garante_profile_updated'));
        } catch (_) {}

        setSuccessMessage(`¡Bienvenido, ${matchedGarante.contactName || matchedGarante.companyName}! Ingresando al panel...`);
        setTimeout(() => {
          onLoginSuccess('garante');
        }, 400);
        return;
      }

      setErrorMessage(
        `No se encontró ninguna marca o garante registrado con "${loginEmail}". Por favor regístrese en el formulario oficial.`
      );
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (
      !registerForm.companyName.trim() ||
      !registerForm.ruc.trim() ||
      !registerForm.contactName.trim() ||
      !registerForm.roleTitle.trim() ||
      !registerForm.email.trim() ||
      !registerForm.password.trim() ||
      !registerForm.confirmPassword.trim()
    ) {
      setErrorMessage('Por favor complete todos los campos obligatorios marcados con asterisco (*).');
      return;
    }

    if (registerForm.password.length < 8) {
      setErrorMessage('La contraseña debe tener mínimo 8 caracteres.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    const cleanEmail = registerForm.email.trim().toLowerCase();
    const cleanBrandCompany = registerForm.companyName.trim();

    const newGarante: GaranteProfile = {
      id: `gar-${Date.now()}`,
      companyName: cleanBrandCompany,
      ruc: registerForm.ruc.trim(),
      contactName: registerForm.contactName.trim(),
      roleTitle: registerForm.roleTitle.trim(),
      phone: registerForm.phone.trim() || '+593 99 000 0000',
      email: cleanEmail,
      address: registerForm.address.trim() || 'Ecuador',
      brandsRepresented: [cleanBrandCompany],
      contractStartDate: new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }),
      contractEndDate: '31 Dic 2028',
      password: registerForm.password.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`starmotos_garante_pwd_${cleanEmail}`, registerForm.password.trim());
      saveStoredGarante(newGarante);
      cloudSaveGarante(newGarante);
      localStorage.setItem('starmotos_shared_garante_profile', JSON.stringify(newGarante));
      localStorage.setItem('starmotos_active_garante_email', cleanEmail);
      localStorage.setItem('starmotos_active_garante_id', newGarante.id);
      window.dispatchEvent(new Event('starmotos_garante_profile_updated'));
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('¡Marca y responsable de garantías registrados exitosamente! Sincronizando con base de datos...');
      setTimeout(() => {
        onLoginSuccess('garante');
      }, 700);
    }, 500);
  };

  return (
    <div className="w-full max-w-md my-auto py-2 sm:py-4 animate-fade-in">
      {/* Encabezado */}
      <div className="mb-4 sm:mb-5 text-center">
        <div className="inline-flex p-2.5 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-700 to-purple-900 text-white shadow-xl shadow-purple-700/20 mb-2.5">
          <Tag className="w-9 h-9 sm:w-11 sm:h-11 text-purple-200" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-0.5">
          <span className="h-px w-5 bg-gradient-to-r from-transparent to-purple-500" />
          <span className="text-[11px] font-black uppercase tracking-widest text-purple-700 font-mono">
            Garantías de Fábrica & Marcas
          </span>
          <span className="h-px w-5 bg-gradient-to-l from-transparent to-purple-500" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">
          {isRegisterMode ? 'Registro de Marca / Garante' : 'Portal Garantías de Marca'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          {isRegisterMode
            ? 'Inscripción oficial de la marca y del encargado del panel de garantías.'
            : 'Revisión técnica, dictamen de coberturas oficiales y despacho de repuestos.'}
        </p>

        {/* Conmutador Registro / Login */}
        <div className="mt-2.5">
          {!isRegisterMode ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-xs text-zinc-700">
              <span>¿Eres representante de marca nuevo?</span>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="text-purple-800 hover:text-purple-950 font-black underline cursor-pointer"
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
              className="inline-flex items-center gap-1.5 text-xs text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
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
              Correo Electrónico de la Marca / Garante
            </label>
            <div className="relative">
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="ej: garantias.oficial@benelli-ecuador.com"
                className="w-full pl-9 pr-3.5 py-2.5 sm:py-3 bg-white border border-zinc-300 hover:border-zinc-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none text-zinc-800 font-medium text-xs sm:text-sm placeholder:text-zinc-400 rounded-xl transition-all"
                required
                autoFocus
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1 sm:mb-1.5">
              Contraseña de Acceso Garante
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 sm:py-3 bg-white border border-zinc-300 hover:border-zinc-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none text-zinc-800 font-medium text-xs sm:text-sm placeholder:text-zinc-400 rounded-xl transition-all"
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
                className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
              />
              <span>Recordar sesión</span>
            </label>
            <span className="text-[11px] text-zinc-400 font-mono">Garante Oficial</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-md shadow-purple-700/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm mt-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verificando Garante...</span>
              </>
            ) : (
              'Ingresar al Panel de Garantías'
            )}
          </button>
        </form>
      ) : (
        /* ===================== REGISTRO COMPLETO DE MARCA / GARANTE ===================== */
        <form onSubmit={handleRegisterSubmit} className="space-y-3 animate-fade-in text-left pb-28 sm:pb-4">
          {/* 1. Datos de la Marca / Empresa */}
          <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200/80 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-black text-purple-900 pb-1 border-b border-purple-200/60">
              <Building2 className="w-3.5 h-3.5 text-purple-700" />
              <span>1. Información de la Empresa o Marca</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Empresa / Razón Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={registerForm.companyName}
                onChange={(e) => setRegisterForm({ ...registerForm, companyName: e.target.value })}
                placeholder="Ej: Representaciones Honda del Ecuador S.A."
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                RUC / Identificación Fiscal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={registerForm.ruc}
                onChange={(e) => setRegisterForm({ ...registerForm, ruc: e.target.value })}
                placeholder="13 dígitos (ej: 1792849102001)"
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono outline-none focus:border-purple-600"
              />
            </div>
            <p className="text-[10px] text-purple-700 italic">
              * La empresa o razón social registrada actuará directamente como la marca oficial en el sistema de garantías.
            </p>
          </div>

          {/* 2. Datos del Representante / Responsable */}
          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-black text-zinc-900 pb-1 border-b border-zinc-200">
              <User className="w-3.5 h-3.5 text-indigo-700" />
              <span>2. Responsable que Controlará el Panel</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Nombre del Responsable <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={registerForm.contactName}
                  onChange={(e) => setRegisterForm({ ...registerForm, contactName: e.target.value })}
                  placeholder="Ej: Ing. Paulina Velasteguí"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Cargo del Responsable <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={registerForm.roleTitle}
                  onChange={(e) => setRegisterForm({ ...registerForm, roleTitle: e.target.value })}
                  placeholder="Ej: Jefa Nacional de Garantías"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Correo Electrónico (Login) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="garantias@marca.com"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  placeholder="0991234567"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Dirección / Ciudad de la Marca
              </label>
              <input
                type="text"
                value={registerForm.address}
                onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                placeholder="Ej: Av. Granados y 6 de Diciembre, Quito"
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-purple-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="Mín. 8 caracteres"
                    className="w-full pl-3 pr-8 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-purple-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">Mínimo 8 caracteres</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Confirmar Clave <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    placeholder="Repetir clave"
                    className="w-full pl-3 pr-8 py-2 bg-white border border-zinc-300 rounded-xl text-xs outline-none focus:border-purple-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {registerForm.confirmPassword && (
                  <span
                    className={`text-[10px] mt-0.5 block font-bold ${
                      registerForm.password === registerForm.confirmPassword
                        ? 'text-emerald-600'
                        : 'text-red-500'
                    }`}
                  >
                    {registerForm.password === registerForm.confirmPassword
                      ? '✓ Coinciden'
                      : '✗ No coinciden'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white py-3 rounded-xl text-xs sm:text-sm font-bold transition shadow-md shadow-purple-700/20 cursor-pointer flex items-center justify-center gap-1.5 mt-2"
          >
            {isLoading ? 'Registrando Marca...' : 'Registrar Marca y Responsable'}
          </button>
        </form>
      )}

      {/* Guía Rápida de Garantes Autorizados */}
      <div className="mt-4 pt-3 border-t border-zinc-200">
        <button
          type="button"
          onClick={() => setShowCredentialsGuide(!showCredentialsGuide)}
          className="w-full flex items-center justify-between px-3 py-2 bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200/80 rounded-xl text-purple-900 transition cursor-pointer text-xs font-bold"
        >
          <div className="flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-purple-700 shrink-0" />
            <span>Ver Garantes Oficiales de Fábrica</span>
          </div>
          {showCredentialsGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showCredentialsGuide && (
          <div className="mt-2.5 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 text-xs text-zinc-700 animate-fade-in font-mono">
            <div className="flex justify-between items-center pb-1.5 border-b border-zinc-200 font-sans font-bold text-zinc-900">
              <span>Garante Oficial</span>
              <span className="text-zinc-500 font-normal">Clave de Acceso</span>
            </div>
            <div
              className="flex justify-between items-center cursor-pointer hover:bg-white p-1 rounded"
              onClick={() => {
                setLoginEmail('garantias.oficial@benelli-ecuador.com');
                setLoginPassword('StarMotos@Garante2026');
              }}
            >
              <span className="text-purple-800 font-bold truncate max-w-[200px]">
                garantias.oficial@benelli-ecuador.com
              </span>
              <span className="text-zinc-600 shrink-0">StarMotos@Garante2026</span>
            </div>
            <div
              className="flex justify-between items-center cursor-pointer hover:bg-white p-1 rounded"
              onClick={() => {
                setLoginEmail('garante@starmotos.com');
                setLoginPassword('StarMotos@Garante2026');
              }}
            >
              <span className="text-purple-800 font-bold">garante@starmotos.com</span>
              <span className="text-zinc-600">StarMotos@Garante2026</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
