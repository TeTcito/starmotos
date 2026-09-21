// src/components/mobile/garante/PerfilGaranteMobile.tsx
import React from 'react';
import { Building2, Phone, Mail, Award } from 'lucide-react';
import { GaranteProfile } from '../../../types/customer';

interface Props {
  profile: GaranteProfile;
}

export const PerfilGaranteMobile: React.FC<Props> = ({ profile }) => {
  return (
    <div className="space-y-3">
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-700 text-white font-black text-sm flex items-center justify-center">
            GAR
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-900">{profile.companyName}</h4>
            <p className="text-[10px] text-zinc-500 font-mono">RUC: {profile.ruc}</p>
          </div>
        </div>

        <div className="space-y-2 text-xs pt-2 border-t border-zinc-100">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Auditor Técnico</span>
            <span className="font-bold text-zinc-800">{profile.contactName}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Teléfono</span>
            <span className="font-mono text-zinc-700">{profile.phone}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Email</span>
            <span className="text-zinc-700">{profile.email}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-100">
          <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Marcas con Garantía</span>
          <div className="flex flex-wrap gap-1">
            {profile.brandsRepresented.map((b) => (
              <span key={b} className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[10px]">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
