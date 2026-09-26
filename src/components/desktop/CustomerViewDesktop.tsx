// src/components/desktop/CustomerViewDesktop.tsx
import React from 'react';
import {
  User,
  Wrench,
  Calendar,
  Clock,
  History,
  Sparkles,
  ChevronRight,
  MapPin,
  LogOut,
  PhoneCall,
  FileCheck,
  Receipt,
  CalendarPlus,
} from 'lucide-react';
import { WhatsAppIcon } from '../WhatsAppIcon';
import { ActiveSection } from '../SidebarDrawer';
import { EventsDesktop } from './EventsDesktop';
import { ScheduleAppointmentDesktop } from './ScheduleAppointmentDesktop';
import { ProfileDesktop } from './ProfileDesktop';
import { ActiveOrderDesktop } from './ActiveOrderDesktop';
import { HistoryDesktop } from './HistoryDesktop';
import { ModalPortal } from '../common/ModalPortal';
import { NotificationsPopover } from '../common/NotificationsPopover';
import {
  ClientProfile,
  MotorcycleClientData,
  ScheduledMaintenance,
  WorkOrder,
  MaintenanceRecord,
  WarrantyItem,
  Branch,
  TallerOrder,
} from '../../types/customer';

interface Props {
  profile: ClientProfile;
  updateProfile: (profile: ClientProfile) => void;
  motorcycle: MotorcycleClientData;
  updateMotorcycle: (motorcycle: MotorcycleClientData) => void;
  scheduledMaintenances: ScheduledMaintenance[];
  addScheduledMaintenance: (maintenance: ScheduledMaintenance) => void;
  activeOrder: WorkOrder;
  history: MaintenanceRecord[];
  warranties: WarrantyItem[];
  branches: Branch[];
  activeBranch: Branch;
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  logout: () => void;
  isApprovalModalOpen: boolean;
  setIsApprovalModalOpen: (open: boolean) => void;
  isApproving: boolean;
  approveQuotation: () => void;
  pendingRatingOrder?: TallerOrder | null;
  onOpenRatingModal?: () => void;
  onSubmitAbono?: (data: {
    alistamientoId?: string;
    monto: number;
    comprobanteUrl: string;
    bancoOrigen?: string;
    numeroComprobante?: string;
    notas?: string;
  }) => Promise<boolean>;
}

export const CustomerViewDesktop: React.FC<Props> = ({
  profile,
  updateProfile,
  motorcycle,
  updateMotorcycle,
  scheduledMaintenances,
  addScheduledMaintenance,
  activeOrder,
  history,
  warranties,
  branches,
  activeBranch,
  activeSection,
  setActiveSection,
  logout,
  isApprovalModalOpen,
  setIsApprovalModalOpen,
  isApproving,
  approveQuotation,
  pendingRatingOrder,
  onOpenRatingModal,
  onSubmitAbono,
}) => {
  const menuItems: { id: ActiveSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'perfil',
      label: 'Perfil del Cliente',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'orden_activa',
      label: 'Orden de Trabajo Activa',
      icon: <Clock className="w-4 h-4" />,
      badge: 'En Taller',
    },
    {
      id: 'agendar_cita',
      label: 'Agendar Cita',
      icon: <CalendarPlus className="w-4 h-4" />,
      badge: 'Turnos',
    },
    {
      id: 'eventos',
      label: 'Evento de Facturas',
      icon: <Receipt className="w-4 h-4" />,
      badge: 'SRI',
    },
    {
      id: 'historial',
      label: 'Historial de Servicios y Garantía de Pólizas',
      icon: <History className="w-4 h-4" />,
    },
  ];

  const sectionTitles: Record<ActiveSection, string> = {
    perfil: 'Perfil del Cliente',
    orden_activa: 'Orden de Trabajo Activa',
    agendar_cita: 'Agendar Cita Técnica en Taller',
    eventos: 'Eventos y Facturas',
    historial: 'Historial de Servicios y Garantía de Pólizas',
    mi_moto: 'Perfil del Cliente',
    mantenimientos: 'Agendar Cita Técnica',
    garantias: 'Historial de Servicios y Garantía de Pólizas',
  };

  const handleWhatsAppAdvisor = () => {
    const waNumber = activeBranch.whatsapp || '593939316698';
    const text = encodeURIComponent(
      `Hola StarMotos, soy ${profile.fullName}, cliente con moto ${motorcycle.brand} ${motorcycle.model} (${motorcycle.plate}). Deseo consultar sobre mi servicio técnico.`
    );
    window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white text-zinc-900 overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. HEADER SUPERIOR UNIFICADO DE ANCHO COMPLETO (MISMO TAMAÑO EN TODA LA PESTAÑA) */}
      {/* ========================================================================= */}
      <header className="h-16 shrink-0 w-full bg-blue-700 border-b border-blue-800 text-white shadow-md flex items-center justify-between px-6 z-30 select-none">
        {/* Lado Izquierdo: Ancho coordinado con el Sidebar (w-72) con Logo Oficial StarMotos */}
        <div className="w-72 shrink-0 flex items-center gap-3 pr-4">
          <div className="bg-white px-3 py-1 rounded-xl shadow-xs flex items-center justify-center shrink-0">
            <img
              src="/logoheader.webp"
              alt="StarMotos"
              className="h-7 w-auto object-contain"
            />
          </div>
          <span className="text-[10px] text-blue-200 font-mono tracking-widest uppercase font-bold">
            Portal Clientes
          </span>
        </div>

        {/* Lado Derecho: Breadcrumbs del módulo, Contactar Asesor y Sucursal */}
        <div className="flex-1 flex items-center justify-between pl-6 border-l border-blue-600/60 min-w-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs text-blue-200 font-mono font-medium">StarMotos /</span>
            <h1 className="text-sm lg:text-base font-bold text-white tracking-tight truncate">
              {sectionTitles[activeSection]}
            </h1>
          </div>

          <div className="flex items-center gap-3.5 shrink-0">
            {/* Botón de Notificaciones (Casos y Eventos) */}
            <NotificationsPopover
              role="cliente"
              customerActiveOrder={activeOrder}
              customerWarranties={warranties}
              customerHistory={history}
              onViewAll={() => setActiveSection('eventos')}
            />

            {/* Botón WhatsApp Taller */}
            <button
              onClick={handleWhatsAppAdvisor}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>Contactar Asesor</span>
            </button>

            {/* Sucursal actual */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-800 border border-blue-600 text-xs text-blue-100 font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{activeBranch.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. CUERPO PRINCIPAL: PANEL LATERAL AZULADO + CONTENIDO ALINEADO A LA IZQUIERDA */}
      {/* ========================================================================= */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* BARRA LATERAL IZQUIERDA FIJA: UN SOLO COLOR AZULADO (#dce8f5) */}
        <aside className="w-72 shrink-0 h-full bg-[#dce8f5] border-r border-[#b8d1ea] flex flex-col justify-between z-20 select-none shadow-xs">
          {/* Tarjeta de Resumen del Cliente: Nombre con un solo nombre y apellido */}
          <div className="shrink-0 p-4 border-b border-[#b8d1ea] bg-white/40">
            <div className="flex items-center gap-3">
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-11 h-11 rounded-full object-cover border-2 border-blue-600 shadow-xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-zinc-900 truncate">{profile.fullName}</h3>
                <p className="text-[10px] text-zinc-600 font-mono">C.I: {profile.idNumber}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-800 font-bold">Cliente Verificado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menú de Navegación Vertical */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-950/70 px-3 py-1 block">
              Módulos del Sistema
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

                  {item.badge ? (
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

          {/* Footer del Sidebar: Sucursal y Cierre de Sesión */}
          <div className="shrink-0 p-3.5 border-t border-[#b8d1ea] space-y-2 bg-[#dce8f5]">
            <div className="px-3 py-2 rounded-xl bg-white/70 border border-[#b8d1ea] text-xs text-zinc-700 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span className="truncate">{activeBranch.name.replace('StarMotos ', '')}</span>
              </div>
              <p className="truncate text-zinc-600 text-[11px] mt-0.5">{activeBranch.address}</p>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-red-50 border border-zinc-300 hover:border-red-300 text-zinc-800 hover:text-red-700 text-xs font-bold transition active:scale-98 cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL: ALINEADO A LA IZQUIERDA Y EXPANDIDO SIMÉTRICAMENTE */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 w-full bg-white">
          <div className="w-full">
            {activeSection === 'perfil' && (
              <ProfileDesktop
                profile={profile}
                onUpdateProfile={updateProfile}
                motorcycle={motorcycle}
                onUpdateMotorcycle={updateMotorcycle}
                branches={branches}
              />
            )}

            {activeSection === 'orden_activa' && (
              <ActiveOrderDesktop
                activeOrder={activeOrder}
                motorcycle={motorcycle}
                onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
                pendingRatingOrder={pendingRatingOrder}
                onOpenRatingModal={onOpenRatingModal}
              />
            )}

            {activeSection === 'agendar_cita' && (
              <ScheduleAppointmentDesktop
                motorcycle={motorcycle}
                profile={profile}
                branches={branches}
                scheduledMaintenances={scheduledMaintenances}
                onScheduleNewMaintenance={addScheduledMaintenance}
                onBack={() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    setActiveSection('perfil');
                  }
                }}
              />
            )}

            {activeSection === 'eventos' && (
              <EventsDesktop
                history={history}
                motorcycle={motorcycle}
                profile={profile}
                onSubmitAbono={onSubmitAbono}
              />
            )}

            {(activeSection === 'historial' || activeSection === 'garantias') && (
              <HistoryDesktop history={history} warranties={warranties} motorcycle={motorcycle} />
            )}

            {/* Fallbacks para compatibilidad con rutas guardadas en historial */}
            {activeSection === 'mi_moto' && (
              <ProfileDesktop
                profile={profile}
                onUpdateProfile={updateProfile}
                motorcycle={motorcycle}
                onUpdateMotorcycle={updateMotorcycle}
                branches={branches}
              />
            )}

            {activeSection === 'mantenimientos' && (
              <ScheduleAppointmentDesktop
                motorcycle={motorcycle}
                profile={profile}
                branches={branches}
                scheduledMaintenances={scheduledMaintenances}
                onScheduleNewMaintenance={addScheduledMaintenance}
                onBack={() => setActiveSection('perfil')}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modal Aprobación Presupuesto Escritorio */}
      <ModalPortal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-zinc-900">Autorizar Presupuesto de Reparación</h3>
          </div>
          <button
            onClick={() => setIsApprovalModalOpen(false)}
            className="text-zinc-400 hover:text-zinc-700 text-base font-bold cursor-pointer p-1"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2">
            <div className="flex justify-between text-zinc-600 text-sm">
              <span>Repuestos OEM:</span>
              <span className="font-mono text-zinc-900 font-medium">${activeOrder.quotation.subtotalParts.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-600 text-sm">
              <span>Mano de Obra Certificada:</span>
              <span className="font-mono text-zinc-900 font-medium">${activeOrder.quotation.subtotalServices.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-600 text-sm">
              <span>IVA 15%:</span>
              <span className="font-mono text-zinc-900 font-medium">${activeOrder.quotation.taxAmount.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-zinc-900 text-base">
              <span>Total Autorizado:</span>
              <span className="font-mono text-blue-600 text-lg">${activeOrder.quotation.total.toFixed(2)} USD</span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsApprovalModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-50 text-sm cursor-pointer transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={approveQuotation}
              disabled={isApproving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm cursor-pointer shadow-md shadow-blue-600/20 transition"
            >
              {isApproving ? 'Autorizando...' : 'Aprobar Presupuesto'}
            </button>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
};
