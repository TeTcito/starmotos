// src/components/desktop/taller/OrdenesTallerDesktop.tsx
import React from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  User,
  Calendar,
} from 'lucide-react';
import { TallerOrder, WorkOrderStatus } from '../../../types/customer';

interface Props {
  orders: TallerOrder[];
  onUpdateOrderStatus: (orderId: string, nextStatus: WorkOrderStatus) => void;
}

export const OrdenesTallerDesktop: React.FC<Props> = ({ orders, onUpdateOrderStatus }) => {
  const statusFlow: { id: WorkOrderStatus; label: string; color: string }[] = [
    { id: 'recepcion', label: 'Recepción 360°', color: 'bg-zinc-100 text-zinc-700' },
    { id: 'diagnostico', label: 'Diagnóstico en Elevador', color: 'bg-blue-100 text-blue-800' },
    { id: 'cotizacion_pendiente', label: 'Cotización Presupuesto', color: 'bg-amber-100 text-amber-800' },
    { id: 'en_reparacion', label: 'En Reparación Mecánica', color: 'bg-purple-100 text-purple-800' },
    { id: 'control_calidad', label: 'Control Calidad & Dinamómetro', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'lista_retiro', label: 'Lista para Retiro', color: 'bg-emerald-100 text-emerald-800' },
    { id: 'entregada', label: 'Entregada al Cliente', color: 'bg-zinc-800 text-white' },
  ];

  const getNextStatus = (current: WorkOrderStatus): WorkOrderStatus | null => {
    const orderList: WorkOrderStatus[] = [
      'recepcion',
      'diagnostico',
      'cotizacion_pendiente',
      'en_reparacion',
      'control_calidad',
      'lista_retiro',
      'entregada',
    ];
    const idx = orderList.indexOf(current);
    if (idx >= 0 && idx < orderList.length - 1) {
      return orderList[idx + 1];
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            <span>Órdenes de Trabajo en Bahías de Taller</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Gestión técnica y avance de etapas de servicio en tiempo real.
          </p>
        </div>

        <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200">
          Total OTs en Curso: {orders.length}
        </span>
      </div>

      {/* Lista de Órdenes */}
      <div className="grid grid-cols-2 gap-4">
        {orders.map((ord) => {
          const nextStatus = getNextStatus(ord.status);
          const currentStageObj = statusFlow.find((s) => s.id === ord.status);

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
                      Placa: <strong className="text-zinc-800 font-mono">{ord.plate}</strong> • Cliente: {ord.clientName}
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${currentStageObj?.color}`}>
                    {currentStageObj?.label}
                  </span>
                </div>

                <div className="mt-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Mecánico Asignado</span>
                    <span className="font-bold text-zinc-800">{ord.mechanicName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Compromiso Entrega</span>
                    <span className="font-medium text-zinc-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      {ord.estimatedDelivery}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de Siguiente Etapa */}
              <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-mono">
                  Presupuesto: <strong className="text-zinc-900 font-bold">${ord.totalCost.toFixed(2)}</strong>
                </span>

                {nextStatus ? (
                  <button
                    type="button"
                    onClick={() => onUpdateOrderStatus(ord.id, nextStatus)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <span>Pasar a: {statusFlow.find((s) => s.id === nextStatus)?.label}</span>
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
    </div>
  );
};
