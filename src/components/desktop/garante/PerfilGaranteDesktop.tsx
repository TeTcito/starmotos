// src/components/desktop/garante/PerfilGaranteDesktop.tsx
import React from 'react';
import { ShieldCheck, Building2, User, Phone, Mail, MapPin, Calendar, Award } from 'lucide-react';
import { GaranteProfile } from '../../../types/customer';

interface Props {
  profile: GaranteProfile;
}

export const PerfilGaranteDesktop: React.FC<Props> = ({ profile }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <span>Ficha Institucional del Garante de Marca</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Datos de homologación, marcas bajo convenio y vigencia de respaldo técnico oficial.
        </p>
      </div>

      {/* Card Principal */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md">
              GAR
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">{profile.companyName}</h3>
              <p className="text-xs text-zinc-500 font-mono">RUC: {profile.ruc}</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Convenio Activo 2024–2027
          </span>
        </div>

        {/* Datos de Contacto y Representante */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Auditor Técnico Designado</span>
            <span className="font-bold text-zinc-800 text-sm">{profile.contactName}</span>
          </div>

          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Teléfonos Oficiales</span>
            <span className="font-mono text-zinc-800 text-sm flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              {profile.phone}
            </span>
          </div>

          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Correo Electrónico Auditoría</span>
            <span className="font-mono text-zinc-800 text-sm flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              {profile.email}
            </span>
          </div>

          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Dirección Corporativa</span>
            <span className="text-zinc-800 text-xs flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              {profile.address}
            </span>
          </div>
        </div>

        {/* Marcas Representadas */}
        <div className="pt-2">
          <span className="text-xs font-bold uppercase text-zinc-700 block mb-2">Marcas con Respaldo de Garantía Oficial</span>
          <div className="flex flex-wrap gap-2">
            {profile.brandsRepresented.map((brand) => (
              <span
                key={brand}
                className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>{brand} Oficial</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
