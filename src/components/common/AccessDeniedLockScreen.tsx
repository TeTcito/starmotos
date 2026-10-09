// src/components/common/AccessDeniedLockScreen.tsx
import React, { useState } from 'react';
import { Workshop } from '../../types/customer';
import { Phone, LogOut, AlertTriangle, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cloudSaveAlert } from '../../services/supabaseService';

interface Props {
  workshop: Workshop;
  onLogout: () => void;
}

export const AccessDeniedLockScreen: React.FC<Props> = ({ workshop, onLogout }) => {
  const [requested, setRequested] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);

  const handleRequestAuthorization = async () => {
    setSendingAlert(true);

    const messageText = `Hola Administración Matriz StarMotos, me comunico de la sede *${workshop.name}* (Código: *${workshop.code}*). Solicitamos cordialmente la revisión de nuestro estado de suspensión y la respectiva autorización para rehabilitar las operaciones y acceso al sistema en nuestro taller. Quedamos a la espera de sus disposiciones.`;

    try {
      // Registrar alerta de alta prioridad en la nube para el Administrador
      await cloudSaveAlert({
        id: `alert-req-auth-${workshop.id}-${Date.now()}`,
        targetRole: 'admin',
        title: `🚨 Solicitud de Rehabilitación: ${workshop.name}`,
        message: `El Jefe de Taller de ${workshop.name} (${workshop.code}) ha solicitado formalmente la reactivación y autorización de operatividad.`,
        type: 'estado_cambiado',
        read: false,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Error enviando alerta a matriz:', e);
    } finally {
      setSendingAlert(false);
      setRequested(true);
    }

    // Abrir canal directo de WhatsApp a Matriz
    const whatsappUrl = `https://wa.me/593939316698?text=${encodeURIComponent(messageText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-zinc-950 text-white flex flex-col items-center justify-center p-4 selection:bg-rose-600 selection:text-white overflow-y-auto select-none">
      {/* Luces ambientales tenues */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-red-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Contenedor compacto ("pantalla no grande") */}
      <div className="max-w-md w-full bg-zinc-900/95 backdrop-blur-xl border border-rose-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(220,38,38,0.25)] relative z-10 flex flex-col items-center text-center my-auto animate-fade-in">
        {/* Header con Logo StarMotos */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-0.5 rounded-full bg-gradient-to-tr from-blue-600 via-white to-red-600 shadow">
            <img
              src="/starmotos-logo.jpg"
              alt="StarMotos"
              className="w-5 h-5 rounded-full object-cover bg-white"
            />
          </div>
          <span className="text-xs font-black tracking-widest uppercase">
            <span className="text-blue-500">STAR</span>
            <span className="text-red-500">MOTOS</span>
          </span>
        </div>

        {/* Imagen Oficial de Acceso Denegado */}
        <div className="relative mb-3 flex items-center justify-center">
          <img
            src="/access-denied.svg"
            alt="Acceso Denegado"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-2xl animate-pulse"
          />
        </div>

        {/* Badge de Sede Inoperativa */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-rose-950/80 border border-rose-700/60 text-rose-300 mb-2 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>Sede Inoperativa • Acceso Restringido</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
          A usted se le ha suspendido sus actividades
        </h1>

        {/* Nombre de la Sede y Código */}
        <div className="mt-1">
          <p className="text-xs sm:text-sm font-bold text-zinc-200">
            {workshop.name}
          </p>
          <p className="text-[11px] font-mono text-zinc-400">
            Código: <span className="text-zinc-300 font-semibold">{workshop.code}</span>
            {workshop.city && ` • ${workshop.city}`}
          </p>
        </div>

        {/* Tarjeta con Disposición de Matriz */}
        <div className="w-full mt-4 p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-left">
          <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>Disposición de Matriz Central:</span>
          </div>
          <p className="text-xs text-zinc-200 leading-relaxed font-medium italic">
            "{workshop.inoperativoMotivo || 'A usted se le ha suspendido sus actividades, para más información acérquese o contáctese a la matriz.'}"
          </p>
          {workshop.inoperativoFecha && (
            <p className="text-[10px] text-zinc-500 mt-2 font-mono">
              Registrado el: {new Date(workshop.inoperativoFecha).toLocaleString()}
            </p>
          )}
        </div>

        {/* Nota informativa */}
        <p className="text-[11px] text-zinc-400 leading-relaxed mt-3 px-2">
          El acceso a órdenes, alistamiento, comisiones, inventario y clientes está inhabilitado. Únicamente la Matriz Central puede reactivar las funciones de esta sede.
        </p>

        {/* Estado de solicitud enviada si ya se pulsó */}
        {requested && (
          <div className="w-full mt-3 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-[11px] flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Solicitud de habilitación enviada a Matriz.</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-2 w-full mt-5">
          {/* 1. Solicitar Autorización a Matriz */}
          <button
            type="button"
            onClick={handleRequestAuthorization}
            disabled={sendingAlert}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/30 cursor-pointer disabled:opacity-50"
          >
            {sendingAlert ? (
              <span>Notificando...</span>
            ) : requested ? (
              <>
                <Phone className="w-3.5 h-3.5" />
                <span>Reenviar a Matriz</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Pedir Autorización a Matriz</span>
              </>
            )}
          </button>

          {/* 2. Cerrar Sesión */}
          <button
            type="button"
            onClick={onLogout}
            className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer border border-zinc-700/80"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
