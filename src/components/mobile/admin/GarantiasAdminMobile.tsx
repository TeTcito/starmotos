// src/components/mobile/admin/GarantiasAdminMobile.tsx
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
  Trash2,
  X,
  CheckCircle2,
  UserCheck,
  Wrench,
  FileText,
  Clock,
  DollarSign,
  Phone,
  MessageCircle,
  AlertCircle,
  Check,
  Send,
  FileCheck2,
  Camera,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  WarrantyRequest,
  WarrantyRequestStatus,
  TallerClient,
} from '../../../types/customer';
import { NewWarrantyFormView } from '../../common/WarrantyModule';

interface Props {
  warranties: WarrantyRequest[];
  clients?: TallerClient[];
  onValidateWarranty: (id: string, notes: string) => void;
  onSendToGarante: (id: string, notes?: string) => void;
  onCompleteRepair: (id: string, invoiceNumber?: string) => void;
  onCreateWarranty?: (newReq: WarrantyRequest) => void;
  onDeleteWarranty?: (id: string) => void;
  onQuickUpdateStatus?: (id: string, status: WarrantyRequestStatus, notes?: string) => void;
}

export const GarantiasAdminMobile: React.FC<Props> = ({
  warranties,
  clients = [],
  onValidateWarranty,
  onSendToGarante,
  onCompleteRepair,
  onCreateWarranty,
  onDeleteWarranty,
  onQuickUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'marca' | 'plus_taller' | 'gps'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Formulario nuevo registro de garantía
  const [isEmitting, setIsEmitting] = useState(false);

  // Ficha de detalle de garantía seleccionada
  const [selectedWarrantyForDetail, setSelectedWarrantyForDetail] = useState<WarrantyRequest | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'cliente' | 'moto' | 'diagnostico'>('cliente');
  const [detailSuccessToast, setDetailSuccessToast] = useState<string | null>(null);

  // Estado del formulario de edición en la ficha técnica
  const [detailFormData, setDetailFormData] = useState<{
    clientName: string;
    clientIdNumber: string;
    clientPhone: string;
    tallerOrigin: string;
    createdAt: string;
    warrantyType: string;
    motorcycleBrand: string;
    motorcycleModel: string;
    motorcyclePlate: string;
    motorcycleVin: string;
    motorNumber: string;
    motorcycleMileage: string;
    issueDescription: string;
    mechanicDiagnosis: string;
    partsRequired: string;
    estimatedCost: string;
    status: WarrantyRequestStatus;
    matrizNotes: string;
    garanteNotes: string;
  } | null>(null);

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
    return warranties.filter((w) => {
      // Filtro por pestaña de tipo
      if (activeTypeTab !== 'all' && w.warrantyType !== activeTypeTab) {
        return false;
      }

      // Filtro por estado
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'pendientes') {
          if (!['enviada_matriz', 'en_revision', 'creada'].includes(w.status)) return false;
        } else if (selectedStatusFilter === 'validadas') {
          if (!['validada_matriz', 'aprobada', 'en_proceso', 'enviada_garante'].includes(w.status)) return false;
        } else if (selectedStatusFilter === 'completadas') {
          if (!['reparacion_completada', 'completada'].includes(w.status)) return false;
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
  }, [warranties, activeTypeTab, selectedStatusFilter, searchTerm]);

  // Abrir Ficha Técnica de Garantía
  const handleOpenWarrantyDetail = (w: WarrantyRequest) => {
    setSelectedWarrantyForDetail(w);
    setDetailActiveTab('cliente');
    setDetailSuccessToast(null);

    setDetailFormData({
      clientName: w.clientName,
      clientIdNumber: w.clientIdNumber,
      clientPhone: w.clientPhone || '',
      tallerOrigin: w.tallerOrigin,
      createdAt: w.createdAt,
      warrantyType: w.warrantyType,
      motorcycleBrand: w.motorcycleBrand,
      motorcycleModel: w.motorcycleModel,
      motorcyclePlate: w.motorcyclePlate || 'SIN PLACA',
      motorcycleVin: w.motorcycleVin,
      motorNumber: w.motorNumber || '',
      motorcycleMileage: String(w.motorcycleMileage || '0'),
      issueDescription: w.issueDescription,
      mechanicDiagnosis: w.mechanicDiagnosis || '',
      partsRequired: w.partsRequired || '',
      estimatedCost: String(w.estimatedCost || 60),
      status: w.status,
      matrizNotes: w.matrizNotes || '',
      garanteNotes: w.garanteNotes || '',
    });
  };

  // Guardar Cambios en la Ficha de Garantía
  const handleSaveWarrantyDetail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!detailFormData || !selectedWarrantyForDetail) return;

    if (onQuickUpdateStatus) {
      onQuickUpdateStatus(
        selectedWarrantyForDetail.id,
        detailFormData.status,
        detailFormData.matrizNotes
      );
    } else {
      onValidateWarranty(selectedWarrantyForDetail.id, detailFormData.matrizNotes);
    }

    // Actualizar datos locales
    setSelectedWarrantyForDetail((prev) =>
      prev
        ? {
            ...prev,
            status: detailFormData.status,
            matrizNotes: detailFormData.matrizNotes,
            mechanicDiagnosis: detailFormData.mechanicDiagnosis,
            partsRequired: detailFormData.partsRequired,
            estimatedCost: parseFloat(detailFormData.estimatedCost) || prev.estimatedCost,
          }
        : prev
    );

    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    setDetailSuccessToast('¡Ficha de garantía actualizada con éxito!');
    setTimeout(() => setDetailSuccessToast(null), 3000);
  };

  // Si está en modo emisión de nueva solicitud
  if (isEmitting) {
    return (
      <NewWarrantyFormView
        onCancel={() => setIsEmitting(false)}
        onSubmit={(req) => {
          if (onCreateWarranty) onCreateWarranty(req);
          setIsEmitting(false);
        }}
        clients={clients}
        defaultTallerOrigin="StarMotos Sede Matriz"
        defaultTallerOriginId="sede-matriz"
      />
    );
  }

  return (
    <div className="w-full flex flex-col min-h-0 space-y-3">
      {/* ========================================================================= */}
      {/* 1. DETALLE DE FICHA TÉCNICA DE GARANTÍA (TIPO FORMULARIO CON MÓDULOS)     */}
      {/* ========================================================================= */}
      {selectedWarrantyForDetail && detailFormData && (
        <form
          onSubmit={handleSaveWarrantyDetail}
          className="w-full flex flex-col gap-2.5 animate-fade-in -mt-1.5"
        >
          {/* Encabezado Ficha Técnica */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-200 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-black text-zinc-900 tracking-tight leading-tight truncate">
                    Ficha de garantía
                  </h2>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${
                      getStatusBadge(detailFormData.status).bg
                    }`}
                  >
                    {getStatusBadge(detailFormData.status).label.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono truncate mt-0.5">
                  <span className="font-semibold text-blue-700 font-mono">
                    {selectedWarrantyForDetail.requestNumber}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-zinc-700 truncate">
                    {detailFormData.clientName}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas (Iconos) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Imprimir */}
              <button
                type="button"
                onClick={() => window.print()}
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 border border-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Imprimir Ficha de Garantía"
              >
                <Printer className="w-4 h-4" />
              </button>

              {/* WhatsApp */}
              {detailFormData.clientPhone && (
                <a
                  href={getCleanWhatsappUrl(detailFormData.clientPhone, detailFormData.clientName)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-600 border border-emerald-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Contactar al Cliente"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}

              {/* Guardar */}
              <button
                type="submit"
                className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="Guardar"
              >
                <Save className="w-4 h-4" />
              </button>

              {/* Eliminar */}
              {onDeleteWarranty && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Está seguro de eliminar la solicitud ${selectedWarrantyForDetail.requestNumber}?`
                      )
                    ) {
                      onDeleteWarranty(selectedWarrantyForDetail.id);
                      setSelectedWarrantyForDetail(null);
                      setDetailFormData(null);
                    }
                  }}
                  className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white active:scale-95 text-red-600 border border-red-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Eliminar Garantía"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="h-5 w-px bg-zinc-200 mx-0.5" />

              {/* Regresar */}
              <button
                type="button"
                onClick={() => {
                  setSelectedWarrantyForDetail(null);
                  setDetailFormData(null);
                }}
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 border border-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Regresar a la Lista"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-600" />
              </button>
            </div>
          </div>

          {/* Toast de Éxito */}
          {detailSuccessToast && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-in shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{detailSuccessToast}</span>
            </div>
          )}

          {/* 3 Pestañas para alternar entre campos */}
          <div className="flex rounded-xl bg-zinc-100 p-1 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setDetailActiveTab('cliente')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                detailActiveTab === 'cliente'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Cliente</span>
            </button>
            <button
              type="button"
              onClick={() => setDetailActiveTab('moto')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                detailActiveTab === 'moto'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <Bike className="w-3.5 h-3.5 shrink-0" />
              <span>Motocicleta</span>
            </button>
            <button
              type="button"
              onClick={() => setDetailActiveTab('diagnostico')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                detailActiveTab === 'diagnostico'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 shrink-0" />
              <span>Diagnóstico</span>
            </button>
          </div>

          {/* Contenido según la Pestaña Activa */}
          <div className="w-full">
            {/* 1. CAMPO: CLIENTE & SEDE */}
            {detailActiveTab === 'cliente' && (
              <div className="space-y-2.5 animate-fade-in pt-1 pb-2">
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Datos del Cliente & Emisión</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Cédula o RUC *</label>
                    <input
                      type="text"
                      value={detailFormData.clientIdNumber}
                      readOnly
                      className="w-full px-2.5 py-1.5 bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-800 outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Nombre del Cliente *</label>
                    <input
                      type="text"
                      value={detailFormData.clientName}
                      onChange={(e) => setDetailFormData({ ...detailFormData, clientName: e.target.value })}
                      required
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700">Teléfono / Celular</label>
                      {detailFormData.clientPhone && (
                        <a
                          href={getCleanWhatsappUrl(detailFormData.clientPhone, detailFormData.clientName)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={detailFormData.clientPhone}
                      onChange={(e) => setDetailFormData({ ...detailFormData, clientPhone: e.target.value })}
                      placeholder="0991234567"
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-semibold text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div className="pt-2 border-t border-zinc-100 space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">Taller de Origen</label>
                      <input
                        type="text"
                        value={detailFormData.tallerOrigin}
                        readOnly
                        className="w-full px-2.5 py-1.5 bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-800 outline-none cursor-not-allowed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-700 mb-1">Fecha Emisión</label>
                        <input
                          type="text"
                          value={detailFormData.createdAt}
                          readOnly
                          className="w-full px-2.5 py-1.5 bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-800 outline-none cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-700 mb-1">Tipo de Garantía</label>
                        <select
                          value={detailFormData.warrantyType}
                          onChange={(e) => setDetailFormData({ ...detailFormData, warrantyType: e.target.value })}
                          className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600"
                        >
                          <option value="marca">Oficial Fábrica</option>
                          <option value="plus_taller">Taller Plus</option>
                          <option value="gps">Seguridad GPS</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CAMPO: MOTOCICLETA */}
            {detailActiveTab === 'moto' && (
              <div className="space-y-3 animate-fade-in pt-1 pb-3">
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <Bike className="w-3.5 h-3.5 text-blue-600" />
                    <span>Datos de la Motocicleta</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Marca *</label>
                      <input
                        type="text"
                        value={detailFormData.motorcycleBrand}
                        onChange={(e) => setDetailFormData({ ...detailFormData, motorcycleBrand: e.target.value })}
                        required
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-zinc-900 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Modelo *</label>
                      <input
                        type="text"
                        value={detailFormData.motorcycleModel}
                        onChange={(e) => setDetailFormData({ ...detailFormData, motorcycleModel: e.target.value })}
                        required
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-zinc-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[11px] font-bold text-zinc-700">Placa</label>
                        <button
                          type="button"
                          onClick={() => setDetailFormData({ ...detailFormData, motorcyclePlate: 'SIN PLACA' })}
                          className="text-[10px] text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          S/P
                        </button>
                      </div>
                      <input
                        type="text"
                        value={detailFormData.motorcyclePlate}
                        onChange={(e) =>
                          setDetailFormData({ ...detailFormData, motorcyclePlate: e.target.value.toUpperCase() })
                        }
                        placeholder="SIN PLACA"
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-bold text-zinc-900 uppercase outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Kilometraje (km)</label>
                      <input
                        type="number"
                        min="0"
                        value={detailFormData.motorcycleMileage}
                        onChange={(e) => setDetailFormData({ ...detailFormData, motorcycleMileage: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Serie o Chasis (VIN) *</label>
                    <input
                      type="text"
                      value={detailFormData.motorcycleVin}
                      onChange={(e) =>
                        setDetailFormData({ ...detailFormData, motorcycleVin: e.target.value.toUpperCase() })
                      }
                      required
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-bold text-zinc-900 uppercase outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">N° de Motor</label>
                    <input
                      type="text"
                      value={detailFormData.motorNumber || ''}
                      onChange={(e) =>
                        setDetailFormData({ ...detailFormData, motorNumber: e.target.value.toUpperCase() })
                      }
                      placeholder="Opcional"
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono text-zinc-900 uppercase outline-none transition-all"
                    />
                  </div>

                  {/* Resumen del Vehículo */}
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 text-xs">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                      Resumen del Vehículo:
                    </span>
                    <div className="text-zinc-800 font-bold">
                      {detailFormData.motorcycleBrand} {detailFormData.motorcycleModel}
                    </div>
                    <div className="text-[11px] text-zinc-600 font-mono mt-0.5">
                      Placa: <strong>{detailFormData.motorcyclePlate || 'SIN PLACA'}</strong> • Km:{' '}
                      <strong>{detailFormData.motorcycleMileage} km</strong> • Chasis:{' '}
                      <strong className="text-blue-700">{detailFormData.motorcycleVin}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. CAMPO: DIAGNÓSTICO & RESOLUCIÓN */}
            {detailActiveTab === 'diagnostico' && (
              <div className="space-y-3 animate-fade-in pt-1 pb-3">
                {/* Bloque 1: Falla / Reclamo del Cliente */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Descripción de la Falla / Reclamo</span>
                  </div>
                  <textarea
                    rows={2}
                    value={detailFormData.issueDescription}
                    onChange={(e) => setDetailFormData({ ...detailFormData, issueDescription: e.target.value })}
                    required
                    className="w-full px-2.5 py-1.5 bg-zinc-50 focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs text-zinc-900 outline-none transition-all resize-none"
                    placeholder="Síntoma reportado..."
                  />
                </div>

                {/* Bloque 2: Diagnóstico Técnico */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    <span>Diagnóstico Técnico del Taller</span>
                  </div>
                  <textarea
                    rows={2}
                    value={detailFormData.mechanicDiagnosis}
                    onChange={(e) => setDetailFormData({ ...detailFormData, mechanicDiagnosis: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs text-zinc-900 outline-none transition-all resize-none"
                    placeholder="Causa raíz encontrada por el jefe de taller o mecánico..."
                  />
                </div>

                {/* Bloque 3: Repuestos & Presupuesto */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Repuestos Requeridos & Presupuesto</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Piezas o Repuestos</label>
                    <input
                      type="text"
                      value={detailFormData.partsRequired}
                      onChange={(e) => setDetailFormData({ ...detailFormData, partsRequired: e.target.value })}
                      placeholder="Ej: Kit de arrastre, bobina de encendido"
                      className="w-full px-2.5 py-1.5 bg-zinc-50 focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs text-zinc-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Presupuesto Estimado ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={detailFormData.estimatedCost}
                      onChange={(e) => setDetailFormData({ ...detailFormData, estimatedCost: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-zinc-50 focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none"
                    />
                  </div>
                </div>

                {/* Bloque 4: Gestión de Estado & Resoluciones */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>Resolución & Estado de la Garantía</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Estado Actual</label>
                    <select
                      value={detailFormData.status}
                      onChange={(e) =>
                        setDetailFormData({ ...detailFormData, status: e.target.value as WarrantyRequestStatus })
                      }
                      className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900 outline-none focus:border-blue-600"
                    >
                      <option value="en_revision">⏳ En Revisión por Matriz</option>
                      <option value="validada_matriz">✓ Validada por Matriz</option>
                      <option value="en_proceso">🚀 En Garante / En Proceso</option>
                      <option value="aprobada">✓ Aprobada por Garante</option>
                      <option value="completada">🛠 Completada</option>
                      <option value="rechazada">✕ Rechazada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Observaciones de Matriz</label>
                    <textarea
                      rows={2}
                      value={detailFormData.matrizNotes}
                      onChange={(e) => setDetailFormData({ ...detailFormData, matrizNotes: e.target.value })}
                      placeholder="Resolución, observaciones o instrucciones para el taller..."
                      className="w-full px-2.5 py-1.5 bg-zinc-50 focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs text-zinc-900 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Bloque 5: Evidencias Fotográficas */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>Evidencias Fotográficas ({selectedWarrantyForDetail.diagnosticPhotos?.length || 0})</span>
                    </div>
                  </div>

                  {selectedWarrantyForDetail.diagnosticPhotos && selectedWarrantyForDetail.diagnosticPhotos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedWarrantyForDetail.diagnosticPhotos.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="aspect-square rounded-lg overflow-hidden border border-zinc-200 shadow-2xs bg-zinc-100 block group relative"
                        >
                          <img
                            src={url}
                            alt={`Evidencia ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center bg-zinc-50/50">
                      <Camera className="w-6 h-6 text-zinc-400 mb-1" />
                      <span className="text-xs font-semibold text-zinc-600">Sin fotos adjuntas</span>
                      <span className="text-[10px] text-zinc-400">Las evidencias fotográficas se adjuntan en el taller</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer de Acciones Ficha Técnica */}
          <div className="pt-1.5 border-t border-zinc-200 flex items-center justify-between gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedWarrantyForDetail(null);
                setDetailFormData(null);
              }}
              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="whitespace-nowrap">Volver</span>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Acción directa según estado */}
              {(detailFormData.status === 'enviada_matriz' || detailFormData.status === 'en_revision') && (
                <button
                  type="button"
                  onClick={() => {
                    onValidateWarranty(selectedWarrantyForDetail.id, detailFormData.matrizNotes || 'Validado por Matriz.');
                    setDetailFormData({ ...detailFormData, status: 'validada_matriz' });
                    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
                  }}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap shrink-0"
                >
                  <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Validar Matriz</span>
                </button>
              )}

              {detailFormData.status === 'validada_matriz' && (
                <button
                  type="button"
                  onClick={() => {
                    onSendToGarante(selectedWarrantyForDetail.id, detailFormData.matrizNotes);
                    setDetailFormData({ ...detailFormData, status: 'en_proceso' });
                    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
                  }}
                  className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap shrink-0"
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">A Garante</span>
                </button>
              )}

              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs whitespace-nowrap shrink-0"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Guardar</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 2. LISTADO MÓVIL DE TARJETAS DE GARANTÍA                                   */}
      {/* ========================================================================= */}
      {!selectedWarrantyForDetail && !isEmitting && (
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
            {onCreateWarranty && (
              <button
                type="button"
                onClick={() => setIsEmitting(true)}
                className="h-11 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all shrink-0"
                title="Emitir Solicitud de Garantía"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva</span>
              </button>
            )}

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
                <option value="completadas">🛠 Reparación Completada</option>
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
              Todas ({warranties.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTypeTab('marca')}
              className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                activeTypeTab === 'marca' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Marca ({warranties.filter((w) => w.warrantyType === 'marca').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTypeTab('plus_taller')}
              className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                activeTypeTab === 'plus_taller' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Plus ({warranties.filter((w) => w.warrantyType === 'plus_taller').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTypeTab('gps')}
              className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                activeTypeTab === 'gps' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              GPS ({warranties.filter((w) => w.warrantyType === 'gps').length})
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
                        <span className="truncate">{w.tallerOrigin}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {photosCount > 0 && (
                          <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5">
                            <Camera className="w-3 h-3" />
                            <span>{photosCount}</span>
                          </span>
                        )}
                        <span className="font-bold text-zinc-900">
                          ${(w.estimatedCost || 60).toFixed(2)} USD
                        </span>
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
