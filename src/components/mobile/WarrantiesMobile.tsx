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
      <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
        <Sparkles className="w-5 h-5 text-blue-400" />
        <h2 className="text-base font-bold text-white">
          Garantías Vigentes
        </h2>
      </div>

      <div className="space-y-3">
        {warranties.map((war) => (
          <div key={war.id} className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white">{war.title}</h3>
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Vigente
              </span>
            </div>
            <p className="text-zinc-400 text-[11px]">{war.coverage}</p>
            <div className="flex gap-4 text-[10px] text-zinc-500 font-mono pt-1">
              <span>Vence: <strong className="text-zinc-300">{war.expirationDate}</strong></span>
              <span>Límite: <strong className="text-zinc-300">{war.kmLimit.toLocaleString()} km</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
