// src/components/mobile/ScheduleAppointmentMobile.tsx
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
}

const ALISTAMIENTO_SERVICES: AlistamientoServiceOption[] = [
  {
    id: 'alistamiento_pdi',
    title: 'Alistamiento PDI (Inspección y Puesta a Punto)',
    category: 'Alistamiento',
    badge: 'Paso 1 Obligatorio',
    description: 'Chequeo integral de 30 puntos, torqueo de chasis, sistema eléctrico y lubricantes.',
    estimatedTime: '1 - 2h',
  },
  {
    id: 'engrasado',
    title: 'Engrasado General & Kit de Arrastre',
    category: 'Intermedio',
    badge: 'Paso 2 Engrasado',
    description: 'Desarme y lubricación de rodamientos de dirección, basculante y kit de arrastre.',
    estimatedTime: '2h',
  },
  {
    id: 'mantenimiento',
    title: 'Mantenimiento Preventivo Periódico',
    category: 'Periódico Mayor',
    badge: 'Paso 3 Mantenimiento',
    description: 'Cambio de aceite, filtro, bujía, calibración de frenos y revisión general.',
    estimatedTime: '2 - 3h',
  },
];

const DAILY_TIME_SLOTS = [
  { time: '08:30 AM', shift: 'mañana' },
  { time: '09:30 AM', shift: 'mañana' },
  { time: '10:30 AM', shift: 'mañana' },
  { time: '11:30 AM', shift: 'mañana' },
  { time: '14:00 PM', shift: 'tarde' },
  { time: '15:00 PM', shift: 'tarde' },
  { time: '16:00 PM', shift: 'tarde' },
  { time: '17:00 PM', shift: 'tarde' },
];

export const ScheduleAppointmentMobile: React.FC<Props> = ({
  motorcycle,
  profile,
  branches,
  scheduledMaintenances,
  onScheduleNewMaintenance,
  onBack,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || 'matriz-la-mana');
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    if (today.getDay() === 0) today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });

  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedService, setSelectedService] = useState<AlistamientoServiceOption | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [confirmedTicket, setConfirmedTicket] = useState<AgendamientoTicket | null>(null);

  const currentBranch = useMemo(() => {
    return branches.find((b) => b.id === selectedBranchId) || branches[0];
  }, [branches, selectedBranchId]);

  // Generar días de la semana
  const weekDays = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + currentWeekOffset * 7);

    const day = base.getDay();
    const diff = base.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(base.setDate(diff));

    const dayNamesShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const result = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isPast = dateStr < todayStr;
      const isSunday = i === 6;
      const isToday = dateStr === todayStr;

      result.push({
        dateStr,
        dayName: dayNamesShort[i],
        dayNumber: d.getDate(),
        monthName: d.toLocaleString('es-EC', { month: 'short' }),
        isPast,
        isSunday,
        isToday,
      });
    }
    return result;
  }, [currentWeekOffset]);

  // Turnos ya reservados
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

  const handleSelectDay = (dateStr: string, isPast: boolean) => {
    if (isPast) return;
    setSelectedDate(dateStr);
    setSelectedTime('');
  };

  const handleSelectTurno = (time: string) => {
    setSelectedTime(time);
    if (!selectedService) {
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

    // Guardar en la red sincronizada
    addStoredAgendamiento(newTicket);

    // Sincronizar en el cliente
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
      tasks: [selectedService.description],
      notes: notes ? `${notes} (Ticket: ${ticketNumber})` : `Ticket: ${ticketNumber}`,
    };

    onScheduleNewMaintenance(newScheduledMaintenance);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#1d4ed8', '#10b981', '#ffffff'],
    });

    setConfirmedTicket(newTicket);
  };

  return (
    <div className="w-full space-y-4 pb-20 font-sans">
      {/* Header móvil */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <CalendarPlus className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-black text-zinc-900 leading-tight">
              Agendar Cita en Taller
            </h2>
            <p className="text-[11px] text-zinc-500">
              Seleccione día, turno y servicio de alistamiento
            </p>
          </div>
        </div>

        {/* Info moto y sede */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between bg-zinc-50 p-2 rounded-xl border border-zinc-200">
            <div className="flex items-center gap-1.5 truncate">
              <Bike className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-bold text-zinc-900 truncate">
                {motorcycle.brand} {motorcycle.model}
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-zinc-200 font-mono text-[10px] font-black shrink-0">
              {motorcycle.plate || 'S/P'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-blue-50 p-2 rounded-xl border border-blue-200">
            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full bg-transparent font-bold text-xs text-blue-900 outline-none"
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

      {/* 1. Cuadro de Horario de la Semana */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black uppercase text-zinc-900">
              1. Elige el Día
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              disabled={currentWeekOffset <= 0}
              onClick={() => setCurrentWeekOffset((prev) => Math.max(0, prev - 1))}
              className={`p-1 rounded-lg border ${
                currentWeekOffset <= 0 ? 'text-zinc-300 border-zinc-200' : 'text-zinc-700 border-zinc-300'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold text-zinc-500">
              {currentWeekOffset === 0 ? 'Esta Semana' : `+${currentWeekOffset} sem`}
            </span>
            <button
              type="button"
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
              className="p-1 rounded-lg border border-zinc-300 text-zinc-700"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Grilla horizontal de días */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const isSelected = selectedDate === day.dateStr;
            const isBlocked = day.isPast || day.isSunday;

            return (
              <button
                key={day.dateStr}
                type="button"
                disabled={isBlocked}
                onClick={() => handleSelectDay(day.dateStr, day.isPast)}
                className={`py-2 px-1 rounded-xl text-center border transition flex flex-col items-center justify-center gap-0.5 select-none ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : isBlocked
                    ? 'bg-zinc-100 border-zinc-200 text-zinc-300 opacity-60'
                    : 'bg-zinc-50 text-zinc-800 border-zinc-200'
                }`}
              >
                <span className="text-[9px] font-bold uppercase">{day.dayName}</span>
                <span className="text-sm font-black">{day.dayNumber}</span>
                <span className="text-[8px] opacity-80">{day.monthName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Turnos Diarios */}
      {selectedDate && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase text-zinc-900">
                2. Elige el Turno ({selectedDate})
              </h3>
            </div>
            {selectedTime && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {selectedTime}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {DAILY_TIME_SLOTS.map((slot) => {
              const isSelected = selectedTime === slot.time;
              const isBooked = bookedSlots.has(slot.time.toUpperCase());

              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={isBooked}
                  onClick={() => handleSelectTurno(slot.time)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black border text-center transition ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : isBooked
                      ? 'bg-zinc-100 text-zinc-300 border-zinc-200 line-through'
                      : 'bg-zinc-50 text-zinc-800 border-zinc-200'
                  }`}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Servicios de Alistamiento */}
      {selectedTime && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black uppercase text-zinc-900">
              3. Servicio de Alistamiento
            </h3>
          </div>

          <div className="space-y-2">
            {ALISTAMIENTO_SERVICES.map((srv) => {
              const isSelected = selectedService?.id === srv.id;

              return (
                <div
                  key={srv.id}
                  onClick={() => setSelectedService(srv)}
                  className={`p-3 rounded-xl border-2 transition cursor-pointer select-none ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50'
                      : 'border-zinc-200 bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {srv.badge}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500">
                      ⏱️ {srv.estimatedTime}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-zinc-900">
                    {srv.title}
                  </h4>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    {srv.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Observaciones */}
          <div className="pt-1">
            <textarea
              rows={2}
              placeholder="Observaciones opcionales para el técnico..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
            />
          </div>
        </div>
      )}

      {/* 4. Botón de Confirmación */}
      {selectedDate && selectedTime && selectedService && (
        <div className="bg-blue-700 text-white p-4 rounded-2xl space-y-3 shadow-md">
          <div className="text-xs">
            <span className="text-[10px] uppercase font-bold text-blue-200 block">
              Confirmación de Cita
            </span>
            <p className="font-bold text-white truncate">{selectedService.title}</p>
            <p className="text-blue-100 text-[11px] mt-0.5">
              📅 {selectedDate} a las {selectedTime} • {currentBranch.name}
            </p>
          </div>

          <button
            type="button"
            onClick={handleConfirmAppointment}
            className="w-full py-3 bg-white text-blue-800 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Confirmar Agendamiento</span>
          </button>
        </div>
      )}

      {/* Modal de confirmación con ticket */}
      {confirmedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-zinc-900">
                ¡Cita Agendada!
              </h3>
              <p className="text-xs text-blue-700 font-bold">
                Ticket: {confirmedTicket.ticketNumber}
              </p>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-left space-y-1.5">
              <p className="text-zinc-600">
                📅 Fecha: <span className="font-bold text-zinc-900">{confirmedTicket.scheduledDate} ({confirmedTicket.scheduledTime})</span>
              </p>
              <p className="text-zinc-600">
                🏢 Sede: <span className="font-bold text-zinc-900">{confirmedTicket.workshopName}</span>
              </p>
              <p className="text-zinc-600">
                🔧 Servicio: <span className="font-bold text-zinc-900">{confirmedTicket.serviceTitle}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmedTicket(null);
                if (onBack) onBack();
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              Listo y Finalizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
