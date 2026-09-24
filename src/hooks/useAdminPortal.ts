// src/hooks/useAdminPortal.ts
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  AdminSection,
  AdminSectionMobile,
  Workshop,
  WarrantyRequest,
  SystemAlert,
  AdminInvoice,
  AlistamientoClient,
  AlistamientoMotorcycle,
  AlistamientoService,
  Technician,
  AlistamientoFullRecord,
  TallerClient,
  WarrantyRequestStatus,
  TallerOrder,
  InventoryItem,
  AdminProfile,
} from '../types/customer';
import {
  getStoredWarranties,
  saveStoredWarranties,
  getStoredWorkshops,
  getStoredAlerts,
  saveStoredAlerts,
  addStoredAlerts,
  filterAlertsForRole,
  getStoredInvoices,
  saveStoredInvoices,
  getStoredTechnicians,
  saveStoredTechnicians,
  deleteStoredTechnician,
  getStoredOrigins,
  saveStoredOrigins,
  getStoredFullAlistamientos,
  saveStoredFullAlistamientos,
  deleteStoredAlistamiento,
  getStoredClients,
  saveStoredClients,
  deleteStoredClient,
  deleteStoredWarranty,
  deleteStoredAlert,
  deleteStoredAlerts,
  querySriMock,
  getStoredOrders,
  saveStoredOrders,
  getStoredInventory,
  getStoredAdminProfile,
  saveStoredAdminProfile,
} from '../data/mockMultiRoleData';
import { cloudSaveWarranty, syncAllFromSupabase } from '../services/supabaseService';

export const ADMIN_SECTIONS: AdminSectionMobile[] = [
  'talleres',
  'alistamiento',
  'clientes_admin',
  'garantias_admin',
  'tecnicos',
  'facturacion',
  'alertas',
  'perfil_admin',
];

const getSectionFromHash = (): AdminSectionMobile => {
  if (typeof window === 'undefined') return 'talleres';
  const cleanHash = window.location.hash.replace(/^#\/?/, '').trim();
  if (ADMIN_SECTIONS.includes(cleanHash as AdminSectionMobile)) {
    return cleanHash as AdminSectionMobile;
  }
  return 'talleres';
};

export function useAdminPortal() {
  const [activeSection, setActiveSectionState] = useState<AdminSectionMobile>(getSectionFromHash);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeSectionRef = useRef<AdminSectionMobile>(activeSection);
  activeSectionRef.current = activeSection;

  // Estado compartido
  const [workshops, setWorkshops] = useState<Workshop[]>(getStoredWorkshops);
  const [warranties, setWarranties] = useState<WarrantyRequest[]>(getStoredWarranties);
  const [allAlerts, setAllAlerts] = useState<SystemAlert[]>(getStoredAlerts);
  const [invoices, setInvoices] = useState<AdminInvoice[]>(getStoredInvoices);
  const [technicians, setTechnicians] = useState<Technician[]>(getStoredTechnicians);
  const [origins, setOrigins] = useState<string[]>(getStoredOrigins);
  const [fullAlistamientos, setFullAlistamientos] = useState<AlistamientoFullRecord[]>(getStoredFullAlistamientos);
  const [clients, setClients] = useState<TallerClient[]>(getStoredClients);
  const [orders, setOrders] = useState<TallerOrder[]>(getStoredOrders);
  const [inventory, setInventory] = useState<InventoryItem[]>(getStoredInventory);
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(getStoredAdminProfile);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Escuchar actualizaciones externas de localStorage (evento sincronizado)
  useEffect(() => {
    const handleWarrantiesUpdate = () => setWarranties(getStoredWarranties());
    const handleAlertsUpdate = () => setAllAlerts(getStoredAlerts());
    const handleTechsUpdate = () => setTechnicians(getStoredTechnicians());
    const handleOriginsUpdate = () => setOrigins(getStoredOrigins());
    const handleAlistamientosUpdate = () => setFullAlistamientos(getStoredFullAlistamientos());
    const handleClientsUpdate = () => setClients(getStoredClients());
    const handleAdminProfileUpdate = () => setAdminProfile(getStoredAdminProfile());
    const handleOrdersUpdate = () => setOrders(getStoredOrders());
    const handleInventoryUpdate = () => setInventory(getStoredInventory());
    const handleInvoicesUpdate = () => setInvoices(getStoredInvoices());
    const handleWorkshopsUpdate = () => setWorkshops(getStoredWorkshops());

    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('starmotos_shared_')) {
        handleWarrantiesUpdate();
        handleAlertsUpdate();
        handleTechsUpdate();
        handleOriginsUpdate();
        handleAlistamientosUpdate();
        handleClientsUpdate();
        handleAdminProfileUpdate();
        handleOrdersUpdate();
        handleInventoryUpdate();
        handleInvoicesUpdate();
        handleWorkshopsUpdate();
      }
    };

    window.addEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
    window.addEventListener('starmotos_alerts_updated', handleAlertsUpdate);
    window.addEventListener('starmotos_technicians_updated', handleTechsUpdate);
    window.addEventListener('starmotos_origins_updated', handleOriginsUpdate);
    window.addEventListener('starmotos_alistamientos_updated', handleAlistamientosUpdate);
    window.addEventListener('starmotos_clients_updated', handleClientsUpdate);
    window.addEventListener('starmotos_admin_profile_updated', handleAdminProfileUpdate);
    window.addEventListener('starmotos_orders_updated', handleOrdersUpdate);
    window.addEventListener('starmotos_inventory_updated', handleInventoryUpdate);
    window.addEventListener('starmotos_invoices_updated', handleInvoicesUpdate);
    window.addEventListener('starmotos_workshops_updated', handleWorkshopsUpdate);
    window.addEventListener('storage', handleStorageEvent);

    // Sincronización proactiva de arranque para asegurar que Matriz reciba toda la red
    syncAllFromSupabase();

    return () => {
      window.removeEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
      window.removeEventListener('starmotos_alerts_updated', handleAlertsUpdate);
      window.removeEventListener('starmotos_technicians_updated', handleTechsUpdate);
      window.removeEventListener('starmotos_origins_updated', handleOriginsUpdate);
      window.removeEventListener('starmotos_alistamientos_updated', handleAlistamientosUpdate);
      window.removeEventListener('starmotos_clients_updated', handleClientsUpdate);
      window.removeEventListener('starmotos_admin_profile_updated', handleAdminProfileUpdate);
      window.removeEventListener('starmotos_orders_updated', handleOrdersUpdate);
      window.removeEventListener('starmotos_inventory_updated', handleInventoryUpdate);
      window.removeEventListener('starmotos_invoices_updated', handleInvoicesUpdate);
      window.removeEventListener('starmotos_workshops_updated', handleWorkshopsUpdate);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Alertas exclusivas para el rol Administrador Matriz
  const alerts = useMemo(() => {
    return filterAlertsForRole(allAlerts, { role: 'admin' });
  }, [allAlerts]);

  const updateAdminProfile = useCallback((newProfile: AdminProfile) => {
    setAdminProfile(newProfile);
    saveStoredAdminProfile(newProfile);
    showToast('Perfil de administración guardado con éxito.', 'success');
  }, []);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Navegación hash
  const setActiveSection = useCallback((newSection: AdminSectionMobile, replace = false) => {
    if (!ADMIN_SECTIONS.includes(newSection)) return;
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

  // Manejo de historial popstate
  useEffect(() => {
    const handlePopState = () => {
      const target = getSectionFromHash();
      setActiveSectionState(target);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ===================== FLUJO DE GARANTÍAS =====================

  // Matriz valida y acepta la solicitud enviada por el taller (Pasa a En Proceso hacia Garante)
  const validateWarrantyByMatriz = useCallback((id: string, notes: string) => {
    setWarranties((prev) => {
      const updated = prev.map((w) =>
        w.id === id
          ? {
              ...w,
              status: 'en_proceso' as const,
              matrizNotes: notes,
            }
          : w
      );
      saveStoredWarranties(updated);
      return updated;
    });

    // Crear alertas diferenciadas por rol
    const targetW = warranties.find((w) => w.id === id);
    const alertsToPush: SystemAlert[] = [];

    // Alerta para Admin
    alertsToPush.push({
      id: `alt-adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'estado_cambiado',
      targetRole: 'admin',
      title: 'Garantía Aceptada en Matriz (En Proceso)',
      message: `La solicitud ${targetW?.requestNumber || id} fue aceptada en revisión interna y pasa a En Proceso hacia el Garante de Marca.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: id,
    });

    // Alerta para Taller de origen
    if (targetW?.tallerOriginId) {
      alertsToPush.push({
        id: `alt-tal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'estado_cambiado',
        targetRole: 'taller',
        targetWorkshopId: targetW.tallerOriginId,
        title: 'Garantía Aprobada por Matriz',
        message: `Tu solicitud #${targetW.requestNumber} para ${targetW.clientName} fue aprobada por Matriz y está en proceso de revisión con el Garante.`,
        timestamp: 'Ahora mismo',
        read: false,
        relatedId: id,
      });
    }

    addStoredAlerts(alertsToPush);
    showToast('Solicitud aceptada por Matriz. Puesta EN PROCESO para el Garante de Marca.', 'success');
  }, [warranties, showToast]);

  // Matriz deniega la solicitud
  const rejectWarrantyByMatriz = useCallback((id: string, reason: string) => {
    setWarranties((prev) => {
      const updated = prev.map((w) =>
        w.id === id
          ? {
              ...w,
              status: 'denegada' as const,
              rejectionReason: reason,
              rejectedAt: 'Hoy, Matriz Central',
            }
          : w
      );
      saveStoredWarranties(updated);
      return updated;
    });

    const targetW = warranties.find((w) => w.id === id);
    const alertsToPush: SystemAlert[] = [];

    // Alerta para Admin
    alertsToPush.push({
      id: `alt-adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'garantia_rechazada',
      targetRole: 'admin',
      title: 'Garantía Denegada en Matriz',
      message: `La solicitud ${targetW?.requestNumber || id} fue denegada en revisión de Matriz.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: id,
    });

    // Alerta para Taller de origen
    if (targetW?.tallerOriginId) {
      alertsToPush.push({
        id: `alt-tal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'garantia_rechazada',
        targetRole: 'taller',
        targetWorkshopId: targetW.tallerOriginId,
        title: 'Garantía No Aprobada por Matriz',
        message: `La solicitud #${targetW.requestNumber} para ${targetW.clientName} fue denegada por Matriz. Motivo: ${reason}`,
        timestamp: 'Ahora mismo',
        read: false,
        relatedId: id,
      });
    }

    addStoredAlerts(alertsToPush);
    showToast('Solicitud de garantía denegada en Matriz.', 'error');
  }, [warranties, showToast]);

  // Matriz envía la solicitud validada al Garante / Marca
  const sendWarrantyToGarante = useCallback((id: string, notes?: string) => {
    setWarranties((prev) => {
      const updated = prev.map((w) =>
        w.id === id
          ? {
              ...w,
              status: 'enviada_garante' as const,
              matrizNotes: notes || w.matrizNotes,
            }
          : w
      );
      saveStoredWarranties(updated);
      return updated;
    });

    const targetW = warranties.find((w) => w.id === id);
    const alertsToPush: SystemAlert[] = [];

    // Alerta para el Garante de la Marca correspondiente
    alertsToPush.push({
      id: `alt-gar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'solicitud_garantia',
      targetRole: 'garante',
      targetBrand: targetW?.motorcycleBrand,
      title: 'Te llegó una solicitud de garantía',
      message: `Nueva solicitud de garantía #${targetW?.requestNumber || id} para la marca ${targetW?.motorcycleBrand} (${targetW?.motorcycleModel}) remitida por Matriz Central para dictamen oficial.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: id,
    });

    // Alerta para Matriz / Admin
    alertsToPush.push({
      id: `alt-adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'estado_cambiado',
      targetRole: 'admin',
      title: 'Garantía Derivada al Garante',
      message: `La solicitud ${targetW?.requestNumber || id} fue despachada digitalmente al Garante oficial de ${targetW?.motorcycleBrand} para su dictamen técnico.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: id,
    });

    // Alerta para Taller de origen
    if (targetW?.tallerOriginId) {
      alertsToPush.push({
        id: `alt-tal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'estado_cambiado',
        targetRole: 'taller',
        targetWorkshopId: targetW.tallerOriginId,
        title: 'Garantía en Revisión de Marca',
        message: `Tu solicitud #${targetW.requestNumber} para ${targetW.clientName} fue despachada al Garante oficial de ${targetW.motorcycleBrand}.`,
        timestamp: 'Ahora mismo',
        read: false,
        relatedId: id,
      });
    }

    addStoredAlerts(alertsToPush);
    showToast('Solicitud enviada con éxito al panel del Garante oficial.', 'success');
  }, [warranties, showToast]);

  // Matriz completa la garantía (procede a entrega/facturación tras aprobación)
  const completeWarrantyRepair = useCallback((id: string, invoiceNumber?: string) => {
    setWarranties((prev) => {
      const updated = prev.map((w) =>
        w.id === id
          ? {
              ...w,
              status: 'completada' as const,
              invoiceNumber: invoiceNumber || w.invoiceNumber || 'FAC-GAR-001-998',
            }
          : w
      );
      saveStoredWarranties(updated);
      return updated;
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    showToast('Garantía marcada como COMPLETADA. Liquidación registrada.', 'success');
  }, [showToast]);

  // Matriz emite nueva solicitud de garantía
  const createWarrantyRequest = useCallback((directReq: WarrantyRequest) => {
    const newReq: WarrantyRequest = {
      ...directReq,
      status: directReq.status || 'en_revision',
      tallerOrigin: directReq.tallerOrigin || 'StarMotos Matriz La Maná',
      tallerOriginId: directReq.tallerOriginId || 'matriz-la-mana',
    };

    setWarranties((prev) => {
      const updated = [newReq, ...prev];
      saveStoredWarranties(updated);
      return updated;
    });

    const newAlert: SystemAlert = {
      id: `alt-adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'solicitud_garantia',
      targetRole: 'admin',
      title: 'Nueva Solicitud de Garantía en Matriz',
      message: `StarMotos Matriz generó la solicitud ${newReq.requestNumber} para ${newReq.clientName} (${newReq.motorcycleBrand}).`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: newReq.id,
    };
    addStoredAlerts(newAlert);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    showToast(`Solicitud ${newReq.requestNumber} registrada en Matriz Central.`, 'success');
    return true;
  }, [showToast]);

  // Eliminar garantía
  const deleteWarranty = useCallback((id: string) => {
    deleteStoredWarranty(id);
    setWarranties((prev) => prev.filter((w) => w.id !== id && w.requestNumber !== id));
    showToast('Solicitud de garantía eliminada permanentemente en Matriz y Sedes conectadas.', 'info');
  }, [showToast]);

  // Actualizar datos completos de garantía (edición y presupuesto)
  const updateWarranty = useCallback((updatedReq: WarrantyRequest) => {
    setWarranties((prev) => {
      const exists = prev.some((w) => w.id === updatedReq.id);
      const updated = exists
        ? prev.map((w) => (w.id === updatedReq.id ? updatedReq : w))
        : [updatedReq, ...prev];
      saveStoredWarranties(updated);
      return updated;
    });
    try {
      cloudSaveWarranty(updatedReq);
    } catch (e) {
      console.warn('Error saving warranty to cloud', e);
    }
    showToast(`Solicitud ${updatedReq.requestNumber} actualizada con éxito.`, 'success');
  }, [showToast]);

  // Cambio rápido de estado con observación del Administrador
  const quickUpdateWarrantyStatus = useCallback((id: string, newStatus: WarrantyRequestStatus, notes?: string) => {
    setWarranties((prev) => {
      const target = prev.find((w) => w.id === id);
      const updated = prev.map((w) =>
        w.id === id
          ? {
              ...w,
              status: newStatus,
              matrizNotes: notes || w.matrizNotes,
            }
          : w
      );
      saveStoredWarranties(updated);

      if (target) {
        const alertsToPush: SystemAlert[] = [];

        // Alerta para Admin
        alertsToPush.push({
          id: `alt-adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'estado_cambiado',
          targetRole: 'admin',
          title: `Estado Actualizado: ${target.requestNumber}`,
          message: `Matriz dictaminó "${newStatus}" para ${target.clientName}.${notes ? ` Observación: ${notes}` : ''}`,
          timestamp: 'Ahora mismo',
          read: false,
          relatedId: target.id,
        });

        // Alerta para Taller de origen
        if (target.tallerOriginId) {
          alertsToPush.push({
            id: `alt-tal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'estado_cambiado',
            targetRole: 'taller',
            targetWorkshopId: target.tallerOriginId,
            title: `Estado de Garantía Actualizado: ${target.requestNumber}`,
            message: `Matriz actualizó el estado a "${newStatus}" para ${target.clientName}.${notes ? ` Observación: ${notes}` : ''}`,
            timestamp: 'Ahora mismo',
            read: false,
            relatedId: target.id,
          });
        }

        addStoredAlerts(alertsToPush);
      }
      return updated;
    });

    confetti({ particleCount: 40, spread: 55, origin: { y: 0.6 } });
    showToast(`Estado de garantía actualizado: ${newStatus}`, 'success');
  }, [showToast]);

  // Marcar alertas como leídas (aisladas para el rol admin)
  const markAlertAsRead = useCallback((id: string) => {
    const current = getStoredAlerts();
    const updated = current.map((a) => (a.id === id ? { ...a, read: true } : a));
    saveStoredAlerts(updated);
  }, []);

  const markAllAlertsAsRead = useCallback(() => {
    const current = getStoredAlerts();
    const adminAlertIds = new Set(filterAlertsForRole(current, { role: 'admin' }).map((a) => a.id));
    const updated = current.map((a) => (adminAlertIds.has(a.id) ? { ...a, read: true } : a));
    saveStoredAlerts(updated);
    showToast('Todas las alertas de administración marcadas como leídas.', 'info');
  }, [showToast]);

  // Eliminar alertas (aisladas para el rol admin)
  const deleteAlert = useCallback((id: string) => {
    deleteStoredAlert(id);
    showToast('Notificación eliminada.', 'info');
  }, [showToast]);

  const deleteAllReadAlerts = useCallback(() => {
    const current = getStoredAlerts();
    const adminAlerts = filterAlertsForRole(current, { role: 'admin' });
    const readIds = adminAlerts.filter((a) => a.read).map((a) => a.id);
    if (readIds.length === 0) {
      showToast('No hay notificaciones leídas para eliminar.', 'info');
      return;
    }
    deleteStoredAlerts(readIds);
    showToast('Notificaciones leídas eliminadas.', 'info');
  }, [showToast]);


  // ===================== WIZARD DE ALISTAMIENTO =====================

  // Paso 1: Cliente
  const [alistamientoClient, setAlistamientoClient] = useState<AlistamientoClient>({
    idNumber: '',
    fullName: '',
    tipoContribuyente: '',
    phone: '',
    email: '',
    address: '',
  });

  // Paso 2: Moto
  const [alistamientoMoto, setAlistamientoMoto] = useState<AlistamientoMotorcycle>({
    brand: '',
    model: '',
    chassisNumber: '',
    plate: '',
    year: new Date().getFullYear(),
    color: '',
  });

  // Paso 3: Servicio
  const [alistamientoService, setAlistamientoService] = useState<AlistamientoService>({
    maintenanceType: 'preventivo',
    observations: '',
    invoiceNumber: '',
    cost: 45.0,
  });

  const [isSearchingSri, setIsSearchingSri] = useState(false);

  // Auto-llenado desde SRI
  const searchSri = useCallback((idNumber: string) => {
    if (!idNumber.trim()) {
      showToast('Por favor ingrese un número de cédula o RUC.', 'error');
      return;
    }
    setIsSearchingSri(true);
    setTimeout(() => {
      const result = querySriMock(idNumber);
      setIsSearchingSri(false);
      if (result) {
        setAlistamientoClient((prev) => ({
          ...prev,
          idNumber,
          fullName: result.razonSocial,
          tipoContribuyente: result.tipoContribuyente,
          address: result.address,
          email: prev.email || result.email,
          phone: prev.phone || result.phone,
        }));
        showToast(`Datos SRI encontrados: ${result.razonSocial}`, 'success');
      } else {
        showToast('Identificación no encontrada en el padrón SRI.', 'error');
      }
    }, 600);
  }, [showToast]);

  // Registrar Alistamiento Completo
  const submitAlistamiento = useCallback(() => {
    if (!alistamientoClient.fullName || !alistamientoMoto.brand || !alistamientoMoto.model) {
      showToast('Complete los campos requeridos antes de guardar.', 'error');
      return false;
    }

    // Crear factura electrónica en el listado
    const newInvoice: AdminInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: alistamientoService.invoiceNumber || `001-002-${Math.floor(1000000 + Math.random() * 9000000)}`,
      clientName: alistamientoClient.fullName,
      clientIdNumber: alistamientoClient.idNumber,
      date: 'Hoy',
      subtotal: Number((alistamientoService.cost / 1.15).toFixed(2)),
      iva: Number((alistamientoService.cost - alistamientoService.cost / 1.15).toFixed(2)),
      total: alistamientoService.cost,
      status: 'emitida',
      workshopName: 'StarMotos Matriz Central',
    };

    setInvoices((prev) => {
      const updated = [newInvoice, ...prev];
      saveStoredInvoices(updated);
      return updated;
    });

    // Generar alerta de sistema para Admin
    const newAlert: SystemAlert = {
      id: `alt-adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'orden_creada',
      targetRole: 'admin',
      title: 'Alistamiento Registrado con Éxito',
      message: `Cliente ${alistamientoClient.fullName} ingresó ${alistamientoMoto.brand} ${alistamientoMoto.model} (${alistamientoMoto.plate || 'S/P'}). Factura: $${alistamientoService.cost} USD.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: newInvoice.invoiceNumber,
    };
    addStoredAlerts(newAlert);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1d4ed8', '#dc2626', '#10b981'],
    });

    showToast('¡Alistamiento de cliente y motocicleta registrado con éxito!', 'success');

    // Resetear formulario
    setAlistamientoClient({
      idNumber: '',
      fullName: '',
      tipoContribuyente: '',
      phone: '',
      email: '',
      address: '',
    });
    setAlistamientoMoto({
      brand: '',
      model: '',
      chassisNumber: '',
      plate: '',
      year: new Date().getFullYear(),
      color: '',
    });
    setAlistamientoService({
      maintenanceType: 'preventivo',
      observations: '',
      invoiceNumber: '',
      cost: 45.0,
    });

    return true;
  }, [alistamientoClient, alistamientoMoto, alistamientoService, showToast]);

  // ===================== GESTIÓN DE TÉCNICOS & ALISTAMIENTO FULL =====================
  const addTechnician = useCallback((techData: Omit<Technician, 'id' | 'activeOrdersCount'>) => {
    const newTech: Technician = {
      ...techData,
      id: `tec-${Date.now()}`,
      activeOrdersCount: 0,
    };
    setTechnicians((prev) => {
      const updated = [newTech, ...prev];
      saveStoredTechnicians(updated);
      return updated;
    });
    showToast(`Técnico ${newTech.name} registrado con éxito.`, 'success');
  }, [showToast]);

  const deleteTechnician = useCallback((id: string) => {
    deleteStoredTechnician(id);
    setTechnicians((prev) => prev.filter((t) => t.id !== id));
    showToast('Técnico eliminado del sistema.', 'info');
  }, [showToast]);

  const addOrigin = useCallback((newOrigin: string) => {
    setOrigins((prev) => {
      if (prev.includes(newOrigin)) return prev;
      const updated = [...prev, newOrigin];
      saveStoredOrigins(updated);
      return updated;
    });
    showToast(`Almacén/Origen "${newOrigin}" agregado.`, 'success');
  }, [showToast]);

  const saveFullAlistamiento = useCallback((record: AlistamientoFullRecord) => {
    // 1. Guardar en lista de alistamientos (evitar duplicados al editar)
    setFullAlistamientos((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id);
      let updated: AlistamientoFullRecord[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = record;
      } else {
        updated = [record, ...prev];
      }
      saveStoredFullAlistamientos(updated);
      return updated;
    });

    // 2. Crear / actualizar en lista de clientes del taller (con chasis, kilometraje y dirección)
    const newClient: TallerClient = {
      id: `cli-${Date.now()}`,
      fullName: `${record.nombres} ${record.apellidos}`.trim(),
      idNumber: record.cedulaRuc,
      phone: record.celular1,
      email: record.email,
      motorcycleBrand: record.modeloMarca.split(' ')[0] || 'Moto',
      motorcycleModel: record.modeloMarca,
      motorcyclePlate: record.placa,
      motorcycleVin: record.chasis,
      motorcycleMileage: Number(record.kilometraje) || 0,
      address: record.direccion,
      color: record.color,
      year: record.year,
      lastVisit: record.fechaServicio,
      totalVisits: 1,
      workshopId: record.sedeId || 'matriz-la-mana',
      workshopName: record.sede || 'StarMotos Matriz La Maná',
    };

    setClients((prev) => {
      const existingIdx = prev.findIndex((c) => c.idNumber === record.cedulaRuc);
      let updated: TallerClient[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          fullName: `${record.nombres} ${record.apellidos}`.trim(),
          phone: record.celular1 || updated[existingIdx].phone,
          email: record.email || updated[existingIdx].email,
          motorcycleBrand: record.modeloMarca.split(' ')[0] || updated[existingIdx].motorcycleBrand,
          motorcycleModel: record.modeloMarca || updated[existingIdx].motorcycleModel,
          motorcyclePlate: record.placa || updated[existingIdx].motorcyclePlate,
          motorcycleVin: record.chasis || updated[existingIdx].motorcycleVin,
          motorcycleMileage: record.kilometraje !== undefined ? (Number(record.kilometraje) || 0) : updated[existingIdx].motorcycleMileage,
          address: record.direccion || updated[existingIdx].address,
          color: record.color || updated[existingIdx].color,
          year: record.year || updated[existingIdx].year,
          lastVisit: record.fechaServicio || updated[existingIdx].lastVisit,
          workshopId: record.sedeId || updated[existingIdx].workshopId,
          workshopName: record.sede || updated[existingIdx].workshopName,
        };
      } else {
        updated = [newClient, ...prev];
      }
      saveStoredClients(updated);
      return updated;
    });

    // 3. Crear factura si no existe
    const newInv: AdminInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: record.numeroFactura,
      clientName: `${record.nombres} ${record.apellidos}`.trim(),
      clientIdNumber: record.cedulaRuc,
      date: record.fechaServicio,
      subtotal: Number((record.valorServicio / 1.15).toFixed(2)),
      iva: Number((record.valorServicio - record.valorServicio / 1.15).toFixed(2)),
      total: record.valorServicio,
      status: 'emitida',
      workshopName: record.sede,
    };
    setInvoices((prev) => {
      const exists = prev.some((i) => i.invoiceNumber === record.numeroFactura);
      if (exists) {
        const updated = prev.map((i) =>
          i.invoiceNumber === record.numeroFactura
            ? {
                ...i,
                clientName: `${record.nombres} ${record.apellidos}`.trim(),
                clientIdNumber: record.cedulaRuc,
                date: record.fechaServicio,
                subtotal: Number((record.valorServicio / 1.15).toFixed(2)),
                iva: Number((record.valorServicio - record.valorServicio / 1.15).toFixed(2)),
                total: record.valorServicio,
                workshopName: record.sede,
              }
            : i
        );
        saveStoredInvoices(updated);
        return updated;
      }
      const updated = [newInv, ...prev];
      saveStoredInvoices(updated);
      return updated;
    });

    // 4. Crear Alerta para Admin
    const newAlert: SystemAlert = {
      id: `alt-adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'orden_creada',
      targetRole: 'admin',
      title: 'Alistamiento Guardado en Matriz',
      message: `${record.sede}: Cliente ${record.nombres} ${record.apellidos} — Moto ${record.modeloMarca} (${record.placa}). Factura ${record.numeroFactura}.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: record.id,
    };
    addStoredAlerts(newAlert);

    showToast(`¡Alistamiento de ${record.nombres} guardado correctamente!`, 'success');
  }, [showToast]);

  // Eliminar alistamiento
  const deleteFullAlistamiento = useCallback((id: string) => {
    deleteStoredAlistamiento(id);
    setFullAlistamientos((prev) => prev.filter((r) => r.id !== id && r.cedulaRuc !== id));
    setOrders((prev) => {
      const updated = prev.filter((o) => o.alistamientoId !== id && o.id !== id);
      saveStoredOrders(updated);
      return updated;
    });
    showToast('Alistamiento y orden de trabajo eliminados correctamente.', 'info');
  }, [showToast]);

  // Eliminar cliente y cuenta de usuario de forma definitiva
  const deleteClient = useCallback((idOrCedula: string) => {
    // 1. Eliminar persistentemente con tombstones y cascada
    deleteStoredClient(idOrCedula);

    // 2. Actualizar estados locales de forma inmediata
    setClients((prev) => prev.filter((c) => c.id !== idOrCedula && c.idNumber !== idOrCedula));
    setFullAlistamientos((prev) => prev.filter((r) => r.cedulaRuc !== idOrCedula && r.id !== idOrCedula));
    setWarranties((prev) => prev.filter((w) => w.clientIdNumber !== idOrCedula));
    setOrders((prev) => {
      const updated = prev.filter((o) => o.clientIdNumber !== idOrCedula && o.alistamientoId !== idOrCedula);
      saveStoredOrders(updated);
      return updated;
    });

    // 3. Eliminar cuenta de credenciales de login si existía
    try {
      const accounts = JSON.parse(localStorage.getItem('starmotos_registered_accounts') || '{}');
      let changed = false;
      Object.keys(accounts).forEach((key) => {
        if (
          key === idOrCedula ||
          key.toLowerCase() === idOrCedula.toLowerCase() ||
          accounts[key]?.cedula === idOrCedula ||
          accounts[key]?.idNumber === idOrCedula
        ) {
          delete accounts[key];
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('starmotos_registered_accounts', JSON.stringify(accounts));
      }
    } catch (_) {}

    showToast('Cliente y cuenta de usuario eliminados correctamente del sistema.', 'info');
  }, [showToast]);

  return {
    activeSection,
    setActiveSection,
    isSidebarOpen,
    setIsSidebarOpen,
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
    showToast,
    // Garantías
    createWarrantyRequest,
    updateWarranty,
    deleteWarranty,
    quickUpdateWarrantyStatus,
    validateWarrantyByMatriz,
    rejectWarrantyByMatriz,
    sendWarrantyToGarante,
    completeWarrantyRepair,
    // Alertas
    markAlertAsRead,
    markAllAlertsAsRead,
    deleteAlert,
    deleteAllReadAlerts,
    // Técnicos & Alistamiento Full
    addTechnician,
    deleteTechnician,
    addOrigin,
    saveFullAlistamiento,
    deleteFullAlistamiento,
    deleteClient,
    // Alistamiento básico anterior (compatibilidad)
    alistamientoClient,
    setAlistamientoClient,
    alistamientoMoto,
    setAlistamientoMoto,
    alistamientoService,
    setAlistamientoService,
    isSearchingSri,
    searchSri,
    submitAlistamiento,
  };
}
