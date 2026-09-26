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
  addStoredAlerts,
  filterAlertsForRole,
  deleteStoredAlert,
  deleteStoredAlerts,
  getStoredTechnicians,
  saveStoredTechnicians,
  deleteStoredTechnician,
  getStoredOrigins,
  saveStoredOrigins,
  getStoredFullAlistamientos,
  saveStoredFullAlistamientos,
  getStoredWorkshops,
  saveStoredWorkshops,
  getStoredAgendamientos,
  deleteStoredAgendamiento,
  cleanExpiredAgendamientos,
} from '../data/mockMultiRoleData';
import { syncAllFromSupabase } from '../services/supabaseService';
import { Technician, AlistamientoFullRecord, Workshop, TallerSectionMobile, AgendamientoTicket } from '../types/customer';


export const TALLER_SECTIONS: TallerSectionMobile[] = [
  'perfil_taller',
  'ordenes_taller',
  'agendamientos',
  'alistamiento_taller',
  'solicitudes_garantia',
  'clientes_taller',
  'tecnicos',
  'inventario',
  'alertas_taller',
];

const getSectionFromHash = (): TallerSectionMobile => {
  if (typeof window === 'undefined') return 'perfil_taller';
  const cleanHash = window.location.hash.replace(/^#\/?/, '').trim();
  if (TALLER_SECTIONS.includes(cleanHash as TallerSectionMobile)) {
    return cleanHash as TallerSectionMobile;
  }
  return 'perfil_taller';
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
  const [allAlerts, setAllAlerts] = useState<SystemAlert[]>(getStoredAlerts);
  const [agendamientos, setAgendamientos] = useState<AgendamientoTicket[]>(getStoredAgendamientos);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Instancia de la sede actual autenticada
  const currentWorkshop = useMemo(() => {
    return (
      workshops.find((w) => w.id === activeWorkshopId) ||
      workshops.find((w) => w.id === 'matriz-la-mana') ||
      workshops[0]
    );
  }, [workshops, activeWorkshopId]);

  // Identificar si la sede actual es Matriz Central
  const isMatriz = useMemo(() => {
    const wsId = currentWorkshop?.id || activeWorkshopId;
    if (wsId === 'matriz-la-mana' || wsId === 'sede-matriz') return true;
    const name = (currentWorkshop?.name || '').toLowerCase();
    return name.includes('matriz');
  }, [currentWorkshop, activeWorkshopId]);

  // Filtro de sede para Matriz (permite supervisar toda la red nacional o enfocar una sede específica)
  const [selectedWorkshopFilter, setSelectedWorkshopFilter] = useState<string>('all');

  // --- FILTRADO MULTI-TENANT POR SEDE (CON VISIBILIDAD CENTRAL PARA MATRIZ) ---
  // Las sucursales solo ven sus propios datos.
  // La Matriz puede ver la red completa de todos los talleres ('all') o filtrar por sede.

  const filteredOrders = useMemo(() => {
    if (isMatriz && selectedWorkshopFilter === 'all') {
      return orders;
    }
    const targetWsId = isMatriz ? selectedWorkshopFilter : (currentWorkshop?.id || activeWorkshopId);
    return orders.filter((o) => {
      if (o.workshopId) {
        return o.workshopId === targetWsId;
      }
      return false;
    });
  }, [orders, isMatriz, selectedWorkshopFilter, activeWorkshopId, currentWorkshop]);

  const filteredWarranties = useMemo(() => {
    if (isMatriz && selectedWorkshopFilter === 'all') {
      return warranties;
    }
    const targetWsId = isMatriz ? selectedWorkshopFilter : (currentWorkshop?.id || activeWorkshopId);
    const targetWs = workshops.find((w) => w.id === targetWsId) || currentWorkshop;
    return warranties.filter((w) => {
      if (w.tallerOriginId) {
        return w.tallerOriginId === targetWsId;
      }
      if (w.tallerOrigin && targetWs) {
        const cleanOrigin = w.tallerOrigin.toLowerCase().replace(/starmotos|sucursal|sede|taller/gi, '').trim();
        const cleanWs = targetWs.name.toLowerCase().replace(/starmotos|sucursal|sede|taller/gi, '').trim();
        const cityPart = targetWs.city.toLowerCase().split(',')[0].trim();
        return cleanOrigin && (cleanOrigin.includes(cleanWs) || cleanWs.includes(cleanOrigin) || (cityPart && cleanOrigin.includes(cityPart)));
      }
      return false;
    });
  }, [warranties, isMatriz, selectedWorkshopFilter, workshops, activeWorkshopId, currentWorkshop]);

  const filteredFullAlistamientos = useMemo(() => {
    if (isMatriz && selectedWorkshopFilter === 'all') {
      return fullAlistamientos;
    }
    const targetWsId = isMatriz ? selectedWorkshopFilter : (currentWorkshop?.id || activeWorkshopId);
    const targetWs = workshops.find((w) => w.id === targetWsId) || currentWorkshop;
    return fullAlistamientos.filter((a) => {
      // 1. Si tiene sedeId explícito, DEBE coincidir con la sede activa
      if (a.sedeId) {
        return a.sedeId === targetWsId;
      }
      // 2. Si no tiene sedeId, comparar estrictamente por nombre específico o ciudad
      if (a.sede && targetWs) {
        const cleanSede = a.sede.toLowerCase().replace(/starmotos|sucursal|sede|taller/gi, '').trim();
        const cleanWs = targetWs.name.toLowerCase().replace(/starmotos|sucursal|sede|taller/gi, '').trim();
        const cityPart = targetWs.city.toLowerCase().split(',')[0].trim();
        return cleanSede && (cleanSede.includes(cleanWs) || cleanWs.includes(cleanSede) || (cityPart && cleanSede.includes(cityPart)));
      }
      return false;
    });
  }, [fullAlistamientos, isMatriz, selectedWorkshopFilter, workshops, activeWorkshopId, currentWorkshop]);

  const filteredAgendamientos = useMemo(() => {
    if (isMatriz && selectedWorkshopFilter === 'all') {
      return agendamientos;
    }
    const targetWsId = isMatriz ? selectedWorkshopFilter : (currentWorkshop?.id || activeWorkshopId);
    const targetWs = workshops.find((w) => w.id === targetWsId) || currentWorkshop;

    return agendamientos.filter((a) => {
      if (a.workshopId) {
        return a.workshopId === targetWsId;
      }
      if (a.workshopName && targetWs) {
        const cleanName = a.workshopName.toLowerCase().replace(/starmotos|sucursal|sede|taller/gi, '').trim();
        const cleanWs = targetWs.name.toLowerCase().replace(/starmotos|sucursal|sede|taller/gi, '').trim();
        const cityPart = targetWs.city.toLowerCase().split(',')[0].trim();
        return cleanName && (cleanName.includes(cleanWs) || cleanWs.includes(cleanName) || (cityPart && cleanName.includes(cityPart)));
      }
      return false;
    });
  }, [agendamientos, isMatriz, selectedWorkshopFilter, workshops, activeWorkshopId, currentWorkshop]);

  const filteredClients = useMemo(() => {
    if (isMatriz && selectedWorkshopFilter === 'all') {
      return clients;
    }
    const targetWsId = isMatriz ? selectedWorkshopFilter : (currentWorkshop?.id || activeWorkshopId);
    const targetWs = workshops.find((w) => w.id === targetWsId) || currentWorkshop;
    const cedulasInSede = new Set(
      filteredFullAlistamientos.map((a) => a.cedulaRuc.trim().toLowerCase()).filter(Boolean)
    );
    return clients.filter((c) => {
      // 1. Si tiene workshopId explícito, DEBE coincidir con la sede activa
      if (c.workshopId) {
        return c.workshopId === targetWsId;
      }
      // 2. Si el cliente tiene un alistamiento realizado en esta sede
      if (c.idNumber && cedulasInSede.has(c.idNumber.trim().toLowerCase())) {
        return true;
      }
      // 3. Fallback: comparar estrictamente por nombre de sede o ciudad
      if (c.workshopName && targetWs) {
        const cleanCws = c.workshopName.toLowerCase().replace(/starmotos|sucursal|sede|taller/gi, '').trim();
        const cleanWs = targetWs.name.toLowerCase().replace(/starmotos|sucursal|sede|taller/gi, '').trim();
        const cityPart = targetWs.city.toLowerCase().split(',')[0].trim();
        if (cleanCws && (cleanCws.includes(cleanWs) || cleanWs.includes(cleanCws) || (cityPart && cleanCws.includes(cityPart)))) {
          return true;
        }
      }
      return false;
    });
  }, [clients, isMatriz, selectedWorkshopFilter, workshops, filteredFullAlistamientos, activeWorkshopId, currentWorkshop]);

  const filteredTechnicians = useMemo(() => {
    if (isMatriz && selectedWorkshopFilter === 'all') {
      return technicians;
    }
    const targetWsId = isMatriz ? selectedWorkshopFilter : (currentWorkshop?.id || activeWorkshopId);
    return technicians.filter((t) => {
      if (t.workshopId) {
        return t.workshopId === targetWsId;
      }
      return false;
    });
  }, [technicians, isMatriz, selectedWorkshopFilter, activeWorkshopId, currentWorkshop]);

  // Alertas (la Matriz puede ver todas las alertas de talleres de la red)
  const filteredAlerts = useMemo(() => {
    if (isMatriz && selectedWorkshopFilter === 'all') {
      return allAlerts.filter(a => a.targetRole === 'taller' || a.targetRole === 'admin' || !a.targetRole);
    }
    const targetWsId = isMatriz ? selectedWorkshopFilter : (currentWorkshop?.id || activeWorkshopId);
    return filterAlertsForRole(allAlerts, {
      role: 'taller',
      workshopId: targetWsId,
    });
  }, [allAlerts, isMatriz, selectedWorkshopFilter, activeWorkshopId, currentWorkshop]);

  // Sincronización entre ventanas o localStorage
  useEffect(() => {
    const handleWarrantiesUpdate = () => setWarranties(getStoredWarranties());
    const handleOrdersUpdate = () => setOrders(getStoredOrders());
    const handleTechsUpdate = () => setTechnicians(getStoredTechnicians());
    const handleOriginsUpdate = () => setOrigins(getStoredOrigins());
    const handleAlistamientosUpdate = () => setFullAlistamientos(getStoredFullAlistamientos());
    const handleClientsUpdate = () => setClients(getStoredClients());
    const handleAlertsUpdate = () => setAllAlerts(getStoredAlerts());
    const handleWorkshopsUpdate = () => setWorkshops(getStoredWorkshops());
    const handleAgendamientosUpdate = () => setAgendamientos(getStoredAgendamientos());

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
        handleAgendamientosUpdate();
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
    window.addEventListener('starmotos_agendamientos_updated', handleAgendamientosUpdate);
    window.addEventListener('storage', handleStorageEvent);

    // Limpieza periódica automática de agendamientos que pasaron 24 horas luego de la fecha agendada
    cleanExpiredAgendamientos();
    const cleanupInterval = setInterval(() => {
      cleanExpiredAgendamientos();
    }, 60000);

    // Sincronización proactiva de arranque para garantizar datos actualizados de la red
    syncAllFromSupabase();

    return () => {
      clearInterval(cleanupInterval);
      window.removeEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
      window.removeEventListener('starmotos_orders_updated', handleOrdersUpdate);
      window.removeEventListener('starmotos_technicians_updated', handleTechsUpdate);
      window.removeEventListener('starmotos_origins_updated', handleOriginsUpdate);
      window.removeEventListener('starmotos_alistamientos_updated', handleAlistamientosUpdate);
      window.removeEventListener('starmotos_clients_updated', handleClientsUpdate);
      window.removeEventListener('starmotos_alerts_updated', handleAlertsUpdate);
      window.removeEventListener('starmotos_workshops_updated', handleWorkshopsUpdate);
      window.removeEventListener('starmotos_agendamientos_updated', handleAgendamientosUpdate);
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
    const current = getStoredAlerts();
    const updated = current.map((a) => (a.id === id ? { ...a, read: true } : a));
    saveStoredAlerts(updated);
  }, []);

  const markAllAlertsAsRead = useCallback(() => {
    const current = getStoredAlerts();
    const wsId = currentWorkshop?.id || activeWorkshopId;
    const tallerAlertIds = new Set(
      filterAlertsForRole(current, { role: 'taller', workshopId: wsId }).map((a) => a.id)
    );
    const updated = current.map((a) => (tallerAlertIds.has(a.id) ? { ...a, read: true } : a));
    saveStoredAlerts(updated);
    showToast('Notificaciones de la sede marcadas como leídas.', 'info');
  }, [currentWorkshop, activeWorkshopId, showToast]);

  const deleteAlert = useCallback((id: string) => {
    deleteStoredAlert(id);
    showToast('Notificación eliminada.', 'info');
  }, [showToast]);

  const deleteAllReadAlerts = useCallback(() => {
    const current = getStoredAlerts();
    const wsId = currentWorkshop?.id || activeWorkshopId;
    const tallerAlerts = filterAlertsForRole(current, { role: 'taller', workshopId: wsId });
    const readIds = tallerAlerts.filter((a) => a.read).map((a) => a.id);
    if (readIds.length === 0) {
      showToast('No hay notificaciones leídas para eliminar.', 'info');
      return;
    }
    deleteStoredAlerts(readIds);
    showToast('Notificaciones leídas eliminadas.', 'info');
  }, [currentWorkshop, activeWorkshopId, showToast]);

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
        targetBrand: directReq.targetBrand || directReq.motorcycleBrand,
        garanteName: directReq.garanteName || (directReq.warrantyType === 'marca' ? directReq.motorcycleBrand : undefined),
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
        targetBrand: newWarrantyForm.motorcycleBrand,
        garanteName: newWarrantyForm.warrantyType === 'marca' ? newWarrantyForm.motorcycleBrand : undefined,
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
        estimatedCost: Number(newWarrantyForm.estimatedCost) || 0,
      };
    }

    setWarranties((prev) => {
      const updated = [newReq, ...prev];
      saveStoredWarranties(updated);
      return updated;
    });

    // Alertar en el sistema de forma diferenciada por rol
    const alertsToPush: SystemAlert[] = [];

    // Alerta para el Taller
    alertsToPush.push({
      id: `alt-tal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'solicitud_garantia',
      targetRole: 'taller',
      targetWorkshopId: newReq.tallerOriginId,
      title: 'Solicitud Enviada a Matriz',
      message: `Solicitud #${newReq.requestNumber} (${newReq.motorcycleBrand} ${newReq.motorcycleModel}) enviada a Matriz Central para validación inicial.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: newReq.id,
    });

    // Alerta para Matriz / Admin
    alertsToPush.push({
      id: `alt-adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'solicitud_garantia',
      targetRole: 'admin',
      title: 'Nueva Solicitud de Garantía Recibida',
      message: `${newReq.tallerOrigin} envió la solicitud #${newReq.requestNumber} para el cliente ${newReq.clientName} (${newReq.motorcycleBrand} ${newReq.motorcycleModel}).`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: newReq.id,
    });

    addStoredAlerts(alertsToPush);

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

  const deleteTechnician = useCallback((id: string) => {
    deleteStoredTechnician(id);
    setTechnicians((prev) => prev.filter((t) => t.id !== id));
    showToast('Técnico eliminado de la sede.', 'info');
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
    const wsId = currentWorkshop?.id || activeWorkshopId;
    const wsName = currentWorkshop?.name || 'StarMotos Sede Oficial';

    // 1. Asegurar pertenencia al taller asignado (conservar taller de origen si ya existe)
    const targetWsId = record.sedeId || wsId;
    const targetWsName = record.sede || wsName;
    const securedRecord: AlistamientoFullRecord = {
      ...record,
      sedeId: targetWsId,
      sede: targetWsName,
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
      motorcycleMileage: Number(securedRecord.kilometraje) || 0,
      address: securedRecord.direccion,
      color: securedRecord.color,
      year: securedRecord.year,
      lastVisit: securedRecord.fechaServicio,
      totalVisits: 1,
      workshopId: targetWsId,
      workshopName: targetWsName,
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
          motorcycleMileage: securedRecord.kilometraje !== undefined ? (Number(securedRecord.kilometraje) || 0) : updated[existingIdx].motorcycleMileage,
          address: securedRecord.direccion || updated[existingIdx].address,
          color: securedRecord.color || updated[existingIdx].color,
          year: securedRecord.year || updated[existingIdx].year,
          lastVisit: securedRecord.fechaServicio || updated[existingIdx].lastVisit,
          workshopId: targetWsId,
          workshopName: targetWsName,
          totalVisits: updated[existingIdx].totalVisits + 1,
        };
      } else {
        updated = [newClient, ...prev];
      }
      saveStoredClients(updated);
      return updated;
    });

    // 4. AUTO-GENERAR ORDEN DE TRABAJO desde alistamiento
    const serviceLabels: Record<string, string> = {
      alistamiento_pdi: 'PDI',
      engrasado: 'Engrasado',
      mantenimiento: 'Mantenimiento',
    };
    const servicesSummary = (securedRecord.serviciosRealizados || [])
      .map((s) => serviceLabels[s] || s)
      .join(', ') || 'Servicio General';

    const otNumber = `OT-${Date.now().toString(36).toUpperCase()}`;
    const newOrder: TallerOrder = {
      id: `ord-${Date.now()}`,
      otNumber,
      clientName: `${securedRecord.nombres} ${securedRecord.apellidos}`.trim(),
      clientIdNumber: securedRecord.cedulaRuc,
      motorcycleInfo: securedRecord.modeloMarca,
      plate: securedRecord.placa,
      entryDate: securedRecord.fechaServicio || new Date().toISOString().split('T')[0],
      status: 'inicio',
      mechanicName: securedRecord.tecnicoResponsable || 'Sin asignar',
      estimatedDelivery: '',
      totalCost: securedRecord.valorServicio || 0,
      workshopId: wsId,
      workshopName: wsName,
      alistamientoId: securedRecord.id,
      servicesSummary,
    };

    setOrders((prev) => {
      // Evitar duplicar si ya existe orden para este alistamiento
      const alreadyExists = prev.some((o) => o.alistamientoId === securedRecord.id);
      if (alreadyExists) {
        const updated = prev.map((o) =>
          o.alistamientoId === securedRecord.id ? { ...o, ...newOrder, id: o.id, otNumber: o.otNumber } : o
        );
        saveStoredOrders(updated);
        return updated;
      }
      const updated = [newOrder, ...prev];
      saveStoredOrders(updated);
      return updated;
    });

    // 5. Crear Alertas diferenciadas de sistema
    const alertsToPush: SystemAlert[] = [];

    // Alerta para el Taller
    alertsToPush.push({
      id: `alt-tal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'orden_creada',
      targetRole: 'taller',
      targetWorkshopId: targetWsId,
      title: 'Orden de Trabajo Generada',
      message: `${wsName}: ${otNumber} — ${securedRecord.nombres} ${securedRecord.apellidos} — ${securedRecord.modeloMarca} (${securedRecord.placa}). Servicios: ${servicesSummary}.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: securedRecord.id,
    });

    // Alerta para Matriz / Admin
    alertsToPush.push({
      id: `alt-adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'orden_creada',
      targetRole: 'admin',
      title: 'Nuevo Alistamiento en Sede',
      message: `${wsName} registró la orden ${otNumber} para ${securedRecord.nombres} ${securedRecord.apellidos} (${securedRecord.modeloMarca} - ${securedRecord.placa}).`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: securedRecord.id,
    });

    addStoredAlerts(alertsToPush);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1d4ed8', '#dc2626', '#10b981'],
    });

    showToast('¡Alistamiento guardado y sincronizado exitosamente!', 'success');
  }, [currentWorkshop, activeWorkshopId, showToast]);

  const deleteAgendamiento = useCallback((id: string) => {
    deleteStoredAgendamiento(id);
    showToast('Agendamiento eliminado correctamente.', 'info');
  }, [showToast]);

  return {
    activeSection,
    setActiveSection,
    isSidebarOpen,
    setIsSidebarOpen,
    activeWorkshopId,
    currentWorkshop,
    isMatriz,
    selectedWorkshopFilter,
    setSelectedWorkshopFilter,
    orders: filteredOrders,
    updateOrderStatus,
    warranties: filteredWarranties,
    clients: filteredClients,
    localClients: filteredClients,
    inventory,
    workshops,
    technicians: filteredTechnicians,
    origins,
    fullAlistamientos: filteredFullAlistamientos,
    rawFullAlistamientos: fullAlistamientos,
    agendamientos: filteredAgendamientos,
    rawAgendamientos: agendamientos,
    deleteAgendamiento,
    addTechnician,
    deleteTechnician,
    addOrigin,
    saveFullAlistamiento,
    newWarrantyForm,
    setNewWarrantyForm,
    createWarrantyRequest,
    alerts: filteredAlerts,
    markAlertAsRead,
    markAllAlertsAsRead,
    deleteAlert,
    deleteAllReadAlerts,
    updateWorkshopProfile,
    toastMessage,
    showToast,
  };
}

