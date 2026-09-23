// src/components/desktop/MaintenancesDesktop.tsx
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

export const MaintenancesDesktop: React.FC<Props> = ({
  scheduledMaintenances,
  motorcycle,
  onNavigateToSchedule,
}) => {
  const kmSinceLastOil = motorcycle.currentKm - motorcycle.lastOilChangeKm;
  const kmRemainingOil = Math.max(0, motorcycle.oilChangeIntervalKm - kmSinceLastOil);
  const oilHealthPercentage = Math.max(0, Math.min(100, Math.round((kmRemainingOil / motorcycle.oilChangeIntervalKm) * 100)));

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              Mantenimientos Programados y Citas
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Control predictivo de salud de lubricante y agendamiento directo en cualquiera de nuestras sucursales
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToSchedule}
          className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-2.5 px-5 rounded-xl shadow-md shadow-red-600/20 transition flex items-center gap-2 active:scale-98 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Agendar Nueva Cita</span>
        </button>
      </div>

      {/* Tarjeta de Vida de Aceite Panorámica */}
      <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between gap-6 w-full">
        <div>
          <span className="text-xs text-zinc-600 uppercase font-bold tracking-wider block">
            Salud y Vida Útil del Aceite de Motor
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-black text-zinc-900">
              Restan ~{kmRemainingOil.toLocaleString()} KM
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              (Odómetro actual: {motorcycle.currentKm.toLocaleString()} km • Intervalo: {motorcycle.oilChangeIntervalKm.toLocaleString()} km)
            </span>
          </div>
        </div>

        <div className="w-80 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-600">Vida restante calculada:</span>
            <span className={`font-bold ${
              oilHealthPercentage > 40 ? 'text-emerald-700' : oilHealthPercentage > 15 ? 'text-amber-700' : 'text-red-700'
            }`}>
              {oilHealthPercentage}%
            </span>
          </div>
          <div className="h-2.5 bg-zinc-200 rounded-full overflow-hidden">
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
        <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
          Citas y Mantenimientos Registrados
        </h3>

        {scheduledMaintenances.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-zinc-300 text-center space-y-3 max-w-xl mx-auto my-4">
            <Calendar className="w-10 h-10 text-zinc-400 mx-auto" />
            <h4 className="text-sm font-bold text-zinc-900">Sin citas ni mantenimientos programados</h4>
            <p className="text-xs text-zinc-500">
              No tienes citas pendientes. Puedes agendar una nueva cita técnica haciendo clic en el botón superior o esperar a que el taller te recomiende tu próximo servicio.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
            {scheduledMaintenances.map((maint) => (
              <div
                key={maint.id}
                className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3 hover:border-zinc-300 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">{maint.serviceTitle}</h4>
                    <span className="text-xs text-blue-600 font-mono font-medium">
                      Recomendado a los {maint.recommendedKm.toLocaleString()} KM
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    {maint.status}
                  </span>
                </div>

                <div className="text-xs text-zinc-600 flex items-center justify-between border-t border-zinc-100 pt-3">
                  <span>
                    <strong className="text-zinc-800">Fecha:</strong> {maint.scheduledDate || maint.recommendedDate} {maint.scheduledTime ? `• ${maint.scheduledTime}` : ''}
                  </span>
                  <span>
                    <strong className="text-zinc-800">Sucursal:</strong> {maint.branchName}
                  </span>
                </div>

                <div className="text-xs text-zinc-500 pt-1">
                  <strong className="text-zinc-700">Tareas:</strong> {maint.tasks.join(' • ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
