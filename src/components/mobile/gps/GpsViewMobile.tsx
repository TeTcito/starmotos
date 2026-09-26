// src/components/mobile/gps/GpsViewMobile.tsx
import React, { useState, useMemo } from 'react';
import {
  Radio,
  Search,
  KeyRound,
  CheckCircle2,
  Clock,
  LogOut,
  Smartphone,
  Phone,
  Calendar,
  Filter,
  Copy,
  Check,
  ShieldCheck,
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

export const GpsViewMobile: React.FC<Props> = ({
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
        return (
          clientFull.includes(q) ||
          r.cedulaRuc.toLowerCase().includes(q) ||
          r.placa.toLowerCase().includes(q) ||
          r.ticketNumber.toLowerCase().includes(q) ||
          r.serieGps.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, activeTab, searchTerm]);

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans antialiased text-zinc-900 pb-16">
      {/* Header móvil */}
      <header className="bg-zinc-900 text-white p-4 shadow-md flex items-center justify-between border-b border-cyan-900/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase text-white">
              GPS <span className="text-cyan-400">Servicios</span>
            </h1>
            <p className="text-[10px] text-zinc-400 truncate max-w-[160px]">
              {profile.fullName || 'Operador GPS'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="p-1.5 rounded-lg bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Contenido móvil */}
      <div className="p-4 space-y-3 flex-1">
        {/* Banner de resumen */}
        <div className="bg-gradient-to-r from-cyan-950 to-blue-950 text-white p-3.5 rounded-2xl border border-cyan-800/40 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-200">Recepción Técnica de GPS</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              {pendingRequests.length} Pendientes
            </span>
          </div>
          <p className="text-[11px] text-zinc-300 leading-tight">
            Valida los identificadores IMEI/SIM y asigna las credenciales del cliente.
          </p>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, placa, serie..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-zinc-300 rounded-xl"
          />
        </div>

        {/* Tabs de Filtro */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('pendientes')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold shrink-0 transition ${
              activeTab === 'pendientes'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200'
            }`}
          >
            Pendientes ({pendingRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activas')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold shrink-0 transition ${
              activeTab === 'activas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200'
            }`}
          >
            Activas ({activeRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('todas')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold shrink-0 transition ${
              activeTab === 'todas'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200'
            }`}
          >
            Todas ({records.length})
          </button>
        </div>

        {/* Tarjetas de Solicitudes */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 text-center text-zinc-400">
            <Radio className="w-6 h-6 mx-auto mb-2 text-zinc-300 animate-pulse" />
            <p className="font-bold text-xs">No hay solicitudes en este filtro</p>
          </div>
        ) : (
          filteredRecords.map((r) => {
            const isPending = r.estado === 'pendiente';
            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 ${
                  isPending ? 'border-amber-300' : 'border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                    {r.ticketNumber}
                  </span>
                  {isPending ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Pendiente
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Activo
                    </span>
                  )}
                </div>

                {/* Cliente */}
                <div>
                  <h4 className="text-sm font-black text-zinc-900">{r.nombres} {r.apellidos}</h4>
                  <p className="text-[11px] font-mono text-zinc-500">Cédula: {r.cedulaRuc}</p>
                  <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                    <a href={`tel:${r.celular1}`} className="bg-blue-50 text-blue-800 font-bold px-1.5 py-0.5 rounded font-mono">
                      📱 {r.celular1}
                    </a>
                    {r.celular2 && (
                      <a href={`tel:${r.celular2}`} className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded font-mono">
                        📞 {r.celular2}
                      </a>
                    )}
                  </div>
                </div>

                {/* Vehículo */}
                <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-zinc-900">
                    <span>{r.modeloMarca}</span>
                    <span className="font-mono text-blue-700">{r.placa || 'EN TRÁMITE'}</span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    VIN: {r.chasis}
                  </div>
                </div>

                {/* Hardware */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-cyan-50/50 p-2 rounded-xl border border-cyan-200">
                    <span className="text-[9px] font-bold uppercase text-cyan-800 block">Serie GPS (IMEI)</span>
                    <span className="font-mono font-bold text-zinc-900 text-[11px] truncate block select-all">
                      {r.serieGps}
                    </span>
                  </div>
                  <div className="bg-cyan-50/50 p-2 rounded-xl border border-cyan-200">
                    <span className="text-[9px] font-bold uppercase text-cyan-800 block">Serie Chip (SIM)</span>
                    <span className="font-mono font-bold text-zinc-900 text-[11px] truncate block select-all">
                      {r.serieChip}
                    </span>
                  </div>
                </div>

                {/* Vigencia */}
                <div className="flex justify-between text-[11px] text-zinc-600 px-1">
                  <span>Inicio: {r.fechaInicio}</span>
                  <span className="font-bold text-emerald-700">Vence: {r.fechaVencimiento}</span>
                </div>

                {/* Si ya tiene usuario */}
                {!isPending && r.gpsUser && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex justify-between items-center">
                    <span className="font-bold text-emerald-900 font-mono">Usuario: {r.gpsUser}</span>
                    <span className="text-[10px] text-emerald-700">Listo</span>
                  </div>
                )}

                {/* Botón Acción */}
                {isPending ? (
                  <button
                    type="button"
                    onClick={() => setSelectedRecordForAssign(r)}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <KeyRound className="w-4 h-4 text-amber-100" />
                    <span>Aceptar y Asignar Credenciales</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedRecordForAssign(r)}
                    className="w-full py-2 bg-zinc-100 text-zinc-700 font-bold text-xs rounded-xl border border-zinc-200"
                  >
                    Editar Credenciales
                  </button>
                )}
              </div>
            );
          })
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
