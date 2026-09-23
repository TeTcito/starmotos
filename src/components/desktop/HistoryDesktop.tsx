// src/components/desktop/HistoryDesktop.tsx
import React, { useState } from 'react';
import { History, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { MaintenanceRecord, WarrantyItem } from '../../types/customer';

interface Props {
  history: MaintenanceRecord[];
  warranties?: WarrantyItem[];
}

export const HistoryDesktop: React.FC<Props> = ({ history, warranties = [] }) => {
  const [activeTab, setActiveTab] = useState<'servicios' | 'garantias'>('servicios');

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Encabezado Principal */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <History className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              Historial de Servicios y Garantía de Pólizas
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Expediente oficial de servicios técnicos certificados y pólizas de garantía de fábrica y taller
          </p>
        </div>

        {/* Selector de Pestañas Unificadas */}
        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab('servicios')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'servicios'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial de Servicios ({history.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('garantias')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'garantias'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Garantías y Pólizas ({warranties.length})</span>
          </button>
        </div>
      </div>

      {/* Contenido según pestaña */}
      {activeTab === 'servicios' ? (
        history.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-zinc-300 text-center space-y-3 max-w-xl mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <History className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Aún no registras mantenimientos</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto">
                Cada vez que ingreses tu motocicleta a cualquiera de nuestros talleres autorizados StarMotos, aquí se reflejará el detalle de los trabajos realizados, kilometraje certificado y facturas electrónicas.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {history.map((record) => (
              <div
                key={record.id}
                className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3 hover:border-zinc-300 transition"
              >
                <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-zinc-900 text-base">{record.date}</span>
                    <span className="text-blue-700 font-mono text-xs bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-medium">
                      {record.mileage.toLocaleString()} KM
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      OT: {record.otNumber}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-700 font-mono text-base">
                    ${record.totalPaid.toFixed(2)} USD
                  </span>
                </div>

                <div className="text-xs text-zinc-600 flex items-center justify-between">
                  <span>
                    <strong className="text-zinc-800">Sucursal:</strong> {record.branchName}
                  </span>
                  <span>
                    <strong className="text-zinc-800">Mecánico Certificado:</strong> {record.technicianName}
                  </span>
                </div>

                <div className="text-xs text-zinc-600 pt-1">
                  <strong className="text-zinc-800">Trabajos Efectuados:</strong> {record.workSummary.join(' • ')}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Pestaña Garantías */
        warranties.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-zinc-300 text-center space-y-3 max-w-xl mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Sin pólizas ni garantías activas registradas</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto">
                Aquí podrás consultar todas las pólizas de garantía de fábrica y de repuestos instalados por la red de talleres autorizados StarMotos.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 w-full">
            {warranties.map((war) => (
              <div
                key={war.id}
                className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3 hover:border-zinc-300 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-bold text-zinc-900 text-base">{war.title}</h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Vigente
                    </span>
                  </div>
                  <p className="text-zinc-600 text-xs leading-relaxed">{war.coverage}</p>
                </div>

                <div className="flex justify-between text-xs text-zinc-500 font-mono pt-3 border-t border-zinc-100">
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
