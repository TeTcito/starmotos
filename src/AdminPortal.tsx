// src/AdminPortal.tsx
import React from 'react';
import { useAdminPortal } from './hooks/useAdminPortal';
import { useIsDesktop } from './hooks/useIsDesktop';
import { AdminViewDesktop } from './components/desktop/admin/AdminViewDesktop';
import { AdminViewMobile } from './components/mobile/admin/AdminViewMobile';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onLogout: () => void;
}

export const AdminPortal: React.FC<Props> = ({ onLogout }) => {
  const portal = useAdminPortal();
  const isDesktop = useIsDesktop(1024);

  const {
    activeSection,
    setActiveSection,
    workshops,
    warranties,
    alerts,
    invoices,
    technicians,
    origins,
    fullAlistamientos,
    clients,
    toastMessage,
    validateWarrantyByMatriz,
    rejectWarrantyByMatriz,
    sendWarrantyToGarante,
    completeWarrantyRepair,
    markAlertAsRead,
    markAllAlertsAsRead,
    addTechnician,
    addOrigin,
    saveFullAlistamiento,
    alistamientoClient,
    setAlistamientoClient,
    alistamientoMoto,
    setAlistamientoMoto,
    alistamientoService,
    setAlistamientoService,
    isSearchingSri,
    searchSri,
    submitAlistamiento,
  } = portal;

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {isDesktop ? (
        <AdminViewDesktop
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onLogout={onLogout}
          workshops={workshops}
          warranties={warranties}
          onValidateWarranty={validateWarrantyByMatriz}
          onRejectWarranty={rejectWarrantyByMatriz}
          onSendToGarante={sendWarrantyToGarante}
          onCompleteRepair={completeWarrantyRepair}
          alerts={alerts}
          onMarkAlertAsRead={markAlertAsRead}
          onMarkAllAlertsAsRead={markAllAlertsAsRead}
          invoices={invoices}
          technicians={technicians}
          origins={origins}
          fullAlistamientos={fullAlistamientos}
          clients={clients}
          onAddTechnician={addTechnician}
          onAddOrigin={addOrigin}
          onSaveFullAlistamiento={saveFullAlistamiento}
          alistamientoClient={alistamientoClient}
          setAlistamientoClient={setAlistamientoClient}
          alistamientoMoto={alistamientoMoto}
          setAlistamientoMoto={setAlistamientoMoto}
          alistamientoService={alistamientoService}
          setAlistamientoService={setAlistamientoService}
          isSearchingSri={isSearchingSri}
          onSearchSri={searchSri}
          onSubmitAlistamiento={submitAlistamiento}
        />
      ) : (
        <AdminViewMobile
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onLogout={onLogout}
          workshops={workshops}
          warranties={warranties}
          onValidateWarranty={validateWarrantyByMatriz}
          onSendToGarante={sendWarrantyToGarante}
          onCompleteRepair={completeWarrantyRepair}
          alerts={alerts}
          onMarkAlertAsRead={markAlertAsRead}
          onMarkAllAlertsAsRead={markAllAlertsAsRead}
          invoices={invoices}
          technicians={technicians}
          origins={origins}
          fullAlistamientos={fullAlistamientos}
          clients={clients}
          onAddTechnician={addTechnician}
          onAddOrigin={addOrigin}
          onSaveFullAlistamiento={saveFullAlistamiento}
          alistamientoClient={alistamientoClient}
          setAlistamientoClient={setAlistamientoClient}
          alistamientoMoto={alistamientoMoto}
          setAlistamientoMoto={setAlistamientoMoto}
          alistamientoService={alistamientoService}
          setAlistamientoService={setAlistamientoService}
          isSearchingSri={isSearchingSri}
          onSearchSri={searchSri}
          onSubmitAlistamiento={submitAlistamiento}
        />
      )}

      {/* Global Toast */}
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
