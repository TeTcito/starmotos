// src/components/desktop/garante/HistorialGarantiasDesktop.tsx
import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Inbox,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { WarrantyRequest, GaranteProfile } from '../../../types/customer';
import {
  WarrantySquareCard,
  WarrantyFormView,
  getWarrantyStatusInfo,
} from '../../common/WarrantyModule';

interface Props {
  historyRequests: WarrantyRequest[];
  profile?: GaranteProfile;
}

export const HistorialGarantiasDesktop: React.FC<Props> = ({ historyRequests, profile }) => {
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aceptada' | 'denegada'>('all');

  const brandName = profile?.companyName || historyRequests[0]?.motorcycleBrand || 'Mi Marca';

  const isAprobada = (status: string) =>
    ['aceptada', 'aprobada', 'completada', 'en_proceso_aceptacion_2'].includes(status);
  const isRechazada = (status: string) =>
    ['denegada', 'rechazada'].includes(status);

  const countAceptadas = useMemo(
    () => historyRequests.filter((w) => isAprobada(w.status)).length,
    [historyRequests]
  );
  const countDenegadas = useMemo(
    () => historyRequests.filter((w) => isRechazada(w.status)).length,
    [historyRequests]
  );
  const dictaminadas = countAceptadas + countDenegadas;
  const tasaAprobacion = dictaminadas > 0 ? Math.round((countAceptadas / dictaminadas) * 100) : 0;
  const totalLiquidado = useMemo(() => {
    return historyRequests
      .filter((w) => isAprobada(w.status))
      .reduce((acc, w) => acc + ((w.totalBudget ?? w.estimatedCost) || 0), 0);
  }, [historyRequests]);

  // Filtrado de dictámenes por búsqueda y estado
  const filtered = historyRequests.filter((w) => {
    const sInfo = getWarrantyStatusInfo(w.status);
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'aceptada'
        ? sInfo.canonical === 'aceptada' || sInfo.canonical === 'completada'
        : sInfo.canonical === statusFilter;

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      w.clientName.toLowerCase().includes(term) ||
      w.requestNumber.toLowerCase().includes(term) ||
      w.motorcycleModel.toLowerCase().includes(term) ||
      w.motorcyclePlate.toLowerCase().includes(term) ||
      w.tallerOrigin.toLowerCase().includes(term);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. MODO: FICHA EN FORMATO FORMULARIO */}
      {selectedWarranty ? (
        <WarrantyFormView
          warranty={selectedWarranty}
          onBack={() => setSelectedWarranty(null)}
          viewerRole="garante"
        />
      ) : (
        /* 2. MODO: LISTADO EN TARJETAS */
        <div className="space-y-5">
          {/* HEADER PRINCIPAL */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight leading-tight flex items-center gap-2">
                    <span>Historial de Dictámenes</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      {brandName}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Registro auditable de garantías dictaminadas con resolución oficial de fábrica.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{countAceptadas} Aprobadas</span>
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-red-50 text-red-800 border border-red-200 flex items-center gap-1.5 shadow-2xs">
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>{countDenegadas} Denegadas</span>
                </span>
              </div>
            </div>

            {/* TARJETAS KPI DE LA MARCA */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                <div className="flex items-center justify-between text-zinc-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Tasa Aprobación</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-700 font-mono">{tasaAprobacion}%</span>
                  <span className="text-[10px] text-zinc-500">({countAceptadas} de {dictaminadas})</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                <div className="flex items-center justify-between text-zinc-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Monto Cubierto</span>
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-blue-900 font-mono">${totalLiquidado.toFixed(2)}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">USD</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div className="flex items-center justify-between text-zinc-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">Aprobadas</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-700 font-mono">{countAceptadas}</span>
                  <span className="text-[10px] text-emerald-600">coberturas válidas</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-100">
                <div className="flex items-center justify-between text-zinc-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-900">Denegadas</span>
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-red-700 font-mono">{countDenegadas}</span>
                  <span className="text-[10px] text-red-600">fuera de póliza</span>
                </div>
              </div>
            </div>

            {/* BÚSQUEDA Y FILTROS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100">
              <div className="relative flex-1 flex items-center bg-zinc-50 hover:bg-white focus-within:bg-white border border-zinc-300 focus-within:border-blue-600 rounded-xl px-3.5 py-2 transition-all">
                <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar en el historial por N° Solicitud, Cliente, Modelo o Taller..."
                  className="w-full bg-transparent text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-zinc-400 hover:text-zinc-600 text-xs font-bold px-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-zinc-900 shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Todas ({historyRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('aceptada')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    statusFilter === 'aceptada'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-emerald-800 hover:bg-emerald-100/50'
                  }`}
                >
                  Aceptadas ({countAceptadas})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('denegada')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    statusFilter === 'denegada'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'text-red-800 hover:bg-red-100/50'
                  }`}
                >
                  Denegadas ({countDenegadas})
                </button>
              </div>
            </div>
          </div>

          {/* GRID DE TARJETAS CUADRADAS */}
          {filtered.length === 0 ? (
            <div className="text-center py-14 bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl">
              <Inbox className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-zinc-700">No hay dictámenes en este filtro</h3>
              <p className="text-xs text-zinc-500 mt-1">
                {historyRequests.length === 0
                  ? `Las solicitudes autorizadas o denegadas de ${brandName} aparecerán registradas aquí automáticamente.`
                  : 'Modifique los términos de búsqueda o cambie de filtro.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((w) => (
                <WarrantySquareCard
                  key={w.id}
                  warranty={w}
                  onClick={() => setSelectedWarranty(w)}
                  viewerRole="garante"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
