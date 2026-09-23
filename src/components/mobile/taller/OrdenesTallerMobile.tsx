// src/components/mobile/taller/OrdenesTallerMobile.tsx
import React from 'react';
import { Wrench, ChevronRight, PackageCheck, Clock, User } from 'lucide-react';
import { TallerOrder, WorkOrderStatus } from '../../../types/customer';

interface Props {
  orders: TallerOrder[];
  onUpdateOrderStatus: (orderId: string, nextStatus: WorkOrderStatus) => void;
}

const STATUS_FLOW: { id: WorkOrderStatus; label: string; color: string }[] = [
  { id: 'inicio', label: 'Inicio', color: 'bg-zinc-100 text-zinc-700' },
  { id: 'en_proceso', label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  { id: 'trabajando', label: 'Trabajando', color: 'bg-amber-100 text-amber-800' },
  { id: 'listo_para_entregar', label: 'Listo p/ Entregar', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'entregado', label: 'Entregado', color: 'bg-zinc-800 text-white' },
];

export const OrdenesTallerMobile: React.FC<Props> = ({ orders, onUpdateOrderStatus }) => {
  const getNextStatus = (current: WorkOrderStatus): WorkOrderStatus | null => {
    const ids = STATUS_FLOW.map((s) => s.id);
    const idx = ids.indexOf(current);
    return idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null;
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <Wrench className="w-10 h-10 text-zinc-300" />
        <p className="text-sm font-bold text-zinc-400">Sin órdenes de trabajo activas</p>
        <p className="text-xs text-zinc-400 max-w-xs">
          Las órdenes se generan automáticamente al completar un alistamiento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
        {orders.length} orden{orders.length !== 1 ? 'es' : ''} en taller
      </p>
      {orders.map((ord) => {
        const next = getNextStatus(ord.status);
        const stageObj = STATUS_FLOW.find((s) => s.id === ord.status);
        const nextObj = next ? STATUS_FLOW.find((s) => s.id === next) : null;

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
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${stageObj?.color || 'bg-zinc-100 text-zinc-600'}`}>
                {stageObj?.label || ord.status.toUpperCase()}
              </span>
            </div>

            {ord.servicesSummary && (
              <p className="text-[10px] text-zinc-500">
                <strong className="text-zinc-600">Servicios:</strong> {ord.servicesSummary}
              </p>
            )}

            <div className="flex items-center gap-3 text-[10px] text-zinc-400">
              <span className="flex items-center gap-0.5">
                <User className="w-3 h-3" /> {ord.mechanicName}
              </span>
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" /> {ord.entryDate}
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-mono">${ord.totalCost.toFixed(2)}</span>
              {next && nextObj ? (
                <button
                  type="button"
                  onClick={() => onUpdateOrderStatus(ord.id, next)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>{nextObj.label}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : ord.status === 'entregado' ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <PackageCheck className="w-4 h-4" />
                  Entregado
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
