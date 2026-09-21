// src/components/mobile/taller/OrdenesTallerMobile.tsx
import React from 'react';
import { Wrench, Clock, ChevronRight } from 'lucide-react';
import { TallerOrder, WorkOrderStatus } from '../../../types/customer';

interface Props {
  orders: TallerOrder[];
  onUpdateOrderStatus: (orderId: string, nextStatus: WorkOrderStatus) => void;
}

export const OrdenesTallerMobile: React.FC<Props> = ({ orders, onUpdateOrderStatus }) => {
  const getNextStatus = (current: WorkOrderStatus): WorkOrderStatus | null => {
    const list: WorkOrderStatus[] = [
      'recepcion',
      'diagnostico',
      'cotizacion_pendiente',
      'en_reparacion',
      'control_calidad',
      'lista_retiro',
      'entregada',
    ];
    const idx = list.indexOf(current);
    return idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  };

  return (
    <div className="space-y-3">
      {orders.map((ord) => {
        const next = getNextStatus(ord.status);
        return (
          <div key={ord.id} className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-xs space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  {ord.otNumber}
                </span>
                <h4 className="text-xs font-bold text-zinc-900 mt-1">{ord.motorcycleInfo}</h4>
                <p className="text-[11px] text-zinc-500 font-mono">Placa: {ord.plate} • {ord.clientName}</p>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {ord.status.toUpperCase()}
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono">${ord.totalCost.toFixed(2)}</span>
              {next && (
                <button
                  type="button"
                  onClick={() => onUpdateOrderStatus(ord.id, next)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <span>Avanzar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
