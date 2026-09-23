// src/GarantePortal.tsx
import React from 'react';
import { useGarantePortal } from './hooks/useGarantePortal';
import { useIsDesktop } from './hooks/useIsDesktop';
import { GaranteViewDesktop } from './components/desktop/garante/GaranteViewDesktop';
import { GaranteViewMobile } from './components/mobile/garante/GaranteViewMobile';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onLogout: () => void;
}

export const GarantePortal: React.FC<Props> = ({ onLogout }) => {
  const portal = useGarantePortal();
  const isDesktop = useIsDesktop(1024);

  const {
    activeSection,
    setActiveSection,
    warranties,
    pendingRequests,
    historyRequests,
    fullAlistamientos,
    clients,
    workshops,
    profile,
    updateGaranteProfile,
    selectedWarranty,
    reviewNotes,
    setReviewNotes,
    rejectionReason,
    setRejectionReason,
    isActionModalOpen,
    setIsActionModalOpen,
    actionType,
    openDecisionModal,
    approveWarranty,
    rejectWarranty,
    alerts,
    markAlertAsRead,
    markAllAlertsAsRead,
    deleteAlert,
    deleteAllReadAlerts,
    toastMessage,
  } = portal;

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {isDesktop ? (
        <GaranteViewDesktop
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onLogout={onLogout}
          warranties={warranties}
          pendingRequests={pendingRequests}
          historyRequests={historyRequests}
          fullAlistamientos={fullAlistamientos}
          clients={clients}
          workshops={workshops}
          profile={profile}
          onUpdateProfile={updateGaranteProfile}
          selectedWarranty={selectedWarranty}
          reviewNotes={reviewNotes}
          setReviewNotes={setReviewNotes}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          isActionModalOpen={isActionModalOpen}
          setIsActionModalOpen={setIsActionModalOpen}
          actionType={actionType}
          onOpenDecisionModal={openDecisionModal}
          onApproveWarranty={approveWarranty}
          onRejectWarranty={rejectWarranty}
          alerts={alerts}
          onMarkAlertAsRead={markAlertAsRead}
          onMarkAllAlertsAsRead={markAllAlertsAsRead}
          onDeleteAlert={deleteAlert}
          onDeleteAllReadAlerts={deleteAllReadAlerts}
        />
      ) : (
        <GaranteViewMobile
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onLogout={onLogout}
          warranties={warranties}
          pendingRequests={pendingRequests}
          historyRequests={historyRequests}
          fullAlistamientos={fullAlistamientos}
          clients={clients}
          workshops={workshops}
          profile={profile}
          selectedWarranty={selectedWarranty}
          reviewNotes={reviewNotes}
          setReviewNotes={setReviewNotes}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          isActionModalOpen={isActionModalOpen}
          setIsActionModalOpen={setIsActionModalOpen}
          actionType={actionType}
          onOpenDecisionModal={openDecisionModal}
          onApproveWarranty={approveWarranty}
          onRejectWarranty={rejectWarranty}
          alerts={alerts}
          onMarkAlertAsRead={markAlertAsRead}
          onMarkAllAlertsAsRead={markAllAlertsAsRead}
          onDeleteAlert={deleteAlert}
          onDeleteAllReadAlerts={deleteAllReadAlerts}
          onUpdateProfile={updateGaranteProfile}
        />
      )}

      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-zinc-900 border border-blue-500/40 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in text-xs">
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <p className="text-zinc-200 font-medium">{toastMessage.text}</p>
        </div>
      )}
    </div>
  );
};
