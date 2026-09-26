// src/components/common/PendientesAlertModal.tsx
import React from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  Package,
  ShoppingCart,
  Wrench,
  Phone,
  FileText,
  AlertTriangle,
  Building2,
  DollarSign,
} from 'lucide-react';
import { AdminPendiente, PendienteCategory } from '../../types/customer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGoToPendientes: () => void;
  pendientes: AdminPendiente[];
}

const getCategoryBadge = (category: PendienteCategory) => {
  switch (category) {
    case 'repuesto':
      return {
        label: 'Repuesto',
        icon: <Package className="w-3.5 h-3.5" />,
        className: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'compra':
      return {
        label: 'Compra / Insumo',
        icon: <ShoppingCart className="w-3.5 h-3.5" />,
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'revision':
      return {
        label: 'Revisión Taller',
        icon: <Wrench className="w-3.5 h-3.5" />,
        className: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'llamada':
      return {
        label: 'Llamada / Cliente',
        icon: <Phone className="w-3.5 h-3.5" />,
        className: 'bg-purple-100 text-purple-800 border-purple-200',
      };
    case 'gestion':
      return {
        label: 'Gestión / Trámite',
        icon: <FileText className="w-3.5 h-3.5" />,
        className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      };
    default:
      return {
        label: 'General',
        icon: <CalendarClock className="w-3.5 h-3.5" />,
        className: 'bg-slate-100 text-slate-800 border-slate-200',
      };
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'alta':
      return {
        label: 'Alta / Urgente',
        className: 'bg-red-100 text-red-700 border-red-200',
      };
    case 'media':
      return {
        label: 'Media',
        className: 'bg-amber-100 text-amber-700 border-amber-200',
      };
    default:
      return {
        label: 'Baja',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
      };
  }
};

export const PendientesAlertModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onGoToPendientes,
  pendientes,
}) => {
  if (!isOpen) return null;

  const uncompleted = pendientes.filter((p) => !p.completed);
  const count = uncompleted.length;

  if (count === 0) return null;

  // Prioritize showing highest priority first
  const sortedUncompleted = [...uncompleted].sort((a, b) => {
    const priorityWeight: Record<string, number> = { alta: 3, media: 2, baja: 1 };
    const pA = priorityWeight[a.priority] || 1;
    const pB = priorityWeight[b.priority] || 1;
    return pB - pA;
  });

  const previewList = sortedUncompleted.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera / Banner */}
        <div className="relative bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
              <CalendarClock className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-1">
                Alerta de Ingreso
              </span>
              <h2 className="text-xl font-black text-white tracking-tight leading-tight">
                Tienes {count} {count === 1 ? 'pendiente' : 'pendientes'} por hacer
              </h2>
            </div>
          </div>
          <p className="mt-2 text-xs text-amber-50 leading-relaxed">
            Revisa tus tareas agendadas, compras de repuestos por encargar o trámites que requieren tu gestión.
          </p>
        </div>

        {/* Lista previa de tareas pendientes */}
        <div className="p-5 space-y-3 max-h-80 overflow-y-auto bg-slate-50/50">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 px-1">
            <span>Principales pendientes agendados:</span>
            <span className="text-amber-700 font-semibold">{count} en total</span>
          </div>

          {previewList.map((item) => {
            const cat = getCategoryBadge(item.category);
            const pri = getPriorityBadge(item.priority);

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-white border border-zinc-200 hover:border-amber-300 shadow-xs transition space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug">
                    {item.title}
                  </h4>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${pri.className}`}
                  >
                    {pri.label}
                  </span>
                </div>

                {item.description && (
                  <p className="text-[11px] text-zinc-600 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-100 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${cat.className}`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </span>

                  {item.dueDate && (
                    <span className="inline-flex items-center gap-1 text-zinc-500 font-medium">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{item.dueDate}</span>
                    </span>
                  )}

                  {item.estimatedCost !== undefined && item.estimatedCost > 0 && (
                    <span className="inline-flex items-center gap-0.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <DollarSign className="w-3 h-3" />
                      <span>{Number(item.estimatedCost).toFixed(2)}</span>
                    </span>
                  )}

                  {item.workshopName && (
                    <span className="inline-flex items-center gap-1 text-zinc-500 font-medium ml-auto truncate max-w-[160px]">
                      <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="truncate">{item.workshopName}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {count > previewList.length && (
            <p className="text-center text-xs text-zinc-500 py-1 font-medium">
              + {count - previewList.length} pendientes adicionales en el módulo...
            </p>
          )}
        </div>

        {/* Footer con botones de acción */}
        <div className="p-4 bg-white border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition cursor-pointer text-center"
          >
            Revisar más tarde
          </button>

          <button
            type="button"
            onClick={onGoToPendientes}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-98 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ir a Registrar Pendientes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
