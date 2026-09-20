// src/CustomerPortal.tsx
import React, { useState, useEffect } from 'react';
import { useCustomerPortal, ScenarioKey } from './hooks/useCustomerPortal';
import { CustomerViewMobile } from './components/CustomerViewMobile';
import { CustomerViewDesktop } from './components/CustomerViewDesktop';
import {
  Smartphone,
  Monitor,
  CheckCircle2,
  X,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  Printer,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const portal = useCustomerPortal();
  const {
    portalData,
    isApproving,
    isApprovalModalOpen,
    setIsApprovalModalOpen,
    approveQuotation,
    activePhotoModal,
    closePhotoModal,
    toastMessage,
    currentScenarioKey,
    changeScenario,
  } = portal;

  // Modo de visualización: 'auto' | 'mobile' | 'desktop'
  const [viewMode, setViewMode] = useState<'auto' | 'mobile' | 'desktop'>('auto');
  const [isWindowMobile, setIsWindowMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  // Listener para tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsWindowMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determinar si se renderiza Mobile o Desktop
  const renderMobile = viewMode === 'mobile' || (viewMode === 'auto' && isWindowMobile);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 selection:bg-orange-500 selection:text-white">
      {/* Barra de Herramientas para Evaluación / Demo (No interfiere con el portal) */}
      <div className="no-print bg-zinc-900 border-b border-zinc-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-orange-400 uppercase tracking-wide flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            StarMotos Demo Bar:
          </span>

          {/* Selector de Escenario */}
          <div className="relative inline-block">
            <select
              value={currentScenarioKey}
              onChange={(e) => changeScenario(e.target.value as ScenarioKey)}
              className="bg-zinc-950 border border-zinc-750 text-zinc-200 text-xs rounded-lg px-2.5 py-1 pr-7 font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="benelli_cotizacion">1. Benelli TRK 502X - Cotización Pendiente (Probar Aprobación)</option>
              <option value="yamaha_en_reparacion">2. Yamaha MT-03 - En Reparación</option>
              <option value="honda_lista_retiro">3. Honda CB190R - ¡Lista para Retiro!</option>
            </select>
          </div>
        </div>

        {/* Selector de Dispositivo (Móvil vs Escritorio) */}
        <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => setViewMode('auto')}
            className={`px-2 py-1 rounded text-[11px] font-bold transition ${
              viewMode === 'auto' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Auto (Responsivo)
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition ${
              viewMode === 'mobile' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>Móvil App</span>
          </button>
          <button
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition ${
              viewMode === 'desktop' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3 h-3" />
            <span>Escritorio</span>
          </button>
        </div>
      </div>

      {/* RENDERIZADO CONDICIONAL DE VISTAS */}
      {renderMobile ? (
        <div className="max-w-md mx-auto min-h-screen bg-zinc-950 shadow-2xl border-x border-zinc-900">
          <CustomerViewMobile portal={portal} />
        </div>
      ) : (
        <CustomerViewDesktop portal={portal} />
      )}

      {/* ================= MODAL: APROBACIÓN DE PRESUPUESTO ================= */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Autorización de Presupuesto Técnico</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Proforma #{portalData.activeOrder.quotation.quotationNumber} • OT #{portalData.activeOrder.otNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-850 space-y-2">
                <div className="flex justify-between text-zinc-300">
                  <span>Vehículo:</span>
                  <span className="font-bold text-white">
                    {portalData.vehicle.brand} {portalData.vehicle.model} ({portalData.vehicle.plate})
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Repuestos y Fluidos:</span>
                  <span className="font-mono">${portalData.activeOrder.quotation.subtotalParts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Mano de Obra Certificada:</span>
                  <span className="font-mono">${portalData.activeOrder.quotation.subtotalServices.toFixed(2)}</span>
                </div>
                {portalData.activeOrder.quotation.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Descuento Aplicado:</span>
                    <span className="font-mono">-${portalData.activeOrder.quotation.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>IVA SRI (15%):</span>
                  <span className="font-mono">${portalData.activeOrder.quotation.taxAmount.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline text-sm font-extrabold text-white">
                  <span className="text-orange-400">Monto Total a Cancelar:</span>
                  <span className="font-mono text-base text-orange-400">
                    ${portalData.activeOrder.quotation.total.toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Términos de Autorización:
                </p>
                <p>
                  Al hacer clic en "Confirmar y Aprobar", usted autoriza formalmente a StarMotos ({portalData.activeOrder.branch.name}) a instalar los repuestos descritos e iniciar los servicios técnicos correspondientes.
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-950/70 border-t border-zinc-800 flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(false)}
                disabled={isApproving}
                className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-850 transition"
              >
                Revisar Más Tarde
              </button>

              <button
                type="button"
                onClick={approveQuotation}
                disabled={isApproving}
                className="flex-1 py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-lg shadow-orange-600/30 transition flex items-center justify-center gap-2 active:scale-98"
              >
                {isApproving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar y Aprobar (${portalData.activeOrder.quotation.total.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: VISUALIZADOR DE FOTOS (LIGHTBOX) ================= */}
      {activePhotoModal && (
        <div
          onClick={closePhotoModal}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{activePhotoModal.title}</h4>
                {activePhotoModal.subtitle && (
                  <p className="text-xs text-zinc-400">{activePhotoModal.subtitle}</p>
                )}
              </div>
              <button
                onClick={closePhotoModal}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 bg-black flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={activePhotoModal.url}
                alt={activePhotoModal.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>

            <div className="p-3 bg-zinc-950/80 border-t border-zinc-850 flex items-center justify-between text-xs text-zinc-400">
              <span>StarMotos Evidencia Digital • Inspección Verificada</span>
              <button
                onClick={closePhotoModal}
                className="text-xs font-bold text-orange-400 hover:underline"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= NOTIFICACIÓN TOAST ================= */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md bg-zinc-900 border border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <span className="font-extrabold text-emerald-400 block mb-0.5">Operación Exitosa</span>
            <p className="text-zinc-200">{toastMessage.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};
