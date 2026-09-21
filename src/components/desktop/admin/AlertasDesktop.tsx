// src/components/desktop/admin/AlertasDesktop.tsx
import React from 'react';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { SystemAlert } from '../../../types/customer';

interface Props {
  alerts: SystemAlert[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  title?: string;
  subtitle?: string;
}

export const AlertasDesktop: React.FC<Props> = ({
  alerts,
  onMarkAsRead,
  onMarkAllAsRead,
  title = 'Centro de Notificaciones & Alertas en Vivo',
  subtitle = 'Registro cronológico de eventos operacionales, cambios de estado y aprobaciones.',
}) => {
  const getIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'orden_creada':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'garantia_aprobada':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'garantia_rechazada':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'factura_emitida':
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-600" />;
    }
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            <span>{title}</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {subtitle}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="px-3.5 py-1.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            <span>Marcar todas como leídas</span>
          </button>
        )}
      </div>

      {/* Listado de Alertas */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="p-12 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-sm font-bold text-zinc-500">No hay notificaciones pendientes.</p>
          </div>
        ) : (
          alerts.map((alt) => (
            <div
              key={alt.id}
              onClick={() => onMarkAsRead(alt.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                alt.read
                  ? 'bg-white border-zinc-200 opacity-80 hover:opacity-100'
                  : 'bg-[#f0f6fc] border-[#b8d1ea] shadow-xs'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  alt.read ? 'bg-zinc-100' : 'bg-white shadow-xs'
                }`}
              >
                {getIcon(alt.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                    <span>{alt.title}</span>
                    {!alt.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-mono">{alt.timestamp}</span>
                </div>
                <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{alt.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
