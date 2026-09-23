// src/components/desktop/garante/TalleresGaranteDesktop.tsx
import React, { useState } from 'react';
import {
  Building2,
  Search,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  MessageCircle,
  ExternalLink,
  Users,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { Workshop, WarrantyRequest } from '../../../types/customer';

interface Props {
  workshops: Workshop[];
  warranties: WarrantyRequest[];
}

export const TalleresGaranteDesktop: React.FC<Props> = ({ workshops, warranties }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrado de talleres
  const filteredWorkshops = workshops.filter((w) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      w.name.toLowerCase().includes(term) ||
      w.code.toLowerCase().includes(term) ||
      w.city.toLowerCase().includes(term) ||
      w.manager.toLowerCase().includes(term) ||
      w.phone.includes(term)
    );
  });

  // Estadísticas globales de la red de talleres frente al Garante
  const totalApprovedMoney = warranties
    .filter((w) => w.status === 'aprobada' || w.status === 'aceptada' || w.status === 'completada')
    .reduce((acc, w) => acc + ((w.totalBudget ?? w.estimatedCost) || 0), 0);

  const totalWarrantiesCount = warranties.length;
  const approvedWarrantiesCount = warranties.filter(
    (w) => w.status === 'aprobada' || w.status === 'aceptada' || w.status === 'completada'
  ).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. CABECERA CON MÉTRICAS DE LA RED B2B */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900 tracking-tight">
                Red de Clientes B2B: Talleres & Concesionarios Homologados
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Puntos de servicio oficiales autorizados por la Marca para atención técnica y trámite de garantías.
              </p>
            </div>
          </div>

          {/* Métricas Globales B2B */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 shadow-2xs flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              <span>{workshops.length} Talleres Oficiales</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{totalWarrantiesCount} Garantías Tramitadas</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs flex items-center gap-1.5 font-mono">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>${totalApprovedMoney.toFixed(2)} USD Reembolsados</span>
            </span>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative flex items-center bg-zinc-50 hover:bg-white focus-within:bg-white border border-zinc-300 focus-within:border-purple-600 rounded-xl px-3.5 py-2 transition-all max-w-md">
          <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de taller, código, ciudad o encargado..."
            className="w-full bg-transparent text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-zinc-400 hover:text-zinc-600 text-xs font-bold px-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. GRID DE TARJETAS DE CONCESIONARIOS / TALLERES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredWorkshops.map((ws) => {
          // Filtrar garantías de este taller
          const wsWarranties = warranties.filter(
            (w) =>
              w.tallerOriginId === ws.id ||
              w.tallerOrigin.toLowerCase().includes(ws.city.toLowerCase()) ||
              w.tallerOrigin.toLowerCase().includes(ws.name.toLowerCase())
          );

          const approvedCount = wsWarranties.filter(
            (w) => w.status === 'aprobada' || w.status === 'aceptada' || w.status === 'completada'
          ).length;
          const pendingCount = wsWarranties.filter(
            (w) =>
              w.status === 'enviada_matriz' ||
              w.status === 'en_revision' ||
              w.status === 'validada_matriz' ||
              w.status === 'en_proceso' ||
              w.status === 'enviada_garante' ||
              w.status === 'creada'
          ).length;
          const rejectedCount = wsWarranties.filter(
            (w) => w.status === 'rechazada' || w.status === 'denegada'
          ).length;
          const moneyApproved = wsWarranties
            .filter((w) => w.status === 'aprobada' || w.status === 'aceptada' || w.status === 'completada')
            .reduce((acc, w) => acc + ((w.totalBudget ?? w.estimatedCost) || 0), 0);

          const cleanPhone = ws.phone ? ws.phone.replace(/\D/g, '') : '';

          return (
            <div
              key={ws.id}
              className="bg-white border-2 border-zinc-200 hover:border-purple-500 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header del Taller */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {ws.code || 'MAT'}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-zinc-900 leading-tight">
                        {ws.name}
                      </h3>
                      <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-zinc-400" />
                        <span>{ws.city}, {ws.address}</span>
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    Homologado
                  </span>
                </div>

                {/* Contacto & Responsable */}
                <div className="mt-3 p-3 bg-zinc-50 rounded-xl space-y-1.5 text-xs text-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Jefe / Administrador:</span>
                    <strong className="text-zinc-900">{ws.manager}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Teléfono:</span>
                    <span className="font-mono font-semibold">{ws.phone || '0990000000'}</span>
                  </div>
                  {ws.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Email:</span>
                      <span className="text-zinc-600 font-mono text-[11px]">{ws.email}</span>
                    </div>
                  )}
                </div>

                {/* Desglose de Garantías Tramitadas */}
                <div className="mt-3.5 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Historial de Garantías Tramitadas:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-xs font-black text-blue-900 block">{wsWarranties.length}</span>
                      <span className="text-[10px] text-blue-700 font-medium">Total Solicitadas</span>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-xs font-black text-emerald-900 block">{approvedCount}</span>
                      <span className="text-[10px] text-emerald-700 font-medium">Aprobadas</span>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-xs font-black text-amber-900 block">{pendingCount}</span>
                      <span className="text-[10px] text-amber-700 font-medium">En Trámite</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con Monto y Contacto Directo */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Monto Aprobado Marca</span>
                  <span className="text-sm font-black font-mono text-emerald-700">
                    ${moneyApproved.toFixed(2)} USD
                  </span>
                </div>

                {cleanPhone && (
                  <a
                    href={`https://wa.me/593${cleanPhone.replace(/^0/, '')}?text=Estimado/a%20${encodeURIComponent(
                      ws.manager
                    )},%20le%20escribimos%20desde%20la%20Gerencia%20de%20Garantías%20de%20Marca.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
