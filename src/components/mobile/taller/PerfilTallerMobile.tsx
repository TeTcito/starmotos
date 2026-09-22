// src/components/mobile/taller/PerfilTallerMobile.tsx
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Building2,
  User,
  Phone,
  MapPin,
  Mail,
  Save,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Navigation,
} from 'lucide-react';
import { Workshop } from '../../../types/customer';

interface Props {
  workshop: Workshop;
  onUpdateWorkshop: (updated: Partial<Workshop>) => void;
}

export const PerfilTallerMobile: React.FC<Props> = ({ workshop, onUpdateWorkshop }) => {
  const [formData, setFormData] = useState({
    manager: workshop.manager || '',
    phone: workshop.phone || '',
    address: workshop.address || '',
    reference: workshop.reference || '',
    city: workshop.city || '',
    name: workshop.name || '',
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData({
      manager: workshop.manager || '',
      phone: workshop.phone || '',
      address: workshop.address || '',
      reference: workshop.reference || '',
      city: workshop.city || '',
      name: workshop.name || '',
    });
  }, [workshop]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWorkshop(formData);
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
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-zinc-900 leading-tight">
              Perfil de Sede
            </h2>
            <p className="text-[11px] text-zinc-500 font-mono">
              Gestión de Datos del Taller Oficial
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          {workshop.code}
        </span>
      </div>

      {/* Tarjeta de Identidad de la Sede */}
      <div className="p-3.5 bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Building2 className="w-24 h-24" />
        </div>
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-1.5 text-blue-200 text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Taller Autorizado StarMotos</span>
          </div>
          <h3 className="text-sm font-black tracking-tight">{workshop.name}</h3>
          <p className="text-xs text-blue-100 font-medium">
            {formData.manager || 'Encargado de Sede'}
          </p>
          <div className="pt-2 flex items-center gap-3 text-[11px] text-blue-200 font-mono">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-300" />
              {workshop.city}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-300" />
              {formData.phone || 'Sin teléfono'}
            </span>
          </div>
        </div>
      </div>

      {/* Formulario Editable */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Nombres del Encargado de Sede */}
        <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2">
          <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Encargado / Responsable del Taller</span>
          </label>
          <input
            type="text"
            name="manager"
            value={formData.manager}
            onChange={handleChange}
            required
            placeholder="Nombres y Apellidos del Responsable"
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
          <p className="text-[10px] text-zinc-500">
            Este nombre aparecerá en las actas de alistamiento y entregas oficiales.
          </p>
        </div>

        {/* Teléfono / WhatsApp de la Sede */}
        <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2">
          <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Celular / WhatsApp Oficial de la Sede</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="Ej: 0998765432"
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 font-mono focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
          <p className="text-[10px] text-zinc-500">
            Número para notificaciones de garantías y contacto con clientes.
          </p>
        </div>

        {/* Dirección de la Sede */}
        <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2">
          <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-600" />
            <span>Dirección del Taller</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            placeholder="Calle principal, secundaria y número"
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
        </div>

        {/* Referencia de Ubicación */}
        <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2">
          <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-indigo-600" />
            <span>Referencia de Ubicación</span>
          </label>
          <input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            placeholder="Ej: Frente al redondel, diagonal al parque"
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
        </div>

        {/* Credenciales de Acceso Institucional */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-1.5 text-left">
          <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>Correo Oficial de Acceso</span>
          </span>
          <div className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg font-mono text-xs text-zinc-800 font-semibold truncate">
            {workshop.id === 'matriz-la-mana'
              ? 'taller.lamana@starmotos.com'
              : `taller.${workshop.city.toLowerCase().replace(/[^a-z0-9]/g, '')}@starmotos.com`}
          </div>
          <p className="text-[10px] text-zinc-500">
            Sede asignada permanentemente a este correo.
          </p>
        </div>

        {/* Feedback de Éxito */}
        {isSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-slide-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>¡Datos de la sede guardados y sincronizados correctamente!</span>
          </div>
        )}

        {/* Botón Guardar */}
        <button
          type="submit"
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Datos de la Sede</span>
        </button>
      </form>
    </div>
  );
};
