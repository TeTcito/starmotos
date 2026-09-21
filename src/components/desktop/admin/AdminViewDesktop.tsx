// src/components/desktop/admin/AdminViewDesktop.tsx
import React from 'react';
import {
  Building2,
  UserCheck,
  ShieldCheck,
  Receipt,
  Bell,
  LogOut,
  MapPin,
  ChevronRight,
  Sparkles,
  Wrench,
} from 'lucide-react';
import {
  AdminSection,
  Workshop,
  WarrantyRequest,
  SystemAlert,
  AdminInvoice,
  AlistamientoClient,
  AlistamientoMotorcycle,
  AlistamientoService,
  Technician,
  AlistamientoFullRecord,
} from '../../../types/customer';
import { TalleresDesktop } from './TalleresDesktop';
import { AlistamientoWizard } from '../../common/AlistamientoWizard';
import { TecnicosDesktop } from '../common/TecnicosDesktop';
import { GarantiasAdminDesktop } from './GarantiasAdminDesktop';
import { FacturacionDesktop } from './FacturacionDesktop';
import { AlertasDesktop } from './AlertasDesktop';

interface Props {
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
  onLogout: () => void;
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
  onAddTechnician: (tech: Omit<Technician, 'id' | 'activeOrdersCount'>) => void;
  onAddOrigin: (origin: string) => void;
  onSaveFullAlistamiento: (record: AlistamientoFullRecord) => void;
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

export const AdminViewDesktop: React.FC<Props> = ({
  activeSection,
  setActiveSection,
  onLogout,
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
  onAddTechnician,
  onAddOrigin,
  onSaveFullAlistamiento,
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
  const menuItems: { id: AdminSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'talleres',
      label: 'Control de Talleres',
      icon: <Building2 className="w-4 h-4" />,
      badge: `${workshops.length}`,
    },
    {
      id: 'alistamiento',
      label: 'Alistamiento (SRI)',
      icon: <UserCheck className="w-4 h-4" />,
      badge: 'Nuevo',
    },
    {
      id: 'tecnicos',
      label: 'Equipo de Técnicos',
      icon: <Wrench className="w-4 h-4" />,
      badge: `${technicians.length}`,
    },
    {
      id: 'garantias_admin',
      label: 'Garantías & Pólizas',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: `${warranties.filter((w) => w.status === 'enviada_matriz').length || ''}`,
    },
    {
      id: 'facturacion',
      label: 'Facturación SRI',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'alertas',
      label: 'Alertas & Eventos',
      icon: <Bell className="w-4 h-4" />,
      badge: `${alerts.filter((a) => !a.read).length || ''}`,
    },
  ];

  const sectionTitles: Record<AdminSection, string> = {
    talleres: 'Control Operativo de Talleres & Sucursales',
    alistamiento: 'Alistamiento de Clientes y Motos (Consulta SRI)',
    tecnicos: 'Gestión y Despacho del Equipo Técnico',
    garantias_admin: 'Gestión y Auditoría de Garantías',
    facturacion: 'Facturación Electrónica SRI',
    alertas: 'Centro de Alertas del Sistema',
  };

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="flex flex-col h-screen w-full bg-white text-zinc-900 overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* 1. HEADER SUPERIOR UNIFICADO */}
      <header className="h-16 shrink-0 w-full bg-blue-700 border-b border-blue-800 text-white shadow-md flex items-center justify-between px-6 z-30 select-none">
        {/* Lado Izquierdo con Logo */}
        <div className="w-72 shrink-0 flex items-center gap-3 pr-4">
          <div className="bg-white px-3 py-1 rounded-xl shadow-xs flex items-center justify-center shrink-0">
            <img
              src="/logoheader.webp"
              alt="StarMotos"
              className="h-7 w-auto object-contain"
            />
          </div>
          <span className="text-[10px] text-blue-200 font-mono tracking-widest uppercase font-bold">
            Matriz Central
          </span>
        </div>

        {/* Lado Derecho */}
        <div className="flex-1 flex items-center justify-between pl-6 border-l border-blue-600/60 min-w-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs text-blue-200 font-mono font-medium">Matriz Central /</span>
            <h1 className="text-sm lg:text-base font-bold text-white tracking-tight truncate">
              {sectionTitles[activeSection]}
            </h1>
          </div>

          <div className="flex items-center gap-3.5 shrink-0">
            <button
              onClick={() => setActiveSection('alertas')}
              className="relative p-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-blue-100 hover:text-white transition cursor-pointer"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-800 border border-blue-600 text-xs text-blue-100 font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Matriz Central Quito</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. CUERPO PRINCIPAL */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* BARRA LATERAL IZQUIERDA FIJA */}
        <aside className="w-72 shrink-0 h-full bg-[#dce8f5] border-r border-[#b8d1ea] flex flex-col justify-between z-20 select-none shadow-xs">
          {/* Tarjeta de Usuario Matriz */}
          <div className="shrink-0 p-4 border-b border-[#b8d1ea] bg-white/40">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-700 text-white font-black text-sm flex items-center justify-center border-2 border-blue-600 shadow-xs shrink-0">
                ADM
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-zinc-900 truncate">Ing. Mateo Enríquez</h3>
                <p className="text-[10px] text-zinc-600 font-mono">Gerencia de Operaciones</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="text-[10px] text-blue-900 font-bold">Admin Matriz</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menú de Navegación Vertical */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-950/70 px-3 py-1 block">
              Módulos Matriz
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

          {/* Footer del Sidebar */}
          <div className="shrink-0 p-3.5 border-t border-[#b8d1ea] space-y-2 bg-[#dce8f5]">
            <div className="px-3 py-2 rounded-xl bg-white/70 border border-[#b8d1ea] text-xs text-zinc-700 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span className="truncate">Sede Matriz Central</span>
              </div>
              <p className="truncate text-zinc-600 text-[11px] mt-0.5">Av. 10 de Agosto N31-154</p>
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
            {activeSection === 'talleres' && <TalleresDesktop workshops={workshops} />}
            {activeSection === 'alistamiento' && (
              <AlistamientoWizard
                defaultAtendidoPor="Ing. Mateo Enríquez"
                defaultSede="StarMotos Matriz Central"
                defaultSedeId="matriz"
                technicians={technicians}
                origins={origins}
                workshops={workshops}
                onAddTechnician={onAddTechnician}
                onAddOrigin={onAddOrigin}
                onSaveRecord={onSaveFullAlistamiento}
              />
            )}
            {activeSection === 'tecnicos' && (
              <TecnicosDesktop
                technicians={technicians}
                workshops={workshops}
                onAddTechnician={onAddTechnician}
                isMatriz={true}
              />
            )}
            {activeSection === 'garantias_admin' && (
              <GarantiasAdminDesktop
                warranties={warranties}
                onValidateWarranty={onValidateWarranty}
                onSendToGarante={onSendToGarante}
                onCompleteRepair={onCompleteRepair}
              />
            )}
            {activeSection === 'facturacion' && <FacturacionDesktop invoices={invoices} />}
            {activeSection === 'alertas' && (
              <AlertasDesktop
                alerts={alerts}
                onMarkAsRead={onMarkAlertAsRead}
                onMarkAllAsRead={onMarkAllAlertsAsRead}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
