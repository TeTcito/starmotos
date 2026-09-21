// src/hooks/useGarantePortal.ts
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  GaranteSection,
  WarrantyRequest,
  GaranteProfile,
  SystemAlert,
} from '../types/customer';
import {
  getStoredWarranties,
  saveStoredWarranties,
  INITIAL_GARANTE_PROFILE,
  saveStoredAlerts,
  getStoredAlerts,
  getStoredFullAlistamientos,
  getStoredClients,
  getStoredWorkshops,
} from '../data/mockMultiRoleData';
import { AlistamientoFullRecord, TallerClient, Workshop } from '../types/customer';

export const GARANTE_SECTIONS: GaranteSection[] = [
  'solicitudes_garante',
  'historial_garantias',
  'clientes_garante',
  'reportes_garante',
  'perfil_garante',
  'alertas_garante',
];

const getSectionFromHash = (): GaranteSection => {
  if (typeof window === 'undefined') return 'solicitudes_garante';
  const cleanHash = window.location.hash.replace(/^#\/?/, '').trim();
  if (GARANTE_SECTIONS.includes(cleanHash as GaranteSection)) {
    return cleanHash as GaranteSection;
  }
  return 'solicitudes_garante';
};

export function useGarantePortal() {
  const [activeSection, setActiveSectionState] = useState<GaranteSection>(getSectionFromHash);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeSectionRef = useRef<GaranteSection>(activeSection);
  activeSectionRef.current = activeSection;

  const [warranties, setWarranties] = useState<WarrantyRequest[]>(getStoredWarranties);
  const [fullAlistamientos, setFullAlistamientos] = useState<AlistamientoFullRecord[]>(getStoredFullAlistamientos);
  const [clients, setClients] = useState<TallerClient[]>(getStoredClients);
  const [workshops, setWorkshops] = useState<Workshop[]>(getStoredWorkshops);
  const [alerts, setAlerts] = useState<SystemAlert[]>(getStoredAlerts);
  const [profile, setProfile] = useState<GaranteProfile>(INITIAL_GARANTE_PROFILE);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modal de revisión de garantía
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'aprobar' | 'rechazar'>('aprobar');

  // Sincronización en vivo
  useEffect(() => {
    const handleWarrantiesUpdate = () => setWarranties(getStoredWarranties());
    const handleAlistamientosUpdate = () => setFullAlistamientos(getStoredFullAlistamientos());
    const handleClientsUpdate = () => setClients(getStoredClients());
    const handleWorkshopsUpdate = () => setWorkshops(getStoredWorkshops());
    const handleAlertsUpdate = () => setAlerts(getStoredAlerts());

    window.addEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
    window.addEventListener('starmotos_alistamientos_updated', handleAlistamientosUpdate);
    window.addEventListener('starmotos_clients_updated', handleClientsUpdate);
    window.addEventListener('starmotos_workshops_updated', handleWorkshopsUpdate);
    window.addEventListener('starmotos_alerts_updated', handleAlertsUpdate);

    return () => {
      window.removeEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
      window.removeEventListener('starmotos_alistamientos_updated', handleAlistamientosUpdate);
      window.removeEventListener('starmotos_clients_updated', handleClientsUpdate);
      window.removeEventListener('starmotos_workshops_updated', handleWorkshopsUpdate);
      window.removeEventListener('starmotos_alerts_updated', handleAlertsUpdate);
    };
  }, []);

  const markAlertAsRead = useCallback((id: string) => {
    setAlerts((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, read: true } : a));
      saveStoredAlerts(updated);
      return updated;
    });
  }, []);

  const markAllAlertsAsRead = useCallback(() => {
    setAlerts((prev) => {
      const updated = prev.map((a) => ({ ...a, read: true }));
      saveStoredAlerts(updated);
      return updated;
    });
  }, []);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const setActiveSection = useCallback((newSection: GaranteSection, replace = false) => {
    if (!GARANTE_SECTIONS.includes(newSection)) return;
    setActiveSectionState((current) => {
      if (current === newSection) return current;
      const targetHash = `#${newSection}`;
      if (replace) {
        window.history.replaceState({ section: newSection }, '', targetHash);
      } else {
        window.history.pushState({ section: newSection }, '', targetHash);
      }
      return newSection;
    });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const target = getSectionFromHash();
      setActiveSectionState(target);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Solicitudes pendientes de decisión del Garante (en_proceso, enviada_garante, etc.)
  const pendingRequests = useMemo(() => {
    return warranties.filter((w) =>
      ['en_proceso', 'enviada_garante', 'validada_matriz'].includes(w.status)
    );
  }, [warranties]);

  // Historial (aceptada, aprobada, denegada, rechazada, completada)
  const historyRequests = useMemo(() => {
    return warranties.filter((w) =>
      ['aceptada', 'aprobada', 'denegada', 'rechazada', 'completada'].includes(w.status)
    );
  }, [warranties]);

  // Abrir modal de decisión
  const openDecisionModal = useCallback((warranty: WarrantyRequest, type: 'aprobar' | 'rechazar') => {
    setSelectedWarranty(warranty);
    setActionType(type);
    setReviewNotes('');
    setRejectionReason('');
    setIsActionModalOpen(true);
  }, []);

  // Aprobar solicitud
  const approveWarranty = useCallback((idOverride?: string, notesOverride?: string) => {
    const targetWarranty = idOverride ? warranties.find((w) => w.id === idOverride) : selectedWarranty;
    if (!targetWarranty) return;

    const finalNotes = notesOverride || reviewNotes || 'Aprobado según especificaciones de garantía oficial de fábrica.';

    setWarranties((prev) => {
      const updated = prev.map((w) =>
        w.id === targetWarranty.id
          ? {
              ...w,
              status: 'aceptada' as const,
              garanteNotes: finalNotes,
              approvedAt: 'Hoy, Autorización Digital Garante de Marca',
            }
          : w
      );
      saveStoredWarranties(updated);
      return updated;
    });

    // Registrar alerta para Matriz y Taller
    const newAlert: SystemAlert = {
      id: `alt-${Date.now()}`,
      type: 'garantia_aprobada',
      title: 'Garantía Aprobada por Garante de Marca',
      message: `El Garante oficial autorizó la cobertura de la solicitud ${targetWarranty.requestNumber} (${targetWarranty.motorcycleBrand} ${targetWarranty.motorcycleModel}). Procede a Matriz y Taller.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: targetWarranty.id,
    };
    saveStoredAlerts([newAlert, ...getStoredAlerts()]);

    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#16a34a', '#2563eb', '#ffffff'],
    });

    setIsActionModalOpen(false);
    showToast(`Garantía ${targetWarranty.requestNumber} ACEPTADA con éxito. Notificado a Matriz y Taller.`, 'success');
  }, [selectedWarranty, reviewNotes, warranties, showToast]);

  // Rechazar solicitud
  const rejectWarranty = useCallback((idOverride?: string, reasonOverride?: string) => {
    const targetWarranty = idOverride ? warranties.find((w) => w.id === idOverride) : selectedWarranty;
    if (!targetWarranty) return;

    const finalReason = reasonOverride || rejectionReason.trim();
    if (!finalReason) {
      showToast('Debe ingresar el motivo técnico del rechazo de la garantía.', 'error');
      return;
    }

    setWarranties((prev) => {
      const updated = prev.map((w) =>
        w.id === targetWarranty.id
          ? {
              ...w,
              status: 'denegada' as const,
              garanteNotes: reviewNotes || 'Rechazado en auditoría oficial de garantías de marca.',
              rejectedAt: 'Hoy, Dictamen Garante Oficial',
              rejectionReason: finalReason,
            }
          : w
      );
      saveStoredWarranties(updated);
      return updated;
    });

    // Alertar en el sistema
    const newAlert: SystemAlert = {
      id: `alt-${Date.now()}`,
      type: 'garantia_rechazada',
      title: 'Garantía Denegada por Garante de Marca',
      message: `La solicitud ${targetWarranty.requestNumber} fue denegada por la Marca: "${finalReason}".`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: targetWarranty.id,
    };
    saveStoredAlerts([newAlert, ...getStoredAlerts()]);

    setIsActionModalOpen(false);
    showToast(`Garantía ${targetWarranty.requestNumber} DENEGADA. Notificado a Matriz y Taller.`, 'error');
  }, [selectedWarranty, rejectionReason, reviewNotes, warranties, showToast]);

  return {
    activeSection,
    setActiveSection,
    isSidebarOpen,
    setIsSidebarOpen,
    warranties,
    pendingRequests,
    historyRequests,
    fullAlistamientos,
    clients,
    workshops,
    profile,
    setProfile,
    alerts,
    markAlertAsRead,
    markAllAlertsAsRead,
    toastMessage,
    showToast,
    // Modal y acciones
    selectedWarranty,
    reviewNotes,
    setReviewNotes,
    rejectionReason,
    setRejectionReason,
    isActionModalOpen,
    setIsActionModalOpen,
    actionType,
    openDecisionModal,
    approveWarranty,
    rejectWarranty,
  };
}
