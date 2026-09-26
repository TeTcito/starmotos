// src/components/mobile/taller/SolicitudesGarantiaTallerMobile.tsx
import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Search,
  Bike,
  Building2,
  Filter,
  Plus,
  ArrowLeft,
  Printer,
  Save,
  X,
  CheckCircle2,
  UserCheck,
  Wrench,
  DollarSign,
  MessageCircle,
  FileCheck2,
  Camera,
  ShieldAlert,
} from 'lucide-react';
import {
  WarrantyRequest,
  WarrantyRequestStatus,
  TallerClient,
  SystemAlert,
} from '../../../types/customer';
import {
  saveStoredWarranties,
  getStoredWarranties,
  saveStoredAlerts,
  getStoredAlerts,
} from '../../../data/mockMultiRoleData';
import { WarrantyDetailViewMobile } from '../common/WarrantyDetailViewMobile';
import { NewWarrantyFormMobile } from '../common/NewWarrantyFormMobile';
import { AutoPendingWarrantiesAlert } from '../../common/PendingWarrantiesAlertModal';

interface Props {
  warranties: WarrantyRequest[];
  clients?: TallerClient[];
  currentWorkshopName?: string;
  currentWorkshopId?: string;
  newForm?: any;
  setNewForm?: React.Dispatch<React.SetStateAction<any>>;
  onCreateRequest?: (directReq?: WarrantyRequest) => boolean | void;
}

export const SolicitudesGarantiaTallerMobile: React.FC<Props> = ({
  warranties: initialWarranties,
  clients = [],
  currentWorkshopName = 'StarMotos Taller',
  currentWorkshopId,
  onCreateRequest,
}) => {
  // Lista local reactiva
  const [localWarranties, setLocalWarranties] = useState<WarrantyRequest[]>(initialWarranties);

  // Sincronizar si cambian los props
  React.useEffect(() => {
    setLocalWarranties(initialWarranties);
  }, [initialWarranties]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'marca' | 'plus_taller' | 'gps'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Modal para nueva solicitud
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequestData, setNewRequestData] = useState({
    clientName: '',
    clientIdNumber: '',
    clientPhone: '',
    motorcycleBrand: 'Benelli',
    motorcycleModel: 'TRK 502X ABS',
    motorcyclePlate: '',
    motorcycleVin: '',
    warrantyType: 'marca' as 'marca' | 'plus_taller' | 'gps',
    issueDescription: '',
    mechanicDiagnosis: '',
    estimatedCost: 80,
  });

  // Ficha de detalle de garantía seleccionada
  const [selectedWarrantyForDetail, setSelectedWarrantyForDetail] = useState<WarrantyRequest | null>(null);

  const getCleanWhatsappUrl = (phoneStr: string, clientName: string) => {
    const cleanDigits = phoneStr.replace(/\D/g, '');
    let fullNumber = cleanDigits;
    if (fullNumber.startsWith('0')) {
      fullNumber = `593${fullNumber.substring(1)}`;
    }
    const message = encodeURIComponent(
      `Estimado/a ${clientName}, le saludamos desde StarMotos respecto a su solicitud de garantía.`
    );
    return `https://wa.me/${fullNumber}?text=${message}`;
  };

  const getStatusBadge = (status: WarrantyRequestStatus) => {
    switch (status) {
      case 'validada_matriz':
      case 'aprobada':
      case 'aceptada':
        return { label: 'Validada', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'en_proceso':
      case 'en_proceso_aceptacion_2':
      case 'enviada_garante':
        return { label: 'En Garante', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'enviada_matriz':
      case 'en_revision':
      case 'creada':
        return { label: 'En Revisión', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'completada':
        return { label: 'Completada', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'rechazada':
      case 'denegada':
        return { label: 'Rechazada', bg: 'bg-red-50 text-red-700 border-red-200' };
      default:
        return { label: (status as string).replace(/_/g, ' '), bg: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
    }
  };

  const getWarrantyTypeLabel = (type: string) => {
    switch (type) {
      case 'marca':
        return 'Oficial Fábrica';
      case 'plus_taller':
        return 'Taller Plus';
      case 'gps':
        return 'Seguridad GPS';
      default:
        return type;
    }
  };

  // Filtrado de garantías
  const filteredWarranties = useMemo(() => {
    return localWarranties.filter((w) => {
      // Filtro por pestaña de tipo
      if (activeTypeTab !== 'all' && w.warrantyType !== activeTypeTab) {
        return false;
      }

      // Filtro por estado
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'pendientes') {
          if (!['enviada_matriz', 'en_revision', 'creada'].includes(w.status)) return false;
        } else if (selectedStatusFilter === 'validadas') {
          if (!['validada_matriz', 'aprobada', 'en_proceso', 'enviada_garante', 'aceptada'].includes(w.status)) return false;
        } else if (selectedStatusFilter === 'completadas') {
          if (w.status !== 'completada') return false;
        } else if (w.status !== selectedStatusFilter) {
          return false;
        }
      }

      // Buscador multi-campo
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const client = (w.clientName || '').toLowerCase();
        const reqNum = (w.requestNumber || '').toLowerCase();
        const cedula = (w.clientIdNumber || '').toLowerCase();
        const moto = `${w.motorcycleBrand || ''} ${w.motorcycleModel || ''}`.toLowerCase();
        const plate = (w.motorcyclePlate || '').toLowerCase();
        const vin = (w.motorcycleVin || '').toLowerCase();
        const taller = (w.tallerOrigin || '').toLowerCase();
        const issue = (w.issueDescription || '').toLowerCase();

        return (
          client.includes(term) ||
          reqNum.includes(term) ||
          cedula.includes(term) ||
          moto.includes(term) ||
          plate.includes(term) ||
          vin.includes(term) ||
          taller.includes(term) ||
          issue.includes(term)
        );
      }

      return true;
    });
  }, [localWarranties, activeTypeTab, selectedStatusFilter, searchTerm]);

  // Abrir Ficha Técnica de Garantía
  const handleOpenWarrantyDetail = (w: WarrantyRequest) => {
    setSelectedWarrantyForDetail(w);
  };

  // Crear nueva solicitud desde el formulario rápido
  const handleCreateNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestData.clientName || !newRequestData.issueDescription) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    const newReq: WarrantyRequest = {
      id: `gar-${Date.now()}`,
      requestNumber: `GAR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: 'Hoy, Taller Express',
      clientName: newRequestData.clientName,
      clientIdNumber: newRequestData.clientIdNumber || '1700000000',
      clientPhone: newRequestData.clientPhone || '',
      motorcycleBrand: newRequestData.motorcycleBrand,
      targetBrand: newRequestData.motorcycleBrand,
      garanteName: newRequestData.warrantyType === 'marca' ? newRequestData.motorcycleBrand : undefined,
      motorcycleModel: newRequestData.motorcycleModel,
      motorcyclePlate: newRequestData.motorcyclePlate || 'SIN PLACA',
      motorcycleVin: newRequestData.motorcycleVin || 'VIN-EC-99881',
      warrantyType: newRequestData.warrantyType,
      issueDescription: newRequestData.issueDescription,
      mechanicDiagnosis: newRequestData.mechanicDiagnosis || '',
      diagnosticPhotos: [
        'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
      ],
      status: 'en_revision',
      tallerOrigin: currentWorkshopName,
      tallerOriginId: currentWorkshopId || 'matriz-la-mana',
      estimatedCost: Number(newRequestData.estimatedCost) || 80,
    };

    const updated = [newReq, ...localWarranties];
    setLocalWarranties(updated);
    saveStoredWarranties(updated);

    // Alerta de sistema
    const newAlert: SystemAlert = {
      id: `alt-${Date.now()}`,
      type: 'estado_cambiado',
      title: 'Nueva Solicitud de Garantía',
      message: `${newReq.tallerOrigin} generó la solicitud ${newReq.requestNumber} para ${newReq.clientName}.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: newReq.id,
    };
    saveStoredAlerts([newAlert, ...getStoredAlerts()]);

    setShowCreateModal(false);
    confetti({ particleCount: 60, spread: 65, origin: { y: 0.6 } });

    // Resetear formulario
    setNewRequestData({
      clientName: '',
      clientIdNumber: '',
      clientPhone: '',
      motorcycleBrand: 'Benelli',
      motorcycleModel: 'TRK 502X ABS',
      motorcyclePlate: '',
      motorcycleVin: '',
      warrantyType: 'marca',
      issueDescription: '',
      mechanicDiagnosis: '',
      estimatedCost: 80,
    });
  };

  return (
    <div className="w-full flex flex-col min-h-0 space-y-3">
      {/* Alerta emergente de garantías pendientes sin aceptar > 2 horas */}
      <AutoPendingWarrantiesAlert
        warranties={localWarranties}
        onSelectWarranty={(w) => setSelectedWarrantyForDetail(w)}
        role="taller"
      />

      {/* ========================================================================= */}
      {/* 1. DETALLE DE FICHA TÉCNICA DE GARANTÍA (IDÉNTICO A VISTA DE ESCRITORIO)  */}
      {/* ========================================================================= */}
      {selectedWarrantyForDetail && (
        <WarrantyDetailViewMobile
          warranty={selectedWarrantyForDetail}
          onBack={() => setSelectedWarrantyForDetail(null)}
          viewerRole="taller"
          onSave={(updated) => {
            setSelectedWarrantyForDetail(updated);
            setLocalWarranties((prev) => {
              const next = prev.map((item) => (item.id === updated.id ? updated : item));
              const allW = getStoredWarranties();
              const merged = allW.map((item) => (item.id === updated.id ? updated : item));
              saveStoredWarranties(merged);
              return next;
            });
          }}
          onCreateNewRequest={() => {
            setSelectedWarrantyForDetail(null);
            setShowCreateModal(true);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. FORMULARIO MÓVIL PARA CREAR NUEVA SOLICITUD DE GARANTÍA                */}
      {/* ========================================================================= */}
      {showCreateModal && !selectedWarrantyForDetail && (
        <NewWarrantyFormMobile
          onCancel={() => setShowCreateModal(false)}
          onSubmit={(newReq) => {
            const reqWithOrigin: WarrantyRequest = {
              ...newReq,
              tallerOrigin: currentWorkshopName,
              tallerOriginId: currentWorkshopId || newReq.tallerOriginId || 'matriz-la-mana',
            };
            setLocalWarranties((prev) => [reqWithOrigin, ...prev]);
            const allWarranties = getStoredWarranties();
            const merged = [reqWithOrigin, ...allWarranties.filter((w) => w.id !== reqWithOrigin.id)];
            saveStoredWarranties(merged);

            // Alerta de sistema
            const newAlert: SystemAlert = {
              id: `alt-${Date.now()}`,
              type: 'estado_cambiado',
              title: 'Nueva Solicitud de Garantía',
              message: `${reqWithOrigin.tallerOrigin} generó la solicitud ${reqWithOrigin.requestNumber} para ${reqWithOrigin.clientName}.`,
              timestamp: 'Ahora mismo',
              read: false,
              relatedId: reqWithOrigin.id,
            };
            saveStoredAlerts([newAlert, ...getStoredAlerts()]);

            if (onCreateRequest) {
              onCreateRequest(reqWithOrigin);
            }

            setShowCreateModal(false);
          }}
          clients={clients}
          defaultTallerOrigin={currentWorkshopName}
          defaultTallerOriginId={currentWorkshopId || 'matriz-la-mana'}
          viewerRole="taller"
          isMatriz={false}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. LISTADO MÓVIL DE TARJETAS DE GARANTÍA                                   */}
      {/* ========================================================================= */}
      {!selectedWarrantyForDetail && !showCreateModal && (
        <div className="w-full flex flex-col gap-3 animate-fade-in">
          {/* Título y Conteo */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight leading-tight">
                Garantías
              </h2>
            </div>
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-mono">
              {filteredWarranties.length} solicitudes
            </span>
          </div>

          {/* Barra de Herramientas: [+ Nueva] + [Buscador Aumentado] + [Filtro Estado] */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Botón "+ Nueva" */}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="h-11 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all shrink-0"
              title="Crear Solicitud de Garantía"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva</span>
            </button>

            {/* Buscador grande en el centro */}
            <div className="relative flex-1 flex items-center bg-white hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 border border-zinc-300 rounded-xl transition-all shadow-2xs h-11 px-3 gap-2">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, REC, moto o VIN..."
                className="w-full bg-transparent text-xs font-semibold text-zinc-800 placeholder-zinc-400 outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Botón de Filtro de Estado */}
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`h-11 px-3 rounded-xl border flex items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                selectedStatusFilter !== 'all'
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
              }`}
              title="Filtrar por Estado"
            >
              <Filter className="w-4 h-4 text-zinc-600" />
            </button>
          </div>

          {/* Menú Desplegable de Filtro */}
          {showFilterDropdown && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-md space-y-2 animate-slide-in">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100">
                <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span>Filtrar por Estado de Garantía</span>
                </span>
                <button
                  onClick={() => setShowFilterDropdown(false)}
                  className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <select
                value={selectedStatusFilter}
                onChange={(e) => {
                  setSelectedStatusFilter(e.target.value);
                  setShowFilterDropdown(false);
                }}
                className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600"
              >
                <option value="all">Todos los Estados</option>
                <option value="pendientes">⏳ Pendientes de Revisión</option>
                <option value="validadas">✓ Validadas / En Garante</option>
                <option value="completadas">🛠 Completadas</option>
              </select>
            </div>
          )}

          {/* Pestañas de Tipo de Garantía (Marca / Plus / GPS / Todas) */}
          <div className="flex rounded-xl bg-zinc-100 p-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTypeTab('all')}
              className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                activeTypeTab === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Todas ({localWarranties.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTypeTab('marca')}
              className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                activeTypeTab === 'marca' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Marca ({localWarranties.filter((w) => w.warrantyType === 'marca').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTypeTab('plus_taller')}
              className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                activeTypeTab === 'plus_taller' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Plus ({localWarranties.filter((w) => w.warrantyType === 'plus_taller').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTypeTab('gps')}
              className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                activeTypeTab === 'gps' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              GPS ({localWarranties.filter((w) => w.warrantyType === 'gps').length})
            </button>
          </div>

          {/* Lista de Tarjetas de Garantía (Una encima de otra, ricas y con clic para detalle) */}
          <div className="space-y-2">
            {filteredWarranties.length > 0 ? (
              filteredWarranties.map((w) => {
                const badge = getStatusBadge(w.status);
                const typeLabel = getWarrantyTypeLabel(w.warrantyType);
                const photosCount = w.diagnosticPhotos?.length || 0;

                return (
                  <div
                    key={w.id}
                    onClick={() => handleOpenWarrantyDetail(w)}
                    className="bg-white border border-zinc-200 hover:border-blue-400 rounded-xl p-3 shadow-2xs transition-all active:scale-[0.99] cursor-pointer space-y-2"
                  >
                    {/* Fila 1: Request Number + Tipo + Estado */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 shrink-0">
                          {w.requestNumber}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-600 px-2 py-0.5 rounded-lg bg-zinc-100 shrink-0">
                          {typeLabel}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${badge.bg}`}
                      >
                        {badge.label.toUpperCase()}
                      </span>
                    </div>

                    {/* Fila 2: Cliente y Teléfono WhatsApp */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 truncate">
                          {w.clientName}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          C.I. {w.clientIdNumber}
                        </p>
                      </div>
                      {w.clientPhone && (
                        <a
                          href={getCleanWhatsappUrl(w.clientPhone, w.clientName)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-emerald-600 font-bold text-[11px] flex items-center gap-1 hover:underline shrink-0"
                          title="Contactar al Cliente"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{w.clientPhone}</span>
                        </a>
                      )}
                    </div>

                    {/* Fila 3: Moto y Placa */}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                      <Bike className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-semibold truncate">
                        {w.motorcycleBrand} {w.motorcycleModel}
                      </span>
                      <span className="text-zinc-400">•</span>
                      <span className="font-mono text-zinc-600 text-[11px] font-bold">
                        {w.motorcyclePlate || 'SIN PLACA'}
                      </span>
                    </div>

                    {/* Fila 4: Descripción de la falla */}
                    <div className="p-2 bg-zinc-50 rounded-lg text-[11px] text-zinc-700 line-clamp-2">
                      {w.issueDescription}
                    </div>

                    {/* Fila 5: Info Inferior: Sede, Fotos y Presupuesto */}
                    <div className="pt-1.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                      <div className="flex items-center gap-1 truncate max-w-[55%]">
                        <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="truncate">{w.tallerOrigin || currentWorkshopName}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {photosCount > 0 && (
                          <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5">
                            <Camera className="w-3 h-3" />
                            <span>{photosCount}</span>
                          </span>
                        )}
                        {(w.totalBudget !== undefined && w.totalBudget > 0) || (w.estimatedCost !== undefined && w.estimatedCost > 0) ? (
                          <span className="font-bold text-zinc-900">
                            ${((w.totalBudget !== undefined && w.totalBudget > 0 ? w.totalBudget : w.estimatedCost) || 0).toFixed(2)} USD
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            Pendiente Matriz
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500 space-y-2">
                <ShieldCheck className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-xs font-semibold">No se encontraron solicitudes de garantía.</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-xs text-blue-600 font-bold underline cursor-pointer"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
