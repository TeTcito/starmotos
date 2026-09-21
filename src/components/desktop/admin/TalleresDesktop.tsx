// src/components/desktop/admin/TalleresDesktop.tsx
import React from 'react';
import {
  Wrench,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  MapPin,
  Phone,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Workshop } from '../../../types/customer';

interface Props {
  workshops: Workshop[];
}

export const TalleresDesktop: React.FC<Props> = ({ workshops }) => {
  const totalActiveOrders = workshops.reduce((acc, w) => acc + w.activeOrders, 0);
  const totalCompletedToday = workshops.reduce((acc, w) => acc + w.completedToday, 0);
  const totalMechanics = workshops.reduce((acc, w) => acc + w.mechanics, 0);
  const totalPendingWarranties = workshops.reduce((acc, w) => acc + w.pendingWarranties, 0);

  return (
    <div className="space-y-6">
      {/* Encabezado y Estadísticas Generales */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <span>Control Operativo de Talleres & Sucursales</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Supervisión en tiempo real de capacidad, mecánicos y flujo de trabajo de la red StarMotos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Red 100% Operativa
            </span>
          </div>
        </div>

        {/* Métricas Resumen */}
        <div className="grid grid-cols-4 gap-4 mt-5">
          <div className="bg-[#f0f6fc] border border-[#b8d1ea] p-4 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Órdenes en Taller</p>
              <p className="text-xl font-black text-zinc-900">{totalActiveOrders} OTs activas</p>
            </div>
          </div>

          <div className="bg-[#f0f6fc] border border-[#b8d1ea] p-4 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Entregadas Hoy</p>
              <p className="text-xl font-black text-zinc-900">{totalCompletedToday} Motos</p>
            </div>
          </div>

          <div className="bg-[#f0f6fc] border border-[#b8d1ea] p-4 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Técnicos / Mecánicos</p>
              <p className="text-xl font-black text-zinc-900">{totalMechanics} Certificados</p>
            </div>
          </div>

          <div className="bg-[#f0f6fc] border border-[#b8d1ea] p-4 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Garantías en Curso</p>
              <p className="text-xl font-black text-zinc-900">{totalPendingWarranties} Solicitudes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Talleres */}
      <div className="grid grid-cols-2 gap-5">
        {workshops.map((ws) => {
          const isOperativo = ws.status === 'operativo';
          return (
            <div
              key={ws.id}
              className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all hover:border-blue-300 flex flex-col justify-between"
            >
              <div>
                {/* Header del Taller */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {ws.code}
                      </span>
                      <h3 className="text-base font-bold text-zinc-900">{ws.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{ws.address}, {ws.city}</span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isOperativo
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${isOperativo ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}
                    />
                    {isOperativo ? 'OPERATIVO' : 'MANTENIMIENTO'}
                  </span>
                </div>

                {/* Responsable y Contacto */}
                <div className="mt-4 p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Jefe de Taller</span>
                    <span className="font-bold text-zinc-800">{ws.manager}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Teléfono / PBX</span>
                    <span className="font-mono text-zinc-700 flex items-center gap-1 justify-end">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      {ws.phone}
                    </span>
                  </div>
                </div>

                {/* Métricas operativas del taller */}
                <div className="grid grid-cols-3 gap-2.5 mt-4 text-center">
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                    <span className="text-[10px] uppercase font-bold text-blue-800 block">En Reparación</span>
                    <span className="text-lg font-black text-blue-900">{ws.activeOrders}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Motos Listas</span>
                    <span className="text-lg font-black text-emerald-900">{ws.completedToday}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100">
                    <span className="text-[10px] uppercase font-bold text-purple-800 block">Mecánicos</span>
                    <span className="text-lg font-black text-purple-900">{ws.mechanics}</span>
                  </div>
                </div>
              </div>

              {/* Botón de monitoreo rápido */}
              <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Capacidad de bahías: 85%</span>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-600 hover:text-white transition cursor-pointer"
                >
                  Ver Bahías en Vivo
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
