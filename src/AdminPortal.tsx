// src/AdminPortal.tsx
import React from 'react';
import { useAdminPortal } from './hooks/useAdminPortal';
import { useIsDesktop } from './hooks/useIsDesktop';
import { AdminViewDesktop } from './components/desktop/admin/AdminViewDesktop';
import { AdminViewMobile } from './components/mobile/admin/AdminViewMobile';
import { PendientesAlertModal } from './components/common/PendientesAlertModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onLogout: () => void;
}

export const AdminPortal: React.FC<Props> = ({ onLogout }) => {
  const portal = useAdminPortal();
  const isDesktop = useIsDesktop(1024);
  const [showEntranceAlert, setShowEntranceAlert] = React.useState(false);
  const hasCheckedEntranceRef = React.useRef(false);

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
    orders,
    inventory,
    adminProfile,
    updateAdminProfile,
    toastMessage,
    pendientes,
    savePendiente,
    toggleCompletePendiente,
    deletePendiente,
    gpsRecords,
    saveGpsRecord,
    deleteGpsRecord,
    validateWarrantyByMatriz,
    rejectWarrantyByMatriz,
    sendWarrantyToGarante,
    completeWarrantyRepair,
    markAlertAsRead,
    markAllAlertsAsRead,
    addTechnician,
    deleteTechnician,
    addOrigin,
    saveFullAlistamiento,
    deleteFullAlistamiento,
    deleteClient,
    deleteWarranty,
    createWarrantyRequest,
    updateWarranty,
    quickUpdateWarrantyStatus,
    deleteAlert,
    deleteAllReadAlerts,
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

  // Alerta de ingreso al sistema: "Tienes X pendientes por hacer"
  React.useEffect(() => {
    if (hasCheckedEntranceRef.current) return;
    hasCheckedEntranceRef.current = true;

    try {
      const alreadySeen = sessionStorage.getItem('starmotos_admin_seen_pendientes_alert_v1');
      const uncompletedCount = pendientes.filter((p) => !p.completed).length;

      if (!alreadySeen && uncompletedCount > 0) {
        const timer = setTimeout(() => {
          setShowEntranceAlert(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, [pendientes]);

  const handleCloseAlert = () => {
    try {
      sessionStorage.setItem('starmotos_admin_seen_pendientes_alert_v1', 'true');
    } catch (_) {}
    setShowEntranceAlert(false);
  };

  const handleGoToPendientes = () => {
    try {
      sessionStorage.setItem('starmotos_admin_seen_pendientes_alert_v1', 'true');
    } catch (_) {}
    setShowEntranceAlert(false);
    setActiveSection('pendientes' as any);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {isDesktop ? (
        <AdminViewDesktop
          activeSection={activeSection as any}
          setActiveSection={setActiveSection as any}
          onLogout={onLogout}
          workshops={workshops}
          warranties={warranties}
          onValidateWarranty={validateWarrantyByMatriz}
          onRejectWarranty={rejectWarrantyByMatriz}
          onSendToGarante={sendWarrantyToGarante}
          onCompleteRepair={completeWarrantyRepair}
          onCreateWarranty={createWarrantyRequest}
          onUpdateWarranty={updateWarranty}
          onDeleteWarranty={deleteWarranty}
          onQuickUpdateWarrantyStatus={quickUpdateWarrantyStatus}
          alerts={alerts}
          onMarkAlertAsRead={markAlertAsRead}
          onMarkAllAlertsAsRead={markAllAlertsAsRead}
          onDeleteAlert={deleteAlert}
          onDeleteAllReadAlerts={deleteAllReadAlerts}
          invoices={invoices}
          technicians={technicians}
          origins={origins}
          fullAlistamientos={fullAlistamientos}
          clients={clients}
          orders={orders}
          inventory={inventory}
          pendientes={pendientes}
          onSavePendiente={savePendiente}
          onToggleCompletePendiente={toggleCompletePendiente}
          onDeletePendiente={deletePendiente}
          onAddTechnician={addTechnician}
          onDeleteTechnician={deleteTechnician}
          onAddOrigin={addOrigin}
          onSaveFullAlistamiento={saveFullAlistamiento}
          onDeleteFullAlistamiento={deleteFullAlistamiento}
          onDeleteClient={deleteClient}
          alistamientoClient={alistamientoClient}
          setAlistamientoClient={setAlistamientoClient}
          alistamientoMoto={alistamientoMoto}
          setAlistamientoMoto={setAlistamientoMoto}
          alistamientoService={alistamientoService}
          setAlistamientoService={setAlistamientoService}
          isSearchingSri={isSearchingSri}
          onSearchSri={searchSri}
          onSubmitAlistamiento={submitAlistamiento}
          gpsRecords={gpsRecords}
          onSaveGpsRecord={saveGpsRecord}
          onDeleteGpsRecord={deleteGpsRecord}
        />
      ) : (
        <AdminViewMobile
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onLogout={onLogout}
          adminProfile={adminProfile}
          onUpdateProfile={updateAdminProfile}
          workshops={workshops}
          warranties={warranties}
          onValidateWarranty={validateWarrantyByMatriz}
          onSendToGarante={sendWarrantyToGarante}
          onCompleteRepair={completeWarrantyRepair}
          onCreateWarranty={createWarrantyRequest}
          onDeleteWarranty={deleteWarranty}
          onQuickUpdateWarrantyStatus={quickUpdateWarrantyStatus}
          alerts={alerts}
          onMarkAlertAsRead={markAlertAsRead}
          onMarkAllAlertsAsRead={markAllAlertsAsRead}
          onDeleteAlert={deleteAlert}
          onDeleteAllReadAlerts={deleteAllReadAlerts}
          invoices={invoices}
          technicians={technicians}
          origins={origins}
          fullAlistamientos={fullAlistamientos}
          clients={clients}
          orders={orders}
          inventory={inventory}
          pendientes={pendientes}
          onSavePendiente={savePendiente}
          onToggleCompletePendiente={toggleCompletePendiente}
          onDeletePendiente={deletePendiente}
          onAddTechnician={addTechnician}
          onDeleteTechnician={deleteTechnician}
          onAddOrigin={addOrigin}
          onSaveFullAlistamiento={saveFullAlistamiento}
          onDeleteFullAlistamiento={deleteFullAlistamiento}
          onDeleteClient={deleteClient}
          alistamientoClient={alistamientoClient}
          setAlistamientoClient={setAlistamientoClient}
          alistamientoMoto={alistamientoMoto}
          setAlistamientoMoto={setAlistamientoMoto}
          alistamientoService={alistamientoService}
          setAlistamientoService={setAlistamientoService}
          isSearchingSri={isSearchingSri}
          onSearchSri={searchSri}
          onSubmitAlistamiento={submitAlistamiento}
          gpsRecords={gpsRecords}
          onSaveGpsRecord={saveGpsRecord}
          onDeleteGpsRecord={deleteGpsRecord}
        />
      )}

      {/* Modal de Alerta de Ingreso para Pendientes Agendados */}
      <PendientesAlertModal
        isOpen={showEntranceAlert}
        onClose={handleCloseAlert}
        onGoToPendientes={handleGoToPendientes}
        pendientes={pendientes}
      />

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
