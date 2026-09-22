import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  TallerSection,
  TallerOrder,
  WarrantyRequest,
  TallerClient,
  InventoryItem,
  WorkOrderStatus,
  SystemAlert,
} from '../types/customer';
import {
  getStoredOrders,
  saveStoredOrders,
  getStoredWarranties,
  saveStoredWarranties,
  getStoredClients,
  saveStoredClients,
  getStoredInventory,
  saveStoredAlerts,
  getStoredAlerts,
  deleteStoredAlert,
  deleteStoredAlerts,
  getStoredTechnicians,
  saveStoredTechnicians,
  getStoredOrigins,
  saveStoredOrigins,
  getStoredFullAlistamientos,
  saveStoredFullAlistamientos,
  getStoredWorkshops,
  saveStoredWorkshops,
} from '../data/mockMultiRoleData';
import { Technician, AlistamientoFullRecord, Workshop, TallerSectionMobile } from '../types/customer';


export const TALLER_SECTIONS: TallerSectionMobile[] = [
  'ordenes_taller',
  'alistamiento_taller',
  'solicitudes_garantia',
  'clientes_taller',
  'tecnicos',
  'inventario',
  'alertas_taller',
  'perfil_taller',
];

const getSectionFromHash = (): TallerSectionMobile => {
  if (typeof window === 'undefined') return 'ordenes_taller';
  const cleanHash = window.location.hash.replace(/^#\/?/, '').trim();
  if (TALLER_SECTIONS.includes(cleanHash as TallerSectionMobile)) {
    return cleanHash as TallerSectionMobile;
  }
  return 'ordenes_taller';
};

export function useTallerPortal() {
  const [activeSection, setActiveSectionState] = useState<TallerSectionMobile>(getSectionFromHash);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeSectionRef = useRef<TallerSectionMobile>(activeSection);
  activeSectionRef.current = activeSection;

  // Sede activa fijada desde la autenticación
  const [activeWorkshopId] = useState<string>(() => {
    return localStorage.getItem('starmotos_taller_active_ws') || 'matriz-la-mana';
  });

  const [workshops, setWorkshops] = useState<Workshop[]>(getStoredWorkshops);
  const [orders, setOrders] = useState<TallerOrder[]>(getStoredOrders);
  const [warranties, setWarranties] = useState<WarrantyRequest[]>(getStoredWarranties);
  const [clients, setClients] = useState<TallerClient[]>(getStoredClients);
  const [inventory, setInventory] = useState<InventoryItem[]>(getStoredInventory);
  const [technicians, setTechnicians] = useState<Technician[]>(getStoredTechnicians);
  const [origins, setOrigins] = useState<string[]>(getStoredOrigins);
  const [fullAlistamientos, setFullAlistamientos] = useState<AlistamientoFullRecord[]>(getStoredFullAlistamientos);
  const [alerts, setAlerts] = useState<SystemAlert[]>(getStoredAlerts);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Instancia de la sede actual autenticada
  const currentWorkshop = useMemo(() => {
    return (
      workshops.find((w) => w.id === activeWorkshopId) ||
      workshops.find((w) => w.id === 'matriz-la-mana') ||
      workshops[0]
    );
  }, [workshops, activeWorkshopId]);

  // --- FILTRADO ESTRICTO MULTI-TENANT POR SEDE ---
  // El usuario de taller solo puede ver los datos correspondientes a su propio taller
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o.workshopId) return true;
      return o.workshopId === activeWorkshopId || o.workshopId === currentWorkshop?.id;
    });
  }, [orders, activeWorkshopId, currentWorkshop]);

  const filteredWarranties = useMemo(() => {
    return warranties.filter((w) => {
      if (w.tallerOriginId && (w.tallerOriginId === activeWorkshopId || w.tallerOriginId === currentWorkshop?.id)) {
        return true;
      }
      if (w.tallerOrigin && currentWorkshop) {
        const wsName = currentWorkshop.name.toLowerCase();
        const origin = w.tallerOrigin.toLowerCase();
        const cityPart = currentWorkshop.city.toLowerCase().split(',')[0].trim();
        return origin.includes(wsName) || wsName.includes(origin) || (cityPart && origin.includes(cityPart));
      }
      return false;
    });
  }, [warranties, activeWorkshopId, currentWorkshop]);

  const filteredFullAlistamientos = useMemo(() => {
    return fullAlistamientos.filter((a) => {
      if (a.sedeId && (a.sedeId === activeWorkshopId || a.sedeId === currentWorkshop?.id)) {
        return true;
      }
      if (a.sede && currentWorkshop) {
        const wsName = currentWorkshop.name.toLowerCase();
        const sede = a.sede.toLowerCase();
        const cityPart = currentWorkshop.city.toLowerCase().split(',')[0].trim();
        return sede.includes(wsName) || wsName.includes(sede) || (cityPart && sede.includes(cityPart));
      }
      return false;
    });
  }, [fullAlistamientos, activeWorkshopId, currentWorkshop]);

  const filteredClients = useMemo(() => {
    const cedulasInSede = new Set(
      filteredFullAlistamientos.map((a) => a.cedulaRuc.trim().toLowerCase()).filter(Boolean)
    );
    return clients.filter((c) => {
      if (c.workshopId && (c.workshopId === activeWorkshopId || c.workshopId === currentWorkshop?.id)) {
        return true;
      }
      if (c.workshopName && currentWorkshop) {
        const wsName = currentWorkshop.name.toLowerCase();
        const cWs = c.workshopName.toLowerCase();
        const cityPart = currentWorkshop.city.toLowerCase().split(',')[0].trim();
        if (cWs.includes(wsName) || wsName.includes(cWs) || (cityPart && cWs.includes(cityPart))) {
          return true;
        }
      }
      if (c.idNumber && cedulasInSede.has(c.idNumber.trim().toLowerCase())) {
        return true;
      }
      return false;
    });
  }, [clients, filteredFullAlistamientos, activeWorkshopId, currentWorkshop]);

  const filteredTechnicians = useMemo(() => {
    return technicians.filter((t) => {
      if (!t.workshopId) return true;
      return t.workshopId === activeWorkshopId || t.workshopId === currentWorkshop?.id;
    });
  }, [technicians, activeWorkshopId, currentWorkshop]);

  // Sincronización entre ventanas o localStorage
  useEffect(() => {
    const handleWarrantiesUpdate = () => setWarranties(getStoredWarranties());
    const handleOrdersUpdate = () => setOrders(getStoredOrders());
    const handleTechsUpdate = () => setTechnicians(getStoredTechnicians());
    const handleOriginsUpdate = () => setOrigins(getStoredOrigins());
    const handleAlistamientosUpdate = () => setFullAlistamientos(getStoredFullAlistamientos());
    const handleClientsUpdate = () => setClients(getStoredClients());
    const handleAlertsUpdate = () => setAlerts(getStoredAlerts());
    const handleWorkshopsUpdate = () => setWorkshops(getStoredWorkshops());

    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('starmotos_shared_')) {
        handleWarrantiesUpdate();
        handleOrdersUpdate();
        handleTechsUpdate();
        handleOriginsUpdate();
        handleAlistamientosUpdate();
        handleClientsUpdate();
        handleAlertsUpdate();
        handleWorkshopsUpdate();
      }
    };

    window.addEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
    window.addEventListener('starmotos_orders_updated', handleOrdersUpdate);
    window.addEventListener('starmotos_technicians_updated', handleTechsUpdate);
    window.addEventListener('starmotos_origins_updated', handleOriginsUpdate);
    window.addEventListener('starmotos_alistamientos_updated', handleAlistamientosUpdate);
    window.addEventListener('starmotos_clients_updated', handleClientsUpdate);
    window.addEventListener('starmotos_alerts_updated', handleAlertsUpdate);
    window.addEventListener('starmotos_workshops_updated', handleWorkshopsUpdate);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
      window.removeEventListener('starmotos_orders_updated', handleOrdersUpdate);
      window.removeEventListener('starmotos_technicians_updated', handleTechsUpdate);
      window.removeEventListener('starmotos_origins_updated', handleOriginsUpdate);
      window.removeEventListener('starmotos_alistamientos_updated', handleAlistamientosUpdate);
      window.removeEventListener('starmotos_clients_updated', handleClientsUpdate);
      window.removeEventListener('starmotos_alerts_updated', handleAlertsUpdate);
      window.removeEventListener('starmotos_workshops_updated', handleWorkshopsUpdate);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const updateWorkshopProfile = useCallback((updated: Partial<Workshop>) => {
    setWorkshops((prev) => {
      const targetId = currentWorkshop?.id || activeWorkshopId;
      const next = prev.map((w) => (w.id === targetId ? { ...w, ...updated } : w));
      saveStoredWorkshops(next);
      return next;
    });
    showToast('Datos de la sede guardados correctamente.', 'success');
  }, [currentWorkshop, activeWorkshopId, showToast]);

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

  const deleteAlert = useCallback((id: string) => {
    setAlerts((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      saveStoredAlerts(updated);
      return updated;
    });
    deleteStoredAlert(id);
    showToast('Notificación eliminada.', 'info');
  }, [showToast]);

  const deleteAllReadAlerts = useCallback(() => {
    const readIds = alerts.filter((a) => a.read).map((a) => a.id);
    if (readIds.length === 0) {
      showToast('No hay notificaciones leídas para eliminar.', 'info');
      return;
    }
    setAlerts((prev) => {
      const updated = prev.filter((a) => !a.read);
      saveStoredAlerts(updated);
      return updated;
    });
    deleteStoredAlerts(readIds);
    showToast('Notificaciones leídas eliminadas.', 'info');
  }, [alerts, showToast]);

  // Hash navigation
  const setActiveSection = useCallback((newSection: TallerSectionMobile, replace = false) => {
    if (!TALLER_SECTIONS.includes(newSection)) return;
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

  // ===================== GESTIÓN DE ÓRDENES =====================
  const updateOrderStatus = useCallback((orderId: string, nextStatus: WorkOrderStatus) => {
    setOrders((prev) => {
      const updated = prev.map((ord) =>
        ord.id === orderId ? { ...ord, status: nextStatus } : ord
      );
      saveStoredOrders(updated);
      return updated;
    });

    const targetOrd = orders.find((o) => o.id === orderId);
    showToast(`Orden ${targetOrd?.otNumber || orderId} actualizada a estado: ${nextStatus.toUpperCase()}`, 'success');
  }, [orders, showToast]);

  // ===================== GENERAR SOLICITUD DE GARANTÍA =====================
  const [newWarrantyForm, setNewWarrantyForm] = useState({
    clientName: '',
    clientIdNumber: '',
    motorcycleBrand: 'Benelli',
    motorcycleModel: 'TRK 502X ABS',
    motorcyclePlate: '',
    motorcycleVin: '',
    warrantyType: 'marca' as 'marca' | 'plus_taller' | 'gps',
    issueDescription: '',
    estimatedCost: 80,
  });

  const createWarrantyRequest = useCallback((directReq?: WarrantyRequest) => {
    const wsId = currentWorkshop?.id || activeWorkshopId;
    const wsName = currentWorkshop?.name || 'StarMotos Sede Oficial';

    let newReq: WarrantyRequest;

    if (directReq) {
      newReq = {
        ...directReq,
        status: 'en_revision',
        tallerOrigin: directReq.tallerOrigin || wsName,
        tallerOriginId: directReq.tallerOriginId || wsId,
      };
    } else {
      if (!newWarrantyForm.clientName || !newWarrantyForm.issueDescription) {
        showToast('Complete los campos obligatorios del reclamo.', 'error');
        return false;
      }

      newReq = {
        id: `gar-${Date.now()}`,
        requestNumber: `GAR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: 'Hoy, Taller Express',
        clientName: newWarrantyForm.clientName,
        clientIdNumber: newWarrantyForm.clientIdNumber || '1700000000',
        motorcycleBrand: newWarrantyForm.motorcycleBrand,
        motorcycleModel: newWarrantyForm.motorcycleModel,
        motorcyclePlate: newWarrantyForm.motorcyclePlate || 'PBX-0000',
        motorcycleVin: newWarrantyForm.motorcycleVin || 'VIN-EC-99881',
        warrantyType: newWarrantyForm.warrantyType,
        issueDescription: newWarrantyForm.issueDescription,
        diagnosticPhotos: [
          'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
        ],
        status: 'en_revision', // Nace En Revisión para Matriz
        tallerOrigin: wsName,
        tallerOriginId: wsId,
        estimatedCost: Number(newWarrantyForm.estimatedCost) || 60,
      };
    }

    setWarranties((prev) => {
      const updated = [newReq, ...prev];
      saveStoredWarranties(updated);
      return updated;
    });

    // Alertar en el sistema
    const newAlert: SystemAlert = {
      id: `alt-${Date.now()}`,
      type: 'estado_cambiado',
      title: 'Nueva Solicitud de Garantía desde Taller',
      message: `${newReq.tallerOrigin} generó la solicitud ${newReq.requestNumber} para ${newReq.clientName}. Esperando revisión de Matriz.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: newReq.id,
    };
    saveStoredAlerts([newAlert, ...getStoredAlerts()]);

    confetti({
      particleCount: 60,
      spread: 65,
      origin: { y: 0.6 },
    });

    showToast(`Solicitud ${newReq.requestNumber} enviada a Matriz Central (En Revisión).`, 'success');

    // Resetear formulario legacy
    setNewWarrantyForm({
      clientName: '',
      clientIdNumber: '',
      motorcycleBrand: 'Benelli',
      motorcycleModel: 'TRK 502X ABS',
      motorcyclePlate: '',
      motorcycleVin: '',
      warrantyType: 'marca',
      issueDescription: '',
      estimatedCost: 80,
    });

    return true;
  }, [newWarrantyForm, currentWorkshop, activeWorkshopId, showToast]);

  // ===================== GESTIÓN DE TÉCNICOS & ALISTAMIENTO =====================
  const addTechnician = useCallback((techData: Omit<Technician, 'id' | 'activeOrdersCount'>) => {
    const wsId = currentWorkshop?.id || activeWorkshopId;
    const wsName = currentWorkshop?.name || 'StarMotos Sede Oficial';

    const newTech: Technician = {
      ...techData,
      id: `tec-${Date.now()}`,
      activeOrdersCount: 0,
      workshopId: wsId,
      workshopName: wsName,
    };
    setTechnicians((prev) => {
      const updated = [newTech, ...prev];
      saveStoredTechnicians(updated);
      return updated;
    });
    showToast(`Técnico ${newTech.name} registrado con éxito en ${wsName}.`, 'success');
  }, [currentWorkshop, activeWorkshopId, showToast]);

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
    const wsId = currentWorkshop?.id || activeWorkshopId;
    const wsName = currentWorkshop?.name || 'StarMotos Sede Oficial';

    // 1. Asegurar pertenencia inmutable al taller activo
    const securedRecord: AlistamientoFullRecord = {
      ...record,
      sedeId: wsId,
      sede: wsName,
      atendidoPor: record.atendidoPor || currentWorkshop?.manager || 'Jefe de Taller',
    };

    // 2. Guardar en lista de alistamientos (evitar duplicados al editar)
    setFullAlistamientos((prev) => {
      const idx = prev.findIndex((r) => r.id === securedRecord.id);
      let updated: AlistamientoFullRecord[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = securedRecord;
      } else {
        updated = [securedRecord, ...prev];
      }
      saveStoredFullAlistamientos(updated);
      return updated;
    });

    // 3. Crear / actualizar en lista de clientes del taller con vinculación estricta a la sede
    const newClient: TallerClient = {
      id: `cli-${Date.now()}`,
      fullName: `${securedRecord.nombres} ${securedRecord.apellidos}`.trim(),
      idNumber: securedRecord.cedulaRuc,
      phone: securedRecord.celular1,
      email: securedRecord.email,
      motorcycleBrand: securedRecord.modeloMarca.split(' ')[0] || 'Moto',
      motorcycleModel: securedRecord.modeloMarca,
      motorcyclePlate: securedRecord.placa,
      motorcycleVin: securedRecord.chasis,
      motorcycleMileage: securedRecord.kilometraje,
      address: securedRecord.direccion,
      color: securedRecord.color,
      year: securedRecord.year,
      lastVisit: securedRecord.fechaServicio,
      totalVisits: 1,
      workshopId: wsId,
      workshopName: wsName,
    };

    setClients((prev) => {
      const existingIdx = prev.findIndex((c) => c.idNumber === securedRecord.cedulaRuc);
      let updated: TallerClient[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          fullName: `${securedRecord.nombres} ${securedRecord.apellidos}`.trim(),
          phone: securedRecord.celular1 || updated[existingIdx].phone,
          email: securedRecord.email || updated[existingIdx].email,
          motorcycleBrand: securedRecord.modeloMarca.split(' ')[0] || updated[existingIdx].motorcycleBrand,
          motorcycleModel: securedRecord.modeloMarca || updated[existingIdx].motorcycleModel,
          motorcyclePlate: securedRecord.placa || updated[existingIdx].motorcyclePlate,
          motorcycleVin: securedRecord.chasis || updated[existingIdx].motorcycleVin,
          motorcycleMileage: securedRecord.kilometraje !== undefined ? securedRecord.kilometraje : updated[existingIdx].motorcycleMileage,
          address: securedRecord.direccion || updated[existingIdx].address,
          color: securedRecord.color || updated[existingIdx].color,
          year: securedRecord.year || updated[existingIdx].year,
          lastVisit: securedRecord.fechaServicio || updated[existingIdx].lastVisit,
          workshopId: wsId,
          workshopName: wsName,
          totalVisits: updated[existingIdx].totalVisits + 1,
        };
      } else {
        updated = [newClient, ...prev];
      }
      saveStoredClients(updated);
      return updated;
    });

    // 4. Crear Alerta de sistema
    const newAlert: SystemAlert = {
      id: `alt-${Date.now()}`,
      type: 'orden_creada',
      title: 'Alistamiento Guardado',
      message: `${wsName}: Cliente ${securedRecord.nombres} ${securedRecord.apellidos} — Moto ${securedRecord.modeloMarca} (${securedRecord.placa}). Factura ${securedRecord.numeroFactura}.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: securedRecord.id,
    };
    saveStoredAlerts([newAlert, ...getStoredAlerts()]);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1d4ed8', '#dc2626', '#10b981'],
    });

    showToast('¡Alistamiento guardado y sincronizado exitosamente!', 'success');
  }, [currentWorkshop, activeWorkshopId, showToast]);

  return {
    activeSection,
    setActiveSection,
    isSidebarOpen,
    setIsSidebarOpen,
    activeWorkshopId,
    currentWorkshop,
    orders: filteredOrders,
    updateOrderStatus,
    warranties: filteredWarranties,
    clients,
    localClients: filteredClients,
    inventory,
    workshops,
    technicians: filteredTechnicians,
    origins,
    fullAlistamientos: filteredFullAlistamientos,
    addTechnician,
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
    updateWorkshopProfile,
    toastMessage,
    showToast,
  };
}

