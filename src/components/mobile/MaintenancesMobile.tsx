// src/components/mobile/MaintenancesMobile.tsx
import React from 'react';
import {
  Calendar,
  PlusCircle,
} from 'lucide-react';
import { ScheduledMaintenance, MotorcycleClientData, Branch } from '../../types/customer';

interface Props {
  scheduledMaintenances: ScheduledMaintenance[];
  onScheduleNewMaintenance?: (maintenance: ScheduledMaintenance) => void;
  motorcycle: MotorcycleClientData;
  branches: Branch[];
  onNavigateToSchedule: () => void;
}

export const MaintenancesMobile: React.FC<Props> = ({
  scheduledMaintenances,
  motorcycle,
  onNavigateToSchedule,
}) => {
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
          onClick={onNavigateToSchedule}
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

      {/* Lista de Citas Registradas */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          Citas y Mantenimientos Registrados
        </h3>

        {scheduledMaintenances.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-dashed border-zinc-300 text-center space-y-2">
            <Calendar className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs text-zinc-500">
              No tienes citas de mantenimiento programadas en este momento.
            </p>
          </div>
        ) : (
          scheduledMaintenances.map((maint) => (
            <div
              key={maint.id}
              className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">{maint.serviceTitle}</h4>
                  <span className="text-[11px] text-blue-600 font-mono">
                    Recomendado: {maint.recommendedKm.toLocaleString()} KM
                  </span>
                </div>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  {maint.status}
                </span>
              </div>

              <div className="text-[11px] text-zinc-600 border-t border-zinc-100 pt-2 flex flex-col gap-1">
                <div>
                  <strong>Fecha:</strong> {maint.scheduledDate || maint.recommendedDate} {maint.scheduledTime ? `• ${maint.scheduledTime}` : ''}
                </div>
                <div>
                  <strong>Sucursal:</strong> {maint.branchName}
                </div>
              </div>

              <div className="text-[10px] text-zinc-500 bg-zinc-50 p-2 rounded-lg">
                <span className="font-semibold text-zinc-700">Incluye: </span>
                {maint.tasks.join(', ')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
