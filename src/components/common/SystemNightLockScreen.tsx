// src/components/common/SystemNightLockScreen.tsx
import React, { useState, useEffect } from 'react';
import { Lock, Moon, Clock, ShieldAlert, LogOut, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { useSystemScheduleLock } from '../../utils/systemScheduleLock';
import { UserRole } from '../../types/customer';

interface Props {
  currentRole: UserRole;
  onLogout: () => void;
}

export const SystemNightLockScreen: React.FC<Props> = ({ currentRole, onLogout }) => {
  const lock = useSystemScheduleLock();
  const [liveTime, setLiveTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedHours = String(liveTime.getHours()).padStart(2, '0');
  const formattedMinutes = String(liveTime.getMinutes()).padStart(2, '0');
  const formattedSeconds = String(liveTime.getSeconds()).padStart(2, '0');
  const dateFormatted = liveTime.toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const roleNameMap: Record<UserRole, string> = {
    taller: 'Sede / Taller Autorizado',
    garante: 'Garante Oficial de Marca',
    gps: 'Servicios GPS Satelital',
    cliente: 'Portal Cliente Propietario',
    admin: 'Administración Central',
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Luces ambientales tenues de fondo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 flex flex-col items-center text-center animate-fade-in">
        {/* Header con Logo */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1 rounded-full bg-gradient-to-tr from-blue-600 via-white to-red-600 shadow-md">
            <img
              src="/starmotos-logo.jpg"
              alt="StarMotos"
              className="w-7 h-7 rounded-full object-cover bg-white"
            />
          </div>
          <span className="text-sm font-black tracking-wider uppercase">
            <span className="text-blue-500">STAR</span>
            <span className="text-red-500">MOTOS</span>
          </span>
        </div>

        {/* Icono central de Bloqueo Nocturno */}
        <div className="relative mb-4">
          <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
            <Moon className="w-9 h-9 text-blue-400 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-600 border-2 border-zinc-900 flex items-center justify-center text-white shadow-md">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Badge de Horario */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-blue-950/70 border border-blue-700/50 text-blue-300 mb-3 shadow-inner">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Restricción de Horario • 10:00 PM — 07:00 AM</span>
        </div>

        {/* Reloj en vivo */}
        <div className="mb-4">
          <div className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-white drop-shadow-md">
            {formattedHours}:{formattedMinutes}
            <span className="text-2xl text-blue-400 font-normal">:{formattedSeconds}</span>
          </div>
          <p className="text-[11px] font-medium text-zinc-400 capitalize mt-1">
            {dateFormatted}
          </p>
        </div>

        {/* Título y Mensaje explicativo */}
        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
          Sistema Fuera de Horario para Sedes
        </h2>

        <div className="w-full mt-3 p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-left space-y-2">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Acceso Temporalmente Suspendido</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
            Por política operativa, el sistema para los roles de <strong>Sedes (Talleres), Garantes, GPS y Clientes</strong> queda fuera de servicio después de las <strong>10:00 de la noche</strong>.
          </p>
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <Sparkles className="w-3 h-3" /> Reactivación automática:
            </span>
            <span className="font-bold text-white font-mono">07:00 AM</span>
          </div>
        </div>

        {/* Aviso de Rol Actual y Administración */}
        <div className="mt-3 w-full p-2.5 rounded-xl bg-blue-950/30 border border-blue-900/40 text-left flex items-center gap-2.5 text-xs text-blue-200">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="block font-bold truncate">Rol: {roleNameMap[currentRole] || currentRole}</span>
            <span className="text-[10px] text-zinc-400 block truncate">Solo la Administración Central está autorizada en este horario.</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-5">
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold border border-white/20 shadow-md transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-300" />
            <span>Cerrar Sesión</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onLogout();
              try {
                window.location.href = '/admin/';
              } catch (_) {}
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Soy Administrador</span>
          </button>
        </div>

        <p className="text-[10px] text-zinc-500 mt-4 font-mono">
          StarMotos Ecuador • Seguridad & Control de Accesos
        </p>
      </div>
    </div>
  );
};
