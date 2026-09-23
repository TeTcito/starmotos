// src/components/desktop/taller/OrdenesTallerDesktop.tsx
import React from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  ChevronRight,
  User,
  Calendar,
  PackageCheck,
} from 'lucide-react';
import { TallerOrder, WorkOrderStatus } from '../../../types/customer';

interface Props {
  orders: TallerOrder[];
  onUpdateOrderStatus: (orderId: string, nextStatus: WorkOrderStatus) => void;
}

const STATUS_FLOW: { id: WorkOrderStatus; label: string; color: string }[] = [
  { id: 'inicio', label: 'Inicio', color: 'bg-zinc-100 text-zinc-700' },
  { id: 'en_proceso', label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  { id: 'trabajando', label: 'Trabajando', color: 'bg-amber-100 text-amber-800' },
  { id: 'listo_para_entregar', label: 'Listo para Entregar', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'entregado', label: 'Entregado', color: 'bg-zinc-800 text-white' },
];

export const OrdenesTallerDesktop: React.FC<Props> = ({ orders, onUpdateOrderStatus }) => {
  const getNextStatus = (current: WorkOrderStatus): WorkOrderStatus | null => {
    const ids = STATUS_FLOW.map((s) => s.id);
    const idx = ids.indexOf(current);
    if (idx >= 0 && idx < ids.length - 1) {
      return ids[idx + 1];
    }
    return null;
  };

  // Separate active from delivered
  const activeOrders = orders.filter((o) => o.status !== 'entregado' && o.status !== 'entregada');
  const deliveredOrders = orders.filter((o) => o.status === 'entregado' || o.status === 'entregada');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            <span>Órdenes de Trabajo en Taller</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Gestión de estado y seguimiento de órdenes de servicio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
            Activas: {activeOrders.length}
          </span>
          <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200">
            Total: {orders.length}
          </span>
        </div>
      </div>

      {/* Status legend */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FLOW.map((s, i) => (
          <React.Fragment key={s.id}>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${s.color}`}>
              {s.label}
            </span>
            {i < STATUS_FLOW.length - 1 && (
              <ChevronRight className="w-3 h-3 text-zinc-300" />
            )}
          </React.Fragment>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <Wrench className="w-12 h-12 text-zinc-200" />
          <p className="text-sm font-bold text-zinc-400">Sin órdenes de trabajo</p>
          <p className="text-xs text-zinc-400 max-w-sm">
            Las órdenes se generan automáticamente al completar un alistamiento.
          </p>
        </div>
      )}

      {/* Active orders grid */}
      {activeOrders.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {activeOrders.map((ord) => {
            const nextStatus = getNextStatus(ord.status);
            const currentStageObj = STATUS_FLOW.find((s) => s.id === ord.status);
            const nextObj = nextStatus ? STATUS_FLOW.find((s) => s.id === nextStatus) : null;

            return (
              <div
                key={ord.id}
                className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs hover:border-blue-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {ord.otNumber}
                      </span>
                      <h3 className="text-sm font-bold text-zinc-900 mt-1">
                        {ord.motorcycleInfo}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Placa: <strong className="text-zinc-800 font-mono">{ord.plate}</strong> • {ord.clientName}
                      </p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${currentStageObj?.color || 'bg-zinc-100 text-zinc-600'}`}>
                      {currentStageObj?.label || ord.status.toUpperCase()}
                    </span>
                  </div>

                  {ord.servicesSummary && (
                    <p className="text-[11px] text-zinc-500 mt-2">
                      <strong className="text-zinc-600">Servicios:</strong> {ord.servicesSummary}
                    </p>
                  )}

                  <div className="mt-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block">Técnico</span>
                      <span className="font-bold text-zinc-800 flex items-center gap-1">
                        <User className="w-3 h-3 text-blue-500" />
                        {ord.mechanicName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block">Fecha Ingreso</span>
                      <span className="font-medium text-zinc-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        {ord.entryDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status change button */}
                <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-mono">
                    Costo: <strong className="text-zinc-900 font-bold">${ord.totalCost.toFixed(2)}</strong>
                  </span>

                  {nextStatus && nextObj ? (
                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(ord.id, nextStatus)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <span>Pasar a: {nextObj.label}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Completada
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delivered orders (collapsed) */}
      {deliveredOrders.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-zinc-500 mb-3 flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-emerald-600" />
            Entregadas ({deliveredOrders.length})
          </h3>
          <div className="space-y-2">
            {deliveredOrders.map((ord) => (
              <div key={ord.id} className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] font-bold text-zinc-500 bg-zinc-200 px-2 py-0.5 rounded">
                    {ord.otNumber}
                  </span>
                  <span className="text-xs text-zinc-700 font-medium">{ord.clientName}</span>
                  <span className="text-xs text-zinc-400">— {ord.motorcycleInfo} ({ord.plate})</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Entregado
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
