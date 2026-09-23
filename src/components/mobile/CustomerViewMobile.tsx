// src/components/mobile/CustomerViewMobile.tsx
import React from 'react';
import { Navbar } from '../Navbar';
import { SidebarDrawer, ActiveSection } from '../SidebarDrawer';
import { EventsMobile } from './EventsMobile';
import { ScheduleAppointmentMobile } from './ScheduleAppointmentMobile';
import { ProfileMobile } from './ProfileMobile';
import { ActiveOrderMobile } from './ActiveOrderMobile';
import { HistoryMobile } from './HistoryMobile';
import { FileCheck } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import {
  ClientProfile,
  MotorcycleClientData,
  ScheduledMaintenance,
  WorkOrder,
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
  history: MaintenanceRecord[];
  warranties: WarrantyItem[];
  branches: Branch[];
  activeBranch: Branch;
  activeSection: ActiveSection;
  setActiveSection: (sec: ActiveSection) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  logout: () => void;
  isApprovalModalOpen: boolean;
  setIsApprovalModalOpen: (open: boolean) => void;
  isApproving: boolean;
  approveQuotation: () => void;
}

export const CustomerViewMobile: React.FC<Props> = ({
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
  isSidebarOpen,
  setIsSidebarOpen,
  logout,
  isApprovalModalOpen,
  setIsApprovalModalOpen,
  isApproving,
  approveQuotation,
}) => {
  const sectionTitles: Record<ActiveSection, string> = {
    perfil: 'Perfil del Cliente',
    orden_activa: 'Orden de Trabajo Activa',
    agendar_cita: 'Agendar Cita',
    eventos: 'Evento de Facturas',
    historial: 'Historial y Garantías',
    mi_moto: 'Perfil del Cliente',
    mantenimientos: 'Agendar Cita',
    garantias: 'Historial y Garantías',
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased">
      {/* 1. Navbar Móvil con botón hamburguesa y auto-hide */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(true)}
        profile={profile}
        activeBranch={activeBranch}
        onLogout={logout}
        activeSectionTitle={sectionTitles[activeSection]}
        activeOrder={activeOrder}
        warranties={warranties}
        history={history}
        onNavigateToEvents={() => setActiveSection('eventos')}
      />

      {/* 2. Drawer Lateral Desplegable Móvil */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        profile={profile}
        activeBranch={activeBranch}
        onLogout={logout}
      />

      {/* 3. Contenido Principal Móvil */}
      <main className="max-w-md mx-auto px-4 py-4">
        {activeSection === 'perfil' && (
          <ProfileMobile
            profile={profile}
            onUpdateProfile={updateProfile}
            motorcycle={motorcycle}
            onUpdateMotorcycle={updateMotorcycle}
            branches={branches}
          />
        )}

        {activeSection === 'orden_activa' && (
          <ActiveOrderMobile
            activeOrder={activeOrder}
            motorcycle={motorcycle}
            onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
          />
        )}

        {activeSection === 'agendar_cita' && (
          <ScheduleAppointmentMobile
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
          <EventsMobile
            history={history}
            motorcycle={motorcycle}
            profile={profile}
          />
        )}

        {(activeSection === 'historial' || activeSection === 'garantias') && (
          <HistoryMobile history={history} warranties={warranties} />
        )}

        {/* Fallbacks para compatibilidad con rutas guardadas */}
        {activeSection === 'mi_moto' && (
          <ProfileMobile
            profile={profile}
            onUpdateProfile={updateProfile}
            motorcycle={motorcycle}
            onUpdateMotorcycle={updateMotorcycle}
            branches={branches}
          />
        )}

        {activeSection === 'mantenimientos' && (
          <ScheduleAppointmentMobile
            motorcycle={motorcycle}
            profile={profile}
            branches={branches}
            scheduledMaintenances={scheduledMaintenances}
            onScheduleNewMaintenance={addScheduledMaintenance}
            onBack={() => setActiveSection('perfil')}
          />
        )}
      </main>

      {/* Modal Aprobación Presupuesto Móvil */}
      <ModalPortal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        maxWidth="max-w-sm"
      >
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-zinc-900">Autorizar Presupuesto</h3>
          </div>
          <button
            onClick={() => setIsApprovalModalOpen(false)}
            className="text-zinc-400 hover:text-zinc-700 text-base font-bold cursor-pointer p-1"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3 text-xs">
          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1.5">
            <div className="flex justify-between text-zinc-600">
              <span>Repuestos:</span>
              <span className="font-mono text-zinc-900 font-medium">${activeOrder.quotation.subtotalParts.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Mano de Obra:</span>
              <span className="font-mono text-zinc-900 font-medium">${activeOrder.quotation.subtotalServices.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>IVA 15%:</span>
              <span className="font-mono text-zinc-900 font-medium">${activeOrder.quotation.taxAmount.toFixed(2)}</span>
            </div>
            <div className="pt-1.5 border-t border-zinc-200 flex justify-between font-bold text-zinc-900">
              <span>Total:</span>
              <span className="font-mono text-blue-600 font-bold">${activeOrder.quotation.total.toFixed(2)} USD</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsApprovalModalOpen(false)}
              className="flex-1 py-2 rounded-xl border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={approveQuotation}
              disabled={isApproving}
              className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow transition"
            >
              {isApproving ? 'Procesando...' : 'Aprobar'}
            </button>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
};
