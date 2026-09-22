// src/hooks/useAdminPortal.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  AdminSection,
  Workshop,
  WarrantyRequest,
  SystemAlert,
  AdminInvoice,
  AlistamientoClient,
  AlistamientoMotorcycle,
  AlistamientoService,
} from '../types/customer';
import {
  getStoredWarranties,
  saveStoredWarranties,
  getStoredWorkshops,
  getStoredAlerts,
  saveStoredAlerts,
  getStoredInvoices,
  saveStoredInvoices,
  getStoredTechnicians,
  saveStoredTechnicians,
  getStoredOrigins,
  saveStoredOrigins,
  getStoredFullAlistamientos,
  saveStoredFullAlistamientos,
  getStoredClients,
  saveStoredClients,
  querySriMock,
} from '../data/mockMultiRoleData';
import { Technician, AlistamientoFullRecord, TallerClient } from '../types/customer';

export const ADMIN_SECTIONS: AdminSection[] = [
  'talleres',
  'alistamiento',
  'clientes_admin',
  'garantias_admin',
  'tecnicos',
  'facturacion',
  'alertas',
];

const getSectionFromHash = (): AdminSection => {
  if (typeof window === 'undefined') return 'talleres';
  const cleanHash = window.location.hash.replace(/^#\/?/, '').trim();
  if (ADMIN_SECTIONS.includes(cleanHash as AdminSection)) {
    return cleanHash as AdminSection;
  }
  return 'talleres';
};

export function useAdminPortal() {
  const [activeSection, setActiveSectionState] = useState<AdminSection>(getSectionFromHash);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeSectionRef = useRef<AdminSection>(activeSection);
  activeSectionRef.current = activeSection;

  // Estado compartido
  const [workshops, setWorkshops] = useState<Workshop[]>(getStoredWorkshops);
  const [warranties, setWarranties] = useState<WarrantyRequest[]>(getStoredWarranties);
  const [alerts, setAlerts] = useState<SystemAlert[]>(getStoredAlerts);
  const [invoices, setInvoices] = useState<AdminInvoice[]>(getStoredInvoices);
  const [technicians, setTechnicians] = useState<Technician[]>(getStoredTechnicians);
  const [origins, setOrigins] = useState<string[]>(getStoredOrigins);
  const [fullAlistamientos, setFullAlistamientos] = useState<AlistamientoFullRecord[]>(getStoredFullAlistamientos);
  const [clients, setClients] = useState<TallerClient[]>(getStoredClients);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Escuchar actualizaciones externas de localStorage (evento sincronizado)
  useEffect(() => {
    const handleWarrantiesUpdate = () => setWarranties(getStoredWarranties());
    const handleAlertsUpdate = () => setAlerts(getStoredAlerts());
    const handleTechsUpdate = () => setTechnicians(getStoredTechnicians());
    const handleOriginsUpdate = () => setOrigins(getStoredOrigins());
    const handleAlistamientosUpdate = () => setFullAlistamientos(getStoredFullAlistamientos());
    const handleClientsUpdate = () => setClients(getStoredClients());

    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('starmotos_shared_')) {
        handleWarrantiesUpdate();
        handleAlertsUpdate();
        handleTechsUpdate();
        handleOriginsUpdate();
        handleAlistamientosUpdate();
        handleClientsUpdate();
      }
    };

    window.addEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
    window.addEventListener('starmotos_alerts_updated', handleAlertsUpdate);
    window.addEventListener('starmotos_technicians_updated', handleTechsUpdate);
    window.addEventListener('starmotos_origins_updated', handleOriginsUpdate);
    window.addEventListener('starmotos_alistamientos_updated', handleAlistamientosUpdate);
    window.addEventListener('starmotos_clients_updated', handleClientsUpdate);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('starmotos_warranties_updated', handleWarrantiesUpdate);
      window.removeEventListener('starmotos_alerts_updated', handleAlertsUpdate);
      window.removeEventListener('starmotos_technicians_updated', handleTechsUpdate);
      window.removeEventListener('starmotos_origins_updated', handleOriginsUpdate);
      window.removeEventListener('starmotos_alistamientos_updated', handleAlistamientosUpdate);
      window.removeEventListener('starmotos_clients_updated', handleClientsUpdate);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Navegación hash
  const setActiveSection = useCallback((newSection: AdminSection, replace = false) => {
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

    // Crear alerta
    const targetW = warranties.find((w) => w.id === id);
    const newAlert: SystemAlert = {
      id: `alt-${Date.now()}`,
      type: 'estado_cambiado',
      title: 'Garantía Aceptada por Matriz (En Proceso)',
      message: `La solicitud ${targetW?.requestNumber || id} fue aceptada por Matriz y pasa a En Proceso hacia el Garante de Marca.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: id,
    };
    setAlerts((prev) => {
      const updatedAlerts = [newAlert, ...prev];
      saveStoredAlerts(updatedAlerts);
      return updatedAlerts;
    });

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
    const newAlert: SystemAlert = {
      id: `alt-${Date.now()}`,
      type: 'garantia_rechazada',
      title: 'Garantía Denegada por Matriz',
      message: `La solicitud ${targetW?.requestNumber || id} fue denegada en revisión de Matriz.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: id,
    };
    setAlerts((prev) => {
      const updatedAlerts = [newAlert, ...prev];
      saveStoredAlerts(updatedAlerts);
      return updatedAlerts;
    });

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

    // Crear alerta
    const targetW = warranties.find((w) => w.id === id);
    const newAlert: SystemAlert = {
      id: `alt-${Date.now()}`,
      type: 'estado_cambiado',
      title: 'Garantía Enviada al Garante',
      message: `La solicitud ${targetW?.requestNumber || id} fue despachada digitalmente al Garante oficial de marca.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: id,
    };
    setAlerts((prev) => {
      const updatedAlerts = [newAlert, ...prev];
      saveStoredAlerts(updatedAlerts);
      return updatedAlerts;
    });

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

  // Marcar alertas como leídas
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
    showToast('Todas las notificaciones marcadas como leídas.', 'info');
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

    // Generar alerta de sistema
    const newAlert: SystemAlert = {
      id: `alt-${Date.now()}`,
      type: 'orden_creada',
      title: 'Alistamiento Registrado con Éxito',
      message: `Cliente ${alistamientoClient.fullName} ingresó ${alistamientoMoto.brand} ${alistamientoMoto.model} (${alistamientoMoto.plate || 'S/P'}). Factura: $${alistamientoService.cost} USD.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: newInvoice.invoiceNumber,
    };

    setAlerts((prev) => {
      const updatedAlerts = [newAlert, ...prev];
      saveStoredAlerts(updatedAlerts);
      return updatedAlerts;
    });

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

    // 3. Crear factura
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
      const updated = [newInv, ...prev];
      saveStoredInvoices(updated);
      return updated;
    });

    // 4. Crear Alerta
    const newAlert: SystemAlert = {
      id: `alt-${Date.now()}`,
      type: 'orden_creada',
      title: 'Nuevo Alistamiento Registrado',
      message: `${record.sede}: Cliente ${record.nombres} ${record.apellidos} — Moto ${record.modeloMarca} (${record.placa}). Factura ${record.numeroFactura}.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: record.id,
    };
    setAlerts((prev) => {
      const updated = [newAlert, ...prev];
      saveStoredAlerts(updated);
      return updated;
    });

    showToast(`¡Alistamiento de ${record.nombres} registrado con éxito!`, 'success');
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
    toastMessage,
    showToast,
    // Garantías
    validateWarrantyByMatriz,
    rejectWarrantyByMatriz,
    sendWarrantyToGarante,
    completeWarrantyRepair,
    // Alertas
    markAlertAsRead,
    markAllAlertsAsRead,
    // Técnicos & Alistamiento Full
    addTechnician,
    addOrigin,
    saveFullAlistamiento,
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
