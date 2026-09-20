// src/components/ClientProfileView.tsx
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
import { ClientProfile } from '../types/customer';

interface Props {
  profile: ClientProfile;
  onUpdateProfile: (updated: ClientProfile) => void;
}

export const ClientProfileView: React.FC<Props> = ({ profile, onUpdateProfile }) => {
  const [profileForm, setProfileForm] = useState<ClientProfile>(profile);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-12">
      {/* Tarjeta Única de Perfil del Cliente */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
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

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-medium"
                />
              </div>
            </div>

            {/* Cédula o RUC */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Cédula / RUC (SRI)
              </label>
              <div className="relative">
                <CreditCard className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  value={profileForm.idNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, idNumber: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono"
                />
              </div>
            </div>

            {/* Celular / WhatsApp */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Celular / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono"
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
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs"
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
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Contacto de Emergencia */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Contacto de Emergencia
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-red-400" />
                <input
                  type="text"
                  value={`${profileForm.emergencyContactName} - ${profileForm.emergencyContactPhone}`}
                  onChange={(e) => {
                    const parts = e.target.value.split('-');
                    setProfileForm({
                      ...profileForm,
                      emergencyContactName: parts[0] ? parts[0].trim() : '',
                      emergencyContactPhone: parts[1] ? parts[1].trim() : '',
                    });
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-zinc-850">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow transition flex items-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Perfil</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
