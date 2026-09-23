// src/components/login/AdminLoginView.tsx
import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { UserRole } from '../../types/customer';
import { OFFICIAL_CORPORATE_ACCOUNTS } from '../../data/authAccounts';

interface Props {
  onLoginSuccess: (role: UserRole) => void;
}

export const AdminLoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanUser = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUser || !cleanPassword) {
      setErrorMessage('Por favor ingrese su correo electrónico de administrador y su contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // Verificación de clave personalizada
      const customPwd = localStorage.getItem(`starmotos_pwd_${cleanUser}`);
      const corporateAccount = OFFICIAL_CORPORATE_ACCOUNTS[cleanUser];

      if (corporateAccount && corporateAccount.role === 'admin') {
        const isPasswordValid =
          corporateAccount.passwords.includes(cleanPassword) ||
          cleanPassword === customPwd;

        if (!isPasswordValid) {
          setErrorMessage('Contraseña incorrecta para la cuenta administrativa. Verifique sus credenciales.');
          return;
        }

        if (corporateAccount.workshopId) {
          localStorage.setItem('starmotos_taller_active_ws', corporateAccount.workshopId);
        }

        setSuccessMessage('¡Credenciales de Administrador verificadas! Ingresando a Matriz...');
        setTimeout(() => {
          onLoginSuccess('admin');
        }, 400);
        return;
      }

      // Si existe como otra cuenta pero no es admin
      if (corporateAccount && corporateAccount.role !== 'admin') {
        setErrorMessage(
          `Esta cuenta pertenece al rol "${corporateAccount.role}". Por favor ingrese desde su portal correspondiente.`
        );
        return;
      }

      setErrorMessage(
        'Acceso no autorizado: El correo ingresado no corresponde a ningún administrador autorizado de StarMotos Matriz.'
      );
    }, 450);
  };

  return (
    <div className="w-full max-w-md my-auto py-2 sm:py-4 animate-fade-in">
      {/* Encabezado Administrador */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold mb-1.5">
          <Shield className="w-3.5 h-3.5 text-red-600" />
          <span>Matriz Central</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">
          Portal Administrador
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Acceso exclusivo para Gerencia y Dirección
        </p>
      </div>

      {/* Alertas */}
      {errorMessage && (
        <div className="mb-3.5 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2 animate-shake">
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

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[11px] sm:text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1 sm:mb-1.5">
            Correo Electrónico Corporativo
          </label>
          <div className="relative">
            <input
              type="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ej: admin@starmotos.com"
              className="w-full pl-9 pr-3.5 py-2.5 sm:py-3 bg-white border border-zinc-300 hover:border-zinc-400 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-zinc-800 font-medium text-xs sm:text-sm placeholder:text-zinc-400 rounded-xl transition-all"
              required
              autoFocus
            />
            <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] sm:text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1 sm:mb-1.5">
            Contraseña de Administrador
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 sm:py-3 bg-white border border-zinc-300 hover:border-zinc-400 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-zinc-800 font-medium text-xs sm:text-sm placeholder:text-zinc-400 rounded-xl transition-all"
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
              className="w-4 h-4 rounded accent-red-600 cursor-pointer"
            />
            <span>Recordar sesión</span>
          </label>
          <span className="text-[11px] text-zinc-400 font-mono">256-bit SSL</span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-md shadow-red-600/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm mt-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verificando Administrador...</span>
            </>
          ) : (
            'Ingresar a Matriz Central'
          )}
        </button>
      </form>
    </div>
  );
};
