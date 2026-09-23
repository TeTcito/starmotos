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
  Users,
  Bell,
} from 'lucide-react';
import {
  GaranteSection,
  WarrantyRequest,
  GaranteProfile,
  AlistamientoFullRecord,
  TallerClient,
  Workshop,
  SystemAlert,
} from '../../../types/customer';
import { SolicitudesGaranteMobile } from './SolicitudesGaranteMobile';
import { HistorialGarantiasMobile } from './HistorialGarantiasMobile';
import { ReportesGaranteMobile } from './ReportesGaranteMobile';
import { PerfilGaranteMobile } from './PerfilGaranteMobile';
import { ClientesModule } from '../../common/ClientesModule';
import { TalleresGaranteMobile } from './TalleresGaranteMobile';
import { AlertasMobile } from '../admin/AlertasMobile';
import { NotificationsPopover } from '../../common/NotificationsPopover';
import { WarrantyDetailViewMobile } from '../common/WarrantyDetailViewMobile';

interface Props {
  activeSection: GaranteSection;
  setActiveSection: (section: GaranteSection) => void;
  onLogout: () => void;
  warranties: WarrantyRequest[];
  pendingRequests: WarrantyRequest[];
  historyRequests: WarrantyRequest[];
  fullAlistamientos: AlistamientoFullRecord[];
  clients: TallerClient[];
  workshops: Workshop[];
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
  onApproveWarranty: (idOverride?: string, notesOverride?: string, resolutionTypeOverride?: 'encargar_taller' | 'envio_repuesto') => void;
  onRejectWarranty: (idOverride?: string, reasonOverride?: string) => void;
  alerts: SystemAlert[];
  onMarkAlertAsRead: (id: string) => void;
  onMarkAllAlertsAsRead: () => void;
  onDeleteAlert?: (id: string) => void;
  onDeleteAllReadAlerts?: () => void;
  onUpdateProfile?: (updated: GaranteProfile) => void;
}

export const GaranteViewMobile: React.FC<Props> = ({
  activeSection,
  setActiveSection,
  onLogout,
  warranties,
  pendingRequests,
  historyRequests,
  fullAlistamientos,
  clients,
  workshops,
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
  alerts,
  onMarkAlertAsRead,
  onMarkAllAlertsAsRead,
  onDeleteAlert,
  onDeleteAllReadAlerts,
  onUpdateProfile,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileResolution, setMobileResolution] = useState<'encargar_taller' | 'envio_repuesto'>('encargar_taller');
  const [selectedWarrantyForDetail, setSelectedWarrantyForDetail] = useState<WarrantyRequest | null>(null);

  const menuItems: { id: GaranteSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'solicitudes_garante', label: 'Bandeja', icon: <Inbox className="w-4 h-4" />, badge: `${pendingRequests.length || ''}` },
    { id: 'clientes_garante', label: 'Talleres B2B', icon: <Building2 className="w-4 h-4" /> },
    { id: 'historial_garantias', label: 'Historial', icon: <History className="w-4 h-4" /> },
    { id: 'reportes_garante', label: 'Reportes', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'perfil_garante', label: 'Mi Perfil', icon: <Building2 className="w-4 h-4" /> },
    {
      id: 'alertas_garante',
      label: 'Alertas & Eventos',
      icon: <Bell className="w-4 h-4" />,
      badge: alerts.filter((a) => !a.read).length > 0 ? String(alerts.filter((a) => !a.read).length) : undefined,
    },
  ];

  const sectionTitles: Record<GaranteSection, string> = {
    solicitudes_garante: 'Bandeja de Entrada',
    clientes_garante: 'Red de Talleres & Concesionarios',
    historial_garantias: 'Historial Dictámenes',
    reportes_garante: 'Reportes Técnicos',
    perfil_garante: 'Mi Perfil',
    alertas_garante: 'Alertas & Eventos',
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased">
      <header className="sticky top-0 z-40 bg-blue-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="bg-white px-2 py-0.5 rounded-lg shadow-xs flex items-center justify-center shrink-0">
            <img
              src="/logoheader.webp"
              alt="StarMotos"
              className="h-5 w-auto object-contain"
            />
          </div>
          <span className="text-[9px] text-purple-200 uppercase font-mono font-bold hidden sm:inline">Garante</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white truncate max-w-[130px]">
            {selectedWarrantyForDetail ? 'Ficha de Garantía' : sectionTitles[activeSection]}
          </span>
          <NotificationsPopover
            role="garante"
            alerts={alerts}
            warranties={warranties}
            onViewAll={() => {
              setSelectedWarrantyForDetail(null);
              setActiveSection('alertas_garante');
              setDrawerOpen(false);
            }}
            onMarkAlertAsRead={onMarkAlertAsRead}
            onMarkAllAlertsAsRead={onMarkAllAlertsAsRead}
            onDeleteAlert={onDeleteAlert}
            onDeleteAllReadAlerts={onDeleteAllReadAlerts}
          />
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] h-full bg-[#dce8f5] border-r border-[#b8d1ea] flex flex-col justify-between shadow-2xl z-10 p-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#b8d1ea]">
                <div className="min-w-0 flex-1 pr-2">
                  <span className="text-xs font-bold text-zinc-900 truncate block">
                    {profile.contactName || profile.companyName || 'Garante Autorizado'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                    <span className="text-[10px] text-purple-900 font-bold truncate">Garante Autorizado</span>
                  </div>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="p-1 rounded-lg bg-white text-zinc-600 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedWarrantyForDetail(null);
                      setActiveSection(item.id);
                      setDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                      activeSection === item.id && !selectedWarrantyForDetail
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-zinc-800 hover:bg-white/60'
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
        {selectedWarrantyForDetail ? (
          <WarrantyDetailViewMobile
            warranty={selectedWarrantyForDetail}
            onBack={() => setSelectedWarrantyForDetail(null)}
            viewerRole="garante"
            onApproveWarranty={(id, notes, resolutionType) => {
              onApproveWarranty(id, notes, resolutionType);
              setSelectedWarrantyForDetail(null);
            }}
            onRejectWarranty={(id, reason) => {
              onRejectWarranty(id, reason);
              setSelectedWarrantyForDetail(null);
            }}
          />
        ) : (
          <>
            {activeSection === 'solicitudes_garante' && (
              <SolicitudesGaranteMobile
                pendingRequests={pendingRequests}
                onOpenDecisionModal={onOpenDecisionModal}
                onSelectWarranty={(w) => setSelectedWarrantyForDetail(w)}
              />
            )}
            {activeSection === 'clientes_garante' && (
              <TalleresGaranteMobile
                workshops={workshops}
                warranties={warranties}
              />
            )}
            {activeSection === 'historial_garantias' && (
              <HistorialGarantiasMobile
                historyRequests={historyRequests}
                onSelectWarranty={(w) => setSelectedWarrantyForDetail(w)}
              />
            )}
            {activeSection === 'reportes_garante' && (
              <ReportesGaranteMobile warranties={warranties} />
            )}
            {activeSection === 'perfil_garante' && (
              <PerfilGaranteMobile profile={profile} onUpdateProfile={onUpdateProfile} />
            )}
            {activeSection === 'alertas_garante' && (
              <AlertasMobile
                alerts={alerts}
                onMarkAsRead={onMarkAlertAsRead}
                onMarkAllAsRead={onMarkAllAlertsAsRead}
                onDeleteAlert={onDeleteAlert}
                onDeleteAllReadAlerts={onDeleteAllReadAlerts}
              />
            )}
          </>
        )}
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
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                    Modalidad Dictaminada:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMobileResolution('encargar_taller')}
                      className={`p-2 rounded-xl border text-left text-xs font-bold transition ${
                        mobileResolution === 'encargar_taller'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      🔧 Encargar Taller
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileResolution('envio_repuesto')}
                      className={`p-2 rounded-xl border text-left text-xs font-bold transition ${
                        mobileResolution === 'envio_repuesto'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      📦 Envío Repuesto
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                    Observaciones Técnicas:
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Notas o directrices técnicas..."
                    className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>
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
                onClick={
                  actionType === 'aprobar'
                    ? () => {
                        onApproveWarranty(selectedWarranty.id, reviewNotes, mobileResolution);
                        setIsActionModalOpen(false);
                      }
                    : () => {
                        onRejectWarranty(selectedWarranty.id, rejectionReason);
                        setIsActionModalOpen(false);
                      }
                }
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
