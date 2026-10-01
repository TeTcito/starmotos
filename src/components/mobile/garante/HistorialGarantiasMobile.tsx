// src/components/mobile/garante/HistorialGarantiasMobile.tsx
import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Search,
  History,
  Bike,
} from 'lucide-react';
import { WarrantyRequest, GaranteProfile } from '../../../types/customer';

interface Props {
  historyRequests: WarrantyRequest[];
  profile?: GaranteProfile;
  onSelectWarranty?: (warranty: WarrantyRequest) => void;
}

export const HistorialGarantiasMobile: React.FC<Props> = ({
  historyRequests,
  profile,
  onSelectWarranty,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aprobada' | 'denegada'>('all');

  const brandName = profile?.companyName || historyRequests[0]?.motorcycleBrand || 'Mi Marca';

  const isAprobada = (status: string) =>
    ['aceptada', 'aprobada', 'completada', 'en_proceso_aceptacion_2'].includes(status);
  const isRechazada = (status: string) =>
    ['denegada', 'rechazada'].includes(status);

  const countAprobadas = useMemo(
    () => historyRequests.filter((w) => isAprobada(w.status)).length,
    [historyRequests]
  );
  const countDenegadas = useMemo(
    () => historyRequests.filter((w) => isRechazada(w.status)).length,
    [historyRequests]
  );
  const dictaminadas = countAprobadas + countDenegadas;
  const tasaAprobacion = dictaminadas > 0 ? Math.round((countAprobadas / dictaminadas) * 100) : 0;
  const totalLiquidado = useMemo(() => {
    return historyRequests
      .filter((w) => isAprobada(w.status))
      .reduce((acc, w) => acc + ((w.totalBudget ?? w.estimatedCost) || 0), 0);
  }, [historyRequests]);

  const filtered = historyRequests.filter((w) => {
    const aprobada = isAprobada(w.status);
    const matchesFilter =
      statusFilter === 'all' ? true : statusFilter === 'aprobada' ? aprobada : !aprobada;

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      w.clientName.toLowerCase().includes(term) ||
      w.requestNumber.toLowerCase().includes(term) ||
      w.motorcycleModel.toLowerCase().includes(term) ||
      w.motorcyclePlate.toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-3 -mt-1.5 animate-fade-in pb-10">
      {/* 1. RESUMEN KPI MÓVIL DE LA MARCA */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-zinc-900 leading-tight">
                Historial & Calidad
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium">{brandName}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {historyRequests.length} {historyRequests.length === 1 ? 'dictamen' : 'dictámenes'}
          </span>
        </div>

        {/* METRICAS KPI CHIPS */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold uppercase text-zinc-500 block">Aprobación</span>
              <span className="text-lg font-black text-emerald-700 font-mono leading-tight">{tasaAprobacion}%</span>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold uppercase text-zinc-500 block">Total Cubierto</span>
              <span className="text-lg font-black text-blue-900 font-mono leading-tight">${totalLiquidado.toFixed(0)} <span className="text-[10px] font-normal">USD</span></span>
            </div>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="relative flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs">
          <Search className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, N° o modelo..."
            className="w-full bg-transparent text-xs font-medium text-zinc-900 placeholder:text-zinc-400 outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-zinc-400 hover:text-zinc-600 text-xs px-1 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* TABS DE ESTADO */}
        <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'
            }`}
          >
            Todas ({historyRequests.length})
          </button>
          <button
            onClick={() => setStatusFilter('aprobada')}
            className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
              statusFilter === 'aprobada' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-800'
            }`}
          >
            Aprobadas ({countAprobadas})
          </button>
          <button
            onClick={() => setStatusFilter('denegada')}
            className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
              statusFilter === 'denegada' ? 'bg-red-600 text-white shadow-2xs' : 'text-red-800'
            }`}
          >
            Denegadas ({countDenegadas})
          </button>
        </div>
      </div>

      {/* 2. LISTA DE SOLICITUDES DICTAMINADAS */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-zinc-200">
          <p className="text-xs font-bold text-zinc-700">Historial vacío</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {historyRequests.length === 0
              ? `No hay dictámenes emitidos para ${brandName}.`
              : 'No coinciden dictámenes con el filtro.'}
          </p>
        </div>
      ) : (
        filtered.map((w) => {
          const aprobada = isAprobada(w.status);
          return (
            <div
              key={w.id}
              onClick={() => onSelectWarranty && onSelectWarranty(w)}
              className={`bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-xs space-y-2 transition-all ${
                onSelectWarranty ? 'cursor-pointer hover:border-blue-400 active:scale-[0.99]' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-[10px] font-bold text-blue-700">{w.requestNumber}</span>
                  <h4 className="text-xs font-bold text-zinc-900">{w.clientName}</h4>
                  <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                    <Bike className="w-3 h-3 text-zinc-400" />
                    <span>{w.motorcycleBrand} {w.motorcycleModel}</span>
                  </p>
                </div>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                    aprobada ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {aprobada ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {aprobada ? 'APROBADA' : 'RECHAZADA'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-xl leading-relaxed border border-zinc-100">
                {w.garanteNotes || w.rejectionReason || 'Resolución técnica oficial de garantía.'}
              </p>
              {onSelectWarranty && (
                <div className="pt-1 flex items-center justify-end text-[11px] font-bold text-blue-600 gap-1">
                  <span>Ver Ficha Completa</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
