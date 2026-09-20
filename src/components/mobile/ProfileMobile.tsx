// src/components/mobile/ProfileMobile.tsx
import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { ClientProfile } from '../../types/customer';

interface Props {
  profile: ClientProfile;
  onUpdateProfile: (updated: ClientProfile) => void;
}

export const ProfileMobile: React.FC<Props> = ({ profile, onUpdateProfile }) => {
  const [profileForm, setProfileForm] = useState<ClientProfile>(profile);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

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
      {/* Encabezado sin contenedor externo */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-500" />
          <h2 className="text-base font-bold text-white">
            Perfil del Cliente
          </h2>
        </div>

        {isProfileSaved && (
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Guardado
          </span>
        )}
      </div>

      {/* Formulario móvil */}
      <form onSubmit={handleSaveProfile} className="space-y-3.5">
        <div className="space-y-3">
          {/* Nombres y Apellidos */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Nombres y Apellidos
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                required
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-medium"
              />
            </div>
          </div>

          {/* Cédula o RUC - Teclado Estrictamente Numérico */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-zinc-300">
                Cédula / RUC (SRI)
              </label>
              <span className="text-[10px] text-blue-400 font-mono font-bold">Solo números</span>
            </div>
            <div className="relative">
              <CreditCard className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
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
                placeholder="10 o 13 dígitos numéricos"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold tracking-wider"
              />
            </div>
          </div>

          {/* Celular / WhatsApp - Teclado Estrictamente Numérico */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-zinc-300">
                Celular / WhatsApp
              </label>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">Solo números</span>
            </div>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
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
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold tracking-wider"
              />
            </div>
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                required
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Dirección / Ciudad
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Contacto de Emergencia: Nombre y Teléfono Numérico Separado */}
          <div className="space-y-2 pt-1 border-t border-zinc-850">
            <span className="block text-[11px] font-bold text-red-400 uppercase tracking-wider">
              Contacto de Emergencia
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-0.5">
                  Nombre de Contacto
                </label>
                <input
                  type="text"
                  value={profileForm.emergencyContactName}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                  placeholder="Ej. María Zambrano"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-[11px] font-medium text-zinc-400">
                    Teléfono de Contacto
                  </label>
                  <span className="text-[9px] text-zinc-500 font-mono">Solo dígitos</span>
                </div>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-red-400" />
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
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-zinc-800">
          <button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Perfil</span>
          </button>
        </div>
      </form>
    </div>
  );
};
