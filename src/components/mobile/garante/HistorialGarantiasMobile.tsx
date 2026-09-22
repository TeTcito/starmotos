// src/components/mobile/garante/HistorialGarantiasMobile.tsx
import React from 'react';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';

interface Props {
  historyRequests: WarrantyRequest[];
  onSelectWarranty?: (warranty: WarrantyRequest) => void;
}

export const HistorialGarantiasMobile: React.FC<Props> = ({
  historyRequests,
  onSelectWarranty,
}) => {
  return (
    <div className="space-y-2.5 -mt-1.5 animate-fade-in">
      {historyRequests.length === 0 ? (
        <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-zinc-200">
          <p className="text-xs font-bold text-zinc-700">Historial vacío</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">No hay dictámenes archivados.</p>
        </div>
      ) : (
        historyRequests.map((w) => {
          const isAprobada = w.status === 'aprobada' || w.status === 'completada' || w.status === 'aceptada';
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
                  <p className="text-[10px] text-zinc-500">{w.motorcycleBrand} {w.motorcycleModel}</p>
                </div>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                    isAprobada ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isAprobada ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {isAprobada ? 'APROBADA' : 'RECHAZADA'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-xl leading-relaxed border border-zinc-100">
                {w.garanteNotes || w.rejectionReason}
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
