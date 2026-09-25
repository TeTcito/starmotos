// src/components/desktop/taller/OrdenesTallerDesktop.tsx
import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  ChevronRight,
  User,
  Calendar,
  PackageCheck,
  Search,
  ChevronDown,
  Lock,
  ArrowRight,
  Star,
} from 'lucide-react';
import { TallerOrder, WorkOrderStatus } from '../../../types/customer';

interface Props {
  orders: TallerOrder[];
  onUpdateOrderStatus: (orderId: string, nextStatus: WorkOrderStatus) => void;
}

const STATUS_FLOW: { id: WorkOrderStatus; label: string; color: string; badgeBg: string }[] = [
  { id: 'inicio', label: 'Inicio', color: 'bg-zinc-100 text-zinc-700', badgeBg: 'bg-zinc-100 text-zinc-800' },
  { id: 'en_proceso', label: 'En Proceso', color: 'bg-blue-100 text-blue-800', badgeBg: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { id: 'trabajando', label: 'Trabajando', color: 'bg-amber-100 text-amber-800', badgeBg: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { id: 'listo_para_entregar', label: 'Listo Retiro', color: 'bg-emerald-100 text-emerald-800', badgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  { id: 'entregado', label: 'Entregado', color: 'bg-zinc-800 text-white', badgeBg: 'bg-zinc-900 text-white' },
];

export const OrdenesTallerDesktop: React.FC<Props> = ({ orders, onUpdateOrderStatus }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openDropdownOrderId, setOpenDropdownOrderId] = useState<string | null>(null);

  // Obtener únicamente los estados siguientes progresivos (no permite retroceder)
  const getNextStatuses = (current: WorkOrderStatus): WorkOrderStatus[] => {
    const ids = STATUS_FLOW.map((s) => s.id);
    const normalizedCurrent = (current === 'entregada' as any) ? 'entregado' : current;
    const idx = ids.indexOf(normalizedCurrent);
    if (idx >= 0 && idx < ids.length - 1) {
      return ids.slice(idx + 1);
    }
    return [];
  };

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== 'all') {
      result = result.filter(o => {
        if (statusFilter === 'entregado') {
          return o.status === 'entregado' || (o.status as any) === 'entregada';
        }
        return o.status === statusFilter;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.otNumber.toLowerCase().includes(q) || 
        o.clientName.toLowerCase().includes(q) || 
        o.plate.toLowerCase().includes(q) ||
        (o.motorcycleInfo && o.motorcycleInfo.toLowerCase().includes(q))
      );
    }
    // Siempre la orden más reciente primero
    return [...result].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.entryDate ? new Date(a.entryDate).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.entryDate ? new Date(b.entryDate).getTime() : 0);
      if (dateA !== dateB) return dateB - dateA;
      return b.id.localeCompare(a.id);
    });
  }, [orders, statusFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Overlay transparente para cerrar el menú desplegable al hacer clic fuera */}
      {openDropdownOrderId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenDropdownOrderId(null)}
        />
      )}

      {/* Header Compacto con Métricas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <span>Órdenes de Trabajo en Taller</span>
          </h2>
          <p className="text-xs text-zinc-500">
            Seguimiento de servicio técnico con estados progresivos protegidos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            Activas: {orders.filter(o => o.status !== 'entregado' && (o.status as any) !== 'entregada').length}
          </span>
          <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200">
            Total: {orders.length}
          </span>
        </div>
      </div>

      {/* Barra Única: Buscador y Filtros en una Sola Línea */}
      <div className="flex items-center gap-2 bg-zinc-50 p-2 rounded-xl border border-zinc-200 shadow-2xs">
        {/* Buscador */}
        <div className="relative w-60 shrink-0">
          <input 
            type="text" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Buscar por OT, cliente, placa..." 
            className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs" 
          />
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
        </div>

        <div className="h-5 w-px bg-zinc-200 shrink-0 mx-0.5" />

        {/* Filtros de Estado en la misma línea */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'all' 
                ? 'bg-blue-600 text-white shadow-2xs' 
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Todos ({orders.length})
          </button>
          {STATUS_FLOW.map(st => {
            const count = orders.filter(o => {
              if (st.id === 'entregado') return o.status === 'entregado' || (o.status as any) === 'entregada';
              return o.status === st.id;
            }).length;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === st.id 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <span>{st.label}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${statusFilter === st.id ? 'bg-blue-700 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vista de Órdenes */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 bg-white border border-zinc-200 rounded-xl p-6">
          <Wrench className="w-10 h-10 text-zinc-200" />
          <p className="text-sm font-bold text-zinc-600">No hay órdenes que coincidan</p>
          <p className="text-xs text-zinc-400 max-w-sm">
            {searchQuery || statusFilter !== 'all' 
              ? 'Prueba ajustando los filtros o el texto de búsqueda.' 
              : 'Las órdenes se generan automáticamente al completar un alistamiento en el taller.'}
          </p>
        </div>
      ) : (
        /* Tarjetas Compactas de Órdenes en Grid de 3 Columnas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredOrders.map((ord, idx) => {
            const isDelivered = ord.status === 'entregado' || (ord.status as any) === 'entregada';
            const nextStatuses = getNextStatuses(ord.status);
            const currentStageObj = STATUS_FLOW.find((s) => s.id === ord.status) || (isDelivered ? STATUS_FLOW[4] : null);
            const isOpen = openDropdownOrderId === ord.id;

            return (
              <div
                key={ord.id}
                className={`bg-white border rounded-xl p-3 shadow-2xs transition-all flex flex-col justify-between ${
                  isDelivered 
                    ? 'border-zinc-200 bg-zinc-50/50' 
                    : 'border-zinc-200 hover:border-blue-300 hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Fila Superior: OT, Estado actual y Fecha */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {ord.otNumber}
                      </span>
                      {idx === 0 && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded animate-pulse">
                          Más reciente
                        </span>
                      )}
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${currentStageObj?.badgeBg || 'bg-zinc-100 text-zinc-600'}`}>
                      {currentStageObj?.label || ord.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Info Motocicleta */}
                  <h3 className="text-xs font-bold text-zinc-900 truncate">
                    {ord.motorcycleInfo || 'Motocicleta sin modelo'}
                  </h3>
                  <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center justify-between">
                    <span>Placa: <strong className="text-zinc-800 font-mono font-bold">{ord.plate || 'S/P'}</strong></span>
                    <span className="text-zinc-700 font-medium truncate max-w-[140px]">{ord.clientName}</span>
                  </div>

                  {/* Resumen de Servicios */}
                  {ord.servicesSummary && (
                    <p className="text-[10px] text-zinc-500 mt-1.5 line-clamp-1 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">
                      <span className="font-semibold text-zinc-600">Serv:</span> {ord.servicesSummary}
                    </p>
                  )}

                  {/* Meta: Técnico y Fecha */}
                  <div className="mt-2 p-1.5 bg-zinc-50 rounded-lg border border-zinc-100 grid grid-cols-2 gap-1 text-[10px]">
                    <div className="truncate">
                      <span className="text-zinc-400 block font-medium">Técnico</span>
                      <span className="font-bold text-zinc-800 truncate block">
                        {ord.mechanicName || 'General'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-400 block font-medium">Fecha</span>
                      <span className="font-mono text-zinc-700 font-medium">
                        {ord.entryDate}
                      </span>
                    </div>
                  </div>

                  {/* Calificación del Cliente si ya fue entregada y calificada */}
                  {ord.rating && (
                    <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200/90 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>Calificación Cliente</span>
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-2.5 h-2.5 ${
                                s <= ord.rating!.stars
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-zinc-200 fill-zinc-100'
                              }`}
                            />
                          ))}
                          <span className="text-[10px] font-mono font-bold text-amber-950 ml-1">
                            {ord.rating.stars}/5
                          </span>
                        </div>
                      </div>
                      {ord.rating.comment && (
                        <p className="text-[10px] text-zinc-700 italic bg-white/70 p-1.5 rounded border border-amber-100 line-clamp-2">
                          "{ord.rating.comment}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer de Tarjeta: Costo y Botón Desplegable Progresivo */}
                <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between relative">
                  <div className="text-[11px] text-zinc-500 font-mono">
                    Total: <strong className="text-zinc-900 font-bold">${Number(ord.totalCost || 0).toFixed(2)}</strong>
                  </div>

                  {/* Control Desplegable Hacia Abajo */}
                  <div className="relative">
                    {isDelivered || nextStatuses.length === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 text-zinc-600 text-[10px] font-bold border border-zinc-200" title="Orden finalizada, no se puede modificar">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Entregado</span>
                        <Lock className="w-2.5 h-2.5 text-zinc-400" />
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpenDropdownOrderId(isOpen ? null : ord.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        >
                          <span>Avanzar Estado</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Menú Desplegable HACIA ABAJO (top-full mt-1.5) */}
                        {isOpen && (
                          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl z-20 py-1 animate-slide-in">
                            <div className="px-2.5 py-1 border-b border-zinc-100 text-[9px] font-black text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                              <span>Próximos estados:</span>
                              <span className="text-blue-600 font-bold">Solo avance</span>
                            </div>
                            <div className="divide-y divide-zinc-50">
                              {nextStatuses.map(ns => {
                                const nsObj = STATUS_FLOW.find(s => s.id === ns);
                                return (
                                  <button
                                    key={ns}
                                    type="button"
                                    onClick={() => {
                                      onUpdateOrderStatus(ord.id, ns);
                                      setOpenDropdownOrderId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between transition-colors text-zinc-700 cursor-pointer"
                                  >
                                    <span>{nsObj?.label}</span>
                                    <ArrowRight className="w-3 h-3 text-zinc-400" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
