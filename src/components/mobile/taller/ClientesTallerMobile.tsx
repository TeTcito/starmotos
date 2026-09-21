// src/components/mobile/taller/ClientesTallerMobile.tsx
import React from 'react';
import { Users, Bike, Phone } from 'lucide-react';
import { TallerClient } from '../../../types/customer';

interface Props {
  clients: TallerClient[];
}

export const ClientesTallerMobile: React.FC<Props> = ({ clients }) => {
  return (
    <div className="space-y-2.5">
      {clients.map((c) => (
        <div key={c.id} className="bg-white border border-zinc-200 rounded-xl p-3 shadow-xs space-y-1.5">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-xs font-bold text-zinc-900">{c.fullName}</h4>
              <span className="text-[10px] text-zinc-500 font-mono">C.I: {c.idNumber}</span>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {c.totalVisits} visitas
            </span>
          </div>
          <div className="text-[11px] text-zinc-700 flex items-center gap-1">
            <Bike className="w-3 h-3 text-blue-600" />
            <span>{c.motorcycleBrand} {c.motorcycleModel} ({c.motorcyclePlate})</span>
          </div>
          <div className="text-[10px] text-zinc-500 flex justify-between">
            <span className="font-mono">{c.phone}</span>
            <span>Última: {c.lastVisit}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
