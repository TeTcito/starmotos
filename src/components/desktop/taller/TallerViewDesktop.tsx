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
  ArrowLeft,
  Bell,
  Building2,
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
  SystemAlert,
} from '../../../types/customer';
import { OrdenesTallerDesktop } from './OrdenesTallerDesktop';
import { SolicitudesGarantiaTallerDesktop } from './SolicitudesGarantiaTallerDesktop';
import { ClientesTallerDesktop } from './ClientesTallerDesktop';
import { InventarioDesktop } from './InventarioDesktop';
import { AlistamientoWizard } from '../../common/AlistamientoWizard';
import { ClientesModule } from '../../common/ClientesModule';
import { TecnicosDesktop } from '../common/TecnicosDesktop';
import { AlertasDesktop } from '../admin/AlertasDesktop';
import { PerfilTallerDesktop } from './PerfilTallerDesktop';
import { NotificationsPopover } from '../../common/NotificationsPopover';

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
  rawFullAlistamientos?: AlistamientoFullRecord[];
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
  rawFullAlistamientos,
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
  const [alistamientoViewMode, setAlistamientoViewMode] = React.useState<'list' | 'form'>('list');

  const currentWs =
    currentWorkshop ||
    workshops.find((w) => w.id === localStorage.getItem('starmotos_taller_active_ws')) ||
    workshops.find((w) => w.id === 'matriz-la-mana') ||
    workshops[0];

  const tallerTechs = isMatriz && selectedWorkshopFilter === 'all'
    ? technicians
    : technicians.filter(
        (t) => t.workshopId === currentWs.id || t.workshopName.toLowerCase().includes(currentWs.name.toLowerCase())
      );

  const menuItems: { id: TallerSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'perfil_taller',
      label: 'Perfil de Sede',
      icon: <Building2 className="w-4 h-4" />,
    },
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
    {
      id: 'alertas_taller',
      label: 'Alertas & Eventos',
      icon: <Bell className="w-4 h-4" />,
      badge: alerts.filter((a) => !a.read).length > 0 ? String(alerts.filter((a) => !a.read).length) : undefined,
    },
  ];

  const sectionTitles: Record<TallerSection, string> = {
    perfil_taller: 'Perfil y Datos de la Sede Oficial',
    ordenes_taller: 'Bahías y Órdenes de Trabajo Activas',
    alistamiento_taller: 'Alistamiento PDI, Registro de Clientes y Motocicletas',
    solicitudes_garantia: 'Solicitudes de Garantía Técnicas hacia Matriz',
    clientes_taller: 'Fichero de Clientes de la Sucursal',
    tecnicos: 'Equipo de Mecánicos y Técnicos de la Sucursal',
    inventario: 'Inventario de Repuestos y Lubricantes',
    alertas_taller: 'Centro de Notificaciones & Alertas del Taller',
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

          <div className="flex items-center gap-3.5 shrink-0">
            {activeSection === 'alistamiento_taller' && alistamientoViewMode === 'form' && (
              <button
                type="button"
                onClick={() => setAlistamientoViewMode('list')}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-blue-800 hover:bg-blue-900 border border-blue-400 text-xs text-white font-bold shadow-xs transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Regresar al Listado</span>
              </button>
            )}

            {/* Selector de Sede Global para Matriz */}
            {isMatriz && workshops && workshops.length > 0 && (
              <div className="flex items-center gap-1.5 bg-blue-800/90 border border-blue-400/80 rounded-xl px-2.5 py-1 text-xs text-white shadow-xs">
                <Building2 className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                <span className="font-bold text-blue-100 hidden 2xl:inline">Sede:</span>
                <select
                  value={selectedWorkshopFilter || 'all'}
                  onChange={(e) => onSelectWorkshopFilter?.(e.target.value)}
                  className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="text-zinc-900 bg-white">🏢 Todas las Sedes (Red Nacional)</option>
                  {workshops.map((w) => (
                    <option key={w.id} value={w.id} className="text-zinc-900 bg-white">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <NotificationsPopover
              role="taller"
              workshopId={currentWs.id}
              alerts={alerts}
              warranties={warranties}
              orders={orders}
              onViewAll={() => setActiveSection('alertas_taller')}
              onMarkAlertAsRead={onMarkAlertAsRead}
              onMarkAllAlertsAsRead={onMarkAllAlertsAsRead}
              onDeleteAlert={onDeleteAlert}
              onDeleteAllReadAlerts={onDeleteAllReadAlerts}
            />

            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-800 border border-blue-600 text-xs text-blue-100 font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentWs.name}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-300 font-semibold shadow-xs" title="Conectado en tiempo real con Supabase Cloud">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>BD Nube Activa</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <aside className="w-72 shrink-0 h-full bg-[#dce8f5] border-r border-[#b8d1ea] flex flex-col justify-between z-20 select-none shadow-xs">
          {/* Sede Oficial Asignada - Acceso Exclusivo de Taller */}
          <div className="shrink-0 p-3 bg-white/70 border-b border-[#b8d1ea]">
            <div className="flex items-center justify-between text-blue-950 mb-1">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-700" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Sede Oficial Asignada
                </span>
              </div>
              <span className="px-1.5 py-0.5 text-[8px] font-black bg-blue-100 text-blue-800 rounded uppercase">
                Exclusivo
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-blue-200/80 shadow-2xs">
              <h5 className="text-xs font-black text-zinc-900 truncate">
                {currentWs.name}
              </h5>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                Código: {currentWs.code} • {currentWs.city}
              </p>
            </div>
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
        <main
          className={`flex-1 w-full bg-white ${
            activeSection === 'clientes_taller'
              ? 'overflow-hidden flex flex-col p-4'
              : 'overflow-y-auto px-4 sm:px-6 lg:px-8 py-5'
          }`}
        >
          <div
            className={`w-full ${
              activeSection === 'clientes_taller'
                ? 'flex-1 min-h-0 flex flex-col'
                : ''
            }`}
          >
            {activeSection === 'perfil_taller' && (
              <PerfilTallerDesktop
                workshop={currentWs}
                onUpdateWorkshop={onUpdateWorkshop || (() => {})}
              />
            )}
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
                recentRecords={isMatriz && rawFullAlistamientos ? rawFullAlistamientos : fullAlistamientos}
                viewMode={alistamientoViewMode}
                onViewModeChange={setAlistamientoViewMode}
                isMatriz={isMatriz}
                selectedWorkshopFilter={selectedWorkshopFilter}
                onSelectWorkshopFilter={onSelectWorkshopFilter}
              />
            )}
            {activeSection === 'solicitudes_garantia' && (
              <SolicitudesGarantiaTallerDesktop
                warranties={warranties}
                newForm={newWarrantyForm}
                setNewForm={setNewWarrantyForm}
                onCreateRequest={onCreateWarrantyRequest}
                clients={clients}
                currentWorkshop={currentWs}
              />
            )}
            {activeSection === 'clientes_taller' && (
              <ClientesModule
                role="taller"
                currentWorkshopId={currentWs.id}
                workshops={workshops}
                fullAlistamientos={isMatriz && rawFullAlistamientos ? rawFullAlistamientos : fullAlistamientos}
                clients={clients}
                warranties={warranties}
                isMatriz={isMatriz}
                onNavigateToAlistamiento={() => {
                  setActiveSection('alistamiento_taller');
                  setAlistamientoViewMode('form');
                }}
              />
            )}
            {activeSection === 'tecnicos' && (
              <TecnicosDesktop
                technicians={technicians}
                workshops={workshops}
                onAddTechnician={onAddTechnician}
                onDeleteTechnician={onDeleteTechnician}
                currentWorkshopId={currentWs.id}
                isMatriz={isMatriz}
              />
            )}
            {activeSection === 'inventario' && <InventarioDesktop inventory={inventory} />}
            {activeSection === 'alertas_taller' && (
              <AlertasDesktop
                alerts={alerts}
                onMarkAsRead={onMarkAlertAsRead}
                onMarkAllAsRead={onMarkAllAlertsAsRead}
                onDeleteAlert={onDeleteAlert}
                onDeleteAllReadAlerts={onDeleteAllReadAlerts}
                title="Centro de Notificaciones & Alertas del Taller"
                subtitle={`Registro en vivo de eventos operacionales, órdenes y garantías para ${currentWs.name}.`}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
