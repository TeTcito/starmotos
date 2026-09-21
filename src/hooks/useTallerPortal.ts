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
  getStoredInventory,
  saveStoredAlerts,
  getStoredAlerts,
} from '../data/mockMultiRoleData';

export const TALLER_SECTIONS: TallerSection[] = [
  'ordenes_taller',
  'solicitudes_garantia',
  'clientes_taller',
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

  const [orders, setOrders] = useState<TallerOrder[]>(getStoredOrders);
  const [warranties, setWarranties] = useState<WarrantyRequest[]>(getStoredWarranties);
  const [clients, setClients] = useState<TallerClient[]>(getStoredClients);
  const [inventory, setInventory] = useState<InventoryItem[]>(getStoredInventory);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sincronización entre ventanas o localStorage
  useEffect(() => {
    const handleWarrantiesUpdate = () => setWarranties(getStoredWarranties());
    const handleOrdersUpdate = () => setOrders(getStoredOrders());
    window.addEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
    window.addEventListener('starmotos_orders_updated', handleOrdersUpdate);
    return () => {
      window.removeEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
      window.removeEventListener('starmotos_orders_updated', handleOrdersUpdate);
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
    newWarrantyForm,
    setNewWarrantyForm,
    createWarrantyRequest,
    toastMessage,
    showToast,
  };
}
