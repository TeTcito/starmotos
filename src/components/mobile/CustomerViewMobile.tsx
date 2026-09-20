// src/components/mobile/CustomerViewMobile.tsx
import React from 'react';
import { Navbar } from '../Navbar';
import { SidebarDrawer, ActiveSection } from '../SidebarDrawer';
import { ProfileMobile } from './ProfileMobile';
import { MotorcycleMobile } from './MotorcycleMobile';
import { MaintenancesMobile } from './MaintenancesMobile';
import { ActiveOrderMobile } from './ActiveOrderMobile';
import { InspectionMobile } from './InspectionMobile';
import { HistoryMobile } from './HistoryMobile';
import { WarrantiesMobile } from './WarrantiesMobile';
import { FileCheck } from 'lucide-react';
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
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  logout: () => void;
  isApprovalModalOpen: boolean;
  setIsApprovalModalOpen: (open: boolean) => void;
  isApproving: boolean;
  approveQuotation: () => void;
  activePhotoModal: { url: string; title: string } | null;
  setActivePhotoModal: (photo: { url: string; title: string } | null) => void;
}

export const CustomerViewMobile: React.FC<Props> = ({
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
  isSidebarOpen,
  setIsSidebarOpen,
  logout,
  isApprovalModalOpen,
  setIsApprovalModalOpen,
  isApproving,
  approveQuotation,
  activePhotoModal,
  setActivePhotoModal,
}) => {
  const sectionTitles: Record<ActiveSection, string> = {
    perfil: 'Perfil',
    mi_moto: 'Mi Moto',
    mantenimientos: 'Mantenimientos',
    orden_activa: 'Orden Activa',
    inspeccion: 'Inspección 360°',
    historial: 'Historial',
    garantias: 'Garantías',
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
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

        {activeSection === 'inspeccion' && (
          <InspectionMobile
            inspection={inspection}
            onSelectPhoto={setActivePhotoModal}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white">Autorizar Presupuesto</h3>
              </div>
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="text-zinc-400 hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Repuestos:</span>
                  <span className="font-mono text-white">${activeOrder.quotation.subtotalParts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Mano de Obra:</span>
                  <span className="font-mono text-white">${activeOrder.quotation.subtotalServices.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>IVA 15%:</span>
                  <span className="font-mono text-white">${activeOrder.quotation.taxAmount.toFixed(2)}</span>
                </div>
                <div className="pt-1.5 border-t border-zinc-800 flex justify-between font-bold text-white">
                  <span>Total:</span>
                  <span className="font-mono text-blue-400">${activeOrder.quotation.total.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-zinc-800 text-zinc-400 font-bold hover:bg-zinc-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={approveQuotation}
                  disabled={isApproving}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  {isApproving ? 'Procesando...' : 'Aprobar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visor de Fotos Móvil */}
      {activePhotoModal && (
        <div
          onClick={() => setActivePhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl"
          >
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">{activePhotoModal.title}</h4>
              <button
                onClick={() => setActivePhotoModal(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center max-h-[60vh]">
              <img src={activePhotoModal.url} alt={activePhotoModal.title} className="max-h-[55vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
