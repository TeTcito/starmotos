// src/components/common/PrintableWarrantySheet.tsx
import React from 'react';
import {
  Bike,
  User,
  Wrench,
  Camera,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { WarrantyRequest } from '../../types/customer';
import { isVideoUrl } from '../mobile/common/NewWarrantyFormMobile';
import { isValidMediaUrl } from '../../services/mediaStorage';

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
  // Filtrar exclusivamente imágenes válidas para el PDF impreso
  const photoImages = (warranty.diagnosticPhotos || []).filter(
    (url) => isValidMediaUrl(url) && !isVideoUrl(url)
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
    <div className="printable-warranty-sheet bg-white text-zinc-950 text-[11px] leading-tight font-sans max-w-4xl mx-auto p-6 sm:p-8 space-y-6">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO INSTITUCIONAL OFICIAL                                       */}
      {/* ========================================================================= */}
      <div className="border-b-2 border-zinc-900 pb-3 flex items-start justify-between gap-6">
        {/* Logo Oficial de StarMotos y Membrete debajo */}
        <div className="space-y-2">
          <img
            src="/logoheader.webp"
            alt="Logo StarMotos"
            className="h-10 sm:h-11 w-auto object-contain"
          />
          <div className="space-y-0.5">
            <h1 className="text-xs sm:text-sm font-black uppercase tracking-tight text-zinc-950">
              Expediente Oficial de Reclamo Garantía
            </h1>
            <p className="text-[10px] text-zinc-600 font-medium">
              Red Nacional de Talleres Autorizados & Sede Central StarMotos
            </p>
          </div>
        </div>

        {/* Folio y Fecha de Emisión en una sola línea cada uno */}
        <div className="text-right shrink-0 whitespace-nowrap space-y-1">
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 whitespace-nowrap">
              Folio / N° Solicitud:
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-zinc-950 whitespace-nowrap">
              {warranty.requestNumber}
            </span>
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[10.5px] text-zinc-600 font-medium whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="whitespace-nowrap">Emitido: {warranty.createdAt}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BLOQUE 1 Y 2: DATOS DEL CLIENTE Y VEHÍCULO (SIN CONTENEDORES)          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-8 break-inside-avoid">
        {/* 1. Datos del Cliente & Sede */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 pb-1 border-b-2 border-zinc-900 font-black text-xs uppercase tracking-wide text-zinc-950">
            <User className="w-3.5 h-3.5 text-zinc-900" />
            <span>1. Datos del Cliente & Sede</span>
          </div>
          <table className="w-full text-[10.5px]">
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold w-36">Cédula o RUC:</td>
                <td className="py-1 font-mono font-bold text-zinc-950">{warranty.clientIdNumber}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Nombre Completo:</td>
                <td className="py-1 font-bold text-zinc-950">{warranty.clientName}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Teléfono de Contacto:</td>
                <td className="py-1 font-bold text-zinc-950">{warranty.clientPhone || 'No registrado'}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Tipo de Cobertura:</td>
                <td className="py-1 font-bold text-zinc-900">
                  {warranty.warrantyType === 'plus_taller'
                    ? 'Garantía Plus StarMotos'
                    : warranty.warrantyType === 'gps'
                    ? 'Garantía Dispositivo GPS'
                    : 'Garantía Oficial de Marca'}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Sede / Taller de Origen:</td>
                <td className="py-1 font-bold text-zinc-950">{warranty.tallerOrigin || 'StarMotos Taller Oficial'}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Marca / Garante:</td>
                <td className="py-1 font-bold text-zinc-950">
                  {warranty.targetBrand || warranty.garanteName || warranty.motorcycleBrand || 'StarMotos Matriz'}
                </td>
              </tr>
              {warranty.invoiceNumber && (
                <tr className="border-b border-zinc-200">
                  <td className="py-1 text-zinc-500 font-semibold">N° Factura / Ticket:</td>
                  <td className="py-1 font-mono font-bold text-zinc-900">{warranty.invoiceNumber}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 2. Motocicleta Registrada */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 pb-1 border-b-2 border-zinc-900 font-black text-xs uppercase tracking-wide text-zinc-950">
            <Bike className="w-3.5 h-3.5 text-zinc-900" />
            <span>2. Motocicleta Registrada</span>
          </div>
          <table className="w-full text-[10.5px]">
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold w-32">Marca & Modelo:</td>
                <td className="py-1 font-bold text-zinc-950 uppercase">
                  {warranty.motorcycleBrand} {warranty.motorcycleModel}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Placa:</td>
                <td className="py-1 font-mono font-bold text-zinc-950 uppercase">
                  {warranty.motorcyclePlate || 'SIN PLACA'}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Chasis (VIN):</td>
                <td className="py-1 font-mono font-bold text-zinc-950 uppercase">
                  {warranty.motorcycleVin || 'S/N'}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">N° Motor:</td>
                <td className="py-1 font-mono font-bold text-zinc-900 uppercase">
                  {warranty.motorNumber || 'S/N'}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Código RAMV:</td>
                <td className="py-1 font-mono font-bold text-zinc-900 uppercase">
                  {warranty.ramvNumber || 'S/N'}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Kilometraje Odómetro:</td>
                <td className="py-1 font-mono font-bold text-blue-800">
                  {warranty.motorcycleMileage !== undefined ? `${Number(warranty.motorcycleMileage).toLocaleString()} Km` : '0 Km'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RECLAMO TÉCNICO & MOVILIDAD (SIN CONTENEDORES)                          */}
      {/* ========================================================================= */}
      <div className="space-y-2 break-inside-avoid">
        <div className="flex items-center gap-1.5 pb-1 border-b-2 border-zinc-900 font-black text-xs uppercase tracking-wide text-zinc-950">
          <Wrench className="w-3.5 h-3.5 text-zinc-900" />
          <span>3. Reclamo Técnico & Movilidad</span>
        </div>

        <div className="space-y-2.5 pt-1">
          <div>
            <span className="text-[9.5px] uppercase font-bold text-zinc-500 block">
              Descripción de la Falla / Reclamo del Cliente:
            </span>
            <p className="text-[11px] text-zinc-950 font-medium whitespace-pre-wrap pt-0.5 leading-relaxed">
              {warranty.issueDescription}
            </p>
          </div>

          {partsList.length > 0 && (
            <div className="pt-1 border-t border-zinc-200">
              <span className="text-[9.5px] uppercase font-bold text-zinc-500 block">
                Repuestos Requeridos / Componentes Involucrados:
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {partsList.map((part, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-300 text-zinc-900 font-mono font-bold text-[10px]"
                  >
                    • {part}
                  </span>
                ))}
              </div>
            </div>
          )}

          {warranty.resolutionType && (
            <div className="pt-1 border-t border-zinc-200 flex items-center gap-2">
              <span className="text-[9.5px] uppercase font-bold text-zinc-500">
                Modalidad Dictaminada:
              </span>
              <span className="font-bold text-zinc-900 text-[11px]">
                {warranty.resolutionType === 'encargar_taller'
                  ? 'Encargar al taller (Mano de obra y repuestos autorizados)'
                  : 'Envío de repuesto desde fábrica'}
              </span>
            </div>
          )}

          {(warranty.matrizNotes || warranty.garanteNotes) && (
            <div className="pt-2 border-t border-zinc-200 space-y-1.5">
              {warranty.matrizNotes && (
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-zinc-500 block">
                    Observaciones Técnicas de Matriz:
                  </span>
                  <p className="text-[10.5px] text-zinc-900 font-medium pt-0.5">
                    {warranty.matrizNotes}
                  </p>
                </div>
              )}
              {warranty.garanteNotes && (
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-purple-700 block">
                    Observaciones de Garante de Marca:
                  </span>
                  <p className="text-[10.5px] text-zinc-900 font-medium pt-0.5">
                    {warranty.garanteNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. REGISTRO FOTOGRÁFICO DE INSPECCIÓN TÉCNICA (IMÁGENES)                  */}
      {/* ========================================================================= */}
      <div className="space-y-2 pt-2 break-inside-avoid">
        <div className="flex items-center justify-between pb-1 border-b-2 border-zinc-900">
          <div className="flex items-center gap-2 font-black text-zinc-900 text-xs uppercase tracking-wide">
            <Camera className="w-4 h-4 text-zinc-900" />
            <span>
              4. Evidencias Fotográficas de Diagnóstico Técnico ({photoImages.length} Imágenes)
            </span>
          </div>
          <span className="text-[9px] font-bold text-zinc-500 uppercase">
            Inspección Visual Obligatoria
          </span>
        </div>

        {photoImages.length === 0 ? (
          <div className="py-4 text-center text-zinc-500 text-xs italic">
            No se adjuntaron fotografías en este expediente.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pt-2">
            {photoImages.map((photoUrl, idx) => (
              <div
                key={idx}
                className="border border-zinc-300 rounded p-1.5 space-y-1 break-inside-avoid"
              >
                <div className="flex items-center justify-between text-[9px] font-bold text-zinc-700">
                  <span>{PHOTO_GUIDE_LABELS[idx] || `Foto ${idx + 1}`}</span>
                  <span className="font-mono text-zinc-400">#{idx + 1}</span>
                </div>
                <div className="w-full h-48 bg-zinc-50 overflow-hidden flex items-center justify-center">
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
          <div className="p-2 bg-zinc-50 border border-zinc-200 rounded text-[10px] text-zinc-700 mt-2">
            <strong>Constancia de Video:</strong> El expediente cuenta con {videoCount} video(s)
            técnico(s) de demostración registrados en la plataforma digital.
          </div>
        )}
      </div>

      {/* Pie de Página */}
      <div className="pt-4 border-t border-zinc-200 text-center text-[8.5px] text-zinc-400 uppercase tracking-widest font-mono break-inside-avoid">
        Documento técnico oficial emitido por el Sistema de Garantías StarMotos • Válido para trámite
        legal y comercial ante fábrica o importador • Fecha de impresión:{' '}
        {new Date().toLocaleDateString('es-EC')}
      </div>
    </div>
  );
};
