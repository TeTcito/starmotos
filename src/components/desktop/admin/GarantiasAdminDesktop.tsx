// src/components/desktop/admin/GarantiasAdminDesktop.tsx
import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  Sparkles,
  Navigation,
  Plus,
  X,
  Send,
  Trash2,
  FileCheck2,
} from 'lucide-react';
import { WarrantyRequest, WarrantyRequestStatus, TallerClient } from '../../../types/customer';
import {
  WarrantySquareCard,
  WarrantyFormView,
  NewWarrantyFormView,
  getWarrantyStatusInfo,
} from '../../common/WarrantyModule';

interface Props {
  warranties: WarrantyRequest[];
  clients?: TallerClient[];
  onValidateWarranty: (id: string, notes: string) => void;
  onRejectWarranty?: (id: string, reason: string) => void;
  onSendToGarante?: (id: string, notes?: string) => void;
  onCompleteRepair?: (id: string, invoiceNumber?: string) => void;
  onCreateWarranty?: (newReq: WarrantyRequest) => void;
  onUpdateWarranty?: (updated: WarrantyRequest) => void;
  onDeleteWarranty?: (id: string) => void;
  onQuickUpdateStatus?: (id: string, status: WarrantyRequestStatus, notes?: string) => void;
}

export const GarantiasAdminDesktop: React.FC<Props> = ({
  warranties,
  clients = [],
  onValidateWarranty,
  onRejectWarranty,
  onSendToGarante,
  onCompleteRepair,
  onCreateWarranty,
  onUpdateWarranty,
  onDeleteWarranty,
  onQuickUpdateStatus,
}) => {
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_revision' | 'en_proceso' | 'aceptada' | 'denegada'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'marca' | 'plus_taller' | 'gps'>('all');

  // Estado para emisión de garantías desde Matriz
  const [isEmittingWarranty, setIsEmittingWarranty] = useState(false);

  // Estado para modal emergente de gestión rápida de estado
  const [quickModalWarranty, setQuickModalWarranty] = useState<WarrantyRequest | null>(null);
  const [quickTargetStatus, setQuickTargetStatus] = useState<WarrantyRequestStatus>('en_proceso');
  const [quickAdminNotes, setQuickAdminNotes] = useState('');

  // Si está en modo emisión de nueva garantía
  if (isEmittingWarranty) {
    return (
      <NewWarrantyFormView
        onCancel={() => setIsEmittingWarranty(false)}
        onSubmit={(newReq) => {
          if (onCreateWarranty) onCreateWarranty(newReq);
          setIsEmittingWarranty(false);
        }}
        clients={clients}
        defaultTallerOrigin="StarMotos Sede Matriz"
        defaultTallerOriginId="sede-matriz"
      />
    );
  }

  // Filtrado reactivo de solicitudes
  const filteredWarranties = warranties.filter((w) => {
    const sInfo = getWarrantyStatusInfo(w.status);
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : sInfo.canonical === statusFilter;

    const matchesType = typeFilter === 'all' ? true : w.warrantyType === typeFilter;

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      w.requestNumber.toLowerCase().includes(term) ||
      w.clientName.toLowerCase().includes(term) ||
      w.clientIdNumber.includes(term) ||
      w.motorcycleBrand.toLowerCase().includes(term) ||
      w.motorcycleModel.toLowerCase().includes(term) ||
      w.motorcyclePlate.toLowerCase().includes(term) ||
      w.tallerOrigin.toLowerCase().includes(term) ||
      w.issueDescription.toLowerCase().includes(term);

    return matchesStatus && matchesType && matchesSearch;
  });

  // Métricas para cabecera
  const countRevision = warranties.filter(
    (w) => getWarrantyStatusInfo(w.status).canonical === 'en_revision'
  ).length;
  const countProceso = warranties.filter(
    (w) => getWarrantyStatusInfo(w.status).canonical === 'en_proceso'
  ).length;
  const countAceptadas = warranties.filter(
    (w) => getWarrantyStatusInfo(w.status).canonical === 'aceptada'
  ).length;
  const countDenegadas = warranties.filter(
    (w) => getWarrantyStatusInfo(w.status).canonical === 'denegada'
  ).length;

  return (
    <div className="space-y-5 animate-fade-in relative">
      {/* 1. VISTA DE DETALLE: FICHA EN FORMATO FORMULARIO */}
      {selectedWarranty ? (
        <WarrantyFormView
          warranty={selectedWarranty}
          onBack={() => setSelectedWarranty(null)}
          viewerRole="admin"
          onValidateByMatriz={(id, notes) => {
            onValidateWarranty(id, notes);
            setSelectedWarranty(null);
          }}
          onRejectByMatriz={(id, reason) => {
            if (onRejectWarranty) onRejectWarranty(id, reason);
            setSelectedWarranty(null);
          }}
          onDelete={(id) => {
            if (onDeleteWarranty) onDeleteWarranty(id);
            setSelectedWarranty(null);
          }}
          onUpdateWarranty={(updated) => {
            setSelectedWarranty(updated);
            if (onUpdateWarranty) onUpdateWarranty(updated);
          }}
        />
      ) : (
        /* 2. VISTA DE LISTADO: TARJETAS CUADRADAS */
        <div className="space-y-4">
          {/* Cabecera Superior con Métricas */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight leading-tight">
                    Gestión Centralizada de Garantías (Matriz Central)
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Flujo de Control: Taller emite $\rightarrow$ Matriz revisa y pone En Proceso $\rightarrow$ Garante de Marca dictamina Aceptación o Denegación.
                  </p>
                </div>
              </div>

              {/* Acciones y Métricas */}
              <div className="flex items-center gap-2 flex-wrap">
                {onCreateWarranty && (
                  <button
                    type="button"
                    onClick={() => setIsEmittingWarranty(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Emitir Solicitud</span>
                  </button>
                )}

                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{countRevision} En Revisión</span>
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{countProceso} En Proceso</span>
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{countAceptadas} Aceptadas</span>
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-red-50 text-red-800 border border-red-200 shadow-2xs flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>{countDenegadas} Denegadas</span>
                </span>
              </div>
            </div>

            {/* Barra de Búsqueda y Filtros de Estado */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100">
              {/* Buscador */}
              <div className="relative flex-1 flex items-center bg-zinc-50 hover:bg-white focus-within:bg-white border border-zinc-300 focus-within:border-blue-600 rounded-xl px-3.5 py-2 transition-all">
                <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por N° Solicitud, Cédula, Cliente, Placa, Taller o Falla..."
                  className="w-full bg-transparent text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-zinc-400 hover:text-zinc-600 text-xs font-bold px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filtros de Pestaña de Estado */}
              <div className="flex items-center gap-1 overflow-x-auto bg-zinc-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-zinc-900 shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Todas ({warranties.length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('en_revision')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'en_revision'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-amber-800 hover:bg-amber-100/50'
                  }`}
                >
                  <span>En Revisión</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900">
                    {countRevision}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('en_proceso')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'en_proceso'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-blue-800 hover:bg-blue-100/50'
                  }`}
                >
                  <span>En Proceso</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-200 text-blue-900">
                    {countProceso}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('aceptada')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'aceptada'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-emerald-800 hover:bg-emerald-100/50'
                  }`}
                >
                  <span>Aceptadas</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900">
                    {countAceptadas}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('denegada')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'denegada'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'text-red-800 hover:bg-red-100/50'
                  }`}
                >
                  <span>Denegadas</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-200 text-red-900">
                    {countDenegadas}
                  </span>
                </button>
              </div>
            </div>

            {/* Sub-filtro por Tipo de Póliza */}
            <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 text-xs">
              <span className="font-bold text-zinc-500 uppercase text-[10px]">Tipo de Garantía:</span>
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  typeFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                Todos los tipos
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('marca')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  typeFilter === 'marca' ? 'bg-blue-600 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                Oficial Marca
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('plus_taller')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  typeFilter === 'plus_taller' ? 'bg-blue-600 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                Plus Taller
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('gps')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  typeFilter === 'gps' ? 'bg-blue-600 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                GPS
              </button>
            </div>
          </div>

          {/* GRID DE TARJETAS CUADRADAS */}
          {filteredWarranties.length === 0 ? (
            <div className="text-center py-14 bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl">
              <Inbox className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-zinc-700">No hay solicitudes con los filtros seleccionados</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Ajuste los términos de búsqueda o cambie el estado seleccionado arriba.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWarranties.map((w) => (
                <WarrantySquareCard
                  key={w.id}
                  warranty={w}
                  onClick={() => setSelectedWarranty(w)}
                  viewerRole="admin"
                  onDelete={onDeleteWarranty}
                  onQuickStatusChange={(item) => {
                    setQuickModalWarranty(item);
                    setQuickTargetStatus(item.status === 'enviada_matriz' ? 'en_proceso' : 'validada_matriz');
                    setQuickAdminNotes(item.matrizNotes || 'Revisado y aprobado técnicamente en Sede Matriz.');
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Emergente de Gestión Rápida de Estado */}
      {quickModalWarranty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-4 bg-zinc-900 text-white">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-black">
                    Gestión Rápida de Garantía
                  </h3>
                  <span className="font-mono text-[11px] text-zinc-300">
                    N° {quickModalWarranty.requestNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickModalWarranty(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                <p className="font-bold text-zinc-900">
                  {quickModalWarranty.clientName} ({quickModalWarranty.motorcycleBrand} {quickModalWarranty.motorcycleModel})
                </p>
                <p className="text-zinc-500 text-[11px]">
                  <strong>Taller:</strong> {quickModalWarranty.tallerOrigin} • <strong>Placa:</strong> {quickModalWarranty.motorcyclePlate || 'S/P'}
                </p>
                <p className="text-zinc-600 text-[11px] line-clamp-2">
                  <strong>Falla reportada:</strong> {quickModalWarranty.issueDescription}
                </p>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1.5 uppercase text-[10px]">
                  Cambiar Estado a:
                </label>
                <select
                  value={quickTargetStatus}
                  onChange={(e) => setQuickTargetStatus(e.target.value as WarrantyRequestStatus)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-800 outline-none focus:border-blue-600"
                >
                  <option value="en_proceso">⏳ En Proceso (Enviar a Garante de Marca)</option>
                  <option value="validada_matriz">✓ Validada por Matriz</option>
                  <option value="rechazada_matriz">✕ Rechazada por Matriz</option>
                  <option value="reparacion_completada">🛠 Reparación Completada</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1.5 uppercase text-[10px]">
                  Observaciones de Matriz (para Garante o Taller):
                </label>
                <textarea
                  rows={3}
                  value={quickAdminNotes}
                  onChange={(e) => setQuickAdminNotes(e.target.value)}
                  placeholder="Ingrese justificación técnica o instrucciones..."
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-800 outline-none focus:border-blue-600 resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setQuickModalWarranty(null)}
                  className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onQuickUpdateStatus) {
                      onQuickUpdateStatus(quickModalWarranty.id, quickTargetStatus, quickAdminNotes);
                    } else if (quickTargetStatus === 'en_proceso' || quickTargetStatus === 'validada_matriz') {
                      onValidateWarranty(quickModalWarranty.id, quickAdminNotes);
                    }
                    setQuickModalWarranty(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirmar y Enviar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
