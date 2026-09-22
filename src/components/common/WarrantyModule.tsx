// src/components/common/WarrantyModule.tsx
import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WarrantyRequest, WarrantyRequestStatus, TallerClient } from '../../types/customer';
import { saveStoredWarranties, getStoredWarranties, saveStoredAlerts, getStoredAlerts } from '../../data/mockMultiRoleData';
import { compressImageBase64 } from '../../utils/imageCompressor';

// =========================================================================
// 1. HELPERS DE ESTADO Y CANONIZACIÓN
// =========================================================================

export type CanonicalWarrantyStatus = 'en_revision' | 'en_proceso' | 'aceptada' | 'denegada' | 'completada';

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
}

export const WarrantySquareCard: React.FC<WarrantySquareCardProps> = ({
  warranty,
  onClick,
  viewerRole = 'taller',
}) => {
  const statusInfo = getWarrantyStatusInfo(warranty.status);

  return (
    <div
      onClick={onClick}
      className="group bg-white border-2 border-zinc-200 hover:border-blue-500 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between h-[300px] select-none relative overflow-hidden active:scale-99"
    >
      {/* Barra superior de acento según estado */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          statusInfo.canonical === 'en_revision'
            ? 'bg-amber-500'
            : statusInfo.canonical === 'en_proceso'
            ? 'bg-blue-600'
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
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {warranty.requestNumber}
            </span>
            <span className="text-[10px] uppercase font-bold text-zinc-400">
              {warranty.warrantyType === 'marca'
                ? 'Oficial Marca'
                : warranty.warrantyType === 'plus_taller'
                ? 'Plus Taller'
                : 'GPS'}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}
          >
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Datos Principales (Cliente & Vehículo) */}
        <div className="mt-3 space-y-2">
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
                {warranty.motorcycleVin && ` • ${warranty.motorcycleVin.slice(-6)}`}
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
      <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Costo Reclamado</span>
          <span className="text-sm font-black font-mono text-zinc-900">
            ${(warranty.estimatedCost || 60).toFixed(2)} USD
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-blue-600 group-hover:underline">
            Ver Ficha
          </span>
          <div className="w-6 h-6 rounded-full bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
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
  onApproveByGarante?: (id: string, notes: string) => void;
  onRejectByGarante?: (id: string, reason: string) => void;
}

export const WarrantyFormView: React.FC<WarrantyFormViewProps> = ({
  warranty,
  onBack,
  viewerRole,
  onValidateByMatriz,
  onRejectByMatriz,
  onApproveByGarante,
  onRejectByGarante,
}) => {
  const statusInfo = getWarrantyStatusInfo(warranty.status);

  // Estados locales para notas de revisión
  const [matrizInputNotes, setMatrizInputNotes] = useState(
    warranty.matrizNotes || 'Inspección técnica de Matriz aprobada. Aplica cobertura de fábrica.'
  );
  const [garanteInputNotes, setGaranteInputNotes] = useState(
    warranty.garanteNotes || 'Dictamen oficial favorable emitido por la Gerencia de Garantías de la Marca.'
  );
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  const handleMatrizApprove = () => {
    if (onValidateByMatriz) {
      onValidateByMatriz(warranty.id, matrizInputNotes);
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
      onRejectByMatriz(warranty.id, rejectReasonInput);
      setToastMessage('✕ Solicitud rechazada por Matriz.');
    }
  };

  const handleGaranteApprove = () => {
    if (onApproveByGarante) {
      onApproveByGarante(warranty.id, garanteInputNotes);
      setToastMessage('✓ Garantía oficial ACEPTADA por la marca. Notificado a Matriz y Taller.');
      confetti({ particleCount: 80, spread: 70, colors: ['#10b981', '#2563eb', '#f59e0b'] });
    }
  };

  const handleGaranteReject = () => {
    if (!rejectReasonInput.trim()) {
      alert('Por favor ingrese la causa técnica del rechazo del Garante.');
      return;
    }
    if (onRejectByGarante) {
      onRejectByGarante(warranty.id, rejectReasonInput);
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
                Ficha Técnica de Garantía: <span className="font-mono text-blue-600">{warranty.requestNumber}</span>
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}
              >
                {statusInfo.icon}
                <span>{statusInfo.label}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Taller Emisor: <strong className="text-zinc-800">{warranty.tallerOrigin}</strong> • Fecha:{' '}
              <strong className="text-zinc-800">{warranty.createdAt}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </button>

          {warranty.clientPhone && (
            <a
              href={`https://wa.me/593${warranty.clientPhone.replace(/^0/, '')}?text=Hola%20${encodeURIComponent(
                warranty.clientName
              )},%20le%20escribimos%20de%20StarMotos%20sobre%20su%20solicitud%20de%20garantía%20${warranty.requestNumber}.`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Cliente</span>
            </a>
          )}
        </div>
      </div>

      {/* Línea de Tiempo de Trazabilidad (3 Pasos: Taller -> Matriz -> Garante) */}
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
                {warranty.tallerOrigin} reportó la falla técnica.
              </p>
            </div>
          </div>

          {/* Paso 2: Matriz */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
              statusInfo.canonical === 'en_proceso' || statusInfo.canonical === 'aceptada'
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                : statusInfo.canonical === 'en_revision'
                ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                : 'bg-zinc-50 border-zinc-200 text-zinc-500'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                statusInfo.canonical === 'en_proceso' || statusInfo.canonical === 'aceptada'
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
                  ? 'En revisión por el equipo técnico central.'
                  : 'Aceptada y despachada a la Marca.'}
              </p>
            </div>
          </div>

          {/* Paso 3: Garante Oficial */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
              statusInfo.canonical === 'aceptada'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
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
              <span className="font-bold block text-zinc-900">3. Dictamen Garante de Marca</span>
              <p className="text-xs text-zinc-600 mt-0.5">
                {statusInfo.canonical === 'aceptada'
                  ? '✓ Garantía Aceptada y Liquidada.'
                  : statusInfo.canonical === 'denegada'
                  ? '✕ Garantía Denegada.'
                  : 'En auditoría técnica oficial de marca.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULARIO ESTRUCTURADO EN 3 COLUMNAS SIMÉTRICAS */}
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
                value={warranty.clientIdNumber}
                className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold text-zinc-900 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Nombre Completo</label>
              <input
                type="text"
                readOnly
                value={warranty.clientName}
                className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Teléfono de Contacto</label>
              <input
                type="text"
                readOnly
                value={warranty.clientPhone || '0990000000'}
                className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono text-zinc-800 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Taller de Origen</label>
              <input
                type="text"
                readOnly
                value={warranty.tallerOrigin}
                className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-800 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Tipo de Póliza</label>
              <div className="h-11 sm:h-12 px-4 bg-blue-50 border border-blue-200 rounded-xl text-xs sm:text-sm font-bold text-blue-800 uppercase flex items-center">
                {warranty.warrantyType === 'marca'
                  ? 'Garantía Oficial de Marca'
                  : warranty.warrantyType === 'plus_taller'
                  ? 'Garantía Plus StarMotos'
                  : 'GPS Satelital'}
              </div>
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

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Marca y Modelo</label>
              <input
                type="text"
                readOnly
                value={`${warranty.motorcycleBrand} ${warranty.motorcycleModel}`}
                className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 cursor-not-allowed outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Placa</label>
                <input
                  type="text"
                  readOnly
                  value={warranty.motorcyclePlate || 'SIN PLACA'}
                  className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold text-zinc-800 cursor-not-allowed outline-none"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Kilometraje</label>
                <input
                  type="text"
                  readOnly
                  value={`${warranty.motorcycleMileage || 12500} km`}
                  className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono text-zinc-800 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">VIN / Chasis</label>
              <input
                type="text"
                readOnly
                value={warranty.motorcycleVin}
                className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono text-zinc-800 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">N° Factura / Ticket</label>
              <input
                type="text"
                readOnly
                value={warranty.invoiceNumber || 'TCK-2026-GAR'}
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
              <span>3. Reclamo Técnico & Costo</span>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Falla Reportada</label>
              <textarea
                rows={3}
                readOnly
                value={warranty.issueDescription}
                className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 cursor-not-allowed outline-none resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">
                Repuestos Comprometidos Requeridos
              </label>
              <input
                type="text"
                readOnly
                value={
                  warranty.partsRequired ||
                  'Kit de empaques, retenedores originales y sensor de presión Benelli'
                }
                className="w-full h-11 sm:h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Monto Estimado Reclamado</label>
              <div className="flex items-center gap-2 h-11 sm:h-12 px-4 bg-emerald-50 border border-emerald-200 rounded-xl text-base font-black font-mono text-emerald-800">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>${(warranty.estimatedCost || 60).toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EVIDENCIAS FOTOGRÁFICAS */}
      {warranty.diagnosticPhotos && warranty.diagnosticPhotos.length > 0 && (
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h4 className="text-sm sm:text-base font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <span>Inspección Visual del Daño ({warranty.diagnosticPhotos.length} Evidencias Fotográficas)</span>
            </h4>
            <span className="text-xs text-zinc-500 hidden sm:inline">Haga clic sobre una imagen para ampliarla</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
            {warranty.diagnosticPhotos.map((url, i) => (
              <div
                key={i}
                onClick={() => setPreviewZoomImage(url)}
                className="aspect-video rounded-xl overflow-hidden border border-zinc-200 block group relative shadow-2xs cursor-pointer bg-zinc-100"
              >
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
                <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 bg-black/60 text-white rounded text-[10px] font-mono font-bold">
                  #{i + 1}
                </span>
              </div>
            ))}
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
            className="relative max-w-4xl max-h-[90vh] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition z-10 text-sm font-bold"
            >
              ✕
            </button>
            <img
              src={previewZoomImage}
              alt="Evidencia ampliada"
              className="max-h-[85vh] w-auto object-contain mx-auto"
            />
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
        <div className="bg-purple-50/50 border-2 border-purple-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-purple-950 tracking-wider">
            <Building2 className="w-4 h-4 text-purple-700" />
            <span>Resolución Oficial del Garante de Marca</span>
          </div>

          <p className="text-xs text-zinc-600">
            Como Garante Oficial de Fábrica / Importador, revise el informe técnico remitido por Matriz.
            Estipule la resolución y dictamine <strong>Aceptar</strong> o <strong>Denegar</strong> la garantía.
          </p>

          {warranty.matrizNotes && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950">
              <span className="font-bold block mb-0.5">Informe Técnico de Matriz:</span>
              <p>{warranty.matrizNotes}</p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-zinc-700 mb-1">
              Notas de Resolución del Garante de Marca
            </label>
            <textarea
              rows={2}
              value={garanteInputNotes}
              onChange={(e) => setGaranteInputNotes(e.target.value)}
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

          <div className="flex items-center justify-end gap-3 pt-2">
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
              onClick={handleGaranteApprove}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Aceptar Garantía de Fábrica</span>
            </button>
          </div>
        </div>
      )}

      {/* RESOLUCIONES YA SELLADAS (SI YA FUE ACEPTADA O DENEGADA) */}
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
                ? 'Garantía ACEPTADA Oficialmente por la Marca'
                : 'Garantía DENEGADA'}
            </span>
          </div>
          {warranty.garanteNotes && (
            <p className="text-xs">
              <strong>Resolución Marca:</strong> {warranty.garanteNotes}
            </p>
          )}
          {warranty.rejectionReason && (
            <p className="text-xs">
              <strong>Motivo:</strong> {warranty.rejectionReason}
            </p>
          )}
          {warranty.approvedAt && (
            <p className="text-[11px] opacity-80">Fecha: {warranty.approvedAt}</p>
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
  defaultTallerOrigin = 'StarMotos Express Quevedo',
  defaultTallerOriginId = 'taller-quevedo',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    clientName: '',
    clientIdNumber: '',
    clientPhone: '',
    motorcycleBrand: 'Benelli',
    motorcycleModel: 'TRK 502X ABS',
    motorcyclePlate: '',
    motorcycleVin: '',
    motorcycleMileage: 12000,
    warrantyType: 'marca' as 'marca' | 'plus_taller' | 'gps',
    issueDescription: '',
    partsRequired: '',
    estimatedCost: 120,
    photos: [] as string[],
  });

  const [searchStatus, setSearchStatus] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  // Consulta y autocompletado de cliente por Cédula / RUC
  const handleConsultClient = () => {
    const term = formData.clientIdNumber.trim().toLowerCase();
    if (!term) {
      setSearchStatus({ type: 'warning', message: 'Ingrese una cédula o RUC para consultar' });
      return;
    }

    const found = clients.find(
      (c) =>
        c.idNumber?.toLowerCase() === term ||
        c.idNumber?.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term))
    );

    if (found) {
      setFormData((prev) => ({
        ...prev,
        clientName: found.fullName || prev.clientName,
        clientIdNumber: found.idNumber || prev.clientIdNumber,
        clientPhone: found.phone || prev.clientPhone,
        motorcycleBrand: found.motorcycleBrand || prev.motorcycleBrand,
        motorcycleModel: found.motorcycleModel || prev.motorcycleModel,
        motorcyclePlate: (found.motorcyclePlate || prev.motorcyclePlate).toUpperCase(),
      }));
      setSearchStatus({ type: 'success', message: `✓ Cliente cargado: ${found.fullName}` });
    } else {
      setSearchStatus({
        type: 'warning',
        message: 'No encontrado en registro. Puede ingresar los datos manualmente.',
      });
    }
  };

  // Carga de imágenes desde archivos locales (comprimidas)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const compressed = await compressImageBase64(file);
      if (compressed) {
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, compressed],
        }));
      }
    }
    e.target.value = '';
  };

  // Drag & drop de imágenes (comprimidas)
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const compressed = await compressImageBase64(file);
      if (compressed) {
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, compressed],
        }));
      }
    }
  };

  // Pegar imágenes con Ctrl + V (comprimidas)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const compressed = await compressImageBase64(file);
          if (compressed) {
            setFormData((prev) => ({
              ...prev,
              photos: [...prev.photos, compressed],
            }));
          }
        }
      }
    }
  };

  // Agregar imagen por URL
  const handleAddImageUrl = () => {
    if (!urlInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, urlInput.trim()],
    }));
    setUrlInput('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientName.trim() || !formData.clientIdNumber.trim() || !formData.issueDescription.trim()) {
      alert('Por favor complete los campos obligatorios del cliente y la falla.');
      return;
    }

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
      motorcyclePlate: formData.motorcyclePlate.trim().toUpperCase(),
      motorcycleVin: formData.motorcycleVin.trim().toUpperCase() || `VIN-${Date.now()}`,
      motorcycleMileage: Number(formData.motorcycleMileage) || 0,
      warrantyType: formData.warrantyType,
      issueDescription: formData.issueDescription.trim(),
      partsRequired: formData.partsRequired.trim(),
      diagnosticPhotos:
        formData.photos.length > 0
          ? formData.photos
          : [
              'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
            ],
      status: 'en_revision', // Nace En Revisión para Matriz
      tallerOrigin: defaultTallerOrigin,
      tallerOriginId: defaultTallerOriginId,
      estimatedCost: Number(formData.estimatedCost) || 50,
      invoiceNumber: `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    onSubmit(newReq);
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      onPaste={handlePaste}
      className="w-full space-y-6 animate-slide-in"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
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

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">
                Tipo de Cobertura / Póliza <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.warrantyType}
                onChange={(e) => setFormData({ ...formData, warrantyType: e.target.value as any })}
                className="w-full h-11 sm:h-12 px-4 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-bold text-zinc-900 transition-all outline-none cursor-pointer"
              >
                <option value="marca">Garantía Oficial de Marca (Fábrica)</option>
                <option value="plus_taller">Garantía Plus StarMotos</option>
                <option value="gps">Garantía Dispositivo GPS Satelital</option>
              </select>
            </div>
          </div>
        </div>

        {/* Columna 2: Vehículo */}
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
                  value={formData.motorcycleBrand}
                  onChange={(e) => setFormData({ ...formData, motorcycleBrand: e.target.value })}
                  placeholder="Ej: Benelli"
                  className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-bold text-zinc-900 transition-all outline-none"
                />
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
                  placeholder="Ej: TRK 502X"
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
                  placeholder="PBX-8492"
                  className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-mono font-bold text-zinc-900 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Kilometraje Actual</label>
                <input
                  type="number"
                  value={formData.motorcycleMileage}
                  onChange={(e) => setFormData({ ...formData, motorcycleMileage: Number(e.target.value) })}
                  placeholder="12000"
                  className="w-full h-11 sm:h-12 px-3.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-mono text-zinc-900 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">Número de Chasis / VIN</label>
              <input
                type="text"
                value={formData.motorcycleVin}
                onChange={(e) => setFormData({ ...formData, motorcycleVin: e.target.value.toUpperCase() })}
                placeholder="LBBP57008PA..."
                className="w-full h-11 sm:h-12 px-4 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-mono text-zinc-900 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Columna 3: Reclamo Técnico & Presupuesto */}
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
                Repuestos Requeridos para Cambio
              </label>
              <input
                type="text"
                value={formData.partsRequired}
                onChange={(e) => setFormData({ ...formData, partsRequired: e.target.value })}
                placeholder="Ej: Sensor TPS Benelli, retenedores horquilla"
                className="w-full h-11 sm:h-12 px-4 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm text-zinc-900 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 mb-1.5">
                Costo Estimado Reclamado ($ USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
                  className="w-full h-11 sm:h-12 pl-8 pr-4 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-mono font-bold text-emerald-800 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evidencias e Imágenes de la Garantía (1/3 o 1/4 controles a la izq, 2/3 galería fotos a la der) */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-zinc-900">
                Evidencias Fotográficas e Inspección Visual
              </h3>
              <p className="text-xs text-zinc-500">
                Adjunte fotos del daño, número de chasis, tacómetro y piezas averiadas.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold">
            {formData.photos.length} imagen{formData.photos.length === 1 ? '' : 'es'} adjunta{formData.photos.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Estructura dividida: 1/3 panel de carga a la izquierda, 2/3 fotos a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Panel Izquierdo: Cuadro de Subida (4 cols de 12 ~ 33%) */}
          <div className="lg:col-span-4 space-y-3">
            {/* Zona Drag & Drop / Seleccionar */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/80 scale-[1.01]'
                  : 'border-zinc-300 hover:border-blue-400 bg-zinc-50/50 hover:bg-blue-50/20'
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-zinc-800">
                Arrastra imágenes aquí o <span className="text-blue-600 underline">haz clic</span>
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                JPG, PNG, WEBP o pega con <kbd className="px-1.5 py-0.5 bg-zinc-200 text-zinc-800 rounded font-mono text-[10px]">Ctrl+V</kbd>
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-3 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir desde Computador</span>
              </button>
            </div>

            {/* Input para agregar imagen por URL directa */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  placeholder="Pegar URL de imagen directa..."
                  className="w-full h-10 pl-8 pr-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 h-10 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 rounded-xl text-xs font-bold cursor-pointer transition shrink-0"
              >
                + URL
              </button>
            </div>
          </div>

          {/* Panel Derecho: Galería de Imágenes de Evidencia (8 cols de 12 ~ 67%) */}
          <div className="lg:col-span-8 bg-zinc-50/60 rounded-2xl border border-zinc-200/80 p-4 min-h-[220px]">
            {formData.photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mb-2">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-zinc-700">
                  No hay imágenes adjuntadas
                </p>
                <p className="text-xs text-zinc-400 max-w-sm mt-1">
                  Las fotos que suba el jefe de taller como evidencia del reclamo se mostrarán aquí.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {formData.photos.map((p, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-video rounded-xl overflow-hidden border border-zinc-200 bg-white shadow-2xs"
                  >
                    <img
                      src={p}
                      alt={`Evidencia ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewZoomImage(p);
                        }}
                        className="w-8 h-8 bg-white/90 hover:bg-white text-zinc-800 rounded-lg flex items-center justify-center cursor-pointer transition shadow-xs"
                        title="Ampliar foto"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData((prev) => ({
                            ...prev,
                            photos: prev.photos.filter((_, i) => i !== idx),
                          }));
                        }}
                        className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center cursor-pointer transition shadow-xs"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 bg-black/60 text-white rounded text-[10px] font-mono font-bold pointer-events-none">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition z-10 text-sm font-bold"
            >
              ✕
            </button>
            <img
              src={previewZoomImage}
              alt="Evidencia ampliada"
              className="max-h-[85vh] w-auto object-contain mx-auto"
            />
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
