// src/components/mobile/ActiveOrderMobile.tsx
import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Wrench,
  Check,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  ShieldCheck,
  Droplet,
  Gauge,
  MessageSquare,
  Camera,
  User,
  Star,
  Receipt,
  Eye,
  X,
  ArrowLeft,
} from 'lucide-react';
import { WorkOrder, MotorcycleClientData, TallerOrder } from '../../types/customer';
import { isValidMediaUrl } from '../../services/mediaStorage';

interface Props {
  activeOrder: WorkOrder;
  motorcycle: MotorcycleClientData;
  onOpenApprovalModal?: () => void;
  pendingRatingOrder?: TallerOrder | null;
  onOpenRatingModal?: () => void;
  isHistoryView?: boolean;
  onBack?: () => void;
}

const SERVICE_LABELS: Record<string, { label: string; desc: string }> = {
  alistamiento_pdi: {
    label: 'Alistamiento PDI',
    desc: 'Inspección técnica pre-entrega',
  },
  engrasado: {
    label: 'Engrasado Integral',
    desc: 'Lubricación de ejes y rodamientos',
  },
  mantenimiento: {
    label: 'Mantenimiento Preventivo',
    desc: 'Ajuste de motor, frenos y chasis',
  },
};

export const ActiveOrderMobile: React.FC<Props> = ({
  activeOrder,
  motorcycle,
  pendingRatingOrder,
  onOpenRatingModal,
  isHistoryView = false,
  onBack,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Pantalla cuando NO hay orden activa
  if (!activeOrder || !activeOrder.otNumber) {
    return (
      <div className="space-y-4 animate-fade-in pb-12">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-zinc-900">Orden de Trabajo</h2>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver</span>
            </button>
          )}
        </div>

        {/* Tarjeta de invitación a calificar orden entregada en móvil */}
        {pendingRatingOrder && (
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/70 border border-amber-300 rounded-2xl p-4 shadow-xs space-y-2.5 animate-slide-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Star className="w-5 h-5 fill-white" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase text-amber-700 block tracking-wider">
                  ¡Servicio Entregado!
                </span>
                <h4 className="text-xs font-bold text-amber-950 truncate">
                  Orden {pendingRatingOrder.otNumber}
                </h4>
              </div>
            </div>

            <p className="text-xs text-amber-900 leading-snug">
              ¿Cómo fue tu experiencia con el técnico <strong>{pendingRatingOrder.mechanicName}</strong>?
            </p>

            {onOpenRatingModal && (
              <button
                type="button"
                onClick={onOpenRatingModal}
                className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>Calificar Servicio Técnico</span>
              </button>
            )}
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl border border-dashed border-zinc-300 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Sin orden de trabajo activa</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              Tu motocicleta {motorcycle.brand} {motorcycle.model} ({motorcycle.plate}) no se encuentra actualmente en taller.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Vehículo operativo y al día</span>
          </div>
        </div>
      </div>
    );
  }

  const isDelivered = isHistoryView || activeOrder.status === 'entregado' || activeOrder.status === 'entregada';

  // Servicios
  const activeServices = activeOrder.serviciosRealizados && activeOrder.serviciosRealizados.length > 0
    ? activeOrder.serviciosRealizados
    : ['mantenimiento'];

  // Financiero
  const totalCost = activeOrder.valorServicio !== undefined ? Number(activeOrder.valorServicio) : (activeOrder.quotation?.total || 0);
  const abono = activeOrder.abono !== undefined ? Number(activeOrder.abono) : totalCost;
  const saldoPendiente = activeOrder.saldoPendiente !== undefined ? Number(activeOrder.saldoPendiente) : Math.max(0, totalCost - abono);

  // KM
  const kmIngreso = activeOrder.kilometrajeIngreso !== undefined ? Number(activeOrder.kilometrajeIngreso) : motorcycle.currentKm;
  const kmSiguiente = activeOrder.proximoMantenimientoKm || (kmIngreso > 0 ? kmIngreso + 3000 : 3000);

  // Fotos sanitizadas
  const rawFotos = activeOrder.fotosIngreso && activeOrder.fotosIngreso.length > 0
    ? activeOrder.fotosIngreso
    : activeOrder.diagnosticPhotos?.map((p) => p.url) || [];
  const fotos = rawFotos.filter(isValidMediaUrl);

  return (
    <div className="space-y-4 animate-fade-in pb-12 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 gap-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 cursor-pointer"
              title="Volver al historial"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Clock className={`w-5 h-5 ${isDelivered ? 'text-emerald-600' : 'text-blue-600'}`} />
          <h2 className="text-base font-bold text-zinc-900">
            {isHistoryView ? 'Detalle de Orden' : 'Orden de Trabajo'}
          </h2>
        </div>
        {isDelivered ? (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Servicio Entregado</span>
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-300">
            En Taller
          </span>
        )}
      </div>

      {/* Resumen OT */}
      <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-red-600 uppercase">
            {motorcycle.brand} {motorcycle.model}
          </span>
          <span className="text-[11px] text-zinc-600 font-mono font-bold bg-white px-2 py-0.5 rounded border border-zinc-200">
            {motorcycle.plate}
          </span>
        </div>
        <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
          <span>OT:</span>
          <span className="font-mono text-blue-600">{activeOrder.otNumber}</span>
        </h3>
        <p className="text-[11px] text-zinc-600 flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-blue-600" />
          <span>Ingreso: <strong className="text-zinc-900">{activeOrder.entryDate}</strong> {activeOrder.entryTime ? `(${activeOrder.entryTime})` : ''}</span>
        </p>
      </div>

      {/* Stepper de Fases Móvil */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${isDelivered ? 'text-emerald-600' : 'text-blue-600'}`} />
            <span>Progreso del Taller</span>
          </h3>
          {isDelivered && (
            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Entregada
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {activeOrder.steps.map((step, idx) => {
            const isStepGreen = isDelivered || step.completed;
            return (
              <div
                key={step.id}
                className={`rounded-xl p-2.5 border transition-all ${
                  isDelivered
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                    : step.current
                    ? 'bg-blue-50/80 border-blue-400 shadow-2xs'
                    : step.completed
                    ? 'bg-white border-zinc-200 shadow-2xs'
                    : 'bg-zinc-50 border-zinc-200 opacity-60'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[9px] font-mono font-bold ${isDelivered ? 'text-emerald-700' : 'text-zinc-500'}`}>0{idx + 1}</span>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                    isStepGreen
                      ? 'bg-emerald-600 text-white font-bold'
                      : step.current
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-zinc-200 text-zinc-600'
                  }`}>
                    {isStepGreen ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                  </div>
                </div>
                <h4 className={`text-xs font-bold truncate ${isDelivered ? 'text-emerald-950' : step.current ? 'text-blue-900' : 'text-zinc-800'}`}>
                  {step.shortLabel}
                </h4>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN SERVICIO Y COSTO ACORDADO EN ALISTAMIENTO (MÓVIL)                */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-1">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5 pb-1 border-b border-zinc-200">
          <Wrench className="w-3.5 h-3.5 text-blue-600" />
          <span>Detalle del Servicio y Costo</span>
        </h3>

        {/* Tarjeta: Técnico y Servicios */}
        <div className="bg-white rounded-xl p-3 border border-zinc-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Técnico Asignado</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Certificado</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 p-2 bg-zinc-50 rounded-lg border border-zinc-200/80">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-zinc-900 truncate">
                {activeOrder.tecnicoResponsable || activeOrder.mechanic?.name || 'Técnico Especialista'}
              </h4>
              <p className="text-[10px] text-zinc-500 truncate">
                Sede {activeOrder.branch?.name?.replace('StarMotos ', '') || 'Matriz'}
              </p>
            </div>
          </div>

          {/* Lista de Servicios */}
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
              Trabajo(s) en Ejecución
            </span>
            <div className="space-y-1">
              {activeServices.map((srvKey) => {
                const srvInfo = SERVICE_LABELS[srvKey] || {
                  label: srvKey.toUpperCase(),
                  desc: 'Servicio técnico especializado',
                };
                return (
                  <div
                    key={srvKey}
                    className="p-2 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-900 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold block text-xs">{srvInfo.label}</span>
                      <span className="text-[10px] text-blue-700">{srvInfo.desc}</span>
                    </div>
                    <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tarjeta: Control de Aceite y Kilometraje */}
        <div className="bg-white rounded-xl p-3 border border-zinc-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-1">
              <Droplet className="w-3 h-3 text-amber-600" />
              <span>Aceite y Odómetro</span>
            </span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
              activeOrder.estadoAceite === 'sin_aceite' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {activeOrder.estadoAceite === 'sin_aceite' ? 'Sin Aceite' : 'Con Aceite'}
            </span>
          </div>

          <div className="p-2 bg-amber-50/50 rounded-lg border border-amber-200 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-600">Tipo:</span>
              <span className="font-bold text-zinc-900 capitalize">{activeOrder.nivelAceite || 'Sintético'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Viscosidad:</span>
              <span className="font-mono font-bold text-amber-900">{activeOrder.tipoAceite || '20W-50'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-200">
              <span className="text-[9px] text-zinc-400 font-bold uppercase block">KM Ingreso</span>
              <span className="text-xs font-mono font-bold text-zinc-900">{kmIngreso.toLocaleString()} KM</span>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-[9px] text-emerald-800 font-bold uppercase block">KM Próximo</span>
              <span className="text-xs font-mono font-bold text-emerald-700">{kmSiguiente.toLocaleString()} KM</span>
            </div>
          </div>
        </div>

        {/* Tarjeta: Inversión, Abonos y Pagos */}
        <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-xs space-y-2">
          <span className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span>Resumen Financiero</span>
          </span>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Costo Total:</span>
              <span className="font-mono font-bold text-zinc-900">${totalCost.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Abonado / Pagado:</span>
              <span className="font-mono font-bold">${abono.toFixed(2)} USD</span>
            </div>
            <div className="pt-1.5 border-t border-zinc-200 flex justify-between font-bold text-sm">
              <span className="text-zinc-800">Saldo Pendiente:</span>
              <span className={`font-mono ${saldoPendiente > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                ${saldoPendiente.toFixed(2)} USD
              </span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Método: <strong className="text-zinc-800">{activeOrder.metodoPago || 'Efectivo'}</strong></span>
            {activeOrder.numeroFactura && (
              <span>Fac: <strong className="font-mono text-zinc-800">{activeOrder.numeroFactura}</strong></span>
            )}
          </div>
        </div>

        {/* Observaciones del Jefe de Taller */}
        <div className="bg-white rounded-xl p-3 border border-zinc-200 shadow-xs space-y-1.5">
          <span className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-blue-600" />
            <span>Observaciones del Jefe de Taller</span>
          </span>
          <p className="text-xs text-zinc-700 bg-zinc-50 p-2 rounded-lg border border-zinc-200 leading-relaxed font-medium">
            {activeOrder.observacionesTaller || activeOrder.supervisorObservations || 'Servicio técnico en ejecución según especificaciones de fábrica.'}
          </p>
        </div>

        {/* Fotos de Recepción */}
        <div className="bg-white rounded-xl p-3 border border-zinc-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
              <span>Fotos de Ingreso {fotos.length > 0 ? `(${fotos.length})` : ''}</span>
            </span>
          </div>

          {fotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {fotos.slice(0, 4).map((fUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPhoto(fUrl)}
                  className="relative aspect-video rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 cursor-pointer shadow-2xs"
                >
                  <img src={fUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 bg-zinc-50 rounded-xl border border-dashed border-zinc-300 text-center flex flex-col items-center justify-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center">
                <Camera className="w-4 h-4 text-zinc-400" />
              </div>
              <span className="text-xs font-semibold text-zinc-600">Sin fotografías registradas</span>
              <span className="text-[10px] text-zinc-400">Inspección visual conforme realizada al ingresar</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Visor de Foto a Tamaño Completo en Móvil */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 backdrop-blur-xs select-none"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-sm w-full bg-black rounded-xl overflow-hidden border border-zinc-700 shadow-2xl">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={selectedPhoto} alt="Foto" className="w-full max-h-[75vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
