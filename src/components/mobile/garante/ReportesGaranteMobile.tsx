// src/components/mobile/garante/ReportesGaranteMobile.tsx
import React from 'react';
import { TrendingUp, DollarSign, Clock } from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';

interface Props {
  warranties: WarrantyRequest[];
}

export const ReportesGaranteMobile: React.FC<Props> = ({ warranties }) => {
  const aprobadas = warranties.filter((w) => ['aprobada', 'completada'].includes(w.status)).length;
  const rechazadas = warranties.filter((w) => w.status === 'rechazada').length;
  const tasaAprobacion = Math.round((aprobadas / (aprobadas + rechazadas || 1)) * 100);
  const totalLiquidado = warranties
    .filter((w) => ['aprobada', 'completada'].includes(w.status))
    .reduce((acc, w) => acc + (w.estimatedCost || 0), 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-[#f0f6fc] border border-[#b8d1ea] rounded-xl text-center">
          <span className="text-[10px] font-bold uppercase text-zinc-500 block">Aprobación</span>
          <span className="text-xl font-black text-emerald-700">{tasaAprobacion}%</span>
        </div>
        <div className="p-3 bg-[#f0f6fc] border border-[#b8d1ea] rounded-xl text-center">
          <span className="text-[10px] font-bold uppercase text-zinc-500 block">Total Cubierto</span>
          <span className="text-xl font-black text-blue-800 font-mono">${totalLiquidado.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-xs space-y-2 text-xs">
        <h4 className="font-bold text-zinc-900 uppercase text-[10px]">Marcas Representadas</h4>
        <div className="space-y-1 text-zinc-700">
          <div className="flex justify-between py-1 border-b border-zinc-100">
            <span>Benelli Oficial</span>
            <span className="font-bold">55%</span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-100">
            <span>CFMOTO Ecuador</span>
            <span className="font-bold">30%</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Otras</span>
            <span className="font-bold">15%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
