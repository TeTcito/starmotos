// src/components/mobile/HistoryMobile.tsx
import React from 'react';
import { History } from 'lucide-react';
import { MaintenanceRecord } from '../../types/customer';

interface Props {
  history: MaintenanceRecord[];
}

export const HistoryMobile: React.FC<Props> = ({ history }) => {
  return (
    <div className="space-y-4 animate-fade-in pb-12">
      <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
        <History className="w-5 h-5 text-blue-400" />
        <h2 className="text-base font-bold text-white">
          Historial
        </h2>
      </div>

      <div className="space-y-3">
        {history.map((record) => (
          <div key={record.id} className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
              <div>
                <span className="font-bold text-white">{record.date}</span>
                <span className="text-blue-400 font-mono text-[11px] ml-2">{record.mileage.toLocaleString()} KM</span>
              </div>
              <span className="font-bold text-emerald-400 font-mono">${record.totalPaid.toFixed(2)}</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              {record.branchName} • Mecánico: {record.technicianName}
            </div>
            <div className="text-[11px] text-zinc-300">
              {record.workSummary.join(' • ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
