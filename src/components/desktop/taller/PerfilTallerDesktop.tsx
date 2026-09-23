// src/components/desktop/taller/PerfilTallerDesktop.tsx
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
  Lock,
  Store,
  Info,
} from 'lucide-react';
import { Workshop } from '../../../types/customer';

interface Props {
  workshop: Workshop;
  onUpdateWorkshop: (updated: Partial<Workshop>) => void;
}

export const PerfilTallerDesktop: React.FC<Props> = ({ workshop, onUpdateWorkshop }) => {
  const [formData, setFormData] = useState({
    name: workshop.name || '',
    manager: workshop.manager || '',
    phone: workshop.phone || '',
    address: workshop.address || '',
    reference: workshop.reference || '',
    city: workshop.city || '',
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData({
      name: workshop.name || '',
      manager: workshop.manager || '',
      phone: workshop.phone || '',
      address: workshop.address || '',
      reference: workshop.reference || '',
      city: workshop.city || '',
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
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
    setTimeout(() => setIsSaved(false), 4000);
  };

  const corporateEmail =
    workshop.email ||
    (workshop.id === 'matriz-la-mana'
      ? 'sede.la-mana@starmotos.com'
      : `sede.${workshop.city.toLowerCase().split(',')[0].trim().replace(/[^a-z0-9]/g, '-') || 'taller'}@starmotos.com`);

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>Perfil y Datos de la Sede Oficial</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Actualice la información del responsable de sede, contacto y ubicación para la emisión de actas y garantías.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono">
            {workshop.code}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sede Operativa
          </span>
        </div>
      </div>

      {/* Banner de Identidad Institucional */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Store className="w-48 h-48" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-200 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Red Oficial StarMotos Ecuador • Taller Autorizado</span>
            </div>
            <h3 className="text-2xl font-black tracking-tight">{formData.name || workshop.name}</h3>
            <p className="text-sm text-blue-100 font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-blue-300" />
              <span>Jefe de Taller: <strong>{formData.manager || 'No asignado'}</strong></span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20 text-xs space-y-1.5 min-w-[240px]">
            <div className="flex items-center gap-2 text-blue-100">
              <MapPin className="w-3.5 h-3.5 text-red-300 shrink-0" />
              <span className="truncate">{formData.city || workshop.city}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-100 font-mono">
              <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>{formData.phone || 'Sin registrar'}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-100 font-mono truncate">
              <Mail className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">{corporateEmail}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de Actualización */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Columna Izquierda: Datos del Responsable y Credenciales */}
          <div className="space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-2.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>Responsable de la Sede</span>
              </h4>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Nombres y Apellidos del Jefe de Taller <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="manager"
                    value={formData.manager}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Daniel Meza"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Este nombre aparecerá impreso como responsable en las actas de alistamiento PDI y entregas de taller.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Celular / WhatsApp Oficial <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="Ej: 0998765432"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 font-mono focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                  <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Canal de comunicación para seguimiento de garantías y contacto directo con clientes.
                </p>
              </div>

              {/* Credencial Oficial (Inmutable) */}
              <div className="pt-2 border-t border-zinc-100">
                <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Correo Corporativo Asignado</span>
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Asignación Fija
                  </span>
                </label>
                <div className="px-3.5 py-2.5 bg-zinc-100/80 border border-zinc-200 rounded-xl font-mono text-xs font-semibold text-zinc-800 flex items-center justify-between">
                  <span className="truncate">{corporateEmail}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-white border border-zinc-200 rounded text-zinc-600 font-bold shrink-0">
                    Sede {workshop.code}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Utilice este correo institucional para ingresar directamente en el portal de taller.
                </p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Datos de la Sucursal y Dirección */}
          <div className="space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-2.5">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>Ubicación y Localización</span>
              </h4>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Nombre de la Sede / Taller <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ej: StarMotos Sucursal Quevedo"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                  <Store className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Ciudad / Cantón / Provincia <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Quevedo, Los Ríos"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                  <Building2 className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Dirección Física <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="Calle principal, secundaria y número"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                  <MapPin className="w-4 h-4 text-red-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Referencia de Ubicación
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    placeholder="Ej: Frente al redondel, diagonal al parque"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                  <Navigation className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notificación de Guardado */}
        {isSaved && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-slide-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>¡Los datos de la sede y el jefe de taller se guardaron y sincronizaron exitosamente!</span>
            </div>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
        )}

        {/* Barra de Acciones */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Los cambios se guardan inmediatamente en la red de StarMotos.
          </p>

          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition"
          >
            <Save className="w-4 h-4" />
            <span>Guardar y Actualizar Datos de Sede</span>
          </button>
        </div>
      </form>
    </div>
  );
};
