// src/components/CustomerViewMobile.tsx
import React from 'react';
import {
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  History,
  MessageCircle,
  MapPin,
  Phone,
  Calendar,
  Gauge,
  Fuel,
  Sparkles,
  Camera,
  Check,
  Maximize2,
} from 'lucide-react';
import { UseCustomerPortalReturn } from '../hooks/useCustomerPortal';
import { DamageSeverity, FuelLevel, ProgressStep, DiagnosticPhoto, PartItem, ServiceItem, DamageCheckItem, MaintenanceRecord, WarrantyItem } from '../types/customer';

interface Props {
  portal: UseCustomerPortalReturn;
}

export const CustomerViewMobile: React.FC<Props> = ({ portal }) => {
  const {
    portalData,
    activeTab,
    setActiveTab,
    setIsApprovalModalOpen,
    openPhotoModal,
    getWhatsAppLink,
  } = portal;

  const { vehicle, activeOrder, inspection, history, warranties } = portalData;
  const isQuotationPending = activeOrder.quotation.status === 'pendiente_aprobacion';
  const isReadyForPickup = activeOrder.status === 'lista_retiro';

  // Helper de severidad de daños
  const getSeverityBadge = (severity: DamageSeverity) => {
    switch (severity) {
      case 'leve':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">Leve</span>;
      case 'moderado':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Moderado</span>;
      case 'grave':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">Severo</span>;
    }
  };

  // Helper para nivel de combustible
  const renderFuelIndicator = (_level: FuelLevel) => {
    const levels: { key: FuelLevel; label: string; pct: number }[] = [
      { key: 'empty', label: 'E', pct: 10 },
      { key: 'quarter', label: '1/4', pct: 25 },
      { key: 'half', label: '1/2', pct: 50 },
      { key: 'three_quarters', label: '3/4', pct: 75 },
      { key: 'full', label: 'F', pct: 100 },
    ];
    return (
      <div className="flex items-center gap-1.5 w-full bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
        <Fuel className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-xs text-zinc-400 font-medium mr-1">Gasolina:</span>
        <div className="flex-1 flex gap-1 items-center">
          {levels.map((lvl) => {
            const active = vehicle.fuelPercentage >= lvl.pct;
            return (
              <div key={lvl.key} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`h-2.5 w-full rounded-sm transition-all ${
                    active ? 'bg-amber-500 shadow-sm shadow-amber-500/40' : 'bg-zinc-800'
                  }`}
                />
                <span className={`text-[9px] font-bold ${active ? 'text-amber-400' : 'text-zinc-600'}`}>
                  {lvl.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-36 font-sans antialiased">
      {/* 1. Header Estilo Aplicación Móvil */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 shadow-md">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/30">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-xs tracking-wider uppercase font-black text-white">STAR<span className="text-orange-500">MOTOS</span></span>
                <span className="text-[10px] text-zinc-400 block -mt-0.5">Portal de Clientes</span>
              </div>
            </div>

            {/* Badge de Sucursal */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full text-[11px] text-zinc-300">
              <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
              <span className="font-medium truncate max-w-[130px]">{activeOrder.branch.name.replace('StarMotos ', '')}</span>
            </div>
          </div>

          {/* Tarjeta de Vehículo con Matrícula Ecuatoriana */}
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/80 rounded-2xl p-3.5 border border-zinc-800/90 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-36 h-36 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wide">
                    {vehicle.brand}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {vehicle.displacement} • {vehicle.year}
                  </span>
                </div>
                <h1 className="text-base font-extrabold text-white truncate">
                  {vehicle.model}
                </h1>
                <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                  <span>OT: <strong className="text-zinc-200 font-mono">{activeOrder.otNumber}</strong></span>
                  <span>•</span>
                  <span>{vehicle.currentKm.toLocaleString()} km</span>
                </p>
              </div>

              {/* Placa Ecuatoriana Oficial */}
              <div className="shrink-0 flex flex-col items-center bg-white text-zinc-950 px-2.5 py-1 rounded-md border-2 border-zinc-300 shadow-md font-mono">
                <div className="flex items-center gap-1 w-full justify-center text-[7px] font-black tracking-widest text-zinc-800 uppercase border-b border-zinc-200 pb-0.5">
                  <span className="inline-block w-2.5 h-1.5 bg-gradient-to-r from-yellow-400 via-blue-600 to-red-600 rounded-[1px]" />
                  <span>ECUADOR</span>
                </div>
                <span className="text-sm font-black tracking-wider leading-none mt-1">
                  {vehicle.plate}
                </span>
              </div>
            </div>

            {/* Badge de Estado Actual de la OT */}
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isReadyForPickup ? 'bg-emerald-400' : isQuotationPending ? 'bg-amber-400' : 'bg-orange-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    isReadyForPickup ? 'bg-emerald-500' : isQuotationPending ? 'bg-amber-500' : 'bg-orange-500'
                  }`} />
                </div>
                <span className="text-xs font-semibold text-zinc-300">
                  {activeOrder.steps.find((s: ProgressStep) => s.current)?.label || 'En Proceso'}
                </span>
              </div>

              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isReadyForPickup
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isQuotationPending
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                {isReadyForPickup ? 'Listo' : isQuotationPending ? 'Requiere Acción' : 'Taller Activo'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Selector de Tabs Táctil */}
        <div className="flex px-3 border-t border-zinc-800 overflow-x-auto no-scrollbar gap-1 bg-zinc-950/80">
          <button
            onClick={() => setActiveTab('orden')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'orden'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Orden Actual</span>
            {isQuotationPending && (
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('inspeccion')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'inspeccion'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Inspección 360°</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded-full">5</span>
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'historial'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('garantias')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'garantias'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Garantías ({warranties.length})</span>
          </button>
        </div>
      </header>

      {/* 3. Contenido Principal según Tab Activa */}
      <main className="px-4 py-4 space-y-4">
        {/* ======================= TAB: ORDEN ACTUAL ======================= */}
        {activeTab === 'orden' && (
          <>
            {/* Banner Especial de Moto Lista */}
            {isReadyForPickup && (
              <div className="bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-900 border border-emerald-500/50 p-4 rounded-2xl shadow-xl animate-fade-in relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-emerald-400 uppercase tracking-wide">
                      ¡Tu moto está lista para retiro!
                    </h2>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      {activeOrder.pickupReadyNotice ||
                        `El trabajo ha finalizado con éxito en ${activeOrder.branch.name}. Puedes pasar a retirarla en nuestros horarios de atención.`}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={activeOrder.branch.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500 text-zinc-950 px-3 py-1.5 rounded-lg shadow-md hover:bg-emerald-400 transition"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Abrir en Google Maps</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fecha y Hora Estimada de Entrega */}
            <div className="bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Fecha Estimada de Entrega</span>
                  <span className="text-xs font-extrabold text-white">{activeOrder.estimatedDelivery}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 block">Ingreso</span>
                <span className="text-[11px] font-mono text-zinc-300">{activeOrder.entryDate}</span>
              </div>
            </div>

            {/* Timeline Vertical de Estados */}
            <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-xs font-black tracking-wider uppercase text-zinc-200 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  <span>Progreso del Taller</span>
                </h3>
                <span className="text-[10px] font-mono text-zinc-400">
                  Paso {activeOrder.steps.findIndex((s: ProgressStep) => s.current) + 1} de {activeOrder.steps.length}
                </span>
              </div>

              <div className="relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                {activeOrder.steps.map((step: ProgressStep) => (
                  <div key={step.id} className="relative group">
                    {/* Indicador de Nodo */}
                    <div
                      className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                        step.completed
                          ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/30'
                          : step.current
                          ? 'bg-orange-500 text-white font-bold ring-4 ring-orange-500/20 animate-pulse'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}
                    >
                      {step.completed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.current ? <Wrench className="w-3 h-3" /> : '•'}
                    </div>

                    <div className="ml-2">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-xs font-bold ${
                            step.current ? 'text-orange-400 text-sm' : step.completed ? 'text-zinc-200' : 'text-zinc-500'
                          }`}
                        >
                          {step.label}
                        </h4>
                        {step.timestamp && (
                          <span className="text-[10px] font-mono text-zinc-400">{step.timestamp}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Galería de Fotos del Diagnóstico Técnico */}
            {activeOrder.diagnosticPhotos.length > 0 && (
              <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-orange-500" />
                    <h3 className="text-xs font-black tracking-wider uppercase text-zinc-200">
                      Evidencia de Diagnóstico ({activeOrder.diagnosticPhotos.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-400">Toca para ampliar</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {activeOrder.diagnosticPhotos.map((photo: DiagnosticPhoto) => (
                    <div
                      key={photo.id}
                      onClick={() => openPhotoModal(photo.url, photo.title, photo.description)}
                      className="group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-video cursor-pointer hover:border-orange-500/50 transition shadow-md"
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2 flex flex-col justify-end">
                        <span className="text-[10px] font-bold text-white leading-tight line-clamp-1">
                          {photo.title}
                        </span>
                        <span className="text-[9px] text-orange-400 font-mono">{photo.uploadedAt}</span>
                      </div>
                      <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white opacity-80 group-hover:opacity-100 transition">
                        <Maximize2 className="w-3 h-3" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Nota del supervisor */}
                {activeOrder.supervisorObservations && (
                  <div className="mt-3 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-300">
                    <span className="text-[10px] uppercase font-bold text-orange-400 block mb-0.5">Nota del Jefe de Taller:</span>
                    <p className="italic text-zinc-300 leading-relaxed">"{activeOrder.supervisorObservations}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Tarjeta de Resumen de Presupuesto */}
            <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 shadow-lg">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-orange-500" />
                    <h3 className="text-xs font-black tracking-wider uppercase text-zinc-200">
                      Presupuesto de Trabajo
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Proforma: {activeOrder.quotation.quotationNumber}</span>
                </div>

                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                    isQuotationPending
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isQuotationPending ? 'Pendiente Aprobación' : 'Aprobado'}
                </span>
              </div>

              {/* Repuestos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <span>Repuestos y Fluidos ({activeOrder.quotation.parts.length})</span>
                  <span>${activeOrder.quotation.subtotalParts.toFixed(2)}</span>
                </div>
                <div className="space-y-1.5 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-850">
                  {activeOrder.quotation.parts.map((p: PartItem) => (
                    <div key={p.code} className="flex items-start justify-between text-xs py-0.5">
                      <div className="pr-2">
                        <span className="text-zinc-200 font-medium block leading-tight">{p.description}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">Cant: {p.quantity} × ${p.unitPrice.toFixed(2)}</span>
                      </div>
                      <span className="text-zinc-100 font-mono font-bold shrink-0">${p.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mano de Obra */}
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <span>Mano de Obra y Servicios ({activeOrder.quotation.services.length})</span>
                  <span>${activeOrder.quotation.subtotalServices.toFixed(2)}</span>
                </div>
                <div className="space-y-1.5 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-850">
                  {activeOrder.quotation.services.map((s: ServiceItem) => (
                    <div key={s.code} className="flex items-start justify-between text-xs py-0.5">
                      <div className="pr-2">
                        <span className="text-zinc-200 font-medium block leading-tight">{s.description}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{s.hours} horas técnicas</span>
                      </div>
                      <span className="text-zinc-100 font-mono font-bold shrink-0">${s.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales con IVA 15% */}
              <div className="mt-3.5 pt-3 border-t border-zinc-800 space-y-1 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal Trabajos:</span>
                  <span className="font-mono">${activeOrder.quotation.subtotal.toFixed(2)}</span>
                </div>
                {activeOrder.quotation.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Descuento Fidelidad:</span>
                    <span className="font-mono">-${activeOrder.quotation.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>IVA Ecuador (15%):</span>
                  <span className="font-mono">${activeOrder.quotation.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white pt-1.5 border-t border-zinc-800">
                  <span className="text-orange-400">Total a Pagar:</span>
                  <span className="font-mono text-base text-orange-400">
                    ${activeOrder.quotation.total.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {activeOrder.quotation.approvedAt && (
                <div className="mt-3 p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-[11px] text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Aprobado digitalmente el {activeOrder.quotation.approvedAt}</span>
                </div>
              )}
            </div>

            {/* Mecánico Asignado */}
            <div className="bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-800 flex items-center gap-3">
              <img
                src={activeOrder.mechanic.avatarUrl}
                alt={activeOrder.mechanic.name}
                className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-orange-400 block">Mecánico a Cargo</span>
                <h4 className="text-xs font-bold text-white truncate">{activeOrder.mechanic.name}</h4>
                <p className="text-[11px] text-zinc-400 truncate">{activeOrder.mechanic.specialty}</p>
              </div>
            </div>
          </>
        )}

        {/* ======================= TAB: INSPECCIÓN 360° ======================= */}
        {activeTab === 'inspeccion' && (
          <div className="space-y-4 animate-fade-in">
            {/* Medidor de Combustible y Odómetro */}
            <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 space-y-3">
              <h3 className="text-xs font-black tracking-wider uppercase text-zinc-200 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-orange-500" />
                <span>Estado Físico en Recepción</span>
              </h3>

              {renderFuelIndicator(vehicle.fuelLevel)}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">Kilometraje Check-in</span>
                  <span className="text-sm font-black text-white font-mono">{inspection.kmAtCheckin.toLocaleString()} KM</span>
                </div>
                <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">Asesor Receptor</span>
                  <span className="text-xs font-bold text-zinc-200 truncate block">{inspection.advisorName}</span>
                </div>
              </div>

              {/* Pertenencias Recibidas */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-300">
                <span className="flex items-center gap-1">
                  <Check className={`w-3.5 h-3.5 ${inspection.documentsReceived ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  Documentos
                </span>
                <span className="flex items-center gap-1">
                  <Check className={`w-3.5 h-3.5 ${inspection.toolsReceived ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  Kit Herramientas
                </span>
                <span className="flex items-center gap-1">
                  <Check className={`w-3.5 h-3.5 ${inspection.helmetReceived ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  Casco
                </span>
              </div>
            </div>

            {/* 5 Fotos Check-in 360° */}
            <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black tracking-wider uppercase text-zinc-200 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-orange-500" />
                  <span>Fotos de Recepción (Check-in 360°)</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'frontal', title: 'Vista Frontal', url: inspection.photos.frontal },
                  { key: 'lateralIzq', title: 'Lateral Izquierdo', url: inspection.photos.lateralIzq },
                  { key: 'lateralDer', title: 'Lateral Derecho', url: inspection.photos.lateralDer },
                  { key: 'trasera', title: 'Vista Trasera', url: inspection.photos.trasera },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => openPhotoModal(item.url, item.title, 'Registro fotográfico oficial de ingreso')}
                    className="group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-video cursor-pointer"
                  >
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[10px] font-bold text-white">{item.title}</span>
                    </div>
                  </div>
                ))}

                {/* Tablero (Ancho Completo) */}
                <div
                  onClick={() => openPhotoModal(inspection.photos.tablero, 'Tablero & Kilometraje', 'Verificación de odómetro y testigos')}
                  className="col-span-2 group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 h-28 cursor-pointer"
                >
                  <img src={inspection.photos.tablero} alt="Tablero" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2.5">
                    <span className="text-xs font-bold text-white">Foto de Tablero & Odómetro</span>
                    <span className="text-[10px] font-mono text-orange-400 bg-black/60 px-2 py-0.5 rounded">
                      {inspection.kmAtCheckin.toLocaleString()} km
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist de Daños Previos */}
            <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black tracking-wider uppercase text-zinc-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Novedades / Daños Previos ({inspection.damages.length})</span>
                </h3>
              </div>

              <div className="space-y-2.5">
                {inspection.damages.map((dmg: DamageCheckItem) => (
                  <div key={dmg.id} className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-zinc-200 block">{dmg.zone}</span>
                        <span className="text-[11px] text-amber-400 font-medium">{dmg.damageType}</span>
                      </div>
                      {getSeverityBadge(dmg.severity)}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed bg-zinc-900/60 p-2 rounded-lg border border-zinc-850">
                      {dmg.advisorNotes}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Firma Digital del Cliente */}
            <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-orange-500" />
                <h3 className="text-xs font-black tracking-wider uppercase text-zinc-200">
                  Firma Digital de Recepción
                </h3>
              </div>
              <div className="bg-white rounded-xl p-3 flex flex-col items-center justify-center border border-zinc-300">
                <img src={inspection.signature.signatureUrl} alt="Firma Cliente" className="h-16 object-contain" />
                <div className="w-full pt-1.5 mt-1 border-t border-zinc-300 text-center text-zinc-900 font-sans">
                  <p className="text-xs font-extrabold">{inspection.signature.clientName}</p>
                  <p className="text-[10px] text-zinc-600 font-mono">C.I: {inspection.signature.identificationId}</p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 text-center font-mono">
                Registrado el {inspection.signature.timestamp}
              </p>
            </div>
          </div>
        )}

        {/* ======================= TAB: HISTORIAL ======================= */}
        {activeTab === 'historial' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black tracking-wider uppercase text-zinc-300 flex items-center gap-1.5">
                <History className="w-4 h-4 text-orange-500" />
                <span>Hoja de Vida de la Motocicleta</span>
              </h3>
              <span className="text-[10px] text-zinc-500">Mantenimientos Oficiales</span>
            </div>

            {history.map((record: MaintenanceRecord) => (
              <div key={record.id} className="bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-800 shadow-md">
                <div className="flex items-start justify-between border-b border-zinc-800 pb-2.5 mb-2.5">
                  <div>
                    <span className="text-xs font-black text-white">{record.date}</span>
                    <span className="text-[11px] text-orange-400 font-mono block">{record.mileage.toLocaleString()} km</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-emerald-400">${record.totalPaid.toFixed(2)}</span>
                    <span className="text-[10px] text-zinc-500 block font-mono">{record.invoiceNumber}</span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 mb-2">
                  <span className="text-zinc-500 block text-[10px]">Sucursal:</span>
                  <span className="text-zinc-300 font-medium">{record.branchName}</span>
                </div>

                <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850 space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Trabajos Realizados:</span>
                  <ul className="list-disc list-inside text-zinc-300 space-y-0.5 text-[11px]">
                    {record.workSummary.map((w: string, idx: number) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ======================= TAB: GARANTÍAS ======================= */}
        {activeTab === 'garantias' && (
          <div className="space-y-3 animate-fade-in">
            <div className="px-1">
              <h3 className="text-xs font-black tracking-wider uppercase text-zinc-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
                <span>Pólizas y Garantías Activas</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Respaldado por la red autorizada StarMotos Ecuador</p>
            </div>

            {warranties.map((war: WarrantyItem) => (
              <div key={war.id} className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 shadow-md">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-xs font-black text-white">{war.title}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Vigente
                  </span>
                </div>

                <p className="text-[11px] text-zinc-300 mb-3">{war.coverage}</p>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Fecha Vencimiento</span>
                    <span className="text-zinc-200 font-mono font-medium">{war.expirationDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Límite Kilometraje</span>
                    <span className="text-zinc-200 font-mono font-medium">{war.kmLimit.toLocaleString()} km</span>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-500 mt-2 italic">{war.terms}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 4. Barra Inferior Fija (Sticky Bottom Bar) - Prioridad Móvil */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 p-3 shadow-2xl safe-area-inset-bottom">
        <div className="max-w-md mx-auto space-y-2">
          {/* Si está pendiente de aprobación */}
          {isQuotationPending ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsApprovalModalOpen(true)}
                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-extrabold text-xs py-3 px-3 rounded-xl shadow-lg shadow-orange-600/30 active:scale-[0.98] transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprobar Presupuesto (${activeOrder.quotation.total.toFixed(2)})</span>
              </button>

              <a
                href={getWhatsAppLink('cotizacion')}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20 active:scale-95 transition"
                title="Consultar por WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          ) : isReadyForPickup ? (
            <div className="flex gap-2">
              <a
                href={activeOrder.branch.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 px-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-4 h-4" />
                <span>Cómo llegar a {activeOrder.branch.name.replace('StarMotos ', '')}</span>
              </a>

              <a
                href={getWhatsAppLink('retiro')}
                target="_blank"
                rel="noreferrer"
                className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-center"
                title="Avisar que voy en camino"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          ) : (
            <div className="flex gap-2">
              <a
                href={getWhatsAppLink('general')}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-100 font-bold text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Consultar Avance con {activeOrder.branch.name.replace('StarMotos ', '')}</span>
              </a>

              <a
                href={`tel:${activeOrder.branch.phone}`}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-orange-400 p-3 rounded-xl flex items-center justify-center"
                title="Llamar al taller"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Teléfono directo de la sucursal */}
          <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1">
            <span className="truncate">Sucursal: {activeOrder.branch.address}</span>
            <a href={`tel:${activeOrder.branch.phone}`} className="text-orange-400 font-mono font-medium hover:underline shrink-0">
              {activeOrder.branch.phone}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
