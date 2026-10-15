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
  'Foto 7: Evidencia de Peritaje Extra',
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
    <div className="printable-warranty-sheet bg-white text-zinc-950 text-[10px] leading-tight font-sans max-w-4xl mx-auto p-4 sm:p-5 space-y-2.5">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO INSTITUCIONAL OFICIAL                                       */}
      {/* ========================================================================= */}
      <div className="border-b-2 border-zinc-900 pb-1.5 flex items-start justify-between gap-4 break-inside-avoid">
        {/* Logo Oficial de StarMotos y Membrete debajo */}
        <div className="space-y-1">
          <img
            src="/logoheader.webp"
            alt="Logo StarMotos"
            className="h-8 sm:h-9 w-auto object-contain"
          />
          <div className="space-y-0.5">
            <h1 className="text-xs sm:text-[13px] font-black uppercase tracking-tight text-zinc-950">
              Expediente Oficial de Reclamo Garantía
            </h1>
            <p className="text-[9px] text-zinc-600 font-medium">
              Red Nacional de Talleres Autorizados & Sede Central StarMotos
            </p>
          </div>
        </div>

        {/* Folio y Fecha de Emisión en una sola línea cada uno */}
        <div className="text-right shrink-0 whitespace-nowrap space-y-0.5">
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-500 whitespace-nowrap">
              Folio / N° Solicitud:
            </span>
            <span className="text-sm font-black font-mono text-zinc-950 whitespace-nowrap">
              {warranty.requestNumber}
            </span>
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[9.5px] text-zinc-600 font-medium whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="whitespace-nowrap">Emitido: {warranty.createdAt}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BLOQUE 1 Y 2: DATOS DEL CLIENTE Y VEHÍCULO (SIN CONTENEDORES)          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-4 break-inside-avoid">
        {/* 1. Datos del Cliente & Sede */}
        <div className="space-y-1">
          <div className="flex items-end gap-1.5 pb-0.5 border-b-2 border-zinc-900">
            <User className="w-3.5 h-3.5 text-zinc-900 shrink-0 mb-0.5" />
            <span className="font-black text-[10.5px] uppercase tracking-wide text-zinc-950 inline-block mb-1.5 leading-none">
              1. Datos del Cliente & Sede
            </span>
          </div>
          <table className="w-full text-[9.5px]">
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-0.5 text-zinc-500 font-semibold w-32">Cédula o RUC:</td>
                <td className="py-0.5 font-mono font-bold text-zinc-950">{warranty.clientIdNumber}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-0.5 text-zinc-500 font-semibold">Nombre Completo:</td>
                <td className="py-0.5 font-bold text-zinc-950">{warranty.clientName}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-0.5 text-zinc-500 font-semibold">Teléfono de Contacto:</td>
                <td className="py-0.5 font-bold text-zinc-950">{warranty.clientPhone || 'No registrado'}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-0.5 text-zinc-500 font-semibold">Tipo de Cobertura:</td>
                <td className="py-0.5 font-bold text-zinc-900">
                  {warranty.warrantyType === 'plus_taller'
                    ? 'Garantía Plus StarMotos'
                    : warranty.warrantyType === 'gps'
                    ? 'Garantía Dispositivo GPS'
                    : 'Garantía Oficial de Marca'}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-0.5 text-zinc-500 font-semibold">Sede / Taller de Origen:</td>
                <td className="py-0.5 font-bold text-zinc-950">{warranty.tallerOrigin || 'StarMotos Taller Oficial'}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-0.5 text-zinc-500 font-semibold">Garantía de Marca:</td>
                <td className="py-0.5 font-bold text-zinc-950">
                  {warranty.targetBrand || warranty.garanteName || warranty.motorcycleBrand || 'StarMotos Matriz'}
                </td>
              </tr>
              {warranty.invoiceNumber && (
                <tr className="border-b border-zinc-200">
                  <td className="py-0.5 text-zinc-500 font-semibold">N° Factura / Ticket:</td>
                  <td className="py-0.5 font-mono font-bold text-zinc-900">{warranty.invoiceNumber}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 2. Motocicleta Registrada */}
        <div className="space-y-1">
          <div className="flex items-end gap-1.5 pb-0.5 border-b-2 border-zinc-900">
            <Bike className="w-3.5 h-3.5 text-zinc-900 shrink-0 mb-0.5" />
            <span className="font-black text-[10.5px] uppercase tracking-wide text-zinc-950 inline-block mb-1.5 leading-none">
              2. Motocicleta Registrada
            </span>
          </div>
          <table className="w-full text-[9.5px]">
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-0.5 text-zinc-500 font-semibold w-28">Marca & Modelo:</td>
                <td className="py-0.5 font-bold text-zinc-950 uppercase">
                  {warranty.motorcycleBrand} {warranty.motorcycleModel}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-0.5 text-zinc-500 font-semibold">Placa:</td>
                <td className="py-0.5 font-mono font-bold text-zinc-950 uppercase">
                  {warranty.motorcyclePlate || 'SIN PLACA'}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-0.5 text-zinc-500 font-semibold">Chasis (VIN):</td>
                <td className="py-0.5 font-mono font-bold text-zinc-950 uppercase">
                  {warranty.motorcycleVin || 'S/N'}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-0.5 text-zinc-500 font-semibold">N° Motor:</td>
                <td className="py-0.5 font-mono font-bold text-zinc-900 uppercase">
                  {warranty.motorNumber || 'S/N'}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-0.5 text-zinc-500 font-semibold">Código RAMV:</td>
                <td className="py-0.5 font-mono font-bold text-zinc-900 uppercase">
                  {warranty.ramvNumber || 'S/N'}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-0.5 text-zinc-500 font-semibold">Kilometraje:</td>
                <td className="py-0.5 font-mono font-bold text-blue-800">
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
      <div className="space-y-1.5 break-inside-avoid">
        <div className="flex items-end gap-1.5 pb-0.5 border-b-2 border-zinc-900">
          <Wrench className="w-3.5 h-3.5 text-zinc-900 shrink-0 mb-0.5" />
          <span className="font-black text-[10.5px] uppercase tracking-wide text-zinc-950 inline-block mb-1.5 leading-none">
            3. Reclamo Técnico & Movilidad
          </span>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div>
            <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">
              Descripción de la Falla / Reclamo del Cliente:
            </span>
            <p className="text-[10px] text-zinc-950 font-medium whitespace-pre-wrap leading-snug">
              {warranty.issueDescription}
            </p>
          </div>

          {partsList.length > 0 && (
            <div className="pt-2.5 mt-1 border-t border-zinc-200">
              <span className="text-[8.5px] uppercase font-bold text-zinc-500 block mb-2">
                Repuestos Requeridos / Componentes Involucrados:
              </span>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {partsList.map((part, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-zinc-100 border border-zinc-300 rounded-md text-zinc-900 font-bold text-[9.5px] shadow-2xs"
                    style={{
                      padding: '2px 10px',
                      lineHeight: '15px',
                    }}
                  >
                    {part.startsWith('•') ? part : `• ${part}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {warranty.resolutionType && (
            <div className="pt-1.5 border-t border-zinc-200 flex items-center gap-1.5">
              <span className="text-[8.5px] uppercase font-bold text-zinc-500">
                Modalidad Dictaminada:
              </span>
              <span className="font-bold text-zinc-900 text-[10px]">
                {warranty.resolutionType === 'encargar_taller'
                  ? 'Encargar al taller (Mano de obra y repuestos autorizados)'
                  : 'Envío de repuesto desde fábrica'}
              </span>
            </div>
          )}

          {(warranty.matrizNotes || warranty.garanteNotes) && (
            <div className="pt-1.5 border-t border-zinc-200 space-y-1.5">
              {warranty.matrizNotes && (
                <div>
                  <span className="text-[8.5px] uppercase font-bold text-zinc-500 block mb-0.5">
                    Observaciones Técnicas de Matriz:
                  </span>
                  <p className="text-[10px] text-zinc-900 font-medium leading-snug">
                    {warranty.matrizNotes}
                  </p>
                </div>
              )}
              {warranty.garanteNotes && (
                <div>
                  <span className="text-[8.5px] uppercase font-bold text-purple-700 block mb-0.5">
                    Observaciones de Garantía de Marca:
                  </span>
                  <p className="text-[10px] text-zinc-900 font-medium leading-snug">
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
      <div className="space-y-1.5 pt-1">
        <div className="flex items-end justify-between pb-0.5 border-b-2 border-zinc-900 break-inside-avoid">
          <div className="flex items-end gap-1.5">
            <Camera className="w-3.5 h-3.5 text-zinc-900 shrink-0 mb-0.5" />
            <span className="font-black text-zinc-900 text-[10.5px] uppercase tracking-wide leading-none inline-block mb-1.5">
              4. Evidencias Fotográficas de Diagnóstico Técnico ({photoImages.length} Imágenes)
            </span>
          </div>
          <span className="text-[8.5px] font-bold text-zinc-500 uppercase leading-none inline-block mb-1.5">
            Inspección Visual Obligatoria
          </span>
        </div>

        {photoImages.length === 0 ? (
          <div className="py-3 text-center text-zinc-500 text-xs italic">
            No se adjuntaron fotografías en este expediente.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
            {photoImages.map((photoUrl, idx) => (
              <div
                key={idx}
                className="break-inside-avoid printable-photo-card"
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
              >
                <div
                  className="flex items-center justify-between text-[9.5px] font-bold text-zinc-900"
                  style={{ position: 'relative', zIndex: 10, paddingBottom: '6px' }}
                >
                  <span className="pr-1">{PHOTO_GUIDE_LABELS[idx] || `Foto ${idx + 1}`}</span>
                  <span className="font-mono text-zinc-600 shrink-0 text-[9px]">#{idx + 1}</span>
                </div>
                <img
                  src={photoUrl}
                  alt={`Evidencia ${idx + 1}`}
                  loading="eager"
                  className="w-full h-[185px] object-cover rounded-md block"
                  style={{ marginTop: '4px' }}
                />
              </div>
            ))}
          </div>
        )}

        {videoCount > 0 && (
          <div className="p-1.5 bg-zinc-50 border border-zinc-200 rounded text-[9.5px] text-zinc-700 mt-1 break-inside-avoid">
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
