// src/components/login/GpsLoginView.tsx
import React, { useState } from 'react';
import {
  Radio,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import { UserRole } from '../../types/customer';
import { OFFICIAL_CORPORATE_ACCOUNTS } from '../../data/authAccounts';

interface Props {
  onLoginSuccess: (role: UserRole) => void;
}

export const GpsLoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanUser = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUser || !cleanPassword) {
      setErrorMessage('Por favor ingrese su correo de operador GPS y contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const corporateAccount = OFFICIAL_CORPORATE_ACCOUNTS[cleanUser];
      const customPwd = localStorage.getItem(`starmotos_pwd_${cleanUser}`);

      if (corporateAccount && corporateAccount.role === 'gps') {
        const isPasswordValid =
          corporateAccount.passwords.includes(cleanPassword) ||
          cleanPassword === customPwd;

        if (!isPasswordValid) {
          setErrorMessage('Contraseña incorrecta para el perfil GPS Servicios.');
          return;
        }

        setSuccessMessage('¡Ingreso autorizado a GPS Servicios! Redirigiendo...');
        setTimeout(() => {
          onLoginSuccess('gps');
        }, 400);
        return;
      }

      // Soporte genérico para operador GPS
      if (
        cleanUser.includes('gps') ||
        cleanUser === 'gps@starmotos.com' ||
        cleanUser === 'gps@starmotos.ec'
      ) {
        if (cleanPassword === 'StarMotos@Gps2026' || cleanPassword === 'StarMotos@2026' || cleanPassword === 'gps123' || cleanPassword === 'admin') {
          setSuccessMessage('¡Acceso autorizado a GPS Servicios!');
          setTimeout(() => {
            onLoginSuccess('gps');
          }, 400);
          return;
        }
      }

      setErrorMessage('Credenciales no válidas para el perfil GPS Servicios. Utilice una cuenta autorizada.');
    }, 600);
  };

  const handleQuickDemoAccess = () => {
    setEmail('gps@starmotos.com');
    setPassword('StarMotos@Gps2026');
    setErrorMessage('');
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {/* Tarjeta de encabezado con temática GPS */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 mb-1 shadow-xs">
          <Navigation className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
          Portal GPS Servicios
        </h3>
        <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
          Plataforma de auditoría, activación técnica y emisión de credenciales de rastreo satelital.
        </p>
      </div>

      {/* Alertas */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Campo Correo */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
            Correo de Operador GPS
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gps@starmotos.com"
              className="w-full pl-9 pr-3 py-2.5 text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-cyan-600 outline-none transition"
              required
            />
          </div>
        </div>

        {/* Campo Contraseña */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              Contraseña de Acceso
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-9 py-2.5 text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-cyan-600 outline-none transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Botón Ingresar */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white text-xs font-bold shadow-md shadow-cyan-600/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Radio className="w-4 h-4" />
          )}
          <span>{isLoading ? 'Verificando...' : 'Iniciar Sesión en GPS Servicios'}</span>
        </button>
      </form>

      {/* Botón de Relleno Rápido Demo */}
      <div className="pt-2 border-t border-zinc-100">
        <button
          type="button"
          onClick={handleQuickDemoAccess}
          className="w-full py-2 px-3 rounded-xl bg-zinc-50 hover:bg-cyan-50 border border-zinc-200 hover:border-cyan-300 text-zinc-700 hover:text-cyan-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>Rellenar credenciales demo (gps@starmotos.com)</span>
        </button>
      </div>
    </div>
  );
};
