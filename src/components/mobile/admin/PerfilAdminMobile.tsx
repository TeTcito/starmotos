// src/components/mobile/admin/PerfilAdminMobile.tsx
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  Shield,
  Phone,
  Mail,
  Building2,
  Save,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { AdminProfile } from '../../../types/customer';

interface Props {
  profile: AdminProfile;
  onUpdateProfile: (updated: AdminProfile) => void;
}

export const PerfilAdminMobile: React.FC<Props> = ({ profile, onUpdateProfile }) => {
  const [formData, setFormData] = useState<AdminProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'firstNames' || name === 'lastNames') {
        const fn = name === 'firstNames' ? value : prev.firstNames;
        const ln = name === 'lastNames' ? value : prev.lastNames;
        next.fullName = `${fn.trim()} ${ln.trim()}`.trim();
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsSaved(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    setTimeout(() => setIsSaved(false), 3500);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12 text-left">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-base font-black text-zinc-900 tracking-tight">
              Perfil de Administración
            </h2>
            <p className="text-[11px] text-zinc-500 font-medium">
              Datos oficiales de Matriz Central
            </p>
          </div>
        </div>

        {isSaved && (
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Guardado
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Nombres *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="firstNames"
                  value={formData.firstNames}
                  onChange={handleChange}
                  placeholder="Ej: William Daniel"
                  required
                  className="w-full bg-zinc-50 border border-zinc-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Apellidos *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="lastNames"
                  value={formData.lastNames}
                  onChange={handleChange}
                  placeholder="Ej: Meza Chicaiza"
                  required
                  className="w-full bg-zinc-50 border border-zinc-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Teléfono / Celular */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Celular / WhatsApp Oficial *
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ej: 0939316698"
                required
                className="w-full bg-zinc-50 border border-zinc-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Correo Electrónico Oficial */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Correo Electrónico de Acceso *
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@starmotos.com"
                required
                className="w-full bg-zinc-50 border border-zinc-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-medium"
              />
            </div>
          </div>

          {/* Cargo Institucional */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Cargo Institucional
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                name="roleTitle"
                value={formData.roleTitle}
                onChange={handleChange}
                placeholder="Ej: Gerente General Matriz"
                className="w-full bg-zinc-50 border border-zinc-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Empresa / Organización */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Organización
            </label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="StarMotos Ecuador"
                className="w-full bg-zinc-50 border border-zinc-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Botón de Guardado */}
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Cambios de Perfil</span>
        </button>
      </form>
    </div>
  );
};
