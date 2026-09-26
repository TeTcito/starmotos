// src/components/common/AbonoTransferenciaModal.tsx
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { MaintenanceRecord, ClientProfile, MotorcycleClientData } from '../../types/customer';
import { ModalPortal } from './ModalPortal';
import { compressImageBase64 } from '../../utils/imageCompressor';
import { isValidMediaUrl } from '../../services/mediaStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: MaintenanceRecord[];
  profile: ClientProfile;
  motorcycle: MotorcycleClientData;
  onSubmitAbono?: (data: {
    alistamientoId?: string;
    monto: number;
    comprobanteUrl: string;
    bancoOrigen?: string;
    numeroComprobante?: string;
    notas?: string;
  }) => Promise<boolean>;
}

export const AbonoTransferenciaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  history,
  profile,
  motorcycle,
  onSubmitAbono,
}) => {
  // Encontrar órdenes con saldo pendiente
  const pendingRecords = history.filter((h) => (h.saldoPendiente || 0) > 0.01);
  const totalPending = history.reduce((sum, h) => sum + (h.saldoPendiente || 0), 0);

  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [monto, setMonto] = useState<string>('');
  const [bancoOrigen, setBancoOrigen] = useState<string>('Banco Pichincha');
  const [numeroComprobante, setNumeroComprobante] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [evidenciaUrl, setEvidenciaUrl] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Inicializar servicio seleccionado y monto sugerido
  useEffect(() => {
    if (isOpen) {
      if (pendingRecords.length > 0) {
        const first = pendingRecords[0];
        setSelectedRecordId(first.alistamientoId || first.id);
        setMonto(String((first.saldoPendiente || 0).toFixed(2)));
      } else if (history.length > 0) {
        setSelectedRecordId(history[0].alistamientoId || history[0].id);
        setMonto('');
      } else {
        setSelectedRecordId('');
        setMonto('');
      }
      setErrorMessage('');
      setEvidenciaUrl('');
      setNumeroComprobante('');
      setNotas('');
    }
  }, [isOpen, history]);

  // Obtener registro seleccionado
  const selectedRecord = history.find(
    (h) => (h.alistamientoId || h.id) === selectedRecordId || h.id === selectedRecordId
  );
  const maxMonto = selectedRecord?.saldoPendiente !== undefined ? selectedRecord.saldoPendiente : totalPending;

  const handleRecordChange = (recId: string) => {
    setSelectedRecordId(recId);
    const rec = history.find((h) => (h.alistamientoId || h.id) === recId || h.id === recId);
    if (rec && rec.saldoPendiente && rec.saldoPendiente > 0) {
      setMonto(String(rec.saldoPendiente.toFixed(2)));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setErrorMessage('');
      const compressed = await compressImageBase64(file, 1200, 1200, 0.78);
      setEvidenciaUrl(compressed);
    } catch (err) {
      console.error('Error comprimiendo evidencia:', err);
      setErrorMessage('No se pudo procesar la imagen del comprobante. Intenta con otra foto.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const numericMonto = parseFloat(monto);
    if (isNaN(numericMonto) || numericMonto <= 0) {
      setErrorMessage('Por favor ingresa un monto válido mayor a $0.00');
      return;
    }

    if (!evidenciaUrl) {
      setErrorMessage('Es obligatorio adjuntar la foto o captura del comprobante de transferencia bancaria.');
      return;
    }

    if (!onSubmitAbono) {
      setErrorMessage('Servicio de abonos no disponible en este momento.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onSubmitAbono({
        alistamientoId: selectedRecord?.alistamientoId || selectedRecordId || undefined,
        monto: numericMonto,
        comprobanteUrl: evidenciaUrl,
        bancoOrigen,
        numeroComprobante,
        notas,
      });

      if (ok) {
        onClose();
      } else {
        setErrorMessage('No se pudo enviar el comprobante. Intenta de nuevo.');
      }
    } catch (err) {
      setErrorMessage('Error al enviar el comprobante de abono.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-zinc-200">
        {/* Encabezado */}
        <div className="p-5 bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shrink-0">
              <DollarSign className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Abonar por Transferencia Bancaria
              </h3>
              <p className="text-xs text-purple-200">
                Registra tu abono con evidencia fotográfica directa para validación del taller
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition"
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Selección de Orden / Servicio */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-800 block text-xs">
              Servicio u Orden a Abonar:
            </label>
            {pendingRecords.length > 0 ? (
              <select
                value={selectedRecordId}
                onChange={(e) => handleRecordChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl font-medium text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {pendingRecords.map((rec) => (
                  <option key={rec.id} value={rec.alistamientoId || rec.id}>
                    {rec.otNumber} ({rec.date}) • Saldo Pendiente: ${Number(rec.saldoPendiente || 0).toFixed(2)} USD
                  </option>
                ))}
              </select>
            ) : history.length > 0 ? (
              <select
                value={selectedRecordId}
                onChange={(e) => handleRecordChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl font-medium text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {history.map((rec) => (
                  <option key={rec.id} value={rec.alistamientoId || rec.id}>
                    {rec.otNumber} ({rec.date}) • {rec.workSummary[0]}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 bg-zinc-100 rounded-xl text-zinc-600 text-xs">
                Abono anticipado vinculado a tu cuenta ({profile.fullName} • Moto {motorcycle.plate})
              </div>
            )}
          </div>

          {/* Monto a Abonar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-zinc-800 text-xs">
                Monto a Abonar (USD) *
              </label>
              {maxMonto > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMonto(String((maxMonto / 2).toFixed(2)))}
                    className="text-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-md font-semibold cursor-pointer"
                  >
                    50% (${(maxMonto / 2).toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonto(String(maxMonto.toFixed(2)))}
                    className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-800 px-2 py-0.5 rounded-md font-bold cursor-pointer"
                  >
                    Total (${maxMonto.toFixed(2)})
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl font-mono text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Banco Origen y Referencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-zinc-700 text-[11px]">Banco Emisor:</label>
              <select
                value={bancoOrigen}
                onChange={(e) => setBancoOrigen(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Banco Pichincha">Banco Pichincha / Deuna</option>
                <option value="Banco Guayaquil">Banco Guayaquil</option>
                <option value="Produbanco">Produbanco</option>
                <option value="Banco del Pacífico">Banco del Pacífico</option>
                <option value="Banco Bolivariano">Banco Bolivariano</option>
                <option value="Banco Internacional">Banco Internacional</option>
                <option value="Cooperativa JEP">Cooperativa JEP</option>
                <option value="Cooperativa Policía Nacional">Coop. Policía Nacional</option>
                <option value="Otro Banco / Cooperativa">Otro Banco o Cooperativa</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-zinc-700 text-[11px]">Nº Comprobante / Referencia:</label>
              <input
                type="text"
                value={numeroComprobante}
                onChange={(e) => setNumeroComprobante(e.target.value)}
                placeholder="Ej. 98471203"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono text-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Subida de Evidencia Fotográfica (Obligatorio) */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-800 text-xs flex items-center justify-between">
              <span>Evidencia de la Transferencia (Foto o Captura) *</span>
              {evidenciaUrl && (
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Comprobante cargado
                </span>
              )}
            </label>

            {evidenciaUrl && isValidMediaUrl(evidenciaUrl) ? (
              <div className="relative rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 p-2.5 flex items-center gap-3">
                <img
                  src={evidenciaUrl}
                  alt="Comprobante"
                  className="w-16 h-16 object-cover rounded-xl border border-emerald-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-900 text-xs truncate">Comprobante de Transferencia</p>
                  <p className="text-[10px] text-emerald-700">Listo para validar por el taller</p>
                  <button
                    type="button"
                    onClick={() => setEvidenciaUrl('')}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-bold mt-1 cursor-pointer"
                  >
                    Cambiar imagen
                  </button>
                </div>
              </div>
            ) : (
              <label className="relative flex flex-col items-center justify-center p-5 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-2xl bg-purple-50/40 hover:bg-purple-50/80 transition cursor-pointer text-center group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
                {isCompressing ? (
                  <div className="flex flex-col items-center gap-1.5 text-purple-700">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-semibold">Procesando y optimizando imagen...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-zinc-800">
                      Sube la captura de la transferencia
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      JPG, PNG o WEBP de tu comprobante bancario
                    </span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Notas adicionales */}
          <div className="space-y-1">
            <label className="font-bold text-zinc-700 text-[11px]">Notas o Comentarios (Opcional):</label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Transferencia realizada desde cuenta de tercero"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold text-xs cursor-pointer transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing || !evidenciaUrl}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs cursor-pointer shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enviar Comprobante</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};
