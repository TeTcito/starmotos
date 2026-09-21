// src/components/desktop/garante/SolicitudesGaranteDesktop.tsx
import React from 'react';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  FileText,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';

interface Props {
  pendingRequests: WarrantyRequest[];
  onOpenDecisionModal: (warranty: WarrantyRequest, type: 'aprobar' | 'rechazar') => void;
}

export const SolicitudesGaranteDesktop: React.FC<Props> = ({
  pendingRequests,
  onOpenDecisionModal,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Inbox className="w-6 h-6 text-blue-600" />
            <span>Auditoría de Garantías Recibidas (Desde Matriz Central)</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Solicitudes validadas por el importador y red técnica StarMotos para dictamen oficial de marca.
          </p>
        </div>

        <span className="text-xs font-bold text-blue-800 bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Pendientes por Dictaminar: {pendingRequests.length}</span>
        </span>
      </div>

      {/* Lista de Solicitudes Pendientes */}
      <div className="space-y-4">
        {pendingRequests.length === 0 ? (
          <div className="p-12 text-center bg-emerald-50/50 border border-emerald-200 rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-emerald-900">¡Bandeja de Entrada al Día!</h3>
            <p className="text-xs text-emerald-700 mt-1">
              No hay solicitudes de garantía pendientes de dictamen en este momento.
            </p>
          </div>
        ) : (
          pendingRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white border-2 border-purple-200 hover:border-purple-400 rounded-2xl p-6 shadow-xs transition space-y-4"
            >
              {/* Encabezado de la solicitud */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                      {req.requestNumber}
                    </span>
                    <h3 className="text-base font-bold text-zinc-900">
                      {req.motorcycleBrand} {req.motorcycleModel} — {req.clientName}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    VIN: <strong className="font-mono text-zinc-800">{req.motorcycleVin}</strong> • Placa: <strong className="font-mono text-zinc-800">{req.motorcyclePlate}</strong> • C.I: {req.clientIdNumber} • Taller Emisor: {req.tallerOrigin}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-blue-700 block">
                    Costo Reclamado: ${req.estimatedCost?.toFixed(2) || '0.00'} USD
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">{req.createdAt}</span>
                </div>
              </div>

              {/* Descripción de la falla */}
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-bold uppercase text-zinc-500 block">Reclamo Técnico:</span>
                  <p className="text-zinc-800 leading-relaxed font-medium mt-0.5">{req.issueDescription}</p>
                </div>

                {req.matrizNotes && (
                  <div className="pt-2 border-t border-zinc-200">
                    <span className="text-[11px] font-bold uppercase text-blue-700 block">
                      Informe Técnico de Matriz Central:
                    </span>
                    <p className="text-blue-950 mt-0.5">{req.matrizNotes}</p>
                  </div>
                )}
              </div>

              {/* Botones de Dictamen */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-500 italic">
                  * El dictamen emitido quedará sellado digitalmente y notificado de inmediato a Matriz.
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenDecisionModal(req, 'rechazar')}
                    className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Rechazar Cobertura</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenDecisionModal(req, 'aprobar')}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprobar Garantía de Fábrica</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
