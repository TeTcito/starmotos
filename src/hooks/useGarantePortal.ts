// src/hooks/useGarantePortal.ts
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  GaranteSection,
  WarrantyRequest,
  WarrantyRequestStatus,
  GaranteProfile,
  SystemAlert,
  DictamenRecord,
} from '../types/customer';
import {
  getStoredWarranties,
  saveStoredWarranties,
  INITIAL_GARANTE_PROFILE,
  getStoredGaranteProfile,
  saveStoredGaranteProfile,
  saveStoredGarante,
  saveStoredAlerts,
  getStoredAlerts,
  addStoredAlerts,
  filterAlertsForRole,
  deleteStoredAlert,
  deleteStoredAlerts,
  getStoredFullAlistamientos,
  getStoredClients,
  getStoredWorkshops,
  getStoredDictamenes,
  saveStoredDictamen,
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
  const [allAlerts, setAllAlerts] = useState<SystemAlert[]>(getStoredAlerts);
  const [profile, setProfile] = useState<GaranteProfile>(getStoredGaranteProfile);
  const [dictamenes, setDictamenes] = useState<DictamenRecord[]>(getStoredDictamenes);
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
    const handleAlertsUpdate = () => setAllAlerts(getStoredAlerts());
    const handleGaranteProfileUpdate = () => setProfile(getStoredGaranteProfile());
    const handleDictamenesUpdate = () => setDictamenes(getStoredDictamenes());

    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('starmotos_shared_')) {
        handleWarrantiesUpdate();
        handleAlistamientosUpdate();
        handleClientsUpdate();
        handleWorkshopsUpdate();
        handleAlertsUpdate();
        handleGaranteProfileUpdate();
        handleDictamenesUpdate();
      }
    };

    window.addEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
    window.addEventListener('starmotos_alistamientos_updated', handleAlistamientosUpdate);
    window.addEventListener('starmotos_clients_updated', handleClientsUpdate);
    window.addEventListener('starmotos_workshops_updated', handleWorkshopsUpdate);
    window.addEventListener('starmotos_alerts_updated', handleAlertsUpdate);
    window.addEventListener('starmotos_garante_profile_updated', handleGaranteProfileUpdate);
    window.addEventListener('starmotos_dictamenes_updated', handleDictamenesUpdate);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
      window.removeEventListener('starmotos_alistamientos_updated', handleAlistamientosUpdate);
      window.removeEventListener('starmotos_clients_updated', handleClientsUpdate);
      window.removeEventListener('starmotos_workshops_updated', handleWorkshopsUpdate);
      window.removeEventListener('starmotos_alerts_updated', handleAlertsUpdate);
      window.removeEventListener('starmotos_garante_profile_updated', handleGaranteProfileUpdate);
      window.removeEventListener('starmotos_dictamenes_updated', handleDictamenesUpdate);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Alertas exclusivas para el Garante Oficial según sus marcas representadas
  const filteredAlerts = useMemo(() => {
    return filterAlertsForRole(allAlerts, {
      role: 'garante',
      brand: profile?.companyName,
      brandsRepresented: profile?.brandsRepresented || (profile?.companyName ? [profile.companyName] : []),
    });
  }, [allAlerts, profile]);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const updateGaranteProfile = useCallback((updated: GaranteProfile) => {
    setProfile(updated);
    saveStoredGarante(updated);
    saveStoredGaranteProfile(updated);
    showToast('Perfil de garante oficial guardado y sincronizado correctamente.', 'success');
  }, [showToast]);

  const markAlertAsRead = useCallback((id: string) => {
    const current = getStoredAlerts();
    const updated = current.map((a) => (a.id === id ? { ...a, read: true } : a));
    saveStoredAlerts(updated);
  }, []);

  const markAllAlertsAsRead = useCallback(() => {
    const current = getStoredAlerts();
    const garanteAlertIds = new Set(
      filterAlertsForRole(current, {
        role: 'garante',
        brand: profile?.companyName,
        brandsRepresented: profile?.brandsRepresented || (profile?.companyName ? [profile.companyName] : []),
      }).map((a) => a.id)
    );
    const updated = current.map((a) => (garanteAlertIds.has(a.id) ? { ...a, read: true } : a));
    saveStoredAlerts(updated);
    showToast('Notificaciones de la marca marcadas como leídas.', 'info');
  }, [profile, showToast]);

  const deleteAlert = useCallback((id: string) => {
    deleteStoredAlert(id);
    showToast('Notificación eliminada.', 'info');
  }, [showToast]);

  const deleteAllReadAlerts = useCallback(() => {
    const current = getStoredAlerts();
    const garanteAlerts = filterAlertsForRole(current, {
      role: 'garante',
      brand: profile?.companyName,
      brandsRepresented: profile?.brandsRepresented || (profile?.companyName ? [profile.companyName] : []),
    });
    const readIds = garanteAlerts.filter((a) => a.read).map((a) => a.id);
    if (readIds.length === 0) {
      showToast('No hay notificaciones leídas para eliminar.', 'info');
      return;
    }
    deleteStoredAlerts(readIds);
    showToast('Notificaciones leídas eliminadas.', 'info');
  }, [profile, showToast]);

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
    const statusFiltered = warranties.filter((w) =>
      ['en_proceso', 'enviada_garante', 'validada_matriz'].includes(w.status)
    );
    const brandTokens = [
      ...(profile?.brandsRepresented || []),
      profile?.companyName || '',
    ]
      .map((b) => b.trim().toLowerCase())
      .filter(Boolean);

    if (brandTokens.length === 0) {
      return [];
    }
    const matched = statusFiltered.filter((w) => {
      const target = (w.targetBrand || w.garanteName || '').trim().toLowerCase();
      const moto = (w.motorcycleBrand || '').trim().toLowerCase();
      return brandTokens.some((bt) => {
        if (target) {
          return target === bt || target.includes(bt) || bt.includes(target);
        }
        return moto === bt || moto.includes(bt) || bt.includes(moto);
      });
    });
    return matched;
  }, [warranties, profile]);

  // Historial de Dictámenes (aceptada, aprobada, denegada, rechazada, completada, en_proceso_aceptacion_2)
  const historyRequests = useMemo(() => {
    // 1. Recopilar garantías dictaminadas desde la lista activa de warranties
    const allDictaminated: WarrantyRequest[] = [
      ...warranties.filter((w) =>
        ['aceptada', 'aprobada', 'denegada', 'rechazada', 'completada', 'en_proceso_aceptacion_2'].includes(w.status)
      ),
    ];

    // 2. Incorporar dictámenes guardados en base de datos / localStorage que no estén ya en la lista
    dictamenes.forEach((d) => {
      const alreadyInList = allDictaminated.some(
        (w) => w.id === d.warrantyId || (d.requestNumber && w.requestNumber === d.requestNumber)
      );
      if (!alreadyInList) {
        if (d.data) {
          allDictaminated.push(d.data);
        } else {
          allDictaminated.push({
            id: d.warrantyId,
            requestNumber: d.requestNumber,
            createdAt: d.createdAt,
            clientName: d.clientName,
            clientIdNumber: d.clientIdNumber || '',
            clientPhone: '',
            motorcycleBrand: d.motorcycleBrand,
            motorcycleModel: d.motorcycleModel,
            motorcyclePlate: d.motorcyclePlate || '',
            motorcycleVin: d.motorcycleVin || '',
            motorcycleMileage: 0,
            issueDescription: d.garanteNotes,
            diagnosticPhotos: [],
            status: d.decision === 'aprobada' ? 'aceptada' : 'denegada',
            warrantyType: 'marca',
            tallerOrigin: 'Taller Autorizado',
            tallerOriginId: '',
            garanteNotes: d.garanteNotes,
            rejectionReason: d.rejectionReason,
          });
        }
      }
    });

    const brandTokens = [
      ...(profile?.brandsRepresented || []),
      profile?.companyName || '',
    ]
      .map((b) => b.trim().toLowerCase())
      .filter(Boolean);

    if (brandTokens.length === 0) {
      return [];
    }
    const matched = allDictaminated.filter((w) => {
      const target = (w.targetBrand || w.garanteName || '').trim().toLowerCase();
      const moto = (w.motorcycleBrand || '').trim().toLowerCase();
      return brandTokens.some((bt) => {
        if (target) {
          return target === bt || target.includes(bt) || bt.includes(target);
        }
        return moto === bt || moto.includes(bt) || bt.includes(moto);
      });
    });
    return matched;
  }, [warranties, dictamenes, profile]);

  // Abrir modal de decisión
  const openDecisionModal = useCallback((warranty: WarrantyRequest, type: 'aprobar' | 'rechazar') => {
    setSelectedWarranty(warranty);
    setActionType(type);
    setReviewNotes('');
    setRejectionReason('');
    setIsActionModalOpen(true);
  }, []);

  // Aprobar solicitud
  const approveWarranty = useCallback((
    idOverride?: string,
    notesOverride?: string,
    resolutionTypeOverride?: 'encargar_taller' | 'envio_repuesto'
  ) => {
    const targetWarranty = idOverride ? warranties.find((w) => w.id === idOverride) : selectedWarranty;
    if (!targetWarranty) return;

    const finalNotes = notesOverride || reviewNotes || 'Aprobado según especificaciones de garantía oficial de fábrica.';
    const finalResolution = resolutionTypeOverride || targetWarranty.resolutionType || 'envio_repuesto';
    const newStatus: WarrantyRequestStatus = 'aceptada';

    setWarranties((prev) => {
      const updated = prev.map((w) =>
        w.id === targetWarranty.id
          ? {
              ...w,
              status: newStatus,
              resolutionType: finalResolution,
              garanteNotes: finalNotes,
              approvedAt: 'Hoy, Autorización Digital Garante de Marca',
            }
          : w
      );
      saveStoredWarranties(updated);
      return updated;
    });

    // Registrar dictamen oficial en base de datos
    const newDictamen: DictamenRecord = {
      id: `dic-${Date.now()}`,
      warrantyId: targetWarranty.id,
      requestNumber: targetWarranty.requestNumber,
      decision: 'aprobada',
      resolutionType: finalResolution,
      motorcycleBrand: targetWarranty.motorcycleBrand,
      motorcycleModel: targetWarranty.motorcycleModel,
      motorcyclePlate: targetWarranty.motorcyclePlate,
      motorcycleVin: targetWarranty.motorcycleVin,
      clientName: targetWarranty.clientName,
      clientIdNumber: targetWarranty.clientIdNumber,
      garanteId: profile?.id || 'garante-oficial',
      garanteName: profile?.contactName || profile?.companyName || 'Garante Oficial',
      garanteCompany: profile?.companyName || targetWarranty.motorcycleBrand,
      garanteNotes: finalNotes,
      data: {
        ...targetWarranty,
        status: newStatus,
        resolutionType: finalResolution,
        garanteNotes: finalNotes,
        approvedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveStoredDictamen(newDictamen);

    // Registrar alertas diferenciadas para Garante, Matriz y Taller
    const alertsToPush: SystemAlert[] = [];
    const resText = finalResolution === 'encargar_taller' ? 'Encargar a Taller' : 'Envío de Repuestos';

    // Alerta para el Garante
    alertsToPush.push({
      id: `alt-gar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'garantia_aprobada',
      targetRole: 'garante',
      targetBrand: targetWarranty.motorcycleBrand,
      title: 'Dictamen Aprobado Emitido',
      message: `Has autorizado la cobertura de la solicitud #${targetWarranty.requestNumber} (${targetWarranty.motorcycleBrand} ${targetWarranty.motorcycleModel}). Resolución: ${resText}.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: targetWarranty.id,
    });

    // Alerta para Matriz / Admin
    alertsToPush.push({
      id: `alt-adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'garantia_aprobada',
      targetRole: 'admin',
      title: 'Dictamen Favorable de Marca Recibido',
      message: `El Garante oficial de ${targetWarranty.motorcycleBrand} autorizó la cobertura de la solicitud #${targetWarranty.requestNumber} (${targetWarranty.clientName}). Resolución: ${resText}.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: targetWarranty.id,
    });

    // Alerta para Taller de origen
    if (targetWarranty.tallerOriginId) {
      alertsToPush.push({
        id: `alt-tal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'garantia_aprobada',
        targetRole: 'taller',
        targetWorkshopId: targetWarranty.tallerOriginId,
        title: '¡Garantía Aprobada por la Marca!',
        message: `La solicitud #${targetWarranty.requestNumber} (${targetWarranty.clientName} - ${targetWarranty.motorcycleBrand}) fue aprobada por el Garante oficial. Resolución: ${resText}.`,
        timestamp: 'Ahora mismo',
        read: false,
        relatedId: targetWarranty.id,
      });
    }

    addStoredAlerts(alertsToPush);

    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#16a34a', '#2563eb', '#6366f1'],
    });

    setIsActionModalOpen(false);
    showToast(
      finalResolution === 'encargar_taller'
        ? `Garantía ${targetWarranty.requestNumber} procesada: ENCARGADA A TALLER (Aceptación 2).`
        : `Garantía ${targetWarranty.requestNumber} ACEPTADA: Envío de Repuesto.`,
      'success'
    );
  }, [selectedWarranty, reviewNotes, warranties, profile, showToast]);

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

    // Registrar dictamen oficial de rechazo en base de datos
    const newDictamen: DictamenRecord = {
      id: `dic-${Date.now()}`,
      warrantyId: targetWarranty.id,
      requestNumber: targetWarranty.requestNumber,
      decision: 'rechazada',
      resolutionType: 'rechazo_tecnico',
      motorcycleBrand: targetWarranty.motorcycleBrand,
      motorcycleModel: targetWarranty.motorcycleModel,
      motorcyclePlate: targetWarranty.motorcyclePlate,
      motorcycleVin: targetWarranty.motorcycleVin,
      clientName: targetWarranty.clientName,
      clientIdNumber: targetWarranty.clientIdNumber,
      garanteId: profile?.id || 'garante-oficial',
      garanteName: profile?.contactName || profile?.companyName || 'Garante Oficial',
      garanteCompany: profile?.companyName || targetWarranty.motorcycleBrand,
      garanteNotes: reviewNotes || finalReason,
      rejectionReason: finalReason,
      data: {
        ...targetWarranty,
        status: 'denegada',
        garanteNotes: reviewNotes || finalReason,
        rejectionReason: finalReason,
        rejectedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveStoredDictamen(newDictamen);

    // Alertar en el sistema de forma diferenciada
    const alertsToPush: SystemAlert[] = [];

    // Alerta para el Garante
    alertsToPush.push({
      id: `alt-gar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'garantia_rechazada',
      targetRole: 'garante',
      targetBrand: targetWarranty.motorcycleBrand,
      title: 'Dictamen de Rechazo Registrado',
      message: `Emitiste rechazo técnico para la solicitud #${targetWarranty.requestNumber} (${targetWarranty.motorcycleBrand}). Motivo: "${finalReason}".`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: targetWarranty.id,
    });

    // Alerta para Matriz / Admin
    alertsToPush.push({
      id: `alt-adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'garantia_rechazada',
      targetRole: 'admin',
      title: 'Dictamen de Rechazo del Garante',
      message: `El Garante oficial de ${targetWarranty.motorcycleBrand} denegó la solicitud #${targetWarranty.requestNumber} (${targetWarranty.clientName}). Motivo: "${finalReason}".`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: targetWarranty.id,
    });

    // Alerta para Taller de origen
    if (targetWarranty.tallerOriginId) {
      alertsToPush.push({
        id: `alt-tal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'garantia_rechazada',
        targetRole: 'taller',
        targetWorkshopId: targetWarranty.tallerOriginId,
        title: 'Garantía Denegada por la Marca',
        message: `La solicitud #${targetWarranty.requestNumber} para ${targetWarranty.clientName} fue rechazada por el Garante de ${targetWarranty.motorcycleBrand}. Motivo: "${finalReason}".`,
        timestamp: 'Ahora mismo',
        read: false,
        relatedId: targetWarranty.id,
      });
    }

    addStoredAlerts(alertsToPush);

    setIsActionModalOpen(false);
    showToast(`Garantía ${targetWarranty.requestNumber} DENEGADA. Notificado a Matriz y Taller.`, 'error');
  }, [selectedWarranty, rejectionReason, reviewNotes, warranties, profile, showToast]);

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
    updateGaranteProfile,
    dictamenes,
    alerts: filteredAlerts,
    markAlertAsRead,
    markAllAlertsAsRead,
    deleteAlert,
    deleteAllReadAlerts,
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
