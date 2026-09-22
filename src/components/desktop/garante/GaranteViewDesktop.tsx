// src/components/desktop/garante/GaranteViewDesktop.tsx
import React from 'react';
import {
  Inbox,
  History,
  BarChart3,
  Building2,
  LogOut,
  MapPin,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
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
import { SolicitudesGaranteDesktop } from './SolicitudesGaranteDesktop';
import { HistorialGarantiasDesktop } from './HistorialGarantiasDesktop';
import { ReportesGaranteDesktop } from './ReportesGaranteDesktop';
import { PerfilGaranteDesktop } from './PerfilGaranteDesktop';
import { ClientesModule } from '../../common/ClientesModule';
import { AlertasDesktop } from '../admin/AlertasDesktop';
import { NotificationsPopover } from '../../common/NotificationsPopover';

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
  onApproveWarranty: (idOverride?: string, notesOverride?: string) => void;
  onRejectWarranty: (idOverride?: string, reasonOverride?: string) => void;
  alerts: SystemAlert[];
  onMarkAlertAsRead: (id: string) => void;
  onMarkAllAlertsAsRead: () => void;
}

export const GaranteViewDesktop: React.FC<Props> = ({
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
}) => {
  const menuItems: { id: GaranteSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'solicitudes_garante',
      label: 'Bandeja de Entrada',
      icon: <Inbox className="w-4 h-4" />,
      badge: `${pendingRequests.length || ''}`,
    },
    {
      id: 'clientes_garante',
      label: 'Clientes & Flota',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'historial_garantias',
      label: 'Historial Dictámenes',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'reportes_garante',
      label: 'Reportes & Calidad',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'perfil_garante',
      label: 'Ficha de Marca',
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'alertas_garante',
      label: 'Alertas & Eventos',
      icon: <Bell className="w-4 h-4" />,
      badge: alerts.filter((a) => !a.read).length > 0 ? String(alerts.filter((a) => !a.read).length) : undefined,
    },
  ];

  const sectionTitles: Record<GaranteSection, string> = {
    solicitudes_garante: 'Solicitudes de Garantía Pendientes de Dictamen',
    clientes_garante: 'Clientes y Unidades con Cobertura de Garantía',
    historial_garantias: 'Historial Consolidado de Garantías Emitidas',
    reportes_garante: 'Indicadores Técnicos & Tasa de Reclamos',
    perfil_garante: 'Información Institucional del Garante Oficial',
    alertas_garante: 'Auditoría de Alertas & Eventos del Garante',
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white text-zinc-900 overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* 1. HEADER */}
      <header className="h-16 shrink-0 w-full bg-blue-700 border-b border-blue-800 text-white shadow-md flex items-center justify-between px-6 z-30 select-none">
        <div className="w-72 shrink-0 flex items-center gap-3 pr-4">
          <div className="bg-white px-3 py-1 rounded-xl shadow-xs flex items-center justify-center shrink-0">
            <img
              src="/logoheader.webp"
              alt="StarMotos"
              className="h-7 w-auto object-contain"
            />
          </div>
          <span className="text-[10px] text-purple-200 font-mono tracking-widest uppercase font-bold">
            Garante Oficial
          </span>
        </div>

        <div className="flex-1 flex items-center justify-between pl-6 border-l border-blue-600/60 min-w-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs text-blue-200 font-mono font-medium">Garante /</span>
            <h1 className="text-sm lg:text-base font-bold text-white tracking-tight truncate">
              {sectionTitles[activeSection]}
            </h1>
          </div>

          <div className="flex items-center gap-3.5 shrink-0">
            <NotificationsPopover
              role="garante"
              alerts={alerts}
              warranties={warranties}
              onViewAll={() => setActiveSection('alertas_garante')}
              onMarkAlertAsRead={onMarkAlertAsRead}
              onMarkAllAlertsAsRead={onMarkAllAlertsAsRead}
            />

            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-800 border border-blue-600 text-xs text-blue-100 font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Auditoría Oficial Benelli & CFMOTO</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-300 font-semibold shadow-xs" title="Conectado en tiempo real con Supabase Cloud">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>BD Nube Activa</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <aside className="w-72 shrink-0 h-full bg-[#dce8f5] border-r border-[#b8d1ea] flex flex-col justify-between z-20 select-none shadow-xs">
          {/* Info Garante */}
          <div className="shrink-0 p-4 border-b border-[#b8d1ea] bg-white/40">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-purple-700 text-white font-black text-sm flex items-center justify-center border-2 border-purple-600 shadow-xs shrink-0">
                GAR
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-zinc-900 truncate">Ing. Paulina Velasteguí</h3>
                <p className="text-[10px] text-zinc-600 font-mono">Jefa Nacional de Garantías</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  <span className="text-[10px] text-purple-900 font-bold">Garante Autorizado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menú */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-950/70 px-3 py-1 block">
              Módulos del Garante
            </span>
            {menuItems.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-800 hover:bg-white/60 hover:text-blue-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-white' : 'text-blue-700'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && item.badge !== '' ? (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        active
                          ? 'bg-white text-blue-700'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="shrink-0 p-3.5 border-t border-[#b8d1ea] space-y-2 bg-[#dce8f5]">
            <div className="px-3 py-2 rounded-xl bg-white/70 border border-[#b8d1ea] text-xs text-zinc-700 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">Sede Corporativa Quito</span>
              </div>
              <p className="truncate text-zinc-600 text-[11px] mt-0.5">Av. Granados E12-40</p>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-red-50 border border-zinc-300 hover:border-red-300 text-zinc-800 hover:text-red-700 text-xs font-bold transition active:scale-98 cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main
          className={`flex-1 w-full bg-white ${
            activeSection === 'clientes_garante'
              ? 'overflow-hidden flex flex-col p-4'
              : 'overflow-y-auto px-6 lg:px-8 py-6'
          }`}
        >
          <div className={`w-full ${activeSection === 'clientes_garante' ? 'flex-1 min-h-0 flex flex-col' : ''}`}>
            {activeSection === 'solicitudes_garante' && (
              <SolicitudesGaranteDesktop
                pendingRequests={pendingRequests}
                onOpenDecisionModal={onOpenDecisionModal}
                onApproveWarranty={onApproveWarranty}
                onRejectWarranty={onRejectWarranty}
              />
            )}
            {activeSection === 'clientes_garante' && (
              <ClientesModule
                role="garante"
                workshops={workshops}
                fullAlistamientos={fullAlistamientos}
                clients={clients}
                warranties={warranties}
              />
            )}
            {activeSection === 'historial_garantias' && (
              <HistorialGarantiasDesktop historyRequests={historyRequests} />
            )}
            {activeSection === 'reportes_garante' && (
              <ReportesGaranteDesktop warranties={warranties} />
            )}
            {activeSection === 'perfil_garante' && <PerfilGaranteDesktop profile={profile} />}
            {activeSection === 'alertas_garante' && (
              <AlertasDesktop
                alerts={alerts}
                onMarkAsRead={onMarkAlertAsRead}
                onMarkAllAsRead={onMarkAllAlertsAsRead}
                title="Auditoría de Alertas & Eventos del Garante"
                subtitle="Registro de solicitudes ingresadas, validaciones y dictámenes técnicos de garantías Benelli & CFMOTO."
              />
            )}
          </div>
        </main>
      </div>

      {/* MODAL DE DICTAMEN (APROBAR / RECHAZAR) */}
      {isActionModalOpen && selectedWarranty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-zinc-200 animate-slide-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                {actionType === 'aprobar' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span>
                  {actionType === 'aprobar' ? 'Emitir Aprobación Oficial' : 'Rechazar Cobertura de Garantía'}
                </span>
              </h3>
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl text-xs space-y-1">
              <p className="font-bold text-zinc-900">
                {selectedWarranty.requestNumber} — {selectedWarranty.motorcycleBrand} {selectedWarranty.motorcycleModel}
              </p>
              <p className="text-zinc-500 font-mono">VIN: {selectedWarranty.motorcycleVin} • Cliente: {selectedWarranty.clientName}</p>
            </div>

            {actionType === 'aprobar' ? (
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Notas Técnicas de Autorización (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Se autoriza cambio de repuestos OEM y mano de obra conforme a póliza de fábrica..."
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-blue-600 resize-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold uppercase text-red-700 mb-1">
                  Motivo Técnico del Rechazo (Obligatorio)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Detallar por qué no aplica la garantía (ej: desgaste natural, alteración electrónica, golpe físico)..."
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-red-300 rounded-xl outline-none focus:border-red-600 resize-none"
                  required
                />
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsActionModalOpen(false)}
                className="flex-1 py-2 border border-zinc-300 text-zinc-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              {actionType === 'aprobar' ? (
                <button
                  type="button"
                  onClick={() => onApproveWarranty()}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Confirmar Aprobación
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onRejectWarranty()}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Confirmar Rechazo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
