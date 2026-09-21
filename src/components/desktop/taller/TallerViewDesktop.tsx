// src/components/desktop/taller/TallerViewDesktop.tsx
import React from 'react';
import {
  Wrench,
  ShieldAlert,
  Users,
  Package,
  LogOut,
  MapPin,
  ChevronRight,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import {
  TallerSection,
  TallerOrder,
  WarrantyRequest,
  TallerClient,
  InventoryItem,
  WorkOrderStatus,
  Technician,
  AlistamientoFullRecord,
  Workshop,
} from '../../../types/customer';
import { OrdenesTallerDesktop } from './OrdenesTallerDesktop';
import { SolicitudesGarantiaTallerDesktop } from './SolicitudesGarantiaTallerDesktop';
import { ClientesTallerDesktop } from './ClientesTallerDesktop';
import { InventarioDesktop } from './InventarioDesktop';
import { AlistamientoWizard } from '../../common/AlistamientoWizard';
import { TecnicosDesktop } from '../common/TecnicosDesktop';

interface Props {
  activeSection: TallerSection;
  setActiveSection: (section: TallerSection) => void;
  onLogout: () => void;
  orders: TallerOrder[];
  onUpdateOrderStatus: (orderId: string, nextStatus: WorkOrderStatus) => void;
  warranties: WarrantyRequest[];
  clients: TallerClient[];
  inventory: InventoryItem[];
  workshops: Workshop[];
  technicians: Technician[];
  origins: string[];
  fullAlistamientos: AlistamientoFullRecord[];
  onAddTechnician: (tech: Omit<Technician, 'id' | 'activeOrdersCount'>) => void;
  onAddOrigin: (origin: string) => void;
  onSaveFullAlistamiento: (record: AlistamientoFullRecord) => void;
  newWarrantyForm: any;
  setNewWarrantyForm: React.Dispatch<React.SetStateAction<any>>;
  onCreateWarrantyRequest: () => boolean;
}

export const TallerViewDesktop: React.FC<Props> = ({
  activeSection,
  setActiveSection,
  onLogout,
  orders,
  onUpdateOrderStatus,
  warranties,
  clients,
  inventory,
  workshops,
  technicians,
  origins,
  fullAlistamientos,
  onAddTechnician,
  onAddOrigin,
  onSaveFullAlistamiento,
  newWarrantyForm,
  setNewWarrantyForm,
  onCreateWarrantyRequest,
}) => {
  const [activeWorkshopId, setActiveWorkshopId] = React.useState<string>(() => {
    return localStorage.getItem('starmotos_taller_active_ws') || 'taller-quevedo';
  });

  const currentWs =
    workshops.find((w) => w.id === activeWorkshopId) ||
    workshops.find((w) => w.id === 'taller-quevedo') ||
    workshops[0];

  const tallerTechs = technicians.filter(
    (t) => t.workshopId === currentWs.id || t.workshopName.toLowerCase().includes(currentWs.name.toLowerCase())
  );

  const menuItems: { id: TallerSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'ordenes_taller',
      label: 'Órdenes en Taller',
      icon: <Wrench className="w-4 h-4" />,
      badge: `${orders.length}`,
    },
    {
      id: 'alistamiento_taller',
      label: 'Alistamiento PDI',
      icon: <UserCheck className="w-4 h-4" />,
      badge: 'Nuevo',
    },
    {
      id: 'solicitudes_garantia',
      label: 'Solicitudes Garantía',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: `${warranties.length}`,
    },
    {
      id: 'clientes_taller',
      label: 'Fichero Clientes',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'tecnicos',
      label: 'Equipo de Técnicos',
      icon: <Users className="w-4 h-4" />,
      badge: `${tallerTechs.length}`,
    },
    {
      id: 'inventario',
      label: 'Inventario / Repuestos',
      icon: <Package className="w-4 h-4" />,
    },
  ];

  const sectionTitles: Record<TallerSection, string> = {
    ordenes_taller: 'Bahías y Órdenes de Trabajo Activas',
    alistamiento_taller: 'Alistamiento PDI, Registro de Clientes y Motocicletas',
    solicitudes_garantia: 'Solicitudes de Garantía Técnicas hacia Matriz',
    clientes_taller: 'Fichero de Clientes de la Sucursal',
    tecnicos: 'Equipo de Mecánicos y Técnicos de la Sucursal',
    inventario: 'Inventario de Repuestos y Lubricantes',
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white text-zinc-900 overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* 1. HEADER */}
      <header className="h-16 shrink-0 w-full bg-blue-700 border-b border-blue-800 text-white shadow-md flex items-center justify-between px-6 z-30 select-none">
        <div className="w-72 shrink-0 flex items-center gap-3 pr-4">
          <div className="bg-white px-3 py-1 rounded-xl shadow-xs flex items-center justify-center shrink-0">
            <img
              src="/logoheader.webp"
              alt="StarMotos"
              className="h-7 w-auto object-contain"
            />
          </div>
          <span className="text-[10px] text-blue-200 font-mono tracking-widest uppercase font-bold">
            Jefe de Taller
          </span>
        </div>

        <div className="flex-1 flex items-center justify-between pl-6 border-l border-blue-600/60 min-w-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs text-blue-200 font-mono font-medium truncate">{currentWs.name} /</span>
            <h1 className="text-sm lg:text-base font-bold text-white tracking-tight truncate">
              {sectionTitles[activeSection]}
            </h1>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-800 border border-blue-600 text-xs text-blue-100 font-medium shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{currentWs.city} — Bahías Activas</span>
          </div>
        </div>
      </header>

      {/* 2. BODY */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <aside className="w-72 shrink-0 h-full bg-[#dce8f5] border-r border-[#b8d1ea] flex flex-col justify-between z-20 select-none shadow-xs">
          {/* Selector de Sucursal Activa */}
          <div className="shrink-0 p-3 bg-white/50 border-b border-[#b8d1ea]">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-blue-950/80 block mb-1">
              Sucursal Activa ({workshops.length} sedes):
            </label>
            <select
              value={currentWs.id}
              onChange={(e) => {
                setActiveWorkshopId(e.target.value);
                localStorage.setItem('starmotos_taller_active_ws', e.target.value);
              }}
              className="w-full text-xs font-bold bg-white border border-blue-400/80 rounded-xl px-2.5 py-1.5 text-zinc-900 shadow-xs cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              {workshops.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {w.province || w.city}
                </option>
              ))}
            </select>
          </div>

          {/* Info Jefe de Taller */}
          <div className="shrink-0 p-4 border-b border-[#b8d1ea] bg-white/40">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-indigo-700 text-white font-black text-sm flex items-center justify-center border-2 border-blue-600 shadow-xs shrink-0">
                TAL
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-zinc-900 truncate">{currentWs.manager}</h3>
                <p className="text-[10px] text-zinc-600 font-mono truncate">{currentWs.code} • {currentWs.city}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span className="text-[10px] text-indigo-900 font-bold truncate">Bahía {currentWs.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menú */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-950/70 px-3 py-1 block">
              Módulos del Taller
            </span>
            {menuItems.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-800 hover:bg-white/60 hover:text-blue-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-white' : 'text-blue-700'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && item.badge !== '' ? (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        active
                          ? 'bg-white text-blue-700'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="shrink-0 p-3.5 border-t border-[#b8d1ea] space-y-2 bg-[#dce8f5]">
            <div className="px-3 py-2 rounded-xl bg-white/70 border border-[#b8d1ea] text-xs text-zinc-700 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span className="truncate">{currentWs.name}</span>
              </div>
              <p className="truncate text-zinc-600 text-[11px] mt-0.5">{currentWs.address}</p>
              {currentWs.reference && (
                <p className="text-[10px] text-amber-800 truncate mt-0.5 font-medium">📍 {currentWs.reference}</p>
              )}
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-red-50 border border-zinc-300 hover:border-red-300 text-zinc-800 hover:text-red-700 text-xs font-bold transition active:scale-98 cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 w-full bg-white">
          <div className="w-full">
            {activeSection === 'ordenes_taller' && (
              <OrdenesTallerDesktop orders={orders} onUpdateOrderStatus={onUpdateOrderStatus} />
            )}
            {activeSection === 'alistamiento_taller' && (
              <AlistamientoWizard
                defaultAtendidoPor={currentWs.manager}
                defaultSede={currentWs.name}
                defaultSedeId={currentWs.id}
                technicians={technicians}
                origins={origins}
                workshops={workshops}
                onAddTechnician={onAddTechnician}
                onAddOrigin={onAddOrigin}
                onSaveRecord={onSaveFullAlistamiento}
              />
            )}
            {activeSection === 'solicitudes_garantia' && (
              <SolicitudesGarantiaTallerDesktop
                warranties={warranties}
                newForm={newWarrantyForm}
                setNewForm={setNewWarrantyForm}
                onCreateRequest={onCreateWarrantyRequest}
              />
            )}
            {activeSection === 'clientes_taller' && <ClientesTallerDesktop clients={clients} />}
            {activeSection === 'tecnicos' && (
              <TecnicosDesktop
                technicians={technicians}
                workshops={workshops}
                onAddTechnician={onAddTechnician}
                currentWorkshopId={currentWs.id}
              />
            )}
            {activeSection === 'inventario' && <InventarioDesktop inventory={inventory} />}
          </div>
        </main>
      </div>
    </div>
  );
};
