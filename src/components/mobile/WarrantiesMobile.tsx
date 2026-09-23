// src/components/mobile/WarrantiesMobile.tsx
import React from 'react';
import { Sparkles } from 'lucide-react';
import { WarrantyItem } from '../../types/customer';

interface Props {
  warranties: WarrantyItem[];
}

export const WarrantiesMobile: React.FC<Props> = ({ warranties }) => {
  return (
    <div className="space-y-4 animate-fade-in pb-12">
      <div className="flex items-center gap-2 pb-3 border-b border-zinc-200">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h2 className="text-base font-bold text-zinc-900">
          Garantías Vigentes
        </h2>
      </div>

      {warranties.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-dashed border-zinc-300 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-zinc-400 mx-auto" />
          <p className="text-xs font-semibold text-zinc-700">Sin garantías activas</p>
          <p className="text-[11px] text-zinc-500">
            No registras pólizas ni reclamos de garantía en trámite en la red oficial StarMotos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {warranties.map((war) => (
            <div key={war.id} className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-zinc-900">{war.title}</h3>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Vigente
                </span>
              </div>
              <p className="text-zinc-600 text-[11px]">{war.coverage}</p>
              <div className="flex gap-4 text-[10px] text-zinc-500 font-mono pt-1">
                <span>Vence: <strong className="text-zinc-800">{war.expirationDate}</strong></span>
                <span>Límite: <strong className="text-zinc-800">{war.kmLimit.toLocaleString()} km</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
