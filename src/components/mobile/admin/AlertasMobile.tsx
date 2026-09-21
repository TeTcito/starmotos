// src/components/mobile/admin/AlertasMobile.tsx
import React from 'react';
import { Bell, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { SystemAlert } from '../../../types/customer';

interface Props {
  alerts: SystemAlert[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const AlertasMobile: React.FC<Props> = ({ alerts, onMarkAsRead, onMarkAllAsRead }) => {
  const getIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'orden_creada':
        return <Clock className="w-3.5 h-3.5 text-blue-600" />;
      case 'garantia_aprobada':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'garantia_rechazada':
        return <XCircle className="w-3.5 h-3.5 text-red-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-zinc-600" />;
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alt) => (
        <div
          key={alt.id}
          onClick={() => onMarkAsRead(alt.id)}
          className={`p-3 rounded-xl border flex items-start gap-2.5 transition ${
            alt.read ? 'bg-white border-zinc-200 opacity-80' : 'bg-[#f0f6fc] border-[#b8d1ea]'
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center shrink-0">
            {getIcon(alt.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-zinc-900">{alt.title}</h5>
              <span className="text-[9px] text-zinc-400">{alt.timestamp}</span>
            </div>
            <p className="text-[11px] text-zinc-600 mt-0.5">{alt.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
