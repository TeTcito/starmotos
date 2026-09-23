// src/components/desktop/garante/HistorialGarantiasDesktop.tsx
import React, { useState } from 'react';
import { History, Search, Inbox, CheckCircle2, XCircle } from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';
import {
  WarrantySquareCard,
  WarrantyFormView,
  getWarrantyStatusInfo,
} from '../../common/WarrantyModule';

interface Props {
  historyRequests: WarrantyRequest[];
}

export const HistorialGarantiasDesktop: React.FC<Props> = ({ historyRequests }) => {
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aceptada' | 'denegada'>('all');

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

  const countAceptadas = historyRequests.filter((w) => {
    const c = getWarrantyStatusInfo(w.status).canonical;
    return c === 'aceptada' || c === 'completada';
  }).length;
  const countDenegadas = historyRequests.filter(
    (w) => getWarrantyStatusInfo(w.status).canonical === 'denegada'
  ).length;

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
        /* 2. MODO: LISTADO EN TARJETAS CUADRADAS */
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight leading-tight">
                    Historial de Dictámenes Emitidos por la Marca
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Registro auditable de garantías aprobadas y denegadas con resolución oficial.
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

            {/* Búsqueda y Filtros */}
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
              <p className="text-xs text-zinc-500 mt-1">Modifique los términos de búsqueda.</p>
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
