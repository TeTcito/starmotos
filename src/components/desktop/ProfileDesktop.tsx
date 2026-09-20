// src/components/desktop/ProfileDesktop.tsx
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

export const ProfileDesktop: React.FC<Props> = ({ profile, onUpdateProfile }) => {
  const [profileForm, setProfileForm] = useState<ClientProfile>(profile);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 3000);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Encabezado de Sección */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              Perfil del Cliente y Facturación
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Datos personales requeridos para la emisión de proformas y facturación electrónica SRI en Ecuador
          </p>
        </div>

        {isProfileSaved && (
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-300 animate-fade-in shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Cambios Guardados Exitosamente
          </span>
        )}
      </div>

      {/* Formulario Proporcional de Ancho Completo */}
      <form onSubmit={handleSaveProfile} className="space-y-6 w-full">
        <div className="grid grid-cols-2 gap-6 w-full">
          {/* Nombres y Apellidos */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Nombres y Apellidos Completos
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                required
                placeholder="Ej. Fernando David Paredes Zambrano"
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium transition placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Cédula o RUC */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Cédula de Identidad / RUC (SRI)
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="text"
                value={profileForm.idNumber}
                onChange={(e) => setProfileForm({ ...profileForm, idNumber: e.target.value })}
                required
                placeholder="10 o 13 dígitos numéricos"
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono transition placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Celular / WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Celular / WhatsApp Principal
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                required
                placeholder="0991234567"
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono transition placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Correo Electrónico (Facturación Electrónica)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                required
                placeholder="cliente@ejemplo.com"
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm transition placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Dirección Domiciliaria - Ancho Completo */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Dirección Domiciliaria y Ciudad
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                placeholder="Av. Amazonas N34-12 y Av. Atahualpa, Quito"
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm transition placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Contacto de Emergencia - Dos Columnas Proporcionales */}
          <div>
            <label className="block text-xs font-semibold text-red-600 mb-1.5">
              Contacto de Emergencia - Nombre
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-red-500" />
              <input
                type="text"
                value={profileForm.emergencyContactName}
                onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                placeholder="Nombre del familiar o contacto"
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm transition placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-red-600 mb-1.5">
              Contacto de Emergencia - Teléfono
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3 text-red-500" />
              <input
                type="text"
                value={profileForm.emergencyContactPhone}
                onChange={(e) => setProfileForm({ ...profileForm, emergencyContactPhone: e.target.value })}
                placeholder="Teléfono móvil de emergencia"
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono transition placeholder:text-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* Barra de Acciones */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
          <p className="text-xs text-zinc-500">
            Tus datos se sincronizan automáticamente con el taller seleccionado.
          </p>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-2.5 px-6 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2 active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Información de Perfil</span>
          </button>
        </div>
      </form>
    </div>
  );
};
