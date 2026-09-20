// src/components/LoginView.tsx
import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
} from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Autocompletar credenciales de demostración
  const handleQuickFill = () => {
    setIdentifier('cliente@starmotos.ec');
    setPassword('123456');
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Por favor ingrese su usuario/cédula y contraseña.');
      return;
    }

    setIsLoading(true);

    // Validación simulada de credenciales
    setTimeout(() => {
      const cleanUser = identifier.trim().toLowerCase();
      if (
        cleanUser === 'cliente@starmotos.ec' ||
        cleanUser === '1724890123' ||
        cleanUser.includes('cliente') ||
        cleanUser.includes('starmotos')
      ) {
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setErrorMessage('Credenciales incorrectas. Utilice cliente@starmotos.ec o haga clic en "Autocompletar".');
      }
    }, 700);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white relative">
      {/* Suave ambientación superior pastel agua */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-[#edf9fa] to-transparent pointer-events-none" />

      {/* Contenedor Principal */}
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xl relative z-10">
        {/* Logo Oficial StarMotos */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-blue-600 via-white to-red-600 shadow-md flex items-center justify-center">
              <img
                src="/starmotos-logo.jpg"
                alt="Logo StarMotos"
                className="w-full h-full object-cover rounded-full bg-white"
              />
            </div>
          </div>

          <h1 className="text-xl font-black tracking-wider uppercase flex items-center gap-1">
            <span className="text-blue-600">STAR</span>
            <span className="text-red-600">MOTOS</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium">
            Portal de Clientes & Hoja de Vida Vehicular
          </p>
        </div>

        {/* Tarjeta de Credenciales de Prueba */}
        <div className="mb-6 bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 text-xs text-zinc-700 relative">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-extrabold text-blue-700 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
              <KeyRound className="w-3.5 h-3.5" />
              Credenciales de Acceso
            </span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-0.5 rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3 h-3" />
              <span>Autocompletar</span>
            </button>
          </div>
          <div className="space-y-0.5 font-mono text-[11px] text-zinc-600">
            <p>
              Usuario / Cédula:{' '}
              <strong className="text-zinc-900 font-bold">cliente@starmotos.ec</strong> (o{' '}
              <strong className="text-zinc-900 font-bold">1724890123</strong>)
            </p>
            <p>
              Contraseña:{' '}
              <strong className="text-zinc-900 font-bold">123456</strong>
            </p>
          </div>
        </div>

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-shake">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Campo Usuario / Cédula */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Correo Electrónico o Cédula:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="ej. cliente@starmotos.ec o 1724890123"
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder:text-zinc-400 transition"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                Contraseña:
              </label>
              <span className="text-[10px] text-zinc-500 hover:text-blue-600 cursor-pointer">
                ¿Olvidó su clave?
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-10 py-2.5 text-xs placeholder:text-zinc-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón de Ingreso */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-70 mt-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verificando acceso...</span>
              </>
            ) : (
              <>
                <span>Ingresar al Portal del Cliente</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Seguro */}
        <div className="mt-6 pt-4 border-t border-zinc-100 text-center text-[11px] text-zinc-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-zinc-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Acceso seguro para clientes StarMotos Ecuador
          </p>
          <p className="text-[10px] text-zinc-400">Matriz Central • Taller Express Norte</p>
        </div>
      </div>
    </div>
  );
};
