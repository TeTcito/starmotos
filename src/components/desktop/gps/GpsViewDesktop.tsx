// src/components/desktop/gps/GpsViewDesktop.tsx
import React, { useState, useMemo } from 'react';
import {
  Radio,
  Search,
  KeyRound,
  CheckCircle2,
  Clock,
  LogOut,
  UserCheck,
  Bike,
  Smartphone,
  Phone,
  Calendar,
  Filter,
  Copy,
  Check,
  ShieldCheck,
  Cpu,
  Mail,
  MapPin,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { GpsRecord, GpsProfile } from '../../../types/customer';
import { GpsCredentialModal } from '../../common/GpsCredentialModal';

interface Props {
  records: GpsRecord[];
  profile: GpsProfile;
  onLogout: () => void;
  onAssignCredentials: (recordId: string, user: string, pass: string) => void;
  showToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const GpsViewDesktop: React.FC<Props> = ({
  records,
  profile,
  onLogout,
  onAssignCredentials,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'pendientes' | 'activas' | 'todas'>('pendientes');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecordForAssign, setSelectedRecordForAssign] = useState<GpsRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pendingRequests = useMemo(() => records.filter((r) => r.estado === 'pendiente'), [records]);
  const activeRequests = useMemo(() => records.filter((r) => r.estado === 'activa'), [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (activeTab === 'pendientes' && r.estado !== 'pendiente') return false;
      if (activeTab === 'activas' && r.estado !== 'activa') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const clientFull = `${r.nombres} ${r.apellidos}`.toLowerCase();
        const phones = `${r.celular1} ${r.celular2 || ''} ${r.celular3 || ''}`.toLowerCase();
        return (
          clientFull.includes(q) ||
          r.cedulaRuc.toLowerCase().includes(q) ||
          r.placa.toLowerCase().includes(q) ||
          r.modeloMarca.toLowerCase().includes(q) ||
          r.ticketNumber.toLowerCase().includes(q) ||
          r.serieGps.toLowerCase().includes(q) ||
          r.serieChip.toLowerCase().includes(q) ||
          phones.includes(q)
        );
      }
      return true;
    });
  }, [records, activeTab, searchTerm]);

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans antialiased text-zinc-900 selection:bg-cyan-600 selection:text-white">
      {/* 1. HEADER SUPERIOR DEL PERFIL GPS SERVICIOS */}
      <header className="h-16 shrink-0 w-full bg-gradient-to-r from-zinc-900 via-zinc-900 to-cyan-950 text-white shadow-md flex items-center justify-between px-6 z-30 select-none border-b border-cyan-900/40">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 shadow-sm">
            <img
              src="/starmotos-logo.jpg"
              alt="StarMotos Logo"
              className="w-8 h-8 rounded-full object-cover bg-white"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-wider uppercase text-white">
                STAR<span className="text-cyan-400">MOTOS</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                GPS Servicios
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Panel Operativo Central de Monitoreo & Asignación de Accesos
            </p>
          </div>
        </div>

        {/* Info del operador y Botón Salir */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
              {profile.fullName.charAt(0) || 'G'}
            </div>
            <div className="text-left text-xs">
              <span className="font-bold text-zinc-200 block truncate max-w-[150px]">
                {profile.fullName || 'Operador GPS'}
              </span>
              <span className="text-[10px] text-cyan-300 block">{profile.roleTitle || 'Soporte GPS'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-zinc-300 text-xs font-bold transition cursor-pointer border border-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* 2. BARRA DE HERRAMIENTAS Y MÉTRICAS */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* Banner de Aviso de Seguridad Contable */}
        <div className="bg-gradient-to-r from-cyan-900/90 to-blue-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-cyan-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-300" />
              <h2 className="text-base font-black tracking-tight text-white">
                Recepción Técnica de Compras GPS
              </h2>
            </div>
            <p className="text-xs text-cyan-100 max-w-2xl leading-relaxed">
              Las solicitudes enviadas por Matriz se listan a continuación para auditoría del hardware y asignación del usuario/contraseña que usará el cliente en la plataforma satelital.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-xs font-bold flex items-center gap-1.5">
              <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
              <span>Pendientes: {pendingRequests.length}</span>
            </span>
          </div>
        </div>

        {/* Tabs de Filtro & Búsqueda */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('pendientes')}
              className={`py-2 px-4 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'pendientes'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendientes ({pendingRequests.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('activas')}
              className={`py-2 px-4 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'activas'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Activas / Asignadas ({activeRequests.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('todas')}
              className={`py-2 px-4 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'todas'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Todas ({records.length})</span>
            </button>
          </div>

          {/* Búsqueda */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, placa, serie GPS/Chip..."
              className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-cyan-600 outline-none transition"
            />
          </div>
        </div>

        {/* 3. LISTADO DE SOLICITUDES GPS (EXCLUYENDO PRECIOS) */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center text-zinc-400 shadow-xs">
            <Radio className="w-10 h-10 mx-auto mb-3 text-cyan-600/40 animate-pulse" />
            <h3 className="text-base font-bold text-zinc-700">No hay solicitudes en este filtro</h3>
            <p className="text-xs text-zinc-500 mt-1">
              {records.length === 0
                ? 'Las solicitudes registradas por Matriz aparecerán automáticamente aquí.'
                : 'Intenta con otro término de búsqueda o selecciona otra pestaña.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecords.map((r) => {
              const isPending = r.estado === 'pendiente';
              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-3xl border transition-all shadow-xs overflow-hidden flex flex-col justify-between ${
                    isPending
                      ? 'border-amber-300/80 shadow-amber-500/5 hover:border-amber-400'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  {/* Header de la tarjeta */}
                  <div
                    className={`p-4 border-b flex items-center justify-between ${
                      isPending ? 'bg-amber-50/50 border-amber-200/60' : 'bg-zinc-50 border-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-cyan-800 bg-cyan-100/70 px-2.5 py-0.5 rounded-lg border border-cyan-200">
                        {r.ticketNumber}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-medium">
                        Fecha: {r.fechaSolicitud} {r.horaSolicitud ? `• ${r.horaSolicitud}` : ''}
                      </span>
                    </div>

                    {isPending ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-700 animate-spin" />
                        <span>Pendiente Aprobación</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>GPS Activo</span>
                      </span>
                    )}
                  </div>

                  {/* Cuerpo de la tarjeta: Datos técnicos y de cliente (SIN PRECIOS) */}
                  <div className="p-4 space-y-4 flex-1">
                    {/* Fila 1: Cliente & 3 Celulares */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Propietario</span>
                          <h4 className="text-sm font-black text-zinc-900">
                            {r.nombres} {r.apellidos}
                          </h4>
                          <span className="text-xs font-mono text-zinc-500">C.I. {r.cedulaRuc}</span>
                        </div>
                        {r.direccion && (
                          <div className="text-right max-w-[200px]">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Dirección</span>
                            <span className="text-[11px] text-zinc-600 truncate block">{r.direccion}</span>
                          </div>
                        )}
                      </div>

                      {/* 3 Celulares con Enlace rápido */}
                      <div className="bg-zinc-50 rounded-2xl p-2.5 border border-zinc-200 flex flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-blue-200">
                          <span className="text-[10px] font-bold uppercase text-blue-700">Cel 1:</span>
                          <a
                            href={`tel:${r.celular1}`}
                            className="font-mono font-bold text-blue-900 hover:underline"
                          >
                            {r.celular1}
                          </a>
                        </div>
                        {r.celular2 && (
                          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-zinc-200">
                            <span className="text-[10px] font-bold uppercase text-zinc-500">Cel 2:</span>
                            <a
                              href={`tel:${r.celular2}`}
                              className="font-mono text-zinc-700 hover:underline"
                            >
                              {r.celular2}
                            </a>
                          </div>
                        )}
                        {r.celular3 && (
                          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-zinc-200">
                            <span className="text-[10px] font-bold uppercase text-zinc-500">Cel 3:</span>
                            <a
                              href={`tel:${r.celular3}`}
                              className="font-mono text-zinc-700 hover:underline"
                            >
                              {r.celular3}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fila 2: Motocicleta */}
                    <div className="bg-sky-50/40 rounded-2xl p-3 border border-sky-200/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900">{r.modeloMarca}</span>
                        <span className="font-mono font-black text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-300">
                          {r.placa || 'EN TRÁMITE'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-600">
                        <div>
                          <span>Chasis (VIN): </span>
                          <strong className="font-mono text-zinc-900">{r.chasis}</strong>
                        </div>
                        {r.numeroMotor && (
                          <div>
                            <span>Motor: </span>
                            <strong className="font-mono text-zinc-900">{r.numeroMotor}</strong>
                          </div>
                        )}
                        {r.color && (
                          <div>
                            <span>Color: </span>
                            <strong className="text-zinc-800">{r.color}</strong>
                          </div>
                        )}
                        <div>
                          <span>Año: </span>
                          <strong className="text-zinc-800">{r.year}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Fila 3: Hardware GPS & SIM */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-zinc-50 p-2.5 rounded-2xl border border-zinc-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-zinc-400">Serie GPS (IMEI)</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(r.serieGps, `${r.id}-gps`)}
                            className="text-zinc-400 hover:text-zinc-800 cursor-pointer"
                            title="Copiar serie"
                          >
                            {copiedId === `${r.id}-gps` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="font-mono font-bold text-zinc-900 text-[11px] select-all truncate block">
                          {r.serieGps}
                        </span>
                      </div>

                      <div className="bg-zinc-50 p-2.5 rounded-2xl border border-zinc-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-zinc-400">Serie Chip (SIM)</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(r.serieChip, `${r.id}-chip`)}
                            className="text-zinc-400 hover:text-zinc-800 cursor-pointer"
                            title="Copiar serie"
                          >
                            {copiedId === `${r.id}-chip` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="font-mono font-bold text-zinc-900 text-[11px] select-all truncate block">
                          {r.serieChip}
                        </span>
                      </div>
                    </div>

                    {/* Vigencia */}
                    <div className="flex items-center justify-between text-xs px-1 text-zinc-600">
                      <span>Inicio: <strong>{r.fechaInicio}</strong></span>
                      <span>Vencimiento: <strong className="text-amber-700">{r.fechaVencimiento}</strong></span>
                    </div>

                    {/* Si ya tiene credenciales asignadas, mostrarlas */}
                    {!isPending && r.gpsUser && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Usuario Asignado</span>
                          <span className="font-mono font-bold text-emerald-950 text-sm">{r.gpsUser}</span>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-medium">
                          Aprobado por: {r.aprobadoPor || 'Operador GPS'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer de Acciones */}
                  <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-3">
                    {isPending ? (
                      <button
                        type="button"
                        onClick={() => setSelectedRecordForAssign(r)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
                      >
                        <KeyRound className="w-4 h-4 text-amber-100" />
                        <span>Aceptar y Asignar Credenciales</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedRecordForAssign(r)}
                        className="w-full py-2 px-3 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Editar Credenciales Asignadas</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Asignar Credenciales */}
      <GpsCredentialModal
        isOpen={Boolean(selectedRecordForAssign)}
        onClose={() => setSelectedRecordForAssign(null)}
        record={selectedRecordForAssign}
        onAssign={(recordId, user, pass) => {
          onAssignCredentials(recordId, user, pass);
          setSelectedRecordForAssign(null);
        }}
      />
    </div>
  );
};
