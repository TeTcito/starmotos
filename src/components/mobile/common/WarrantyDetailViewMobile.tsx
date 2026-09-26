// src/components/mobile/common/WarrantyDetailViewMobile.tsx
import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Bike,
  Wrench,
  Package,
  Camera,
  ZoomIn,
  Tag,
  Check,
  Plus,
  PlusCircle,
  Printer,
  MessageCircle,
  Save,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Send,
  DollarSign,
  Pencil,
  X,
  Building2,
  Play,
  Film,
  RotateCcw,
} from 'lucide-react';
import {
  WarrantyRequest,
  WarrantyRequestStatus,
} from '../../../types/customer';
import {
  saveStoredWarranties,
  getStoredWarranties,
  canDeleteWarranty,
} from '../../../data/mockMultiRoleData';
import { getWarrantyStatusInfo } from '../../common/WarrantyModule';
import { isVideoUrl } from './NewWarrantyFormMobile';
import { PrintableWarrantySheet } from '../../common/PrintableWarrantySheet';
import { isValidMediaUrl } from '../../../services/mediaStorage';

interface Props {
  warranty: WarrantyRequest;
  onBack: () => void;
  viewerRole?: 'admin' | 'taller' | 'garante';
  onSave?: (updated: WarrantyRequest) => void;
  onDelete?: (id: string) => void;
  onValidateWarranty?: (id: string, notes: string) => void;
  onSendToGarante?: (id: string, notes?: string) => void;
  onApproveWarranty?: (id: string, notes: string, resolutionType: 'encargar_taller' | 'envio_repuesto') => void;
  onRejectWarranty?: (id: string, reason: string) => void;
  onCreateNewRequest?: () => void;
}

export const WarrantyDetailViewMobile: React.FC<Props> = ({
  warranty,
  onBack,
  viewerRole = 'admin',
  onSave,
  onDelete,
  onValidateWarranty,
  onSendToGarante,
  onApproveWarranty,
  onRejectWarranty,
  onCreateNewRequest,
}) => {
  // Pestañas activas: cliente, moto, reclamo, dictamen
  const [activeTab, setActiveTab] = useState<'cliente' | 'moto' | 'reclamo' | 'dictamen'>('cliente');
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectionInput, setRejectionInput] = useState('');

  // Estado del formulario editable
  const [formData, setFormData] = useState({
    clientIdNumber: warranty.clientIdNumber || '',
    clientName: warranty.clientName || '',
    clientPhone: warranty.clientPhone || '',
    tallerOrigin: warranty.tallerOrigin || '',
    warrantyType: warranty.warrantyType || 'marca',
    motorcycleBrand: warranty.motorcycleBrand || '',
    motorcycleModel: warranty.motorcycleModel || '',
    motorcyclePlate: warranty.motorcyclePlate || 'SIN PLACA',
    motorcycleMileage: warranty.motorcycleMileage !== undefined ? String(warranty.motorcycleMileage) : '0',
    motorcycleVin: warranty.motorcycleVin || '',
    motorNumber: warranty.motorNumber || 'S/N',
    ramvNumber: warranty.ramvNumber || 'S/N',
    invoiceNumber: warranty.invoiceNumber || 'TCK-2026-GAR',
    issueDescription: warranty.issueDescription || '',
    partsTags: (warranty.partsTags && warranty.partsTags.length > 0)
      ? warranty.partsTags
      : (warranty.partsRequired
          ? warranty.partsRequired.split(',').map((p) => p.trim()).filter(Boolean)
          : []),
    resolutionType: warranty.resolutionType || ('envio_repuesto' as 'encargar_taller' | 'envio_repuesto'),
    diagnosticPhotos: warranty.diagnosticPhotos || [],
    status: warranty.status || 'en_revision',
    matrizNotes: warranty.matrizNotes || '',
    garanteNotes: warranty.garanteNotes || '',
    rejectionReason: warranty.rejectionReason || '',
    estimatedCost: warranty.estimatedCost !== undefined ? String(warranty.estimatedCost) : '60',
  });

  // Auxiliares para cálculo de presupuesto oficial en taller
  const QUICK_LABOR_TIMES = ['30 min', '1 hora', '2 horas', '3 horas', '4 horas'];
  const [laborTime, setLaborTime] = useState<string>(warranty.laborTime || '1 hora');
  const [laborCost, setLaborCost] = useState<number>(warranty.laborCost !== undefined ? Number(warranty.laborCost) : 0);
  const [partsBudgetMap, setPartsBudgetMap] = useState<Record<string, number>>(() => {
    if (!warranty.partsBudget) return {};
    if (Array.isArray(warranty.partsBudget)) {
      return warranty.partsBudget.reduce((acc, item) => {
        acc[item.name] = item.cost;
        return acc;
      }, {} as Record<string, number>);
    }
    return warranty.partsBudget as Record<string, number>;
  });

  const partsTotal = useMemo(() => {
    return formData.partsTags.reduce((acc, tag) => acc + (Number(partsBudgetMap[tag]) || 0), 0);
  }, [formData.partsTags, partsBudgetMap]);

  // Denegada oficialmente por Garante o Matriz
  const isDenied = useMemo(() => {
    const s1 = (formData.status || '').toLowerCase();
    const s2 = (warranty.status || '').toLowerCase();
    return ['denegada', 'rechazada'].includes(s1) || ['denegada', 'rechazada'].includes(s2);
  }, [formData.status, warranty.status]);

  // Bloqueo total si la garantía ya fue denegada, rechazada, aceptada, aprobada o completada
  const isLocked = useMemo(() => {
    return (
      isDenied ||
      ['aceptada', 'aprobada', 'completada', 'denegada', 'rechazada'].includes(formData.status) ||
      ['aceptada', 'aprobada', 'completada', 'denegada', 'rechazada'].includes(warranty.status)
    );
  }, [isDenied, formData.status, warranty.status]);

  // Seguimiento de cambios en presupuesto para mostrar/ocultar botones en Matriz
  const isBudgetModified = useMemo(() => {
    const origLaborTime = warranty.laborTime || '1 hora';
    const origLaborCost = warranty.laborCost !== undefined ? Number(warranty.laborCost) : 0;
    let origMap: Record<string, number> = {};
    if (warranty.partsBudget) {
      if (Array.isArray(warranty.partsBudget)) {
        origMap = warranty.partsBudget.reduce((acc, item) => {
          acc[item.name] = item.cost;
          return acc;
        }, {} as Record<string, number>);
      } else {
        origMap = warranty.partsBudget as Record<string, number>;
      }
    }

    if (laborTime !== origLaborTime) return true;
    if (Math.abs(laborCost - origLaborCost) > 0.001) return true;

    for (const tag of formData.partsTags) {
      const origVal = Number(origMap[tag] || 0);
      const curVal = Number(partsBudgetMap[tag] || 0);
      if (Math.abs(origVal - curVal) > 0.001) return true;
    }
    return false;
  }, [warranty, laborTime, laborCost, partsBudgetMap, formData.partsTags]);

  // Modo de edición activable manualmente
  const [isEditing, setIsEditing] = useState(false);
  const [backupFormData, setBackupFormData] = useState<typeof formData | null>(null);

  const canAdminOrTallerEdit = !isLocked && (viewerRole === 'admin' || viewerRole === 'taller');
  const isFieldEditable = canAdminOrTallerEdit && isEditing;

  const isForMatriz =
    warranty.targetBrand === 'StarMotos Matriz' ||
    (warranty.targetBrand || '').toLowerCase().includes('matriz') ||
    warranty.warrantyType === 'plus_taller' ||
    warranty.warrantyType === 'gps';

  const handleStartEdit = () => {
    setBackupFormData({ ...formData });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (backupFormData) {
      setFormData(backupFormData);
    }
    setIsEditing(false);
  };

  const handleSaveMobile = () => {
    handleSave();
    setIsEditing(false);
  };

  const handleMatrizDirectApprove = () => {
    const updated: WarrantyRequest = {
      ...warranty,
      ...formData,
      motorcycleMileage: Number(formData.motorcycleMileage) || 0,
      estimatedCost: parseFloat(formData.estimatedCost) || warranty.estimatedCost || 0,
      status: 'aceptada',
      matrizNotes: formData.matrizNotes || 'Garantía aprobada directamente por Sede Matriz y Almacén.',
      approvedAt: 'Hoy, Autorización Directa Matriz',
    };
    if (onSave) onSave(updated);
    try {
      const allStored = getStoredWarranties();
      saveStoredWarranties(allStored.map((w) => (w.id === updated.id ? updated : w)));
    } catch {}
    setFormData({ ...formData, status: 'aceptada' });
    setToastMessage('✓ Garantía aprobada exitosamente por Matriz.');
    confetti({ particleCount: 40, spread: 55, origin: { y: 0.7 } });
  };

  const handleMatrizReject = () => {
    const reason = window.prompt('Ingrese el motivo de denegación en Matriz Central:');
    if (!reason || !reason.trim()) return;
    const updated: WarrantyRequest = {
      ...warranty,
      ...formData,
      motorcycleMileage: Number(formData.motorcycleMileage) || 0,
      estimatedCost: parseFloat(formData.estimatedCost) || warranty.estimatedCost || 0,
      status: 'denegada',
      rejectionReason: reason.trim(),
      rejectedAt: 'Hoy, Matriz Central',
    };
    if (onSave) onSave(updated);
    try {
      const allStored = getStoredWarranties();
      saveStoredWarranties(allStored.map((w) => (w.id === updated.id ? updated : w)));
    } catch {}
    if (onRejectWarranty) {
      onRejectWarranty(warranty.id, reason.trim());
    }
    setFormData({ ...formData, status: 'denegada' });
    setToastMessage('✕ Solicitud rechazada por Matriz.');
  };

  // Decisión del Garante sobre la propuesta ('acepto' | 'no_acepto')
  const [garanteProposalDecision, setGaranteProposalDecision] = useState<'acepto' | 'no_acepto'>('acepto');

  // Observaciones individuales por repuesto introducidas por el Garante
  const [partsObservations, setPartsObservations] = useState<Record<string, string>>(() => {
    return warranty.partsObservations || {};
  });

  const canEditParts = !isLocked && (viewerRole === 'admin' ? isEditing : (viewerRole === 'garante' && garanteProposalDecision === 'no_acepto'));
  const canEditLabor = !isLocked && viewerRole === 'admin' && isEditing;

  const handleSaveGaranteParts = () => {
    const grandTotal = partsTotal + laborCost;
    const updated: WarrantyRequest = {
      ...warranty,
      partsBudget: partsBudgetMap,
      partsObservations,
      totalBudget: grandTotal,
      estimatedCost: grandTotal,
    };
    if (onSave) {
      onSave(updated);
    }
    try {
      const allStored = getStoredWarranties();
      const updatedList = allStored.map((w) => (w.id === updated.id ? updated : w));
      saveStoredWarranties(updatedList);
    } catch {}
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    setToastMessage('✓ Re-presupuesto y observaciones de repuestos guardados.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCancelBudget = () => {
    let origMap: Record<string, number> = {};
    if (warranty.partsBudget) {
      if (Array.isArray(warranty.partsBudget)) {
        origMap = warranty.partsBudget.reduce((acc, item) => {
          acc[item.name] = item.cost;
          return acc;
        }, {} as Record<string, number>);
      } else {
        origMap = { ...(warranty.partsBudget as Record<string, number>) };
      }
    }
    setPartsBudgetMap(origMap);
    setLaborTime(warranty.laborTime || '1 hora');
    setLaborCost(warranty.laborCost !== undefined ? Number(warranty.laborCost) : 0);
  };

  const handleSaveBudget = () => {
    const grandTotal = partsTotal + laborCost;
    const updated: WarrantyRequest = {
      ...warranty,
      partsBudget: partsBudgetMap,
      laborTime,
      laborCost,
      totalBudget: grandTotal,
      estimatedCost: grandTotal,
    };
    if (onSave) {
      onSave(updated);
    }
    try {
      const allStored = getStoredWarranties();
      const updatedList = allStored.map((w) => (w.id === updated.id ? updated : w));
      saveStoredWarranties(updatedList);
    } catch {}
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    setToastMessage('✓ Presupuesto oficial guardado.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Input temporal para agregar tags de repuestos
  const [tagInput, setTagInput] = useState('');

  // Info canónica de estado según módulo común de garantías
  const statusInfo = useMemo(() => {
    return getWarrantyStatusInfo(formData.status);
  }, [formData.status]);

  // URL limpia de WhatsApp
  const cleanWhatsappUrl = useMemo(() => {
    if (!formData.clientPhone) return '#';
    const cleanDigits = formData.clientPhone.replace(/\D/g, '');
    let fullNumber = cleanDigits;
    if (fullNumber.startsWith('0')) {
      fullNumber = `593${fullNumber.substring(1)}`;
    }
    const msg = encodeURIComponent(
      `Estimado/a ${formData.clientName}, le saludamos desde StarMotos respecto a su solicitud de garantía ${warranty.requestNumber}.`
    );
    return `https://wa.me/${fullNumber}?text=${msg}`;
  }, [formData.clientPhone, formData.clientName, warranty.requestNumber]);

  // Guardar cambios
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLocked) {
      alert('Esta solicitud de garantía se encuentra finalizada o denegada y está bloqueada para modificaciones.');
      return;
    }

    const updated: WarrantyRequest = {
      ...warranty,
      clientIdNumber: formData.clientIdNumber,
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      tallerOrigin: formData.tallerOrigin,
      warrantyType: formData.warrantyType,
      motorcycleBrand: formData.motorcycleBrand,
      motorcycleModel: formData.motorcycleModel,
      motorcyclePlate: formData.motorcyclePlate,
      motorcycleMileage: Number(formData.motorcycleMileage) || 0,
      motorcycleVin: formData.motorcycleVin,
      motorNumber: formData.motorNumber,
      ramvNumber: formData.ramvNumber,
      invoiceNumber: formData.invoiceNumber,
      issueDescription: formData.issueDescription,
      partsTags: formData.partsTags,
      partsRequired: formData.partsTags.join(', '),
      resolutionType: formData.resolutionType,
      status: formData.status,
      matrizNotes: formData.matrizNotes,
      garanteNotes: formData.garanteNotes,
      rejectionReason: formData.rejectionReason,
      estimatedCost: parseFloat(formData.estimatedCost) || warranty.estimatedCost || 0,
    };

    if (onSave) {
      onSave(updated);
    }

    // Persistir en localStorage
    try {
      const allStored = getStoredWarranties();
      const updatedList = allStored.map((w) => (w.id === updated.id ? updated : w));
      saveStoredWarranties(updatedList);
    } catch {
      // Ignorar si falla localStorage
    }

    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    setToastMessage('¡Ficha de garantía actualizada con éxito!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Acciones de dictamen oficial del Garante
  const handleGaranteApprove = () => {
    const finalNotes =
      formData.garanteNotes.trim() ||
      'Dictamen oficial favorable emitido por la Gerencia de Garantías de la Marca.';
    const finalResolution = formData.resolutionType || 'encargar_taller';
    const finalTotal = partsTotal + Number(laborCost || 0);

    const updated: WarrantyRequest = {
      ...warranty,
      status: 'aceptada',
      garanteNotes: finalNotes,
      resolutionType: finalResolution,
      approvedAt: 'Hoy, Autorización Digital Garante de Marca',
      partsBudget: partsBudgetMap,
      partsObservations,
      laborTime: laborTime,
      laborCost: Number(laborCost || 0),
      totalBudget: finalTotal,
      estimatedCost: finalTotal,
    };

    setFormData((prev) => ({
      ...prev,
      status: 'aceptada',
      garanteNotes: finalNotes,
      resolutionType: finalResolution,
      estimatedCost: finalTotal.toFixed(2),
    }));

    if (onApproveWarranty) {
      onApproveWarranty(warranty.id, finalNotes, finalResolution);
    } else if (onSave) {
      onSave(updated);
    }

    try {
      const allStored = getStoredWarranties();
      const updatedList = allStored.map((w) => (w.id === updated.id ? updated : w));
      saveStoredWarranties(updatedList);
    } catch {
      // Ignorar
    }

    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#16a34a', '#2563eb', '#6366f1'],
    });

    setToastMessage('¡Dictamen oficial de Marca aprobado con éxito!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGaranteReject = () => {
    const reason = rejectionInput.trim() || formData.rejectionReason.trim();
    if (!reason) {
      alert('Debe ingresar el motivo técnico de denegación de la garantía.');
      return;
    }

    const updated: WarrantyRequest = {
      ...warranty,
      status: 'denegada',
      rejectionReason: reason,
      garanteNotes: formData.garanteNotes || 'Denegado en auditoría oficial de garantías de marca.',
      rejectedAt: 'Hoy, Dictamen Garante Oficial',
    };

    setFormData((prev) => ({
      ...prev,
      status: 'denegada',
      rejectionReason: reason,
    }));

    if (onRejectWarranty) {
      onRejectWarranty(warranty.id, reason);
    } else if (onSave) {
      onSave(updated);
    }

    try {
      const allStored = getStoredWarranties();
      const updatedList = allStored.map((w) => (w.id === updated.id ? updated : w));
      saveStoredWarranties(updatedList);
    } catch {
      // Ignorar
    }

    setShowRejectBox(false);
    setToastMessage('Garantía denegada oficialmente.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Agregar tag de repuesto
  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !formData.partsTags.includes(t)) {
      setFormData({
        ...formData,
        partsTags: [...formData.partsTags, t],
      });
      setTagInput('');
    }
  };

  // Eliminar tag de repuesto
  const handleRemoveTag = (idx: number) => {
    setFormData({
      ...formData,
      partsTags: formData.partsTags.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="w-full flex flex-col min-h-0 -mt-1.5 animate-fade-in relative">
      <div className="print:hidden space-y-3">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. ENCABEZADO DE LA FICHA TÉCNICA (CON ACCIONES RÁPIDAS)                   */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-200 shrink-0">
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
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}
                >
                  {statusInfo.label.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono truncate mt-0.5">
                <span className="font-semibold text-blue-700">{warranty.requestNumber}</span>
                <span>•</span>
                <span className="font-semibold text-zinc-700 truncate">{formData.clientName}</span>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="flex items-center gap-1 shrink-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  title="Cancelar Edición"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSaveMobile}
                  className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  title="Guardar Cambios"
                >
                  <Save className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                {/* Imprimir / PDF */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-black active:scale-95 text-amber-400 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  title="PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>

                {/* WhatsApp */}
                {formData.clientPhone && (
                  <a
                    href={cleanWhatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-600 border border-emerald-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                    title="Contactar al Cliente"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}

                {/* Botón Edición (en lugar de guardar fijo) */}
                {canAdminOrTallerEdit && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    title="Edición"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

          {/* Botón rápido "+ Nueva" si la solicitud está denegada */}
          {isDenied && onCreateNewRequest && (
            <button
              type="button"
              onClick={onCreateNewRequest}
              className="h-8 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
              title="Crear Nueva Solicitud"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Nueva</span>
            </button>
          )}

          {/* Eliminar (Solo Admin con bloqueo de 30 días si está aceptada) */}
          {viewerRole === 'admin' && onDelete && (() => {
            const deleteCheck = canDeleteWarranty(warranty);
            if (!deleteCheck.canDelete) {
              return (
                <button
                  type="button"
                  onClick={() => alert(deleteCheck.reason)}
                  className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-400 border border-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs opacity-70"
                  title={deleteCheck.reason}
                >
                  <Trash2 className="w-4 h-4 text-zinc-400" />
                </button>
              );
            }
            return (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `¿Está seguro de eliminar permanentemente la solicitud de garantía ${warranty.requestNumber}?`
                    )
                  ) {
                    onDelete(warranty.id);
                    onBack();
                  }
                }}
                className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white active:scale-95 text-red-600 border border-red-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Eliminar Solicitud"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            );
          })()}

          <div className="h-5 w-px bg-zinc-200 mx-0.5" />

          {/* Regresar */}
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 border border-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-600" />
          </button>
        </div>
      </div>

      {/* Banner de Solicitud Denegada / Bloqueada con botón de Nueva Solicitud */}
      {isDenied && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3.5 space-y-2.5 animate-fade-in shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
              <XCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs sm:text-sm font-black text-red-950">
                  Solicitud Denegada
                </h4>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-red-200 text-red-900 uppercase">
                  Bloqueada
                </span>
              </div>
              <p className="text-[11px] text-red-800 leading-relaxed mt-0.5">
                Esta solicitud ha sido denegada oficialmente por la Marca. La edición se encuentra bloqueada tanto para Matriz como para el Taller.
              </p>
            </div>
          </div>
          {onCreateNewRequest && (
            <button
              type="button"
              onClick={onCreateNewRequest}
              className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Crear Nueva Solicitud de Garantía</span>
            </button>
          )}
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-in shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SELECTOR DE PESTAÑAS (COLOR TRAZABILIDAD: CLIENTE, MOTO, RECLAMO, DICTAMEN) */}
      {/* ========================================================================= */}
      <div className="flex rounded-xl bg-emerald-50/40 p-1 gap-1 overflow-x-auto shrink-0 scrollbar-none text-[11px] font-bold border border-emerald-100">
        {/* Pestaña: Cliente */}
        <button
          type="button"
          onClick={() => setActiveTab('cliente')}
          className={`flex-1 min-w-[75px] py-1.5 px-2.5 rounded-lg whitespace-nowrap transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            activeTab === 'cliente'
              ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs font-black'
              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold'
          }`}
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span>Cliente</span>
        </button>

        {/* Pestaña: Moto */}
        <button
          type="button"
          onClick={() => setActiveTab('moto')}
          className={`flex-1 min-w-[70px] py-1.5 px-2.5 rounded-lg whitespace-nowrap transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            activeTab === 'moto'
              ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs font-black'
              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold'
          }`}
        >
          <Bike className="w-3.5 h-3.5 shrink-0" />
          <span>Moto</span>
        </button>

        {/* Pestaña: Reclamo */}
        <button
          type="button"
          onClick={() => setActiveTab('reclamo')}
          className={`flex-1 min-w-[78px] py-1.5 px-2.5 rounded-lg whitespace-nowrap transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            activeTab === 'reclamo'
              ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs font-black'
              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 shrink-0" />
          <span>Reclamo</span>
        </button>

        {/* Pestaña: Dictamen (Unificado Fotos & Dictamen) */}
        <button
          type="button"
          onClick={() => setActiveTab('dictamen')}
          className={`flex-1 min-w-[80px] py-1.5 px-2.5 rounded-lg whitespace-nowrap transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            activeTab === 'dictamen'
              ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs font-black'
              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Dictamen</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. BLOQUE 1: DATOS DEL CLIENTE & SEDE                                      */}
      {/* ========================================================================= */}
      {activeTab === 'cliente' && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3.5 animate-fade-in">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 text-xs sm:text-sm font-black text-zinc-900">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <span>1. Datos del Cliente & Sede</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Cédula o RUC</label>
            <input
              type="text"
              disabled={!isFieldEditable}
              value={formData.clientIdNumber}
              onChange={(e) => setFormData({ ...formData, clientIdNumber: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white disabled:opacity-75 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Nombre Completo</label>
            <input
              type="text"
              disabled={!isFieldEditable}
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              required
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white uppercase disabled:opacity-75 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-zinc-700">Teléfono de Contacto</label>
              {formData.clientPhone && (
                <a
                  href={cleanWhatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 hover:underline"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
            <input
              type="text"
              disabled={!isFieldEditable}
              value={formData.clientPhone}
              onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              placeholder="0990000000"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 outline-none focus:border-blue-600 focus:bg-white disabled:opacity-75 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Taller de Origen</label>
            <input
              type="text"
              disabled={!isFieldEditable}
              value={formData.tallerOrigin}
              onChange={(e) => setFormData({ ...formData, tallerOrigin: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 outline-none focus:border-blue-600 focus:bg-white disabled:opacity-75 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Tipo de Cobertura / Póliza</label>
            {isFieldEditable && viewerRole === 'admin' ? (
              <select
                value={formData.warrantyType || 'marca'}
                onChange={(e) => setFormData({ ...formData, warrantyType: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-blue-900 outline-none"
              >
                <option value="marca">Garantía Oficial de Marca</option>
                <option value="plus_taller">Garantía Plus StarMotos</option>
                <option value="gps">Garantía Dispositivo GPS Satelital</option>
              </select>
            ) : (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-black text-blue-900 uppercase flex items-center justify-between">
                <span>
                  {formData.warrantyType === 'plus_taller'
                    ? 'Garantía Plus StarMotos'
                    : formData.warrantyType === 'gps'
                    ? 'Garantía Dispositivo GPS'
                    : 'Garantía Oficial de Marca'}
                </span>
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded uppercase">
                  Oficial
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Marca Garantía</label>
            <input
              type="text"
              readOnly
              value={warranty.targetBrand || warranty.garanteName || formData.motorcycleBrand || 'Garante Oficial'}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 outline-none"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BLOQUE 2: MOTOCICLETA REGISTRADA                                       */}
      {/* ========================================================================= */}
      {activeTab === 'moto' && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3.5 animate-fade-in">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 text-xs sm:text-sm font-black text-zinc-900">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Bike className="w-4 h-4" />
            </div>
            <span>2. Motocicleta Registrada</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Marca</label>
              <input
                type="text"
                disabled={!isFieldEditable}
                value={formData.motorcycleBrand}
                onChange={(e) => setFormData({ ...formData, motorcycleBrand: e.target.value })}
                placeholder="Marca"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Modelo</label>
              <input
                type="text"
                disabled={!isFieldEditable}
                value={formData.motorcycleModel}
                onChange={(e) => setFormData({ ...formData, motorcycleModel: e.target.value })}
                placeholder="Modelo"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-zinc-700">Placa</label>
                {isFieldEditable && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, motorcyclePlate: 'SIN PLACA' })}
                    className="text-[10px] text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    S/P
                  </button>
                )}
              </div>
              <input
                type="text"
                disabled={!isFieldEditable}
                value={formData.motorcyclePlate}
                onChange={(e) => setFormData({ ...formData, motorcyclePlate: e.target.value.toUpperCase() })}
                placeholder="SIN PLACA"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 outline-none focus:border-blue-600 focus:bg-white uppercase disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Kilometraje</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  disabled={!isFieldEditable}
                  value={formData.motorcycleMileage}
                  onChange={(e) => setFormData({ ...formData, motorcycleMileage: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 outline-none focus:border-blue-600 focus:bg-white pr-8 disabled:opacity-75 disabled:cursor-not-allowed"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-zinc-400">
                  km
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Serie o Chasis (VIN)</label>
            <input
              type="text"
              disabled={!isFieldEditable}
              value={formData.motorcycleVin}
              onChange={(e) => setFormData({ ...formData, motorcycleVin: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 outline-none focus:border-blue-600 focus:bg-white uppercase disabled:opacity-75 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Número de Motor</label>
              <input
                type="text"
                disabled={!isFieldEditable}
                value={formData.motorNumber}
                onChange={(e) => setFormData({ ...formData, motorNumber: e.target.value.toUpperCase() })}
                placeholder="S/N"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 outline-none focus:border-blue-600 focus:bg-white uppercase disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Número de RAMV</label>
              <input
                type="text"
                disabled={!isFieldEditable}
                value={formData.ramvNumber}
                onChange={(e) => setFormData({ ...formData, ramvNumber: e.target.value.toUpperCase() })}
                placeholder="S/N"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 outline-none focus:border-blue-600 focus:bg-white uppercase disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">N° Factura / Ticket</label>
            <input
              type="text"
              disabled={!isFieldEditable}
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              placeholder="FAC-2026-4869"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 outline-none focus:border-blue-600 focus:bg-white disabled:opacity-75 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BLOQUE 3: RECLAMO TÉCNICO & MODALIDAD                                  */}
      {/* ========================================================================= */}
      {activeTab === 'reclamo' && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3.5 animate-fade-in">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 text-xs sm:text-sm font-black text-zinc-900">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <span>3. Reclamo & Diagnóstico</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Falla Reportada</label>
            <textarea
              rows={3}
              disabled={!isFieldEditable}
              value={formData.issueDescription}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 outline-none focus:border-blue-600 focus:bg-white resize-none leading-relaxed disabled:opacity-75 disabled:cursor-not-allowed"
              placeholder="Descripción del reclamo reportado..."
            />
          </div>

          {/* Repuestos Requeridos con Tags */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Repuestos Requeridos ({formData.partsTags.length})
            </label>
            {isFieldEditable && (
              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Escriba repuesto y pulse +..."
                  className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:border-blue-600 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  +
                </button>
              </div>
            )}

            {formData.partsTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-50 border border-zinc-200 rounded-xl min-h-[44px]">
                {formData.partsTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-bold"
                  >
                    <Tag className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>{tag}</span>
                    {isFieldEditable && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(idx)}
                        className="text-blue-500 hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                Sin repuestos desglosados
              </p>
            )}
          </div>

          {/* =============================================================== */}
          {/* SECCIÓN DE PRESUPUESTO OFICIAL (EN MATRIZ SIEMPRE; EN GARANTE Y TALLER SOLO SI ENCARGAR AL TALLER) */}
          {/* =============================================================== */}
          {viewerRole === 'garante' && formData.resolutionType === 'envio_repuesto' && !isLocked && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1 animate-fade-in mt-3">
              <span className="font-bold flex items-center gap-1.5 text-emerald-950">
                <Package className="w-4 h-4 text-emerald-600" />
                Modalidad: Envío de Repuesto Directo
              </span>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                La marca despachará los repuestos físicos directamente a la sede sin costo alguno. No se genera presupuesto ni liquidación de taller.
              </p>
            </div>
          )}

          {(viewerRole === 'admin' ||
            ((viewerRole === 'garante' || viewerRole === 'taller') &&
              formData.resolutionType === 'encargar_taller')) && (
            <div className="pt-3 border-t border-zinc-100 space-y-3 animate-fade-in">
              {/* BANNER DE OBSERVACIÓN Y DICTAMEN DEL GARANTE DE MARCA (SI YA FUE EMITIDO) */}
              {Boolean(formData.garanteNotes || warranty.garanteNotes) && isLocked && (
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-2xl p-3.5 shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-950">
                        Dictamen & Observación Oficial del Garante de Marca
                      </h4>
                      <p className="text-[10px] text-indigo-700 font-medium">
                        Instrucción técnica emitida para la liquidación de la garantía
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/95 p-2.5 rounded-xl border border-indigo-200">
                    <p className="text-xs font-semibold text-zinc-900 leading-relaxed">
                      "{formData.garanteNotes || warranty.garanteNotes}"
                    </p>
                    {warranty.approvedAt && (
                      <p className="text-[10px] text-zinc-400 font-mono mt-1 text-right">
                        {warranty.approvedAt}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-900 leading-tight">
                      Presupuesto Oficial (Taller / Liquidación)
                    </h4>
                    <p className="text-[10px] text-zinc-500">
                      {viewerRole === 'admin' && !isLocked
                        ? 'Ingrese costos unitarios y tiempo de mano de obra'
                        : viewerRole === 'garante' && !isLocked
                        ? 'Revise la propuesta de Matriz: Acepte o re-presupueste'
                        : 'Desglose oficial de repuestos y mano de obra'}
                    </p>
                  </div>
                </div>
                {partsTotal + Number(laborCost || 0) > 0 ? (
                  <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                    ${(partsTotal + Number(laborCost || 0)).toFixed(2)} USD
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    Pendiente Matriz
                  </span>
                )}
              </div>

              <div className="space-y-3 bg-zinc-50/70 p-3 rounded-xl border border-zinc-200">
                {/* 1. Repuestos Desglosados */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      1. Presupuesto Repuestos ({formData.partsTags.length})
                    </label>
                    {partsTotal > 0 && (
                      <span className="text-[11px] font-mono font-bold text-indigo-700">
                        Subtotal: ${partsTotal.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {formData.partsTags.length > 0 ? (
                    <div className="space-y-2">
                      {formData.partsTags.map((tag, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-white rounded-lg border border-zinc-200 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-zinc-800 truncate flex-1">{tag}</span>
                            <div className="relative w-24 shrink-0 text-right">
                              {canEditParts ? (
                                <>
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[11px]">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={partsBudgetMap[tag] !== undefined ? partsBudgetMap[tag] : ''}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      const newMap = { ...partsBudgetMap, [tag]: val };
                                      setPartsBudgetMap(newMap);
                                      const newPartsTotal = formData.partsTags.reduce((acc, t) => acc + (newMap[t] || 0), 0);
                                      const newTotal = newPartsTotal + (laborCost || 0);
                                      setFormData({ ...formData, estimatedCost: newTotal.toFixed(2) });
                                    }}
                                    className="w-full py-1 pl-5 pr-2 bg-zinc-50 border border-zinc-200 focus:border-indigo-600 focus:bg-white rounded-md text-xs font-mono font-bold text-right outline-none"
                                  />
                                </>
                              ) : (
                                <span className="font-mono font-bold text-xs text-zinc-900 bg-zinc-100 px-2 py-1 rounded">
                                  ${(Number(partsBudgetMap[tag]) || 0).toFixed(2)} USD
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Observación por repuesto si está re-presupuestando */}
                          {viewerRole === 'garante' && !isLocked && garanteProposalDecision === 'no_acepto' ? (
                            <div className="pt-1.5 border-t border-amber-200/60 flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-amber-900 flex items-center gap-1">
                                <Pencil className="w-2.5 h-2.5 text-amber-600" />
                                <span>Obs. Repuesto ({tag}):</span>
                              </label>
                              <input
                                type="text"
                                placeholder={`Justificación de ${tag}...`}
                                value={partsObservations[tag] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPartsObservations((prev) => ({ ...prev, [tag]: val }));
                                }}
                                className="w-full py-1 px-2 bg-amber-50/50 border border-amber-300 focus:border-amber-600 focus:bg-white rounded text-[11px] text-zinc-900 outline-none"
                              />
                            </div>
                          ) : partsObservations[tag] ? (
                            <div className="pt-1 border-t border-zinc-150 text-[10px] text-amber-900 bg-amber-50/60 p-1 rounded border border-amber-200/60">
                              <span className="font-bold">Obs:</span> {partsObservations[tag]}
                            </div>
                          ) : null}
                        </div>
                      ))}

                      {/* Botón para guardar el re-presupuesto de repuestos por parte del Garante */}
                      {viewerRole === 'garante' && !isLocked && garanteProposalDecision === 'no_acepto' && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleSaveGaranteParts}
                            className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Guardar Re-presupuesto y Observaciones</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-400 italic bg-white p-2.5 rounded-lg border border-zinc-200">
                      No hay repuestos desglosados para cotizar.
                    </p>
                  )}
                </div>

                {/* 2. Mano de Obra (Solo editable por taller / matriz) */}
                <div className="space-y-2 pt-2 border-t border-zinc-200/80">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                      2. Mano de Obra
                    </label>
                    <span className="text-[9px] text-zinc-400">
                      {canEditLabor ? 'Editable Matriz' : 'Dictaminado Taller'}
                    </span>
                  </div>

                  {canEditLabor ? (
                    <>
                      <div>
                        <span className="text-[10px] text-zinc-500 font-medium block mb-1">
                          Tiempo Estimado de Demora:
                        </span>
                        <div className="grid grid-cols-5 gap-1">
                          {QUICK_LABOR_TIMES.map((timeOption) => (
                            <button
                              key={timeOption}
                              type="button"
                              onClick={() => setLaborTime(timeOption)}
                              className={`py-1 text-[10px] font-bold rounded-md border text-center transition cursor-pointer ${
                                laborTime === timeOption
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                              }`}
                            >
                              {timeOption}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-zinc-700 font-bold">Valor Mano de Obra ($):</span>
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={laborCost}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setLaborCost(val);
                              const newTotal = partsTotal + val;
                              setFormData({ ...formData, estimatedCost: newTotal.toFixed(2) });
                            }}
                            className="w-full py-1.5 pl-6 pr-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono font-bold text-right outline-none focus:border-indigo-600"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Demora Estimada:</span>
                        <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold rounded-md">
                          {laborTime || '1 hora'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Costo Mano de Obra:</span>
                        <span className="font-mono font-bold text-zinc-900">
                          ${Number(laborCost || 0).toFixed(2)} USD
                        </span>
                      </div>
                      {viewerRole === 'garante' && !isLocked && (
                        <p className="text-[10px] text-zinc-400 italic">
                          Nota: La mano de obra es dictaminada por el taller autorizado.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Resumen y Total General */}
                <div className="pt-2 border-t border-zinc-200/80 flex items-center justify-between">
                  <span className="text-xs font-black text-zinc-900">Total Liquidación:</span>
                  {partsTotal + Number(laborCost || 0) > 0 ? (
                    <span className="text-sm font-black font-mono text-emerald-700">
                      ${(partsTotal + Number(laborCost || 0)).toFixed(2)} USD
                    </span>
                  ) : (
                    <span className="text-xs font-black uppercase text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-lg border border-amber-300">
                      Pendiente Matriz
                    </span>
                  )}
                </div>

                {/* Botones de Presupuesto en Matriz: Solo si está modificado */}
                {viewerRole === 'admin' && !isLocked && isBudgetModified && (
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 animate-slide-in">
                    <button
                      type="button"
                      onClick={handleCancelBudget}
                      className="flex-1 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBudget}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar Presupuesto</span>
                    </button>
                  </div>
                )}

                {/* BARRA DE DECISIÓN DEBAJO DE LA PROPUESTA: ACEPTO O NO ACEPTO (GARANTE MÓVIL) */}
                {viewerRole === 'garante' && !isLocked && (
                  <div className="pt-3 border-t border-zinc-200/80 space-y-3 animate-fade-in">
                    <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-purple-950">
                          ¿Acepta la propuesta económica?
                        </span>
                        <span className="text-[9px] font-bold text-purple-700 bg-white px-1.5 py-0.5 rounded border border-purple-200">
                          Marca
                        </span>
                      </div>
                      <p className="text-[10px] text-purple-800">
                        {garanteProposalDecision === 'acepto'
                          ? 'Se aceptan los repuestos de Matriz tal cual. Formalice el dictamen en la pestaña Dictamen.'
                          : 'Modo re-presupuesto: Modifique los precios y observaciones de repuestos arriba.'}
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setGaranteProposalDecision('acepto')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            garanteProposalDecision === 'acepto'
                              ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                              : 'bg-white text-zinc-700 border border-zinc-200'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Acepto</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setGaranteProposalDecision('no_acepto');
                            setFormData((prev) => ({ ...prev, resolutionType: 'encargar_taller' }));
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            garanteProposalDecision === 'no_acepto'
                              ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                              : 'bg-white text-zinc-700 border border-zinc-200'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>No Acepto</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. BLOQUE 4: INSPECCIÓN VISUAL DEL DAÑO (FOTOGRAFÍAS CON ZOOM)            */}
      {/* ========================================================================= */}
      {activeTab === 'dictamen' && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h4 className="text-xs sm:text-sm font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <span>
                Inspección Visual del Daño ({formData.diagnosticPhotos.filter(isValidMediaUrl).length} Evidencias Fotográficas)
              </span>
            </h4>
            <span className="text-[10px] text-zinc-400">Clic para ampliar</span>
          </div>

          {formData.diagnosticPhotos.filter(isValidMediaUrl).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {formData.diagnosticPhotos.filter(isValidMediaUrl).map((url, idx) => {
                const isVideo = isVideoUrl(url);
                return (
                  <div
                    key={idx}
                    onClick={() => setZoomImage(url)}
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
                          <div className="w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center shadow-lg border border-white/30 backdrop-blur-xs">
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
                          alt={`Evidencia ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center text-zinc-900 shadow-xs">
                            <ZoomIn className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </>
                    )}
                    <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-mono font-bold z-10">
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center bg-zinc-50/50">
              <Camera className="w-6 h-6 text-zinc-400 mb-1" />
              <span className="text-xs font-semibold text-zinc-600">Sin fotos adjuntas</span>
              <span className="text-[10px] text-zinc-400">Las evidencias fotográficas se adjuntan en el taller</span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. BLOQUE 5: DICTAMEN OFICIAL & ESTADO DE LA GARANTÍA                      */}
      {/* ========================================================================= */}
      {activeTab === 'dictamen' && (
        <div className="space-y-3 animate-fade-in">
          {/* CUADRO: DICTAMEN & OBSERVACIÓN OFICIAL DEL GARANTE DE MARCA (SI ACEPTADA O TIENE NOTAS) */}
          {(formData.status === 'aceptada' || formData.status === 'aprobada' || formData.status === 'validada_matriz' || formData.status === 'completada' || Boolean(formData.garanteNotes)) && (
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-2xl p-4 shadow-xs space-y-2.5 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-indigo-950">
                      Dictamen & Observación Oficial del Garante de Marca
                    </h4>
                    <p className="text-[10px] text-indigo-700 font-medium">
                      Instrucción técnica emitida para la liquidación de la garantía
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-zinc-600">Resolución:</span>
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs text-white ${
                      formData.resolutionType === 'encargar_taller' ? 'bg-indigo-600' : 'bg-emerald-600'
                    }`}
                  >
                    {formData.resolutionType === 'encargar_taller' ? (
                      <>
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Encargar al Taller</span>
                      </>
                    ) : (
                      <>
                        <Package className="w-3.5 h-3.5" />
                        <span>Envío de Repuesto</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-xs p-3.5 rounded-xl border border-indigo-200">
                <p className="text-xs sm:text-sm font-semibold text-zinc-900 leading-relaxed">
                  "{formData.garanteNotes || warranty.garanteNotes || 'Dictamen oficial favorable emitido por la Gerencia de Garantías de la Marca.'}"
                </p>
                <p className="text-[10px] text-zinc-400 font-mono mt-1 text-right">
                  {warranty.approvedAt || 'Hoy, Autorización Digital Garante de Marca'}
                </p>
              </div>

              <p className="text-[11px] text-indigo-900 font-medium bg-white/60 p-2.5 rounded-lg border border-indigo-100">
                {formData.resolutionType === 'encargar_taller'
                  ? 'ℹ️ El Taller Oficial y Matriz Central están autorizados para ejecutar el trabajo técnico y formalizar la liquidación de repuestos y mano de obra.'
                  : 'ℹ️ La Marca despachará los repuestos físicos requeridos directamente a la sede para su respectiva instalación sin costo.'}
              </p>
            </div>
          )}

          {/* CUADRO: DENEGACIÓN OFICIAL */}
          {(formData.status === 'denegada' || formData.status === 'rechazada' || Boolean(formData.rejectionReason)) && (
            <div className="p-4 rounded-2xl border-2 border-red-300 bg-red-50/90 text-red-900 space-y-2.5 shadow-2xs animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Garantía DENEGADA Oficialmente por la Marca</span>
              </div>
              {formData.rejectionReason && (
                <p className="text-xs leading-relaxed">
                  <strong>Motivo Oficial de Denegación:</strong> {formData.rejectionReason}
                </p>
              )}
              {formData.garanteNotes && (
                <p className="text-xs leading-relaxed text-red-800">
                  <strong>Observaciones del Garante:</strong> {formData.garanteNotes}
                </p>
              )}
              <p className="text-[10px] text-red-700 opacity-80 font-mono">
                {warranty.rejectedAt || 'Hoy, Dictamen Garante Oficial'}
              </p>
              {onCreateNewRequest && (
                <button
                  type="button"
                  onClick={onCreateNewRequest}
                  className="mt-2 w-full py-2 px-3 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Crear Nueva Solicitud de Garantía</span>
                </button>
              )}
            </div>
          )}

          {/* FORMULARIO PARA EMITIR DICTAMEN (SI ES GARANTE Y AÚN NO ESTÁ SELLADA) */}
          {viewerRole === 'garante' &&
            formData.status !== 'aceptada' &&
            formData.status !== 'aprobada' &&
            formData.status !== 'denegada' &&
            formData.status !== 'completada' && (
              <div className="bg-white p-4 rounded-2xl border-2 border-purple-200 shadow-2xs space-y-3.5 animate-fade-in">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 text-xs sm:text-sm font-black text-purple-950">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span>Emitir Dictamen Oficial de Marca</span>
                </div>

                {/* Selector de Modalidad */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Modalidad Dictaminada:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, resolutionType: 'encargar_taller' })}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        formData.resolutionType === 'encargar_taller'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200 font-bold'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Wrench className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="text-xs font-black">Encargar al taller</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-normal">
                        El taller ejecuta el trabajo y liquida repuestos/MO.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, resolutionType: 'envio_repuesto' })}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        formData.resolutionType === 'envio_repuesto'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200 font-bold'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-black">Envío de repuesto</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-normal">
                        Fábrica despacha repuestos sin costo.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Mensaje / Observaciones del Garante */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Mensaje / Directrices Técnicas del Garante <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.garanteNotes}
                    onChange={(e) => setFormData({ ...formData, garanteNotes: e.target.value })}
                    placeholder="Describa las directrices técnicas para Matriz y el Taller sobre la solicitud..."
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 focus:border-purple-600 focus:bg-white rounded-xl text-xs text-zinc-900 outline-none leading-relaxed"
                  />
                </div>

                {/* Denegación Opcional */}
                {showRejectBox ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 animate-fade-in">
                    <label className="block text-[11px] font-bold text-red-800">
                      Motivo Técnico de Denegación:
                    </label>
                    <textarea
                      rows={2}
                      value={rejectionInput}
                      onChange={(e) => setRejectionInput(e.target.value)}
                      placeholder="Ej: Falla ocasionada por falta de mantenimiento en concesionarios autorizados..."
                      className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg text-xs text-red-900 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRejectBox(false)}
                        className="flex-1 py-1.5 bg-white border border-zinc-300 text-zinc-700 rounded-lg text-xs font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleGaranteReject}
                        className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                      >
                        Confirmar Denegación
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(true)}
                      className="flex-1 py-2 border border-red-200 hover:bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Denegar Cobertura</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGaranteApprove}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aprobar Dictamen</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          {/* ESTADO EN REVISIÓN / EN PROCESO (PARA OTROS ROLES) */}
          {viewerRole !== 'garante' &&
            formData.status !== 'aceptada' &&
            formData.status !== 'aprobada' &&
            formData.status !== 'validada_matriz' &&
            formData.status !== 'denegada' &&
            formData.status !== 'rechazada' && (
              <>
                {statusInfo.canonical === 'en_revision' ? (
                  <div className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/80 text-amber-900 space-y-2 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                      <Clock className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                      <span>Garantía en REVISIÓN TÉCNICA por Matriz Central</span>
                    </div>
                    <p className="text-xs leading-relaxed">
                      {formData.matrizNotes
                        ? `Observaciones de Matriz: ${formData.matrizNotes}`
                        : 'La solicitud se encuentra en cola de verificación técnica antes de remitirse al Garante de la Marca.'}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border-2 border-blue-300 bg-blue-50/80 text-blue-900 space-y-2 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Garantía EN PROCESO (Auditoría Técnica Garante)</span>
                    </div>
                    <p className="text-xs leading-relaxed">
                      La solicitud fue validada y remitida al Garante Oficial de Marca para dictamen definitivo.
                    </p>
                  </div>
                )}
              </>
            )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. LIGHTBOX MODAL PARA VER IMAGEN EN PANTALLA COMPLETA                    */}
      {/* ========================================================================= */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-lg max-h-[85vh] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition z-20 text-xs font-bold"
            >
              ✕
            </button>
            {isVideoUrl(zoomImage) ? (
              <video
                src={zoomImage}
                controls
                autoPlay
                playsInline
                className="max-h-[80vh] w-auto max-w-full rounded-lg"
              />
            ) : (
              <img
                src={zoomImage}
                alt="Evidencia ampliada"
                className="max-h-[80vh] w-auto object-contain mx-auto"
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. FOOTER DE ACCIONES RÁPIDAS                                            */}
      {/* ========================================================================= */}
      <div className="pt-2 border-t border-zinc-200 w-full shrink-0">
        {isEditing ? (
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex-1 py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4 text-zinc-500" />
              <span>Cancelar</span>
            </button>
            <button
              type="button"
              onClick={handleSaveMobile}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            {/* Acción para Matriz si está en_revision */}
            {viewerRole === 'admin' && formData.status === 'en_revision' && (
              <>
                <button
                  type="button"
                  onClick={handleMatrizReject}
                  className="flex-1 py-2 px-2 bg-red-50 hover:bg-red-100 active:scale-95 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                  title="Denegar garantía"
                >
                  <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>Denegar</span>
                </button>

                <button
                  type="button"
                  onClick={handleMatrizDirectApprove}
                  className="flex-1 py-2 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                  title="Aprobar y aceptar la garantía en Matriz"
                >
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Aprobar</span>
                </button>

                {!isForMatriz && onValidateWarranty && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSave();
                      onValidateWarranty(warranty.id, formData.matrizNotes || 'Validado por Matriz.');
                      setFormData({ ...formData, status: 'validada_matriz' });
                      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
                    }}
                    className="flex-1 py-2 px-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    title="Remitir solicitud al Garante de la Marca"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>A Garante</span>
                  </button>
                )}
              </>
            )}

            {/* Acción para Garante si está pendiente */}
            {viewerRole === 'garante' &&
              formData.status !== 'aceptada' &&
              formData.status !== 'aprobada' &&
              formData.status !== 'denegada' &&
              formData.status !== 'completada' && (
                <button
                  type="button"
                  onClick={handleGaranteApprove}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aprobar Dictamen</span>
                </button>
              )}

            {/* Botón Nueva Solicitud si está denegada */}
            {isDenied && onCreateNewRequest && (
              <button
                type="button"
                onClick={onCreateNewRequest}
                className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Crear Nueva Solicitud</span>
              </button>
            )}

            {/* Si es taller o admin en otro estado y puede editar */}
            {viewerRole !== 'garante' &&
              !(viewerRole === 'admin' && formData.status === 'en_revision') &&
              !isDenied &&
              canAdminOrTallerEdit && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Editar Solicitud</span>
                </button>
              )}
          </div>
        )}
      </div>
      </div>

      {/* FICHA OFICIAL DE RECLAMO PARA IMPRESIÓN Y PDF */}
      <div className="hidden print:block w-full">
        <PrintableWarrantySheet
          warranty={{
            ...warranty,
            ...formData,
            motorcycleMileage: Number(formData.motorcycleMileage) || 0,
            estimatedCost: parseFloat(formData.estimatedCost) || warranty.estimatedCost || 0,
          }}
        />
      </div>
    </div>
  );
};
