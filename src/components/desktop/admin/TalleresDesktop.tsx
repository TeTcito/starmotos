import React, { useState, useMemo } from 'react';
import { 
  Building2, ArrowLeft, Wrench, ShieldCheck, Users, Package, Clock, 
  CheckCircle2, AlertTriangle, MapPin, Phone, TrendingUp, DollarSign, 
  FileText, ChevronRight, User, Search, ChevronDown
} from 'lucide-react';
import { Workshop, WarrantyRequest, AlistamientoFullRecord, TallerClient, Technician, TallerOrder, InventoryItem, AdminInvoice } from '../../../types/customer';
import { matchRecordToWorkshop, isPdiOnlyRecord, getRecordTimestamp } from '../../common/AlistamientoWizard';
import { saveStoredOrders, getStoredOrders } from '../../../data/mockMultiRoleData';

interface Props {
  workshops: Workshop[];
  warranties: WarrantyRequest[];
  fullAlistamientos: AlistamientoFullRecord[];
  clients: TallerClient[];
  technicians: Technician[];
  orders: TallerOrder[];
  inventory: InventoryItem[];
  invoices: AdminInvoice[];
  onUpdateOrderStatus?: (orderId: string, newStatus: string) => void;
}

const getStatusLabel = (status: string) => {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    'en_revision': { label: 'En Revisión', bg: 'bg-amber-50', text: 'text-amber-800' },
    'enviada_matriz': { label: 'En Revisión', bg: 'bg-amber-50', text: 'text-amber-800' },
    'creada': { label: 'Creada', bg: 'bg-zinc-100', text: 'text-zinc-700' },
    'en_proceso': { label: 'En Proceso', bg: 'bg-blue-50', text: 'text-blue-800' },
    'validada_matriz': { label: 'Validada', bg: 'bg-blue-50', text: 'text-blue-800' },
    'enviada_garante': { label: 'En Garante', bg: 'bg-indigo-50', text: 'text-indigo-800' },
    'aceptada': { label: 'Aceptada', bg: 'bg-emerald-50', text: 'text-emerald-800' },
    'aprobada': { label: 'Aprobada', bg: 'bg-emerald-50', text: 'text-emerald-800' },
    'denegada': { label: 'Denegada', bg: 'bg-red-50', text: 'text-red-800' },
    'rechazada': { label: 'Rechazada', bg: 'bg-red-50', text: 'text-red-800' },
    'completada': { label: 'Completada', bg: 'bg-green-50', text: 'text-green-800' },
  };
  return map[status] || { label: status, bg: 'bg-zinc-100', text: 'text-zinc-700' };
};

const getOrderStatusLabel = (status: string) => {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    'recepcion': { label: 'Recepción', bg: 'bg-zinc-100', text: 'text-zinc-800' },
    'diagnostico': { label: 'Diagnóstico', bg: 'bg-amber-50', text: 'text-amber-800' },
    'cotizacion_pendiente': { label: 'Cotización', bg: 'bg-orange-50', text: 'text-orange-800' },
    'en_reparacion': { label: 'En Reparación', bg: 'bg-blue-50', text: 'text-blue-800' },
    'control_calidad': { label: 'Control Calidad', bg: 'bg-purple-50', text: 'text-purple-800' },
    'lista_retiro': { label: 'Lista Retiro', bg: 'bg-emerald-50', text: 'text-emerald-800' },
    'entregada': { label: 'Entregada', bg: 'bg-green-50', text: 'text-green-800' },
    'inicio': { label: 'Inicio', bg: 'bg-zinc-100', text: 'text-zinc-800' },
    'en_proceso': { label: 'En Proceso', bg: 'bg-blue-50', text: 'text-blue-800' },
    'trabajando': { label: 'Trabajando', bg: 'bg-amber-50', text: 'text-amber-800' },
    'listo_para_entregar': { label: 'Listo Retiro', bg: 'bg-emerald-50', text: 'text-emerald-800' },
    'entregado': { label: 'Entregado', bg: 'bg-green-50', text: 'text-green-800' },
  };
  return map[status] || { label: status, bg: 'bg-zinc-100', text: 'text-zinc-700' };
};

export const TalleresDesktop: React.FC<Props> = ({
  workshops,
  warranties,
  fullAlistamientos,
  clients,
  technicians,
  orders,
  inventory,
  invoices,
  onUpdateOrderStatus,
}) => {
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>('Todas');
  const [searchWorkshop, setSearchWorkshop] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');

  const handleOrderStatusChange = (orderId: string, newStatus: string) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, newStatus);
    } else {
      const stored = getStoredOrders();
      const updated = stored.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o);
      saveStoredOrders(updated);
    }
  };

  // Helpers and Memos
  const getWorkshopOrders = (wsId: string) => orders.filter(o => (o as any).workshopId === wsId || (o as any).tallerId === wsId);
  
  const provinces = useMemo(() => {
    const provs = Array.from(new Set(workshops.map(w => w.province).filter(Boolean) as string[]));
    return ['Todas', ...provs.sort()];
  }, [workshops]);

  const getWorkshopLatestActivity = (wsId: string): number => {
    let latest = 0;
    // 1. Alistamientos del taller
    const wsAls = fullAlistamientos.filter(a => matchRecordToWorkshop(a, wsId, workshops));
    for (const a of wsAls) {
      const ts = getRecordTimestamp(a);
      if (ts > latest) latest = ts;
    }
    // 2. Órdenes del taller
    const wsOrds = orders.filter(o => (o as any).workshopId === wsId || (o as any).tallerId === wsId);
    for (const o of wsOrds) {
      const dateStr = o.createdAt || o.entryDate;
      if (dateStr) {
        const ts = new Date(dateStr).getTime();
        if (!isNaN(ts) && ts > latest) latest = ts;
      }
    }
    // 3. Garantías del taller
    const wsWarrs = warranties.filter(w => w.tallerOriginId === wsId || (w as any).tallerOrigin === wsId);
    for (const w of wsWarrs) {
      if (w.createdAt) {
        const ts = new Date(w.createdAt).getTime();
        if (!isNaN(ts) && ts > latest) latest = ts;
      }
    }
    return latest;
  };

  const filteredWorkshops = useMemo(() => {
    let result = workshops;
    if (selectedProvince !== 'Todas') {
      result = result.filter(w => w.province === selectedProvince);
    }
    if (searchWorkshop.trim() !== '') {
      const q = searchWorkshop.toLowerCase();
      result = result.filter(w => 
        w.name.toLowerCase().includes(q) || 
        w.city.toLowerCase().includes(q) || 
        w.code.toLowerCase().includes(q) || 
        w.manager.toLowerCase().includes(q)
      );
    }
    // Siempre poner el más reciente primero que tenga algún cambio o actividad
    return [...result].sort((a, b) => {
      const actA = getWorkshopLatestActivity(a.id);
      const actB = getWorkshopLatestActivity(b.id);
      if (actA !== actB) return actB - actA;
      return a.name.localeCompare(b.name);
    });
  }, [workshops, selectedProvince, searchWorkshop, fullAlistamientos, orders, warranties]);


  // Global Metrics
  const globalActiveOrders = useMemo(() => {
    const activeFromOrders = orders.filter(o => o.status !== 'entregada').length;
    return activeFromOrders > 0 ? activeFromOrders : workshops.reduce((acc, ws) => acc + ws.activeOrders, 0);
  }, [orders, workshops]);

  const globalWarrantiesInProcess = useMemo(() => {
    return warranties.filter(w => !['completada', 'denegada', 'rechazada'].includes(w.status)).length;
  }, [warranties]);

  const globalMechanics = technicians.length || workshops.reduce((acc, ws) => acc + ws.mechanics, 0);
  const globalAlistamientos = fullAlistamientos.length;

  if (selectedWorkshopId) {
    const ws = workshops.find(w => w.id === selectedWorkshopId);
    if (!ws) {
      setSelectedWorkshopId(null);
      return null;
    }

    const wsOrders = getWorkshopOrders(ws.id);
    const activeWsOrders = wsOrders.length > 0 ? wsOrders.filter(o => o.status !== 'entregada').length : ws.activeOrders;
    
    let filteredWsOrders = wsOrders;
    if (orderStatusFilter !== 'all') {
      filteredWsOrders = filteredWsOrders.filter(o => o.status === orderStatusFilter);
    }
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      filteredWsOrders = filteredWsOrders.filter(o => 
        o.otNumber.toLowerCase().includes(q) || 
        o.clientName.toLowerCase().includes(q) || 
        o.plate.toLowerCase().includes(q)
      );
    }
    filteredWsOrders = [...filteredWsOrders].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.entryDate ? new Date(a.entryDate).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.entryDate ? new Date(b.entryDate).getTime() : 0);
      if (dateA !== dateB) return dateB - dateA;
      return b.id.localeCompare(a.id);
    });

    const wsWarranties = warranties.filter(w => w.tallerOriginId === ws.id || w.tallerOrigin === ws.name || (w as any).tallerOrigin === ws.id);
    const warrantiesInProcess = wsWarranties.filter(w => !['completada', 'denegada', 'rechazada'].includes(w.status)).length;
    
    const wsAlistamientos = fullAlistamientos.filter(a => matchRecordToWorkshop(a, ws.id, workshops));
    const sortedWsAlistamientos = [...wsAlistamientos].sort((a, b) => getRecordTimestamp(b) - getRecordTimestamp(a));
    const wsClients = clients.filter(c => c.workshopId === ws.id || c.workshopName === ws.name);
    const wsTechnicians = technicians.filter(t => t.workshopId === ws.id || t.workshopName === ws.name);
    
    const wsInventory = inventory.filter(i => (i as any).workshopId === ws.id || (i as any).sedeId === ws.id);
    const wsInventoryCount = wsInventory.length;
    const wsLowStockCount = wsInventory.filter(i => i.stock <= (i.minStock || 5)).length;

    const alistamientosTotal = wsAlistamientos.reduce((acc, a) => acc + (isPdiOnlyRecord(a) ? 0 : Number(a.valorServicio || 0)), 0);
    const ordersTotal = wsOrders.reduce((acc, o) => acc + Number(o.totalCost || 0), 0);
    const totalIngresos = alistamientosTotal + ordersTotal;

    const totalCobrado = wsAlistamientos.reduce((acc, a) => acc + (isPdiOnlyRecord(a) ? 0 : (a.abono !== undefined ? Number(a.abono) : Number(a.montoPagado || 0))), 0) + ordersTotal;
    const totalPendiente = Math.max(0, totalIngresos - totalCobrado);

    return (
      <div className="flex flex-col gap-6 animate-fade-in pb-10">
        <button 
          onClick={() => setSelectedWorkshopId(null)}
          className="flex items-center gap-2 text-zinc-500 hover:text-blue-700 transition-colors w-fit font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la Red de Talleres
        </button>

        {/* Workshop Header Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-zinc-800">{ws.name}</h2>
              <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-xs font-mono">{ws.code}</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-zinc-200">
                <span className={`w-2 h-2 rounded-full ${ws.status === 'operativo' ? 'bg-emerald-500' : ws.status === 'mantenimiento' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                <span className="capitalize">{ws.status}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2 text-sm text-zinc-600">
                  <MapPin className="w-4 h-4 mt-0.5 text-zinc-400 shrink-0" />
                  <div>
                    <p>{ws.address}</p>
                    <p className="text-xs text-zinc-500">{[ws.city, ws.parroquia, ws.canton, ws.province].filter(Boolean).join(', ')}</p>
                    {ws.reference && <p className="text-xs text-zinc-400 italic mt-0.5">Ref: {ws.reference}</p>}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <User className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Gerente: <span className="font-medium text-zinc-800">{ws.manager}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>{ws.phone}</span>
                </div>
                {ws.email && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{ws.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              <Wrench className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Órdenes Activas</span>
            </div>
            <span className="text-2xl font-bold text-zinc-800">{activeWsOrders}</span>
          </div>
          
          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Garantías Proceso</span>
            </div>
            <span className="text-2xl font-bold text-zinc-800">{warrantiesInProcess}</span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Alistamientos</span>
            </div>
            <span className="text-2xl font-bold text-zinc-800">{wsAlistamientos.length}</span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              <Users className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Clientes & Técnicos</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-800">{wsClients.length}</span>
              <span className="text-xs text-zinc-500">/ {wsTechnicians.length || ws.mechanics} téc.</span>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              <Package className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Inventario</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-zinc-800">{wsInventoryCount}</span>
              {wsLowStockCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-medium bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  {wsLowStockCount}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              <DollarSign className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Ingresos Tot.</span>
            </div>
            <span className="text-2xl font-bold text-zinc-800">USD {totalIngresos.toFixed(2)}</span>
            <div className="flex justify-between items-center mt-2 text-[10px]">
               <span className="text-emerald-600 font-medium">Cobrado: ${totalCobrado.toFixed(2)}</span>
               <span className="text-rose-600 font-medium">Pendiente: ${totalPendiente.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Data Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            {/* Órdenes */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-100 flex flex-col gap-3 bg-zinc-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-800 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-zinc-500" />
                    Órdenes de Trabajo
                  </h3>
                  <div className="relative">
                    <input type="text" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Buscar orden..." className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs w-48 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
                  </div>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {['all', 'recepcion', 'diagnostico', 'en_reparacion', 'control_calidad', 'lista_retiro', 'entregada'].map(st => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold whitespace-nowrap transition-colors ${
                        orderStatusFilter === st 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {st === 'all' ? 'Todos' : getOrderStatusLabel(st).label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-0 overflow-auto max-h-[300px]">
                {filteredWsOrders.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 border-b border-zinc-200">
                      <tr>
                        <th className="py-2 px-4 text-[11px] font-semibold text-zinc-500 uppercase">OT #</th>
                        <th className="py-2 px-4 text-[11px] font-semibold text-zinc-500 uppercase">Cliente</th>
                        <th className="py-2 px-4 text-[11px] font-semibold text-zinc-500 uppercase">Estado</th>
                        <th className="py-2 px-4 text-[11px] font-semibold text-zinc-500 uppercase text-right">Costo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredWsOrders.map(o => {
                        const stat = getOrderStatusLabel(o.status);
                        const isSetA = ['recepcion', 'diagnostico', 'cotizacion_pendiente', 'en_reparacion', 'control_calidad', 'lista_retiro', 'entregada'].includes(o.status);
                        const flow = isSetA
                          ? ['recepcion', 'diagnostico', 'cotizacion_pendiente', 'en_reparacion', 'control_calidad', 'lista_retiro', 'entregada']
                          : ['inicio', 'en_proceso', 'trabajando', 'listo_para_entregar', 'entregado'];
                        const idx = flow.indexOf(o.status);
                        const nextStatuses = idx !== -1 && idx < flow.length - 1 ? flow.slice(idx + 1) : [];
                        const isDelivered = o.status === 'entregada' || o.status === 'entregado' || nextStatuses.length === 0;
                        return (
                          <tr key={o.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="py-3 px-4 text-sm font-medium text-blue-700">{o.otNumber}</td>
                            <td className="py-3 px-4">
                              <div className="text-sm font-medium text-zinc-800">{o.clientName}</div>
                              <div className="text-xs text-zinc-500">{o.motorcycleInfo} | {o.plate}</div>
                            </td>
                            <td className="py-3 px-4">
                              {isDelivered ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold ${stat.bg} ${stat.text}`}>
                                  {stat.label}
                                </span>
                              ) : (
                                <div className="relative group inline-block">
                                  <button className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold ${stat.bg} ${stat.text}`}>
                                    {stat.label}
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                  <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-zinc-200 rounded-lg shadow-lg hidden group-hover:block z-10">
                                    {nextStatuses.map(ns => {
                                      const nextStat = getOrderStatusLabel(ns);
                                      return (
                                        <button 
                                          key={ns} 
                                          onClick={() => handleOrderStatusChange(o.id, ns)}
                                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 ${nextStat.text}`}
                                        >
                                          {nextStat.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-zinc-800 text-right">
                              USD {o.totalCost.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-zinc-500 text-sm">Sin órdenes de trabajo registradas</div>
                )}
              </div>
            </div>

            {/* Alistamientos */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <h3 className="font-bold text-sm text-zinc-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                  Alistamientos Recientes
                </h3>
              </div>
              <div className="p-4 overflow-auto max-h-[300px] flex flex-col gap-3">
                {sortedWsAlistamientos.length > 0 ? (
                  sortedWsAlistamientos.slice(0, 10).map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 border border-zinc-100 rounded-xl hover:border-emerald-200 transition-colors bg-white">
                      <div>
                        <div className="text-sm font-medium text-zinc-800">{a.nombres} {a.apellidos}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{a.modeloMarca} | {a.placa}</div>
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-medium">
                          {a.serviciosRealizados?.join(', ') || 'Alistamiento'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-zinc-400 mb-1">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm font-bold text-emerald-700">
                          {((a.serviciosRealizados?.length === 1 && a.serviciosRealizados[0] === 'alistamiento_pdi') || Number(a.valorServicio || 0) === 0) ? '-' : `USD ${(a.valorServicio || 0).toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-zinc-500 text-sm">Sin alistamientos recientes</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Garantías */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <h3 className="font-bold text-sm text-zinc-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-zinc-500" />
                  Garantías Recientes
                </h3>
              </div>
              <div className="p-4 overflow-auto max-h-[300px] flex flex-col gap-3">
                {wsWarranties.length > 0 ? (
                  wsWarranties.map(w => {
                    const stat = getStatusLabel(w.status);
                    return (
                      <div key={w.id} className="flex items-center justify-between p-3 border border-zinc-100 rounded-xl hover:border-blue-200 transition-colors bg-white">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-700">{w.requestNumber || w.id.substring(0, 8)}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${stat.bg} ${stat.text}`}>
                              {stat.label}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-zinc-800 mt-1">{w.clientName}</div>
                          <div className="text-xs text-zinc-500">{(w as any).motorcycleBrand} {(w as any).motorcycleModel}</div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(w.createdAt).toLocaleDateString()}
                          </span>
                          <ChevronRight className="w-4 h-4 text-zinc-300" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-zinc-500 text-sm">Sin solicitudes de garantía</div>
                )}
              </div>
            </div>

            {/* Técnicos */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <h3 className="font-bold text-sm text-zinc-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Técnicos Asignados
                </h3>
              </div>
              <div className="p-4 overflow-auto max-h-[300px]">
                {wsTechnicians.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wsTechnicians.map(t => (
                      <div key={t.id} className="flex flex-col p-3 border border-purple-100 bg-purple-50/30 rounded-xl">
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-sm text-zinc-800">{t.name}</div>
                          <span className={`w-2 h-2 rounded-full mt-1.5 ${t.status === 'activo' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        </div>
                        <div className="text-xs text-purple-700 font-medium mt-1">{t.specialty || 'Mecánico General'}</div>
                        <div className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {t.phone || 'No registrado'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-zinc-500 text-sm">Sin técnicos asignados</div>
                )}
              </div>
            </div>

            {/* Clientes Registrados */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <h3 className="font-bold text-sm text-zinc-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  Clientes Recientes ({wsClients.length})
                </h3>
              </div>
              <div className="p-4 overflow-auto max-h-[300px]">
                {wsClients.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {wsClients.slice(0, 5).map(c => (
                      <div key={c.id} className="flex justify-between items-center p-3 border border-zinc-100 rounded-xl hover:border-blue-200 transition-colors bg-white">
                        <div>
                          <div className="font-medium text-sm text-zinc-800">{c.fullName}</div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{c.motorcycleBrand} {c.motorcycleModel}</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 bg-zinc-50 px-2 py-1 rounded">
                          <Phone className="w-3 h-3" />
                          {c.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-zinc-500 text-sm">Sin clientes registrados</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Part 1: Compact Grid View
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Red Oficial de Talleres & Sucursales StarMotos
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Gestión consolidada de sucursales y puntos de servicio autorizado.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
             <input type="text" value={searchWorkshop} onChange={e => setSearchWorkshop(e.target.value)} placeholder="Buscar taller..." className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
             <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Provinces filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {provinces.map(prov => (
          <button
            key={prov}
            onClick={() => setSelectedProvince(prov)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedProvince === prov 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'
            }`}
          >
            {prov}
          </button>
        ))}
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Órdenes Activas</div>
            <div className="text-2xl font-bold text-zinc-800">{globalActiveOrders}</div>
          </div>
        </div>
        
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Garantías Proceso</div>
            <div className="text-2xl font-bold text-zinc-800">{globalWarrantiesInProcess}</div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Mecánicos Act.</div>
            <div className="text-2xl font-bold text-zinc-800">{globalMechanics}</div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Alistamientos</div>
            <div className="text-2xl font-bold text-zinc-800">{globalAlistamientos}</div>
          </div>
        </div>
      </div>

      {/* Grid of Compact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredWorkshops.map(ws => {
          const isMatriz = ws.id === 'matriz-la-mana' || ws.name.toLowerCase().includes('matriz');
          
          const wsOrdersCount = orders.filter(o => (o as any).workshopId === ws.id || (o as any).tallerId === ws.id).length || ws.activeOrders;
          const wsWarrantiesCount = warranties.filter(w => w.tallerOriginId === ws.id || w.tallerOrigin === ws.name || (w as any).tallerOrigin === ws.id).length || ws.pendingWarranties;
          const wsMechanicsCount = technicians.filter(t => t.workshopId === ws.id || t.workshopName === ws.name).length || ws.mechanics;

          return (
            <div 
              key={ws.id}
              onClick={() => setSelectedWorkshopId(ws.id)}
              className={`bg-white border rounded-xl p-2.5 cursor-pointer hover:shadow-md transition-all flex flex-col ${
                isMatriz ? 'border-blue-400 ring-1 ring-blue-400/20' : 'border-zinc-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[9px] font-mono tracking-wider">
                  {ws.code}
                </span>
                <div className="flex items-center gap-1.5" title={ws.status}>
                  <span className={`w-2 h-2 rounded-full ${ws.status === 'operativo' ? 'bg-emerald-500' : ws.status === 'mantenimiento' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                </div>
              </div>
              
              <h3 className="text-[13px] font-bold text-zinc-800 line-clamp-1">{ws.name}</h3>
              <div className="text-[10px] text-zinc-500 mt-0.5 mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {ws.city}
              </div>

              <div className="flex items-center gap-1 mt-auto pt-2 border-t border-zinc-100">
                <div className="flex items-center gap-1 bg-zinc-50 px-1 py-0.5 rounded text-[9px] text-zinc-600" title="Órdenes">
                  <Wrench className="w-2.5 h-2.5 text-zinc-400" />
                  <span className="font-semibold">{wsOrdersCount}</span>
                </div>
                <div className="flex items-center gap-1 bg-zinc-50 px-1 py-0.5 rounded text-[9px] text-zinc-600" title="Garantías">
                  <ShieldCheck className="w-2.5 h-2.5 text-zinc-400" />
                  <span className="font-semibold">{wsWarrantiesCount}</span>
                </div>
                <div className="flex items-center gap-1 bg-zinc-50 px-1 py-0.5 rounded text-[9px] text-zinc-600" title="Mecánicos">
                  <Users className="w-2.5 h-2.5 text-zinc-400" />
                  <span className="font-semibold">{wsMechanicsCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredWorkshops.length === 0 && (
        <div className="py-12 text-center bg-white border border-zinc-200 rounded-xl">
          <Building2 className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No se encontraron talleres en esta provincia.</p>
        </div>
      )}
    </div>
  );
};
