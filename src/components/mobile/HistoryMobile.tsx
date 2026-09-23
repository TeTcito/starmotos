// src/components/mobile/HistoryMobile.tsx
import React, { useState } from 'react';
import { History, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { MaintenanceRecord, WarrantyItem } from '../../types/customer';

interface Props {
  history: MaintenanceRecord[];
  warranties?: WarrantyItem[];
}

export const HistoryMobile: React.FC<Props> = ({ history, warranties = [] }) => {
  const [activeTab, setActiveTab] = useState<'servicios' | 'garantias'>('servicios');

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Encabezado */}
      <div className="flex items-center gap-2 pb-3 border-b border-zinc-200">
        <History className="w-5 h-5 text-blue-600" />
        <h2 className="text-base font-bold text-zinc-900">
          Historial y Garantías
        </h2>
      </div>

      {/* Tabs Móviles */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('servicios')}
          className={`py-2 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === 'servicios'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Servicios ({history.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('garantias')}
          className={`py-2 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeTab === 'garantias'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Pólizas ({warranties.length})</span>
        </button>
      </div>

      {/* Contenido según pestaña */}
      {activeTab === 'servicios' ? (
        history.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-zinc-300 text-center space-y-2">
            <History className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs font-semibold text-zinc-700">Sin historial registrado</p>
            <p className="text-[11px] text-zinc-500">
              Aún no tienes mantenimientos realizados en la red oficial de talleres StarMotos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record) => (
              <div key={record.id} className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm space-y-1.5 text-xs">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-1.5">
                  <div>
                    <span className="font-bold text-zinc-900">{record.date}</span>
                    <span className="text-blue-600 font-mono font-medium text-[11px] ml-2">{record.mileage.toLocaleString()} KM</span>
                  </div>
                  <span className="font-bold text-emerald-700 font-mono">${record.totalPaid.toFixed(2)}</span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  {record.branchName} • Mecánico: {record.technicianName}
                </div>
                <div className="text-[11px] text-zinc-600">
                  {record.workSummary.join(' • ')}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Pestaña Pólizas / Garantías */
        warranties.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-zinc-300 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs font-semibold text-zinc-700">Sin pólizas ni garantías activas</p>
            <p className="text-[11px] text-zinc-500">
              No registras pólizas ni reclamos de garantía en trámite en la red oficial StarMotos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {warranties.map((war) => (
              <div key={war.id} className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-zinc-900">{war.title}</h3>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Vigente
                  </span>
                </div>
                <p className="text-zinc-600 text-[11px]">{war.coverage}</p>
                <div className="flex gap-4 text-[10px] text-zinc-500 font-mono pt-1">
                  <span>Vence: <strong className="text-zinc-800">{war.expirationDate}</strong></span>
                  <span>Límite: <strong className="text-zinc-800">{war.kmLimit.toLocaleString()} km</strong></span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
