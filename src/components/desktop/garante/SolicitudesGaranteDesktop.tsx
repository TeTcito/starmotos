// src/components/desktop/garante/SolicitudesGaranteDesktop.tsx
import React, { useState } from 'react';
import {
  Inbox,
  Clock,
  Search,
  Building2,
} from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';
import {
  WarrantySquareCard,
  WarrantyFormView,
  getWarrantyStatusInfo,
} from '../../common/WarrantyModule';

interface Props {
  pendingRequests: WarrantyRequest[];
  onOpenDecisionModal?: (warranty: WarrantyRequest, type: 'aprobar' | 'rechazar') => void;
  onApproveWarranty?: (id: string, notes: string) => void;
  onRejectWarranty?: (id: string, reason: string) => void;
}

export const SolicitudesGaranteDesktop: React.FC<Props> = ({
  pendingRequests,
  onApproveWarranty,
  onRejectWarranty,
}) => {
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrado reactivo de reclamos pendientes
  const filteredRequests = pendingRequests.filter((w) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      w.requestNumber.toLowerCase().includes(term) ||
      w.clientName.toLowerCase().includes(term) ||
      w.clientIdNumber.includes(term) ||
      w.motorcycleBrand.toLowerCase().includes(term) ||
      w.motorcycleModel.toLowerCase().includes(term) ||
      w.motorcyclePlate.toLowerCase().includes(term) ||
      w.tallerOrigin.toLowerCase().includes(term) ||
      w.issueDescription.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. MODO: FICHA EN FORMATO FORMULARIO PARA DICTAMEN OFICIAL */}
      {selectedWarranty ? (
        <WarrantyFormView
          warranty={selectedWarranty}
          onBack={() => setSelectedWarranty(null)}
          viewerRole="garante"
          onApproveByGarante={(id, notes) => {
            if (onApproveWarranty) onApproveWarranty(id, notes);
            setSelectedWarranty(null);
          }}
          onRejectByGarante={(id, reason) => {
            if (onRejectWarranty) onRejectWarranty(id, reason);
            setSelectedWarranty(null);
          }}
        />
      ) : (
        /* 2. MODO: LISTADO EN TARJETAS CUADRADAS */
        <div className="space-y-4">
          {/* Header Superior */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight leading-tight">
                    Auditoría de Garantías de la Marca (Garante Oficial)
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Revisión técnica de solicitudes enviadas por Matriz. Abra la ficha tipo formulario para aceptar o denegar.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-900 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 flex items-center gap-1.5 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>Pendientes por Dictaminar: {pendingRequests.length}</span>
                </span>
              </div>
            </div>

            {/* Barra de Búsqueda */}
            <div className="pt-3 border-t border-zinc-100">
              <div className="relative flex items-center bg-zinc-50 hover:bg-white focus-within:bg-white border border-zinc-300 focus-within:border-purple-600 rounded-xl px-3.5 py-2 transition-all">
                <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar solicitudes pendientes por N° Solicitud, Cédula, Cliente, Placa o Taller..."
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
            </div>
          </div>

          {/* GRID DE TARJETAS CUADRADAS */}
          {filteredRequests.length === 0 ? (
            <div className="text-center py-14 bg-emerald-50/40 border border-dashed border-emerald-300 rounded-2xl">
              <Inbox className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-emerald-950">¡Bandeja de dictamen al día!</h3>
              <p className="text-xs text-emerald-800 mt-1">
                No hay solicitudes de garantía en estado "En Proceso" pendientes de resolución en este momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRequests.map((req) => (
                <WarrantySquareCard
                  key={req.id}
                  warranty={req}
                  onClick={() => setSelectedWarranty(req)}
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
