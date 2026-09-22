// src/components/common/NotificationsPopover.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  XCircle,
  CheckCircle2,
  X,
  Wrench,
  Shield,
  Sparkles,
  Receipt,
  ArrowRight,
  Inbox,
  Trash2,
} from 'lucide-react';
import {
  SystemAlert,
  WarrantyRequest,
  TallerOrder,
  WorkOrder,
  WarrantyItem,
  MaintenanceRecord,
} from '../../types/customer';

export type NotificationCategory = 'caso' | 'evento';
export type StatusBadgeVariant = 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'zinc';

export interface PopoverNotification {
  id: string;
  rawId: string;
  category: NotificationCategory;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  statusBadge?: {
    text: string;
    variant: StatusBadgeVariant;
  };
}

export interface NotificationsPopoverProps {
  role: 'admin' | 'taller' | 'garante' | 'cliente';
  alerts?: SystemAlert[];
  warranties?: WarrantyRequest[];
  orders?: TallerOrder[];
  customerActiveOrder?: WorkOrder;
  customerWarranties?: WarrantyItem[];
  customerHistory?: MaintenanceRecord[];
  onViewAll: () => void;
  onMarkAlertAsRead?: (id: string) => void;
  onMarkAllAlertsAsRead?: () => void;
  onDeleteAlert?: (id: string) => void;
  onDeleteAllReadAlerts?: () => void;
  className?: string;
  badgeClassName?: string;
}

const STORAGE_READ_CASES_KEY = 'starmotos_read_cases_ids';

function getStoredReadCases(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_READ_CASES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {
    console.error('Error reading read cases from localStorage', e);
  }
  return new Set();
}

function saveStoredReadCases(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_READ_CASES_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Error saving read cases to localStorage', e);
  }
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  role,
  alerts = [],
  warranties = [],
  orders = [],
  customerActiveOrder,
  customerWarranties = [],
  customerHistory = [],
  onViewAll,
  onMarkAlertAsRead,
  onMarkAllAlertsAsRead,
  onDeleteAlert,
  onDeleteAllReadAlerts,
  className = '',
  badgeClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'todos' | 'casos' | 'eventos'>('todos');
  const [readCaseIds, setReadCaseIds] = useState<Set<string>>(getStoredReadCases);

  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Cerrar con tecla Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Sincronizar read cases entre pestañas
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_READ_CASES_KEY) {
        setReadCaseIds(getStoredReadCases());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Normalizar items según el rol
  const notifications = useMemo<PopoverNotification[]>(() => {
    const list: PopoverNotification[] = [];

    // =========================================================================
    // 1. CASOS (Garantías y Órdenes de Trabajo)
    // =========================================================================
    if (role === 'admin') {
      // Garantías en Matriz
      warranties.forEach((w) => {
        let statusBadgeText = 'En Revisión';
        let variant: StatusBadgeVariant = 'amber';

        if (w.status === 'en_proceso' || w.status === 'enviada_garante') {
          statusBadgeText = 'Enviada Garante';
          variant = 'blue';
        } else if (w.status === 'aceptada' || w.status === 'aprobada') {
          statusBadgeText = 'Aprobada';
          variant = 'emerald';
        } else if (w.status === 'denegada' || w.status === 'rechazada') {
          statusBadgeText = 'Denegada';
          variant = 'red';
        } else if (w.status === 'completada') {
          statusBadgeText = 'Completada';
          variant = 'purple';
        }

        list.push({
          id: `case-war-${w.id}`,
          rawId: w.id,
          category: 'caso',
          type: 'garantia',
          title: `Garantía #${w.requestNumber}`,
          description: `${w.clientName} • ${w.motorcycleBrand} ${w.motorcycleModel} (${w.motorcyclePlate}) • Sede: ${w.tallerOrigin}`,
          timestamp: w.createdAt ? `Creada ${w.createdAt}` : 'Reciente',
          read: readCaseIds.has(w.id),
          statusBadge: {
            text: statusBadgeText,
            variant,
          },
        });
      });
    } else if (role === 'taller') {
      // Garantías emitidas por el taller
      warranties.forEach((w) => {
        let statusBadgeText = 'Enviada Matriz';
        let variant: StatusBadgeVariant = 'amber';

        if (w.status === 'en_proceso') {
          statusBadgeText = 'Revisión Garante';
          variant = 'blue';
        } else if (w.status === 'aceptada' || w.status === 'aprobada') {
          statusBadgeText = 'Garantía Aprobada';
          variant = 'emerald';
        } else if (w.status === 'denegada' || w.status === 'rechazada') {
          statusBadgeText = 'Garantía Denegada';
          variant = 'red';
        }

        list.push({
          id: `case-war-${w.id}`,
          rawId: w.id,
          category: 'caso',
          type: 'garantia',
          title: `Garantía #${w.requestNumber}`,
          description: `${w.clientName} • ${w.motorcycleBrand} ${w.motorcycleModel} • ${w.issueDescription}`,
          timestamp: w.createdAt ? `Creada ${w.createdAt}` : 'Reciente',
          read: readCaseIds.has(w.id),
          statusBadge: {
            text: statusBadgeText,
            variant,
          },
        });
      });

      // Órdenes de trabajo del taller
      orders.slice(0, 5).forEach((o) => {
        const statusMap: Record<string, { text: string; variant: StatusBadgeVariant }> = {
          ingresada: { text: 'Ingresada', variant: 'zinc' },
          en_diagnostico: { text: 'En Diagnóstico', variant: 'amber' },
          en_reparacion: { text: 'En Reparación', variant: 'blue' },
          control_calidad: { text: 'Control Calidad', variant: 'purple' },
          lista_retiro: { text: 'Lista Retiro', variant: 'emerald' },
          entregada: { text: 'Entregada', variant: 'zinc' },
        };
        const st = statusMap[o.status] || { text: o.status, variant: 'zinc' };

        list.push({
          id: `case-ord-${o.id}`,
          rawId: o.id,
          category: 'caso',
          type: 'orden',
          title: `Orden #${o.otNumber}`,
          description: `Cliente: ${o.clientName} • ${o.motorcycleInfo} (${o.plate}) • Técnico: ${o.mechanicName}`,
          timestamp: o.entryDate ? `Ingreso ${o.entryDate}` : 'Hoy',
          read: readCaseIds.has(o.id),
          statusBadge: st,
        });
      });
    } else if (role === 'garante') {
      // Garantías para dictamen del garante
      warranties.forEach((w) => {
        let statusBadgeText = 'Pendiente Dictamen';
        let variant: StatusBadgeVariant = 'amber';

        if (w.status === 'aceptada' || w.status === 'aprobada') {
          statusBadgeText = 'Dictamen Aprobado';
          variant = 'emerald';
        } else if (w.status === 'denegada' || w.status === 'rechazada') {
          statusBadgeText = 'Dictamen Denegado';
          variant = 'red';
        } else if (w.status === 'en_revision') {
          statusBadgeText = 'Validación Matriz';
          variant = 'blue';
        }

        list.push({
          id: `case-war-${w.id}`,
          rawId: w.id,
          category: 'caso',
          type: 'garantia',
          title: `Garantía #${w.requestNumber}`,
          description: `${w.motorcycleBrand} ${w.motorcycleModel} (${w.motorcyclePlate}) • Taller: ${w.tallerOrigin} • ${w.issueDescription}`,
          timestamp: w.createdAt ? `Creada ${w.createdAt}` : 'Reciente',
          read: readCaseIds.has(w.id),
          statusBadge: {
            text: statusBadgeText,
            variant,
          },
        });
      });
    } else if (role === 'cliente') {
      // Orden activa del cliente
      if (customerActiveOrder) {
        list.push({
          id: `case-cust-ord-${customerActiveOrder.otNumber}`,
          rawId: customerActiveOrder.otNumber,
          category: 'caso',
          type: 'orden',
          title: `Orden en Taller #${customerActiveOrder.otNumber}`,
          description: `Motivo: ${customerActiveOrder.clientReason} • Sede: ${customerActiveOrder.branch.name} • Mecánico: ${customerActiveOrder.mechanic.name}`,
          timestamp: customerActiveOrder.entryDate ? `Ingreso: ${customerActiveOrder.entryDate}` : 'En Curso',
          read: readCaseIds.has(customerActiveOrder.otNumber),
          statusBadge: {
            text: customerActiveOrder.status.replace('_', ' '),
            variant: 'blue',
          },
        });
      }

      // Garantías del cliente
      customerWarranties.forEach((w) => {
        list.push({
          id: `case-cust-war-${w.id}`,
          rawId: w.id,
          category: 'caso',
          type: 'garantia',
          title: `Póliza: ${w.title}`,
          description: `Cobertura: ${w.coverage} • Válido hasta ${w.expirationDate}`,
          timestamp: `Vence ${w.expirationDate}`,
          read: readCaseIds.has(w.id),
          statusBadge: {
            text: w.status === 'vigente' ? 'Garantía Activa' : w.status,
            variant: w.status === 'vigente' ? 'emerald' : 'amber',
          },
        });
      });
    }

    // =========================================================================
    // 2. EVENTOS (Alertas de Sistema, Facturas SRI, Actualizaciones)
    // =========================================================================
    if (role === 'cliente') {
      // Facturas SRI y Mantenimientos del cliente
      customerHistory.slice(0, 5).forEach((h) => {
        list.push({
          id: `evt-hist-${h.id}`,
          rawId: h.id,
          category: 'evento',
          type: 'factura_sri',
          title: `Comprobante SRI #${h.invoiceNumber || '001-002-0008891'}`,
          description: `Servicio: ${h.workSummary.slice(0, 2).join(', ')} • $${h.totalPaid.toFixed(2)} USD • ${h.branchName}`,
          timestamp: h.date,
          read: readCaseIds.has(h.id),
          statusBadge: {
            text: 'Factura SRI',
            variant: 'emerald',
          },
        });
      });
    } else {
      // Alertas operacionales del sistema para Admin, Taller y Garante
      alerts.forEach((alt) => {
        let badgeText = 'Evento';
        let variant: StatusBadgeVariant = 'zinc';

        switch (alt.type) {
          case 'orden_creada':
            badgeText = 'Alistamiento / OT';
            variant = 'blue';
            break;
          case 'garantia_aprobada':
            badgeText = 'Garantía Aprobada';
            variant = 'emerald';
            break;
          case 'garantia_rechazada':
            badgeText = 'Garantía Denegada';
            variant = 'red';
            break;
          case 'factura_emitida':
            badgeText = 'Factura SRI';
            variant = 'purple';
            break;
          case 'estado_cambiado':
            badgeText = 'Operatividad';
            variant = 'amber';
            break;
        }

        list.push({
          id: `evt-alt-${alt.id}`,
          rawId: alt.id,
          category: 'evento',
          type: alt.type,
          title: alt.title,
          description: alt.message,
          timestamp: alt.timestamp,
          read: alt.read,
          statusBadge: {
            text: badgeText,
            variant,
          },
        });
      });
    }

    return list;
  }, [
    role,
    warranties,
    orders,
    alerts,
    customerActiveOrder,
    customerWarranties,
    customerHistory,
    readCaseIds,
  ]);

  // Contadores
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const casosCount = useMemo(() => {
    return notifications.filter((n) => n.category === 'caso').length;
  }, [notifications]);

  const eventosCount = useMemo(() => {
    return notifications.filter((n) => n.category === 'evento').length;
  }, [notifications]);

  // Filtrado según la pestaña activa
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'casos') return notifications.filter((n) => n.category === 'caso');
    if (activeTab === 'eventos') return notifications.filter((n) => n.category === 'evento');
    return notifications;
  }, [notifications, activeTab]);

  // Marcar una notificación como leída
  const handleMarkItemAsRead = (item: PopoverNotification) => {
    if (item.category === 'evento' && onMarkAlertAsRead) {
      onMarkAlertAsRead(item.rawId);
    }
    // Guardar caso como leído
    const updated = new Set(readCaseIds);
    updated.add(item.rawId);
    setReadCaseIds(updated);
    saveStoredReadCases(updated);
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = () => {
    if (onMarkAllAlertsAsRead) {
      onMarkAllAlertsAsRead();
    }
    const updated = new Set(readCaseIds);
    notifications.forEach((n) => updated.add(n.rawId));
    setReadCaseIds(updated);
    saveStoredReadCases(updated);
  };

  // Click en "Ver todas las notificaciones"
  const handleViewAllClick = () => {
    setIsOpen(false);
    onViewAll();
  };

  // Badge pill color helper
  const getBadgeClass = (variant?: StatusBadgeVariant) => {
    switch (variant) {
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'red':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  // Icono según categoría y tipo
  const getItemIcon = (item: PopoverNotification) => {
    if (item.category === 'caso') {
      if (item.type === 'garantia') {
        return <Shield className="w-4 h-4 text-blue-600" />;
      }
      return <Wrench className="w-4 h-4 text-indigo-600" />;
    }
    if (item.type === 'factura_sri' || item.type === 'factura_emitida') {
      return <Receipt className="w-4 h-4 text-purple-600" />;
    }
    if (item.type === 'garantia_aprobada') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    if (item.type === 'garantia_rechazada') {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    return <Sparkles className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Botón Trigger Bell */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-blue-100 hover:text-white transition cursor-pointer active:scale-95 shadow-xs ${className}`}
        title="Notificaciones de Casos y Eventos"
        aria-label="Abrir Notificaciones"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse ring-2 ring-blue-700 ${badgeClassName}`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Ventana Emergente (Popover Modal Flotante) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-80 sm:w-96 md:w-[420px] max-w-[94vw] bg-white rounded-2xl shadow-2xl border border-blue-200/80 z-50 text-zinc-900 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* 1. Header de la Ventana Emergente */}
          <div className="p-3.5 bg-[#f0f6fc] border-b border-[#b8d1ea] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-zinc-900">Notificaciones</h3>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono">
                    Casos & Eventos
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Nube Activa</span>
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 truncate">
                  {unreadCount > 0
                    ? `${unreadCount} pendientes de atención`
                    : 'Todo al día en esta sesión'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition flex items-center gap-1 cursor-pointer"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Marcar leídas</span>
                </button>
              )}
              {onDeleteAllReadAlerts && alerts.some((a) => a.read) && (
                <button
                  type="button"
                  onClick={onDeleteAllReadAlerts}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-red-600 hover:bg-red-50 transition flex items-center gap-1 cursor-pointer"
                  title="Eliminar notificaciones leídas"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                  <span className="hidden sm:inline">Limpiar</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Pestañas de Filtro: Todos / Casos / Eventos */}
          <div className="px-3 pt-2 pb-1.5 bg-zinc-50/80 border-b border-zinc-200/70 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('todos')}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'todos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-200/60'
              }`}
            >
              <span>Todos</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeTab === 'todos' ? 'bg-blue-700 text-white' : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                {notifications.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('casos')}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'casos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-200/60'
              }`}
            >
              <Wrench className="w-3 h-3" />
              <span>Casos</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeTab === 'casos' ? 'bg-blue-700 text-white' : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                {casosCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('eventos')}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'eventos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-200/60'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Eventos</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeTab === 'eventos' ? 'bg-blue-700 text-white' : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                {eventosCount}
              </span>
            </button>
          </div>

          {/* 3. Listado Scrollable de Casos y Eventos */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100 overscroll-contain">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 space-y-2">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                  <Inbox className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-zinc-700">Sin notificaciones en esta categoría</p>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                  No hay {activeTab === 'casos' ? 'casos activos' : activeTab === 'eventos' ? 'eventos del sistema' : 'notificaciones'} pendientes.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkItemAsRead(item)}
                  className={`p-3.5 flex items-start gap-3 transition cursor-pointer relative hover:bg-blue-50/50 ${
                    !item.read ? 'bg-blue-50/30' : 'bg-white'
                  }`}
                >
                  {/* Punto no leído */}
                  {!item.read && (
                    <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  )}

                  {/* Icono de Caso o Evento */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      item.category === 'caso'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    {getItemIcon(item)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        {/* Etiqueta CASO vs EVENTO */}
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md font-mono shrink-0 border ${
                            item.category === 'caso'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {item.category === 'caso' ? 'CASO' : 'EVENTO'}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-900 truncate">
                          {item.title}
                        </h4>
                      </div>

                      {/* Badge de Estado */}
                      {item.statusBadge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${getBadgeClass(
                            item.statusBadge.variant
                          )}`}
                        >
                          {item.statusBadge.text}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between mt-1.5 pt-1 text-[10px] text-zinc-400 font-mono border-t border-zinc-100/60">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{item.timestamp}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {!item.read && (
                          <span className="text-[10px] font-bold text-blue-600">
                            Nueva
                          </span>
                        )}
                        {item.category === 'evento' && onDeleteAlert && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteAlert(item.rawId);
                            }}
                            className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Eliminar esta notificación"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 4. Footer con Botón Obligatorio: "Ver todas las notificaciones" */}
          <div className="p-3 bg-zinc-50 border-t border-zinc-200">
            <button
              type="button"
              onClick={handleViewAllClick}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <span>Ver todas las notificaciones</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
