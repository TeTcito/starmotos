// src/components/desktop/MaintenancesDesktop.tsx
import React, { useState } from 'react';
import {
  Calendar,
  PlusCircle,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { ScheduledMaintenance, MotorcycleClientData, Branch } from '../../types/customer';

interface Props {
  scheduledMaintenances: ScheduledMaintenance[];
  onScheduleNewMaintenance: (maintenance: ScheduledMaintenance) => void;
  motorcycle: MotorcycleClientData;
  branches: Branch[];
}

export const MaintenancesDesktop: React.FC<Props> = ({
  scheduledMaintenances,
  onScheduleNewMaintenance,
  motorcycle,
  branches,
}) => {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || 'matriz-quito');
  const [selectedServiceTitle, setSelectedServiceTitle] = useState('Mantenimiento Preventivo (Aceite y Filtros)');
  const [scheduleDate, setScheduleDate] = useState('2026-09-25');
  const [scheduleTime, setScheduleTime] = useState('09:30');
  const [scheduleNotes, setScheduleNotes] = useState('');

  const handleConfirmSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = branches.find((b) => b.id === selectedBranchId) || branches[0];
    const newMaint: ScheduledMaintenance = {
      id: `maint-${Date.now()}`,
      serviceTitle: selectedServiceTitle,
      recommendedKm: motorcycle.currentKm + 1000,
      recommendedDate: scheduleDate,
      scheduledDate: scheduleDate,
      scheduledTime: scheduleTime,
      branchName: branch.name,
      branchId: branch.id,
      status: 'confirmada',
      estimatedCost: 65.0,
      tasks: ['Aceite Sintético Motul', 'Filtro de Aceite OEM', 'Tensión y Lubricación de Cadena', 'Chequeo General de Frenos'],
      notes: scheduleNotes || 'Cita solicitada desde portal de escritorio.',
    };

    onScheduleNewMaintenance(newMaint);
    setIsScheduleModalOpen(false);
    setScheduleNotes('');
  };

  const kmSinceLastOil = motorcycle.currentKm - motorcycle.lastOilChangeKm;
  const kmRemainingOil = Math.max(0, motorcycle.oilChangeIntervalKm - kmSinceLastOil);
  const oilHealthPercentage = Math.max(0, Math.min(100, Math.round((kmRemainingOil / motorcycle.oilChangeIntervalKm) * 100)));

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Mantenimientos Programados y Citas
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Control predictivo de salud de lubricante y agendamiento directo en cualquiera de nuestras sucursales
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsScheduleModalOpen(true)}
          className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-2.5 px-5 rounded-xl shadow-lg shadow-red-600/20 transition flex items-center gap-2 active:scale-98 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Agendar Nueva Cita</span>
        </button>
      </div>

      {/* Tarjeta de Vida de Aceite Panorámica */}
      <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex items-center justify-between gap-6 w-full">
        <div>
          <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider block">
            Salud y Vida Útil del Aceite de Motor
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-black text-white">
              Restan ~{kmRemainingOil.toLocaleString()} KM
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              (Odómetro actual: {motorcycle.currentKm.toLocaleString()} km • Intervalo: {motorcycle.oilChangeIntervalKm.toLocaleString()} km)
            </span>
          </div>
        </div>

        <div className="w-80 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400">Vida restante calculada:</span>
            <span className={`font-bold ${
              oilHealthPercentage > 40 ? 'text-emerald-400' : oilHealthPercentage > 15 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {oilHealthPercentage}%
            </span>
          </div>
          <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                oilHealthPercentage > 40
                  ? 'bg-emerald-500'
                  : oilHealthPercentage > 15
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${oilHealthPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lista de Citas en Grid de 2 Columnas Anchas */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
          Citas y Mantenimientos Registrados
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
          {scheduledMaintenances.map((maint) => (
            <div
              key={maint.id}
              className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3 hover:border-zinc-700 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white">{maint.serviceTitle}</h4>
                  <span className="text-xs text-blue-400 font-mono">
                    Recomendado a los {maint.recommendedKm.toLocaleString()} KM
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  {maint.status}
                </span>
              </div>

              <div className="text-xs text-zinc-300 flex items-center justify-between border-t border-zinc-800 pt-3">
                <span>
                  <strong>Fecha:</strong> {maint.scheduledDate || maint.recommendedDate} {maint.scheduledTime ? `• ${maint.scheduledTime}` : ''}
                </span>
                <span>
                  <strong>Sucursal:</strong> {maint.branchName}
                </span>
              </div>

              <div className="text-xs text-zinc-400 pt-1">
                <strong>Tareas:</strong> {maint.tasks.join(' • ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Agendar Cita */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-bold text-white">Agendar Cita en StarMotos</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  Servicio Requerido
                </label>
                <select
                  value={selectedServiceTitle}
                  onChange={(e) => setSelectedServiceTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs cursor-pointer"
                >
                  <option value="Mantenimiento Preventivo (Aceite y Filtros)">
                    Mantenimiento Preventivo (Aceite + Filtro + Cadena)
                  </option>
                  <option value="Servicio Mayor / Afinamiento">
                    Servicio Mayor (Válvulas + Inyección + Bujías)
                  </option>
                  <option value="Revisión de Frenos">
                    Revisión de Frenos y Pastillas
                  </option>
                  <option value="Kit de Arrastre">
                    Cambio Kit de Arrastre
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  Sucursal StarMotos
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.address})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    Fecha deseada
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    Hora disponible
                  </label>
                  <select
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-mono cursor-pointer"
                  >
                    <option value="08:30">08:30 AM</option>
                    <option value="09:30">09:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  Observaciones adicionales
                </label>
                <textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  rows={2}
                  placeholder="Detalles o síntomas para el mecánico..."
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs placeholder:text-zinc-600"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 font-bold hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  Confirmar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
