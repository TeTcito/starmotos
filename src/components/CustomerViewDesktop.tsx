// src/components/CustomerViewDesktop.tsx
import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  History,
  MessageCircle,
  MapPin,
  Phone,
  Printer,
  Calendar,
  Gauge,
  Fuel,
  Sparkles,
  Camera,
  Check,
  Maximize2,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Award,
  Download,
  Share2,
} from 'lucide-react';
import { UseCustomerPortalReturn } from '../hooks/useCustomerPortal';
import { DamageSeverity, FuelLevel } from '../types/customer';

interface Props {
  portal: UseCustomerPortalReturn;
}

export const CustomerViewDesktop: React.FC<Props> = ({ portal }) => {
  const {
    portalData,
    setIsApprovalModalOpen,
    openPhotoModal,
    getWhatsAppLink,
    handleDownloadProforma,
    quotationSummary,
  } = portal;

  const { vehicle, activeOrder, inspection, history, warranties } = portalData;
  const isQuotationPending = activeOrder.quotation.status === 'pendiente_aprobacion';
  const isReadyForPickup = activeOrder.status === 'lista_retiro';
  const isDelivered = activeOrder.status === 'entregada';

  // Pestaña en la columna central
  const [centerTab, setCenterTab] = useState<'diagnostico' | 'historial' | 'garantias'>('diagnostico');

  // Helper de severidad
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

  // Nivel de combustible
  const renderFuelMeter = (level: FuelLevel) => {
    const levels: { key: FuelLevel; label: string; pct: number }[] = [
      { key: 'empty', label: 'E', pct: 10 },
      { key: 'quarter', label: '1/4', pct: 25 },
      { key: 'half', label: '1/2', pct: 50 },
      { key: 'three_quarters', label: '3/4', pct: 75 },
      { key: 'full', label: 'F', pct: 100 },
    ];
    return (
      <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-850">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-zinc-400 font-medium flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5 text-amber-500" />
            Nivel de Combustible:
          </span>
          <span className="font-mono text-amber-400 font-bold">{vehicle.fuelPercentage}%</span>
        </div>
        <div className="flex gap-1.5">
          {levels.map((lvl) => {
            const active = vehicle.fuelPercentage >= lvl.pct;
            return (
              <div key={lvl.key} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`h-2.5 w-full rounded transition-all ${
                    active ? 'bg-amber-500 shadow-sm shadow-amber-500/40' : 'bg-zinc-800'
                  }`}
                />
                <span className={`text-[10px] font-mono font-bold ${active ? 'text-amber-400' : 'text-zinc-600'}`}>
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* 1. Barra de Navegación Superior */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 shadow-md">
        <div className="max-w-[1600px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/30">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-widest uppercase text-white">STAR<span className="text-orange-500">MOTOS</span></span>
                <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Portal Clientes
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">Seguimiento en Vivo & Hoja de Vida Vehicular</span>
            </div>
          </div>

          {/* Información de Sucursal y Placa */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs">
              <MapPin className="w-4 h-4 text-orange-500" />
              <div>
                <span className="font-bold text-white block">{activeOrder.branch.name}</span>
                <span className="text-[10px] text-zinc-400">{activeOrder.branch.city}</span>
              </div>
            </div>

            {/* Matrícula Ecuatoriana */}
            <div className="flex flex-col items-center bg-white text-zinc-950 px-3 py-1 rounded-lg border-2 border-zinc-300 shadow-md font-mono">
              <div className="flex items-center gap-1.5 w-full justify-center text-[8px] font-black tracking-widest text-zinc-800 uppercase border-b border-zinc-200 pb-0.5">
                <span className="inline-block w-3 h-1.5 bg-gradient-to-r from-yellow-400 via-blue-600 to-red-600 rounded-[1px]" />
                <span>ECUADOR</span>
              </div>
              <span className="text-base font-black tracking-wider leading-none mt-1">
                {vehicle.plate}
              </span>
            </div>

            {/* Acciones Rápidas */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadProforma}
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 px-3 py-2 rounded-xl transition"
                title="Imprimir Proforma"
              >
                <Printer className="w-4 h-4 text-zinc-400" />
                <span>Imprimir</span>
              </button>

              <a
                href={getWhatsAppLink('general')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl shadow-md shadow-emerald-600/20 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Taller</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Stepper Horizontal Superior (Visión General de la Orden) */}
      <section className="bg-zinc-900/60 border-b border-zinc-800 py-4 px-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-zinc-400">Orden de Trabajo:</span>
              <strong className="text-sm font-mono text-white bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                {activeOrder.otNumber}
              </strong>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">Entrega Estimada:</span>
              <strong className="text-orange-400 font-bold">{activeOrder.estimatedDelivery}</strong>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Estado:</span>
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                isReadyForPickup
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isQuotationPending
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                {activeOrder.steps.find((s) => s.current)?.label || 'En Proceso'}
              </span>
            </div>
          </div>

          {/* Stepper Horizontal */}
          <div className="grid grid-cols-7 gap-2 relative">
            {activeOrder.steps.map((step, idx) => (
              <div
                key={step.id}
                className={`relative rounded-xl p-2.5 border transition-all ${
                  step.current
                    ? 'bg-orange-500/10 border-orange-500/60 shadow-lg shadow-orange-500/10'
                    : step.completed
                    ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-bold ${
                    step.current ? 'text-orange-400' : step.completed ? 'text-emerald-400' : 'text-zinc-600'
                  }`}>
                    0{idx + 1}
                  </span>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                    step.completed
                      ? 'bg-emerald-500 text-zinc-950 font-bold'
                      : step.current
                      ? 'bg-orange-500 text-white font-bold animate-pulse'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {step.completed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                  </div>
                </div>

                <h4 className={`text-xs font-bold truncate ${
                  step.current ? 'text-white' : step.completed ? 'text-zinc-200' : 'text-zinc-500'
                }`}>
                  {step.shortLabel}
                </h4>
                <span className="text-[10px] font-mono text-zinc-400 truncate block mt-0.5">
                  {step.timestamp || 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Dashboard Principal de 3 Columnas */}
      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6">
        {/* ================= COLUMNA IZQUIERDA (30% / 4 Cols): FICHA VEHÍCULO & INSPECCIÓN ================= */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          {/* Ficha Técnica de la Motocicleta */}
          <div className="bg-zinc-900/90 rounded-2xl p-5 border border-zinc-800 shadow-lg space-y-4">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-xs uppercase font-extrabold text-orange-400 tracking-wider">
                  {vehicle.brand}
                </span>
                <h2 className="text-lg font-black text-white">{vehicle.model}</h2>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {vehicle.displacement} • Año {vehicle.year}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Gauge className="w-6 h-6" />
              </div>
            </div>

            {/* Imagen Principal */}
            <div
              onClick={() => openPhotoModal(vehicle.photoUrl, `${vehicle.brand} ${vehicle.model}`, 'Vista general del vehículo en taller')}
              className="relative rounded-xl overflow-hidden border border-zinc-800 h-44 cursor-pointer group"
            >
              <img
                src={vehicle.photoUrl}
                alt={vehicle.model}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 justify-between">
                <span className="text-xs font-bold text-white">{vehicle.color}</span>
                <span className="text-[10px] font-mono text-zinc-300 bg-black/60 px-2 py-0.5 rounded">
                  VIN: {vehicle.vin}
                </span>
              </div>
            </div>

            {/* Especificaciones Técnicas */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 block">Kilometraje Actual</span>
                <span className="text-sm font-black text-white font-mono">{vehicle.currentKm.toLocaleString()} km</span>
              </div>
              <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 block">Color Carrocería</span>
                <span className="text-xs font-bold text-zinc-200 truncate block">{vehicle.color}</span>
              </div>
            </div>

            {/* Medidor de Combustible */}
            {renderFuelMeter(vehicle.fuelLevel)}
          </div>

          {/* Inspección 360° & Fotos de Recepción */}
          <div className="bg-zinc-900/90 rounded-2xl p-5 border border-zinc-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-orange-500" />
                <h3 className="text-xs font-black tracking-wider uppercase text-zinc-200">
                  Inspección 360° de Ingreso
                </h3>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">5 Fotos Certificadas</span>
            </div>

            {/* Grid 4 fotos + Tablero */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { title: 'Frontal', url: inspection.photos.frontal },
                { title: 'Lateral Izq.', url: inspection.photos.lateralIzq },
                { title: 'Lateral Der.', url: inspection.photos.lateralDer },
                { title: 'Trasera', url: inspection.photos.trasera },
              ].map((p, i) => (
                <div
                  key={i}
                  onClick={() => openPhotoModal(p.url, p.title, `Foto de recepción - ${vehicle.plate}`)}
                  className="group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-video cursor-pointer"
                >
                  <img src={p.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                    <span className="text-[10px] font-bold text-white">{p.title}</span>
                  </div>
                </div>
              ))}

              {/* Tablero */}
              <div
                onClick={() => openPhotoModal(inspection.photos.tablero, 'Tablero & Kilometraje', 'Foto odómetro de recepción')}
                className="col-span-2 group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 h-24 cursor-pointer"
              >
                <img src={inspection.photos.tablero} alt="Tablero" className="w-full h-full object-cover group-hover:scale-105 transition" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2">
                  <span className="text-xs font-bold text-white">Tablero & Testigos</span>
                  <span className="text-[10px] font-mono text-orange-400 bg-black/70 px-2 py-0.5 rounded">
                    Odómetro: {inspection.kmAtCheckin.toLocaleString()} km
                  </span>
                </div>
              </div>
            </div>

            {/* Checklist de Daños Previos */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                Novedades Físicas Registradas ({inspection.damages.length})
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {inspection.damages.map((dmg) => (
                  <div key={dmg.id} className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/80 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-zinc-200">{dmg.zone}</span>
                      {getSeverityBadge(dmg.severity)}
                    </div>
                    <span className="text-[11px] text-amber-400 font-medium block">{dmg.damageType}</span>
                    <p className="text-[11px] text-zinc-400 mt-1">{dmg.advisorNotes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Firma Digital */}
            <div className="pt-2 border-t border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">Firma de Conformidad en Check-in:</span>
              <div className="bg-white rounded-xl p-2.5 flex flex-col items-center border border-zinc-300">
                <img src={inspection.signature.signatureUrl} alt="Firma" className="h-14 object-contain" />
                <div className="text-center pt-1 border-t border-zinc-300 w-full text-zinc-900">
                  <p className="text-xs font-black">{inspection.signature.clientName}</p>
                  <p className="text-[10px] text-zinc-600 font-mono">C.I: {inspection.signature.identificationId}</p>
                </div>
              </div>
              <p className="text-[9px] text-zinc-500 text-center font-mono mt-1">
                Certificado digital • {inspection.signature.timestamp}
              </p>
            </div>
          </div>
        </div>

        {/* ================= COLUMNA CENTRAL (45% / 5 Cols): DIAGNÓSTICO & ACTIVIDADES TÉCNICAS ================= */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          {/* Banner de Retiro si está lista */}
          {isReadyForPickup && (
            <div className="bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-900 border-2 border-emerald-500/70 p-5 rounded-2xl shadow-xl animate-fade-in relative">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-black text-emerald-400 uppercase tracking-wide">
                    ¡Motocicleta Lista para Retiro!
                  </h3>
                  <p className="text-xs text-zinc-200 mt-1 leading-relaxed">
                    {activeOrder.pickupReadyNotice ||
                      `Todos los trabajos y pruebas de control de calidad han sido completados en ${activeOrder.branch.name}.`}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <a
                      href={activeOrder.branch.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-extrabold bg-emerald-500 text-zinc-950 px-4 py-2 rounded-xl shadow-md hover:bg-emerald-400 transition"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Cómo Llegar (Google Maps)</span>
                    </a>
                    <a
                      href={getWhatsAppLink('retiro')}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 px-3.5 py-2 rounded-xl border border-zinc-700 transition"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <span>Avisar que voy en camino</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selector de Pestañas Columna Central */}
          <div className="flex border-b border-zinc-800 bg-zinc-900/60 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setCenterTab('diagnostico')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                centerTab === 'diagnostico'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Diagnóstico en Vivo</span>
            </button>
            <button
              onClick={() => setCenterTab('historial')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                centerTab === 'historial'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial ({history.length})</span>
            </button>
            <button
              onClick={() => setCenterTab('garantias')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                centerTab === 'garantias'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Garantías ({warranties.length})</span>
            </button>
          </div>

          {/* Sub-contenido Diagnóstico */}
          {centerTab === 'diagnostico' && (
            <div className="space-y-5 animate-fade-in">
              {/* Equipo Responsable */}
              <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={activeOrder.mechanic.avatarUrl}
                    alt={activeOrder.mechanic.name}
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-700"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-orange-400">Mecánico Especialista</span>
                    <h4 className="text-sm font-bold text-white">{activeOrder.mechanic.name}</h4>
                    <p className="text-xs text-zinc-400">{activeOrder.mechanic.specialty}</p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[10px] font-bold uppercase text-zinc-500 block">Asesor a Cargo</span>
                  <span className="text-zinc-300 font-medium">{activeOrder.advisor}</span>
                </div>
              </div>

              {/* Bitácora de Observaciones del Jefe de Taller */}
              <div className="bg-zinc-900/90 rounded-2xl p-5 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    <h3 className="text-xs font-black tracking-wider uppercase text-zinc-200">
                      Informe Técnico del Taller
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Ingreso: {activeOrder.entryDate}</span>
                </div>

                <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-850">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Motivo de Ingreso del Cliente:</span>
                  <p className="text-xs text-zinc-200 leading-relaxed italic">"{activeOrder.clientReason}"</p>
                </div>

                <div className="bg-orange-950/20 border border-orange-500/30 p-3.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-orange-400 block mb-1">
                    Dictamen Técnico del Supervisor:
                  </span>
                  <p className="text-xs text-zinc-200 leading-relaxed">
                    {activeOrder.supervisorObservations}
                  </p>
                </div>
              </div>

              {/* Galería de Evidencia de Diagnóstico */}
              <div className="bg-zinc-900/90 rounded-2xl p-5 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-orange-500" />
                    <h3 className="text-xs font-black tracking-wider uppercase text-zinc-200">
                      Evidencias Fotográficas ({activeOrder.diagnosticPhotos.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-400">Haz clic para zoom en alta resolución</span>
                </div>

                <div className="space-y-3">
                  {activeOrder.diagnosticPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => openPhotoModal(photo.url, photo.title, photo.description)}
                      className="group bg-zinc-950/70 rounded-xl border border-zinc-850 overflow-hidden hover:border-orange-500/40 transition cursor-pointer flex gap-3 p-2.5"
                    >
                      <div className="w-32 h-24 rounded-lg overflow-hidden shrink-0 relative bg-black">
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute top-1 right-1 p-1 bg-black/60 rounded text-white opacity-80 group-hover:opacity-100">
                          <Maximize2 className="w-3 h-3" />
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition truncate">
                              {photo.title}
                            </h4>
                            <span className="text-[10px] font-mono text-zinc-500 shrink-0">{photo.uploadedAt}</span>
                          </div>
                          <span className="text-[10px] text-orange-400 font-mono block mt-0.5">{photo.stage}</span>
                          <p className="text-[11px] text-zinc-400 mt-1 leading-snug line-clamp-2">
                            {photo.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-contenido Historial */}
          {centerTab === 'historial' && (
            <div className="space-y-3 animate-fade-in">
              {history.map((record) => (
                <div key={record.id} className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 space-y-3">
                  <div className="flex items-start justify-between border-b border-zinc-800 pb-2.5">
                    <div>
                      <span className="text-xs font-black text-white">{record.date}</span>
                      <span className="text-[11px] text-orange-400 font-mono block">{record.mileage.toLocaleString()} km</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black font-mono text-emerald-400">${record.totalPaid.toFixed(2)}</span>
                      <span className="text-[10px] text-zinc-500 block font-mono">{record.invoiceNumber}</span>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-400">
                    <span className="text-zinc-500 text-[10px] block">Sucursal y Técnico:</span>
                    <span className="text-zinc-200 font-medium">{record.branchName} • Mecánico: {record.technicianName}</span>
                  </div>

                  <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-850 space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Detalle del Servicio:</span>
                    <ul className="list-disc list-inside text-zinc-300 space-y-0.5 text-[11px]">
                      {record.workSummary.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sub-contenido Garantías */}
          {centerTab === 'garantias' && (
            <div className="space-y-3 animate-fade-in">
              {warranties.map((war) => (
                <div key={war.id} className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-black text-white">{war.title}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Vigente
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300">{war.coverage}</p>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-950/60 p-3 rounded-xl border border-zinc-850">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Vencimiento</span>
                      <span className="text-zinc-200 font-mono font-medium">{war.expirationDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Límite Kilometraje</span>
                      <span className="text-zinc-200 font-mono font-medium">{war.kmLimit.toLocaleString()} km</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 italic">{war.terms}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= COLUMNA DERECHA (25% / 3 Cols): FACTURACIÓN SRI & ACCIONES ================= */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          {/* Tarjeta de Proforma y Facturación */}
          <div className="bg-zinc-900/90 rounded-2xl p-5 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <h3 className="text-xs font-black tracking-wider uppercase text-zinc-200">
                    Proforma de Liquidación
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">No. {activeOrder.quotation.quotationNumber}</span>
              </div>

              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  isQuotationPending
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isQuotationPending ? 'Pendiente' : 'Aprobado'}
              </span>
            </div>

            {/* Repuestos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                <span>Repuestos ({activeOrder.quotation.parts.length})</span>
                <span className="font-mono">${activeOrder.quotation.subtotalParts.toFixed(2)}</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {activeOrder.quotation.parts.map((p) => (
                  <div key={p.code} className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-850 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="text-zinc-200 font-medium leading-tight">{p.description}</span>
                      <span className="font-mono font-bold text-white shrink-0 ml-2">${p.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
                      <span>{p.brand}</span>
                      <span className="font-mono">{p.quantity} × ${p.unitPrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mano de Obra */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                <span>Servicios y Mano de Obra ({activeOrder.quotation.services.length})</span>
                <span className="font-mono">${activeOrder.quotation.subtotalServices.toFixed(2)}</span>
              </div>
              <div className="space-y-1.5">
                {activeOrder.quotation.services.map((s) => (
                  <div key={s.code} className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-850 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="text-zinc-200 font-medium leading-tight">{s.description}</span>
                      <span className="font-mono font-bold text-white shrink-0 ml-2">${s.subtotal.toFixed(2)}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">{s.hours} horas técnicas estándar</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Desglose Tributario SRI Ecuador (IVA 15%) */}
            <div className="pt-3 border-t border-zinc-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal Trabajos:</span>
                <span className="font-mono">${activeOrder.quotation.subtotal.toFixed(2)}</span>
              </div>
              {activeOrder.quotation.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Descuento Especial:</span>
                  <span className="font-mono">-${activeOrder.quotation.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>IVA Tarifa 15% (SRI):</span>
                <span className="font-mono">${activeOrder.quotation.taxAmount.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline">
                <span className="text-xs font-black uppercase text-zinc-200">Total Proforma:</span>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-orange-400">
                    ${activeOrder.quotation.total.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-zinc-500 block font-mono">USD (Dólares)</span>
                </div>
              </div>
            </div>

            {/* Acción Principal: Aprobar Presupuesto o Sello de Aprobación */}
            {isQuotationPending ? (
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => setIsApprovalModalOpen(true)}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center justify-center gap-2 active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aprobar Presupuesto (${activeOrder.quotation.total.toFixed(2)})</span>
                </button>

                <p className="text-[10px] text-zinc-400 text-center leading-tight">
                  Al autorizar, tu moto pasa a montaje inmediato con garantía de repuestos y mano de obra.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Presupuesto Autorizado</span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  Aprobado por: <strong className="text-white">{activeOrder.quotation.approvedBy}</strong>
                </p>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Fecha: {activeOrder.quotation.approvedAt}
                </p>
              </div>
            )}

            {/* Botón Descargar Proforma PDF */}
            <button
              onClick={handleDownloadProforma}
              className="w-full bg-zinc-950 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 text-xs font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar / Imprimir Proforma</span>
            </button>
          </div>

          {/* Información y Contacto de la Sucursal */}
          <div className="bg-zinc-900/90 rounded-2xl p-5 border border-zinc-800 shadow-md space-y-3">
            <h4 className="text-xs font-black tracking-wider uppercase text-zinc-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>Sucursal Asignada</span>
            </h4>

            <div className="text-xs space-y-1.5 text-zinc-300">
              <p className="font-bold text-white">{activeOrder.branch.name}</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">{activeOrder.branch.address}</p>
              <p className="text-[11px] text-zinc-500">{activeOrder.branch.schedule}</p>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex gap-2">
              <a
                href={activeOrder.branch.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span>Ver Mapa</span>
              </a>

              <a
                href={getWhatsAppLink('general')}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
