// src/components/mobile/garante/SolicitudesGaranteMobile.tsx
import React from 'react';
import { CheckCircle2, XCircle, Eye, ArrowRight } from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';

interface Props {
  pendingRequests: WarrantyRequest[];
  onOpenDecisionModal: (warranty: WarrantyRequest, type: 'aprobar' | 'rechazar') => void;
  onSelectWarranty: (warranty: WarrantyRequest) => void;
}

export const SolicitudesGaranteMobile: React.FC<Props> = ({
  pendingRequests,
  onOpenDecisionModal,
  onSelectWarranty,
}) => {
  return (
    <div className="space-y-3 -mt-1.5 animate-fade-in">
      {/* Resumen Superior */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
          Bandeja de Dictamen
        </span>
        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
          {pendingRequests.length} pendientes
        </span>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-emerald-800">¡Bandeja al día!</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            No hay solicitudes pendientes de dictamen en este momento.
          </p>
        </div>
      ) : (
        pendingRequests.map((req) => (
          <div
            key={req.id}
            onClick={() => onSelectWarranty(req)}
            className="bg-white border border-zinc-200 hover:border-blue-400 active:border-blue-500 rounded-2xl p-3.5 shadow-xs space-y-3 cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <span className="font-mono text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                  {req.requestNumber}
                </span>
                <h4 className="text-xs font-black text-zinc-900 mt-1 truncate">
                  {req.motorcycleBrand} {req.motorcycleModel}
                </h4>
                <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
                  Cliente: <span className="font-semibold text-zinc-700">{req.clientName}</span> • {req.tallerOrigin}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 inline-block">
                  ${req.estimatedCost?.toFixed(2)} USD
                </span>
                <span className="block text-[9px] text-zinc-400 mt-0.5 font-mono">
                  {req.motorcyclePlate || 'SIN PLACA'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-xl leading-relaxed border border-zinc-100 line-clamp-2">
              {req.issueDescription}
            </p>

            <div className="pt-2 border-t border-zinc-100 space-y-2">
              {/* Botón Principal para Ingresar a la Solicitud */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWarranty(req);
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ingresar a la Solicitud</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>

              {/* Acciones Rápidas */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDecisionModal(req, 'rechazar');
                  }}
                  className="flex-1 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Rechazar</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDecisionModal(req, 'aprobar');
                  }}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aprobar</span>
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
