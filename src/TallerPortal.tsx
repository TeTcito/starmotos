// src/TallerPortal.tsx
import React from 'react';
import { useTallerPortal } from './hooks/useTallerPortal';
import { useIsDesktop } from './hooks/useIsDesktop';
import { TallerViewDesktop } from './components/desktop/taller/TallerViewDesktop';
import { TallerViewMobile } from './components/mobile/taller/TallerViewMobile';
import { CheckCircle2, AlertCircle, Lock, AlertTriangle, Phone, LogOut } from 'lucide-react';

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
    rawFullAlistamientos,
    agendamientos,
    deleteAgendamiento,
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
    isMatriz,
    selectedWorkshopFilter,
    setSelectedWorkshopFilter,
  } = portal;

  // Bloqueo de acceso si la sede fue marcada como Inoperativa por Matriz
  if (currentWorkshop?.status === 'inoperativo') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 selection:bg-rose-600 selection:text-white relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-rose-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-zinc-900/90 backdrop-blur border border-rose-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 flex flex-col items-center text-center animate-fade-in">
          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-2">
            Sede Inoperativa
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            A usted se le ha suspendido sus actividades
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-zinc-400 mt-1">
            {currentWorkshop.name} <span className="font-mono text-zinc-500">({currentWorkshop.code})</span>
          </p>

          {/* Comentario de Matriz */}
          <div className="w-full mt-5 p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-left">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Mensaje de la Administración Matriz:</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium">
              "{currentWorkshop.inoperativoMotivo || 'A usted se le ha suspendido sus actividades, para más información acérquese o contáctese a la matriz.'}"
            </p>
            {currentWorkshop.inoperativoFecha && (
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">
                Registrado el: {new Date(currentWorkshop.inoperativoFecha).toLocaleString()}
              </p>
            )}
          </div>

          {/* Instrucciones */}
          <div className="mt-4 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-left w-full text-xs text-zinc-400 leading-relaxed">
            <p className="font-medium text-zinc-300 mb-0.5">Para más información:</p>
            Acérquese o contáctese directamente con la administración de Matriz Central.
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-6">
            <a
              href={`https://wa.me/593939316698?text=${encodeURIComponent(`Hola Matriz StarMotos, me comunico de la sede ${currentWorkshop.name} (${currentWorkshop.code}) para solicitar información sobre la suspensión de actividades.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contactar a Matriz</span>
            </a>
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer border border-zinc-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {isDesktop ? (
        <TallerViewDesktop
          activeSection={activeSection as any}
          setActiveSection={setActiveSection as any}
          onLogout={onLogout}
          orders={orders}
          onUpdateOrderStatus={updateOrderStatus}
          agendamientos={agendamientos}
          onDeleteAgendamiento={deleteAgendamiento}
          warranties={warranties}
          clients={clients}
          inventory={inventory}
          workshops={workshops}
          technicians={technicians}
          origins={origins}
          fullAlistamientos={fullAlistamientos}
          rawFullAlistamientos={rawFullAlistamientos}
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
          isMatriz={isMatriz}
          selectedWorkshopFilter={selectedWorkshopFilter}
          onSelectWorkshopFilter={setSelectedWorkshopFilter}
        />
      ) : (
        <TallerViewMobile
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onLogout={onLogout}
          orders={orders}
          onUpdateOrderStatus={updateOrderStatus}
          agendamientos={agendamientos}
          onDeleteAgendamiento={deleteAgendamiento}
          warranties={warranties}
          clients={clients}
          inventory={inventory}
          workshops={workshops}
          technicians={technicians}
          origins={origins}
          fullAlistamientos={fullAlistamientos}
          rawFullAlistamientos={rawFullAlistamientos}
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
          isMatriz={isMatriz}
          selectedWorkshopFilter={selectedWorkshopFilter}
          onSelectWorkshopFilter={setSelectedWorkshopFilter}
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
