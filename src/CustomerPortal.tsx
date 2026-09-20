// src/CustomerPortal.tsx
import React from 'react';
import { useCustomerPortal } from './hooks/useCustomerPortal';
import { useIsDesktop } from './hooks/useIsDesktop';
import { LoginView } from './components/LoginView';
import { CustomerViewMobile } from './components/mobile/CustomerViewMobile';
import { CustomerViewDesktop } from './components/desktop/CustomerViewDesktop';
import { CheckCircle2 } from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const portal = useCustomerPortal();
  const isDesktop = useIsDesktop(1024); // Breakpoint 1024px (pantallas grandes vs móviles)

  const {
    isAuthenticated,
    login,
    logout,
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
    inspection,
    history,
    warranties,
    branches,
    activeBranch,
    isApprovalModalOpen,
    setIsApprovalModalOpen,
    isApproving,
    approveQuotation,
    activePhotoModal,
    setActivePhotoModal,
    toastMessage,
  } = portal;

  // Si no está autenticado, renderizar la pantalla independiente de login
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={login} />;
  }

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
          inspection={inspection}
          history={history}
          warranties={warranties}
          branches={branches}
          activeBranch={activeBranch}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          logout={logout}
          isApprovalModalOpen={isApprovalModalOpen}
          setIsApprovalModalOpen={setIsApprovalModalOpen}
          isApproving={isApproving}
          approveQuotation={approveQuotation}
          activePhotoModal={activePhotoModal}
          setActivePhotoModal={setActivePhotoModal}
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
          inspection={inspection}
          history={history}
          warranties={warranties}
          branches={branches}
          activeBranch={activeBranch}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          logout={logout}
          isApprovalModalOpen={isApprovalModalOpen}
          setIsApprovalModalOpen={setIsApprovalModalOpen}
          isApproving={isApproving}
          approveQuotation={approveQuotation}
          activePhotoModal={activePhotoModal}
          setActivePhotoModal={setActivePhotoModal}
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
