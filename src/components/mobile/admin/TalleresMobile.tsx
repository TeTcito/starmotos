import React, { useState, useMemo } from 'react';
import { 
  Building2, ArrowLeft, Wrench, ShieldCheck, Users, 
  Package, Clock, CheckCircle2, MapPin, Phone, TrendingUp, User 
} from 'lucide-react';
import { 
  Workshop, WarrantyRequest, AlistamientoFullRecord, 
  TallerClient, Technician, TallerOrder, InventoryItem, AdminInvoice 
} from '../../../types/customer';

interface Props {
  workshops: Workshop[];
  warranties: WarrantyRequest[];
  fullAlistamientos: AlistamientoFullRecord[];
  clients: TallerClient[];
  technicians: Technician[];
  orders: TallerOrder[];
  inventory: InventoryItem[];
  invoices: AdminInvoice[];
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
  };
  return map[status] || { label: status, bg: 'bg-zinc-100', text: 'text-zinc-700' };
};

export const TalleresMobile: React.FC<Props> = ({
  workshops,
  warranties,
  fullAlistamientos,
  clients,
  technicians,
  orders,
  inventory,
  invoices
}) => {
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);

  const totalActiveOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'entregada').length;
  }, [orders]);

  const totalActiveWarranties = useMemo(() => {
    return warranties.filter(w => !['aprobada', 'rechazada', 'denegada'].includes(w.status)).length;
  }, [warranties]);

  if (selectedWorkshopId) {
    const ws = workshops.find(w => w.id === selectedWorkshopId);
    if (!ws) {
      setSelectedWorkshopId(null);
      return null;
    }

    const wsOrders = orders.filter(o => (o as any).workshopId === ws.id);
    const wsWarranties = warranties.filter(w => w.tallerOriginId === ws.id || w.tallerOrigin === ws.name || (w as any).tallerOrigin === ws.id);
    const allWsAlistamientos = fullAlistamientos.filter(a => a.sedeId === ws.id || a.sede === ws.name);
    const wsAlistamientos = allWsAlistamientos.slice(0, 5);
    const wsTechnicians = technicians.filter(t => t.workshopId === ws.id || t.workshopName === ws.name);
    const allWsClients = clients.filter(c => c.workshopId === ws.id || c.workshopName === ws.name);
    const wsClients = allWsClients.slice(0, 5);

    const ingresosAlistamientos = allWsAlistamientos.reduce((sum, a) => sum + (a.valorServicio || 0), 0);
    const ingresosOrders = wsOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
    const totalIngresos = ingresosAlistamientos + ingresosOrders;

    return (
      <div className="flex flex-col space-y-4 pb-6 w-full">
        {/* Back Button */}
        <button 
          onClick={() => setSelectedWorkshopId(null)}
          className="flex items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </button>

        {/* Header */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                  {ws.code}
                </span>
                <h2 className="text-lg font-bold text-zinc-900">{ws.name}</h2>
              </div>
              <p className="text-xs text-zinc-500 flex items-center mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                {ws.city}{ws.address ? ` - ${ws.address}` : ''}
              </p>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
              ws.status === 'operativo' ? 'bg-emerald-50 text-emerald-700' :
              ws.status === 'mantenimiento' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'
            }`}>
              {ws.status.toUpperCase()}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            <div className="flex items-center text-zinc-600">
              <User className="w-3 h-3 mr-1" />
              <span className="truncate">{ws.manager || 'Sin gerente'}</span>
            </div>
            <div className="flex items-center text-zinc-600">
              <Phone className="w-3 h-3 mr-1" />
              <span>{ws.phone || 'Sin teléfono'}</span>
            </div>
            {ws.reference && (
              <div className="col-span-2 text-[11px] text-zinc-500 italic mt-1">
                Ref: {ws.reference}
              </div>
            )}
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm flex flex-col">
            <span className="text-[10px] font-medium text-zinc-500 uppercase flex items-center">
              <Wrench className="w-3 h-3 mr-1" /> Órdenes Activas
            </span>
            <span className="text-lg font-bold text-zinc-900 mt-1">{wsOrders.filter(o => o.status !== 'entregada').length}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm flex flex-col">
            <span className="text-[10px] font-medium text-zinc-500 uppercase flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" /> Garantías
            </span>
            <span className="text-lg font-bold text-zinc-900 mt-1">{wsWarranties.length}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm flex flex-col">
            <span className="text-[10px] font-medium text-zinc-500 uppercase flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Alistamientos
            </span>
            <span className="text-lg font-bold text-zinc-900 mt-1">{allWsAlistamientos.length}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm flex flex-col">
            <span className="text-[10px] font-medium text-zinc-500 uppercase flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> Ingresos
            </span>
            <span className="text-lg font-bold text-zinc-900 mt-1">USD {totalIngresos.toFixed(2)}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm flex flex-col">
            <span className="text-[10px] font-medium text-zinc-500 uppercase flex items-center">
              <Users className="w-3 h-3 mr-1" /> Clientes
            </span>
            <span className="text-lg font-bold text-zinc-900 mt-1">{allWsClients.length}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm flex flex-col">
            <span className="text-[10px] font-medium text-zinc-500 uppercase flex items-center">
              <Wrench className="w-3 h-3 mr-1" /> Técnicos
            </span>
            <span className="text-lg font-bold text-zinc-900 mt-1">{wsTechnicians.length}</span>
          </div>
        </div>

        {/* Órdenes de Trabajo */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center">
            <Wrench className="w-4 h-4 mr-2 text-zinc-500" />
            Órdenes de Trabajo
          </h3>
          {wsOrders.length === 0 ? (
            <p className="text-xs text-zinc-500 italic text-center py-2">No hay órdenes registradas.</p>
          ) : (
            <div className="space-y-2">
              {wsOrders.slice(0, 5).map(o => {
                const sLabel = getOrderStatusLabel(o.status);
                return (
                  <div key={o.id} className="p-2 border border-zinc-100 rounded bg-zinc-50 flex justify-between items-center">
                    <div>
                      <div className="text-[11px] font-bold text-zinc-800">{o.otNumber} - {o.clientName}</div>
                      <div className="text-[10px] text-zinc-500">{o.plate || 'Sin Placa'}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${sLabel.bg} ${sLabel.text}`}>
                      {sLabel.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Garantías */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2 text-zinc-500" />
            Garantías
          </h3>
          {wsWarranties.length === 0 ? (
            <p className="text-xs text-zinc-500 italic text-center py-2">No hay garantías registradas.</p>
          ) : (
            <div className="space-y-2">
              {wsWarranties.slice(0, 5).map(w => {
                const sLabel = getStatusLabel(w.status);
                return (
                  <div key={w.id} className="p-2 border border-zinc-100 rounded bg-zinc-50 flex justify-between items-center">
                    <div>
                      <div className="text-[11px] font-bold text-zinc-800">{w.requestNumber || w.motorcycleVin?.substring(0, 8)}</div>
                      <div className="text-[10px] text-zinc-500">{new Date(w.createdAt).toLocaleDateString()} • {w.motorcycleBrand}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${sLabel.bg} ${sLabel.text}`}>
                      {sLabel.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alistamientos */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-zinc-500" />
            Últimos Alistamientos
          </h3>
          {wsAlistamientos.length === 0 ? (
            <p className="text-xs text-zinc-500 italic text-center py-2">No hay alistamientos registrados.</p>
          ) : (
            <div className="space-y-2">
              {wsAlistamientos.map(a => (
                <div key={a.id} className="p-2 border border-zinc-100 rounded bg-zinc-50 flex justify-between items-center">
                  <div>
                    <div className="text-[11px] font-bold text-zinc-800">{a.nombres} {a.apellidos}</div>
                    <div className="text-[10px] text-zinc-500">{new Date(a.createdAt || a.fechaServicio).toLocaleDateString()} • {a.modeloMarca}</div>
                  </div>
                  <div className="text-[11px] font-medium text-emerald-700">
                    USD {a.valorServicio || 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Técnicos */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2 text-zinc-500" />
            Técnicos
          </h3>
          {wsTechnicians.length === 0 ? (
            <p className="text-xs text-zinc-500 italic text-center py-2">No hay técnicos asignados.</p>
          ) : (
            <div className="space-y-2">
              {wsTechnicians.map(t => (
                <div key={t.id} className="p-2 border border-zinc-100 rounded bg-zinc-50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                      {t.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-zinc-800">{t.name}</div>
                      <div className="text-[10px] text-zinc-500 capitalize">{t.specialty}</div>
                    </div>
                  </div>
                  <div className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                    {t.activeOrdersCount || 0} OTs
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 pb-6 w-full">
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center">
          <Wrench className="w-5 h-5 text-zinc-400 mb-1" />
          <span className="text-[11px] font-medium text-zinc-500">Órdenes Activas</span>
          <span className="text-xl font-bold text-zinc-900">{totalActiveOrders}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center">
          <ShieldCheck className="w-5 h-5 text-zinc-400 mb-1" />
          <span className="text-[11px] font-medium text-zinc-500">Garantías Activas</span>
          <span className="text-xl font-bold text-zinc-900">{totalActiveWarranties}</span>
        </div>
      </div>

      {/* Workshop List */}
      <div className="space-y-2">
        {workshops.map(ws => {
          const wsOrdersCount = orders.filter(o => (o as any).workshopId === ws.id && o.status !== 'entregada').length || ws.activeOrders;
          const wsWarrantiesCount = warranties.filter(w => w.tallerOriginId === ws.id || w.tallerOrigin === ws.name || (w as any).tallerOrigin === ws.id).length || ws.pendingWarranties;
          const wsTechsCount = technicians.filter(t => t.workshopId === ws.id || t.workshopName === ws.name).length || ws.mechanics;

          return (
            <div 
              key={ws.id}
              onClick={() => setSelectedWorkshopId(ws.id)}
              className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm cursor-pointer hover:bg-zinc-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                    {ws.code}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900">{ws.name}</h3>
                    <p className="text-[10px] text-zinc-500">{ws.city}</p>
                  </div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  ws.status === 'operativo' ? 'bg-emerald-50 text-emerald-700' :
                  ws.status === 'mantenimiento' ? 'bg-amber-50 text-amber-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {ws.status === 'operativo' ? 'ACTIVO' : ws.status === 'mantenimiento' ? 'MANT' : 'INACTIVO'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-zinc-100">
                <div className="flex items-center text-[10px] text-zinc-600 bg-zinc-50 px-1.5 py-0.5 rounded">
                  <Wrench className="w-3 h-3 mr-1" /> {wsOrdersCount}
                </div>
                <div className="flex items-center text-[10px] text-zinc-600 bg-zinc-50 px-1.5 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3 mr-1" /> {wsWarrantiesCount}
                </div>
                <div className="flex items-center text-[10px] text-zinc-600 bg-zinc-50 px-1.5 py-0.5 rounded">
                  <Users className="w-3 h-3 mr-1" /> {wsTechsCount}
                </div>
              </div>
            </div>
          );
        })}
        {workshops.length === 0 && (
          <div className="text-center p-6 text-zinc-500 text-sm">
            No hay talleres registrados.
          </div>
        )}
      </div>
    </div>
  );
};
