// src/TallerPortal.tsx
import React from 'react';
import { useTallerPortal } from './hooks/useTallerPortal';
import { useIsDesktop } from './hooks/useIsDesktop';
import { TallerViewDesktop } from './components/desktop/taller/TallerViewDesktop';
import { TallerViewMobile } from './components/mobile/taller/TallerViewMobile';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onLogout: () => void;
}

export const TallerPortal: React.FC<Props> = ({ onLogout }) => {
  const portal = useTallerPortal();
  const isDesktop = useIsDesktop(1024);

  const {
    activeSection,
    setActiveSection,
    orders,
    updateOrderStatus,
    warranties,
    localClients: clients,
    inventory,
    workshops,
    technicians,
    origins,
    fullAlistamientos,
    addTechnician,
    deleteTechnician,
    addOrigin,
    saveFullAlistamiento,
    newWarrantyForm,
    setNewWarrantyForm,
    createWarrantyRequest,
    alerts,
    markAlertAsRead,
    markAllAlertsAsRead,
    deleteAlert,
    deleteAllReadAlerts,
    currentWorkshop,
    updateWorkshopProfile,
    toastMessage,
  } = portal;

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {isDesktop ? (
        <TallerViewDesktop
          activeSection={activeSection as any}
          setActiveSection={setActiveSection as any}
          onLogout={onLogout}
          orders={orders}
          onUpdateOrderStatus={updateOrderStatus}
          warranties={warranties}
          clients={clients}
          inventory={inventory}
          workshops={workshops}
          technicians={technicians}
          origins={origins}
          fullAlistamientos={fullAlistamientos}
          onAddTechnician={addTechnician}
          onDeleteTechnician={deleteTechnician}
          onAddOrigin={addOrigin}
          onSaveFullAlistamiento={saveFullAlistamiento}
          newWarrantyForm={newWarrantyForm}
          setNewWarrantyForm={setNewWarrantyForm}
          onCreateWarrantyRequest={createWarrantyRequest}
          alerts={alerts}
          onMarkAlertAsRead={markAlertAsRead}
          onMarkAllAlertsAsRead={markAllAlertsAsRead}
          onDeleteAlert={deleteAlert}
          onDeleteAllReadAlerts={deleteAllReadAlerts}
          currentWorkshop={currentWorkshop}
          onUpdateWorkshop={updateWorkshopProfile}
        />
      ) : (
        <TallerViewMobile
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onLogout={onLogout}
          orders={orders}
          onUpdateOrderStatus={updateOrderStatus}
          warranties={warranties}
          clients={clients}
          inventory={inventory}
          workshops={workshops}
          technicians={technicians}
          origins={origins}
          fullAlistamientos={fullAlistamientos}
          onAddTechnician={addTechnician}
          onDeleteTechnician={deleteTechnician}
          onAddOrigin={addOrigin}
          onSaveFullAlistamiento={saveFullAlistamiento}
          newWarrantyForm={newWarrantyForm}
          setNewWarrantyForm={setNewWarrantyForm}
          onCreateWarrantyRequest={createWarrantyRequest}
          alerts={alerts}
          onMarkAlertAsRead={markAlertAsRead}
          onMarkAllAlertsAsRead={markAllAlertsAsRead}
          onDeleteAlert={deleteAlert}
          onDeleteAllReadAlerts={deleteAllReadAlerts}
          currentWorkshop={currentWorkshop}
          onUpdateWorkshop={updateWorkshopProfile}
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
