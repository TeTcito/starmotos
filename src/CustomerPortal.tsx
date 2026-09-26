// src/CustomerPortal.tsx
import React, { useState } from 'react';
import { useCustomerPortal } from './hooks/useCustomerPortal';
import { useIsDesktop } from './hooks/useIsDesktop';
import { CustomerViewMobile } from './components/mobile/CustomerViewMobile';
import { CustomerViewDesktop } from './components/desktop/CustomerViewDesktop';
import { ForceChangePasswordModal } from './components/common/ForceChangePasswordModal';
import { RatingServiceModal } from './components/common/RatingServiceModal';
import { CheckCircle2 } from 'lucide-react';

interface CustomerPortalProps {
  onLogout: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ onLogout }) => {
  const portal = useCustomerPortal();
  const isDesktop = useIsDesktop(1024); // Breakpoint 1024px (pantallas grandes vs móviles)

  const {
    activeSection,
    setActiveSection,
    isSidebarOpen,
    setIsSidebarOpen,
    profile,
    updateProfile,
    motorcycle,
    updateMotorcycle,
    scheduledMaintenances,
    addScheduledMaintenance,
    activeOrder,
    activeOrders,
    selectedActiveOrderIndex,
    setSelectedActiveOrderIndex,
    history,
    warranties,
    branches,
    activeBranch,
    isApprovalModalOpen,
    setIsApprovalModalOpen,
    isApproving,
    approveQuotation,
    pendingRatingOrder,
    isRatingModalOpen,
    setIsRatingModalOpen,
    submitRating,
    submitClientAbono,
    toastMessage,
  } = portal;

  // Estado para forzar cambio de contraseña en clientes creados manualmente
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(() => {
    return (
      profile.mustChangePassword === true ||
      localStorage.getItem('starmotos_must_change_password') === 'true'
    );
  });

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Renderizado condicional: Escritorio vs Móvil según arquitectura solicitada */}
      {isDesktop ? (
        <CustomerViewDesktop
          profile={profile}
          updateProfile={updateProfile}
          motorcycle={motorcycle}
          updateMotorcycle={updateMotorcycle}
          scheduledMaintenances={scheduledMaintenances}
          addScheduledMaintenance={addScheduledMaintenance}
          activeOrder={activeOrder}
          activeOrders={activeOrders}
          selectedActiveOrderIndex={selectedActiveOrderIndex}
          onSelectActiveOrder={setSelectedActiveOrderIndex}
          history={history}
          warranties={warranties}
          branches={branches}
          activeBranch={activeBranch}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          logout={onLogout}
          isApprovalModalOpen={isApprovalModalOpen}
          setIsApprovalModalOpen={setIsApprovalModalOpen}
          isApproving={isApproving}
          approveQuotation={approveQuotation}
          pendingRatingOrder={pendingRatingOrder}
          onOpenRatingModal={() => setIsRatingModalOpen(true)}
          onSubmitAbono={submitClientAbono}
        />
      ) : (
        <CustomerViewMobile
          profile={profile}
          updateProfile={updateProfile}
          motorcycle={motorcycle}
          updateMotorcycle={updateMotorcycle}
          scheduledMaintenances={scheduledMaintenances}
          addScheduledMaintenance={addScheduledMaintenance}
          activeOrder={activeOrder}
          activeOrders={activeOrders}
          selectedActiveOrderIndex={selectedActiveOrderIndex}
          onSelectActiveOrder={setSelectedActiveOrderIndex}
          history={history}
          warranties={warranties}
          branches={branches}
          activeBranch={activeBranch}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          logout={onLogout}
          isApprovalModalOpen={isApprovalModalOpen}
          setIsApprovalModalOpen={setIsApprovalModalOpen}
          isApproving={isApproving}
          approveQuotation={approveQuotation}
          pendingRatingOrder={pendingRatingOrder}
          onOpenRatingModal={() => setIsRatingModalOpen(true)}
          onSubmitAbono={submitClientAbono}
        />
      )}

      {/* Modal Emergente de Calificar Servicio Técnico (Orden Entregada) */}
      <RatingServiceModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        order={pendingRatingOrder}
        onSubmitRating={submitRating}
      />

      {/* Modal Obligatorio de Cambio de Contraseña en Primer Acceso */}
      {mustChangePassword && (
        <ForceChangePasswordModal
          profile={profile}
          onPasswordChanged={() => {
            setMustChangePassword(false);
            updateProfile({ ...profile, mustChangePassword: false });
          }}
          onLogout={onLogout}
        />
      )}

      {/* Notificación Toast Global */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-zinc-900 border border-blue-500/40 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-zinc-200 font-medium">{toastMessage.text}</p>
        </div>
      )}
    </div>
  );
};
