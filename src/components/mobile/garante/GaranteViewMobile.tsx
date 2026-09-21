// src/components/mobile/garante/GaranteViewMobile.tsx
import React, { useState } from 'react';
import {
  Menu,
  X,
  Inbox,
  History,
  BarChart3,
  Building2,
  LogOut,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  GaranteSection,
  WarrantyRequest,
  GaranteProfile,
} from '../../../types/customer';
import { SolicitudesGaranteMobile } from './SolicitudesGaranteMobile';
import { HistorialGarantiasMobile } from './HistorialGarantiasMobile';
import { ReportesGaranteMobile } from './ReportesGaranteMobile';
import { PerfilGaranteMobile } from './PerfilGaranteMobile';

interface Props {
  activeSection: GaranteSection;
  setActiveSection: (section: GaranteSection) => void;
  onLogout: () => void;
  warranties: WarrantyRequest[];
  pendingRequests: WarrantyRequest[];
  historyRequests: WarrantyRequest[];
  profile: GaranteProfile;
  selectedWarranty: WarrantyRequest | null;
  reviewNotes: string;
  setReviewNotes: (val: string) => void;
  rejectionReason: string;
  setRejectionReason: (val: string) => void;
  isActionModalOpen: boolean;
  setIsActionModalOpen: (open: boolean) => void;
  actionType: 'aprobar' | 'rechazar';
  onOpenDecisionModal: (warranty: WarrantyRequest, type: 'aprobar' | 'rechazar') => void;
  onApproveWarranty: () => void;
  onRejectWarranty: () => void;
}

export const GaranteViewMobile: React.FC<Props> = ({
  activeSection,
  setActiveSection,
  onLogout,
  warranties,
  pendingRequests,
  historyRequests,
  profile,
  selectedWarranty,
  reviewNotes,
  setReviewNotes,
  rejectionReason,
  setRejectionReason,
  isActionModalOpen,
  setIsActionModalOpen,
  actionType,
  onOpenDecisionModal,
  onApproveWarranty,
  onRejectWarranty,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems: { id: GaranteSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'solicitudes_garante', label: 'Bandeja', icon: <Inbox className="w-4 h-4" />, badge: `${pendingRequests.length || ''}` },
    { id: 'historial_garantias', label: 'Historial', icon: <History className="w-4 h-4" /> },
    { id: 'reportes_garante', label: 'Reportes', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'perfil_garante', label: 'Ficha Marca', icon: <Building2 className="w-4 h-4" /> },
  ];

  const sectionTitles: Record<GaranteSection, string> = {
    solicitudes_garante: 'Bandeja de Entrada',
    historial_garantias: 'Historial Dictámenes',
    reportes_garante: 'Reportes Técnicos',
    perfil_garante: 'Ficha de Marca',
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased">
      <header className="sticky top-0 z-40 bg-blue-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-black tracking-wider uppercase block leading-none">
              <span className="text-white">STAR</span>
              <span className="text-red-400">MOTOS</span>
            </span>
            <span className="text-[9px] text-purple-200 uppercase font-mono">Garante Oficial</span>
          </div>
        </div>

        <span className="text-xs font-bold text-white truncate max-w-[150px]">
          {sectionTitles[activeSection]}
        </span>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] h-full bg-[#dce8f5] border-r border-[#b8d1ea] flex flex-col justify-between shadow-2xl z-10 p-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#b8d1ea]">
                <span className="text-xs font-bold text-zinc-900">Ing. Paulina Velasteguí</span>
                <button onClick={() => setDrawerOpen(false)} className="p-1 rounded-lg bg-white text-zinc-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                      activeSection === item.id ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-800 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-3 border-t border-[#b8d1ea]">
              <button
                onClick={onLogout}
                className="w-full py-2 bg-white text-red-600 border border-zinc-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="max-w-md mx-auto px-4 py-4">
        {activeSection === 'solicitudes_garante' && (
          <SolicitudesGaranteMobile
            pendingRequests={pendingRequests}
            onOpenDecisionModal={onOpenDecisionModal}
          />
        )}
        {activeSection === 'historial_garantias' && (
          <HistorialGarantiasMobile historyRequests={historyRequests} />
        )}
        {activeSection === 'reportes_garante' && (
          <ReportesGaranteMobile warranties={warranties} />
        )}
        {activeSection === 'perfil_garante' && <PerfilGaranteMobile profile={profile} />}
      </main>

      {/* Modal Decisión Móvil */}
      {isActionModalOpen && selectedWarranty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-zinc-900">
              {actionType === 'aprobar' ? 'Aprobar Garantía de Fábrica' : 'Rechazar Cobertura'}
            </h4>
            <p className="text-[11px] text-zinc-600">
              {selectedWarranty.requestNumber} — {selectedWarranty.motorcycleBrand} {selectedWarranty.motorcycleModel}
            </p>

            {actionType === 'aprobar' ? (
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Notas de aprobación..."
                className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg"
              />
            ) : (
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Motivo del rechazo..."
                className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-red-300 rounded-lg"
                required
              />
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsActionModalOpen(false)}
                className="flex-1 py-1.5 border border-zinc-300 rounded-lg text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={actionType === 'aprobar' ? onApproveWarranty : onRejectWarranty}
                className={`flex-1 py-1.5 text-white rounded-lg text-xs font-bold ${
                  actionType === 'aprobar' ? 'bg-emerald-600' : 'bg-red-600'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
