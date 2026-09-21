// src/hooks/useTallerPortal.ts
import { useState, useCallback, useEffect, useRef } from 'react';
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
  getStoredTechnicians,
  saveStoredTechnicians,
  getStoredOrigins,
  saveStoredOrigins,
  getStoredFullAlistamientos,
  saveStoredFullAlistamientos,
  getStoredWorkshops,
} from '../data/mockMultiRoleData';
import { Technician, AlistamientoFullRecord, Workshop } from '../types/customer';

export const TALLER_SECTIONS: TallerSection[] = [
  'ordenes_taller',
  'alistamiento_taller',
  'solicitudes_garantia',
  'clientes_taller',
  'tecnicos',
  'inventario',
];

const getSectionFromHash = (): TallerSection => {
  if (typeof window === 'undefined') return 'ordenes_taller';
  const cleanHash = window.location.hash.replace(/^#\/?/, '').trim();
  if (TALLER_SECTIONS.includes(cleanHash as TallerSection)) {
    return cleanHash as TallerSection;
  }
  return 'ordenes_taller';
};

export function useTallerPortal() {
  const [activeSection, setActiveSectionState] = useState<TallerSection>(getSectionFromHash);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeSectionRef = useRef<TallerSection>(activeSection);
  activeSectionRef.current = activeSection;

  const [workshops, setWorkshops] = useState<Workshop[]>(getStoredWorkshops);
  const [orders, setOrders] = useState<TallerOrder[]>(getStoredOrders);
  const [warranties, setWarranties] = useState<WarrantyRequest[]>(getStoredWarranties);
  const [clients, setClients] = useState<TallerClient[]>(getStoredClients);
  const [inventory, setInventory] = useState<InventoryItem[]>(getStoredInventory);
  const [technicians, setTechnicians] = useState<Technician[]>(getStoredTechnicians);
  const [origins, setOrigins] = useState<string[]>(getStoredOrigins);
  const [fullAlistamientos, setFullAlistamientos] = useState<AlistamientoFullRecord[]>(getStoredFullAlistamientos);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sincronización entre ventanas o localStorage
  useEffect(() => {
    const handleWarrantiesUpdate = () => setWarranties(getStoredWarranties());
    const handleOrdersUpdate = () => setOrders(getStoredOrders());
    const handleTechsUpdate = () => setTechnicians(getStoredTechnicians());
    const handleOriginsUpdate = () => setOrigins(getStoredOrigins());
    const handleAlistamientosUpdate = () => setFullAlistamientos(getStoredFullAlistamientos());
    const handleClientsUpdate = () => setClients(getStoredClients());

    window.addEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
    window.addEventListener('starmotos_orders_updated', handleOrdersUpdate);
    window.addEventListener('starmotos_technicians_updated', handleTechsUpdate);
    window.addEventListener('starmotos_origins_updated', handleOriginsUpdate);
    window.addEventListener('starmotos_alistamientos_updated', handleAlistamientosUpdate);

    return () => {
      window.removeEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
      window.removeEventListener('starmotos_orders_updated', handleOrdersUpdate);
      window.removeEventListener('starmotos_technicians_updated', handleTechsUpdate);
      window.removeEventListener('starmotos_origins_updated', handleOriginsUpdate);
      window.removeEventListener('starmotos_alistamientos_updated', handleAlistamientosUpdate);
    };
  }, []);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Hash navigation
  const setActiveSection = useCallback((newSection: TallerSection, replace = false) => {
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

  const createWarrantyRequest = useCallback(() => {
    if (!newWarrantyForm.clientName || !newWarrantyForm.issueDescription) {
      showToast('Complete los campos obligatorios del reclamo.', 'error');
      return false;
    }

    const newReq: WarrantyRequest = {
      id: `gar-${Date.now()}`,
      requestNumber: `GAR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: 'Hoy, Taller Express Norte',
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
      status: 'enviada_matriz', // El taller la genera y viaja a Matriz
      tallerOrigin: 'StarMotos Express Norte',
      tallerOriginId: 'taller-norte',
      estimatedCost: Number(newWarrantyForm.estimatedCost) || 60,
    };

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
      message: `${newReq.tallerOrigin} generó la solicitud ${newReq.requestNumber} para ${newReq.clientName}. Esperando validación de Matriz.`,
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

    showToast(`Solicitud ${newReq.requestNumber} enviada a Matriz Central exitosamente.`, 'success');

    // Resetear formulario
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
  }, [newWarrantyForm, showToast]);

  // ===================== GESTIÓN DE TÉCNICOS & ALISTAMIENTO =====================
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
    // 1. Guardar en lista de alistamientos
    setFullAlistamientos((prev) => {
      const updated = [record, ...prev];
      saveStoredFullAlistamientos(updated);
      return updated;
    });

    // 2. Crear / actualizar en lista de clientes del taller
    const newClient: TallerClient = {
      id: `cli-${Date.now()}`,
      fullName: `${record.nombres} ${record.apellidos}`.trim(),
      idNumber: record.cedulaRuc,
      phone: record.celular1,
      email: record.email,
      motorcycleBrand: record.modeloMarca.split(' ')[0] || 'Moto',
      motorcycleModel: record.modeloMarca,
      motorcyclePlate: record.placa,
      lastVisit: record.fechaServicio,
      totalVisits: 1,
    };

    setClients((prev) => {
      const existingIdx = prev.findIndex((c) => c.idNumber === record.cedulaRuc);
      let updated: TallerClient[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          lastVisit: record.fechaServicio,
          totalVisits: updated[existingIdx].totalVisits + 1,
          motorcyclePlate: record.placa || updated[existingIdx].motorcyclePlate,
        };
      } else {
        updated = [newClient, ...prev];
      }
      saveStoredClients(updated);
      return updated;
    });

    // 3. Crear Alerta de sistema
    const newAlert: SystemAlert = {
      id: `alt-${Date.now()}`,
      type: 'orden_creada',
      title: 'Nuevo Alistamiento Registrado',
      message: `${record.sede}: Cliente ${record.nombres} ${record.apellidos} — Moto ${record.modeloMarca} (${record.placa}). Factura ${record.numeroFactura}.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: record.id,
    };
    saveStoredAlerts([newAlert, ...getStoredAlerts()]);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1d4ed8', '#dc2626', '#10b981'],
    });

    showToast('¡Alistamiento registrado y sincronizado exitosamente!', 'success');
  }, [showToast]);

  return {
    activeSection,
    setActiveSection,
    isSidebarOpen,
    setIsSidebarOpen,
    orders,
    updateOrderStatus,
    warranties,
    clients,
    inventory,
    workshops,
    technicians,
    origins,
    fullAlistamientos,
    addTechnician,
    addOrigin,
    saveFullAlistamiento,
    newWarrantyForm,
    setNewWarrantyForm,
    createWarrantyRequest,
    toastMessage,
    showToast,
  };
}

