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
  Bell,
  Building2,
  User,
} from 'lucide-react';
import {
  TallerSection,
  TallerSectionMobile,
  TallerOrder,
  WarrantyRequest,
  TallerClient,
  InventoryItem,
  WorkOrderStatus,
  Technician,
  AlistamientoFullRecord,
  Workshop,
  SystemAlert,
} from '../../../types/customer';
import { OrdenesTallerMobile } from './OrdenesTallerMobile';
import { SolicitudesGarantiaTallerMobile } from './SolicitudesGarantiaTallerMobile';
import { ClientesTallerMobile } from './ClientesTallerMobile';
import { InventarioMobile } from './InventarioMobile';
import { AlistamientoWizardMobile } from '../common/AlistamientoWizardMobile';
import { ClientesModuleMobile } from '../common/ClientesModuleMobile';
import { TecnicosMobile } from '../common/TecnicosMobile';
import { AlertasMobile } from '../admin/AlertasMobile';
import { PerfilTallerMobile } from './PerfilTallerMobile';
import { NotificationsPopover } from '../../common/NotificationsPopover';

interface Props {
  activeSection: TallerSectionMobile;
  setActiveSection: (section: TallerSectionMobile) => void;
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
  onDeleteTechnician?: (id: string) => void;
  onAddOrigin: (origin: string) => void;
  onSaveFullAlistamiento: (record: AlistamientoFullRecord) => void;
  newWarrantyForm: any;
  setNewWarrantyForm: React.Dispatch<React.SetStateAction<any>>;
  onCreateWarrantyRequest: (directReq?: WarrantyRequest) => boolean;
  alerts: SystemAlert[];
  onMarkAlertAsRead: (id: string) => void;
  onMarkAllAlertsAsRead: () => void;
  onDeleteAlert?: (id: string) => void;
  onDeleteAllReadAlerts?: () => void;
  currentWorkshop?: Workshop;
  onUpdateWorkshop?: (updated: Partial<Workshop>) => void;
  isMatriz?: boolean;
  selectedWorkshopFilter?: string;
  onSelectWorkshopFilter?: (wsId: string) => void;
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
  alerts,
  onMarkAlertAsRead,
  onMarkAllAlertsAsRead,
  onDeleteAlert,
  onDeleteAllReadAlerts,
  currentWorkshop,
  onUpdateWorkshop,
  onDeleteTechnician,
  isMatriz = false,
  selectedWorkshopFilter = 'all',
  onSelectWorkshopFilter,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeWorkshopId] = useState<string>(() => {
    return localStorage.getItem('starmotos_taller_active_ws') || 'matriz-la-mana';
  });

  const currentWs =
    currentWorkshop ||
    workshops.find((w) => w.id === activeWorkshopId) ||
    workshops.find((w) => w.id === 'matriz-la-mana') ||
    workshops[0];

  const menuItems: { id: TallerSectionMobile; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'perfil_taller', label: 'Mi Perfil de Sede', icon: <User className="w-4 h-4" /> },
    { id: 'ordenes_taller', label: 'Órdenes en Taller', icon: <Wrench className="w-4 h-4" />, badge: `${orders.length}` },
    { id: 'alistamiento_taller', label: 'Alistamiento PDI', icon: <UserCheck className="w-4 h-4" />, badge: 'Nuevo' },
    { id: 'solicitudes_garantia', label: 'Solicitudes Garantía', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'clientes_taller', label: 'Clientes', icon: <Users className="w-4 h-4" /> },
    { id: 'tecnicos', label: 'Técnicos', icon: <Users className="w-4 h-4" /> },
    { id: 'inventario', label: 'Inventario', icon: <Package className="w-4 h-4" /> },
    {
      id: 'alertas_taller',
      label: 'Alertas & Eventos',
      icon: <Bell className="w-4 h-4" />,
      badge: alerts.filter((a) => !a.read).length > 0 ? String(alerts.filter((a) => !a.read).length) : undefined,
    },
  ];

  const sectionTitles: Record<TallerSectionMobile, string> = {
    ordenes_taller: 'Órdenes en Taller',
    alistamiento_taller: 'Alistamiento PDI',
    solicitudes_garantia: 'Solicitudes Garantía',
    clientes_taller: 'Clientes Taller',
    tecnicos: 'Equipo Técnico',
    inventario: 'Inventario Repuestos',
    alertas_taller: 'Alertas & Eventos',
    perfil_taller: 'Perfil de Sede',
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

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white truncate max-w-[110px]">
            {sectionTitles[activeSection]}
          </span>
          <NotificationsPopover
            role="taller"
            workshopId={currentWorkshop?.id}
            alerts={alerts}
            warranties={warranties}
            orders={orders}
            onViewAll={() => {
              setActiveSection('alertas_taller');
              setDrawerOpen(false);
            }}
            onMarkAlertAsRead={onMarkAlertAsRead}
            onMarkAllAlertsAsRead={onMarkAllAlertsAsRead}
            onDeleteAlert={onDeleteAlert}
            onDeleteAllReadAlerts={onDeleteAllReadAlerts}
          />
        </div>
      </header>

      {/* Barra de Sede para Matriz Central en Móvil */}
      {isMatriz && workshops && workshops.length > 0 && (
        <div className="bg-blue-800 text-white px-4 py-2 flex items-center justify-between text-xs border-t border-blue-600 shadow-inner">
          <div className="flex items-center gap-1.5 font-bold">
            <Building2 className="w-3.5 h-3.5 text-blue-200" />
            <span>Sede:</span>
          </div>
          <select
            value={selectedWorkshopFilter || 'all'}
            onChange={(e) => onSelectWorkshopFilter?.(e.target.value)}
            className="bg-blue-900 border border-blue-400 rounded-lg px-2 py-1 text-white font-bold text-xs outline-none max-w-[230px] truncate"
          >
            <option value="all">🏢 Todas las Sedes (Red Nacional)</option>
            {workshops.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      )}

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

              {/* Sede Oficial Asignada - Acceso Exclusivo de Taller */}
              <div className="mt-3 p-2.5 bg-white/80 rounded-xl border border-blue-200 shadow-2xs">
                <div className="flex items-center justify-between text-blue-900 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-700" />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Sede Oficial
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[8px] font-black bg-blue-100 text-blue-800 rounded uppercase">
                    Exclusivo
                  </span>
                </div>
                <h5 className="text-xs font-black text-zinc-900 truncate">
                  {currentWs.name}
                </h5>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  Código: {currentWs.code} • {currentWs.city}
                </p>
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
          <AlistamientoWizardMobile
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
            isMatriz={isMatriz}
          />
        )}
        {activeSection === 'solicitudes_garantia' && (
          <SolicitudesGarantiaTallerMobile
            warranties={warranties}
            clients={clients}
            currentWorkshopName={currentWs.name}
            currentWorkshopId={currentWs.id}
            newForm={newWarrantyForm}
            setNewForm={setNewWarrantyForm}
            onCreateRequest={onCreateWarrantyRequest}
          />
        )}
        {activeSection === 'clientes_taller' && (
          <ClientesModuleMobile
            role="taller"
            currentWorkshopId={currentWs.id}
            workshops={workshops}
            fullAlistamientos={fullAlistamientos}
            clients={clients}
            warranties={warranties}
            isMatriz={isMatriz}
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
            onDeleteTechnician={onDeleteTechnician}
            currentWorkshopId={currentWs.id}
          />
        )}
        {activeSection === 'inventario' && <InventarioMobile inventory={inventory} />}
        {activeSection === 'alertas_taller' && (
          <AlertasMobile
            alerts={alerts}
            onMarkAsRead={onMarkAlertAsRead}
            onMarkAllAsRead={onMarkAllAlertsAsRead}
            onDeleteAlert={onDeleteAlert}
            onDeleteAllReadAlerts={onDeleteAllReadAlerts}
          />
        )}
        {activeSection === 'perfil_taller' && (
          <PerfilTallerMobile
            workshop={currentWs}
            onUpdateWorkshop={onUpdateWorkshop || (() => {})}
          />
        )}
      </main>
    </div>
  );
};
