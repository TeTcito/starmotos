// src/components/desktop/ScheduleAppointmentDesktop.tsx
import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  CalendarPlus,
  Calendar,
  Clock,
  Building2,
  Bike,
  CheckCircle2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Sparkles,
  ShieldCheck,
  FileText,
  User,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import {
  ScheduledMaintenance,
  MotorcycleClientData,
  ClientProfile,
  Branch,
  AgendamientoTicket,
} from '../../types/customer';
import { addStoredAgendamiento, getStoredAgendamientos } from '../../data/mockMultiRoleData';

interface Props {
  motorcycle: MotorcycleClientData;
  profile: ClientProfile;
  branches: Branch[];
  scheduledMaintenances: ScheduledMaintenance[];
  onScheduleNewMaintenance: (maintenance: ScheduledMaintenance) => void;
  onBack?: () => void;
}

interface AlistamientoServiceOption {
  id: string;
  title: string;
  category: string;
  badge: string;
  description: string;
  estimatedTime: string;
  features: string[];
}

const ALISTAMIENTO_SERVICES: AlistamientoServiceOption[] = [
  {
    id: 'alistamiento_pdi',
    title: 'Alistamiento PDI (Inspección y Puesta a Punto)',
    category: 'Alistamiento',
    badge: 'Paso 1 Obligatorio',
    description: 'Inspección técnica integral pre-entrega con chequeo estricto de 30 puntos de seguridad según manual de fabricante.',
    estimatedTime: '1 - 2 horas',
    features: [
      'Ajuste y torque de pernos de chasis y motor',
      'Verificación y calibración de sistema eléctrico',
      'Revisión de niveles de lubricantes y fluidos',
      'Prueba funcional y encendido en frío',
    ],
  },
  {
    id: 'engrasado',
    title: 'Engrasado General',
    category: 'Alistamiento / Intermedio',
    badge: 'Paso 2 Mantenimiento',
    description: 'Servicio de lubricación y engrase de ejes basculantes, rodamientos de dirección y calibración de transmisión.',
    estimatedTime: '2 horas',
    features: [
      'Desarme y lubricación de rodamientos de dirección',
      'Engrase de eje de basculante y bujes',
      'Limpieza y tensión de cadena',
      'Lubricación con grasa sintética de alta temperatura',
    ],
  },
  {
    id: 'mantenimiento',
    title: 'Mantenimiento Preventivo Periódico',
    category: 'Mantenimiento Mayor',
    badge: 'Paso 3 Periódico',
    description: 'Mantenimiento técnico por kilometraje con cambio de lubricante, filtros, bujía y diagnóstico general computarizado.',
    estimatedTime: '2 - 3 horas',
    features: [
      'Cambio de aceite de motor y filtro de aceite',
      'Limpieza o sustitución de filtro de aire y bujía',
      'Calibración y purga de frenos delantero y trasero',
      'Chequeo de compresión y sincronización',
    ],
  },
];

interface DailyTimeSlot {
  time: string;
  shift: 'mañana' | 'tarde';
  hour24: number;
  minute: number;
}

const DAILY_TIME_SLOTS: DailyTimeSlot[] = [
  { time: '08:30 AM', shift: 'mañana', hour24: 8, minute: 30 },
  { time: '09:30 AM', shift: 'mañana', hour24: 9, minute: 30 },
  { time: '10:30 AM', shift: 'mañana', hour24: 10, minute: 30 },
  { time: '11:30 AM', shift: 'mañana', hour24: 11, minute: 30 },
  { time: '14:00 PM', shift: 'tarde', hour24: 14, minute: 0 },
  { time: '15:00 PM', shift: 'tarde', hour24: 15, minute: 0 },
  { time: '16:00 PM', shift: 'tarde', hour24: 16, minute: 0 },
  { time: '17:00 PM', shift: 'tarde', hour24: 17, minute: 0 },
];

const formatLocalDate = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitialScheduleDate = (): string => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const lastSlotMinutes = 17 * 60; // 17:00 PM

  const target = new Date(now);
  if (target.getDay() === 0) {
    target.setDate(target.getDate() + 1); // Domingo pasa a Lunes
  } else if (currentMinutes >= lastSlotMinutes) {
    target.setDate(target.getDate() + 1); // Mañana
    if (target.getDay() === 0) {
      target.setDate(target.getDate() + 1); // Si mañana es Domingo pasa a Lunes
    }
  }
  return formatLocalDate(target);
};

export const ScheduleAppointmentDesktop: React.FC<Props> = ({
  motorcycle,
  profile,
  branches,
  scheduledMaintenances,
  onScheduleNewMaintenance,
  onBack,
}) => {
  // Sede seleccionada
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || 'matriz-la-mana');

  // Navegación de semanas (baseDate inicia hoy)
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);

  // Fecha seleccionada (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(getInitialScheduleDate);

  // Turno seleccionado
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Servicio de alistamiento seleccionado
  const [selectedService, setSelectedService] = useState<AlistamientoServiceOption | null>(null);

  // Observaciones
  const [notes, setNotes] = useState<string>('');

  // Modal de confirmación exitosa con ticket generado
  const [confirmedTicket, setConfirmedTicket] = useState<AgendamientoTicket | null>(null);

  const currentBranch = useMemo(() => {
    return branches.find((b) => b.id === selectedBranchId) || branches[0];
  }, [branches, selectedBranchId]);

  // Generar los 7 días de la semana según el offset
  const weekDays = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + currentWeekOffset * 7);

    // Calcular el Lunes de esa semana de forma segura
    const day = base.getDay();
    const diff = base.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(base.getFullYear(), base.getMonth(), diff);

    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const result = [];
    const now = new Date();
    const todayStr = formatLocalDate(now);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatLocalDate(d);
      const isPast = dateStr < todayStr;
      const isSunday = i === 6;
      const isToday = dateStr === todayStr;
      const hasSlotsToday = !isToday || DAILY_TIME_SLOTS.some((s) => s.hour24 * 60 + s.minute > currentMinutes);

      result.push({
        dateStr,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        monthName: d.toLocaleString('es-EC', { month: 'short' }),
        isPast,
        isSunday,
        isToday,
        hasSlotsToday,
      });
    }
    return result;
  }, [currentWeekOffset]);

  // Filtrar los turnos disponibles según la hora actual si es el día de hoy
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return [];
    const now = new Date();
    const todayStr = formatLocalDate(now);

    if (selectedDate < todayStr) {
      return [];
    }

    if (selectedDate === todayStr) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      return DAILY_TIME_SLOTS.filter((slot) => {
        const slotMinutes = slot.hour24 * 60 + slot.minute;
        return slotMinutes > currentMinutes;
      });
    }

    return DAILY_TIME_SLOTS;
  }, [selectedDate]);

  const mananaSlots = useMemo(() => {
    return availableTimeSlots.filter((s) => s.shift === 'mañana');
  }, [availableTimeSlots]);

  const tardeSlots = useMemo(() => {
    return availableTimeSlots.filter((s) => s.shift === 'tarde');
  }, [availableTimeSlots]);

  // Consultar turnos ya reservados para la sede y fecha seleccionada
  const bookedSlots = useMemo(() => {
    if (!selectedDate) return new Set<string>();
    const all = getStoredAgendamientos();
    const booked = new Set<string>();
    for (const item of all) {
      if (item.scheduledDate === selectedDate && item.workshopId === currentBranch.id) {
        if (item.scheduledTime) booked.add(item.scheduledTime.trim().toUpperCase());
      }
    }
    return booked;
  }, [selectedDate, currentBranch.id]);

  const handleSelectDay = (dateStr: string, isBlocked: boolean) => {
    if (isBlocked) return;
    setSelectedDate(dateStr);
    setSelectedTime(''); // Reiniciar turno al cambiar día
  };

  const handleSelectTurno = (time: string) => {
    setSelectedTime(time);
    if (!selectedService) {
      // Pre-seleccionar el primer servicio de alistamiento
      setSelectedService(ALISTAMIENTO_SERVICES[0]);
    }
  };

  const handleConfirmAppointment = () => {
    if (!selectedDate || !selectedTime || !selectedService) return;

    const ticketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const ticketId = `AGN-${Date.now().toString().slice(-6)}`;

    const newTicket: AgendamientoTicket = {
      id: ticketId,
      ticketNumber,
      clientId: profile.idNumber,
      clientName: profile.fullName,
      clientCedula: profile.idNumber,
      clientPhone: profile.phone,
      clientEmail: profile.email,
      motoPlate: motorcycle.plate || 'S/P',
      motoModel: motorcycle.model,
      motoBrand: motorcycle.brand,
      motoChasis: motorcycle.vin || '',
      motoYear: motorcycle.year || 2025,
      workshopId: currentBranch.id,
      workshopName: currentBranch.name,
      scheduledDate: selectedDate,
      scheduledTime: selectedTime,
      serviceId: selectedService.id,
      serviceTitle: selectedService.title,
      serviceCategory: selectedService.category,
      estimatedCost: selectedService.id === 'alistamiento_pdi' ? 0 : 35,
      notes: notes.trim(),
      status: 'confirmado',
      createdAt: new Date().toISOString(),
    };

    // 1. Guardar y sincronizar agendamiento en la red de talleres (Supabase + LocalStorage + Realtime)
    addStoredAgendamiento(newTicket);

    // 2. Sincronizar en el portal del cliente
    const newScheduledMaintenance: ScheduledMaintenance = {
      id: ticketId,
      serviceTitle: selectedService.title,
      recommendedKm: motorcycle.currentKm,
      recommendedDate: selectedDate,
      scheduledDate: selectedDate,
      scheduledTime: selectedTime,
      branchName: currentBranch.name,
      branchId: currentBranch.id,
      status: 'confirmada',
      estimatedCost: selectedService.id === 'alistamiento_pdi' ? 0 : 35,
      tasks: selectedService.features,
      notes: notes ? `${notes} (Ticket: ${ticketNumber})` : `Ticket: ${ticketNumber}`,
    };

    onScheduleNewMaintenance(newScheduledMaintenance);

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#1d4ed8', '#10b981', '#ffffff'],
    });

    setConfirmedTicket(newTicket);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16 font-sans">
      {/* 1. Encabezado Limpio y Resumen del Vehículo */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition cursor-pointer"
              title="Regresar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-11 h-11 rounded-2xl bg-blue-600/10 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <CalendarPlus className="w-6 h-6 text-blue-600" />
          </div>

          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">
              Agendar Cita en Taller
            </h2>
            <p className="text-xs text-zinc-500">
              Elija el día de la semana, su turno y el servicio de alistamiento requerido.
            </p>
          </div>
        </div>

        {/* Datos de la moto y selector de sede */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 font-bold text-zinc-800">
            <Bike className="w-3.5 h-3.5 text-blue-600" />
            <span>{motorcycle.brand} {motorcycle.model}</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-200 font-mono text-[10px] text-zinc-700">
              {motorcycle.plate || 'S/P'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold">
            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent font-bold text-xs text-blue-900 outline-none cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="text-zinc-900">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Cuadro de Horario de la Semana */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
              1. Seleccione el Día de la Semana
            </h3>
          </div>

          {/* Navegación semanal */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <button
              type="button"
              disabled={currentWeekOffset <= 0}
              onClick={() => setCurrentWeekOffset((prev) => Math.max(0, prev - 1))}
              className={`p-1.5 rounded-xl border flex items-center gap-1 transition ${
                currentWeekOffset <= 0
                  ? 'border-zinc-200 text-zinc-300 cursor-not-allowed'
                  : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700 cursor-pointer'
              }`}
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Semana Anterior</span>
            </button>

            <span className="px-2.5 py-1 rounded-xl bg-zinc-100 text-zinc-700 text-[11px] font-bold">
              {currentWeekOffset === 0 ? 'Esta Semana' : `+${currentWeekOffset} Semanas`}
            </span>

            <button
              type="button"
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
              className="p-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 flex items-center gap-1 transition cursor-pointer"
              title="Semana siguiente"
            >
              <span className="hidden sm:inline text-[11px]">Semana Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grilla Semanal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {weekDays.map((day) => {
            const isSelected = selectedDate === day.dateStr;
            const isBlocked = day.isPast || day.isSunday || (day.isToday && !day.hasSlotsToday);

            return (
              <button
                key={day.dateStr}
                type="button"
                disabled={isBlocked}
                onClick={() => handleSelectDay(day.dateStr, isBlocked)}
                className={`p-3.5 rounded-2xl text-center border transition-all flex flex-col items-center justify-between gap-1.5 select-none relative ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/30'
                    : isBlocked
                    ? 'bg-zinc-100/60 border-zinc-200 text-zinc-400 cursor-not-allowed opacity-60'
                    : 'bg-zinc-50 hover:bg-white border-zinc-200 text-zinc-800 hover:border-blue-400 hover:shadow-xs cursor-pointer'
                }`}
              >
                {day.isToday && (
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white text-blue-700' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Hoy
                  </span>
                )}

                <span
                  className={`text-[11px] font-black uppercase tracking-wider ${
                    isSelected ? 'text-blue-100' : 'text-zinc-500'
                  }`}
                >
                  {day.dayName}
                </span>

                <span className="text-xl font-black">{day.dayNumber}</span>

                <span
                  className={`text-[10px] font-bold capitalize ${
                    isSelected ? 'text-blue-200' : 'text-zinc-400'
                  }`}
                >
                  {day.monthName}
                </span>

                <span
                  className={`text-[9px] font-semibold mt-1 px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-blue-700 text-white'
                      : day.isSunday
                      ? 'text-zinc-400'
                      : day.isPast
                      ? 'text-zinc-400'
                      : day.isToday && !day.hasSlotsToday
                      ? 'text-amber-800 bg-amber-100/80 font-bold'
                      : 'text-emerald-700 bg-emerald-50'
                  }`}
                >
                  {day.isSunday
                    ? 'Cerrado'
                    : day.isPast
                    ? 'Pasado'
                    : day.isToday && !day.hasSlotsToday
                    ? 'Sin turnos'
                    : 'Disponible'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Turnos Diarios (Aparecen al seleccionar el día) */}
      {selectedDate && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4 animate-slide-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
                2. Seleccione su Turno Diario ({selectedDate})
              </h3>
            </div>
            {selectedTime && (
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                Turno: {selectedTime}
              </span>
            )}
          </div>

          {availableTimeSlots.length === 0 ? (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-1.5 animate-fade-in">
              <Clock className="w-6 h-6 text-amber-600 mx-auto" />
              <p className="text-xs font-bold text-amber-900">
                No hay más turnos disponibles para esta fecha según la hora actual.
              </p>
              <p className="text-[11px] text-amber-700">
                Por favor seleccione el día de mañana u otra fecha en el calendario semanal superior.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Turnos de Mañana */}
              {mananaSlots.length > 0 && (
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">
                    ☀️ Turnos de la Mañana
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {mananaSlots.map((slot) => {
                      const isSelected = selectedTime === slot.time;
                      const isBooked = bookedSlots.has(slot.time.toUpperCase());

                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={isBooked}
                          onClick={() => handleSelectTurno(slot.time)}
                          className={`py-3 px-4 rounded-xl text-xs font-black border text-center transition-all select-none flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : isBooked
                              ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed line-through'
                              : 'bg-zinc-50 hover:bg-white text-zinc-800 border-zinc-200 hover:border-blue-400 cursor-pointer shadow-2xs'
                          }`}
                        >
                          <span>{slot.time}</span>
                          <span
                            className={`text-[9px] font-bold ${
                              isSelected
                                ? 'text-blue-200'
                                : isBooked
                                ? 'text-zinc-400'
                                : 'text-emerald-600'
                            }`}
                          >
                            {isBooked ? 'Ocupado' : 'Libre'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Turnos de Tarde */}
              {tardeSlots.length > 0 && (
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">
                    ⛅ Turnos de la Tarde
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {tardeSlots.map((slot) => {
                      const isSelected = selectedTime === slot.time;
                      const isBooked = bookedSlots.has(slot.time.toUpperCase());

                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={isBooked}
                          onClick={() => handleSelectTurno(slot.time)}
                          className={`py-3 px-4 rounded-xl text-xs font-black border text-center transition-all select-none flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : isBooked
                              ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed line-through'
                              : 'bg-zinc-50 hover:bg-white text-zinc-800 border-zinc-200 hover:border-blue-400 cursor-pointer shadow-2xs'
                          }`}
                        >
                          <span>{slot.time}</span>
                          <span
                            className={`text-[9px] font-bold ${
                              isSelected
                                ? 'text-blue-200'
                                : isBooked
                                ? 'text-zinc-400'
                                : 'text-emerald-600'
                            }`}
                          >
                            {isBooked ? 'Ocupado' : 'Libre'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Servicios Manejados en Alistamiento (Aparecen al elegir turno) */}
      {selectedTime && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4 animate-slide-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
                3. Seleccione el Servicio Técnico de Alistamiento
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ALISTAMIENTO_SERVICES.map((srv) => {
              const isSelected = selectedService?.id === srv.id;

              return (
                <div
                  key={srv.id}
                  onClick={() => setSelectedService(srv)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20'
                      : 'border-zinc-200 bg-zinc-50 hover:bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        {srv.badge}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-500">
                        ⏱️ {srv.estimatedTime}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-zinc-900 leading-snug">
                      {srv.title}
                    </h4>

                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {srv.description}
                    </p>

                    <div className="pt-2 border-t border-zinc-200/80 space-y-1">
                      {srv.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Observaciones adicionales */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              Observaciones o detalles para el técnico (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Revisar tensión de embrague, ruido en freno delantero, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 transition"
            />
          </div>
        </div>
      )}

      {/* 5. Barra de Confirmación Final */}
      {selectedDate && selectedTime && selectedService && (
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-slide-in">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 block">
              Resumen de la Cita Técnica
            </span>
            <h4 className="text-base font-black text-white">
              {selectedService.title}
            </h4>
            <p className="text-xs text-blue-100 flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span>📅 {selectedDate}</span>
              <span>•</span>
              <span>⏰ {selectedTime}</span>
              <span>•</span>
              <span>🏢 {currentBranch.name}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleConfirmAppointment}
            className="w-full md:w-auto px-7 py-3.5 rounded-xl bg-white text-blue-800 hover:bg-blue-50 font-black text-xs uppercase tracking-wider shadow-md hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Confirmar Agendamiento</span>
          </button>
        </div>
      )}

      {/* Modal de Confirmación Exitosa con Ticket */}
      {confirmedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ¡Cita Agendada Exitosamente!
              </span>
              <h3 className="text-xl font-black text-zinc-900 mt-1">
                Ticket {confirmedTicket.ticketNumber}
              </h3>
              <p className="text-xs text-zinc-500">
                Su turno técnico ha sido registrado y sincronizado en la bandeja del Jefe de Taller.
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                <span className="text-zinc-500">Sede Oficial:</span>
                <span className="font-bold text-zinc-900">{confirmedTicket.workshopName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                <span className="text-zinc-500">Fecha y Turno:</span>
                <span className="font-bold text-blue-700">
                  {confirmedTicket.scheduledDate} a las {confirmedTicket.scheduledTime}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                <span className="text-zinc-500">Motocicleta:</span>
                <span className="font-bold text-zinc-900">
                  {confirmedTicket.motoBrand} {confirmedTicket.motoModel} ({confirmedTicket.motoPlate})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Servicio Solicitado:</span>
                <span className="font-black text-zinc-900">{confirmedTicket.serviceTitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmedTicket(null);
                  if (onBack) onBack();
                }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                Entendido y Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
