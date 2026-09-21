// src/components/mobile/CustomerViewMobile.tsx
import React from 'react';
import { Navbar } from '../Navbar';
import { SidebarDrawer, ActiveSection } from '../SidebarDrawer';
import { EventsMobile } from './EventsMobile';
import { ScheduleAppointmentMobile } from './ScheduleAppointmentMobile';
import { ProfileMobile } from './ProfileMobile';
import { MotorcycleMobile } from './MotorcycleMobile';
import { MaintenancesMobile } from './MaintenancesMobile';
import { ActiveOrderMobile } from './ActiveOrderMobile';
import { HistoryMobile } from './HistoryMobile';
import { WarrantiesMobile } from './WarrantiesMobile';
import { FileCheck } from 'lucide-react';
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
    eventos: 'Eventos y Facturas',
    agendar_cita: 'Agendar Cita',
    perfil: 'Perfil',
    mi_moto: 'Mi Moto',
    mantenimientos: 'Mantenimientos',
    orden_activa: 'Orden Activa',
    historial: 'Historial',
    garantias: 'Garantías',
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
        {activeSection === 'eventos' && (
          <EventsMobile
            history={history}
            motorcycle={motorcycle}
            profile={profile}
          />
        )}

        {activeSection === 'agendar_cita' && (
          <ScheduleAppointmentMobile
            motorcycle={motorcycle}
            profile={profile}
            branches={branches}
            scheduledMaintenances={scheduledMaintenances}
            onScheduleNewMaintenance={addScheduledMaintenance}
          />
        )}

        {activeSection === 'perfil' && (
          <ProfileMobile profile={profile} onUpdateProfile={updateProfile} />
        )}

        {activeSection === 'mi_moto' && (
          <MotorcycleMobile motorcycle={motorcycle} onUpdateMotorcycle={updateMotorcycle} />
        )}

        {activeSection === 'mantenimientos' && (
          <MaintenancesMobile
            scheduledMaintenances={scheduledMaintenances}
            onScheduleNewMaintenance={addScheduledMaintenance}
            motorcycle={motorcycle}
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

        {activeSection === 'historial' && (
          <HistoryMobile history={history} />
        )}

        {activeSection === 'garantias' && (
          <WarrantiesMobile warranties={warranties} />
        )}
      </main>

      {/* Modal Aprobación Presupuesto Móvil */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-zinc-900">Autorizar Presupuesto</h3>
              </div>
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-base font-bold cursor-pointer"
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
          </div>
        </div>
      )}
    </div>
  );
};
