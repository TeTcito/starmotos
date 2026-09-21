// src/components/mobile/garante/SolicitudesGaranteMobile.tsx
import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';

interface Props {
  pendingRequests: WarrantyRequest[];
  onOpenDecisionModal: (warranty: WarrantyRequest, type: 'aprobar' | 'rechazar') => void;
}

export const SolicitudesGaranteMobile: React.FC<Props> = ({
  pendingRequests,
  onOpenDecisionModal,
}) => {
  return (
    <div className="space-y-3">
      {pendingRequests.length === 0 ? (
        <div className="p-8 text-center bg-emerald-50 rounded-xl">
          <p className="text-xs font-bold text-emerald-800">¡Bandeja al día!</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">No hay solicitudes pendientes.</p>
        </div>
      ) : (
        pendingRequests.map((req) => (
          <div key={req.id} className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-xs space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[10px] font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">
                  {req.requestNumber}
                </span>
                <h4 className="text-xs font-bold text-zinc-900 mt-1">
                  {req.motorcycleBrand} {req.motorcycleModel}
                </h4>
                <p className="text-[10px] text-zinc-500">Cliente: {req.clientName} • {req.tallerOrigin}</p>
              </div>
              <span className="font-mono text-xs font-bold text-blue-700">${req.estimatedCost?.toFixed(2)}</span>
            </div>

            <p className="text-[11px] text-zinc-600 bg-zinc-50 p-2 rounded-lg leading-relaxed">
              {req.issueDescription}
            </p>

            <div className="pt-2 border-t border-zinc-100 flex gap-2">
              <button
                type="button"
                onClick={() => onOpenDecisionModal(req, 'rechazar')}
                className="flex-1 py-1.5 border border-red-200 text-red-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rechazar</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenDecisionModal(req, 'aprobar')}
                className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aprobar</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
