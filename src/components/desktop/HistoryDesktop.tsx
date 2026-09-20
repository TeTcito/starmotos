// src/components/desktop/HistoryDesktop.tsx
import React from 'react';
import { History } from 'lucide-react';
import { MaintenanceRecord } from '../../types/customer';

interface Props {
  history: MaintenanceRecord[];
}

export const HistoryDesktop: React.FC<Props> = ({ history }) => {
  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <History className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              Historial de Servicios y Mantenimientos
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Registro de servicios realizados, kilometraje certificado y facturación emitida
          </p>
        </div>
      </div>

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
    </div>
  );
};
