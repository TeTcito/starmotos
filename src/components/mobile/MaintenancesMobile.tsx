// src/components/mobile/MaintenancesMobile.tsx
import React, { useState } from 'react';
import {
  Calendar,
  PlusCircle,
} from 'lucide-react';
import { ScheduledMaintenance, MotorcycleClientData, Branch } from '../../types/customer';

interface Props {
  scheduledMaintenances: ScheduledMaintenance[];
  onScheduleNewMaintenance: (maintenance: ScheduledMaintenance) => void;
  motorcycle: MotorcycleClientData;
  branches: Branch[];
}

export const MaintenancesMobile: React.FC<Props> = ({
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
      tasks: ['Aceite Sintético', 'Filtro OEM', 'Tensión de Cadena', 'Chequeo Frenos'],
      notes: scheduleNotes || 'Cita solicitada desde móvil.',
    };

    onScheduleNewMaintenance(newMaint);
    setIsScheduleModalOpen(false);
    setScheduleNotes('');
  };

  const kmSinceLastOil = motorcycle.currentKm - motorcycle.lastOilChangeKm;
  const kmRemainingOil = Math.max(0, motorcycle.oilChangeIntervalKm - kmSinceLastOil);
  const oilHealthPercentage = Math.max(0, Math.min(100, Math.round((kmRemainingOil / motorcycle.oilChangeIntervalKm) * 100)));

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Encabezado sin contenedor externo */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-zinc-900">
            Mantenimientos
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsScheduleModalOpen(true)}
          className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow transition flex items-center gap-1.5 active:scale-98 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Agendar Cita</span>
        </button>
      </div>

      {/* Tarjeta de Vida de Aceite */}
      <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-3">
        <div>
          <span className="text-[10px] text-zinc-500 uppercase font-bold block">
            Próximo Cambio de Aceite
          </span>
          <span className="text-sm font-bold text-zinc-900">
            Restan ~{kmRemainingOil.toLocaleString()} KM
          </span>
          <span className="text-[10px] text-zinc-500 block font-mono">
            (Odómetro actual: {motorcycle.currentKm.toLocaleString()} km)
          </span>
        </div>

        <div className="w-full space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-600">Vida restante:</span>
            <span className="font-bold text-zinc-900">{oilHealthPercentage}%</span>
          </div>
          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
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

      {/* Lista de Citas y Mantenimientos */}
      <div className="space-y-3">
        {scheduledMaintenances.map((maint) => (
          <div
            key={maint.id}
            className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-zinc-900">{maint.serviceTitle}</h4>
                <span className="text-[10px] text-blue-600 font-mono font-semibold">
                  Recomendado a los {maint.recommendedKm.toLocaleString()} KM
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                {maint.status}
              </span>
            </div>

            <div className="text-xs text-zinc-600 flex flex-col gap-0.5 border-t border-zinc-100 pt-2">
              <span>
                <strong className="text-zinc-800">Fecha:</strong> {maint.scheduledDate || maint.recommendedDate} {maint.scheduledTime ? `• ${maint.scheduledTime}` : ''}
              </span>
              <span>
                <strong className="text-zinc-800">Sucursal:</strong> {maint.branchName.replace('StarMotos ', '')}
              </span>
            </div>

            <div className="text-[11px] text-zinc-500">
              {maint.tasks.join(' • ')}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Agendar Cita */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold text-zinc-900">Agendar Cita</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Servicio Requerido
                </label>
                <select
                  value={selectedServiceTitle}
                  onChange={(e) => setSelectedServiceTitle(e.target.value)}
                  className="w-full bg-white border border-zinc-300 text-zinc-900 rounded-xl p-2 text-xs cursor-pointer focus:border-blue-600"
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
                <label className="block font-semibold text-zinc-700 mb-1">
                  Sucursal
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-white border border-zinc-300 text-zinc-900 rounded-xl p-2 text-xs cursor-pointer focus:border-blue-600"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    required
                    className="w-full bg-white border border-zinc-300 text-zinc-900 rounded-xl p-2 text-xs font-mono focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Hora
                  </label>
                  <select
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-white border border-zinc-300 text-zinc-900 rounded-xl p-2 text-xs font-mono cursor-pointer focus:border-blue-600"
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
                <label className="block font-semibold text-zinc-700 mb-1">
                  Nota adicional
                </label>
                <textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  rows={2}
                  placeholder="Detalles para el taller..."
                  className="w-full bg-white border border-zinc-300 text-zinc-900 rounded-xl p-2 text-xs placeholder:text-zinc-400 focus:border-blue-600"
                />
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow transition"
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
