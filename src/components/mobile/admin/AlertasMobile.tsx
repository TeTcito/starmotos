// src/components/mobile/admin/AlertasMobile.tsx
import React from 'react';
import { Bell, Clock, CheckCircle2, XCircle, FileText, Trash2, CheckCheck } from 'lucide-react';
import { SystemAlert } from '../../../types/customer';

interface Props {
  alerts: SystemAlert[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteAlert?: (id: string) => void;
  onDeleteAllReadAlerts?: () => void;
}

export const AlertasMobile: React.FC<Props> = ({
  alerts,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteAlert,
  onDeleteAllReadAlerts,
}) => {
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

  const unreadCount = alerts.filter((a) => !a.read).length;
  const readCount = alerts.filter((a) => a.read).length;

  return (
    <div className="space-y-3">
      {/* Botones de acción móvil */}
      <div className="flex items-center justify-between gap-2 pb-1">
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-100 text-zinc-700 font-bold flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Leer todas</span>
          </button>
        )}

        {onDeleteAllReadAlerts && readCount > 0 && (
          <button
            type="button"
            onClick={onDeleteAllReadAlerts}
            className="px-2.5 py-1 text-[11px] rounded-lg bg-red-50 text-red-600 font-bold flex items-center gap-1 ml-auto"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
            <span>Limpiar leídas ({readCount})</span>
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="p-8 text-center bg-zinc-50 rounded-xl border border-dashed text-xs text-zinc-500 font-bold">
          No hay notificaciones.
        </div>
      ) : (
        alerts.map((alt) => (
          <div
            key={alt.id}
            onClick={() => onMarkAsRead(alt.id)}
            className={`p-3 rounded-xl border flex items-start gap-2.5 transition relative ${
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
            {onDeleteAlert && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAlert(alt.id);
                }}
                className="p-1 text-zinc-400 hover:text-red-600 rounded shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};
