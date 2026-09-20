// src/components/desktop/ActiveOrderDesktop.tsx
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

export const ActiveOrderDesktop: React.FC<Props> = ({
  activeOrder,
  motorcycle,
  onOpenApprovalModal,
}) => {
  const isQuotationPending = activeOrder.quotation.status === 'pendiente_aprobacion';

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Seguimiento de Orden de Trabajo
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Estado de reparación en tiempo real, fases técnicas y cotización de mano de obra y repuestos
          </p>
        </div>

        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-xl shadow-sm ${
          isQuotationPending
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        }`}>
          {isQuotationPending ? 'Cotización Pendiente de Aprobación' : 'En Reparación Mecánica'}
        </span>
      </div>

      {/* Resumen OT Ancho Completo */}
      <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 flex items-center justify-between gap-6 w-full">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
              {motorcycle.brand} {motorcycle.model}
            </span>
            <span className="text-xs text-zinc-400 font-mono">({motorcycle.plate})</span>
          </div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <span>Orden N°:</span>
            <span className="font-mono text-blue-400">{activeOrder.otNumber}</span>
          </h3>
        </div>

        <div className="text-right">
          <span className="text-xs text-zinc-400 block">Fecha y Hora Estimada de Entrega:</span>
          <span className="text-base font-bold text-white font-mono">{activeOrder.estimatedDelivery}</span>
        </div>
      </div>

      {/* Stepper Panorámico Horizontal */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>Fases del Servicio Técnico</span>
        </h3>

        <div className="grid grid-cols-6 gap-3 w-full">
          {activeOrder.steps.map((step, idx) => (
            <div
              key={step.id}
              className={`rounded-2xl p-3.5 border transition-all ${
                step.current
                  ? 'bg-blue-600/15 border-blue-500 shadow-md'
                  : step.completed
                  ? 'bg-zinc-900 border-zinc-800'
                  : 'bg-zinc-900/40 border-zinc-900 opacity-50'
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-mono text-zinc-500 font-bold">0{idx + 1}</span>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                  step.completed
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : step.current
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {step.completed ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                </div>
              </div>
              <h4 className={`text-xs font-bold ${step.current ? 'text-white' : 'text-zinc-300'}`}>
                {step.shortLabel}
              </h4>
              <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Cotización en 2 Columnas Proporcionales */}
      <div className="grid grid-cols-3 gap-6 w-full pt-2">
        <div className="col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-red-500" />
            <span>Repuestos Seleccionados y Servicios</span>
          </h3>

          <div className="space-y-2">
            {activeOrder.quotation.parts.map((p) => (
              <div key={p.code} className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-white block text-sm">{p.description}</span>
                  <span className="text-xs text-zinc-400 font-mono mt-0.5 block">
                    Marca: {p.brand} • {p.quantity} unidad(es) × ${p.unitPrice.toFixed(2)}
                  </span>
                </div>
                <span className="font-mono font-bold text-white text-sm">${p.subtotal.toFixed(2)}</span>
              </div>
            ))}
            {activeOrder.quotation.services.map((s) => (
              <div key={s.code} className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-white block text-sm">{s.description}</span>
                  <span className="text-xs text-zinc-400 mt-0.5 block">
                    Mano de obra certificada ({s.hours} horas)
                  </span>
                </div>
                <span className="font-mono font-bold text-white text-sm">${s.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen Total */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              Total Proforma (IVA 15%)
            </h3>

            <div className="space-y-2 pt-3 border-t border-zinc-800 text-zinc-400 text-sm">
              <div className="flex justify-between">
                <span>Subtotal Partes:</span>
                <span className="font-mono text-zinc-200">${activeOrder.quotation.subtotalParts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mano de Obra:</span>
                <span className="font-mono text-zinc-200">${activeOrder.quotation.subtotalServices.toFixed(2)}</span>
              </div>
              {activeOrder.quotation.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Descuento fidelidad:</span>
                  <span className="font-mono">-${activeOrder.quotation.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>IVA 15%:</span>
                <span className="font-mono text-zinc-200">${activeOrder.quotation.taxAmount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-zinc-800 flex justify-between font-bold text-base text-white">
                <span>Total a Pagar:</span>
                <span className="font-mono text-blue-400 text-lg">${activeOrder.quotation.total.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          {isQuotationPending ? (
            <button
              onClick={onOpenApprovalModal}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Autorizar Presupuesto</span>
            </button>
          ) : (
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Presupuesto Aprobado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
