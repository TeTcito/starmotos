// src/components/desktop/garante/HistorialGarantiasDesktop.tsx
import React, { useState } from 'react';
import { History, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';

interface Props {
  historyRequests: WarrantyRequest[];
}

export const HistorialGarantiasDesktop: React.FC<Props> = ({ historyRequests }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aprobada' | 'rechazada' | 'completada'>('all');

  const filtered = historyRequests.filter((w) => {
    const matchesSearch =
      w.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.motorcycleModel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            <span>Historial de Dictámenes Emitidos por la Marca</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Registro auditable de garantías aprobadas, rechazadas y compensaciones técnicas.
          </p>
        </div>

        <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200">
          Dictaminadas: {historyRequests.length}
        </span>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por cliente, solicitud o modelo de moto..."
          className="flex-1 px-4 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
        />

        <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'all' ? 'bg-white shadow-xs text-zinc-900' : 'text-zinc-600'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('aprobada')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'aprobada' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-600'
            }`}
          >
            Aprobadas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rechazada')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'rechazada' ? 'bg-red-600 text-white shadow-xs' : 'text-zinc-600'
            }`}
          >
            Rechazadas
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map((w) => {
          const isAprobada = w.status === 'aprobada' || w.status === 'completada';
          return (
            <div
              key={w.id}
              className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {w.requestNumber}
                    </span>
                    <h3 className="text-sm font-bold text-zinc-900">
                      {w.motorcycleBrand} {w.motorcycleModel} — {w.clientName}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    C.I: {w.clientIdNumber} • Taller: {w.tallerOrigin} • Costo: ${w.estimatedCost?.toFixed(2)} USD
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                    isAprobada
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isAprobada ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {isAprobada ? 'APROBADA' : 'RECHAZADA'}
                </span>
              </div>

              <div className="mt-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs">
                <span className="font-bold text-zinc-700 block mb-0.5">Motivo Técnico Dictaminado:</span>
                <p className="text-zinc-600">
                  {w.garanteNotes || w.rejectionReason || 'Garantía auditada conforme a manual de servicio.'}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span>Fecha Dictamen: {w.approvedAt || w.rejectedAt || 'Registrada'}</span>
                <span>VIN: {w.motorcycleVin}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
