// src/CustomerPortal.tsx
import React from 'react';
import { useCustomerPortal } from './hooks/useCustomerPortal';
import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { SidebarDrawer, ActiveSection } from './components/SidebarDrawer';
import { ClientProfileView } from './components/ClientProfileView';
import {
  Clock,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  X,
  Camera,
  History,
  ShieldCheck,
  Wrench,
  ChevronRight,
  Maximize2,
  MapPin,
  MessageCircle,
  Fuel,
  Gauge,
  Check,
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

  // Si no está autenticado, renderizar página independiente de Login
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={login} />;
  }

  // Título de la sección activa
  const sectionTitles: Record<ActiveSection, string> = {
    perfil: 'Mi Perfil & Mantenimientos Programados',
    orden_activa: 'Seguimiento de Orden de Trabajo Activa',
    inspeccion: 'Inspección 360° de Recepción & Firma',
    historial: 'Historial de Mantenimientos & Facturación',
    garantias: 'Pólizas & Garantías Activas',
  };

  const isQuotationPending = activeOrder.quotation.status === 'pendiente_aprobacion';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* 1. Navbar Superior con botón hamburguesa */}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ========================================================================= */}
        {/* PESTAÑA 1 (PRINCIPAL): INFORMACIÓN DEL CLIENTE (PERFIL) & MANTENIMIENTOS */}
        {/* ========================================================================= */}
        {activeSection === 'perfil' && (
          <ClientProfileView
            profile={profile}
            onUpdateProfile={updateProfile}
            motorcycle={motorcycle}
            onUpdateMotorcycle={updateMotorcycle}
            scheduledMaintenances={scheduledMaintenances}
            onScheduleNewMaintenance={addScheduledMaintenance}
            branches={branches}
          />
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 2: ORDEN DE TRABAJO ACTIVA & APROBACIÓN DE PRESUPUESTO            */}
        {/* ========================================================================= */}
        {activeSection === 'orden_activa' && (
          <div className="space-y-6 animate-fade-in pb-12">
            {/* Header de la OT */}
            <div className="bg-zinc-900/90 rounded-3xl p-6 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-red-500 uppercase tracking-wide">
                    {motorcycle.brand} {motorcycle.model}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">({motorcycle.plate})</span>
                </div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Orden de Trabajo:</span>
                  <span className="font-mono text-blue-400">{activeOrder.otNumber}</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Ingreso: {activeOrder.entryDate} • Entrega estimada: <strong className="text-white">{activeOrder.estimatedDelivery}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-extrabold uppercase px-3 py-1.5 rounded-xl ${
                  isQuotationPending
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {isQuotationPending ? 'Presupuesto Pendiente' : 'En Reparación'}
                </span>
              </div>
            </div>

            {/* Stepper de 7 Fases */}
            <div className="bg-zinc-900/90 rounded-3xl p-6 border border-zinc-800 shadow-xl space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Progreso de la Moto en Taller</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {activeOrder.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`rounded-2xl p-3 border transition-all ${
                      step.current
                        ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10'
                        : step.completed
                        ? 'bg-zinc-950/80 border-zinc-800'
                        : 'bg-zinc-950/30 border-zinc-900 opacity-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono text-zinc-500">0{idx + 1}</span>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                        step.completed
                          ? 'bg-emerald-500 text-zinc-950 font-bold'
                          : step.current
                          ? 'bg-blue-600 text-white font-bold animate-pulse'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {step.completed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                      </div>
                    </div>
                    <h4 className={`text-xs font-bold truncate ${step.current ? 'text-white' : 'text-zinc-300'}`}>
                      {step.shortLabel}
                    </h4>
                    <span className="text-[9px] text-zinc-500 block truncate mt-0.5 font-mono">
                      {step.timestamp || 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Presupuesto y Botón de Aprobación */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Desglose de Repuestos y Servicios */}
              <div className="lg:col-span-2 bg-zinc-900/90 rounded-3xl p-6 border border-zinc-800 shadow-xl space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-red-500" />
                  <span>Detalle de Cotización #{activeOrder.quotation.quotationNumber}</span>
                </h3>

                {/* Repuestos */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Repuestos y Fluidos Requeridos:
                  </span>
                  <div className="space-y-1.5">
                    {activeOrder.quotation.parts.map((p) => (
                      <div key={p.code} className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-850 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-white block">{p.description}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {p.brand} • Cant: {p.quantity} × ${p.unitPrice.toFixed(2)}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-white">${p.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mano de Obra */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Mano de Obra Certificada:
                  </span>
                  <div className="space-y-1.5">
                    {activeOrder.quotation.services.map((s) => (
                      <div key={s.code} className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-850 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-white block">{s.description}</span>
                          <span className="text-[10px] text-zinc-500">{s.hours} horas técnicas estándar</span>
                        </div>
                        <span className="font-mono font-bold text-white">${s.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total y Acción */}
              <div className="bg-zinc-900/90 rounded-3xl p-6 border border-zinc-800 shadow-xl flex flex-col justify-between space-y-4">
                <div className="space-y-3 text-xs">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                    Liquidación SRI (IVA 15%)
                  </h3>

                  <div className="space-y-2 pt-2 border-t border-zinc-800 text-zinc-400">
                    <div className="flex justify-between">
                      <span>Subtotal Repuestos:</span>
                      <span className="font-mono text-zinc-200">${activeOrder.quotation.subtotalParts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal Mano de Obra:</span>
                      <span className="font-mono text-zinc-200">${activeOrder.quotation.subtotalServices.toFixed(2)}</span>
                    </div>
                    {activeOrder.quotation.discount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Descuento Cliente:</span>
                        <span className="font-mono">-${activeOrder.quotation.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>IVA Ecuador (15%):</span>
                      <span className="font-mono text-zinc-200">${activeOrder.quotation.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-800 flex justify-between text-base font-extrabold text-white">
                      <span>Total a Pagar:</span>
                      <span className="font-mono text-blue-400">${activeOrder.quotation.total.toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>

                {isQuotationPending ? (
                  <button
                    onClick={() => setIsApprovalModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprobar Presupuesto (${activeOrder.quotation.total.toFixed(2)})</span>
                  </button>
                ) : (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl text-center text-xs text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <span className="font-bold block">Presupuesto Aprobado</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{activeOrder.quotation.approvedAt}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 3: INSPECCIÓN 360°                                                */}
        {/* ========================================================================= */}
        {activeSection === 'inspeccion' && (
          <div className="bg-zinc-900/90 rounded-3xl p-6 border border-zinc-800 shadow-xl space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-base font-black text-white">Inspección 360° de Recepción</h2>
                <p className="text-xs text-zinc-400">Fotografías oficiales, estado visual y firma de conformidad</p>
              </div>
              <span className="text-xs font-mono text-zinc-400">{inspection.receptionDate}</span>
            </div>

            {/* Grid de 5 Fotos */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { title: 'Frontal', url: inspection.photos.frontal },
                { title: 'Lateral Izq.', url: inspection.photos.lateralIzq },
                { title: 'Lateral Der.', url: inspection.photos.lateralDer },
                { title: 'Trasera', url: inspection.photos.trasera },
                { title: 'Tablero & Odómetro', url: inspection.photos.tablero },
              ].map((p, i) => (
                <div
                  key={i}
                  onClick={() => setActivePhotoModal({ url: p.url, title: p.title, subtitle: 'Registro Fotográfico Oficial' })}
                  className="group relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-square cursor-pointer hover:border-blue-500 transition"
                >
                  <img src={p.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                    <span className="text-[11px] font-bold text-white">{p.title}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Daños Previos y Firma */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-850 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Daños Previos al Ingreso:
                </span>
                {inspection.damages.map((dmg) => (
                  <div key={dmg.id} className="text-xs text-zinc-300 border-b border-zinc-850 pb-2 last:border-0">
                    <span className="font-bold text-white">{dmg.zone}</span> - <span className="text-amber-400">{dmg.damageType}</span>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{dmg.advisorNotes}</p>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-850 flex flex-col justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">
                  Firma Digital del Cliente en Check-in:
                </span>
                <div className="bg-white rounded-xl p-3 flex items-center justify-center">
                  <img src={inspection.signature.signatureUrl} alt="Firma" className="h-14 object-contain" />
                </div>
                <p className="text-[10px] text-zinc-500 text-center font-mono mt-2">
                  Firmado por {inspection.signature.clientName} (C.I: {inspection.signature.identificationId})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 4: HISTORIAL                                                      */}
        {/* ========================================================================= */}
        {activeSection === 'historial' && (
          <div className="bg-zinc-900/90 rounded-3xl p-6 border border-zinc-800 shadow-xl space-y-4 animate-fade-in">
            <h2 className="text-base font-black text-white border-b border-zinc-800 pb-3">
              Historial Oficial de Mantenimientos
            </h2>

            {history.map((record) => (
              <div key={record.id} className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-850 space-y-2">
                <div className="flex justify-between items-start text-xs border-b border-zinc-850 pb-2">
                  <div>
                    <span className="font-extrabold text-white text-sm">{record.date}</span>
                    <span className="text-blue-400 font-mono block">{record.mileage.toLocaleString()} KM</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400 font-mono text-sm">${record.totalPaid.toFixed(2)}</span>
                    <span className="text-[10px] text-zinc-500 block font-mono">{record.invoiceNumber}</span>
                  </div>
                </div>
                <div className="text-xs text-zinc-400">
                  <span className="font-medium text-zinc-300">{record.branchName}</span> • Técnico: {record.technicianName}
                </div>
                <ul className="list-disc list-inside text-[11px] text-zinc-300 space-y-0.5 bg-zinc-900/40 p-2.5 rounded-xl">
                  {record.workSummary.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 5: GARANTÍAS                                                      */}
        {/* ========================================================================= */}
        {activeSection === 'garantias' && (
          <div className="bg-zinc-900/90 rounded-3xl p-6 border border-zinc-800 shadow-xl space-y-4 animate-fade-in">
            <h2 className="text-base font-black text-white border-b border-zinc-800 pb-3">
              Garantías y Pólizas Vigentes
            </h2>

            {warranties.map((war) => (
              <div key={war.id} className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-850 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-white text-sm">{war.title}</h3>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Vigente
                  </span>
                </div>
                <p className="text-zinc-300 text-[11px]">{war.coverage}</p>
                <div className="flex gap-4 text-[11px] text-zinc-400 font-mono pt-1">
                  <span>Vencimiento: <strong className="text-white">{war.expirationDate}</strong></span>
                  <span>Límite: <strong className="text-white">{war.kmLimit.toLocaleString()} km</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ================= MODAL: APROBACIÓN DE PRESUPUESTO ================= */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-white">Autorizar Presupuesto</h3>
              </div>
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-850 space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>Repuestos y Fluidos:</span>
                  <span className="font-mono text-white">${activeOrder.quotation.subtotalParts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Mano de Obra:</span>
                  <span className="font-mono text-white">${activeOrder.quotation.subtotalServices.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>IVA Ecuador (15%):</span>
                  <span className="font-mono text-white">${activeOrder.quotation.taxAmount.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-sm text-white">
                  <span>Monto Total:</span>
                  <span className="font-mono text-blue-400 text-base">${activeOrder.quotation.total.toFixed(2)} USD</span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Al confirmar, autorizas a StarMotos a iniciar el montaje de repuestos y ejecución de los trabajos mecánicos.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 font-bold hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={approveQuotation}
                  disabled={isApproving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-lg shadow-blue-600/30"
                >
                  {isApproving ? 'Procesando...' : 'Confirmar y Aprobar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: VISOR DE FOTOS ================= */}
      {activePhotoModal && (
        <div
          onClick={() => setActivePhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">{activePhotoModal.title}</h4>
              <button
                onClick={() => setActivePhotoModal(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center max-h-[70vh]">
              <img src={activePhotoModal.url} alt={activePhotoModal.title} className="max-h-[65vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* ================= TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-zinc-900 border border-blue-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-extrabold text-blue-400 block">StarMotos Portal</span>
            <p className="text-zinc-200">{toastMessage.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};
