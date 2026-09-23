// src/components/mobile/admin/AdminViewMobile.tsx
import React, { useState } from 'react';
import {
  Menu,
  X,
  Building2,
  UserCheck,
  ShieldCheck,
  Receipt,
  Bell,
  LogOut,
  MapPin,
  ChevronRight,
  Wrench,
  Users,
  User,
} from 'lucide-react';
import {
  AdminSection,
  AdminSectionMobile,
  Workshop,
  WarrantyRequest,
  SystemAlert,
  AdminInvoice,
  AlistamientoClient,
  AlistamientoMotorcycle,
  AlistamientoService,
  Technician,
  AlistamientoFullRecord,
  TallerClient,
  WarrantyRequestStatus,
  TallerOrder,
  InventoryItem,
  AdminProfile,
} from '../../../types/customer';
import { TalleresMobile } from './TalleresMobile';
import { AlistamientoWizardMobile } from '../common/AlistamientoWizardMobile';
import { ClientesModuleMobile } from '../common/ClientesModuleMobile';
import { TecnicosMobile } from '../common/TecnicosMobile';
import { GarantiasAdminMobile } from './GarantiasAdminMobile';
import { FacturacionMobile } from './FacturacionMobile';
import { AlertasMobile } from './AlertasMobile';
import { PerfilAdminMobile } from './PerfilAdminMobile';
import { NotificationsPopover } from '../../common/NotificationsPopover';

interface Props {
  activeSection: AdminSectionMobile;
  setActiveSection: (section: AdminSectionMobile) => void;
  onLogout: () => void;
  adminProfile?: AdminProfile;
  onUpdateProfile?: (updated: AdminProfile) => void;
  workshops: Workshop[];
  warranties: WarrantyRequest[];
  onValidateWarranty: (id: string, notes: string) => void;
  onSendToGarante: (id: string, notes?: string) => void;
  onCompleteRepair: (id: string, invoiceNumber?: string) => void;
  alerts: SystemAlert[];
  onMarkAlertAsRead: (id: string) => void;
  onMarkAllAlertsAsRead: () => void;
  invoices: AdminInvoice[];
  technicians: Technician[];
  origins: string[];
  fullAlistamientos: AlistamientoFullRecord[];
  clients: TallerClient[];
  orders: TallerOrder[];
  inventory: InventoryItem[];
  onAddTechnician: (tech: Omit<Technician, 'id' | 'activeOrdersCount'>) => void;
  onAddOrigin: (origin: string) => void;
  onSaveFullAlistamiento: (record: AlistamientoFullRecord) => void;
  onDeleteFullAlistamiento?: (id: string) => void;
  onDeleteClient?: (idOrCedula: string) => void;
  onDeleteWarranty?: (id: string) => void;
  onCreateWarranty?: (newReq: WarrantyRequest) => void;
  onQuickUpdateWarrantyStatus?: (id: string, status: WarrantyRequestStatus, notes?: string) => void;
  onDeleteAlert?: (id: string) => void;
  onDeleteAllReadAlerts?: () => void;
  alistamientoClient: AlistamientoClient;
  setAlistamientoClient: React.Dispatch<React.SetStateAction<AlistamientoClient>>;
  alistamientoMoto: AlistamientoMotorcycle;
  setAlistamientoMoto: React.Dispatch<React.SetStateAction<AlistamientoMotorcycle>>;
  alistamientoService: AlistamientoService;
  setAlistamientoService: React.Dispatch<React.SetStateAction<AlistamientoService>>;
  isSearchingSri: boolean;
  onSearchSri: (idNumber: string) => void;
  onSubmitAlistamiento: () => boolean;
}

export const AdminViewMobile: React.FC<Props> = ({
  activeSection,
  setActiveSection,
  onLogout,
  adminProfile,
  onUpdateProfile,
  workshops,
  warranties,
  onValidateWarranty,
  onSendToGarante,
  onCompleteRepair,
  alerts,
  onMarkAlertAsRead,
  onMarkAllAlertsAsRead,
  invoices,
  technicians,
  origins,
  fullAlistamientos,
  clients,
  orders,
  inventory,
  onAddTechnician,
  onAddOrigin,
  onSaveFullAlistamiento,
  onDeleteFullAlistamiento,
  onDeleteClient,
  onDeleteWarranty,
  onCreateWarranty,
  onQuickUpdateWarrantyStatus,
  onDeleteAlert,
  onDeleteAllReadAlerts,
  alistamientoClient,
  setAlistamientoClient,
  alistamientoMoto,
  setAlistamientoMoto,
  alistamientoService,
  setAlistamientoService,
  isSearchingSri,
  onSearchSri,
  onSubmitAlistamiento,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems: { id: AdminSectionMobile; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'talleres', label: 'Talleres', icon: <Building2 className="w-4 h-4" /> },
    { id: 'alistamiento', label: 'Alistamiento', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'clientes_admin', label: 'Clientes', icon: <Users className="w-4 h-4" /> },
    { id: 'tecnicos', label: 'Técnicos', icon: <Wrench className="w-4 h-4" />, badge: `${technicians.length}` },
    { id: 'garantias_admin', label: 'Garantías', icon: <ShieldCheck className="w-4 h-4" />, badge: `${warranties.filter((w) => w.status === 'en_revision' || w.status === 'enviada_matriz').length || ''}` },
    { id: 'facturacion', label: 'Facturación', icon: <Receipt className="w-4 h-4" /> },
    { id: 'alertas', label: 'Alertas', icon: <Bell className="w-4 h-4" />, badge: `${alerts.filter((a) => !a.read).length || ''}` },
    { id: 'perfil_admin', label: 'Mi Perfil', icon: <User className="w-4 h-4" /> },
  ];

  const sectionTitles: Record<AdminSectionMobile, string> = {
    talleres: 'Control de Talleres',
    alistamiento: 'Alistamiento & PDI',
    clientes_admin: 'Clientes & Flota',
    tecnicos: 'Equipo Técnico',
    garantias_admin: 'Garantías & Pólizas',
    facturacion: 'Facturación SRI',
    alertas: 'Alertas del Sistema',
    perfil_admin: 'Mi Perfil Oficial',
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased">
      {/* Navbar Móvil */}
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
          <span className="text-[9px] text-blue-200 uppercase font-mono font-bold hidden sm:inline">Matriz</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white truncate max-w-[130px]">
            {sectionTitles[activeSection]}
          </span>
          <NotificationsPopover
            role="admin"
            alerts={alerts}
            warranties={warranties}
            onViewAll={() => {
              setActiveSection('alertas');
              setDrawerOpen(false);
            }}
            onMarkAlertAsRead={onMarkAlertAsRead}
            onMarkAllAlertsAsRead={onMarkAllAlertsAsRead}
            onDeleteAlert={onDeleteAlert}
            onDeleteAllReadAlerts={onDeleteAllReadAlerts}
          />
        </div>
      </header>

      {/* Drawer Móvil */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full bg-[#dce8f5] border-r border-[#b8d1ea] flex flex-col justify-between shadow-2xl z-10 p-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#b8d1ea]">
                <span className="text-xs font-bold text-zinc-900 truncate max-w-[200px]">
                  {adminProfile?.fullName || 'Ing. Mateo Enríquez'} (Matriz)
                </span>
                <button onClick={() => setDrawerOpen(false)} className="p-1 rounded-lg bg-white text-zinc-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                      activeSection === item.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-zinc-800 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge !== '' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-3 border-t border-[#b8d1ea]">
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

      {/* Main Móvil */}
      <main className="max-w-md mx-auto px-4 py-4">
        {activeSection === 'talleres' && (
          <TalleresMobile
            workshops={workshops}
            warranties={warranties}
            fullAlistamientos={fullAlistamientos}
            clients={clients}
            technicians={technicians}
            orders={orders}
            inventory={inventory}
            invoices={invoices}
          />
        )}
        {activeSection === 'alistamiento' && (
          <AlistamientoWizardMobile
            defaultAtendidoPor="William Daniel Meza (Gerente)"
            defaultSede="StarMotos Matriz La Maná"
            defaultSedeId="matriz-la-mana"
            technicians={technicians}
            origins={origins}
            workshops={workshops}
            onAddTechnician={onAddTechnician}
            onAddOrigin={onAddOrigin}
            onSaveRecord={onSaveFullAlistamiento}
            onDeleteRecord={onDeleteFullAlistamiento}
            recentRecords={fullAlistamientos}
            isMatriz={true}
          />
        )}
        {activeSection === 'clientes_admin' && (
          <ClientesModuleMobile
            role="admin"
            workshops={workshops}
            fullAlistamientos={fullAlistamientos}
            clients={clients}
            warranties={warranties}
            onDeleteClient={onDeleteClient}
            onNavigateToAlistamiento={() => {
              setActiveSection('alistamiento');
            }}
          />
        )}
        {activeSection === 'tecnicos' && (
          <TecnicosMobile
            technicians={technicians}
            workshops={workshops}
            onAddTechnician={onAddTechnician}
            currentWorkshopId="matriz-la-mana"
            isMatriz={true}
          />
        )}
        {activeSection === 'garantias_admin' && (
          <GarantiasAdminMobile
            warranties={warranties}
            clients={clients}
            onValidateWarranty={onValidateWarranty}
            onSendToGarante={onSendToGarante}
            onCompleteRepair={onCompleteRepair}
            onCreateWarranty={onCreateWarranty}
            onDeleteWarranty={onDeleteWarranty}
            onQuickUpdateStatus={onQuickUpdateWarrantyStatus}
          />
        )}
        {activeSection === 'facturacion' && <FacturacionMobile invoices={invoices} />}
        {activeSection === 'alertas' && (
          <AlertasMobile
            alerts={alerts}
            onMarkAsRead={onMarkAlertAsRead}
            onMarkAllAsRead={onMarkAllAlertsAsRead}
            onDeleteAlert={onDeleteAlert}
            onDeleteAllReadAlerts={onDeleteAllReadAlerts}
          />
        )}
        {activeSection === 'perfil_admin' && (
          <PerfilAdminMobile
            profile={adminProfile || {
              id: 'admin_master',
              fullName: 'Ing. Mateo Enríquez',
              firstNames: 'Mateo',
              lastNames: 'Enríquez',
              email: 'admin@starmotos.com',
              phone: '0991234567',
              roleName: 'Administrador General de Matriz',
              organization: 'StarMotos Ecuador',
            }}
            onUpdateProfile={onUpdateProfile || (() => {})}
          />
        )}
      </main>
    </div>
  );
};
