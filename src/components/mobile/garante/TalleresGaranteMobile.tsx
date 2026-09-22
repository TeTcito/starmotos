// src/components/mobile/garante/TalleresGaranteMobile.tsx
import React, { useState } from 'react';
import {
  Building2,
  Search,
  Phone,
  MapPin,
  ShieldCheck,
  DollarSign,
  MessageCircle,
} from 'lucide-react';
import { Workshop, WarrantyRequest } from '../../../types/customer';

interface Props {
  workshops: Workshop[];
  warranties: WarrantyRequest[];
}

export const TalleresGaranteMobile: React.FC<Props> = ({ workshops, warranties }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWorkshops = workshops.filter((w) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      w.name.toLowerCase().includes(term) ||
      w.code.toLowerCase().includes(term) ||
      w.city.toLowerCase().includes(term) ||
      w.manager.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-3.5">
      {/* Buscador */}
      <div className="relative flex items-center bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2">
        <Search className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar taller, ciudad..."
          className="w-full bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 outline-none"
        />
      </div>

      {/* Lista de Talleres B2B */}
      <div className="space-y-3">
        {filteredWorkshops.map((ws) => {
          const wsWarranties = warranties.filter(
            (w) =>
              w.tallerOriginId === ws.id ||
              w.tallerOrigin.toLowerCase().includes(ws.city.toLowerCase()) ||
              w.tallerOrigin.toLowerCase().includes(ws.name.toLowerCase())
          );
          const approvedCount = wsWarranties.filter(
            (w) => w.status === 'aprobada' || w.status === 'aceptada' || w.status === 'completada'
          ).length;
          const moneyApproved = wsWarranties
            .filter((w) => w.status === 'aprobada' || w.status === 'aceptada' || w.status === 'completada')
            .reduce((acc, w) => acc + (w.estimatedCost || 60), 0);

          const cleanPhone = ws.phone ? ws.phone.replace(/\D/g, '') : '';

          return (
            <div
              key={ws.id}
              className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                    {ws.code || 'MAT'}
                  </span>
                  <h4 className="text-xs font-bold text-zinc-900 mt-1">{ws.name}</h4>
                  <p className="text-[10px] text-zinc-500">{ws.city} • {ws.manager}</p>
                </div>

                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  Homologado
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <span className="font-black text-blue-900 block">{wsWarranties.length}</span>
                  <span className="text-[9px] text-blue-700">Garantías</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <span className="font-black text-emerald-900 block font-mono">
                    ${moneyApproved.toFixed(2)}
                  </span>
                  <span className="text-[9px] text-emerald-700">Aprobado</span>
                </div>
              </div>

              {cleanPhone && (
                <div className="pt-2 border-t border-zinc-100 flex justify-end">
                  <a
                    href={`https://wa.me/593${cleanPhone.replace(/^0/, '')}?text=Estimado/a%20${encodeURIComponent(
                      ws.manager
                    )},%20le%20escribimos%20desde%20la%20Gerencia%20de%20Garantías%20de%20Marca.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
