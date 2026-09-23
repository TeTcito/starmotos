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
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              Pólizas y Garantías Vigentes
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Garantías respaldadas por StarMotos y fabricantes oficiales para repuestos y mano de obra
          </p>
        </div>
      </div>

      {warranties.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-zinc-300 text-center space-y-3 max-w-xl mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">Sin garantías activas registradas</h3>
            <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto">
              Aquí podrás consultar todas las pólizas de garantía de fábrica y de repuestos instalados por la red de talleres autorizados StarMotos.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 w-full">
          {warranties.map((war) => (
            <div
              key={war.id}
              className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3 hover:border-zinc-300 transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-zinc-900 text-base">{war.title}</h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Vigente
                  </span>
                </div>
                <p className="text-zinc-600 text-xs leading-relaxed">{war.coverage}</p>
              </div>

              <div className="flex justify-between text-xs text-zinc-500 font-mono pt-3 border-t border-zinc-100">
                <span>Fecha de Vencimiento: <strong className="text-zinc-800">{war.expirationDate}</strong></span>
                <span>Límite de Odómetro: <strong className="text-zinc-800">{war.kmLimit.toLocaleString()} km</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
