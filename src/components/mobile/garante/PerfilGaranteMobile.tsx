// src/components/mobile/garante/PerfilGaranteMobile.tsx
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  User,
  Phone,
  Mail,
  Building2,
  Save,
  CheckCircle2,
  Sparkles,
  MapPin,
  Award,
} from 'lucide-react';
import { GaranteProfile } from '../../../types/customer';

interface Props {
  profile: GaranteProfile;
  onUpdateProfile?: (updated: GaranteProfile) => void;
}

export const PerfilGaranteMobile: React.FC<Props> = ({ profile, onUpdateProfile }) => {
  const [formData, setFormData] = useState<GaranteProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile(formData);
    }
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
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-zinc-900 leading-tight">
              Perfil de Garante
            </h2>
            <p className="text-[11px] text-zinc-500 font-mono">
              Auditor Oficial de Marcas y Garantías
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          Auditor B2B
        </span>
      </div>

      {/* Tarjeta Resumen */}
      <div className="p-3.5 bg-gradient-to-br from-purple-800 to-indigo-950 text-white rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Award className="w-24 h-24" />
        </div>
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-1.5 text-purple-200 text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auditoría de Garantías Oficial</span>
          </div>
          <h3 className="text-sm font-black tracking-tight">{formData.companyName}</h3>
          <p className="text-xs text-purple-100 font-medium">
            {formData.contactName || 'Ingeniero Auditor'}
          </p>
          <div className="pt-2 flex items-center gap-2.5 text-[11px] text-purple-200 font-mono">
            <span>RUC: {formData.ruc}</span>
            <span>•</span>
            <span>{formData.phone || '0990000000'}</span>
          </div>
        </div>
      </div>

      {/* Marcas Representadas */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2">
        <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-purple-600" />
          <span>Marcas Homologadas Bajo su Dictamen</span>
        </span>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {profile.brandsRepresented?.map((b) => (
            <span
              key={b}
              className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-bold text-xs"
            >
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Formulario Editable */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Nombres del Auditor */}
        <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2">
          <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-purple-600" />
            <span>Nombres y Apellidos del Auditor</span>
          </label>
          <input
            type="text"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            required
            placeholder="Ej: Ing. Jorge Cárdenas"
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition"
          />
          <p className="text-[10px] text-zinc-500">
            Aparecerá en los dictámenes de aprobación o rechazo de garantías.
          </p>
        </div>

        {/* Teléfono / Celular */}
        <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2">
          <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Número de Celular / Contacto Directo</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="Ej: 0991234567"
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 font-mono focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition"
          />
        </div>

        {/* Correo Electrónico */}
        <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2">
          <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>Correo Oficial de Notificaciones</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="garante@starmotos.com"
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 font-mono focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition"
          />
          <p className="text-[10px] text-zinc-500">
            Recepción de copias de reclamos y órdenes aprobadas.
          </p>
        </div>

        {/* Razón Social y RUC */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-700 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-purple-600" />
              <span>Razón Social</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 focus:bg-white focus:border-purple-600 outline-none"
            />
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-700 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-zinc-500" />
              <span>RUC</span>
            </label>
            <input
              type="text"
              name="ruc"
              value={formData.ruc}
              onChange={handleChange}
              required
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 font-mono focus:bg-white focus:border-purple-600 outline-none"
            />
          </div>
        </div>

        {/* Feedback de Éxito */}
        {isSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-slide-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>¡Perfil de garante actualizado y sincronizado con éxito!</span>
          </div>
        )}

        {/* Botón Guardar */}
        <button
          type="submit"
          className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Cambios de Perfil</span>
        </button>
      </form>
    </div>
  );
};
