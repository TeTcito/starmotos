// src/components/mobile/ProfileMobile.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Save,
  CheckCircle2,
  X,
} from 'lucide-react';
import { ClientProfile } from '../../types/customer';

interface Props {
  profile: ClientProfile;
  onUpdateProfile: (updated: ClientProfile) => void;
}

export const ProfileMobile: React.FC<Props> = ({ profile, onUpdateProfile }) => {
  const [profileForm, setProfileForm] = useState<ClientProfile>(profile);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  // Sincronizar si cambian las props
  useEffect(() => {
    setProfileForm(profile);
  }, [profile]);

  // Detectar cambios en el formulario
  const hasChanges = useMemo(() => {
    return JSON.stringify(profileForm) !== JSON.stringify(profile);
  }, [profileForm, profile]);

  // Cancelar y restaurar valores originales
  const handleCancel = () => {
    setProfileForm(profile);
  };

  // Función para interceptar teclas no numéricas en móviles y teclados físicos
  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];
    if (allowed.includes(e.key)) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 3000);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-zinc-900">
            Perfil del Cliente
          </h2>
        </div>

        {isProfileSaved && (
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Guardado
          </span>
        )}
      </div>

      {/* Formulario móvil */}
      <form onSubmit={handleSaveProfile} className="space-y-3.5">
        <div className="space-y-3">
          {/* Nombres y Apellidos */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Nombres y Apellidos
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                required
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-medium placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Cédula o RUC - Teclado Estrictamente Numérico */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Cédula / RUC (SRI)
            </label>
            <div className="relative">
              <CreditCard className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={13}
                value={profileForm.idNumber}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => {
                  const numbersOnly = e.target.value.replace(/\D/g, '');
                  setProfileForm({ ...profileForm, idNumber: numbersOnly });
                }}
                required
                placeholder="Ej. 1712345678 o 1712345678001"
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold tracking-wider placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Celular / WhatsApp - Teclado Estrictamente Numérico */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Celular / WhatsApp
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={profileForm.phone}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => {
                  const numbersOnly = e.target.value.replace(/\D/g, '');
                  setProfileForm({ ...profileForm, phone: numbersOnly });
                }}
                required
                placeholder="Ej. 0991234567"
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold tracking-wider placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                required
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Dirección / Ciudad
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Contacto de Emergencia: Nombre y Teléfono Numérico Separado */}
          <div className="space-y-2 pt-2 border-t border-zinc-200">
            <span className="block text-[11px] font-bold text-red-600 uppercase tracking-wider">
              Contacto de Emergencia
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
                  Nombre de Contacto
                </label>
                <input
                  type="text"
                  value={profileForm.emergencyContactName}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                  placeholder="Ej. María Zambrano"
                  className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl px-3 py-2 text-xs placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
                  Teléfono de Contacto
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-red-500" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={profileForm.emergencyContactPhone}
                    onKeyDown={handleNumericKeyDown}
                    onChange={(e) => {
                      const numbersOnly = e.target.value.replace(/\D/g, '');
                      setProfileForm({ ...profileForm, emergencyContactPhone: numbersOnly });
                    }}
                    placeholder="Ej. 0987654321"
                    className="w-full bg-white border border-zinc-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold placeholder:text-zinc-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200">
          {hasChanges && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 sm:flex-none border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer animate-fade-in"
            >
              <X className="w-3.5 h-3.5 text-zinc-500" />
              <span>Cancelar</span>
            </button>
          )}

          <button
            type="submit"
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Perfil</span>
          </button>
        </div>
      </form>
    </div>
  );
};
