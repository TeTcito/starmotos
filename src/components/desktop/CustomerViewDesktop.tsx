// src/components/desktop/CustomerViewDesktop.tsx
import React from 'react';
import {
  User,
  Wrench,
  Calendar,
  Clock,
  ShieldCheck,
  History,
  Sparkles,
  ChevronRight,
  MapPin,
  LogOut,
  PhoneCall,
  FileCheck,
  MessageCircle,
} from 'lucide-react';
import { ActiveSection } from '../SidebarDrawer';
import { ProfileDesktop } from './ProfileDesktop';
import { MotorcycleDesktop } from './MotorcycleDesktop';
import { MaintenancesDesktop } from './MaintenancesDesktop';
import { ActiveOrderDesktop } from './ActiveOrderDesktop';
import { InspectionDesktop } from './InspectionDesktop';
import { HistoryDesktop } from './HistoryDesktop';
import { WarrantiesDesktop } from './WarrantiesDesktop';
import {
  ClientProfile,
  MotorcycleClientData,
  ScheduledMaintenance,
  WorkOrder,
  Inspection360,
  MaintenanceRecord,
  WarrantyItem,
  Branch,
} from '../../types/customer';

interface Props {
  profile: ClientProfile;
  updateProfile: (updated: ClientProfile) => void;
  motorcycle: MotorcycleClientData;
  updateMotorcycle: (updated: MotorcycleClientData) => void;
  scheduledMaintenances: ScheduledMaintenance[];
  addScheduledMaintenance: (maintenance: ScheduledMaintenance) => void;
  activeOrder: WorkOrder;
  inspection: Inspection360;
  history: MaintenanceRecord[];
  warranties: WarrantyItem[];
  branches: Branch[];
  activeBranch: Branch;
  activeSection: ActiveSection;
  setActiveSection: (sec: ActiveSection) => void;
  logout: () => void;
  isApprovalModalOpen: boolean;
  setIsApprovalModalOpen: (open: boolean) => void;
  isApproving: boolean;
  approveQuotation: () => void;
  activePhotoModal: { url: string; title: string } | null;
  setActivePhotoModal: (photo: { url: string; title: string } | null) => void;
}

export const CustomerViewDesktop: React.FC<Props> = ({
  profile,
  updateProfile,
  motorcycle,
  updateMotorcycle,
  scheduledMaintenances,
  addScheduledMaintenance,
  activeOrder,
  inspection,
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
  activePhotoModal,
  setActivePhotoModal,
}) => {
  const menuItems: { id: ActiveSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'perfil',
      label: 'Perfil del Cliente',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'mi_moto',
      label: 'Ficha de mi Moto',
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      id: 'mantenimientos',
      label: 'Mantenimientos y Citas',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'orden_activa',
      label: 'Orden de Trabajo Activa',
      icon: <Clock className="w-4 h-4" />,
      badge: 'En Taller',
    },
    {
      id: 'inspeccion',
      label: 'Inspección 360°',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'historial',
      label: 'Historial de Servicios',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'garantias',
      label: 'Garantías y Pólizas',
      icon: <Sparkles className="w-4 h-4" />,
    },
  ];

  const sectionTitles: Record<ActiveSection, string> = {
    perfil: 'Perfil del Cliente',
    mi_moto: 'Ficha de mi Moto',
    mantenimientos: 'Mantenimientos Programados',
    orden_activa: 'Orden de Trabajo Activa',
    inspeccion: 'Inspección 360° de Recepción',
    historial: 'Historial de Mantenimientos',
    garantias: 'Garantías y Pólizas Vigentes',
  };

  const handleWhatsAppAdvisor = () => {
    const phone = activeBranch.phone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hola StarMotos, soy ${profile.fullName}, cliente con moto ${motorcycle.brand} ${motorcycle.model} (${motorcycle.plate}). Deseo consultar sobre mi servicio técnico.`
    );
    window.open(`https://wa.me/593${phone.replace(/^0/, '')}?text=${text}`, '_blank');
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. BARRA LATERAL IZQUIERDA FIJA PERMANENTE (SIN BOTÓN DE HAMBURGUESA)      */}
      {/* ========================================================================= */}
      <aside className="w-72 shrink-0 h-full bg-zinc-950 border-r border-zinc-850 flex flex-col justify-between z-20 select-none shadow-xl">
        {/* Header con Logo Oficial StarMotos */}
        <div className="shrink-0 p-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-white to-red-600 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/starmotos-logo.jpg"
                alt="StarMotos"
                className="w-full h-full object-cover rounded-full bg-white"
              />
            </div>
            <div>
              <span className="text-sm font-black tracking-wider uppercase text-white block leading-none">
                STAR<span className="text-red-500">MOTOS</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                Portal de Clientes
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Resumen del Cliente */}
        <div className="shrink-0 p-4 border-b border-zinc-850 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="w-10 h-10 rounded-full object-cover border border-blue-500 shadow-sm shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-bold text-white truncate">{profile.fullName}</h3>
              <p className="text-[10px] text-zinc-400 font-mono">C.I: {profile.idNumber}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">Cliente Verificado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menú de Navegación Vertical Permanente */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 px-3 py-1.5 block">
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
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={active ? 'text-white' : 'text-blue-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>

                {item.badge ? (
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                      active
                        ? 'bg-white text-blue-700'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-zinc-600'}`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer del Sidebar: Sucursal y Cierre de Sesión */}
        <div className="shrink-0 p-3.5 border-t border-zinc-850 space-y-2.5 bg-zinc-950">
          <div className="px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-850 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 font-bold text-zinc-200">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="truncate">{activeBranch.name.replace('StarMotos ', '')}</span>
            </div>
            <p className="truncate text-zinc-500 text-[11px] mt-0.5">{activeBranch.address}</p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-bold transition active:scale-98 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. ÁREA PRINCIPAL DERECHA (HEADER + CONTENIDO CON CAMPOS PROPORCIONALES)    */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Header Superior Escritorio */}
        <header className="h-16 shrink-0 border-b border-zinc-850 bg-zinc-950/90 backdrop-blur-md px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 font-mono">StarMotos /</span>
            <h1 className="text-base font-bold text-white tracking-tight">
              {sectionTitles[activeSection]}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Botón WhatsApp Taller */}
            <button
              onClick={handleWhatsAppAdvisor}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contactar Asesor</span>
            </button>

            {/* Sucursal actual */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{activeBranch.name}</span>
            </div>
          </div>
        </header>

        {/* Canvas de Contenido con Campos Proporcionales que ocupan el espacio de izquierda a derecha */}
        <main className="flex-1 overflow-y-auto px-8 lg:px-12 py-8 w-full">
          <div className="max-w-6xl w-full mx-auto">
            {activeSection === 'perfil' && (
              <ProfileDesktop profile={profile} onUpdateProfile={updateProfile} />
            )}

            {activeSection === 'mi_moto' && (
              <MotorcycleDesktop motorcycle={motorcycle} onUpdateMotorcycle={updateMotorcycle} />
            )}

            {activeSection === 'mantenimientos' && (
              <MaintenancesDesktop
                scheduledMaintenances={scheduledMaintenances}
                onScheduleNewMaintenance={addScheduledMaintenance}
                motorcycle={motorcycle}
                branches={branches}
              />
            )}

            {activeSection === 'orden_activa' && (
              <ActiveOrderDesktop
                activeOrder={activeOrder}
                motorcycle={motorcycle}
                onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
              />
            )}

            {activeSection === 'inspeccion' && (
              <InspectionDesktop
                inspection={inspection}
                onSelectPhoto={setActivePhotoModal}
              />
            )}

            {activeSection === 'historial' && (
              <HistoryDesktop history={history} />
            )}

            {activeSection === 'garantias' && (
              <WarrantiesDesktop warranties={warranties} />
            )}
          </div>
        </main>
      </div>

      {/* Modal Aprobación Presupuesto Escritorio */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Autorizar Presupuesto de Reparación</h3>
              </div>
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="text-zinc-400 hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-2">
                <div className="flex justify-between text-zinc-400 text-sm">
                  <span>Repuestos OEM:</span>
                  <span className="font-mono text-white">${activeOrder.quotation.subtotalParts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-sm">
                  <span>Mano de Obra Certificada:</span>
                  <span className="font-mono text-white">${activeOrder.quotation.subtotalServices.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-sm">
                  <span>IVA 15%:</span>
                  <span className="font-mono text-white">${activeOrder.quotation.taxAmount.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-white text-base">
                  <span>Total Autorizado:</span>
                  <span className="font-mono text-blue-400 text-lg">${activeOrder.quotation.total.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 font-bold hover:bg-zinc-800 text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={approveQuotation}
                  disabled={isApproving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm cursor-pointer"
                >
                  {isApproving ? 'Autorizando...' : 'Aprobar Presupuesto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visor de Fotos Escritorio */}
      {activePhotoModal && (
        <div
          onClick={() => setActivePhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">{activePhotoModal.title}</h4>
              <button
                onClick={() => setActivePhotoModal(null)}
                className="text-zinc-400 hover:text-white cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center max-h-[75vh]">
              <img src={activePhotoModal.url} alt={activePhotoModal.title} className="max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
