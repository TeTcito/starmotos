// src/components/common/PrintableWarrantySheet.tsx
import React from 'react';
import {
  ShieldAlert,
  Bike,
  User,
  Wrench,
  Camera,
  FileCheck2,
  Calendar,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { WarrantyRequest } from '../../types/customer';
import { isVideoUrl } from '../mobile/common/NewWarrantyFormMobile';
import { getWarrantyStatusInfo } from './WarrantyModule';

interface Props {
  warranty: WarrantyRequest;
}

const PHOTO_GUIDE_LABELS = [
  'Foto 1: Vista General de la Moto',
  'Foto 2: Número de Serie / Chasis (VIN)',
  'Foto 3: Odómetro / Tacómetro (Km)',
  'Foto 4: Componente o Pieza Averiada',
  'Foto 5: Ángulo Complementario de Inspección',
  'Foto 6: Evidencia Técnica Adicional',
  'Foto 7: Evidencia Técnica Adicional',
  'Foto 8: Evidencia Técnica Adicional',
];

export const PrintableWarrantySheet: React.FC<Props> = ({ warranty }) => {
  const statusInfo = getWarrantyStatusInfo(warranty.status);

  // Filtrar exclusivamente imágenes válidas para el PDF impreso
  const photoImages = (warranty.diagnosticPhotos || []).filter(
    (url) => Boolean(url) && !isVideoUrl(url)
  );

  const videoCount = (warranty.diagnosticPhotos || []).filter(
    (url) => Boolean(url) && isVideoUrl(url)
  ).length;

  const partsList =
    warranty.partsTags && warranty.partsTags.length > 0
      ? warranty.partsTags
      : warranty.partsRequired
      ? warranty.partsRequired
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

  return (
    <div className="printable-warranty-sheet bg-white text-zinc-900 text-[11px] leading-tight font-sans max-w-4xl mx-auto p-6 sm:p-8 space-y-5">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO INSTITUCIONAL OFICIAL                                       */}
      {/* ========================================================================= */}
      <div className="border-b-2 border-zinc-900 pb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-zinc-950 uppercase">
                StarMotos
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-300">
                Red Oficial Ecuador
              </span>
            </div>
            <h1 className="text-xs font-bold text-zinc-600 uppercase tracking-wide">
              Expediente Oficial de Reclamo de Garantía de Fábrica
            </h1>
            <p className="text-[10px] text-zinc-500 font-medium">
              Gestión Técnica Centralizada • Matriz & Red Nacional de Talleres Autorizados
            </p>
          </div>
        </div>

        {/* Tarjeta de Control y Folio */}
        <div className="text-right border-l border-zinc-200 pl-4 space-y-0.5">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400 block">
            Folio / N° Solicitud
          </span>
          <span className="text-base font-black font-mono text-zinc-900 block">
            {warranty.requestNumber}
          </span>
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-zinc-600 font-medium pt-0.5">
            <Calendar className="w-3 h-3 text-zinc-400" />
            <span>Emitido: {warranty.createdAt}</span>
          </div>
          <div className="pt-1">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DATOS DE ORIGEN Y CANAL DE GESTIÓN                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-3 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <span className="text-[9px] uppercase font-bold text-zinc-400 block">
              Taller de Emisión
            </span>
            <span className="font-bold text-zinc-800 text-xs">
              {warranty.tallerOrigin || 'StarMotos Taller Oficial'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <div>
            <span className="text-[9px] uppercase font-bold text-zinc-400 block">
              Canal de Destino / Garante Responsable
            </span>
            <span className="font-bold text-zinc-800 text-xs">
              {warranty.targetBrand || warranty.garanteName || 'StarMotos Sede Matriz'}
              {warranty.destinationType === 'matriz' || warranty.targetBrand?.includes('Matriz')
                ? ' (Gestión Directa Matriz Central)'
                : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BLOQUE 1 Y 2: CLIENTE Y VEHÍCULO                                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-4">
        {/* Datos del Cliente */}
        <div className="border border-zinc-200 rounded-xl p-3.5 space-y-2 break-inside-avoid">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-100 font-bold text-zinc-800 text-xs uppercase tracking-wide">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>1. Datos del Propietario / Cliente</span>
          </div>
          <table className="w-full text-[10px]">
            <tbody>
              <tr className="border-b border-zinc-100/60">
                <td className="py-1 text-zinc-500 font-semibold w-28">Nombres Completos:</td>
                <td className="py-1 font-bold text-zinc-900">{warranty.clientName}</td>
              </tr>
              <tr className="border-b border-zinc-100/60">
                <td className="py-1 text-zinc-500 font-semibold">Cédula / RUC:</td>
                <td className="py-1 font-mono font-bold text-zinc-900">{warranty.clientIdNumber}</td>
              </tr>
              <tr className="border-b border-zinc-100/60">
                <td className="py-1 text-zinc-500 font-semibold">Teléfono / WhatsApp:</td>
                <td className="py-1 font-bold text-zinc-900">{warranty.clientPhone || 'No registrado'}</td>
              </tr>
              <tr>
                <td className="py-1 text-zinc-500 font-semibold">Tipo Cobertura:</td>
                <td className="py-1 font-bold text-zinc-900">
                  <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[9px] uppercase">
                    Garantía Oficial de Marca
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Ficha Técnica de la Motocicleta */}
        <div className="border border-zinc-200 rounded-xl p-3.5 space-y-2 break-inside-avoid">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-100 font-bold text-zinc-800 text-xs uppercase tracking-wide">
            <Bike className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Ficha Técnica del Vehículo</span>
          </div>
          <table className="w-full text-[10px]">
            <tbody>
              <tr className="border-b border-zinc-100/60">
                <td className="py-1 text-zinc-500 font-semibold w-28">Marca & Modelo:</td>
                <td className="py-1 font-bold text-zinc-900 uppercase">
                  {warranty.motorcycleBrand} {warranty.motorcycleModel}
                </td>
              </tr>
              <tr className="border-b border-zinc-100/60">
                <td className="py-1 text-zinc-500 font-semibold">Placa:</td>
                <td className="py-1 font-mono font-bold text-zinc-900 uppercase">
                  {warranty.motorcyclePlate || 'SIN PLACA'}
                </td>
              </tr>
              <tr className="border-b border-zinc-100/60">
                <td className="py-1 text-zinc-500 font-semibold">Chasis (VIN):</td>
                <td className="py-1 font-mono font-bold text-zinc-900 uppercase">
                  {warranty.motorcycleVin || 'S/N'}
                </td>
              </tr>
              <tr className="border-b border-zinc-100/60">
                <td className="py-1 text-zinc-500 font-semibold">N° Motor / RAMV:</td>
                <td className="py-1 font-mono text-zinc-800">
                  {warranty.motorNumber || 'S/N'} • {warranty.ramvNumber || 'S/N'}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-zinc-500 font-semibold">Kilometraje Odómetro:</td>
                <td className="py-1 font-bold text-blue-700 font-mono">
                  {Number(warranty.motorcycleMileage || 0).toLocaleString()} Km
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SÍNTOMAS REPORTADOS & DIAGNÓSTICO TÉCNICO                              */}
      {/* ========================================================================= */}
      <div className="border border-zinc-200 rounded-xl p-3.5 space-y-2.5 break-inside-avoid">
        <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-100 font-bold text-zinc-800 text-xs uppercase tracking-wide">
          <Wrench className="w-3.5 h-3.5 text-blue-600" />
          <span>3. Falla Reportada & Diagnóstico Técnico del Taller</span>
        </div>

        <div className="space-y-1.5">
          <span className="text-[9px] uppercase font-bold text-zinc-500 block">
            Descripción de la Falla / Reclamo del Cliente:
          </span>
          <p className="text-[11px] text-zinc-800 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 whitespace-pre-wrap font-medium">
            {warranty.issueDescription}
          </p>
        </div>

        {partsList.length > 0 && (
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-zinc-500 block">
              Componentes / Repuestos Involucrados:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {partsList.map((part, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-300 text-zinc-800 font-mono font-bold text-[10px]"
                >
                  • {part}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. VALIDACIÓN Y DICTAMEN DE MATRIZ / ALMACÉN                              */}
      {/* ========================================================================= */}
      {(warranty.matrizNotes || warranty.garanteNotes || warranty.rejectionReason) && (
        <div className="border border-zinc-200 rounded-xl p-3.5 space-y-2 break-inside-avoid bg-zinc-50/50">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-200 font-bold text-zinc-800 text-xs uppercase tracking-wide">
            <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>4. Dictamen y Observaciones de Matriz Central / Garante</span>
          </div>

          {warranty.matrizNotes && (
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                Dictamen Técnico Matriz Central:
              </span>
              <p className="text-[10px] text-zinc-800 font-medium bg-white p-2 rounded border border-zinc-200">
                {warranty.matrizNotes}
              </p>
            </div>
          )}

          {warranty.garanteNotes && (
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-purple-700 block">
                Dictamen de Fábrica / Garante de Marca:
              </span>
              <p className="text-[10px] text-zinc-800 font-medium bg-white p-2 rounded border border-purple-200">
                {warranty.garanteNotes}
              </p>
            </div>
          )}

          {warranty.rejectionReason && (
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-red-700 block">
                Motivo de Rechazo:
              </span>
              <p className="text-[10px] text-red-800 font-medium bg-red-50 p-2 rounded border border-red-200">
                {warranty.rejectionReason}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. REGISTRO FOTOGRÁFICO DE INSPECCIÓN TÉCNICA (IMÁGENES)                  */}
      {/* ========================================================================= */}
      <div className="space-y-2 pt-1 break-inside-avoid">
        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-900">
          <div className="flex items-center gap-2 font-black text-zinc-900 text-xs uppercase tracking-wide">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>
              5. Evidencias Fotográficas de Diagnóstico Técnico ({photoImages.length} Imágenes)
            </span>
          </div>
          <span className="text-[9px] font-bold text-zinc-500 uppercase">
            Inspección Visual Obligatoria
          </span>
        </div>

        {photoImages.length === 0 ? (
          <div className="p-4 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl text-center text-zinc-500 text-xs">
            No se adjuntaron fotografías en este expediente.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-1">
            {photoImages.map((photoUrl, idx) => (
              <div
                key={idx}
                className="border border-zinc-200 rounded-lg p-2 bg-zinc-50/50 space-y-1.5 break-inside-avoid"
              >
                <div className="flex items-center justify-between text-[9px] font-bold text-zinc-700">
                  <span>{PHOTO_GUIDE_LABELS[idx] || `Foto ${idx + 1}`}</span>
                  <span className="font-mono text-zinc-400">#{idx + 1}</span>
                </div>
                <div className="w-full h-44 rounded bg-white border border-zinc-200 overflow-hidden flex items-center justify-center">
                  <img
                    src={photoUrl}
                    alt={`Evidencia ${idx + 1}`}
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {videoCount > 0 && (
          <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center gap-2 text-[10px] text-amber-900">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>Constancia de Video:</strong> El expediente cuenta con {videoCount} video(s)
              técnico(s) de demostración funcional registrados en los servidores del sistema StarMotos.
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 7. CUADRO DE FIRMAS Y SELLOS AUTORIZADOS                                  */}
      {/* ========================================================================= */}
      <div className="pt-6 border-t-2 border-zinc-900 grid grid-cols-3 gap-6 break-inside-avoid">
        {/* Firma Cliente */}
        <div className="text-center space-y-8">
          <div className="h-14"></div>
          <div className="border-t border-zinc-400 pt-1 space-y-0.5">
            <span className="text-[10px] font-black uppercase text-zinc-900 block">
              Firma del Propietario / Cliente
            </span>
            <span className="text-[9px] text-zinc-600 block">C.I.: {warranty.clientIdNumber}</span>
            <span className="text-[8px] text-zinc-400 block font-medium">Recepción / Solicitud</span>
          </div>
        </div>

        {/* Firma Jefe de Taller */}
        <div className="text-center space-y-8">
          <div className="h-14"></div>
          <div className="border-t border-zinc-400 pt-1 space-y-0.5">
            <span className="text-[10px] font-black uppercase text-zinc-900 block">
              Jefe de Taller / Técnico Emisor
            </span>
            <span className="text-[9px] text-zinc-600 block">{warranty.tallerOrigin}</span>
            <span className="text-[8px] text-zinc-400 block font-medium">Diagnóstico Certificado</span>
          </div>
        </div>

        {/* Firma Matriz / Almacén */}
        <div className="text-center space-y-8">
          <div className="h-14"></div>
          <div className="border-t border-zinc-400 pt-1 space-y-0.5">
            <span className="text-[10px] font-black uppercase text-zinc-900 block">
              Validación Matriz / Almacén Central
            </span>
            <span className="text-[9px] text-zinc-600 block">StarMotos Matriz</span>
            <span className="text-[8px] text-zinc-400 block font-medium">Autorización Oficial</span>
          </div>
        </div>
      </div>

      {/* Pie de Página */}
      <div className="pt-3 border-t border-zinc-200 text-center text-[8px] text-zinc-400 uppercase tracking-widest font-mono">
        Documento técnico oficial emitido por el Sistema de Garantías StarMotos • Válido para trámite
        legal y comercial ante fábrica o importador • Fecha de impresión:{' '}
        {new Date().toLocaleDateString('es-EC')}
      </div>
    </div>
  );
};
