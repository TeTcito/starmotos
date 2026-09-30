// src/components/desktop/GpsCustomerCard.tsx
import React, { useState } from 'react';
import {
  Radio,
  ShieldCheck,
  Calendar,
  Clock,
  Bike,
  Lock,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  Cpu,
  MapPin,
  Compass,
  ArrowRight,
  Phone,
  Signal,
  KeyRound,
} from 'lucide-react';
import { GpsRecord } from '../../types/customer';
import { WhatsAppIcon } from '../WhatsAppIcon';

interface Props {
  gpsRecord: GpsRecord | null | undefined;
}

export const GpsCustomerCard: React.FC<Props> = ({ gpsRecord }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!gpsRecord) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 shadow-sm max-w-lg mx-auto">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
          <Radio className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-zinc-900">Rastreo Satelital GPS</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
          Aún no tienes un dispositivo GPS vinculado a tu cuenta en StarMotos.
        </p>
      </div>
    );
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const startDateFormatted = gpsRecord.fechaInicio
    ? new Date(gpsRecord.fechaInicio + 'T00:00:00').toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : gpsRecord.fechaSolicitud || 'Reciente';

  const endDateFormatted = gpsRecord.fechaVencimiento
    ? new Date(gpsRecord.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '1 Año posterior a activación';

  const isActive = gpsRecord.estado === 'activa';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 animate-fade-in pb-12 font-sans">
      {/* 1. HERO BANNER GPS SATELITAL */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-900 via-sky-800 to-indigo-900 text-white p-6 sm:p-8 shadow-xl border border-cyan-500/30">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-10 w-40 h-40 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 backdrop-blur-md border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>📡 Sistema de Rastreo Satelital Activo</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
              Monitoreo GPS StarMotos
            </h2>
            <p className="text-xs sm:text-sm text-cyan-100 leading-relaxed font-medium">
              Tu motocicleta cuenta con rastreo satelital 24/7 y telemetría de seguridad. Visualiza el estado de tu equipo, credenciales de la app de rastreo y datos de instalación.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-white/90">
              <span className="font-mono bg-black/30 px-2.5 py-1 rounded-lg border border-white/20">
                Ticket: <strong>{gpsRecord.ticketNumber || 'GPS-OFICIAL'}</strong>
              </span>
              <span className="bg-black/30 px-2.5 py-1 rounded-lg border border-white/20">
                Plataforma: <strong>Servidores StarMotos GPS</strong>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center sm:items-end gap-2 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 min-w-[200px]">
            <span className="text-[11px] font-bold text-cyan-200 uppercase tracking-wider">
              Estado de Señal
            </span>
            <div className="flex items-center gap-2">
              <Signal className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
              <span className="text-xl font-black uppercase tracking-tight">
                {isActive ? 'En Línea' : 'Pendiente'}
              </span>
            </div>
            <span className="text-xs font-semibold text-cyan-100 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
              {isActive ? 'Conexión GPS Estable' : 'En configuración'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. CREDENCIALES DE ACCESO A LA APP DE RASTREO */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
            <KeyRound className="w-4 h-4 text-cyan-600" />
            <span>Credenciales de Acceso para la App de Monitoreo GPS</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium">Uso confidencial</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Usuario */}
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Usuario de Acceso</span>
              <span className="text-sm font-mono font-bold text-zinc-900 mt-0.5 block">
                {gpsRecord.gpsUser || gpsRecord.cedulaRuc || 'Pendiente de asignar'}
              </span>
            </div>
            {gpsRecord.gpsUser && (
              <button
                type="button"
                onClick={() => handleCopy(gpsRecord.gpsUser!, 'user')}
                className="p-2 text-zinc-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition cursor-pointer"
                title="Copiar usuario"
              >
                {copiedKey === 'user' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Contraseña */}
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Contraseña Temporal</span>
              <span className="text-sm font-mono font-bold text-zinc-900 mt-0.5 block">
                {showPassword ? (gpsRecord.gpsPassword || 'StarMotos2026*') : '••••••••••••'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 text-zinc-500 hover:text-zinc-800 rounded-lg transition cursor-pointer"
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {gpsRecord.gpsPassword && (
                <button
                  type="button"
                  onClick={() => handleCopy(gpsRecord.gpsPassword!, 'pwd')}
                  className="p-2 text-zinc-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition cursor-pointer"
                  title="Copiar contraseña"
                >
                  {copiedKey === 'pwd' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. DOS COLUMNAS: HARDWARE GPS Y FUNCIONES ACTIVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Columna Izquierda: Datos del Equipo y Conectividad */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Cpu className="w-4 h-4 text-sky-600" />
            <span>Ficha del Dispositivo y Chip</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Serie GPS (IMEI)</span>
              <span className="text-zinc-900 font-mono font-bold mt-0.5 block truncate" title={gpsRecord.serieGps}>
                {gpsRecord.serieGps || 'Registrado en Matriz'}
              </span>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Serie de Chip SIM</span>
              <span className="text-zinc-900 font-mono font-bold mt-0.5 block truncate" title={gpsRecord.serieChip}>
                {gpsRecord.serieChip || 'Chip M2M Activo'}
              </span>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Fecha Activación</span>
              <span className="text-zinc-900 font-semibold mt-0.5 block">
                {startDateFormatted}
              </span>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Vencimiento Plan Datos</span>
              <span className="text-zinc-900 font-semibold mt-0.5 block">
                {endDateFormatted}
              </span>
            </div>
          </div>

          {/* Vehículo Asociado */}
          <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-100 text-xs space-y-1">
            <div className="flex items-center justify-between text-sky-950 font-bold">
              <span>Motocicleta Vinculada:</span>
              <span>{gpsRecord.modeloMarca} ({gpsRecord.placa || 'S/P'})</span>
            </div>
            <div className="flex items-center justify-between text-sky-800">
              <span>Chasis (VIN):</span>
              <span className="font-mono">{gpsRecord.chasis}</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Funciones de Seguridad Activas */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Funciones y Telemetría Disponibles</span>
          </h3>

          <div className="space-y-2.5 text-xs text-zinc-700">
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-950 font-bold">Rastreo Satelital en Tiempo Real 24/7:</strong>
                <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                  Localización con precisión GPS vía satélite y respaldo celular de cobertura nacional.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-sky-50/60 border border-sky-100">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sky-950 font-bold">Geocercas de Seguridad y Alertas:</strong>
                <p className="text-sky-800 text-[11px] mt-0.5 leading-relaxed">
                  Notificaciones automáticas al teléfono si la moto entra o sale de zonas autorizadas o si detecta vibración.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-950 font-bold">Corte de Corriente Remoto (Emergencias):</strong>
                <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                  Apagado progresivo del motor desde la app o vía SMS en caso de robo o intento de sustracción.
                </p>
              </div>
            </div>
          </div>

          {/* Observaciones técnicas */}
          {gpsRecord.observaciones && (
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Detalles de Instalación
              </span>
              <p className="text-zinc-700 italic leading-relaxed">
                "{gpsRecord.observaciones}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. FOOTER: SOPORTE Y CONTACTO */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            Soporte Central StarMotos GPS
          </span>
          <p className="text-xs text-zinc-600 mt-0.5 font-medium">
            Línea directa para emergencias, reactivación de chips o soporte en app.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/593939316698?text=${encodeURIComponent(`Hola StarMotos Matriz, soy ${gpsRecord.nombres} ${gpsRecord.apellidos}, tengo servicio GPS en mi moto (${gpsRecord.placa || gpsRecord.chasis}). Requiero asistencia técnica de mi rastreador.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
            <span>Soporte WhatsApp Matriz</span>
          </a>
        </div>
      </div>
    </div>
  );
};
