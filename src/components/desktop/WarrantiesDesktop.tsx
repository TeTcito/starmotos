// src/components/desktop/WarrantiesDesktop.tsx
import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { WarrantyItem } from '../../types/customer';

interface Props {
  warranties: WarrantyItem[];
}

export const WarrantiesDesktop: React.FC<Props> = ({ warranties }) => {
  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Pólizas y Garantías Vigentes
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Garantías respaldadas por StarMotos y fabricantes oficiales para repuestos y mano de obra
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 w-full">
        {warranties.map((war) => (
          <div
            key={war.id}
            className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3 hover:border-zinc-700 transition flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">{war.title}</h3>
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Vigente
                </span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">{war.coverage}</p>
            </div>

            <div className="flex justify-between text-xs text-zinc-400 font-mono pt-3 border-t border-zinc-800">
              <span>Fecha de Vencimiento: <strong className="text-zinc-200">{war.expirationDate}</strong></span>
              <span>Límite de Odómetro: <strong className="text-zinc-200">{war.kmLimit.toLocaleString()} km</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
