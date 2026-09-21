// src/components/mobile/taller/TallerViewMobile.tsx
import React, { useState } from 'react';
import {
  Menu,
  X,
  Wrench,
  ShieldAlert,
  Users,
  Package,
  LogOut,
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
import { OrdenesTallerMobile } from './OrdenesTallerMobile';
import { SolicitudesGarantiaTallerMobile } from './SolicitudesGarantiaTallerMobile';
import { ClientesTallerMobile } from './ClientesTallerMobile';
import { InventarioMobile } from './InventarioMobile';
import { AlistamientoWizard } from '../../common/AlistamientoWizard';
import { ClientesModule } from '../../common/ClientesModule';
import { TecnicosMobile } from '../common/TecnicosMobile';

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

export const TallerViewMobile: React.FC<Props> = ({
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeWorkshopId, setActiveWorkshopId] = useState<string>(() => {
    return localStorage.getItem('starmotos_taller_active_ws') || 'taller-quevedo';
  });

  const currentWs =
    workshops.find((w) => w.id === activeWorkshopId) ||
    workshops.find((w) => w.id === 'taller-quevedo') ||
    workshops[0];

  const menuItems: { id: TallerSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'ordenes_taller', label: 'Órdenes en Taller', icon: <Wrench className="w-4 h-4" />, badge: `${orders.length}` },
    { id: 'alistamiento_taller', label: 'Alistamiento PDI', icon: <UserCheck className="w-4 h-4" />, badge: 'Nuevo' },
    { id: 'solicitudes_garantia', label: 'Solicitudes Garantía', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'clientes_taller', label: 'Clientes', icon: <Users className="w-4 h-4" /> },
    { id: 'tecnicos', label: 'Técnicos', icon: <Users className="w-4 h-4" /> },
    { id: 'inventario', label: 'Inventario', icon: <Package className="w-4 h-4" /> },
  ];

  const sectionTitles: Record<TallerSection, string> = {
    ordenes_taller: 'Órdenes en Taller',
    alistamiento_taller: 'Alistamiento PDI',
    solicitudes_garantia: 'Solicitudes Garantía',
    clientes_taller: 'Clientes Taller',
    tecnicos: 'Equipo Técnico',
    inventario: 'Inventario Repuestos',
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased">
      <header className="sticky top-0 z-40 bg-blue-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="bg-white px-2 py-0.5 rounded-lg shadow-xs flex items-center justify-center shrink-0">
            <img
              src="/logoheader.webp"
              alt="StarMotos"
              className="h-5 w-auto object-contain"
            />
          </div>
          <span className="text-[9px] text-blue-200 uppercase font-mono font-bold truncate max-w-[110px]">
            {currentWs.name.replace('StarMotos ', '')}
          </span>
        </div>

        <span className="text-xs font-bold text-white truncate max-w-[130px]">
          {sectionTitles[activeSection]}
        </span>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] h-full bg-[#dce8f5] border-r border-[#b8d1ea] flex flex-col justify-between shadow-2xl z-10 p-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#b8d1ea]">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 truncate">{currentWs.manager}</h4>
                  <p className="text-[10px] text-zinc-600 truncate">{currentWs.name}</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="p-1 rounded-lg bg-white text-zinc-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selector de Sucursal Móvil */}
              <div className="mt-3 p-2.5 bg-white/70 rounded-xl border border-blue-200">
                <span className="text-[9px] font-bold text-blue-900 uppercase block mb-1">
                  Cambiar Sucursal ({workshops.length} sedes):
                </span>
                <select
                  value={currentWs.id}
                  onChange={(e) => {
                    setActiveWorkshopId(e.target.value);
                    localStorage.setItem('starmotos_taller_active_ws', e.target.value);
                  }}
                  className="w-full text-xs font-bold bg-white border border-blue-300 rounded-lg px-2 py-1 text-zinc-900"
                >
                  {workshops.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <nav className="mt-4 space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                      activeSection === item.id ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-800 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-3 border-t border-[#b8d1ea] space-y-2">
              <div className="text-[10px] text-zinc-600 p-2 bg-white/50 rounded-lg">
                <p className="font-bold text-zinc-800 truncate">{currentWs.address}</p>
                {currentWs.reference && <p className="text-zinc-500 truncate mt-0.5">Ref: {currentWs.reference}</p>}
                <p className="text-emerald-700 font-mono mt-0.5">{currentWs.phone}</p>
              </div>

              <button
                onClick={onLogout}
                className="w-full py-2 bg-white text-red-600 border border-zinc-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="max-w-md mx-auto px-4 py-4">
        {activeSection === 'ordenes_taller' && (
          <OrdenesTallerMobile orders={orders} onUpdateOrderStatus={onUpdateOrderStatus} />
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
            recentRecords={fullAlistamientos}
          />
        )}
        {activeSection === 'solicitudes_garantia' && (
          <SolicitudesGarantiaTallerMobile
            warranties={warranties}
            newForm={newWarrantyForm}
            setNewForm={setNewWarrantyForm}
            onCreateRequest={onCreateWarrantyRequest}
          />
        )}
        {activeSection === 'clientes_taller' && (
          <ClientesModule
            role="taller"
            currentWorkshopId={currentWs.id}
            workshops={workshops}
            fullAlistamientos={fullAlistamientos}
            clients={clients}
            warranties={warranties}
            onNavigateToAlistamiento={() => {
              setActiveSection('alistamiento_taller');
            }}
          />
        )}
        {activeSection === 'tecnicos' && (
          <TecnicosMobile
            technicians={technicians}
            workshops={workshops}
            onAddTechnician={onAddTechnician}
            currentWorkshopId={currentWs.id}
          />
        )}
        {activeSection === 'inventario' && <InventarioMobile inventory={inventory} />}
      </main>
    </div>
  );
};
