// src/components/mobile/admin/GarantiasAdminMobile.tsx
import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Navigation, Send, CheckCircle2, FileCheck2 } from 'lucide-react';
import { WarrantyRequest } from '../../../types/customer';

interface Props {
  warranties: WarrantyRequest[];
  onValidateWarranty: (id: string, notes: string) => void;
  onSendToGarante: (id: string, notes?: string) => void;
  onCompleteRepair: (id: string, invoiceNumber?: string) => void;
}

export const GarantiasAdminMobile: React.FC<Props> = ({
  warranties,
  onValidateWarranty,
  onSendToGarante,
  onCompleteRepair,
}) => {
  const [activeTab, setActiveTab] = useState<'marca' | 'plus_taller' | 'gps'>('marca');
  const filtered = warranties.filter((w) => w.warrantyType === activeTab);

  return (
    <div className="space-y-3.5">
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
                  {w.clientName} ({w.motorcycleBrand})
                </h4>
                <p className="text-[10px] text-zinc-500">{w.tallerOrigin}</p>
              </div>

              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                {w.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="p-2 bg-zinc-50 rounded-lg text-[11px] text-zinc-700">
              {w.issueDescription}
            </div>

            {/* Acciones */}
            <div className="pt-2 border-t border-zinc-100 flex justify-end gap-1.5">
              {(w.status === 'enviada_matriz' || w.status === 'en_revision') && (
                <button
                  type="button"
                  onClick={() => onValidateWarranty(w.id, 'Validado por Matriz.')}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Validar</span>
                </button>
              )}

              {w.status === 'validada_matriz' && (
                <button
                  type="button"
                  onClick={() => onSendToGarante(w.id)}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>A Garante</span>
                </button>
              )}

              {w.status === 'aprobada' && (
                <button
                  type="button"
                  onClick={() => onCompleteRepair(w.id)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Completar</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
