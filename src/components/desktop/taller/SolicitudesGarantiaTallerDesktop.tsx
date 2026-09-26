// src/components/desktop/taller/SolicitudesGarantiaTallerDesktop.tsx
import React, { useState } from 'react';
import {
  ShieldAlert,
  PlusCircle,
  Search,
  Filter,
  Inbox,
} from 'lucide-react';
import { WarrantyRequest, TallerClient, Workshop } from '../../../types/customer';
import {
  WarrantySquareCard,
  WarrantyFormView,
  NewWarrantyFormView,
  getWarrantyStatusInfo,
} from '../../common/WarrantyModule';
import { AutoPendingWarrantiesAlert } from '../../common/PendingWarrantiesAlertModal';

interface Props {
  warranties: WarrantyRequest[];
  newForm?: any;
  setNewForm?: React.Dispatch<React.SetStateAction<any>>;
  onCreateRequest: (directReq?: WarrantyRequest) => boolean;
  clients?: TallerClient[];
  currentWorkshop?: Workshop;
}

export const SolicitudesGarantiaTallerDesktop: React.FC<Props> = ({
  warranties,
  onCreateRequest,
  clients = [],
  currentWorkshop,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'new' | 'detail'>('list');
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_revision' | 'en_proceso' | 'aceptada' | 'denegada'>('all');

  // Filtrado reactivo de reclamos
  const filteredWarranties = warranties.filter((w) => {
    const sInfo = getWarrantyStatusInfo(w.status);
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : sInfo.canonical === statusFilter;

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (w.requestNumber && w.requestNumber.toLowerCase().includes(term)) ||
      (w.clientName && w.clientName.toLowerCase().includes(term)) ||
      (w.clientIdNumber && w.clientIdNumber.includes(term)) ||
      (w.motorcycleBrand && w.motorcycleBrand.toLowerCase().includes(term)) ||
      (w.motorcycleModel && w.motorcycleModel.toLowerCase().includes(term)) ||
      (w.motorcyclePlate && w.motorcyclePlate.toLowerCase().includes(term)) ||
      (w.issueDescription && w.issueDescription.toLowerCase().includes(term));

    return matchesStatus && Boolean(matchesSearch);
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Alerta emergente de garantías pendientes sin aceptar > 2 horas */}
      <AutoPendingWarrantiesAlert
        warranties={warranties}
        onSelectWarranty={(w) => {
          setSelectedWarranty(w);
          setViewMode('detail');
        }}
        role="taller"
      />

      {/* 1. MODO: CREAR NUEVA SOLICITUD EN FORMATO FORMULARIO */}
      {viewMode === 'new' && (
        <NewWarrantyFormView
          onCancel={() => setViewMode('list')}
          onSubmit={(newReq) => {
            onCreateRequest(newReq);
            setViewMode('list');
          }}
          clients={clients}
          defaultTallerOrigin={currentWorkshop?.name || 'StarMotos Taller'}
          defaultTallerOriginId={currentWorkshop?.id || 'taller-principal'}
        />
      )}

      {/* 2. MODO: VER FICHA DETALLADA EN FORMATO FORMULARIO */}
      {viewMode === 'detail' && selectedWarranty && (
        <WarrantyFormView
          warranty={selectedWarranty}
          onBack={() => {
            setSelectedWarranty(null);
            setViewMode('list');
          }}
          viewerRole="taller"
          onCreateNewRequest={() => {
            setSelectedWarranty(null);
            setViewMode('new');
          }}
        />
      )}

      {/* 3. MODO: LISTADO EN TARJETAS CUADRADAS */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Header Superior */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight leading-tight">
                    Solicitudes de Garantía del Taller
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Emita reportes técnicos de garantía de fábrica hacia Matriz Central y audite sus dictámenes.
                  </p>
                </div>
              </div>

              {/* Botón "+ Nueva Solicitud" */}
              <button
                type="button"
                onClick={() => setViewMode('new')}
                className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Nueva Solicitud de Garantía (Formulario)</span>
              </button>
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
                  placeholder="Buscar por N° Solicitud, Cédula, Cliente, Placa o Modelo..."
                  className="w-full bg-transparent text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-zinc-400 hover:text-zinc-600 text-xs font-bold px-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filtros de Pestaña */}
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
                    {
                      warranties.filter((w) => getWarrantyStatusInfo(w.status).canonical === 'en_revision')
                        .length
                    }
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
                    {
                      warranties.filter((w) => getWarrantyStatusInfo(w.status).canonical === 'en_proceso')
                        .length
                    }
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
                    {
                      warranties.filter((w) => getWarrantyStatusInfo(w.status).canonical === 'aceptada')
                        .length
                    }
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
                    {
                      warranties.filter((w) => getWarrantyStatusInfo(w.status).canonical === 'denegada')
                        .length
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* GRID DE TARJETAS CUADRADAS */}
          {filteredWarranties.length === 0 ? (
            <div className="text-center py-14 bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl">
              <Inbox className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-zinc-700">No hay solicitudes de garantía en esta vista</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Utilice el botón superior para emitir una nueva solicitud con formulario completo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWarranties.map((w) => (
                <WarrantySquareCard
                  key={w.id}
                  warranty={w}
                  onClick={() => {
                    setSelectedWarranty(w);
                    setViewMode('detail');
                  }}
                  viewerRole="taller"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
