// src/components/common/WarrantySubmittedSuccessModal.tsx
import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  User,
  Bike,
  Building2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WarrantyRequest } from '../../types/customer';
import { ModalPortal } from './ModalPortal';
import {
  suppressPendingWarrantiesAlert,
  releasePendingWarrantiesAlert,
} from './PendingWarrantiesAlertModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  warranty: WarrantyRequest | null;
  onViewDetail?: (w: WarrantyRequest) => void;
}

export const WarrantySubmittedSuccessModal: React.FC<Props> = ({
  isOpen,
  onClose,
  warranty,
  onViewDetail,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Suprimir temporalmente la alerta de pendientes mientras la ventana de éxito esté visible
      suppressPendingWarrantiesAlert(60000);

      // Lanzar confeti celebratorio al mismo tiempo que se abre la ventana
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899'],
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 60,
          origin: { x: 0.05, y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#6366f1'],
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 60,
          origin: { x: 0.95, y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#ec4899'],
        });
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !warranty) return null;

  const handleCopyCode = () => {
    if (warranty.requestNumber) {
      navigator.clipboard.writeText(warranty.requestNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    // Liberar la supresión de la alerta de pendientes para que se evalúe a continuación
    releasePendingWarrantiesAlert();
    onClose();
  };

  const handleDetail = () => {
    releasePendingWarrantiesAlert();
    if (onViewDetail) {
      onViewDetail(warranty);
    } else {
      onClose();
    }
  };

  const targetDestination =
    warranty.destinationType === 'matriz'
      ? 'StarMotos Matriz Central'
      : warranty.targetBrand || warranty.garanteName || warranty.motorcycleBrand || 'Garante Oficial';

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-lg"
      className="border-2 border-emerald-400/80 shadow-2xl rounded-2xl overflow-hidden animate-scale-up"
    >
      <div className="relative w-full flex flex-col bg-white overflow-hidden">
        {/* Barra superior de acento con gradiente esmeralda */}
        <div className="h-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        <div className="p-5 sm:p-7 flex flex-col items-center text-center">
          {/* Círculo con icono de éxito y destellos */}
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute -inset-3 bg-emerald-100 rounded-full blur-md opacity-75 animate-pulse" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.5]" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>

          {/* Título y subtítulo afirmativo */}
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            ¡Solicitud Enviada Correctamente!
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-md">
            Tu solicitud de garantía ha sido registrada en el sistema y notificada con éxito para su evaluación técnica oficial.
          </p>

          {/* Tarjeta con los datos de la solicitud recién emitida */}
          <div className="w-full bg-zinc-50 border border-zinc-200/90 rounded-xl p-4 mt-4 text-left space-y-2.5">
            {/* Cabecera con número de reclamo y badge */}
            <div className="flex items-center justify-between border-b border-zinc-200/70 pb-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Código de Solicitud
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base sm:text-lg font-black font-mono text-zinc-900">
                    {warranty.requestNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1 rounded-md text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 transition cursor-pointer"
                    title="Copiar código"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                En Revisión
              </span>
            </div>

            {/* Cuadrícula de metadatos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
              {/* Cliente */}
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 block">
                    Cliente
                  </span>
                  <span className="font-bold text-zinc-900 truncate block">
                    {warranty.clientName || 'Cliente Particular'}
                  </span>
                  {warranty.clientPhone && (
                    <span className="text-[11px] text-zinc-600 block">
                      Tel: {warranty.clientPhone}
                    </span>
                  )}
                </div>
              </div>

              {/* Motocicleta */}
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 shrink-0 mt-0.5">
                  <Bike className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 block">
                    Motocicleta
                  </span>
                  <span className="font-bold text-zinc-900 truncate block">
                    {warranty.motorcycleBrand} {warranty.motorcycleModel}
                  </span>
                  <span className="text-[11px] text-zinc-600 block">
                    Placa: {warranty.motorcyclePlate || 'SIN PLACA'}
                  </span>
                </div>
              </div>

              {/* Destino */}
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 shrink-0 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 block">
                    Destino
                  </span>
                  <span className="font-bold text-zinc-900 truncate block">
                    {targetDestination}
                  </span>
                </div>
              </div>

              {/* Taller Emisor */}
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 block">
                    Emisor
                  </span>
                  <span className="font-bold text-zinc-900 truncate block">
                    {warranty.tallerOrigin || 'StarMotos Taller'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje informativo de siguiente paso */}
          <div className="w-full bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-3 mt-3.5 flex items-center gap-2 text-left">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11px] text-emerald-900 font-medium">
              El equipo de garantías ha recibido el expediente y procederá con la inspección de evidencias.
            </span>
          </div>

          {/* Botones de acción */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-end gap-2.5 mt-5">
            {onViewDetail && (
              <button
                type="button"
                onClick={handleDetail}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-800 text-xs font-bold transition cursor-pointer"
              >
                Ver Ficha Técnica
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-600/25 active:scale-98 flex items-center justify-center gap-1.5"
            >
              <span>Aceptar y Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
