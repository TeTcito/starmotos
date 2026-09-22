// src/components/common/ForceChangePasswordModal.tsx
import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { ClientProfile, TallerClient } from '../../types/customer';
import { getStoredClients, saveStoredClients } from '../../data/mockMultiRoleData';
import { cloudSaveClient } from '../../services/supabaseService';
import confetti from 'canvas-confetti';

interface Props {
  profile: ClientProfile;
  onPasswordChanged: () => void;
  onLogout: () => void;
}

export const ForceChangePasswordModal: React.FC<Props> = ({
  profile,
  onPasswordChanged,
  onLogout,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validaciones dinámicas
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = hasMinLength && hasLetter && hasNumber && hasSpecial && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Por favor ingrese y confirme su nueva contraseña.');
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumber || !hasSpecial) {
      setErrorMessage('La contraseña debe cumplir con todos los requerimientos de seguridad.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    // Comprobar que no use la misma cédula como contraseña
    if (newPassword === profile.idNumber) {
      setErrorMessage('La nueva contraseña no puede ser igual a tu número de cédula.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Actualizar perfil local del cliente
      const updatedProfile = {
        ...profile,
        mustChangePassword: false,
      };
      localStorage.setItem('starmotos_current_client_profile', JSON.stringify(updatedProfile));
      localStorage.removeItem('starmotos_must_change_password');

      // 2. Actualizar en el registro de cuentas de autenticación
      const accounts = JSON.parse(localStorage.getItem('starmotos_registered_accounts') || '{}');
      if (profile.email) {
        accounts[profile.email.toLowerCase()] = {
          password: newPassword,
          mustChangePassword: false,
        };
      }
      if (profile.idNumber) {
        accounts[profile.idNumber.toLowerCase()] = {
          password: newPassword,
          mustChangePassword: false,
        };
      }
      localStorage.setItem('starmotos_registered_accounts', JSON.stringify(accounts));

      // 3. Actualizar en el directorio TallerClient y Supabase
      const allClients = getStoredClients();
      const targetClient = allClients.find(
        (c) => c.idNumber === profile.idNumber || (c.email && c.email.toLowerCase() === profile.email.toLowerCase())
      );

      if (targetClient) {
        const updatedClient: TallerClient = {
          ...targetClient,
          mustChangePassword: false,
        };
        const updatedList = allClients.map((c) => (c.id === targetClient.id ? updatedClient : c));
        saveStoredClients(updatedList);
        cloudSaveClient(updatedClient);
      }

      // Lanzar confeti de bienvenida
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (_) {}

      setTimeout(() => {
        setIsLoading(false);
        onPasswordChanged();
      }, 500);
    } catch (err) {
      console.error('Error al actualizar contraseña:', err);
      setIsLoading(false);
      setErrorMessage('Ocurrió un error al guardar la contraseña. Intente nuevamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-zinc-200 overflow-hidden my-auto animate-scale-up">
        {/* Encabezado con Icono de Seguridad */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-5 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
            <ShieldAlert className="w-6 h-6 text-amber-300" />
          </div>
          <h3 className="text-lg font-black tracking-tight">
            Actualización Obligatoria de Contraseña
          </h3>
          <p className="text-xs text-blue-100 mt-1 font-medium max-w-xs mx-auto">
            Por seguridad de tu cuenta y de tu motocicleta, debes crear una contraseña personal antes de continuar.
          </p>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Mensaje de aviso */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Acceso por primera vez detectado</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Tu usuario fue creado por el administrador con una clave temporal (tu cédula). Establece una contraseña definitiva para proteger tus mantenimientos y garantías.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2 animate-shake">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Nueva Contraseña */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-3.5 py-2.5 pr-10 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-zinc-800 text-xs sm:text-sm rounded-xl transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Confirmar Contraseña
                </label>
                {confirmPassword.length > 0 && (
                  <span
                    className={`text-[10px] font-bold ${
                      passwordsMatch ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {passwordsMatch ? 'Coinciden ✓' : 'No coinciden'}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  className={`w-full px-3.5 py-2.5 pr-10 bg-zinc-50 hover:bg-white focus:bg-white border ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-emerald-500 focus:border-emerald-600'
                        : 'border-red-400 focus:border-red-500'
                      : 'border-zinc-300 focus:border-blue-600'
                  } focus:ring-1 outline-none text-zinc-800 text-xs sm:text-sm rounded-xl transition`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checklist de Seguridad en Vivo */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5 text-[11px]">
              <span className="font-bold text-zinc-600 block mb-0.5">
                Requisitos de la nueva contraseña:
              </span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div
                  className={`flex items-center gap-1.5 ${
                    hasMinLength ? 'text-emerald-700 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  {hasMinLength ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 mx-1 shrink-0" />
                  )}
                  <span>Mínimo 8 caracteres</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    hasLetter ? 'text-emerald-700 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  {hasLetter ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 mx-1 shrink-0" />
                  )}
                  <span>Al menos una letra</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    hasNumber ? 'text-emerald-700 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  {hasNumber ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 mx-1 shrink-0" />
                  )}
                  <span>Al menos un número</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    hasSpecial ? 'text-emerald-700 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  {hasSpecial ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 mx-1 shrink-0" />
                  )}
                  <span>Símbolo (@#$%)</span>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="pt-2 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2.5 border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>

              <button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white transition shadow-md flex items-center justify-center gap-1.5 ${
                  isPasswordValid && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25 cursor-pointer'
                    : 'bg-zinc-400 cursor-not-allowed opacity-75'
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Actualizar y Continuar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
