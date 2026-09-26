// src/components/common/PendingWarrantiesAlertModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  X,
  MessageCircle,
  ExternalLink,
  ShieldAlert,
  Bike,
  User,
  Building2,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { WarrantyRequest } from '../../types/customer';
import { ModalPortal } from './ModalPortal';

export const TWO_HOURS_MS = 2 * 60 * 60 * 1000; // 2 horas en milisegundos

/**
 * Obtiene la marca de tiempo (timestamp en ms) de creación de una solicitud de garantía
 */
export function getWarrantyCreationTimestamp(w: WarrantyRequest): number {
  if (w.createdTimestamp && typeof w.createdTimestamp === 'number' && !isNaN(w.createdTimestamp)) {
    return w.createdTimestamp;
  }
  // Extraer timestamp de IDs generados con Date.now() (ej. gar-1748293847291)
  const idMatch = w.id?.match(/(\d{13})/);
  if (idMatch) {
    const num = parseInt(idMatch[1], 10);
    if (!isNaN(num) && num > 1672531199000 && num < 2524608000000) {
      return num;
    }
  }
  // Intentar parsear fecha createdAt estándar
  if (w.createdAt) {
    const parsed = Date.parse(w.createdAt);
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
}

/**
 * Determina si una solicitud de garantía está pendiente de aceptación y supera las 2 horas
 */
export function isWarrantyOverdueForAcceptance(w: WarrantyRequest): boolean {
  if (!w) return false;
  // Si ya fue aceptada, aprobada, completada, denegada o rechazada, no aplica la alerta
  const finalStatuses = ['aceptada', 'aprobada', 'completada', 'denegada', 'rechazada'];
  if (finalStatuses.includes(w.status)) {
    return false;
  }

  const timestamp = getWarrantyCreationTimestamp(w);
  if (!timestamp) return false;

  return Date.now() - timestamp >= TWO_HOURS_MS;
}

/**
 * Formatea el tiempo transcurrido en formato amigable
 */
export function formatElapsedTime(timestamp: number): string {
  if (!timestamp) return '';
  const diffMs = Math.max(0, Date.now() - timestamp);
  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `Hace ${days}d ${remHours}h`;
  }
  if (hours > 0) {
    return `Hace ${hours}h ${minutes}m`;
  }
  return `Hace ${minutes}m`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  overdueWarranties: WarrantyRequest[];
  onSelectWarranty?: (w: WarrantyRequest) => void;
  role?: 'taller' | 'admin' | 'garante';
}

export const PendingWarrantiesAlertModal: React.FC<Props> = ({
  isOpen,
  onClose,
  overdueWarranties,
  onSelectWarranty,
  role = 'taller',
}) => {
  if (!isOpen || overdueWarranties.length === 0) return null;

  const handleContactBrand = (w: WarrantyRequest) => {
    const brandName = w.targetBrand || w.garanteName || w.motorcycleBrand || 'Garantía de Marca';
    const text = encodeURIComponent(
      `Hola, consulto por la solicitud de garantía ${w.requestNumber} (${w.motorcycleBrand} ${w.motorcycleModel}, Placa: ${w.motorcyclePlate || 'S/P'}) para ${w.clientName}, la cual se encuentra pendiente de aceptación hace más de 2 horas. Agradecemos su confirmación.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      className="border-2 border-amber-400 max-h-[90vh]"
    >
      <div className="relative w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Barra superior de acento con gradiente de alerta */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

          {/* Encabezado del Modal */}
          <div className="p-4 sm:p-6 pb-3 border-b border-zinc-100 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-zinc-950 tracking-tight leading-tight">
                    Alerta de Garantías Pendientes
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                    {overdueWarranties.length} {overdueWarranties.length === 1 ? 'Sin Aceptar' : 'Sin Aceptar'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Han transcurrido más de 2 horas sin confirmación de aceptación
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Cerrar alerta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cuerpo del Modal */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Mensaje Oficial Solicitado */}
            <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/70 p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-tight">
                    Aviso Importante de Aceptación
                  </h4>
                  <p className="text-sm font-extrabold text-amber-900 leading-snug">
                    Tienes solicitudes de garantía sin aceptar. Contactar con la marca.
                  </p>
                  <p className="text-xs text-amber-800/90 leading-relaxed pt-0.5">
                    Las solicitudes que superan las 2 horas sin dictamen deben ser gestionadas directamente con la Garantía de Marca para no demorar la atención al cliente.
                  </p>
                </div>
              </div>
            </div>

            {/* Listado de Solicitudes Fuera de Tiempo */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Expedientes afectados ({overdueWarranties.length}):
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Límite de espera: 2 horas
                </span>
              </div>

              <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
                {overdueWarranties.map((w) => {
                  const timestamp = getWarrantyCreationTimestamp(w);
                  const elapsed = formatElapsedTime(timestamp);
                  const brandDest = w.targetBrand || w.garanteName || w.motorcycleBrand || 'Garantía de Marca';

                  return (
                    <div
                      key={w.id}
                      className="p-3.5 rounded-2xl border border-zinc-200 bg-white hover:border-amber-400 hover:shadow-md transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              {w.requestNumber}
                            </span>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-rose-600" />
                              {elapsed || '> 2 horas'}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5 pt-1">
                            <User className="w-3 h-3 text-zinc-400" />
                            <span>{w.clientName}</span>
                          </h5>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                          {w.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Datos de la Motocicleta y Destino */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-zinc-100 text-zinc-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <Bike className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">
                            {w.motorcycleBrand} {w.motorcycleModel} ({w.motorcyclePlate || 'S/P'})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end truncate">
                          <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="font-bold text-purple-900 truncate">
                            {brandDest}
                          </span>
                        </div>
                      </div>

                      {/* Botones de Acción para la Solicitud */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-zinc-100">
                        <button
                          type="button"
                          onClick={() => handleContactBrand(w)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Contactar a la marca por WhatsApp con los datos de esta solicitud"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Contactar con la marca</span>
                        </button>

                        {onSelectWarranty && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectWarranty(w);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          >
                            <span>Abrir Solicitud</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pie del Modal */}
          <div className="p-3 sm:p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline">
              Recordatorio automático cada 2 horas si no hay resolución oficial.
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
    </ModalPortal>
  );
};

/**
 * Componente autónomo que se monta en los módulos de garantías.
 * Evalúa automáticamente si hay garantías pendientes sin aceptar con más de 2 horas
 * y despliega la ventana emergente oficial.
 */
export const AutoPendingWarrantiesAlert: React.FC<{
  warranties: WarrantyRequest[];
  onSelectWarranty?: (w: WarrantyRequest) => void;
  role?: 'taller' | 'admin' | 'garante';
}> = ({ warranties, onSelectWarranty, role = 'taller' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState<number>(0);

  const overdueWarranties = useMemo(() => {
    if (!warranties || !Array.isArray(warranties)) return [];
    return warranties.filter(isWarrantyOverdueForAcceptance);
  }, [warranties]);

  useEffect(() => {
    if (overdueWarranties.length > 0 && Date.now() > dismissedUntil) {
      setIsOpen(true);
    }
  }, [overdueWarranties, dismissedUntil]);

  const handleClose = () => {
    setIsOpen(false);
    // Posponer re-apertura automática por 15 minutos en la sesión activa si el usuario la cierra
    setDismissedUntil(Date.now() + 15 * 60 * 1000);
  };

  if (overdueWarranties.length === 0) return null;

  return (
    <PendingWarrantiesAlertModal
      isOpen={isOpen}
      onClose={handleClose}
      overdueWarranties={overdueWarranties}
      onSelectWarranty={onSelectWarranty}
      role={role}
    />
  );
};

