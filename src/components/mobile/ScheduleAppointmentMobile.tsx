// src/components/mobile/ScheduleAppointmentMobile.tsx
import React, { useState } from 'react';
import {
  CalendarPlus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  History,
  Wrench,
  Sparkles,
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

const AVAILABLE_SERVICES = [
  {
    id: 'preventivo',
    title: 'Mantenimiento Preventivo Periódico',
    price: 65.0,
    time: '2 - 3h',
    tasks: ['Aceite Sintético Motul 7100', 'Filtro Aceite OEM', 'Tensión de Cadena'],
  },
  {
    id: 'aceite_express',
    title: 'Cambio de Aceite y Filtro Express',
    price: 38.0,
    time: '45m',
    tasks: ['Aceite Motul 7100', 'Filtro de Aceite OEM'],
  },
  {
    id: 'frenos',
    title: 'Mantenimiento de Frenos y Pastillas',
    price: 48.0,
    time: '1.5h',
    tasks: ['Purga y líquido DOT 5.1', 'Pastillas Brembo'],
  },
  {
    id: 'efi_valvulas',
    title: 'Sincronización EFI y Válvulas',
    price: 75.0,
    time: '3h',
    tasks: ['Calibración de válvulas', 'Escáner OBD'],
  },
];

const TIME_SLOTS = ['08:30 AM', '09:30 AM', '11:00 AM', '14:30 PM', '16:00 PM'];

const PARTS_OPTIONS = [
  {
    id: 'oem',
    title: '100% Repuestos Originales OEM',
    desc: 'Garantía oficial directa de fábrica',
  },
  {
    id: 'alternativo',
    title: 'Alternativos Premium Homologados',
    desc: 'Excelente calidad y precio conveniente',
  },
];

export const ScheduleAppointmentMobile: React.FC<Props> = ({
  motorcycle,
  profile,
  branches,
  scheduledMaintenances,
  onScheduleNewMaintenance,
  onBack,
}) => {
  // Pestaña activa: formulario de reserva vs solo historial de citas
  const [activeTab, setActiveTab] = useState<'form' | 'historial'>('form');

  // Estados del formulario
  const [selectedService, setSelectedService] = useState(AVAILABLE_SERVICES[0]);
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || 'matriz-la-mana');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [appointmentTime, setAppointmentTime] = useState('09:30 AM');
  const [partsPreference, setPartsPreference] = useState<'oem' | 'alternativo'>('oem');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successId, setSuccessId] = useState('');

  // Estados para controlar bloques desplegables (1 al 4)
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isPartsDropdownOpen, setIsPartsDropdownOpen] = useState(false);

  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
  const selectedPart = PARTS_OPTIONS.find((p) => p.id === partsPreference) || PARTS_OPTIONS[0];

  const subtotal = selectedService.price;
  const iva = Number((subtotal * 0.15).toFixed(2));
  const total = Number((subtotal + iva).toFixed(2));

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
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
      estimatedCost: selectedService.price,
      tasks: selectedService.tasks,
      notes: notes
        ? `${notes} (Repuestos: ${partsPreference === 'oem' ? 'Originales OEM' : 'Alternativos'})`
        : `Repuestos: ${partsPreference === 'oem' ? 'Originales OEM' : 'Alternativos'}`,
    };

    onScheduleNewMaintenance(newAppointment);
    setSuccessId(bookingId);
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

  return (
    <div className="space-y-4 pb-20 animate-fade-in text-zinc-900">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO CON BOTÓN 'HISTORIAL' A LA DERECHA */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition flex items-center justify-center cursor-pointer shrink-0"
              title="Volver al punto anterior"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="p-2 rounded-md bg-blue-50 border border-blue-200 text-blue-600 shrink-0">
            {activeTab === 'historial' ? (
              <History className="w-5 h-5 text-blue-600" />
            ) : (
              <CalendarPlus className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-zinc-900 truncate">
              {activeTab === 'historial' ? 'Historial de Citas' : 'Agendar Cita en Taller'}
            </h2>
            <p className="text-[11px] text-zinc-500 truncate">
              {activeTab === 'historial'
                ? `Citas registradas (${scheduledMaintenances.length})`
                : `Reserva para ${motorcycle.plate}`}
            </p>
          </div>
        </div>

        {/* Botón Historial / Agendar Cita a la derecha del título */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'form' ? 'historial' : 'form')}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs active:scale-98 ${
            activeTab === 'historial'
              ? 'bg-blue-600 text-white shadow-blue-600/20'
              : 'bg-white border border-zinc-300 hover:border-blue-600 text-blue-700'
          }`}
        >
          {activeTab === 'historial' ? (
            <>
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Nueva Cita</span>
            </>
          ) : (
            <>
              <History className="w-3.5 h-3.5" />
              <span>Historial</span>
              {scheduledMaintenances.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-mono">
                  {scheduledMaintenances.length}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Notificación de éxito */}
      {isSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-md text-emerald-800 text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>¡Cita {successId} reservada con éxito! Redirigiendo...</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className="text-[11px] text-blue-700 font-extrabold underline shrink-0 cursor-pointer"
          >
            Ver
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VISTA CONDICIONAL: SOLO HISTORIAL DE CITAS vs FORMULARIO DE AGENDAMIENTO */}
      {/* ========================================================================= */}
      {activeTab === 'historial' ? (
        /* VISTA EXCLUSIVA: BLOQUE DE CITAS ANTERIORES O PROGRAMADAS */
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
              Citas Anteriores y Programadas ({scheduledMaintenances.length})
            </h3>
            <span className="text-[10px] text-zinc-400 font-mono">StarMotos Taller</span>
          </div>

          {scheduledMaintenances.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center space-y-3">
              <Calendar className="w-8 h-8 text-zinc-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-zinc-800">No tienes citas registradas aún</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Puedes programar tu cita de mantenimiento preventivo o correctivo en segundos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-xs font-bold transition cursor-pointer active:scale-98"
              >
                Agendar Mi Primer Turno
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {scheduledMaintenances.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-mono text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {appt.id}
                      </span>
                      <h4 className="font-bold text-zinc-900 text-xs mt-1">{appt.serviceTitle}</h4>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      {appt.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-600 space-y-0.5 pt-1 border-t border-zinc-100">
                    <p className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span>{appt.scheduledDate || appt.recommendedDate}</span>
                      {appt.scheduledTime && (
                        <span className="font-semibold text-blue-700 font-mono">• {appt.scheduledTime}</span>
                      )}
                    </p>
                    <p className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span>{appt.branchName}</span>
                    </p>
                    {appt.notes && (
                      <p className="text-[10px] text-zinc-500 italic mt-0.5 truncate">
                        "{appt.notes}"
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-zinc-800">
                      ${appt.estimatedCost.toFixed(2)} USD
                    </span>
                    <a
                      href={`https://wa.me/${branches[0]?.whatsapp || '593939316698'}?text=${encodeURIComponent(
                        `Hola StarMotos, deseo consultar sobre mi cita ${appt.id} para mi moto ${motorcycle.plate}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 text-[11px]"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Consultar Taller</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VISTA: FORMULARIO CON SECCIONES DIRECTAS (SIN CONTENEDOR EXTERNO REDUNDANTE) */
        <form onSubmit={handleConfirm} className="space-y-4">
          {/* ========================================================================= */}
          {/* SECCIÓN 1: SERVICIO TÉCNICO (BLOQUE DESPLEGABLE DIRECTO) */}
          {/* ========================================================================= */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <span>Servicio Técnico Requerido</span>
              </label>
              <span className="text-[10px] text-zinc-400">
                {isServiceDropdownOpen ? 'Selecciona uno' : 'Toca para cambiar'}
              </span>
            </div>

            {/* Bloque desplegable */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsServiceDropdownOpen(!isServiceDropdownOpen);
                  setIsBranchDropdownOpen(false);
                  setIsTimeDropdownOpen(false);
                  setIsPartsDropdownOpen(false);
                }}
                className={`w-full p-3 rounded-md border flex items-center justify-between text-left transition cursor-pointer active:scale-99 shadow-xs ${
                  isServiceDropdownOpen
                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20'
                    : 'border-zinc-300 bg-white hover:border-blue-500'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-zinc-900 truncate">{selectedService.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {selectedService.time} est.
                    </span>
                    <span className="font-mono font-bold text-blue-700">
                      ${selectedService.price.toFixed(2)} USD
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${
                    isServiceDropdownOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>

              {/* Lista desplegable de opciones de servicios */}
              {isServiceDropdownOpen && (
                <div className="mt-1.5 space-y-1.5 border border-zinc-200 bg-white rounded-md p-1.5 shadow-md animate-fade-in z-10">
                  {AVAILABLE_SERVICES.map((srv) => {
                    const isSelected = selectedService.id === srv.id;
                    return (
                      <div
                        key={srv.id}
                        onClick={() => {
                          setSelectedService(srv);
                          setIsServiceDropdownOpen(false);
                        }}
                        className={`p-2.5 rounded-md text-xs cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'hover:bg-zinc-50 text-zinc-800 border border-zinc-100'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className={isSelected ? 'text-white font-semibold' : 'text-zinc-900 font-medium'}>
                            {srv.title}
                          </p>
                          <span
                            className={`text-[10px] ${
                              isSelected ? 'text-blue-100' : 'text-zinc-500'
                            }`}
                          >
                            {srv.time} duración est.
                          </span>
                        </div>
                        <span
                          className={`font-mono font-bold shrink-0 ${
                            isSelected ? 'text-white' : 'text-blue-700'
                          }`}
                        >
                          ${srv.price.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 2: SUCURSAL (BLOQUE DESPLEGABLE DIRECTO) */}
          {/* ========================================================================= */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <span>Sucursal de Atención</span>
              </label>
              <span className="text-[10px] text-zinc-400">
                {isBranchDropdownOpen ? 'Selecciona sucursal' : 'Toca para cambiar'}
              </span>
            </div>

            {/* Bloque desplegable */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsBranchDropdownOpen(!isBranchDropdownOpen);
                  setIsServiceDropdownOpen(false);
                  setIsTimeDropdownOpen(false);
                  setIsPartsDropdownOpen(false);
                }}
                className={`w-full p-3 rounded-md border flex items-center justify-between text-left transition cursor-pointer active:scale-99 shadow-xs ${
                  isBranchDropdownOpen
                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20'
                    : 'border-zinc-300 bg-white hover:border-blue-500'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <p className="text-xs font-bold text-zinc-900 truncate">{currentBranch.name}</p>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate pl-5">
                    {currentBranch.address}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${
                    isBranchDropdownOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>

              {/* Lista desplegable de sucursales */}
              {isBranchDropdownOpen && (
                <div className="mt-1.5 space-y-1.5 border border-zinc-200 bg-white rounded-md p-1.5 shadow-md animate-fade-in z-10">
                  {branches.map((b) => {
                    const isSelected = selectedBranchId === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBranchId(b.id);
                          setIsBranchDropdownOpen(false);
                        }}
                        className={`p-2.5 rounded-md text-xs cursor-pointer transition ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'hover:bg-zinc-50 text-zinc-800 border border-zinc-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <MapPin
                            className={`w-3.5 h-3.5 ${
                              isSelected ? 'text-white' : 'text-blue-600'
                            }`}
                          />
                          <p className={isSelected ? 'text-white font-semibold' : 'text-zinc-900 font-medium'}>
                            {b.name}
                          </p>
                        </div>
                        <p
                          className={`text-[10px] mt-0.5 pl-5 ${
                            isSelected ? 'text-blue-100' : 'text-zinc-500'
                          }`}
                        >
                          {b.address}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 3: FECHA Y TURNO (DIRECTO) */}
          {/* ========================================================================= */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              <span>Fecha y Turno de Recepción</span>
            </label>

            {/* Subcampo: Fecha */}
            <div>
              <label className="block text-[11px] text-zinc-600 mb-1 font-medium">
                Día de ingreso
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-md pl-9 pr-3 py-2 text-xs shadow-xs"
                />
              </div>
            </div>

            {/* Subcampo: Turno / Horario (Bloque Desplegable) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-zinc-600 font-medium">Turno disponible</label>
                <span className="text-[10px] text-zinc-400">
                  {isTimeDropdownOpen ? 'Selecciona hora' : 'Toca para cambiar'}
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsTimeDropdownOpen(!isTimeDropdownOpen);
                    setIsServiceDropdownOpen(false);
                    setIsBranchDropdownOpen(false);
                    setIsPartsDropdownOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-md border flex items-center justify-between text-left transition cursor-pointer active:scale-99 shadow-xs ${
                    isTimeDropdownOpen
                      ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20'
                      : 'border-zinc-300 bg-white hover:border-blue-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold font-mono text-zinc-900">
                      {appointmentTime}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-normal">
                      (Turno seleccionado)
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${
                      isTimeDropdownOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>

                {/* Lista desplegable de turnos */}
                {isTimeDropdownOpen && (
                  <div className="mt-1.5 border border-zinc-200 bg-white rounded-md p-2 shadow-md animate-fade-in z-10">
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((slot) => {
                        const isSelected = appointmentTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setAppointmentTime(slot);
                              setIsTimeDropdownOpen(false);
                            }}
                            className={`py-2 text-center rounded-md text-xs font-bold font-mono transition cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 4: DETALLES PARA EL TALLER (DIRECTO) */}
          {/* ========================================================================= */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                4
              </span>
              <span>Detalles para los Mecánicos</span>
            </label>

            {/* Preferencia de Repuestos (Bloque Desplegable) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-zinc-600 font-medium">
                  Preferencia de Repuestos
                </label>
                <span className="text-[10px] text-zinc-400">
                  {isPartsDropdownOpen ? 'Elige tipo' : 'Toca para cambiar'}
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsPartsDropdownOpen(!isPartsDropdownOpen);
                    setIsServiceDropdownOpen(false);
                    setIsBranchDropdownOpen(false);
                    setIsTimeDropdownOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-md border flex items-center justify-between text-left transition cursor-pointer active:scale-99 shadow-xs ${
                    isPartsDropdownOpen
                      ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20'
                      : 'border-zinc-300 bg-white hover:border-blue-500'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-zinc-900 truncate">{selectedPart.title}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{selectedPart.desc}</p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${
                      isPartsDropdownOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>

                {/* Lista desplegable de repuestos */}
                {isPartsDropdownOpen && (
                  <div className="mt-1.5 space-y-1.5 border border-zinc-200 bg-white rounded-md p-1.5 shadow-md animate-fade-in z-10">
                    {PARTS_OPTIONS.map((part) => {
                      const isSelected = partsPreference === part.id;
                      return (
                        <div
                          key={part.id}
                          onClick={() => {
                            setPartsPreference(part.id as 'oem' | 'alternativo');
                            setIsPartsDropdownOpen(false);
                          }}
                          className={`p-2.5 rounded-md text-xs cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold shadow-xs'
                              : 'hover:bg-zinc-50 text-zinc-800 border border-zinc-100'
                          }`}
                        >
                          <p className={isSelected ? 'text-white font-semibold' : 'text-zinc-900 font-medium'}>
                            {part.title}
                          </p>
                          <p
                            className={`text-[10px] mt-0.5 ${
                              isSelected ? 'text-blue-100' : 'text-zinc-500'
                            }`}
                          >
                            {part.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Síntomas o detalles */}
            <div>
              <label className="block text-[11px] text-zinc-600 mb-1 font-medium">
                Síntomas, ruidos o detalles en tu moto (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ej. Revisar freno o vibración en manubrio..."
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-md p-2.5 text-xs placeholder:text-zinc-400 shadow-xs"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RESUMEN DEL TURNO Y BOTÓN DE CONFIRMACIÓN */}
          {/* ========================================================================= */}
          <div className="bg-[#eaf2fb] border border-[#bcd7ef] p-3.5 rounded-lg space-y-2.5 text-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-xs border-b border-[#bcd7ef]/70 pb-2">
              <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wider">
                Resumen de Reserva
              </span>
              <span className="font-mono text-[10px] text-blue-800 bg-blue-100/70 px-1.5 py-0.5 rounded border border-blue-200/70 font-bold">
                {motorcycle.plate}
              </span>
            </div>

            <div className="text-[11px] text-zinc-600 space-y-1">
              <div className="flex justify-between">
                <span>Servicio:</span>
                <span className="font-semibold text-zinc-900 text-right truncate max-w-[180px]">
                  {selectedService.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Turno:</span>
                <span className="font-semibold text-zinc-900">
                  {appointmentDate} • {appointmentTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sucursal:</span>
                <span className="font-semibold text-zinc-900 truncate max-w-[180px]">
                  {currentBranch.name}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#bcd7ef]/70">
                <span className="font-bold text-blue-950 text-xs">Total Proyectado (c/ IVA):</span>
                <span className="text-base font-mono font-black text-blue-800">
                  ${total.toFixed(2)} USD
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Confirmar Cita</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
