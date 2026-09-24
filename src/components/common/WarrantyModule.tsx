// src/components/common/WarrantyModule.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Send,
  Plus,
  Camera,
  User,
  Bike,
  Wrench,
  DollarSign,
  AlertCircle,
  Printer,
  MessageCircle,
  Upload,
  UploadCloud,
  Trash2,
  ZoomIn,
  Link as LinkIcon,
  Calendar,
  Building2,
  FileCheck2,
  Sparkles,
  Navigation,
  Check,
  Search,
  Pencil,
  Save,
  Tag,
  Package,
  Play,
  Film,
  Video,
  RefreshCw,
  RotateCcw,
  Image as ImageIcon,
  PlusCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WarrantyRequest, WarrantyRequestStatus, TallerClient } from '../../types/customer';
import { saveStoredWarranties, getStoredWarranties, saveStoredAlerts, getStoredAlerts, getStoredFullAlistamientos, getRegisteredBrands, getStoredGarantes } from '../../data/mockMultiRoleData';
import { cloudSaveWarranty } from '../../services/supabaseService';
import { isVideoUrl } from '../mobile/common/NewWarrantyFormMobile';
import { compressImageBase64, compressVideoBase64 } from '../../utils/imageCompressor';
import { uploadWarrantyMedia } from '../../services/mediaStorage';

// =========================================================================
// 1. HELPERS DE ESTADO Y CANONIZACIÓN
// =========================================================================

export type CanonicalWarrantyStatus = 'en_revision' | 'en_proceso' | 'en_proceso_aceptacion_2' | 'aceptada' | 'denegada' | 'completada';

export interface StatusInfo {
  canonical: CanonicalWarrantyStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: React.ReactNode;
}

export function getWarrantyStatusInfo(status: WarrantyRequestStatus): StatusInfo {
  switch (status) {
    case 'en_revision':
    case 'enviada_matriz':
    case 'creada':
      return {
        canonical: 'en_revision',
        label: 'En Revisión (Matriz)',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-800',
        badgeBorder: 'border-amber-300',
        icon: <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />,
      };
    case 'en_proceso':
    case 'validada_matriz':
    case 'enviada_garante':
      return {
        canonical: 'en_proceso',
        label: 'En Proceso (Garante Marca)',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-800',
        badgeBorder: 'border-blue-300',
        icon: <Clock className="w-3.5 h-3.5 text-blue-600" />,
      };
    case 'en_proceso_aceptacion_2':
    case 'aceptada':
    case 'aprobada':
      return {
        canonical: 'aceptada',
        label: 'Aceptado por Marca',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-800',
        badgeBorder: 'border-emerald-300',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      };
    case 'denegada':
    case 'rechazada':
      return {
        canonical: 'denegada',
        label: 'Denegado',
        badgeBg: 'bg-red-50',
        badgeText: 'text-red-800',
        badgeBorder: 'border-red-300',
        icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
      };
    case 'completada':
    default:
      return {
        canonical: 'completada',
        label: 'Completado',
        badgeBg: 'bg-zinc-100',
        badgeText: 'text-zinc-800',
        badgeBorder: 'border-zinc-300',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />,
      };
  }
}

// =========================================================================
// 2. TARJETA CUADRADA DE SOLICITUD (SQUARE CARD)
// =========================================================================

interface WarrantySquareCardProps {
  warranty: WarrantyRequest;
  onClick: () => void;
  viewerRole?: 'taller' | 'admin' | 'garante';
  onDelete?: (id: string) => void;
  onQuickStatusChange?: (warranty: WarrantyRequest) => void;
}

export const WarrantySquareCard: React.FC<WarrantySquareCardProps> = ({
  warranty,
  onClick,
  viewerRole = 'taller',
  onDelete,
  onQuickStatusChange,
}) => {
  const statusInfo = getWarrantyStatusInfo(warranty.status);

  return (
    <div
      onClick={onClick}
      className="group bg-white border-2 border-zinc-200 hover:border-blue-500 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between h-[315px] select-none relative overflow-hidden active:scale-99"
    >
      {/* Barra superior de acento según estado */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          statusInfo.canonical === 'en_revision'
            ? 'bg-amber-500'
            : statusInfo.canonical === 'en_proceso'
            ? 'bg-blue-600'
            : statusInfo.canonical === 'en_proceso_aceptacion_2'
            ? 'bg-indigo-600'
            : statusInfo.canonical === 'aceptada'
            ? 'bg-emerald-500'
            : statusInfo.canonical === 'denegada'
            ? 'bg-red-500'
            : 'bg-zinc-400'
        }`}
      />

      {/* Cabecera de la Tarjeta Cuadrada */}
      <div>
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {warranty.requestNumber}
            </span>
            <span className="text-[10px] uppercase font-bold text-zinc-500">
              {warranty.warrantyType === 'marca'
                ? `Marca (${warranty.motorcycleBrand || 'Oficial'})`
                : warranty.warrantyType === 'plus_taller'
                ? 'Plus Taller'
                : 'GPS'}
            </span>
            {warranty.resolutionType && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                {warranty.resolutionType === 'encargar_taller' ? '🔧 Taller' : '📦 Repuesto'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}
            >
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
            </div>

            {viewerRole === 'admin' && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`¿Está seguro de eliminar permanentemente la solicitud de garantía ${warranty.requestNumber} de ${warranty.clientName}?`)) {
                    onDelete(warranty.id);
                  }
                }}
                className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                title="Eliminar Solicitud de Garantía"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Datos Principales (Cliente & Vehículo) */}
        <div className="mt-2.5 space-y-2">
          {/* Cliente */}
          <div className="flex items-start gap-2">
            <User className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
            <div className="truncate">
              <span className="text-xs font-black text-zinc-900 truncate block">
                {warranty.clientName}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                C.I: {warranty.clientIdNumber}
              </span>
            </div>
          </div>

          {/* Motocicleta */}
          <div className="flex items-start gap-2">
            <Bike className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
            <div className="truncate">
              <span className="text-xs font-bold text-blue-950 truncate block">
                {warranty.motorcycleBrand} {warranty.motorcycleModel}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Placa: <strong className="text-zinc-700">{warranty.motorcyclePlate || 'S/P'}</strong>
                {warranty.motorcycleVin && ` • VIN: ${warranty.motorcycleVin.slice(-6)}`}
              </span>
            </div>
          </div>

          {/* Resumen Falla Técnica */}
          <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-150 text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">
            <span className="font-bold text-zinc-800">Falla: </span>
            {warranty.issueDescription}
          </div>
        </div>
      </div>

      {/* Pie de la Tarjeta Cuadrada */}
      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">
            {warranty.totalBudget && warranty.totalBudget > 0 ? 'Presupuesto Aprobado' : 'Presupuesto'}
          </span>
          {warranty.totalBudget && warranty.totalBudget > 0 ? (
            <span className="text-xs font-black font-mono text-emerald-700">
              ${warranty.totalBudget.toFixed(2)} USD
            </span>
          ) : (warranty.estimatedCost && warranty.estimatedCost > 0) ? (
            <span className="text-xs font-black font-mono text-zinc-900">
              ${warranty.estimatedCost.toFixed(2)} USD
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Pendiente Matriz
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {viewerRole === 'admin' && onQuickStatusChange && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickStatusChange(warranty);
              }}
              className="px-2 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
              title="Cambiar estado o enviar notas"
            >
              <FileCheck2 className="w-3 h-3" />
              <span>Gestionar</span>
            </button>
          )}

          <span className="text-[11px] font-bold text-blue-600 group-hover:underline">
            Ver Ficha
          </span>
          <div className="w-5 h-5 rounded-full bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center text-xs transition-colors">
            →
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 3. FICHA TÉCNICA EN FORMATO FORMULARIO (AUDITORÍA & DECISIÓN)
// =========================================================================

interface WarrantyFormViewProps {
  warranty: WarrantyRequest;
  onBack: () => void;
  viewerRole: 'taller' | 'admin' | 'garante';
  onValidateByMatriz?: (id: string, notes: string) => void;
  onRejectByMatriz?: (id: string, reason: string) => void;
  onApproveByGarante?: (id: string, notes: string, resolutionType?: 'encargar_taller' | 'envio_repuesto') => void;
  onRejectByGarante?: (id: string, reason: string) => void;
  onDelete?: (id: string) => void;
  onUpdateWarranty?: (updated: WarrantyRequest) => void;
  onCreateNewRequest?: () => void;
}

export const WarrantyFormView: React.FC<WarrantyFormViewProps> = ({
  warranty,
  onBack,
  viewerRole,
  onValidateByMatriz,
  onRejectByMatriz,
  onApproveByGarante,
  onRejectByGarante,
  onDelete,
  onUpdateWarranty,
  onCreateNewRequest,
}) => {
  const [currentWarranty, setCurrentWarranty] = useState<WarrantyRequest>(warranty);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<WarrantyRequest>(warranty);
  const [editPartTagInput, setEditPartTagInput] = useState('');

  // Sincronizar si cambia el prop warranty
  useEffect(() => {
    setCurrentWarranty(warranty);
    setEditFormData(warranty);
    setGaranteSelectedResolution(warranty.resolutionType || null);

    let pbMap: Record<string, number> = {};
    if (warranty.partsBudget) {
      if (Array.isArray(warranty.partsBudget)) {
        pbMap = warranty.partsBudget.reduce((acc, item) => {
          acc[item.name] = item.cost;
          return acc;
        }, {} as Record<string, number>);
      } else {
        pbMap = { ...(warranty.partsBudget as Record<string, number>) };
      }
    }
    setPartsBudgetMap(pbMap);
    setLaborTime(warranty.laborTime || '1 hora');
    setLaborCost(warranty.laborCost !== undefined ? Number(warranty.laborCost) : 0);
  }, [warranty]);

  const statusInfo = getWarrantyStatusInfo(currentWarranty.status);

  // Bloqueo total si la garantía ya fue aceptada, aprobada, denegada, rechazada o completada
  const isLocked = useMemo(() => {
    return (
      ['aceptada', 'aprobada', 'completada', 'denegada', 'rechazada'].includes(currentWarranty.status) ||
      ['aceptada', 'denegada'].includes(statusInfo.canonical)
    );
  }, [currentWarranty.status, statusInfo.canonical]);

  const isDenied = useMemo(() => {
    return (
      ['denegada', 'rechazada'].includes(currentWarranty.status) ||
      statusInfo.canonical === 'denegada'
    );
  }, [currentWarranty.status, statusInfo.canonical]);

  // Estados locales para notas de revisión
  const [matrizInputNotes, setMatrizInputNotes] = useState(
    currentWarranty.matrizNotes || 'Inspección técnica de Matriz aprobada. Aplica cobertura de fábrica.'
  );
  const [garanteInputNotes, setGaranteInputNotes] = useState(
    currentWarranty.garanteNotes || 'Dictamen oficial favorable emitido por la Gerencia de Garantías de la Marca.'
  );
  const [garanteSelectedResolution, setGaranteSelectedResolution] = useState<'encargar_taller' | 'envio_repuesto' | null>(
    currentWarranty.resolutionType || null
  );
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  // Presupuesto de repuestos y mano de obra
  const [partsBudgetMap, setPartsBudgetMap] = useState<Record<string, number>>(() => {
    if (!currentWarranty.partsBudget) return {};
    if (Array.isArray(currentWarranty.partsBudget)) {
      return currentWarranty.partsBudget.reduce((acc, item) => {
        acc[item.name] = item.cost;
        return acc;
      }, {} as Record<string, number>);
    }
    return currentWarranty.partsBudget as Record<string, number>;
  });
  const [laborTime, setLaborTime] = useState<string>(currentWarranty.laborTime || '1 hora');
  const [laborCost, setLaborCost] = useState<number>(currentWarranty.laborCost !== undefined ? Number(currentWarranty.laborCost) : 0);

  const parsedPartsList = useMemo(() => {
    if (currentWarranty.partsTags && currentWarranty.partsTags.length > 0) {
      return currentWarranty.partsTags;
    }
    if (currentWarranty.partsRequired) {
      return currentWarranty.partsRequired
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    }
    return [];
  }, [currentWarranty.partsTags, currentWarranty.partsRequired]);

  const QUICK_LABOR_TIMES = ['30 min', '1 hora', '2 horas', '4 horas', '1 día', '2 días'];

  const partsTotal = Object.values(partsBudgetMap).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const grandTotalBudget = partsTotal + (Number(laborCost) || 0);

  // Determinar si el administrador ha modificado algún valor del presupuesto respecto a lo guardado
  const isBudgetModified = useMemo(() => {
    const origLaborTime = currentWarranty.laborTime || '1 hora';
    const origLaborCost = currentWarranty.laborCost !== undefined ? Number(currentWarranty.laborCost) : 0;
    let origMap: Record<string, number> = {};
    if (currentWarranty.partsBudget) {
      if (Array.isArray(currentWarranty.partsBudget)) {
        origMap = currentWarranty.partsBudget.reduce((acc, item) => {
          acc[item.name] = item.cost;
          return acc;
        }, {} as Record<string, number>);
      } else {
        origMap = currentWarranty.partsBudget as Record<string, number>;
      }
    }

    if (laborTime !== origLaborTime) return true;
    if (Math.abs((Number(laborCost) || 0) - origLaborCost) > 0.001) return true;

    for (const part of parsedPartsList) {
      const origVal = Number(origMap[part] || 0);
      const curVal = Number(partsBudgetMap[part] || 0);
      if (Math.abs(origVal - curVal) > 0.001) return true;
    }
    return false;
  }, [currentWarranty, laborTime, laborCost, partsBudgetMap, parsedPartsList]);

  // Cancelar cambios de presupuesto y restaurar valores guardados
  const handleCancelBudget = () => {
    let origMap: Record<string, number> = {};
    if (currentWarranty.partsBudget) {
      if (Array.isArray(currentWarranty.partsBudget)) {
        origMap = currentWarranty.partsBudget.reduce((acc, item) => {
          acc[item.name] = item.cost;
          return acc;
        }, {} as Record<string, number>);
      } else {
        origMap = { ...(currentWarranty.partsBudget as Record<string, number>) };
      }
    }
    setPartsBudgetMap(origMap);
    setLaborTime(currentWarranty.laborTime || '1 hora');
    setLaborCost(currentWarranty.laborCost !== undefined ? Number(currentWarranty.laborCost) : 0);
  };

  const handleSaveBudget = () => {
    const updated: WarrantyRequest = {
      ...currentWarranty,
      partsBudget: partsBudgetMap,
      laborTime,
      laborCost,
      totalBudget: grandTotalBudget,
      estimatedCost: grandTotalBudget,
    };
    setCurrentWarranty(updated);
    setEditFormData(updated);

    const all = getStoredWarranties();
    const updatedList = all.map((w) => (w.id === updated.id ? updated : w));
    saveStoredWarranties(updatedList);
    try {
      cloudSaveWarranty(updated);
    } catch (e) {
      console.warn('Cloud save error', e);
    }
    if (onUpdateWarranty) {
      onUpdateWarranty(updated);
    }
    setToastMessage('✓ Presupuesto oficial de repuestos y mano de obra guardado.');
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
  };

  const handleSaveEditMode = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: WarrantyRequest = {
      ...editFormData,
      motorcycleVin: editFormData.motorcycleVin.toUpperCase(),
      motorcyclePlate: editFormData.motorcyclePlate.toUpperCase(),
      motorNumber: editFormData.motorNumber?.toUpperCase(),
      ramvNumber: editFormData.ramvNumber?.toUpperCase(),
      partsRequired: editFormData.partsTags?.join(', ') || editFormData.partsRequired,
    };
    setCurrentWarranty(updated);
    setIsEditing(false);

    const all = getStoredWarranties();
    const updatedList = all.map((w) => (w.id === updated.id ? updated : w));
    saveStoredWarranties(updatedList);
    try {
      cloudSaveWarranty(updated);
    } catch (e) {
      console.warn('Cloud save error', e);
    }
    if (onUpdateWarranty) {
      onUpdateWarranty(updated);
    }
    setToastMessage('✓ Solicitud de garantía actualizada exitosamente por Administrador.');
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleMatrizApprove = () => {
    if (onValidateByMatriz) {
      onValidateByMatriz(currentWarranty.id, matrizInputNotes);
      setToastMessage('✓ Solicitud aceptada por Matriz. Puesta EN PROCESO hacia el Garante de Marca.');
      confetti({ particleCount: 60, spread: 60 });
    }
  };

  const handleMatrizReject = () => {
    if (!rejectReasonInput.trim()) {
      alert('Por favor ingrese el motivo del rechazo en Matriz.');
      return;
    }
    if (onRejectByMatriz) {
      onRejectByMatriz(currentWarranty.id, rejectReasonInput);
      setToastMessage('✕ Solicitud rechazada por Matriz.');
    }
  };

  const handleGaranteApproveEncargar = () => {
    if (onApproveByGarante) {
      onApproveByGarante(currentWarranty.id, garanteInputNotes, 'encargar_taller');
    }
    const updated: WarrantyRequest = {
      ...currentWarranty,
      status: 'aceptada',
      resolutionType: 'encargar_taller',
      garanteNotes: garanteInputNotes,
      approvedAt: 'Hoy, Autorización Digital Garante de Marca',
      partsBudget: partsBudgetMap,
      laborTime,
      laborCost,
      totalBudget: grandTotalBudget,
      estimatedCost: grandTotalBudget,
    };
    setCurrentWarranty(updated);
    const all = getStoredWarranties();
    saveStoredWarranties(all.map((w) => (w.id === updated.id ? updated : w)));
    try {
      cloudSaveWarranty(updated);
    } catch (e) {
      console.warn('Cloud save error', e);
    }
    if (onUpdateWarranty) {
      onUpdateWarranty(updated);
    }
    setToastMessage('✓ Garantía aprobada oficialmente por la Marca (Resolución: Encargar a Taller).');
    confetti({ particleCount: 80, spread: 70, colors: ['#6366f1', '#2563eb', '#10b981'] });
  };

  const handleGaranteApproveEnvio = () => {
    if (onApproveByGarante) {
      onApproveByGarante(currentWarranty.id, garanteInputNotes, 'envio_repuesto');
    }
    const updated: WarrantyRequest = {
      ...currentWarranty,
      status: 'aceptada',
      resolutionType: 'envio_repuesto',
      garanteNotes: garanteInputNotes,
      approvedAt: 'Hoy, Autorización Digital Garante de Marca',
      totalBudget: 0,
      estimatedCost: 0,
    };
    setCurrentWarranty(updated);
    const all = getStoredWarranties();
    saveStoredWarranties(all.map((w) => (w.id === updated.id ? updated : w)));
    try {
      cloudSaveWarranty(updated);
    } catch (e) {
      console.warn('Cloud save error', e);
    }
    if (onUpdateWarranty) {
      onUpdateWarranty(updated);
    }
    setToastMessage('✓ Garantía aprobada: Envío de repuesto oficial autorizado.');
    confetti({ particleCount: 80, spread: 70, colors: ['#10b981', '#2563eb', '#f59e0b'] });
  };

  const handleGaranteReject = () => {
    if (!rejectReasonInput.trim()) {
      alert('Por favor ingrese la causa técnica del rechazo del Garante.');
      return;
    }
    if (onRejectByGarante) {
      onRejectByGarante(currentWarranty.id, rejectReasonInput);
      setToastMessage('✕ Garantía denegada por la Marca. Notificado a Matriz y Taller.');
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Toast Notificación */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs animate-slide-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 text-base font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Cabecera del Formulario */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Solicitudes</span>
          </button>

          <div className="h-6 w-px bg-zinc-200 hidden sm:block" />

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base sm:text-xl font-black text-zinc-900 tracking-tight">
                Ficha Técnica de Garantía: <span className="font-mono text-blue-600">{currentWarranty.requestNumber}</span>
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}
              >
                {statusInfo.icon}
                <span>{statusInfo.label}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Taller Emisor: <strong className="text-zinc-800">{currentWarranty.tallerOrigin}</strong> • Fecha:{' '}
              <strong className="text-zinc-800">{currentWarranty.createdAt}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {viewerRole === 'admin' && !isLocked && (
            <button
              type="button"
              onClick={() => {
                if (isEditing) {
                  setEditFormData(currentWarranty);
                }
                setIsEditing(!isEditing);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer ${
                isEditing
                  ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Pencil className="w-4 h-4" />
              <span>{isEditing ? 'Cancelar Edición' : 'Editar Solicitud'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </button>

          {currentWarranty.clientPhone && (
            <a
              href={`https://wa.me/593${currentWarranty.clientPhone.replace(/^0/, '')}?text=Hola%20${encodeURIComponent(
                currentWarranty.clientName
              )},%20le%20escribimos%20de%20StarMotos%20sobre%20su%20solicitud%20de%20garantía%20${currentWarranty.requestNumber}.`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Cliente</span>
            </a>
          )}

          {viewerRole === 'admin' && onDelete && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Está seguro de eliminar permanentemente la solicitud de garantía ${currentWarranty.requestNumber} de ${currentWarranty.clientName}?`)) {
                  onDelete(currentWarranty.id);
                  onBack();
                }
              }}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Eliminar esta garantía"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
          )}

          {isDenied && onCreateNewRequest && (
            <button
              type="button"
              onClick={onCreateNewRequest}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Crear Nueva Solicitud</span>
            </button>
          )}
        </div>
      </div>

      {/* Línea de Tiempo de Trazabilidad */}
      <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5">
        <h4 className="text-xs font-black uppercase text-zinc-500 tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Trazabilidad del Flujo de Garantía</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Paso 1: Taller */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
              statusInfo.canonical !== 'en_revision'
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                : 'bg-white border-amber-300 text-zinc-900 shadow-xs'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                statusInfo.canonical !== 'en_revision'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 text-white animate-pulse'
              }`}
            >
              1
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold block text-zinc-900">1. Emisión en Taller</span>
              <p className="text-xs text-zinc-600 mt-0.5">
                {currentWarranty.tallerOrigin} reportó la falla técnica.
              </p>
            </div>
          </div>

          {/* Paso 2: Matriz */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
              statusInfo.canonical === 'en_proceso' || statusInfo.canonical === 'aceptada' || statusInfo.canonical === 'en_proceso_aceptacion_2'
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                : statusInfo.canonical === 'en_revision'
                ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                : 'bg-zinc-50 border-zinc-200 text-zinc-500'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                statusInfo.canonical === 'en_proceso' || statusInfo.canonical === 'aceptada' || statusInfo.canonical === 'en_proceso_aceptacion_2'
                  ? 'bg-emerald-600 text-white'
                  : statusInfo.canonical === 'en_revision'
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-zinc-200 text-zinc-600'
              }`}
            >
              2
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold block text-zinc-900">2. Revisión Matriz Central</span>
              <p className="text-xs text-zinc-600 mt-0.5">
                {statusInfo.canonical === 'en_revision'
                  ? 'En proceso de verificación técnica.'
                  : 'Validado por Matriz y remitido a Fábrica.'}
              </p>
            </div>
          </div>

          {/* Paso 3: Garante */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
              statusInfo.canonical === 'aceptada'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                : statusInfo.canonical === 'en_proceso_aceptacion_2'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                : statusInfo.canonical === 'denegada'
                ? 'bg-red-50 border-red-300 text-red-900'
                : statusInfo.canonical === 'en_proceso'
                ? 'bg-blue-50 border-blue-300 text-blue-900 animate-pulse'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                statusInfo.canonical === 'aceptada'
                  ? 'bg-emerald-600 text-white'
                  : statusInfo.canonical === 'en_proceso_aceptacion_2'
                  ? 'bg-indigo-600 text-white'
                  : statusInfo.canonical === 'denegada'
                  ? 'bg-red-600 text-white'
                  : statusInfo.canonical === 'en_proceso'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-200 text-zinc-600'
              }`}
            >
              3
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold block text-zinc-900">3. Dictamen Garante Marca</span>
              <p className="text-xs text-zinc-600 mt-0.5">
                {statusInfo.canonical === 'aceptada'
                  ? '✓ Garantía Aceptada y Liquidada.'
                  : statusInfo.canonical === 'en_proceso_aceptacion_2'
                  ? '✓ Aceptado: Encargado a taller.'
                  : statusInfo.canonical === 'denegada'
                  ? '✕ Garantía Denegada.'
                  : 'En auditoría técnica oficial de marca.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULARIO: MODO EDICIÓN ADMINISTRADOR O MODO LECTURA */}
      {isEditing ? (
        <form onSubmit={handleSaveEditMode} className="space-y-6">
          <div className="bg-amber-50/70 border-2 border-amber-300 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Pencil className="w-5 h-5 text-amber-700" />
              <div>
                <span className="text-xs sm:text-sm font-black text-amber-950 block">Modo Edición Habilitado (Administrador Matriz)</span>
                <span className="text-xs text-amber-800">Modifique cualquier dato del cliente, motocicleta o falla y presione Guardar Cambios.</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Columna 1 Edición: Cliente */}
            <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 text-sm font-black text-zinc-900">
                <User className="w-4 h-4 text-blue-600" />
                <span>1. Cliente & Cobertura</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Cédula o RUC</label>
                <input
                  type="text"
                  value={editFormData.clientIdNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, clientIdNumber: e.target.value })}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={editFormData.clientName}
                  onChange={(e) => setEditFormData({ ...editFormData, clientName: e.target.value })}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={editFormData.clientPhone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, clientPhone: e.target.value })}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Taller Origen</label>
                <input
                  type="text"
                  value={editFormData.tallerOrigin}
                  onChange={(e) => setEditFormData({ ...editFormData, tallerOrigin: e.target.value })}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Tipo de Póliza</label>
                <select
                  value={editFormData.warrantyType}
                  onChange={(e) => setEditFormData({ ...editFormData, warrantyType: e.target.value as any })}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold"
                >
                  <option value="marca">Garantía Oficial de Marca ({editFormData.motorcycleBrand || 'Fábrica'})</option>
                  <option value="plus_taller">Garantía Plus StarMotos</option>
                  <option value="gps">Garantía Dispositivo GPS Satelital</option>
                </select>
              </div>
              {editFormData.warrantyType === 'marca' && (
                <div className="pt-1.5 animate-fade-in">
                  <label className="block text-xs font-black text-purple-900 mb-1">Marca / Garante Responsable (BD)</label>
                  <select
                    value={editFormData.motorcycleBrand}
                    onChange={(e) => setEditFormData({ ...editFormData, motorcycleBrand: e.target.value, targetBrand: e.target.value })}
                    className="w-full h-11 px-3 bg-purple-50 border border-purple-300 focus:border-purple-600 rounded-xl text-xs font-bold text-purple-900 cursor-pointer"
                  >
                    {getRegisteredBrands().map((b) => (
                      <option key={b} value={b}>{b} (Garante Oficial)</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Columna 2 Edición: Vehículo */}
            <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 text-sm font-black text-zinc-900">
                <Bike className="w-4 h-4 text-blue-600" />
                <span>2. Motocicleta Registrada</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Marca</label>
                  <input
                    type="text"
                    value={editFormData.motorcycleBrand}
                    onChange={(e) => setEditFormData({ ...editFormData, motorcycleBrand: e.target.value })}
                    className="w-full h-11 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={editFormData.motorcycleModel}
                    onChange={(e) => setEditFormData({ ...editFormData, motorcycleModel: e.target.value })}
                    className="w-full h-11 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Placa</label>
                  <input
                    type="text"
                    value={editFormData.motorcyclePlate}
                    onChange={(e) => setEditFormData({ ...editFormData, motorcyclePlate: e.target.value.toUpperCase() })}
                    className="w-full h-11 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Kilometraje</label>
                  <input
                    type="number"
                    value={editFormData.motorcycleMileage}
                    onChange={(e) => setEditFormData({ ...editFormData, motorcycleMileage: Number(e.target.value) || 0 })}
                    className="w-full h-11 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">VIN / Chasis</label>
                <input
                  type="text"
                  value={editFormData.motorcycleVin}
                  onChange={(e) => setEditFormData({ ...editFormData, motorcycleVin: e.target.value.toUpperCase() })}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">N° Motor</label>
                  <input
                    type="text"
                    value={editFormData.motorNumber || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, motorNumber: e.target.value.toUpperCase() })}
                    placeholder="S/N"
                    className="w-full h-11 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">N° RAMV</label>
                  <input
                    type="text"
                    value={editFormData.ramvNumber || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, ramvNumber: e.target.value.toUpperCase() })}
                    placeholder="S/N"
                    className="w-full h-11 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">N° Factura / Ticket</label>
                <input
                  type="text"
                  value={editFormData.invoiceNumber || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, invoiceNumber: e.target.value })}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {/* Columna 3 Edición: Falla y Repuestos */}
            <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 text-sm font-black text-zinc-900">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>3. Falla, Repuestos & Estado</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Descripción de la Falla</label>
                <textarea
                  rows={3}
                  value={editFormData.issueDescription}
                  onChange={(e) => setEditFormData({ ...editFormData, issueDescription: e.target.value })}
                  className="w-full p-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Repuestos Requeridos (Tags)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={editPartTagInput}
                    onChange={(e) => setEditPartTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const t = editPartTagInput.trim();
                        if (t) {
                          const currentTags = editFormData.partsTags || [];
                          if (!currentTags.includes(t)) {
                            setEditFormData({ ...editFormData, partsTags: [...currentTags, t] });
                          }
                          setEditPartTagInput('');
                        }
                      }
                    }}
                    placeholder="Escriba repuesto y presione Enter..."
                    className="flex-1 h-10 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const t = editPartTagInput.trim();
                      if (t) {
                        const currentTags = editFormData.partsTags || [];
                        if (!currentTags.includes(t)) {
                          setEditFormData({ ...editFormData, partsTags: [...currentTags, t] });
                        }
                        setEditPartTagInput('');
                      }
                    }}
                    className="px-3 bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(editFormData.partsTags || []).map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditFormData({
                            ...editFormData,
                            partsTags: (editFormData.partsTags || []).filter((_, i) => i !== idx),
                          });
                        }}
                        className="text-blue-500 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              {viewerRole === 'garante' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Modalidad de Resolución</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, resolutionType: 'encargar_taller' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        editFormData.resolutionType === 'encargar_taller'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                      }`}
                    >
                      🔧 Encargar a Taller
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, resolutionType: 'envio_repuesto' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        editFormData.resolutionType === 'envio_repuesto'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                      }`}
                    >
                      📦 Envío Repuesto
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Estado de la Solicitud</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as WarrantyRequestStatus })}
                  className="w-full h-11 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold"
                >
                  <option value="en_revision">En Revisión (Matriz)</option>
                  <option value="en_proceso">En Proceso (Garante Marca)</option>
                  <option value="en_proceso_aceptacion_2">En Proceso de Aceptación 2 (Taller Encargado)</option>
                  <option value="aceptada">Aceptada / Aprobada por Marca</option>
                  <option value="denegada">Denegada / Rechazada</option>
                  <option value="completada">Completada</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Todos los Cambios</span>
            </button>
          </div>
        </form>
      ) : (
        /* FORMULARIO MODO LECTURA: 3 COLUMNAS SIMÉTRICAS */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* COLUMNA 1: CLIENTE Y SEDE */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between space-y-5 hover:border-blue-200 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 text-sm sm:text-base font-black text-zinc-900">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <span>1. Datos del Cliente & Sede</span>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Cédula o RUC</label>
                <input
                  type="text"
                  readOnly
                  value={currentWarranty.clientIdNumber}
                  className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold text-zinc-900 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  readOnly
                  value={currentWarranty.clientName}
                  className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Teléfono de Contacto</label>
                <input
                  type="text"
                  readOnly
                  value={currentWarranty.clientPhone || '0990000000'}
                  className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono text-zinc-800 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Tipo de Cobertura / Póliza</label>
                <div className="h-11 sm:h-12 px-4 bg-blue-50 border border-blue-200 rounded-xl text-xs sm:text-sm font-bold text-blue-800 uppercase flex items-center">
                  Garantía Oficial de Marca
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Marca Garantía</label>
                <input
                  type="text"
                  readOnly
                  value={currentWarranty.targetBrand || currentWarranty.garanteName || currentWarranty.motorcycleBrand || 'Garante Oficial'}
                  className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Taller de Origen</label>
                <input
                  type="text"
                  readOnly
                  value={currentWarranty.tallerOrigin}
                  className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-800 cursor-not-allowed outline-none"
                />
              </div>
            </div>
          </div>

          {/* COLUMNA 2: VEHÍCULO */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between space-y-5 hover:border-blue-200 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 text-sm sm:text-base font-black text-zinc-900">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Bike className="w-4 h-4" />
                </div>
                <span>2. Motocicleta Registrada</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Marca</label>
                  <input
                    type="text"
                    readOnly
                    value={currentWarranty.motorcycleBrand}
                    className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 cursor-not-allowed outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Modelo</label>
                  <input
                    type="text"
                    readOnly
                    value={currentWarranty.motorcycleModel}
                    className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Placa</label>
                  <input
                    type="text"
                    readOnly
                    value={currentWarranty.motorcyclePlate || 'SIN PLACA'}
                    className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold text-zinc-800 cursor-not-allowed outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Kilometraje</label>
                  <input
                    type="text"
                    readOnly
                    value={`${currentWarranty.motorcycleMileage || 0} km`}
                    className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono text-zinc-800 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Serie o Chasis (VIN)</label>
                <input
                  type="text"
                  readOnly
                  value={currentWarranty.motorcycleVin}
                  className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono text-zinc-800 cursor-not-allowed outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Número de Motor</label>
                  <input
                    type="text"
                    readOnly
                    value={currentWarranty.motorNumber || 'S/N'}
                    className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 cursor-not-allowed outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Número de RAMV</label>
                  <input
                    type="text"
                    readOnly
                    value={currentWarranty.ramvNumber || 'S/N'}
                    className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">N° Factura / Ticket</label>
                <input
                  type="text"
                  readOnly
                  value={currentWarranty.invoiceNumber || 'TCK-2026-GAR'}
                  className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono text-zinc-800 cursor-not-allowed outline-none"
                />
              </div>
            </div>
          </div>

          {/* COLUMNA 3: RECLAMO TÉCNICO & COSTO */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between space-y-5 hover:border-blue-200 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 text-sm sm:text-base font-black text-zinc-900">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <span>3. Reclamo Técnico & Modalidad</span>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Falla Reportada</label>
                <textarea
                  rows={3}
                  readOnly
                  value={currentWarranty.issueDescription}
                  className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 cursor-not-allowed outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">
                  Repuestos Requeridos ({parsedPartsList.length})
                </label>
                {parsedPartsList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-50 border border-zinc-200 rounded-xl min-h-[44px]">
                    {parsedPartsList.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-bold"
                      >
                        <Tag className="w-3 h-3 text-blue-600" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    readOnly
                    value="Sin repuestos desglosados"
                    className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-500 cursor-not-allowed outline-none"
                  />
                )}
              </div>

              {/* Modalidad de Resolución: Solo editable para Garante Oficial */}
              {viewerRole === 'garante' ? (
                <div className="space-y-2 pt-1 border-t border-zinc-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs sm:text-sm font-bold text-zinc-700">
                      Modalidad de Resolución <span className="text-red-500">*</span>
                    </label>
                    {garanteSelectedResolution && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        Seleccionada
                      </span>
                    )}
                  </div>

                  {isLocked ? (
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                        Estado de Resolución
                      </span>
                      {currentWarranty.resolutionType === 'encargar_taller' ? (
                        <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                          <Wrench className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>Encargado al Taller (Repuestos y Mano de Obra autorizados)</span>
                        </div>
                      ) : currentWarranty.resolutionType === 'envio_repuesto' ? (
                        <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                          <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Envío de Repuesto Directo desde Fábrica / Importador</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-800 font-medium text-xs">
                          <Clock className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                          <span>Pendiente de dictamen técnico del Garante de Marca</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGaranteSelectedResolution('encargar_taller')}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          garanteSelectedResolution === 'encargar_taller'
                            ? 'border-indigo-600 bg-indigo-50/90 shadow-xs ring-2 ring-indigo-200'
                            : 'border-zinc-200 bg-zinc-50 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Wrench className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="text-xs font-black text-zinc-900 leading-tight">Encargar al taller</span>
                          </div>
                          {garanteSelectedResolution === 'encargar_taller' && (
                            <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-tight">
                          El taller ejecuta el trabajo y factura repuestos / mano de obra.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGaranteSelectedResolution('envio_repuesto')}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          garanteSelectedResolution === 'envio_repuesto'
                            ? 'border-emerald-600 bg-emerald-50/90 shadow-xs ring-2 ring-emerald-200'
                            : 'border-zinc-200 bg-zinc-50 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-black text-zinc-900 leading-tight">Envío de repuesto</span>
                          </div>
                          {garanteSelectedResolution === 'envio_repuesto' && (
                            <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-tight">
                          Fábrica o Marca despacha directamente las piezas sin costo.
                        </p>
                      </button>
                    </div>
                  )}
                </div>
              ) : currentWarranty.resolutionType ? (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Resolución Dictaminada por la Marca
                  </span>
                  {currentWarranty.resolutionType === 'encargar_taller' ? (
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                      <Wrench className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Encargado al Taller (Repuestos y Mano de Obra autorizados)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                      <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Envío de Repuesto Directo desde Fábrica / Importador</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN DE PRESUPUESTO OFICIAL (SIEMPRE VISIBLE EN MATRIZ; EN GARANTE/TALLER SOLO SI ENCARGAR AL TALLER) */}
      {!isEditing &&
        (viewerRole === 'admin' ||
          ((viewerRole === 'garante' || viewerRole === 'taller') &&
            (garanteSelectedResolution === 'encargar_taller' || currentWarranty.resolutionType === 'encargar_taller'))) && (
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 shadow-sm space-y-5 animate-fade-in">
          {/* BANNER DE OBSERVACIÓN Y DICTAMEN DEL GARANTE DE MARCA */}
          {currentWarranty.garanteNotes && (
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-2xl p-5 shadow-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-indigo-950">
                      Dictamen & Observación Oficial del Garante de Marca
                    </h4>
                    <p className="text-[11px] text-indigo-700 font-medium">
                      Instrucción técnica emitida para la liquidación de la garantía
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-600">Resolución:</span>
                  <span className="px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs bg-indigo-600 text-white">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Encargar al Taller</span>
                  </span>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-xs p-3.5 rounded-xl border border-indigo-200">
                <p className="text-xs sm:text-sm font-semibold text-zinc-900 leading-relaxed">
                  "{currentWarranty.garanteNotes}"
                </p>
                {currentWarranty.approvedAt && (
                  <p className="text-[10px] text-zinc-400 font-mono mt-1 text-right">
                    {currentWarranty.approvedAt}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                  <span>Presupuesto de Repuestos & Mano de Obra (Taller)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-black border border-indigo-200">
                    {viewerRole === 'admin' ? 'Editable Matriz Central' : 'Visualización Oficial'}
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  {viewerRole === 'admin' && !isLocked
                    ? 'Ingrese los valores unitarios en dólares ($ USD) y la mano de obra autorizada.'
                    : 'Ficha oficial de costos autorizados para repuestos y mano de obra.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500">Total Liquidación:</span>
              {grandTotalBudget > 0 ? (
                <span className="text-lg font-black font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  ${grandTotalBudget.toFixed(2)} USD
                </span>
              ) : (
                <span className="text-xs font-black uppercase text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                  Pendiente de Presupuesto (Matriz)
                </span>
              )}
            </div>
          </div>

          {/* DISTRIBUCIÓN EN 3 APARTADOS: 1. PRESUPUESTO SOLICITADO, 2. MANO DE OBRA, 3. RESUMEN DE COMPRA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* APARTADO 1: PRESUPUESTO SOLICITADO (REPUESTOS) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase text-zinc-700 tracking-wider">
                  1. Presupuesto Solicitado ({parsedPartsList.length})
                </label>
                {parsedPartsList.length > 0 && (
                  <span className="text-xs font-mono font-bold text-zinc-500">
                    ${partsTotal.toFixed(2)}
                  </span>
                )}
              </div>

              {parsedPartsList.length === 0 ? (
                <p className="text-xs text-zinc-400 italic bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  No se especificaron repuestos desglosados en esta solicitud.
                </p>
              ) : (
                <div className="flex flex-col space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {parsedPartsList.map((part, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-zinc-50 hover:bg-white border border-zinc-200 hover:border-indigo-300 rounded-xl transition-all shadow-2xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-zinc-800 truncate" title={part}>
                          {part}
                        </span>
                      </div>

                      <div className="relative w-28 shrink-0">
                        {viewerRole === 'admin' && !isLocked ? (
                          <>
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={partsBudgetMap[part] !== undefined ? partsBudgetMap[part] : ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPartsBudgetMap((prev) => ({
                                  ...prev,
                                  [part]: val,
                                }));
                              }}
                              className="w-full h-8 pl-5 pr-2 bg-white border border-zinc-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none text-right"
                            />
                          </>
                        ) : (
                          <div className="text-right">
                            <span className="font-mono font-bold text-xs text-zinc-900 bg-zinc-100 px-2 py-1 rounded-md">
                              ${(Number(partsBudgetMap[part]) || 0).toFixed(2)} USD
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* APARTADO 2: MANO DE OBRA CALIFICADA */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase text-zinc-700 tracking-wider">
                2. Mano de Obra
              </label>

              {viewerRole === 'admin' && !isLocked ? (
                <div className="bg-zinc-50 p-4 sm:p-5 rounded-2xl border border-zinc-200 space-y-4">
                  {/* Arriba: Las horas / tiempo estimado de demora */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-2">
                      Tiempo Estimado de Demora (Clic Rápido):
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {QUICK_LABOR_TIMES.map((timeOption) => (
                        <button
                          key={timeOption}
                          type="button"
                          onClick={() => setLaborTime(timeOption)}
                          className={`px-2 py-2 rounded-xl text-xs font-bold text-center transition cursor-pointer ${
                            laborTime === timeOption
                              ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200'
                              : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-100'
                          }`}
                        >
                          {timeOption}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Abajo: Poner el precio */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1.5">
                      Valor Mano de Obra ($ USD):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={laborCost !== undefined ? laborCost : ''}
                        onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                        className="w-full h-10 pl-7 pr-3 bg-white border border-zinc-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm font-mono font-bold text-zinc-900 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Modo puramente visual para Garante de Marca o garantía bloqueada */
                <div className="bg-zinc-50 p-4 sm:p-5 rounded-2xl border border-zinc-200 space-y-4">
                  <div>
                    <span className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Tiempo Estimado de Demora:
                    </span>
                    <span className="inline-block px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-xs rounded-xl">
                      {laborTime || '1 hora'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Valor Mano de Obra Autorizado:
                    </span>
                    <span className="font-mono font-black text-base text-zinc-900 bg-white px-3 py-1.5 rounded-xl border border-zinc-200 inline-block">
                      ${(Number(laborCost) || 0).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* APARTADO 3: RESUMEN DE COMPRA */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase text-zinc-700 tracking-wider">
                3. Resumen de Compra
              </label>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-zinc-900 uppercase">
                        Liquidación Oficial
                      </h4>
                      <p className="text-[10px] text-zinc-500">Taller Autorizado</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                    USD ($)
                  </span>
                </div>

                {/* Resumen de costos: Repuestos, Mantenimiento, Total */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
                    <span className="text-zinc-600 font-medium">Costo por Repuestos:</span>
                    <span className="font-mono font-bold text-zinc-900">${partsTotal.toFixed(2)} USD</span>
                  </div>

                  <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
                    <span className="text-zinc-600 font-medium">Costo por Mantenimiento:</span>
                    <span className="font-mono font-bold text-zinc-900">${Number(laborCost || 0).toFixed(2)} USD</span>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border-2 border-emerald-400 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider block">
                        Total General
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium">Liquidación Autorizada</span>
                    </div>
                    {grandTotalBudget > 0 ? (
                      <span className="text-xl font-black font-mono text-emerald-700">
                        ${grandTotalBudget.toFixed(2)} USD
                      </span>
                    ) : (
                      <span className="text-xs font-black uppercase text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded-lg border border-amber-300">
                        Pendiente Matriz
                      </span>
                    )}
                  </div>
                </div>

                {/* Botones de Presupuesto en Matriz: Solo se muestran si el Administrador modificó los valores */}
                {viewerRole === 'admin' && !isLocked && isBudgetModified && (
                  <div className="flex items-center gap-2 pt-1 animate-slide-in">
                    <button
                      type="button"
                      onClick={handleCancelBudget}
                      className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBudget}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar Presupuesto Oficial</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EVIDENCIAS FOTOGRÁFICAS */}
      {currentWarranty.diagnosticPhotos && currentWarranty.diagnosticPhotos.length > 0 && (
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h4 className="text-sm sm:text-base font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <span>Inspección Visual del Daño ({currentWarranty.diagnosticPhotos.length} Evidencias Fotográficas)</span>
            </h4>
            <span className="text-xs text-zinc-500 hidden sm:inline">Haga clic sobre una imagen para ampliarla</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
            {currentWarranty.diagnosticPhotos.map((url, i) => {
              const isVideo = isVideoUrl(url);
              return (
                <div
                  key={i}
                  onClick={() => setPreviewZoomImage(url)}
                  className="aspect-video rounded-xl overflow-hidden border border-zinc-200 block group relative shadow-2xs cursor-pointer bg-zinc-900"
                >
                  {isVideo ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-black">
                      <video
                        src={url}
                        className="w-full h-full object-cover opacity-80"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center shadow-lg border border-white/30 backdrop-blur-xs">
                          <Play className="w-4 h-4 fill-white ml-0.5 text-white" />
                        </div>
                      </div>
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-red-600/90 text-white rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                        <Film className="w-2.5 h-2.5" /> Video
                      </span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={url}
                        alt={`Evidencia ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center text-zinc-900 shadow-xs">
                          <ZoomIn className="w-4 h-4" />
                        </div>
                      </div>
                    </>
                  )}
                  <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 bg-black/60 text-white rounded text-[10px] font-mono font-bold z-10">
                    #{i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700 flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition z-20 text-sm font-bold"
            >
              ✕
            </button>
            {isVideoUrl(previewZoomImage) ? (
              <video
                src={previewZoomImage}
                controls
                autoPlay
                playsInline
                className="max-h-[85vh] w-auto max-w-full rounded-lg"
              />
            ) : (
              <img
                src={previewZoomImage}
                alt="Evidencia ampliada"
                className="max-h-[85vh] w-auto object-contain mx-auto"
              />
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN DE DICTÁMENES Y ACCIONES POR ROL */}

      {/* 1. SECCIÓN DE ACCIONES PARA MATRIZ CENTRAL (ADMIN) */}
      {viewerRole === 'admin' && statusInfo.canonical === 'en_revision' && (
        <div className="bg-blue-50/50 border-2 border-blue-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-900 tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Dictamen y Validación Técnica en Matriz</span>
          </div>

          <p className="text-xs text-zinc-600">
            Revise los datos del cliente, motocicleta y fotos. Estipule las observaciones técnicas de
            inspección y presione <strong>Aceptar</strong> para poner la solicitud <strong>En Proceso</strong> y
            enviarla al Garante de la Marca.
          </p>

          <div>
            <label className="block text-[11px] font-bold text-zinc-700 mb-1">
              Observaciones / Dictamen de Matriz Central
            </label>
            <textarea
              rows={2}
              value={matrizInputNotes}
              onChange={(e) => setMatrizInputNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 outline-none focus:border-blue-600"
            />
          </div>

          {showRejectBox && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <label className="block text-[11px] font-bold text-red-800">
                Motivo del Rechazo en Matriz:
              </label>
              <input
                type="text"
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="Ej. Falla causada por desgaste natural o falta de mantenimiento..."
                className="w-full px-3 py-1.5 bg-white border border-red-300 rounded-lg text-xs text-red-900 outline-none"
              />
              <button
                type="button"
                onClick={handleMatrizReject}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Confirmar Denegación en Matriz
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            {!showRejectBox && (
              <button
                type="button"
                onClick={() => setShowRejectBox(true)}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                ✕ Denegar Solicitud
              </button>
            )}

            <button
              type="button"
              onClick={handleMatrizApprove}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Aceptar y Enviar a Marca (Poner En Proceso)</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. SECCIÓN DE ACCIONES PARA EL GARANTE DE LA MARCA */}
      {viewerRole === 'garante' && (statusInfo.canonical === 'en_proceso' || statusInfo.canonical === 'en_revision') && (
        <div className="bg-purple-50/50 border-2 border-purple-300 rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-purple-950 tracking-wider">
            <Building2 className="w-4 h-4 text-purple-700" />
            <span>Resolución Oficial del Garante de Marca</span>
          </div>

          <p className="text-xs text-zinc-600">
            Como Garante Oficial de Fábrica / Importador, revise el informe técnico remitido por Matriz.
            Seleccione la modalidad de resolución (<strong>Encargar a Taller</strong> o <strong>Envío de Repuesto</strong>),
            escriba sus observaciones técnicas y confirme el dictamen oficial.
          </p>

          {currentWarranty.matrizNotes && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950">
              <span className="font-bold block mb-0.5">Informe Técnico Remitido por Matriz:</span>
              <p>{currentWarranty.matrizNotes}</p>
            </div>
          )}

          {/* Indicador de Modalidad Seleccionada en el Bloque 3 */}
          <div className="p-3.5 rounded-xl border bg-zinc-50 border-zinc-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-700">Modalidad Dictaminada (Bloque 3):</span>
              {garanteSelectedResolution === 'encargar_taller' ? (
                <span className="px-3 py-1 rounded-lg text-xs font-black bg-indigo-600 text-white flex items-center gap-1.5 shadow-xs">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Encargar al Taller (Presupuesto Habilitado)</span>
                </span>
              ) : garanteSelectedResolution === 'envio_repuesto' ? (
                <span className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white flex items-center gap-1.5 shadow-xs">
                  <Package className="w-3.5 h-3.5" />
                  <span>Envío de Repuesto Directo (Fábrica)</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Pendiente: Seleccione una opción en Columna 3 arriba</span>
                </span>
              )}
            </div>
            {!garanteSelectedResolution && (
              <p className="text-[11px] text-amber-700 mt-2">
                Por favor haga clic en <strong>"Encargar al taller"</strong> o <strong>"Envío de repuesto"</strong> en la Columna 3 para formalizar el dictamen técnico.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-700 mb-1">
              Observaciones / Dictamen Técnico del Garante de Marca <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={garanteInputNotes}
              onChange={(e) => setGaranteInputNotes(e.target.value)}
              placeholder="Describa las directrices técnicas para Matriz y el Taller sobre esta garantía..."
              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 outline-none focus:border-purple-600"
            />
          </div>

          {showRejectBox && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <label className="block text-[11px] font-bold text-red-800">
                Motivo Oficial de Denegación:
              </label>
              <input
                type="text"
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="Ej. Exceso de kilometraje sin sellos de mantenimiento oficiales..."
                className="w-full px-3 py-1.5 bg-white border border-red-300 rounded-lg text-xs text-red-900 outline-none"
              />
              <button
                type="button"
                onClick={handleGaranteReject}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Confirmar Denegación Oficial
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
            {!showRejectBox && (
              <button
                type="button"
                onClick={() => setShowRejectBox(true)}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                ✕ Denegar Cobertura
              </button>
            )}

            <button
              type="button"
              disabled={!garanteSelectedResolution}
              onClick={() => {
                if (!garanteSelectedResolution) {
                  alert('Por favor seleccione la modalidad de resolución en la Columna 3 arriba (Encargar al taller o Envío de repuesto).');
                  return;
                }
                if (!garanteInputNotes.trim()) {
                  alert('Por favor ingrese su observación / dictamen técnico antes de formalizar la aprobación.');
                  return;
                }
                if (garanteSelectedResolution === 'encargar_taller') {
                  handleGaranteApproveEncargar();
                } else {
                  handleGaranteApproveEnvio();
                }
              }}
              className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition ${
                !garanteSelectedResolution
                  ? 'bg-zinc-400 cursor-not-allowed opacity-60'
                  : garanteSelectedResolution === 'encargar_taller'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 cursor-pointer'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 cursor-pointer'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {!garanteSelectedResolution
                  ? 'Seleccione Modalidad Arriba'
                  : garanteSelectedResolution === 'encargar_taller'
                  ? 'Aprobar Dictamen: Encargar a Taller'
                  : 'Aprobar Dictamen: Envío de Repuesto'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* RESOLUCIONES YA SELLADAS (ACEPTADA O DENEGADA) */}
      {(statusInfo.canonical === 'aceptada' || statusInfo.canonical === 'denegada') && (
        <div
          className={`p-4 rounded-xl border-2 space-y-2 ${
            statusInfo.canonical === 'aceptada'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            {statusInfo.icon}
            <span>
              {statusInfo.canonical === 'aceptada'
                ? `Garantía ACEPTADA Oficialmente por la Marca${
                    currentWarranty.resolutionType === 'encargar_taller'
                      ? ' (Resolución: Encargar a Taller)'
                      : currentWarranty.resolutionType === 'envio_repuesto'
                      ? ' (Resolución: Envío de Repuesto)'
                      : ''
                  }`
                : 'Garantía DENEGADA Oficialmente por la Marca'}
            </span>
          </div>
          {currentWarranty.garanteNotes && (
            <p className="text-xs">
              <strong>Dictamen Oficial del Garante:</strong> {currentWarranty.garanteNotes}
            </p>
          )}
          {currentWarranty.rejectionReason && (
            <p className="text-xs">
              <strong>Motivo de Denegación:</strong> {currentWarranty.rejectionReason}
            </p>
          )}
          {statusInfo.canonical === 'aceptada' && (
            <p className="text-xs text-emerald-800">
              {currentWarranty.resolutionType === 'encargar_taller'
                ? 'El Taller Oficial y Matriz Central están autorizados para ejecutar el trabajo técnico y formalizar la liquidación.'
                : 'La Marca despachará los repuestos físicos requeridos directamente a la sede para su respectiva instalación.'}
            </p>
          )}
          {currentWarranty.approvedAt && (
            <p className="text-[11px] opacity-80">Fecha: {currentWarranty.approvedAt}</p>
          )}

          {statusInfo.canonical === 'denegada' && onCreateNewRequest && (
            <div className="pt-2 border-t border-red-200 flex justify-end">
              <button
                type="button"
                onClick={onCreateNewRequest}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Crear Nueva Solicitud de Garantía</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 4. FORMULARIO COMPLETO PARA EMITIR NUEVA SOLICITUD (EN TALLER)
// =========================================================================

interface NewWarrantyFormViewProps {
  onCancel: () => void;
  onSubmit: (newReq: WarrantyRequest) => void;
  clients?: TallerClient[];
  defaultTallerOrigin?: string;
  defaultTallerOriginId?: string;
}

export const NewWarrantyFormView: React.FC<NewWarrantyFormViewProps> = ({
  onCancel,
  onSubmit,
  clients = [],
  defaultTallerOrigin = 'StarMotos Taller Oficial',
  defaultTallerOriginId = 'matriz-la-mana',
}) => {
  const [registeredBrands, setRegisteredBrands] = useState<string[]>(getRegisteredBrands);

  useEffect(() => {
    const handleGarantesUpdated = () => {
      setRegisteredBrands(getRegisteredBrands());
    };
    window.addEventListener('starmotos_garantes_updated', handleGarantesUpdated);
    return () => {
      window.removeEventListener('starmotos_garantes_updated', handleGarantesUpdated);
    };
  }, []);

  const [formData, setFormData] = useState({
    clientName: '',
    clientIdNumber: '',
    clientPhone: '',
    targetBrand: '',
    motorcycleBrand: '',
    motorcycleModel: '',
    motorcyclePlate: '',
    motorcycleVin: '',
    motorNumber: '',
    ramvNumber: '',
    motorcycleMileage: '' as any,
    warrantyType: 'marca' as const,
    issueDescription: '',
    partsRequired: '',
    resolutionType: undefined as 'encargar_taller' | 'envio_repuesto' | undefined,
  });

  // 5 slots de fotos obligatorias y 2 slots de videos obligatorios
  const [photoSlots, setPhotoSlots] = useState<(string | null)[]>([null, null, null, null, null]);
  const [videoSlots, setVideoSlots] = useState<(string | null)[]>([null, null]);
  const [uploadingSlot, setUploadingSlot] = useState<{ type: 'photo' | 'video'; index: number } | null>(null);
  const [previewMedia, setPreviewMedia] = useState<string | null>(null);

  const activeSlotRef = useRef<{ type: 'photo' | 'video'; index: number } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const PHOTO_SLOT_GUIDES = [
    { title: 'Foto 1: Vista General', desc: 'Fotografía panorámica lateral completa de la motocicleta.' },
    { title: 'Foto 2: Serie / Chasis (VIN)', desc: 'Foto nítida del número de chasis grabado en el chasis o cabezote.' },
    { title: 'Foto 3: Odómetro / Tacómetro', desc: 'Foto clara del tablero digital o análogo mostrando el kilometraje.' },
    { title: 'Foto 4: Pieza Averiada', desc: 'Primer plano del componente averiado o zona del desperfecto.' },
    { title: 'Foto 5: Ángulo Complementario', desc: 'Evidencia adicional, número de serie de repuesto o vista opuesta.' },
  ];

  const VIDEO_SLOT_GUIDES = [
    { title: 'Video 1: Demostración de Falla', desc: 'Grabación clara en funcionamiento mostrando el ruido, fuga o falla.' },
    { title: 'Video 2: Inspección Funcional', desc: 'Verificación del encendido, aceleración o respuesta del sistema.' },
  ];

  const [partTagInput, setPartTagInput] = useState('');
  const [partsTags, setPartsTags] = useState<string[]>([]);
  const [searchStatus, setSearchStatus] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);

  const handleAddPartTag = () => {
    const trimmed = partTagInput.trim();
    if (!trimmed) return;
    if (!partsTags.includes(trimmed)) {
      setPartsTags((prev) => [...prev, trimmed]);
    }
    setPartTagInput('');
  };

  const handleRemovePartTag = (index: number) => {
    setPartsTags((prev) => prev.filter((_, i) => i !== index));
  };

  // Consulta y autocompletado de cliente por Cédula / RUC
  const handleConsultClient = () => {
    const term = formData.clientIdNumber.trim().toLowerCase();
    if (!term) {
      setSearchStatus({ type: 'warning', message: 'Ingrese una cédula o RUC para consultar' });
      return;
    }

    const foundClient = clients.find(
      (c) =>
        c.idNumber?.toLowerCase() === term ||
        c.idNumber?.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term))
    );

    const alistamientos = getStoredFullAlistamientos();
    const foundAlist = alistamientos.find(
      (r) =>
        r.cedulaRuc?.toLowerCase() === term ||
        r.cedulaRuc?.toLowerCase().includes(term) ||
        (r.celular1 && r.celular1.includes(term))
    );

    if (foundClient || foundAlist) {
      const clientName = foundClient?.fullName || (foundAlist ? `${foundAlist.nombres} ${foundAlist.apellidos}`.trim() : '');
      const clientIdNumber = foundClient?.idNumber || foundAlist?.cedulaRuc || '';
      const clientPhone = foundClient?.phone || foundAlist?.celular1 || '';
      const motorcycleBrand = foundClient?.motorcycleBrand || (foundAlist?.modeloMarca ? foundAlist.modeloMarca.split(' ')[0] : '');
      const motorcycleModel = foundClient?.motorcycleModel || foundAlist?.modeloMarca || '';
      const motorcyclePlate = (foundClient?.motorcyclePlate || foundAlist?.placa || '').toUpperCase();
      const motorcycleVin = foundClient?.motorcycleVin || foundAlist?.chasis || '';
      const motorNumber = (foundAlist?.numeroMotor || foundClient?.motorNumber || '').toUpperCase();
      const ramvNumber = (foundAlist?.ramv || foundClient?.ramvNumber || '').toUpperCase();
      const motorcycleMileage = foundClient?.motorcycleMileage !== undefined
        ? foundClient.motorcycleMileage
        : (foundAlist?.kilometraje !== undefined ? foundAlist.kilometraje : '');

      setFormData((prev) => ({
        ...prev,
        clientName: clientName || prev.clientName,
        clientIdNumber: clientIdNumber || prev.clientIdNumber,
        clientPhone: clientPhone || prev.clientPhone,
        motorcycleBrand: motorcycleBrand || prev.motorcycleBrand,
        motorcycleModel: motorcycleModel || prev.motorcycleModel,
        motorcyclePlate: motorcyclePlate || prev.motorcyclePlate,
        motorcycleVin: motorcycleVin || prev.motorcycleVin,
        motorNumber: motorNumber || prev.motorNumber,
        ramvNumber: ramvNumber || prev.ramvNumber,
        motorcycleMileage: motorcycleMileage !== undefined && motorcycleMileage !== '' ? motorcycleMileage : prev.motorcycleMileage,
      }));
      setSearchStatus({
        type: 'success',
        message: `✓ Datos cargados: ${clientName || clientIdNumber} (${motorcyclePlate || motorcycleVin || 'S/P'})`,
      });
    } else {
      setSearchStatus({
        type: 'warning',
        message: 'No encontrado en registro. Ingrese los datos manualmente.',
      });
    }
  };

  // Disparadores de carga por slot
  const handleTriggerPhotoUpload = (index: number) => {
    activeSlotRef.current = { type: 'photo', index };
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
      photoInputRef.current.click();
    }
  };

  const handleTriggerVideoUpload = (index: number) => {
    activeSlotRef.current = { type: 'video', index };
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
      videoInputRef.current.click();
    }
  };

  // Procesamiento de selección de archivo de foto (conversión y compresión a WebP + subida a nube)
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const active = activeSlotRef.current;
    if (!file || !active || active.type !== 'photo') return;
    setUploadingSlot({ type: 'photo', index: active.index });
    try {
      const compressed = await compressImageBase64(file);
      if (compressed) {
        setPhotoSlots((prev) => {
          const next = [...prev];
          next[active.index] = compressed;
          return next;
        });

        // Subir a la nube en segundo plano para obtener URL pública permanente
        uploadWarrantyMedia(compressed, `foto_${active.index + 1}`)
          .then((cloudUrl) => {
            if (cloudUrl && (cloudUrl.startsWith('http://') || cloudUrl.startsWith('https://'))) {
              setPhotoSlots((prev) => {
                const next = [...prev];
                next[active.index] = cloudUrl;
                return next;
              });
            }
          })
          .catch((err) => console.warn('Subida de foto en segundo plano:', err));
      }
    } catch (err) {
      console.error('Error al comprimir foto:', err);
      alert('Ocurrió un error al comprimir la fotografía.');
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  // Procesamiento de selección de archivo de video (subida directa a Storage + compresión de respaldo)
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const active = activeSlotRef.current;
    if (!file || !active || active.type !== 'video') return;
    setUploadingSlot({ type: 'video', index: active.index });
    try {
      // 1. Previsualización local inmediata
      const previewUrl = URL.createObjectURL(file);
      setVideoSlots((prev) => {
        const next = [...prev];
        next[active.index] = previewUrl;
        return next;
      });

      // 2. Subida directa del archivo binario a Supabase Storage
      const cloudUrl = await uploadWarrantyMedia(file, `video_${active.index + 1}`);
      if (cloudUrl && (cloudUrl.startsWith('http://') || cloudUrl.startsWith('https://'))) {
        setVideoSlots((prev) => {
          const next = [...prev];
          next[active.index] = cloudUrl;
          return next;
        });
      } else {
        // Fallback local con compresión ligera
        const compressed = await compressVideoBase64(file);
        if (compressed) {
          setVideoSlots((prev) => {
            const next = [...prev];
            next[active.index] = compressed;
            return next;
          });
        }
      }
    } catch (err) {
      console.error('Error al comprimir video:', err);
      alert('Ocurrió un error al comprimir el video.');
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  // Drag & drop en slots
  const handleSlotDrop = async (e: React.DragEvent, type: 'photo' | 'video', index: number) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (type === 'photo') {
      if (!file.type.startsWith('image/')) {
        alert('Por favor arrastre una imagen válida (JPG, PNG, WEBP).');
        return;
      }
      setUploadingSlot({ type: 'photo', index });
      try {
        const compressed = await compressImageBase64(file);
        if (compressed) {
          setPhotoSlots((prev) => {
            const next = [...prev];
            next[index] = compressed;
            return next;
          });
          uploadWarrantyMedia(compressed, `foto_${index + 1}`).then((cloudUrl) => {
            if (cloudUrl && (cloudUrl.startsWith('http://') || cloudUrl.startsWith('https://'))) {
              setPhotoSlots((prev) => {
                const next = [...prev];
                next[index] = cloudUrl;
                return next;
              });
            }
          }).catch((err) => console.warn(err));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUploadingSlot(null);
      }
    } else {
      if (!file.type.startsWith('video/')) {
        alert('Por favor arrastre un video válido (MP4, WEBM, MOV).');
        return;
      }
      setUploadingSlot({ type: 'video', index });
      try {
        const previewUrl = URL.createObjectURL(file);
        setVideoSlots((prev) => {
          const next = [...prev];
          next[index] = previewUrl;
          return next;
        });
        const cloudUrl = await uploadWarrantyMedia(file, `video_${index + 1}`);
        if (cloudUrl && (cloudUrl.startsWith('http://') || cloudUrl.startsWith('https://'))) {
          setVideoSlots((prev) => {
            const next = [...prev];
            next[index] = cloudUrl;
            return next;
          });
        } else {
          const compressed = await compressVideoBase64(file);
          if (compressed) {
            setVideoSlots((prev) => {
              const next = [...prev];
              next[index] = compressed;
              return next;
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUploadingSlot(null);
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const handleRemoveVideo = (index: number) => {
    setVideoSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadingSlot !== null) {
      alert('Por favor espere a que termine de cargarse el archivo seleccionado antes de emitir la solicitud.');
      return;
    }

    if (!formData.clientName.trim() || !formData.clientIdNumber.trim() || !formData.issueDescription.trim()) {
      alert('Por favor complete los campos obligatorios del cliente y la descripción del reclamo.');
      return;
    }

    if (!formData.targetBrand.trim()) {
      alert('Por favor seleccione la Marca Garantía registrada.');
      return;
    }

    const loadedPhotos = photoSlots.filter(Boolean) as string[];
    const loadedVideos = videoSlots.filter(Boolean) as string[];



    const newReq: WarrantyRequest = {
      id: `gar-${Date.now()}`,
      requestNumber: `GAR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      clientName: formData.clientName.trim(),
      clientIdNumber: formData.clientIdNumber.trim(),
      clientPhone: formData.clientPhone.trim(),
      motorcycleBrand: formData.motorcycleBrand.trim(),
      motorcycleModel: formData.motorcycleModel.trim(),
      motorcyclePlate: formData.motorcyclePlate.trim().toUpperCase() || 'SIN PLACA',
      motorcycleVin: formData.motorcycleVin.trim().toUpperCase() || `VIN-${Date.now()}`,
      motorNumber: formData.motorNumber.trim().toUpperCase(),
      ramvNumber: formData.ramvNumber.trim().toUpperCase(),
      motorcycleMileage: Number(formData.motorcycleMileage) || 0,
      warrantyType: 'marca',
      targetBrand: formData.targetBrand.trim(),
      garanteName: formData.targetBrand.trim(),
      issueDescription: formData.issueDescription.trim(),
      partsTags: partsTags.length > 0 ? partsTags : (formData.partsRequired ? [formData.partsRequired] : []),
      partsRequired: partsTags.join(', ') || formData.partsRequired.trim(),
      resolutionType: undefined,
      diagnosticPhotos: [...loadedPhotos, ...loadedVideos],
      status: 'en_revision',
      tallerOrigin: defaultTallerOrigin,
      tallerOriginId: defaultTallerOriginId,
      estimatedCost: 0,
      invoiceNumber: `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    onSubmit(newReq);
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="w-full space-y-6 animate-slide-in"
    >
      {/* Inputs invisibles para fotos y videos */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoFileChange}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoFileChange}
        className="hidden"
      />

      {/* Botón Volver arriba a la derecha en la esquina */}
      <div className="flex justify-end pb-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
      </div>

      {/* Formulario 3 Columnas Simétricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Columna 1: Cliente & Póliza */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between space-y-5 hover:border-blue-200 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 text-sm sm:text-base font-black text-zinc-900">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <span>1. Datos del Cliente & Póliza</span>
            </div>

            {/* Cédula o RUC con botón Consultar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs sm:text-sm font-bold text-zinc-700">
                  Cédula o RUC <span className="text-red-500">*</span>
                </label>
                {searchStatus && (
                  <span
                    className={`text-[11px] font-bold ${
                      searchStatus.type === 'success' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {searchStatus.message}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={formData.clientIdNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, clientIdNumber: e.target.value });
                    if (searchStatus) setSearchStatus(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConsultClient();
                    }
                  }}
                  placeholder="Ej: 1204567890"
                  className="flex-1 h-11 sm:h-12 px-4 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-mono font-bold text-zinc-900 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleConsultClient}
                  className="h-11 sm:h-12 px-4 sm:px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span>Consultar</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">
                Nombres y Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Ej: Fernando Vaca"
                className="w-full h-11 sm:h-12 px-4 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-bold text-zinc-900 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">
                Celular / WhatsApp
              </label>
              <input
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                placeholder="Ej: 0990000000"
                className="w-full h-11 sm:h-12 px-4 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-mono text-zinc-900 transition-all outline-none"
              />
            </div>

            {/* Tipo de Cobertura / Póliza: Solo Garantía Oficial de Marca sin opciones para elegir */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">
                Tipo de Cobertura / Póliza
              </label>
              <div className="w-full h-11 sm:h-12 px-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-black text-blue-900">Garantía Oficial de Marca</span>
                </div>
                <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                  Oficial
                </span>
              </div>
            </div>

            {/* Marca Garantía: Sincronizada únicamente con marcas y garantes registrados con su Razón Social */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">
                Marca Garantía (Razón Social Registrada) <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.targetBrand}
                onChange={(e) => setFormData({ ...formData, targetBrand: e.target.value })}
                className="w-full h-11 sm:h-12 px-4 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-bold text-zinc-900 transition-all outline-none cursor-pointer"
              >
                <option value="" disabled>Seleccione la Razón Social de la Marca</option>
                {registeredBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-500 mt-1">
                Razón Social de marcas y garantes oficiales registrados en el sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Columna 2: Vehículo (Completamente vacío en estado inicial) */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between space-y-5 hover:border-blue-200 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 text-sm sm:text-base font-black text-zinc-900">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Bike className="w-4 h-4" />
              </div>
              <span>2. Motocicleta Reclamada</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">
                  Marca <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="registered-brands-datalist"
                  value={formData.motorcycleBrand}
                  onChange={(e) => setFormData({ ...formData, motorcycleBrand: e.target.value })}
                  placeholder="Ej: Marca de la moto"
                  className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-bold text-zinc-900 transition-all outline-none"
                />
                <datalist id="registered-brands-datalist">
                  {registeredBrands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">
                  Modelo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.motorcycleModel}
                  onChange={(e) => setFormData({ ...formData, motorcycleModel: e.target.value })}
                  placeholder="Ej: Modelo de la moto"
                  className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-bold text-zinc-900 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Placa</label>
                <input
                  type="text"
                  value={formData.motorcyclePlate}
                  onChange={(e) => setFormData({ ...formData, motorcyclePlate: e.target.value.toUpperCase() })}
                  placeholder="Ej: PBX-8492"
                  className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-mono font-bold text-zinc-900 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Kilometraje Actual</label>
                <input
                  type="number"
                  value={formData.motorcycleMileage}
                  onChange={(e) => setFormData({ ...formData, motorcycleMileage: e.target.value === '' ? '' : Number(e.target.value) })}
                  placeholder="Ej: 5000"
                  className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-mono text-zinc-900 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Serie o Chasis (VIN)</label>
              <input
                type="text"
                value={formData.motorcycleVin}
                onChange={(e) => setFormData({ ...formData, motorcycleVin: e.target.value.toUpperCase() })}
                placeholder="Ej: LBBP57008PA..."
                className="w-full h-11 sm:h-12 px-4 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-mono text-zinc-900 transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Número de Motor</label>
                <input
                  type="text"
                  value={formData.motorNumber}
                  onChange={(e) => setFormData({ ...formData, motorNumber: e.target.value.toUpperCase() })}
                  placeholder="Ej: BJ265MR-..."
                  className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-mono text-zinc-900 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Número de RAMV</label>
                <input
                  type="text"
                  value={formData.ramvNumber}
                  onChange={(e) => setFormData({ ...formData, ramvNumber: e.target.value.toUpperCase() })}
                  placeholder="Ej: 2024-RAMV-089"
                  className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-mono text-zinc-900 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Columna 3: Reclamo Técnico & Repuestos */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between space-y-5 hover:border-blue-200 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 text-sm sm:text-base font-black text-zinc-900">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
              <span>3. Reclamo & Diagnóstico</span>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">
                Descripción del Daño / Falla <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={formData.issueDescription}
                onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                placeholder="Describa el código de error, ruido, fuga, falla eléctrica o pieza averiada..."
                className="w-full p-4 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm text-zinc-900 transition-all outline-none resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">
                Repuestos Requeridos (Escriba y presione Enter)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={partTagInput}
                  onChange={(e) => setPartTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPartTag();
                    }
                  }}
                  placeholder="Ej: Sensor TPS, retenedores..."
                  className="flex-1 h-11 sm:h-12 px-4 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm text-zinc-900 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPartTag}
                  className="h-11 sm:h-12 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar</span>
                </button>
              </div>

              {/* Lista de tags creados */}
              {partsTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {partsTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-bold animate-fade-in"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePartTag(idx)}
                        className="w-4 h-4 rounded hover:bg-blue-200 text-blue-600 flex items-center justify-center cursor-pointer ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Evidencias e Inspección Visual: Fotos y Videos Opcionales */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-zinc-900">
                Evidencias Técnicas e Inspección Visual
              </h3>
              <p className="text-xs text-zinc-500">
                Adjunte las evidencias fotográficas y videos que considere necesarios (opcionales, se comprimen automáticamente).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                photoSlots.filter(Boolean).length > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200'
              }`}
            >
              {photoSlots.filter(Boolean).length}/5 Fotos Adjuntas
            </span>
            <span
              className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                videoSlots.filter(Boolean).length > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200'
              }`}
            >
              {videoSlots.filter(Boolean).length}/2 Videos Adjuntos
            </span>
          </div>
        </div>

        {/* Sección 1: Fotografías de Peritaje */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs sm:text-sm font-bold text-zinc-800 uppercase tracking-wider">
                1. Fotografías de Peritaje (Hasta 5 - Opcionales)
              </h4>
            </div>
            <span className="text-[11px] text-zinc-400">Formato WebP optimizado</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {photoSlots.map((photo, idx) => {
              const guide = PHOTO_SLOT_GUIDES[idx];
              const isUploading = uploadingSlot?.type === 'photo' && uploadingSlot?.index === idx;

              return (
                <div
                  key={`photo-slot-${idx}`}
                  className="flex flex-col h-full bg-zinc-50/70 border border-zinc-200 rounded-xl overflow-hidden p-2.5 space-y-2 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-zinc-700">Foto #{idx + 1}</span>
                    {photo ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Lista
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                        Opcional
                      </span>
                    )}
                  </div>

                  {/* Recuadro de carga / vista previa */}
                  <div
                    onClick={() => !isUploading && handleTriggerPhotoUpload(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleSlotDrop(e, 'photo', idx)}
                    className={`relative w-full aspect-video sm:aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                      photo
                        ? 'border-emerald-300 bg-black'
                        : 'border-zinc-300 hover:border-blue-500 bg-white hover:bg-blue-50/20'
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center p-2 text-center">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-1.5" />
                        <span className="text-[10px] font-bold text-blue-600">Comprimiendo WebP...</span>
                      </div>
                    ) : photo ? (
                      <>
                        <img
                          src={photo}
                          alt={guide.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewMedia(photo);
                            }}
                            className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white text-zinc-900 flex items-center justify-center transition cursor-pointer shadow-xs"
                            title="Ampliar foto"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTriggerPhotoUpload(idx);
                            }}
                            className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                            title="Reemplazar foto"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(idx);
                            }}
                            className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                            title="Eliminar foto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 text-center text-zinc-400 group hover:text-blue-600 transition">
                        <Camera className="w-6 h-6 mb-1 text-zinc-400" />
                        <span className="text-[11px] font-bold text-zinc-700">Subir Foto</span>
                        <span className="text-[9px] text-zinc-400">Clic o arrastrar</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-zinc-500 font-medium leading-tight">
                    {guide.title.split(': ')[1] || guide.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección 2: Videos Demostrativos */}
        <div className="space-y-3 pt-3 border-t border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs sm:text-sm font-bold text-zinc-800 uppercase tracking-wider">
                2. Videos de Evidencia Dinámica (Hasta 2 - Opcionales)
              </h4>
            </div>
            <span className="text-[11px] text-zinc-400">Compresión WebM ligera (&lt; 35s)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videoSlots.map((video, idx) => {
              const guide = VIDEO_SLOT_GUIDES[idx];
              const isUploading = uploadingSlot?.type === 'video' && uploadingSlot?.index === idx;

              return (
                <div
                  key={`video-slot-${idx}`}
                  className="flex flex-col bg-purple-50/30 border border-purple-200/80 rounded-xl overflow-hidden p-3 space-y-2 hover:border-purple-400 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-950 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-purple-600" />
                      {guide.title}
                    </span>
                    {video ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Video Cargado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                        Opcional
                      </span>
                    )}
                  </div>

                  {/* Recuadro de carga de video */}
                  <div
                    onClick={() => !isUploading && handleTriggerVideoUpload(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleSlotDrop(e, 'video', idx)}
                    className={`relative w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                      video
                        ? 'border-purple-400 bg-black'
                        : 'border-purple-300 hover:border-purple-600 bg-white hover:bg-purple-50/50'
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <div className="w-7 h-7 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-xs font-bold text-purple-800">Optimizando y comprimiendo video...</span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">Adaptando a formato ligero WebM</span>
                      </div>
                    ) : video ? (
                      <>
                        <video
                          src={video}
                          className="w-full h-full object-cover opacity-85"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center shadow-lg border border-white/30 backdrop-blur-xs">
                            <Play className="w-5 h-5 fill-white ml-0.5 text-white" />
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewMedia(video);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-zinc-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                            title="Reproducir video"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Reproducir</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTriggerVideoUpload(idx);
                            }}
                            className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer shadow-xs"
                            title="Reemplazar video"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveVideo(idx);
                            }}
                            className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition cursor-pointer shadow-xs"
                            title="Eliminar video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-center text-purple-400 hover:text-purple-700 transition">
                        <Film className="w-8 h-8 mb-1.5 text-purple-500" />
                        <span className="text-xs font-bold text-purple-950">Subir Video #{idx + 1}</span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">MP4, WEBM, MOV o arrastrar archivo</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-600 leading-relaxed font-medium">
                    {guide.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lightbox / Reproductor Zoom Modal */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700 flex flex-col items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewMedia(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition z-20 text-sm font-bold"
            >
              ✕
            </button>
            {isVideoUrl(previewMedia) ? (
              <video
                src={previewMedia}
                controls
                autoPlay
                playsInline
                className="max-h-[85vh] w-auto max-w-full rounded-xl"
              />
            ) : (
              <img
                src={previewMedia}
                alt="Evidencia ampliada"
                className="max-h-[85vh] w-auto object-contain mx-auto rounded-xl"
              />
            )}
          </div>
        </div>
      )}

      {/* Botones de Envío */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-zinc-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-sm font-bold transition cursor-pointer"
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition flex items-center gap-2.5 shadow-md hover:shadow-lg cursor-pointer active:scale-98"
        >
          <Send className="w-4 h-4" />
          <span>Emitir Solicitud</span>
        </button>
      </div>
    </form>
  );
};
