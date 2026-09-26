// src/components/desktop/ActiveOrderDesktop.tsx
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
  AlertCircle,
  Eye,
  X,
  ArrowLeft,
} from 'lucide-react';
import { WorkOrder, MotorcycleClientData, TallerOrder } from '../../types/customer';
import { isValidMediaUrl } from '../../services/mediaStorage';

interface Props {
  activeOrder: WorkOrder;
  motorcycle: MotorcycleClientData;
  activeOrders?: WorkOrder[];
  selectedOrderIndex?: number;
  onSelectOrder?: (index: number) => void;
  onOpenApprovalModal?: () => void;
  pendingRatingOrder?: TallerOrder | null;
  onOpenRatingModal?: () => void;
  isHistoryView?: boolean;
  onBack?: () => void;
}

const SERVICE_LABELS: Record<string, { label: string; desc: string; badgeBg: string }> = {
  alistamiento_pdi: {
    label: 'Alistamiento PDI',
    desc: 'Inspección técnica de pre-entrega oficial',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  engrasado: {
    label: 'Engrasado Integral',
    desc: 'Lubricación de chasis, ejes y rodamientos',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  mantenimiento: {
    label: 'Mantenimiento Preventivo',
    desc: 'Regulación de motor, frenos y pernos',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

export const ActiveOrderDesktop: React.FC<Props> = ({
  activeOrder,
  motorcycle,
  activeOrders,
  selectedOrderIndex,
  onSelectOrder,
  pendingRatingOrder,
  onOpenRatingModal,
  isHistoryView = false,
  onBack,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Pantalla cuando NO hay orden de trabajo activa
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
              Estado de servicio técnico en tiempo real, técnico asignado y costos acordados
            </p>
          </div>
        </div>

        {/* Tarjeta de invitación a calificar si la orden fue entregada recientemente */}
        {pendingRatingOrder && (
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-6 max-w-3xl mx-auto animate-slide-in">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Star className="w-6 h-6 fill-white" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">
                  Servicio Finalizado y Entregado
                </span>
                <h3 className="text-sm font-black text-amber-950">
                  ¡Tu orden {pendingRatingOrder.otNumber} fue entregada con éxito!
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  ¿Cómo fue la atención del técnico <strong>{pendingRatingOrder.mechanicName}</strong>? Tu opinión ayuda a reconocer el buen trabajo.
                </p>
              </div>
            </div>

            {onOpenRatingModal && (
              <button
                type="button"
                onClick={onOpenRatingModal}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/25 transition shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Star className="w-4 h-4 fill-white" />
                <span>Calificar Servicio</span>
              </button>
            )}
          </div>
        )}

        <div className="bg-white p-12 rounded-2xl border border-dashed border-zinc-300 text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <Wrench className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">No tienes una orden de trabajo activa</h3>
            <p className="text-sm text-zinc-500 mt-1.5 max-w-md mx-auto">
              Tu motocicleta <strong className="text-zinc-800">{motorcycle.brand} {motorcycle.model} ({motorcycle.plate})</strong> se encuentra fuera de taller y no presenta trabajos en curso.
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

  const isDelivered = isHistoryView || activeOrder.status === 'entregado' || activeOrder.status === 'entregada';

  // Servicios realizados
  const activeServices = activeOrder.serviciosRealizados && activeOrder.serviciosRealizados.length > 0
    ? activeOrder.serviciosRealizados
    : ['mantenimiento'];

  // Total invertido y saldo
  const totalCost = activeOrder.valorServicio !== undefined ? Number(activeOrder.valorServicio) : (activeOrder.quotation?.total || 0);
  const abono = activeOrder.abono !== undefined ? Number(activeOrder.abono) : totalCost;
  const saldoPendiente = activeOrder.saldoPendiente !== undefined ? Number(activeOrder.saldoPendiente) : Math.max(0, totalCost - abono);

  // Kilometraje de ingreso y sugerido
  const kmIngreso = activeOrder.kilometrajeIngreso !== undefined ? Number(activeOrder.kilometrajeIngreso) : motorcycle.currentKm;
  const kmSiguiente = activeOrder.proximoMantenimientoKm || (kmIngreso > 0 ? kmIngreso + 3000 : 3000);

  // Fotos de ingreso sanitizadas
  const rawFotos = activeOrder.fotosIngreso && activeOrder.fotosIngreso.length > 0
    ? activeOrder.fotosIngreso
    : activeOrder.diagnosticPhotos?.map((p) => p.url) || [];
  const fotos = rawFotos.filter(isValidMediaUrl);

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <Clock className={`w-6 h-6 ${isDelivered ? 'text-emerald-600' : 'text-blue-600'}`} />
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              {isHistoryView ? 'Detalle de Orden de Trabajo (Historial)' : 'Seguimiento de Orden de Trabajo'}
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {isDelivered
              ? 'Expediente histórico del servicio técnico finalizado y entregado con conformidad'
              : 'Estado técnico en tiempo real, técnico asignado y condiciones acordadas en alistamiento'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-600" />
              <span>Volver al Historial</span>
            </button>
          )}

          {isDelivered ? (
            <span className="text-xs font-black uppercase px-3.5 py-1.5 rounded-xl shadow-xs bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Servicio Entregado</span>
            </span>
          ) : (
            <span className="text-xs font-bold uppercase px-3 py-1.5 rounded-xl shadow-xs bg-blue-50 text-blue-700 border border-blue-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>En Proceso de Taller</span>
            </span>
          )}
        </div>
      </div>

      {/* Selector de Órdenes Activas si hay más de 1 orden en curso */}
      {!isHistoryView && activeOrders && activeOrders.length > 1 && (
        <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-indigo-50/70 border border-blue-200/90 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              <span className="text-xs font-black text-blue-950 uppercase tracking-wider">
                Órdenes en Taller ({activeOrders.length})
              </span>
              <span className="text-[11px] text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full font-bold">
                Activas / En curso
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 font-medium">
              Selecciona una orden para ver su estado y avances
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {activeOrders.map((ord, idx) => {
              const isSelected = (selectedOrderIndex !== undefined ? selectedOrderIndex : 0) === idx;
              const total = ord.valorServicio || ord.quotation?.total || 0;
              const statusMap: Record<string, { label: string; color: string; dotColor: string }> = {
                inicio: { label: 'Inicio', color: 'bg-zinc-100 text-zinc-700 border-zinc-300', dotColor: 'bg-zinc-400' },
                en_proceso: { label: 'En Proceso', color: 'bg-blue-100 text-blue-800 border-blue-200', dotColor: 'bg-blue-500' },
                trabajando: { label: 'Trabajando', color: 'bg-amber-100 text-amber-800 border-amber-200', dotColor: 'bg-amber-500' },
                listo_para_entregar: { label: 'Listo Retiro', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dotColor: 'bg-emerald-500' },
              };
              const statusInfo = statusMap[ord.status] || { label: ord.status, color: 'bg-blue-50 text-blue-700 border-blue-200', dotColor: 'bg-blue-500' };

              return (
                <button
                  key={ord.otNumber || idx}
                  type="button"
                  onClick={() => onSelectOrder && onSelectOrder(idx)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl border text-left transition cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/30'
                      : 'bg-white hover:bg-blue-50/60 border-zinc-200/90 text-zinc-800 hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-black ${isSelected ? 'text-white' : 'text-blue-700'}`}>
                        {ord.otNumber || `Orden ${idx + 1}`}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        isSelected ? 'bg-white/20 text-white border-white/30' : statusInfo.color
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white animate-pulse' : statusInfo.dotColor}`} />
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] truncate max-w-[170px] ${isSelected ? 'text-blue-100' : 'text-zinc-500'}`}>
                        {ord.clientReason || 'Servicio Técnico'}
                      </span>
                      <span className={`text-[11px] font-mono font-black ${isSelected ? 'text-white' : 'text-zinc-800'}`}>
                        ${Number(total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumen OT Ancho Completo */}
      <div className="bg-gradient-to-r from-zinc-50 via-blue-50/20 to-zinc-50 rounded-2xl p-5 border border-zinc-200 shadow-xs flex items-center justify-between gap-6 w-full">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
              {motorcycle.brand} {motorcycle.model}
            </span>
            <span className="text-xs text-zinc-600 font-mono font-bold bg-white px-2 py-0.5 rounded border border-zinc-200">
              Placa: {motorcycle.plate}
            </span>
            {motorcycle.color && (
              <span className="text-xs text-zinc-500">
                • Color: {motorcycle.color}
              </span>
            )}
          </div>
          <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <span>Orden de Trabajo N°:</span>
            <span className="font-mono text-blue-600">{activeOrder.otNumber}</span>
          </h3>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-zinc-500 block uppercase font-bold tracking-wider">
            Fecha y Hora de Ingreso:
          </span>
          <span className="text-sm font-bold text-zinc-900 font-mono flex items-center gap-1.5 justify-end mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{activeOrder.entryDate}</span>
            {activeOrder.entryTime && (
              <span className="text-zinc-500">a las {activeOrder.entryTime}</span>
            )}
          </span>
        </div>
      </div>

      {/* Stepper Panorámico Horizontal de 5 Fases */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isDelivered ? 'text-emerald-600' : 'text-blue-600'}`} />
            <span>Fases del Servicio Técnico</span>
          </h3>
          {isDelivered && (
            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Todas las etapas completadas
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
          {activeOrder.steps.map((step, idx) => {
            const isStepGreen = isDelivered || step.completed;
            return (
              <div
                key={step.id}
                className={`rounded-2xl p-3.5 border transition-all ${
                  isDelivered
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                    : step.current
                    ? 'bg-blue-50/80 border-blue-400 shadow-sm'
                    : step.completed
                    ? 'bg-white border-zinc-200 shadow-2xs'
                    : 'bg-zinc-50/80 border-zinc-200 opacity-60'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-[11px] font-mono font-bold ${isDelivered ? 'text-emerald-700' : 'text-zinc-500'}`}>0{idx + 1}</span>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                    isStepGreen
                      ? 'bg-emerald-600 text-white font-bold'
                      : step.current
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-zinc-200 text-zinc-600'
                  }`}>
                    {isStepGreen ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </div>
                </div>
                <h4 className={`text-xs font-bold ${isDelivered ? 'text-emerald-950 font-black' : step.current ? 'text-blue-900' : 'text-zinc-800'}`}>
                  {step.shortLabel}
                </h4>
                <p className={`text-[10px] mt-1 line-clamp-2 ${isDelivered ? 'text-emerald-800/80' : 'text-zinc-500'}`}>
                  {isDelivered && step.id === 'entregado' ? 'Entregada al cliente con conformidad.' : step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* APARTADO PRINCIPAL REAL: SERVICIO Y COSTO ACORDADO EN ALISTAMIENTO       */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
          <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            <span>Detalle del Servicio en Taller y Costos Acordados</span>
          </h3>
          <span className="text-[11px] text-zinc-500 font-medium">
            Registrado oficialmente por Jefatura de Taller
          </span>
        </div>

        {/* Grid de 3 Columnas Proporcionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Columna 1: Servicio y Técnico Responsable */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="text-[11px] font-black uppercase text-zinc-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Atención Técnica
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  Asignado
                </span>
              </div>

              {/* Técnico Asignado */}
              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">
                  Técnico que le atenderá
                </label>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 truncate">
                      {activeOrder.tecnicoResponsable || activeOrder.mechanic?.name || 'Técnico Especialista'}
                    </h4>
                    <span className="text-[10px] text-emerald-700 font-medium block truncate">
                      Mecánico Certificado StarMotos
                    </span>
                  </div>
                </div>
              </div>

              {/* Servicios a Realizar */}
              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">
                  Servicio(s) Especificado(s)
                </label>
                <div className="space-y-1.5">
                  {activeServices.map((srvKey) => {
                    const srvInfo = SERVICE_LABELS[srvKey] || {
                      label: srvKey.toUpperCase(),
                      desc: 'Servicio técnico especializado',
                      badgeBg: 'bg-zinc-100 text-zinc-800 border-zinc-200',
                    };
                    return (
                      <div
                        key={srvKey}
                        className={`p-2 rounded-xl border text-xs flex items-center justify-between ${srvInfo.badgeBg}`}
                      >
                        <div>
                          <span className="font-bold block text-xs">{srvInfo.label}</span>
                          <span className="text-[10px] opacity-80 block">{srvInfo.desc}</span>
                        </div>
                        <Check className="w-4 h-4 shrink-0 stroke-[3]" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sede y Origen */}
            <div className="pt-2 border-t border-zinc-100 text-[11px] text-zinc-500 space-y-1">
              <div className="flex justify-between">
                <span>Sede Taller:</span>
                <span className="font-bold text-zinc-800">{activeOrder.branch?.name?.replace('StarMotos ', '') || 'Matriz'}</span>
              </div>
              {activeOrder.origenIngreso && (
                <div className="flex justify-between">
                  <span>Procedencia:</span>
                  <span className="font-medium text-zinc-700 truncate max-w-[150px]">{activeOrder.origenIngreso}</span>
                </div>
              )}
            </div>
          </div>

          {/* Columna 2: Control de Aceite y Kilometrajes */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="text-[11px] font-black uppercase text-zinc-500 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-amber-600" />
                  Lubricación & Kilometraje
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                  Control
                </span>
              </div>

              {/* Control de Aceite */}
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Estado de Aceite</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                    activeOrder.estadoAceite === 'sin_aceite'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {activeOrder.estadoAceite === 'sin_aceite' ? 'Sin Aceite' : 'Con Aceite'}
                  </span>
                </div>

                <div className="pt-1.5 border-t border-amber-200/60 flex items-center justify-between text-xs">
                  <span className="text-zinc-600 font-medium">Tipo / Base:</span>
                  <span className="font-bold text-zinc-900 capitalize">
                    {activeOrder.nivelAceite || 'Sintético'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 font-medium">Viscosidad / Grado:</span>
                  <span className="font-mono font-black text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                    {activeOrder.tipoAceite || '20W-50'}
                  </span>
                </div>
              </div>

              {/* Kilometrajes: Ingreso vs Siguiente */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                    KM Recepción
                  </span>
                  <span className="text-xs font-mono font-black text-zinc-900 block mt-0.5">
                    {kmIngreso.toLocaleString()} KM
                  </span>
                  <span className="text-[9px] text-zinc-500">Odómetro al entrar</span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">
                    KM Sugerido
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-700 block mt-0.5">
                    {kmSiguiente.toLocaleString()} KM
                  </span>
                  <span className="text-[9px] text-emerald-700">Próximo servicio</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-100 italic">
              * El próximo mantenimiento sugerido conserva la garantía de fábrica.
            </p>
          </div>

          {/* Columna 3: Inversión, Abonos y Documentos */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="text-[11px] font-black uppercase text-zinc-500 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Inversión & Abonos
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  saldoPendiente === 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {saldoPendiente === 0 ? 'Al Día' : 'Saldo Pendiente'}
                </span>
              </div>

              {/* Valores Financieros */}
              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Costo Total Invertido:</span>
                  <span className="font-mono font-bold text-zinc-900 text-sm">
                    ${totalCost.toFixed(2)} USD
                  </span>
                </div>

                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Abonado / Pagado:
                  </span>
                  <span className="font-mono font-bold">
                    ${abono.toFixed(2)} USD
                  </span>
                </div>

                <div className="pt-1.5 border-t border-zinc-200 flex justify-between font-bold">
                  <span className="text-zinc-700">Saldo al Retirar:</span>
                  <span className={`font-mono text-sm ${saldoPendiente > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    ${saldoPendiente.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Método de Pago y Facturación */}
              <div className="space-y-1.5 text-xs text-zinc-600">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1 text-[11px]">
                    <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                    Método de Pago:
                  </span>
                  <span className="font-bold text-zinc-800 text-[11px]">
                    {activeOrder.metodoPago || 'Efectivo'}
                  </span>
                </div>

                {activeOrder.numeroFactura && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Receipt className="w-3.5 h-3.5 text-zinc-400" />
                      N° Factura:
                    </span>
                    <span className="font-mono font-bold text-zinc-800 text-[11px]">
                      {activeOrder.numeroFactura}
                    </span>
                  </div>
                )}

                {activeOrder.numeroTicket && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-[11px]">
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      Ticket Físico:
                    </span>
                    <span className="font-mono font-bold text-blue-700 text-[11px]">
                      {activeOrder.numeroTicket}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-center gap-2 text-[10px] text-zinc-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Garantía de servicio técnico y repuestos oficiales StarMotos.</span>
            </div>
          </div>
        </div>

        {/* Fila Completa: Observaciones del Jefe de Taller & Fotos de Recepción */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {/* Observaciones del Jefe de Taller */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Observaciones del Jefe de Taller</span>
            </h4>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-700 leading-relaxed font-medium">
              {activeOrder.observacionesTaller || activeOrder.supervisorObservations || (
                <span className="text-zinc-400 italic">
                  Servicio en ejecución de acuerdo al protocolo técnico oficial de fábrica. Sin novedades críticas adicionales reportadas.
                </span>
              )}
            </div>
          </div>

          {/* Cómo ingresó la moto / Fotos de Inspección */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cómo Ingresó la Moto</span>
              </span>
              {fotos.length > 0 && (
                <span className="text-[10px] font-bold text-zinc-400 font-mono">
                  {fotos.length} foto{fotos.length > 1 ? 's' : ''}
                </span>
              )}
            </h4>

            {fotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {fotos.slice(0, 4).map((fUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(fUrl)}
                    className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 group bg-zinc-100 cursor-pointer shadow-2xs hover:opacity-90 transition"
                  >
                    <img src={fUrl} alt={`Recepción ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-zinc-50 rounded-xl border border-dashed border-zinc-300 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-zinc-400" />
                </div>
                <span className="text-xs font-semibold text-zinc-600">Sin fotografías registradas al ingreso</span>
                <span className="text-[10px] text-zinc-400">Inspección visual conforme realizada en elevador de servicio</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Visor de Foto a Tamaño Completo */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs select-none"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-2xl w-full bg-black rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedPhoto} alt="Foto de Inspección" className="w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
