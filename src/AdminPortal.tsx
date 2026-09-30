// src/AdminPortal.tsx
import React from 'react';
import { useAdminPortal } from './hooks/useAdminPortal';
import { useIsDesktop } from './hooks/useIsDesktop';
import { AdminViewDesktop } from './components/desktop/admin/AdminViewDesktop';
import { AdminViewMobile } from './components/mobile/admin/AdminViewMobile';
import { PendientesAlertModal } from './components/common/PendientesAlertModal';
import { PendienteAlarmModal } from './components/common/PendienteAlarmModal';
import { AdminPendiente } from './types/customer';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onLogout: () => void;
}

export const AdminPortal: React.FC<Props> = ({ onLogout }) => {
  const portal = useAdminPortal();
  const isDesktop = useIsDesktop(1024);
  const [showEntranceAlert, setShowEntranceAlert] = React.useState(false);
  const [alarmedPendiente, setAlarmedPendiente] = React.useState<AdminPendiente | null>(null);
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
    garantiasPlusRecords,
    saveGarantiaPlusRecord,
    deleteGarantiaPlusRecord,
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

  // Alerta de ingreso al sistema: "Tienes X pendientes por hacer" con botones Aceptar y Recordar más tarde
  React.useEffect(() => {
    const checkEntrance = () => {
      try {
        const alreadySeen = sessionStorage.getItem('starmotos_admin_seen_pendientes_alert_v1');
        const snoozeUntilStr = sessionStorage.getItem('starmotos_admin_snooze_pendientes_until');
        const isSnoozed = snoozeUntilStr ? Date.now() < parseInt(snoozeUntilStr, 10) : false;

        const uncompletedCount = pendientes.filter((p) => !p.completed).length;

        if (!alreadySeen && !isSnoozed && uncompletedCount > 0) {
          setShowEntranceAlert(true);
        }
      } catch (_) {}
    };

    if (!hasCheckedEntranceRef.current) {
      hasCheckedEntranceRef.current = true;
      const timer = setTimeout(checkEntrance, 600);
      return () => clearTimeout(timer);
    }
  }, [pendientes]);

  const handleAcceptAlert = () => {
    try {
      sessionStorage.setItem('starmotos_admin_seen_pendientes_alert_v1', 'true');
    } catch (_) {}
    setShowEntranceAlert(false);
  };

  const handleRemindLaterAlert = () => {
    try {
      // Posponer recordatorio por 15 minutos
      sessionStorage.setItem(
        'starmotos_admin_snooze_pendientes_until',
        (Date.now() + 15 * 60 * 1000).toString()
      );
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

  // Monitor periódico de Alarma Programada cuando se cumple fecha y hora de un pendiente
  React.useEffect(() => {
    const checkScheduledPendienteAlarm = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      for (const p of pendientes) {
        if (p.completed) continue;
        if (!p.dueDate) continue;

        // Comprobar si la fecha es hoy
        if (p.dueDate === todayStr) {
          if (p.dueTime) {
            const [hStr, mStr] = p.dueTime.split(':');
            const targetMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);

            // Alarma cuando ya es la hora o transcurrieron menos de 60 minutos de retraso
            if (currentMinutes >= targetMinutes && currentMinutes - targetMinutes <= 60) {
              const alarmKey = `starmotos_alarm_p_${p.id}_${todayStr}_${p.dueTime}`;
              const snoozeKey = `starmotos_snooze_alarm_${p.id}`;
              const snoozeUntil = sessionStorage.getItem(snoozeKey);
              const isSnoozed = snoozeUntil ? Date.now() < parseInt(snoozeUntil, 10) : false;

              if (!sessionStorage.getItem(alarmKey) && !isSnoozed) {
                sessionStorage.setItem(alarmKey, 'true');
                setAlarmedPendiente(p);
                break;
              }
            }
          }
        }
      }
    };

    checkScheduledPendienteAlarm();
    const interval = setInterval(checkScheduledPendienteAlarm, 15000);
    return () => clearInterval(interval);
  }, [pendientes]);

  const handleSnoozeAlarm = (id: string, minutes: number) => {
    try {
      sessionStorage.setItem(
        `starmotos_snooze_alarm_${id}`,
        (Date.now() + minutes * 60 * 1000).toString()
      );
    } catch (_) {}
    setAlarmedPendiente(null);
  };

  const handleCompleteFromAlarm = (id: string) => {
    toggleCompletePendiente(id);
    setAlarmedPendiente(null);
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
          garantiasPlusRecords={garantiasPlusRecords}
          onSaveGarantiaPlusRecord={saveGarantiaPlusRecord}
          onDeleteGarantiaPlusRecord={deleteGarantiaPlusRecord}
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
          garantiasPlusRecords={garantiasPlusRecords}
          onSaveGarantiaPlusRecord={saveGarantiaPlusRecord}
          onDeleteGarantiaPlusRecord={deleteGarantiaPlusRecord}
        />
      )}

      {/* Modal de Alerta de Ingreso para Pendientes Agendados con Aceptar y Recordar más tarde */}
      <PendientesAlertModal
        isOpen={showEntranceAlert}
        onClose={handleAcceptAlert}
        onAccept={handleAcceptAlert}
        onRemindLater={handleRemindLaterAlert}
        onGoToPendientes={handleGoToPendientes}
        pendientes={pendientes}
      />

      {/* Modal de Alarma Sonora para Pendiente Cumplido en Fecha y Hora */}
      <PendienteAlarmModal
        isOpen={Boolean(alarmedPendiente)}
        pendiente={alarmedPendiente}
        onClose={() => setAlarmedPendiente(null)}
        onComplete={handleCompleteFromAlarm}
        onSnooze={handleSnoozeAlarm}
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
