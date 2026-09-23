// src/components/desktop/garante/PerfilGaranteDesktop.tsx
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Save,
  CheckCircle2,
  RotateCcw,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { GaranteProfile } from '../../../types/customer';

interface Props {
  profile: GaranteProfile;
  onUpdateProfile?: (updated: GaranteProfile) => void;
}

export const PerfilGaranteDesktop: React.FC<Props> = ({ profile, onUpdateProfile }) => {
  const [formData, setFormData] = useState<GaranteProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData(profile);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const brandName = formData.companyName.trim();
    if (!brandName) {
      setErrorMessage('La razón social / marca es obligatoria.');
      return;
    }
    if (!formData.ruc.trim()) {
      setErrorMessage('El RUC institucional es obligatorio.');
      return;
    }
    if (!formData.contactName.trim()) {
      setErrorMessage('El nombre del responsable o auditor oficial es obligatorio.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMessage('El correo electrónico oficial es obligatorio.');
      return;
    }

    const updatedProfile: GaranteProfile = {
      ...formData,
      companyName: brandName,
      brandsRepresented: [brandName],
    };

    if (onUpdateProfile) {
      onUpdateProfile(updatedProfile);
    }

    setIsSaved(true);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
    setTimeout(() => setIsSaved(false), 4000);
  };

  const initials = (formData.contactName || formData.companyName || 'GAR')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-3xl mr-auto pb-12 animate-fade-in text-left">
      {/* 1. Header con botones de acción rápida */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span>Mi Perfil de Garante y Respaldo de Marca</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Gestione y edite sus datos de contacto, representación oficial, marcas respaldadas y parámetros de auditoría técnica.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-purple-700/30 transition cursor-pointer active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Perfil</span>
          </button>
        </div>
      </div>

      {/* 2. Banner de Feedback */}
      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-3 animate-slide-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="text-emerald-900 font-bold">¡Perfil de Garante Actualizado y Sincronizado!</p>
            <p className="text-emerald-700 text-[11px] font-normal">
              Los cambios han sido guardados y se reflejan en tiempo real en la barra lateral, dictámenes de garantías y catálogo de marcas del sistema.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold flex items-center gap-2.5 animate-slide-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Tarjeta de Vista Previa en Vivo */}
      <div className="bg-gradient-to-tr from-purple-900 via-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 p-6 opacity-10 pointer-events-none">
          <Award className="w-48 h-48" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4.5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-2xl flex items-center justify-center shadow-inner shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Garante Oficial Activo
                </span>
                <span className="text-[11px] text-purple-200 font-mono">
                  RUC: {formData.ruc || 'Sin RUC'}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white">
                {formData.contactName || 'Nombre del Representante'}
              </h3>
              <p className="text-xs text-purple-200 font-medium">
                {formData.roleTitle || 'Representante Autorizado'} • {formData.companyName || 'Empresa de Marca'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Formulario Editable */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bloque 1: Datos del Responsable */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
              <User className="w-4 h-4 text-purple-600" />
              <h4 className="text-sm font-bold text-zinc-900">Datos del Responsable de Marca</h4>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 flex items-center justify-between">
                <span>Nombres y Apellidos del Responsable *</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Carlos Alberto Ramos"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition"
                />
              </div>
              <p className="text-[10px] text-zinc-400">
                Este nombre aparecerá en la barra lateral del portal y en los dictámenes oficiales de garantía.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">
                Cargo o Función en la Marca
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  name="roleTitle"
                  value={formData.roleTitle || ''}
                  onChange={handleChange}
                  placeholder="Ej: Jefe de Garantías y Postventa / Auditor Técnico"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">
                Correo Electrónico Oficial *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="garantias.oficial@marca.com"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 font-mono focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">
                Teléfono / Celular de Contacto *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Ej: +593 99 876 5432"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 font-mono focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Información Corporativa */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
              <Building2 className="w-4 h-4 text-purple-600" />
              <h4 className="text-sm font-bold text-zinc-900">Datos Corporativos e Institucionales</h4>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">
                Razón Social / Marca Garante *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-600" />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Benelli, CFMOTO, Keeway, Yamaha..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition"
                />
              </div>
              <p className="text-[10px] text-zinc-500">
                Esta razón social actúa directamente como la marca oficial respaldada y se vinculará automáticamente a Alistamientos y Garantías.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">
                RUC Oficial *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  name="ruc"
                  value={formData.ruc}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 1792849102001"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 font-mono focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">
                Dirección Corporativa / Sede de Auditoría
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ej: Av. Principal 123 y Secundaria, Edificio Motorcorp Piso 3"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-600">
                  Inicio del Convenio
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    name="contractStartDate"
                    value={formData.contractStartDate || ''}
                    onChange={handleChange}
                    placeholder="01 Ene 2024"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-900 focus:bg-white focus:border-purple-600 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-600">
                  Fin del Convenio
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    name="contractEndDate"
                    value={formData.contractEndDate || ''}
                    onChange={handleChange}
                    placeholder="31 Dic 2028"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-900 focus:bg-white focus:border-purple-600 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Barra Inferior de Guardar */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-200">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition cursor-pointer"
          >
            Descartar Cambios
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-98 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-700/25 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Perfil de Garante</span>
          </button>
        </div>
      </form>
    </div>
  );
};
