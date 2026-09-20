// src/components/mobile/ActiveOrderMobile.tsx
import React from 'react';
import {
  Clock,
  CheckCircle2,
  Wrench,
  Check,
} from 'lucide-react';
import { WorkOrder, MotorcycleClientData } from '../../types/customer';

interface Props {
  activeOrder: WorkOrder;
  motorcycle: MotorcycleClientData;
  onOpenApprovalModal: () => void;
}

export const ActiveOrderMobile: React.FC<Props> = ({
  activeOrder,
  motorcycle,
  onOpenApprovalModal,
}) => {
  const isQuotationPending = activeOrder.quotation.status === 'pendiente_aprobacion';

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Header sin contenedor */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-zinc-900">Orden de Trabajo</h2>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
          isQuotationPending
            ? 'bg-amber-50 text-amber-700 border border-amber-300'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
        }`}>
          {isQuotationPending ? 'Cotización Pendiente' : 'En Reparación'}
        </span>
      </div>

      {/* Resumen OT */}
      <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-red-600 uppercase">
            {motorcycle.brand} {motorcycle.model}
          </span>
          <span className="text-xs text-zinc-500 font-mono">({motorcycle.plate})</span>
        </div>
        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <span>OT:</span>
          <span className="font-mono text-blue-600">{activeOrder.otNumber}</span>
        </h3>
        <p className="text-xs text-zinc-600">
          Entrega estimada: <strong className="text-zinc-900">{activeOrder.estimatedDelivery}</strong>
        </p>
      </div>

      {/* Stepper de Fases Móvil */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Progreso del Taller</span>
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {activeOrder.steps.map((step, idx) => (
            <div
              key={step.id}
              className={`rounded-xl p-2.5 border transition-all ${
                step.current
                  ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                  : step.completed
                  ? 'bg-white border-zinc-200 shadow-sm'
                  : 'bg-zinc-50 border-zinc-200 opacity-60'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-mono text-zinc-500 font-bold">0{idx + 1}</span>
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                  step.completed
                    ? 'bg-emerald-600 text-white font-bold'
                    : step.current
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-zinc-200 text-zinc-600'
                }`}>
                  {step.completed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                </div>
              </div>
              <h4 className={`text-xs font-bold truncate ${step.current ? 'text-blue-900' : 'text-zinc-800'}`}>
                {step.shortLabel}
              </h4>
            </div>
          ))}
        </div>
      </div>

      {/* Repuestos y Mano de Obra */}
      <div className="space-y-2 pt-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-red-500" />
          <span>Repuestos y Servicios</span>
        </h3>

        <div className="space-y-1.5">
          {activeOrder.quotation.parts.map((p) => (
            <div key={p.code} className="bg-white p-2.5 rounded-xl border border-zinc-200 shadow-sm flex justify-between items-center text-xs">
              <div>
                <span className="font-medium text-zinc-900 block">{p.description}</span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {p.brand} • {p.quantity} × ${p.unitPrice.toFixed(2)}
                </span>
              </div>
              <span className="font-mono font-bold text-zinc-900">${p.subtotal.toFixed(2)}</span>
            </div>
          ))}
          {activeOrder.quotation.services.map((s) => (
            <div key={s.code} className="bg-white p-2.5 rounded-xl border border-zinc-200 shadow-sm flex justify-between items-center text-xs">
              <div>
                <span className="font-medium text-zinc-900 block">{s.description}</span>
                <span className="text-[10px] text-zinc-500">{s.hours} horas</span>
              </div>
              <span className="font-mono font-bold text-zinc-900">${s.subtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen Total y Aprobación */}
      <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 shadow-sm space-y-3">
        <div className="space-y-1.5 text-xs text-zinc-600">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono text-zinc-900">${activeOrder.quotation.subtotal.toFixed(2)}</span>
          </div>
          {activeOrder.quotation.discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Descuento:</span>
              <span className="font-mono">-${activeOrder.quotation.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>IVA 15%:</span>
            <span className="font-mono text-zinc-900">${activeOrder.quotation.taxAmount.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-sm text-zinc-900">
            <span>Total:</span>
            <span className="font-mono text-blue-600 text-base">${activeOrder.quotation.total.toFixed(2)} USD</span>
          </div>
        </div>

        {isQuotationPending ? (
          <button
            onClick={onOpenApprovalModal}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Aprobar Presupuesto</span>
          </button>
        ) : (
          <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl text-center text-xs text-emerald-700 font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Presupuesto Aprobado</span>
          </div>
        )}
      </div>
    </div>
  );
};
