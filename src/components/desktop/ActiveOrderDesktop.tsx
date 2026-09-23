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
  if (!activeOrder || !activeOrder.otNumber) {
    return (
      <div className="w-full space-y-6 animate-fade-in pb-16">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                Seguimiento de Orden de Trabajo
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Estado de reparación en tiempo real, fases técnicas y cotización de mano de obra y repuestos
            </p>
          </div>
        </div>

        <div className="bg-white p-12 rounded-2xl border border-dashed border-zinc-300 text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <Wrench className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">No tienes una orden de trabajo activa</h3>
            <p className="text-sm text-zinc-500 mt-1.5 max-w-md mx-auto">
              Tu motocicleta <strong className="text-zinc-800">{motorcycle.brand} {motorcycle.model} ({motorcycle.plate})</strong> se encuentra fuera de taller y no presenta trabajos en curso ni presupuestos por autorizar.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Vehículo operativo y sin reparaciones pendientes</span>
          </div>
        </div>
      </div>
    );
  }

  const isQuotationPending = activeOrder.quotation.status === 'pendiente_aprobacion';

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              Seguimiento de Orden de Trabajo
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Estado de reparación en tiempo real, fases técnicas y cotización de mano de obra y repuestos
          </p>
        </div>

        <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-xl shadow-sm ${
          isQuotationPending
            ? 'bg-amber-50 text-amber-700 border border-amber-300'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
        }`}>
          {isQuotationPending ? 'Cotización Pendiente de Aprobación' : 'En Reparación Mecánica'}
        </span>
      </div>

      {/* Resumen OT Ancho Completo */}
      <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200 shadow-sm flex items-center justify-between gap-6 w-full">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
              {motorcycle.brand} {motorcycle.model}
            </span>
            <span className="text-xs text-zinc-500 font-mono">({motorcycle.plate})</span>
          </div>
          <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <span>Orden N°:</span>
            <span className="font-mono text-blue-600">{activeOrder.otNumber}</span>
          </h3>
        </div>

        <div className="text-right">
          <span className="text-xs text-zinc-500 block">Fecha y Hora Estimada de Entrega:</span>
          <span className="text-base font-bold text-zinc-900 font-mono">{activeOrder.estimatedDelivery}</span>
        </div>
      </div>

      {/* Stepper Panorámico Horizontal */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Fases del Servicio Técnico</span>
        </h3>

        <div className="grid grid-cols-6 gap-3 w-full">
          {activeOrder.steps.map((step, idx) => (
            <div
              key={step.id}
              className={`rounded-2xl p-3.5 border transition-all ${
                step.current
                  ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                  : step.completed
                  ? 'bg-white border-zinc-200 shadow-sm'
                  : 'bg-zinc-50/80 border-zinc-200 opacity-60'
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-mono text-zinc-500 font-bold">0{idx + 1}</span>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                  step.completed
                    ? 'bg-emerald-600 text-white font-bold'
                    : step.current
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-zinc-200 text-zinc-600'
                }`}>
                  {step.completed ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                </div>
              </div>
              <h4 className={`text-xs font-bold ${step.current ? 'text-blue-900' : 'text-zinc-800'}`}>
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
          <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-red-500" />
            <span>Repuestos Seleccionados y Servicios</span>
          </h3>

          <div className="space-y-2">
            {activeOrder.quotation.parts.map((p) => (
              <div key={p.code} className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-zinc-900 block text-sm">{p.description}</span>
                  <span className="text-xs text-zinc-500 font-mono mt-0.5 block">
                    Marca: {p.brand} • {p.quantity} unidad(es) × ${p.unitPrice.toFixed(2)}
                  </span>
                </div>
                <span className="font-mono font-bold text-zinc-900 text-sm">${p.subtotal.toFixed(2)}</span>
              </div>
            ))}
            {activeOrder.quotation.services.map((s) => (
              <div key={s.code} className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-zinc-900 block text-sm">{s.description}</span>
                  <span className="text-xs text-zinc-500 mt-0.5 block">
                    Mano de obra certificada ({s.hours} horas)
                  </span>
                </div>
                <span className="font-mono font-bold text-zinc-900 text-sm">${s.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen Total */}
        <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
              Total Proforma (IVA 15%)
            </h3>

            <div className="space-y-2 pt-3 border-t border-zinc-200 text-zinc-600 text-sm">
              <div className="flex justify-between">
                <span>Subtotal Partes:</span>
                <span className="font-mono text-zinc-900 font-medium">${activeOrder.quotation.subtotalParts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mano de Obra:</span>
                <span className="font-mono text-zinc-900 font-medium">${activeOrder.quotation.subtotalServices.toFixed(2)}</span>
              </div>
              {activeOrder.quotation.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Descuento fidelidad:</span>
                  <span className="font-mono">-${activeOrder.quotation.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>IVA 15%:</span>
                <span className="font-mono text-zinc-900 font-medium">${activeOrder.quotation.taxAmount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-zinc-200 flex justify-between font-bold text-base text-zinc-900">
                <span>Total a Pagar:</span>
                <span className="font-mono text-blue-600 text-lg">${activeOrder.quotation.total.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          {isQuotationPending ? (
            <button
              onClick={onOpenApprovalModal}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Autorizar Presupuesto</span>
            </button>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl text-center text-xs text-emerald-700 font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Presupuesto Aprobado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
