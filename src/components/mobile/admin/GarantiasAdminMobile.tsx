// src/components/mobile/admin/GarantiasAdminMobile.tsx
import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Navigation,
  Send,
  CheckCircle2,
  FileCheck2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { WarrantyRequest, WarrantyRequestStatus, TallerClient } from '../../../types/customer';
import { NewWarrantyFormView } from '../../common/WarrantyModule';

interface Props {
  warranties: WarrantyRequest[];
  clients?: TallerClient[];
  onValidateWarranty: (id: string, notes: string) => void;
  onSendToGarante: (id: string, notes?: string) => void;
  onCompleteRepair: (id: string, invoiceNumber?: string) => void;
  onCreateWarranty?: (newReq: WarrantyRequest) => void;
  onDeleteWarranty?: (id: string) => void;
  onQuickUpdateStatus?: (id: string, status: WarrantyRequestStatus, notes?: string) => void;
}

export const GarantiasAdminMobile: React.FC<Props> = ({
  warranties,
  clients = [],
  onValidateWarranty,
  onSendToGarante,
  onCompleteRepair,
  onCreateWarranty,
  onDeleteWarranty,
  onQuickUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'marca' | 'plus_taller' | 'gps'>('marca');
  const [isEmitting, setIsEmitting] = useState(false);
  const [quickModal, setQuickModal] = useState<WarrantyRequest | null>(null);
  const [quickStatus, setQuickStatus] = useState<WarrantyRequestStatus>('en_proceso');
  const [quickNotes, setQuickNotes] = useState('');

  if (isEmitting) {
    return (
      <NewWarrantyFormView
        onCancel={() => setIsEmitting(false)}
        onSubmit={(req) => {
          if (onCreateWarranty) onCreateWarranty(req);
          setIsEmitting(false);
        }}
        clients={clients}
        defaultTallerOrigin="StarMotos Sede Matriz"
        defaultTallerOriginId="sede-matriz"
      />
    );
  }

  const filtered = warranties.filter((w) => w.warrantyType === activeTab);

  return (
    <div className="space-y-3.5">
      {/* Botón de Emitir Solicitud desde Matriz */}
      {onCreateWarranty && (
        <button
          type="button"
          onClick={() => setIsEmitting(true)}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Emitir Solicitud de Garantía</span>
        </button>
      )}

      {/* Tabs Móviles */}
      <div className="flex rounded-xl bg-zinc-100 p-1 text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('marca')}
          className={`flex-1 py-1.5 text-center rounded-lg transition ${
            activeTab === 'marca' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600'
          }`}
        >
          Marca ({warranties.filter((w) => w.warrantyType === 'marca').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('plus_taller')}
          className={`flex-1 py-1.5 text-center rounded-lg transition ${
            activeTab === 'plus_taller' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600'
          }`}
        >
          Plus ({warranties.filter((w) => w.warrantyType === 'plus_taller').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gps')}
          className={`flex-1 py-1.5 text-center rounded-lg transition ${
            activeTab === 'gps' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600'
          }`}
        >
          GPS ({warranties.filter((w) => w.warrantyType === 'gps').length})
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map((w) => (
          <div key={w.id} className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  {w.requestNumber}
                </span>
                <h4 className="text-xs font-bold text-zinc-900 mt-1">
                  {w.clientName} ({w.motorcycleBrand} {w.motorcycleModel})
                </h4>
                <p className="text-[10px] text-zinc-500">
                  Taller: {w.tallerOrigin} • Placa: {w.motorcyclePlate || 'S/P'}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                  {w.status.replace('_', ' ').toUpperCase()}
                </span>
                {onDeleteWarranty && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar solicitud ${w.requestNumber}?`)) {
                        onDeleteWarranty(w.id);
                      }
                    }}
                    className="p-1 text-zinc-400 hover:text-red-600 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-2 bg-zinc-50 rounded-lg text-[11px] text-zinc-700">
              {w.issueDescription}
            </div>

            {/* Acciones */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-zinc-800">
                ${(w.estimatedCost || 60).toFixed(2)} USD
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setQuickModal(w);
                    setQuickStatus(w.status === 'enviada_matriz' ? 'en_proceso' : 'validada_matriz');
                    setQuickNotes(w.matrizNotes || 'Revisado y aprobado por Matriz.');
                  }}
                  className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Gestionar</span>
                </button>

                {(w.status === 'enviada_matriz' || w.status === 'en_revision') && (
                  <button
                    type="button"
                    onClick={() => onValidateWarranty(w.id, 'Validado por Matriz.')}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Validar</span>
                  </button>
                )}

                {w.status === 'validada_matriz' && (
                  <button
                    type="button"
                    onClick={() => onSendToGarante(w.id)}
                    className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>A Garante</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Rápido Móvil */}
      {quickModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-xs font-bold text-zinc-900">
                Gestionar: {quickModal.requestNumber}
              </h4>
              <button
                type="button"
                onClick={() => setQuickModal(null)}
                className="p-1 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                Nuevo Estado
              </label>
              <select
                value={quickStatus}
                onChange={(e) => setQuickStatus(e.target.value as WarrantyRequestStatus)}
                className="w-full p-2 bg-zinc-50 border rounded-lg text-xs font-bold"
              >
                <option value="en_proceso">⏳ En Proceso (Enviar a Garante)</option>
                <option value="validada_matriz">✓ Validada por Matriz</option>
                <option value="rechazada_matriz">✕ Rechazada por Matriz</option>
                <option value="reparacion_completada">🛠 Reparación Completada</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                Observaciones Matriz
              </label>
              <textarea
                rows={2}
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
                className="w-full p-2 bg-zinc-50 border rounded-lg text-xs"
                placeholder="Notas u observaciones..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setQuickModal(null)}
                className="px-3 py-1.5 text-xs text-zinc-600 font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onQuickUpdateStatus) {
                    onQuickUpdateStatus(quickModal.id, quickStatus, quickNotes);
                  } else {
                    onValidateWarranty(quickModal.id, quickNotes);
                  }
                  setQuickModal(null);
                }}
                className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
