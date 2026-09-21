// src/components/mobile/garante/HistorialGarantiasMobile.tsx
import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';

interface Props {
  historyRequests: WarrantyRequest[];
}

export const HistorialGarantiasMobile: React.FC<Props> = ({ historyRequests }) => {
  return (
    <div className="space-y-2.5">
      {historyRequests.map((w) => {
        const isAprobada = w.status === 'aprobada' || w.status === 'completada';
        return (
          <div key={w.id} className="bg-white border border-zinc-200 rounded-xl p-3 shadow-xs space-y-1.5">
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
            <p className="text-[11px] text-zinc-600 bg-zinc-50 p-2 rounded-lg">
              {w.garanteNotes || w.rejectionReason}
            </p>
          </div>
        );
      })}
    </div>
  );
};
