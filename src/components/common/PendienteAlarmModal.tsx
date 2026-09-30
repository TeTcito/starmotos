// src/components/common/PendienteAlarmModal.tsx
import React, { useEffect } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  DollarSign,
  User,
  Calendar,
  X,
  Volume2,
} from 'lucide-react';
import { AdminPendiente } from '../../types/customer';
import { playAlarmSound } from '../../utils/alarmSound';

interface Props {
  isOpen: boolean;
  pendiente: AdminPendiente | null;
  onClose: () => void;
  onComplete: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
}

export const PendienteAlarmModal: React.FC<Props> = ({
  isOpen,
  pendiente,
  onClose,
  onComplete,
  onSnooze,
}) => {
  useEffect(() => {
    if (isOpen && pendiente) {
      // Reproducir sonido de alarma inmediatamente
      playAlarmSound('alarm');

      // Repetir el sonido cada 4 segundos mientras el modal esté abierto (hasta 3 veces)
      let count = 0;
      const interval = setInterval(() => {
        count++;
        if (count < 3) {
          playAlarmSound('alarm');
        } else {
          clearInterval(interval);
        }
      }, 3500);

      return () => clearInterval(interval);
    }
  }, [isOpen, pendiente?.id]);

  if (!isOpen || !pendiente) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
      >
        {/* Cabecera Urgente con animación */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-5 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/40 flex items-center justify-center animate-bounce">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider">
                  <Volume2 className="w-3 h-3 animate-pulse" />
                  Alarma Programada
                </span>
                <h2 className="text-lg font-black text-white leading-tight mt-0.5">
                  ¡Hora del Pendiente!
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white transition cursor-pointer"
              title="Cerrar alarma"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido de la Tarea Programada */}
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-extrabold text-zinc-900 leading-snug">
                {pendiente.title}
              </h3>
              <span className="shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                {pendiente.priority}
              </span>
            </div>

            {pendiente.description && (
              <p className="text-xs text-zinc-600 leading-relaxed pt-1 border-t border-rose-100">
                {pendiente.description}
              </p>
            )}
          </div>

          {/* Metadatos: Hora, Fecha, Taller, Costo */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold block">Hora programada</span>
                <span className="font-bold text-zinc-800">{pendiente.dueTime || 'Hoy'}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold block">Fecha límite</span>
                <span className="font-bold text-zinc-800">{pendiente.dueDate || 'Hoy'}</span>
              </div>
            </div>

            {pendiente.workshopName && (
              <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-zinc-500 font-semibold block">Sucursal / Taller</span>
                  <span className="font-bold text-zinc-800 truncate block">{pendiente.workshopName}</span>
                </div>
              </div>
            )}

            {pendiente.relatedClientOrBike && (
              <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-zinc-500 font-semibold block">Cliente / Moto</span>
                  <span className="font-bold text-zinc-800 truncate block">{pendiente.relatedClientOrBike}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="p-4 bg-slate-50 border-t border-zinc-200 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            type="button"
            onClick={() => onSnooze(pendiente.id, 10)}
            className="px-3.5 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Posponer 10 min</span>
          </button>

          <button
            type="button"
            onClick={() => onComplete(pendiente.id)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Marcar Completada</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition flex items-center justify-center cursor-pointer"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
