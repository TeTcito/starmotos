// src/components/mobile/admin/TalleresMobile.tsx
import React from 'react';
import { Building2, CheckCircle2, Clock, Users, ShieldCheck, MapPin, Phone } from 'lucide-react';
import { Workshop } from '../../../types/customer';

interface Props {
  workshops: Workshop[];
}

export const TalleresMobile: React.FC<Props> = ({ workshops }) => {
  const totalActiveOrders = workshops.reduce((acc, w) => acc + w.activeOrders, 0);
  const totalCompletedToday = workshops.reduce((acc, w) => acc + w.completedToday, 0);

  return (
    <div className="space-y-4">
      {/* Resumen Móvil */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-[#f0f6fc] border border-[#b8d1ea] rounded-xl text-center">
          <span className="text-[10px] font-bold uppercase text-zinc-500 block">En Taller</span>
          <span className="text-lg font-black text-blue-700">{totalActiveOrders} OTs</span>
        </div>
        <div className="p-3 bg-[#f0f6fc] border border-[#b8d1ea] rounded-xl text-center">
          <span className="text-[10px] font-bold uppercase text-zinc-500 block">Entregadas Hoy</span>
          <span className="text-lg font-black text-emerald-700">{totalCompletedToday} Motos</span>
        </div>
      </div>

      {/* Lista de Talleres */}
      <div className="space-y-3">
        {workshops.map((ws) => {
          const isOperativo = ws.status === 'operativo';
          return (
            <div
              key={ws.id}
              className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                      {ws.code}
                    </span>
                    {ws.province && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                        {ws.province}
                      </span>
                    )}
                    <h3 className="text-xs font-bold text-zinc-900">{ws.name}</h3>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                    <span className="truncate">{ws.address}, {ws.city}</span>
                  </p>
                  {ws.reference && (
                    <p className="text-[10px] text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 mt-1">
                      📍 {ws.reference}
                    </p>
                  )}
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    isOperativo
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isOperativo ? 'ACTIVO' : 'MANT'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="p-2 rounded-lg bg-blue-50">
                  <span className="text-[9px] font-bold text-blue-800 block">En Taller</span>
                  <span className="font-bold text-blue-900">{ws.activeOrders}</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50">
                  <span className="text-[9px] font-bold text-emerald-800 block">Listas</span>
                  <span className="font-bold text-emerald-900">{ws.completedToday}</span>
                </div>
                <div className="p-2 rounded-lg bg-purple-50">
                  <span className="text-[9px] font-bold text-purple-800 block">Técnicos</span>
                  <span className="font-bold text-purple-900">{ws.mechanics}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-600">
                <span className="font-medium">{ws.manager}</span>
                <span className="font-mono">{ws.phone}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
