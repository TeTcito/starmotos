// src/components/desktop/ScheduleAppointmentDesktop.tsx
import React, { useState } from 'react';
import {
  CalendarPlus,
  Calendar,
  Clock,
  MapPin,
  Wrench,
  CheckCircle2,
  Bike,
  Sparkles,
  Phone,
  AlertCircle,
  FileCheck,
  ChevronRight,
  Send,
  CalendarCheck,
  ArrowLeft,
} from 'lucide-react';
import { WhatsAppIcon } from '../WhatsAppIcon';
import {
  ScheduledMaintenance,
  MotorcycleClientData,
  ClientProfile,
  Branch,
} from '../../types/customer';

interface Props {
  motorcycle: MotorcycleClientData;
  profile: ClientProfile;
  branches: Branch[];
  scheduledMaintenances: ScheduledMaintenance[];
  onScheduleNewMaintenance: (maintenance: ScheduledMaintenance) => void;
  onBack?: () => void;
}

interface ServiceOption {
  id: string;
  title: string;
  duration: string;
  estimatedPrice: number;
  description: string;
  tasks: string[];
  popular?: boolean;
}

const AVAILABLE_SERVICES: ServiceOption[] = [
  {
    id: 'preventivo',
    title: 'Mantenimiento Preventivo Periódico',
    duration: '2 - 3 horas',
    estimatedPrice: 65.0,
    popular: true,
    description: 'Servicio según manual de fabricante con cambio de fluidos y chequeo 30 puntos.',
    tasks: ['Aceite Sintético Motul 7100', 'Filtro Aceite OEM Benelli', 'Tensión de Cadena', 'Chequeo de Frenos'],
  },
  {
    id: 'aceite_express',
    title: 'Cambio de Aceite y Filtro Express',
    duration: '45 minutos',
    estimatedPrice: 38.0,
    description: 'Servicio rápido de lubricación con insumos de alta gama sin desmontajes complejos.',
    tasks: ['Aceite Motul 7100 o 5100', 'Filtro de Aceite OEM', 'Revisión nivel de refrigerante'],
  },
  {
    id: 'frenos',
    title: 'Mantenimiento de Frenos y Cambio de Pastillas',
    duration: '1.5 horas',
    estimatedPrice: 48.0,
    description: 'Inspección de discos, mordazas, líquido de frenos DOT 5.1 y pastillas sinterizadas.',
    tasks: ['Limpieza de cálipers', 'Purga y cambio de líquido DOT 5.1', 'Ajuste de manetas'],
  },
  {
    id: 'transmision',
    title: 'Kit de Arrastre y Transmisión',
    duration: '1.5 horas',
    estimatedPrice: 52.0,
    description: 'Cambio de catalina, piñón, cadena O-ring o limpieza ultrasónica con lubricación.',
    tasks: ['Alineación con láser', 'Tensión de cadena', 'Engrase de eje de basculante'],
  },
  {
    id: 'efi_valvulas',
    title: 'Sincronización EFI y Calibración de Válvulas',
    duration: '3 - 4 horas',
    estimatedPrice: 75.0,
    description: 'Calibración con galgas, limpieza por ultrasonido de inyectores y escáner OBD.',
    tasks: ['Calibración en frío', 'Sincronización de cuerpos de aceleración', 'Diagnóstico OBD'],
  },
  {
    id: 'pre_viaje',
    title: 'Revisión General Pre-Viaje / RTV',
    duration: '2 horas',
    estimatedPrice: 40.0,
    description: 'Inspección completa de seguridad para viajes largos o pase de inspección técnica RTV.',
    tasks: ['Luces y sistema eléctrico', 'Presión y desgaste de neumáticos', 'Suspensión y rodamientos'],
  },
];

const TIME_SLOTS = [
  '08:30 AM',
  '09:30 AM',
  '10:30 AM',
  '11:30 AM',
  '14:00 PM',
  '15:00 PM',
  '16:00 PM',
  '17:00 PM',
];

export const ScheduleAppointmentDesktop: React.FC<Props> = ({
  motorcycle,
  profile,
  branches,
  scheduledMaintenances,
  onScheduleNewMaintenance,
  onBack,
}) => {
  const [selectedService, setSelectedService] = useState<ServiceOption>(AVAILABLE_SERVICES[0]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || 'matriz-la-mana');
  const [appointmentDate, setAppointmentDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [appointmentTime, setAppointmentTime] = useState<string>('09:30 AM');
  const [notes, setNotes] = useState<string>('');
  const [partsPreference, setPartsPreference] = useState<'oem' | 'alternativo'>('oem');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successBookingId, setSuccessBookingId] = useState<string>('');

  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  const handleConfirmAppointment = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const bookingId = `CITA-${Date.now().toString().slice(-6)}`;
    const newAppointment: ScheduledMaintenance = {
      id: bookingId,
      serviceTitle: selectedService.title,
      recommendedKm: motorcycle.currentKm,
      recommendedDate: appointmentDate,
      scheduledDate: appointmentDate,
      scheduledTime: appointmentTime,
      branchName: currentBranch.name,
      branchId: currentBranch.id,
      status: 'confirmada',
      estimatedCost: selectedService.estimatedPrice,
      tasks: selectedService.tasks,
      notes: notes
        ? `${notes} (Preferencia de repuestos: ${partsPreference === 'oem' ? 'Originales OEM' : 'Alternativos'})`
        : `Preferencia de repuestos: ${partsPreference === 'oem' ? 'Originales OEM' : 'Alternativos'}`,
    };

    onScheduleNewMaintenance(newAppointment);
    setSuccessBookingId(bookingId);
    setIsSuccess(true);
    setNotes('');

    // Una vez terminado, regresar automáticamente al módulo anterior
    setTimeout(() => {
      setIsSuccess(false);
      if (onBack) {
        onBack();
      } else {
        window.history.back();
      }
    }, 1300);
  };

  const subtotal = selectedService.estimatedPrice;
  const iva = Number((subtotal * 0.15).toFixed(2));
  const total = Number((subtotal + iva).toFixed(2));

  return (
    <div className="w-full space-y-5 animate-fade-in pb-16">
      {/* 1. Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="py-1.5 px-3 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs"
                title="Regresar"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-600" />
                <span>Volver</span>
              </button>
            )}

            <div className="p-2 rounded-md bg-blue-50 border border-blue-200 text-blue-600">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                Agendar Cita en Taller StarMotos
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Reserva tu turno de servicio técnico garantizado para tu {motorcycle.brand} {motorcycle.model} ({motorcycle.plate})
              </p>
            </div>
          </div>
        </div>

        {/* Mensaje de Confirmación Rápida */}
        {isSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-300 rounded-md text-emerald-800 text-xs font-bold animate-fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>¡Cita {successBookingId} agendada con éxito! Redirigiendo...</span>
          </div>
        )}
      </div>

      {/* 2. Grid Principal: Formulario a la Izquierda y Resumen Fijo a la Derecha */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        {/* COLUMNA IZQUIERDA: FORMULARIO INTERACTIVO (8 cols) */}
        <div className="xl:col-span-8 space-y-5">
          <form onSubmit={handleConfirmAppointment} className="space-y-5">
            {/* Paso 1: Selección de Servicio con Fondo Azul al Marcar */}
            <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900">Selecciona el Servicio Requerido</h3>
                </div>
                <span className="text-[11px] text-zinc-400">Precios referenciales con mano de obra</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_SERVICES.map((srv) => {
                  const isSelected = selectedService.id === srv.id;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedService(srv)}
                      className={`relative p-3.5 rounded-md border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-700 bg-blue-600 text-white shadow-md ring-2 ring-blue-500/30'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-900'
                      }`}
                    >
                      {srv.popular && (
                        <span
                          className={`absolute -top-2 right-2.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-xs ${
                            isSelected ? 'bg-white text-blue-700 font-black' : 'bg-red-600 text-white'
                          }`}
                        >
                          Recomendado
                        </span>
                      )}

                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                            {srv.title}
                          </h4>
                          <span
                            className={`text-xs font-extrabold font-mono shrink-0 ${
                              isSelected ? 'text-white' : 'text-blue-700'
                            }`}
                          >
                            ${srv.estimatedPrice.toFixed(2)}
                          </span>
                        </div>
                        <p
                          className={`text-[11px] mt-1 leading-relaxed ${
                            isSelected ? 'text-blue-100' : 'text-zinc-500'
                          }`}
                        >
                          {srv.description}
                        </p>
                      </div>

                      <div
                        className={`mt-3 pt-2 border-t flex items-center justify-between text-[10px] ${
                          isSelected ? 'border-blue-500/60 text-blue-100' : 'border-zinc-100 text-zinc-400'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Clock className={`w-3 h-3 ${isSelected ? 'text-blue-200' : 'text-zinc-400'}`} />
                          {srv.duration}
                        </span>
                        <span className={`font-bold ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                          {isSelected ? '✓ Seleccionado' : 'Seleccionar'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Paso 2: Selección de Sucursal */}
            <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-bold text-zinc-900">Selecciona la Sucursal de Atención</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {branches.map((b) => {
                  const isSelected = selectedBranchId === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBranchId(b.id)}
                      className={`p-3.5 rounded-md border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600/30'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-zinc-400'}`} />
                        <h4 className="text-xs font-bold text-zinc-900">{b.name}</h4>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">{b.address}</p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{b.schedule}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Paso 3: Fecha y Horario */}
            <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h3 className="text-sm font-bold text-zinc-900">Fecha y Turno de Recepción</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Fecha de Ingreso de la Motocicleta
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-md pl-9 pr-3 py-2 text-xs font-medium transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Turno / Hora de Recepción
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = appointmentTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setAppointmentTime(slot)}
                          className={`py-2 px-1 text-center rounded-md text-[11px] font-mono font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          {slot.replace(':00', '').replace(':30', ':30')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Paso 4: Preferencias y Síntomas */}
            <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <h3 className="text-sm font-bold text-zinc-900">Detalles para los Mecánicos</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Preferencia de Repuestos
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPartsPreference('oem')}
                      className={`p-3 rounded-md border text-left cursor-pointer transition ${
                        partsPreference === 'oem'
                          ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-bold ring-1 ring-blue-600/30'
                          : 'border-zinc-200 bg-white text-zinc-700'
                      }`}
                    >
                      <span className="block text-xs font-bold">100% Repuestos Originales OEM</span>
                      <span className="text-[10px] text-zinc-500 font-normal">Garantía oficial directa de fábrica</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPartsPreference('alternativo')}
                      className={`p-3 rounded-md border text-left cursor-pointer transition ${
                        partsPreference === 'alternativo'
                          ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-bold ring-1 ring-blue-600/30'
                          : 'border-zinc-200 bg-white text-zinc-700'
                      }`}
                    >
                      <span className="block text-xs font-bold">Alternativos Premium Homologados</span>
                      <span className="text-[10px] text-zinc-500 font-normal">Excelente calidad y precio conveniente</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Síntomas, ruidos o detalles que notas en tu moto (Opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Ej. Siento un pequeño chirrido en el freno trasero al frenar en frío..."
                    className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-md p-3 text-xs placeholder:text-zinc-400 transition"
                  />
                </div>
              </div>
            </div>
          </form>

        </div>

        {/* COLUMNA DERECHA: RESUMEN DE TURNO FIJO (STICKY TOP-0) Y CITAS AGENDADAS */}
        <div className="xl:col-span-4">
          <div className="sticky top-0 z-20 space-y-3.5">
            {/* Bloque de Resumen de Turno (Solo contenedor externo apastelado) */}
            <div className="bg-[#eaf2fb] border border-[#bcd7ef] rounded-lg p-5 shadow-sm space-y-3.5 text-zinc-900">
              {/* Encabezado sin 'En vivo' */}
              <div className="flex items-center gap-2 border-b border-[#bcd7ef]/80 pb-2.5">
                <CalendarCheck className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-950">
                  Resumen de tu Turno
                </h3>
              </div>

              {/* Vehículo - Directo en el contenedor sin cajas internas */}
              <div className="space-y-0.5 text-xs">
                <span className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider block">
                  Vehículo Registrado
                </span>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-zinc-900 text-xs">
                    {motorcycle.brand} {motorcycle.model}
                  </p>
                  <span className="font-mono text-[10px] font-bold text-blue-800 bg-blue-100/70 px-1.5 py-0.5 rounded border border-blue-200/70">
                    {motorcycle.plate}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono">
                  {motorcycle.currentKm.toLocaleString()} km
                </p>
              </div>

              {/* Servicio Seleccionado - Directo sin cajas internas */}
              <div className="pt-2 border-t border-[#bcd7ef]/70 space-y-0.5 text-xs">
                <span className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider block">
                  Servicio Seleccionado
                </span>
                <p className="font-bold text-xs text-zinc-900">{selectedService.title}</p>
                <div className="flex items-center justify-between text-[11px] text-zinc-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {selectedService.duration}
                  </span>
                  <span className="font-mono font-bold text-blue-800">
                    ${selectedService.estimatedPrice.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Sucursal y Repuestos - Directo sin cajas internas */}
              <div className="pt-2 border-t border-[#bcd7ef]/70 space-y-1 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider block">
                      Sucursal
                    </span>
                    <p className="font-semibold text-zinc-900 text-[11px] truncate">
                      {currentBranch.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider block">
                      Repuestos
                    </span>
                    <p className="font-semibold text-blue-900 text-[11px]">
                      {partsPreference === 'oem' ? 'Originales OEM' : 'Alternativos'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fecha y Hora - Directo sin cajas internas */}
              <div className="pt-2 border-t border-[#bcd7ef]/70 flex justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider block">
                    Fecha de Ingreso:
                  </span>
                  <p className="font-semibold text-zinc-900 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-blue-700" />
                    {appointmentDate}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider block">
                    Hora / Turno:
                  </span>
                  <p className="font-bold font-mono text-blue-800 flex items-center gap-1 mt-0.5 justify-end">
                    <Clock className="w-3 h-3 text-blue-700" />
                    {appointmentTime}
                  </p>
                </div>
              </div>

              {/* Desglose de Costo - Directo sin cajas internas */}
              <div className="pt-2.5 border-t border-[#bcd7ef] space-y-1 text-xs">
                <div className="flex justify-between text-zinc-600 text-[11px]">
                  <span>Subtotal Servicio:</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 text-[11px]">
                  <span>IVA SRI (15%):</span>
                  <span className="font-mono">${iva.toFixed(2)}</span>
                </div>
                <div className="pt-1.5 border-t border-[#bcd7ef] flex items-baseline justify-between">
                  <span className="font-bold text-blue-950 text-xs">Total Proyectado:</span>
                  <span className="text-xl font-mono font-black text-blue-800">
                    ${total.toFixed(2)} <span className="text-[10px] font-normal text-zinc-600">USD</span>
                  </span>
                </div>
              </div>

              {/* Botón de Confirmación Principal */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleConfirmAppointment()}
                  className="w-full py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Confirmar Turno</span>
                </button>
              </div>
            </div>

            {/* Bloque de Citas Agendadas debajo del Resumen */}
            {scheduledMaintenances.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                    Tus Citas Programadas ({scheduledMaintenances.length})
                  </h3>
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {scheduledMaintenances.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-2.5 rounded-md bg-zinc-50 border border-zinc-200/80 space-y-1 text-xs"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <span className="font-mono text-[9px] font-bold text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200">
                            {appt.id}
                          </span>
                          <h4 className="font-bold text-zinc-900 text-[11px] mt-0.5 truncate">{appt.serviceTitle}</h4>
                        </div>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                          {appt.status}
                        </span>
                      </div>

                      <div className="text-[10px] text-zinc-600 space-y-0.5">
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                          {appt.scheduledDate || appt.recommendedDate} {appt.scheduledTime ? `• ${appt.scheduledTime}` : ''}
                        </p>
                        <p className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                          {appt.branchName}
                        </p>
                      </div>

                      <div className="pt-1 border-t border-zinc-200/70 flex items-center justify-between text-[10px]">
                        <span className="font-mono font-bold text-zinc-800">${appt.estimatedCost.toFixed(2)} USD</span>
                        <a
                          href={`https://wa.me/${branches[0]?.whatsapp || '593939316698'}?text=${encodeURIComponent(`Hola StarMotos, deseo consultar sobre mi cita ${appt.id} de mi moto ${motorcycle.plate}.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5 text-[10px]"
                        >
                          <WhatsAppIcon className="w-3 h-3 text-emerald-600" />
                          Consultar
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
