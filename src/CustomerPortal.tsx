// src/CustomerPortal.tsx
import React from 'react';
import { useCustomerPortal } from './hooks/useCustomerPortal';
import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { SidebarDrawer, ActiveSection } from './components/SidebarDrawer';
import { ClientProfileView } from './components/ClientProfileView';
import { MotorcycleView } from './components/MotorcycleView';
import { MaintenancesView } from './components/MaintenancesView';
import {
  Clock,
  CheckCircle2,
  FileCheck,
  Wrench,
  Check,
  ShieldCheck,
  History,
  Sparkles,
} from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const portal = useCustomerPortal();
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

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={login} />;
  }

  // Títulos cortos y limpios para la barra superior
  const sectionTitles: Record<ActiveSection, string> = {
    perfil: 'Perfil',
    mi_moto: 'Mi Moto',
    mantenimientos: 'Mantenimientos',
    orden_activa: 'Orden Activa',
    inspeccion: 'Inspección 360°',
    historial: 'Historial',
    garantias: 'Garantías',
  };

  const isQuotationPending = activeOrder.quotation.status === 'pendiente_aprobacion';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* 1. Navbar con auto-ocultado en scroll */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(true)}
        profile={profile}
        activeBranch={activeBranch}
        onLogout={logout}
        activeSectionTitle={sectionTitles[activeSection]}
      />

      {/* 2. Drawer Lateral Desplegable (Hamburguesa) */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        profile={profile}
        activeBranch={activeBranch}
        onLogout={logout}
      />

      {/* 3. Contenido Principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        {/* ========================================================================= */}
        {/* VISTA INICIAL: SOLO EL PERFIL DEL CLIENTE                                 */}
        {/* ========================================================================= */}
        {activeSection === 'perfil' && (
          <ClientProfileView
            profile={profile}
            onUpdateProfile={updateProfile}
          />
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN MI MOTO: FICHA TÉCNICA Y DATOS PARA EL TALLER                     */}
        {/* ========================================================================= */}
        {activeSection === 'mi_moto' && (
          <MotorcycleView
            motorcycle={motorcycle}
            onUpdateMotorcycle={updateMotorcycle}
          />
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN MANTENIMIENTOS: PRÓXIMOS SERVICIOS & AGENDAR CITA                 */}
        {/* ========================================================================= */}
        {activeSection === 'mantenimientos' && (
          <MaintenancesView
            scheduledMaintenances={scheduledMaintenances}
            onScheduleNewMaintenance={addScheduledMaintenance}
            motorcycle={motorcycle}
            branches={branches}
          />
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN: ORDEN ACTIVA                                                     */}
        {/* ========================================================================= */}
        {activeSection === 'orden_activa' && (
          <div className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-12">
            {/* Header sin contenedor */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Orden de Trabajo</h2>
              </div>
              <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg ${
                isQuotationPending
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {isQuotationPending ? 'Cotización Pendiente' : 'En Reparación'}
              </span>
            </div>

            {/* Resumen OT */}
            <div className="bg-zinc-900 rounded-xl p-3.5 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-red-500 uppercase">
                    {motorcycle.brand} {motorcycle.model}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">({motorcycle.plate})</span>
                </div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>OT:</span>
                  <span className="font-mono text-blue-400">{activeOrder.otNumber}</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Entrega estimada: <strong className="text-white">{activeOrder.estimatedDelivery}</strong>
                </p>
              </div>
            </div>

            {/* Stepper de Fases */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Progreso del Taller</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {activeOrder.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`rounded-xl p-2.5 border transition-all ${
                      step.current
                        ? 'bg-blue-600/15 border-blue-500'
                        : step.completed
                        ? 'bg-zinc-900 border-zinc-800'
                        : 'bg-zinc-900/40 border-zinc-900 opacity-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono text-zinc-500">0{idx + 1}</span>
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                        step.completed
                          ? 'bg-emerald-500 text-zinc-950 font-bold'
                          : step.current
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {step.completed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                      </div>
                    </div>
                    <h4 className={`text-xs font-bold truncate ${step.current ? 'text-white' : 'text-zinc-300'}`}>
                      {step.shortLabel}
                    </h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Cotización */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="md:col-span-2 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-red-500" />
                  <span>Repuestos y Mano de Obra</span>
                </h3>

                <div className="space-y-1.5">
                  {activeOrder.quotation.parts.map((p) => (
                    <div key={p.code} className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-medium text-white block">{p.description}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {p.brand} • {p.quantity} × ${p.unitPrice.toFixed(2)}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-white">${p.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  {activeOrder.quotation.services.map((s) => (
                    <div key={s.code} className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-medium text-white block">{s.description}</span>
                        <span className="text-[10px] text-zinc-500">{s.hours} horas</span>
                      </div>
                      <span className="font-mono font-bold text-white">${s.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total y Acción */}
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex flex-col justify-between space-y-3">
                <div className="space-y-2 text-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Total Proforma (IVA 15%)
                  </h3>

                  <div className="space-y-1.5 pt-2 border-t border-zinc-800 text-zinc-400">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono text-zinc-200">${activeOrder.quotation.subtotal.toFixed(2)}</span>
                    </div>
                    {activeOrder.quotation.discount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Descuento:</span>
                        <span className="font-mono">-${activeOrder.quotation.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>IVA 15%:</span>
                      <span className="font-mono text-zinc-200">${activeOrder.quotation.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-sm text-white">
                      <span>Total:</span>
                      <span className="font-mono text-blue-400 text-base">${activeOrder.quotation.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {isQuotationPending ? (
                  <button
                    onClick={() => setIsApprovalModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprobar Presupuesto</span>
                  </button>
                ) : (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Presupuesto Aprobado</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN: INSPECCIÓN 360°                                                  */}
        {/* ========================================================================= */}
        {activeSection === 'inspeccion' && (
          <div className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-12">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Inspección 360° de Recepción</h2>
              </div>
              <span className="text-xs font-mono text-zinc-400">{inspection.receptionDate}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { title: 'Frontal', url: inspection.photos.frontal },
                { title: 'Lateral Izq.', url: inspection.photos.lateralIzq },
                { title: 'Lateral Der.', url: inspection.photos.lateralDer },
                { title: 'Trasera', url: inspection.photos.trasera },
                { title: 'Tablero', url: inspection.photos.tablero },
              ].map((p, i) => (
                <div
                  key={i}
                  onClick={() => setActivePhotoModal({ url: p.url, title: p.title })}
                  className="group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-square cursor-pointer hover:border-blue-500 transition"
                >
                  <img src={p.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                    <span className="text-[10px] font-bold text-white">{p.title}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
                <span className="font-bold text-amber-400 uppercase text-[11px] block">
                  Daños Previos al Ingreso
                </span>
                {inspection.damages.map((dmg) => (
                  <div key={dmg.id} className="text-zinc-300 border-b border-zinc-800 pb-1.5 last:border-0">
                    <span className="font-bold text-white">{dmg.zone}</span>: {dmg.damageType}
                  </div>
                ))}
              </div>

              <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 flex flex-col justify-between text-xs">
                <span className="font-bold text-zinc-300 uppercase text-[11px] block mb-1">
                  Firma de Recepción
                </span>
                <div className="bg-white rounded-lg p-2 flex items-center justify-center">
                  <img src={inspection.signature.signatureUrl} alt="Firma" className="h-10 object-contain" />
                </div>
                <p className="text-[10px] text-zinc-500 text-center font-mono mt-1">
                  {inspection.signature.clientName} ({inspection.signature.identificationId})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN: HISTORIAL                                                        */}
        {/* ========================================================================= */}
        {activeSection === 'historial' && (
          <div className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-12">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
              <History className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">
                Historial de Mantenimientos
              </h2>
            </div>

            <div className="space-y-3">
              {history.map((record) => (
                <div key={record.id} className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
                    <div>
                      <span className="font-bold text-white">{record.date}</span>
                      <span className="text-blue-400 font-mono text-[11px] ml-2">{record.mileage.toLocaleString()} KM</span>
                    </div>
                    <span className="font-bold text-emerald-400 font-mono">${record.totalPaid.toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {record.branchName} • Mecánico: {record.technicianName}
                  </div>
                  <div className="text-[11px] text-zinc-300">
                    {record.workSummary.join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN: GARANTÍAS                                                        */}
        {/* ========================================================================= */}
        {activeSection === 'garantias' && (
          <div className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-12">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">
                Garantías Vigentes
              </h2>
            </div>

            <div className="space-y-3">
              {warranties.map((war) => (
                <div key={war.id} className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white">{war.title}</h3>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Vigente
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">{war.coverage}</p>
                  <div className="flex gap-4 text-[10px] text-zinc-500 font-mono pt-1">
                    <span>Vence: <strong className="text-zinc-300">{war.expirationDate}</strong></span>
                    <span>Límite: <strong className="text-zinc-300">{war.kmLimit.toLocaleString()} km</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: APROBACIÓN DE PRESUPUESTO */}
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

      {/* MODAL: VISOR DE FOTOS */}
      {activePhotoModal && (
        <div
          onClick={() => setActivePhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl"
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
            <div className="p-2 bg-black flex items-center justify-center max-h-[65vh]">
              <img src={activePhotoModal.url} alt={activePhotoModal.title} className="max-h-[60vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-xs bg-zinc-900 border border-blue-500/40 text-white px-3.5 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 animate-slide-in text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-zinc-200">{toastMessage.text}</p>
        </div>
      )}
    </div>
  );
};
