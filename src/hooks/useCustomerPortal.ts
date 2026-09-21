// src/hooks/useCustomerPortal.ts
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  WorkOrder,
  Quotation,
  Vehicle,
  MaintenanceRecord,
  WarrantyItem,
  Branch,
  WorkOrderStatus,
  ProgressStep,
  ClientProfile,
  MotorcycleClientData,
  ScheduledMaintenance,
} from '../types/customer';
import { ActiveSection } from '../components/SidebarDrawer';

// Sucursales StarMotos
export const BRANCH_MATRIZ: Branch = {
  id: 'matriz-quito',
  name: 'StarMotos Matriz Central',
  code: 'MAT-01',
  address: 'Av. 10 de Agosto N31-154 y Mariana de Jesús',
  city: 'Quito, Ecuador',
  phone: '+593 93 931 6698',
  whatsapp: '593939316698',
  email: 'matriz@starmotos.ec',
  schedule: 'Lunes a Viernes: 08:00 - 18:00 | Sábados: 08:30 - 13:30',
  googleMapsUrl: 'https://maps.google.com/?q=-0.1983,-78.4941',
};

export const BRANCH_NORTE: Branch = {
  id: 'taller-norte',
  name: 'StarMotos Taller Express Norte',
  code: 'NOR-02',
  address: 'Av. Galo Plaza Lasso N64-89 y De los Pinos',
  city: 'Quito Norte, Ecuador',
  phone: '+593 93 931 6698',
  whatsapp: '593939316698',
  email: 'norte@starmotos.ec',
  schedule: 'Lunes a Viernes: 08:00 - 17:30 | Sábados: 08:30 - 13:00',
  googleMapsUrl: 'https://maps.google.com/?q=-0.1256,-78.4723',
};

export const ALL_BRANCHES = [BRANCH_MATRIZ, BRANCH_NORTE];

const INITIAL_PROFILE: ClientProfile = {
  id: 'cli-0089',
  fullName: 'Fernando Vaca',
  idNumber: '1724890123',
  phone: '+593 99 874 5612',
  email: 'cliente@starmotos.ec',
  address: 'Av. Brasil N39-122 y Edmundo Carvajal, Quito',
  city: 'Quito, Ecuador',
  emergencyContactName: 'Dra. Gabriela Zambrano (Esposa)',
  emergencyContactPhone: '+593 98 456 7890',
  clientType: 'particular',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
};

const INITIAL_MOTORCYCLE: MotorcycleClientData = {
  plate: 'PBX-8492',
  brand: 'Benelli',
  model: 'TRK 502X ABS Adventure',
  year: 2024,
  displacement: '500 cc',
  vin: 'LBBP57008PA049182',
  color: 'Gris Antracita / Chasis Rojo Racing',
  currentKm: 14850,
  lastOilChangeKm: 12500,
  oilChangeIntervalKm: 3000,
  preferredOil: 'Motul 7100 10W-40 100% Sintético',
  dailyUsageKm: 25,
  reportedSymptoms: 'Siento leve vibración en el tren delantero al pasar de 80 km/h y chillido ocasional en pastillas delanteras en clima frío.',
  preferredPartsQuality: 'originales_oem',
  preferredBranchId: 'matriz-quito',
  photoUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80',
};

const INITIAL_SCHEDULED_MAINTENANCES: ScheduledMaintenance[] = [
  {
    id: 'maint-1',
    serviceTitle: 'Mantenimiento Preventivo 15,000 KM (Aceite + Filtro + Bujías)',
    recommendedKm: 15000,
    recommendedDate: '25 Sep 2026',
    scheduledDate: '25 Sep 2026',
    scheduledTime: '09:00 AM',
    branchName: 'StarMotos Matriz Central',
    branchId: 'matriz-quito',
    status: 'confirmada',
    estimatedCost: 75.0,
    tasks: ['Cambio de Aceite Motul 7100 10W-40', 'Filtro de Aceite OEM', 'Ajuste de Cadena Regina', 'Escáner Delphi'],
    notes: 'Cliente solicita revisión adicional de pastillas de freno delanteras.',
  },
  {
    id: 'maint-2',
    serviceTitle: 'Servicio Mayor 20,000 KM (Calibración Válvulas & Suspensión)',
    recommendedKm: 20000,
    recommendedDate: '15 Ene 2027',
    branchName: 'StarMotos Matriz Central',
    branchId: 'matriz-quito',
    status: 'pendiente',
    estimatedCost: 140.0,
    tasks: ['Regulación de Válvulas por Pastillas', 'Cambio Aceite Horquilla Motul Fork Oil', 'Revisión Líquido Refrigerante'],
    notes: 'Programación automática según promedio diario de 25 km.',
  },
];

// Generador de pasos de la OT
const buildSteps = (currentStatus: WorkOrderStatus): ProgressStep[] => {
  const stepsDef: { id: WorkOrderStatus; label: string; shortLabel: string; desc: string; time: string }[] = [
    { id: 'recepcion', label: 'Recepción e Inspección 360°', shortLabel: 'Recepción', desc: 'Inventario de pertenencias y chequeo visual de carrocería.', time: '20 Sep 2026, 08:45 AM' },
    { id: 'diagnostico', label: 'Diagnóstico en Elevador', shortLabel: 'Diagnóstico', desc: 'Revisión técnica de compresión, sistema eléctrico y transmisión.', time: '20 Sep 2026, 10:15 AM' },
    { id: 'cotizacion_pendiente', label: 'Cotización y Presupuesto', shortLabel: 'Cotización', desc: 'Emisión de proforma para autorización del cliente.', time: '20 Sep 2026, 11:30 AM' },
    { id: 'en_reparacion', label: 'En Reparación Mecánica', shortLabel: 'En Reparación', desc: 'Mecánico especializado ejecutando trabajos técnicos.', time: '20 Sep 2026, 02:20 PM' },
    { id: 'control_calidad', label: 'Control de Calidad & Escáner', shortLabel: 'C. Calidad', desc: 'Prueba de ruta en banco de rodillos y torque con dinamométrica.', time: 'Estimado: Hoy 04:30 PM' },
    { id: 'lista_retiro', label: 'Lista para Retiro', shortLabel: 'Lista para Retiro', desc: 'Motocicleta lavada y verificada en bahía de entrega.', time: 'Estimado: Hoy 05:45 PM' },
    { id: 'entregada', label: 'Entregada al Propietario', shortLabel: 'Entregada', desc: 'Firma de conformidad y factura electrónica SRI.', time: 'Pendiente entrega' },
  ];

  const order: WorkOrderStatus[] = ['recepcion', 'diagnostico', 'cotizacion_pendiente', 'en_reparacion', 'control_calidad', 'lista_retiro', 'entregada'];
  const currentIndex = order.indexOf(currentStatus);

  return stepsDef.map((step, idx) => ({
    id: step.id,
    label: step.label,
    shortLabel: step.shortLabel,
    description: step.desc,
    completed: idx < currentIndex,
    current: idx === currentIndex,
    timestamp: idx <= currentIndex ? step.time : undefined,
  }));
};

// Escenario base para la OT activa
const INITIAL_WORK_ORDER: WorkOrder = {
  otNumber: 'OT-2026-0841',
  entryDate: '20 Sep 2026, 08:30 AM',
  estimatedDelivery: '21 Sep 2026, 17:00 PM',
  clientReason: 'Mantenimiento preventivo de los 15,000 km, vibración en el tren delantero y tensión del kit de arrastre.',
  branch: BRANCH_MATRIZ,
  mechanic: {
    id: 'mec-03',
    name: 'Carlos "Charly" Morales',
    specialty: 'Master Técnico Benelli & Motos Adventure',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    certifications: ['Certificación Oficial Benelli Italia', 'Manejo de Inyección Delphi'],
  },
  advisor: 'Ing. Mateo Enríquez (Asesor de Servicio Senior)',
  status: 'cotizacion_pendiente',
  steps: buildSteps('cotizacion_pendiente'),
  supervisorObservations: 'Desgaste pronunciado en piñón de ataque y catalina 525. Pastillas delanteras al 15% de vida útil.',
  diagnosticPhotos: [
    {
      id: 'diag-1',
      url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=900&q=80',
      title: 'Desgaste en Catalina y Cadena 525',
      description: 'Dientes afilados y estiramiento fuera de tolerancia de manual.',
      uploadedAt: '10:35 AM',
      stage: 'Diagnóstico Transmisión',
    },
    {
      id: 'diag-2',
      url: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80',
      title: 'Pastillas Delanteras Cerámicas',
      description: 'Espesor residual de 1.2 mm (límite 1.0 mm).',
      uploadedAt: '10:48 AM',
      stage: 'Inspección Frenos',
    },
  ],
  quotation: {
    quotationNumber: 'COT-2026-1104',
    createdAt: '20 Sep 2026, 11:20 AM',
    expiresAt: '22 Sep 2026, 18:00 PM',
    status: 'pendiente_aprobacion',
    parts: [
      { code: 'REP-BEN-525', description: 'Kit de Arrastre Reforzado Regina O-Ring 525 (15T / 44T)', brand: 'Regina Chain Italy', quantity: 1, unitPrice: 115.0, subtotal: 115.0, warrantyMonths: 12 },
      { code: 'LUB-MOT-7100', description: 'Aceite 100% Sintético Motul 7100 10W-40 4T (3.2 Litros)', brand: 'Motul Ester', quantity: 3.2, unitPrice: 16.5, subtotal: 52.8, warrantyMonths: 6 },
      { code: 'FIL-BEN-OEM', description: 'Filtro de Aceite Benelli TRK Original OEM', brand: 'Benelli Genuine Parts', quantity: 1, unitPrice: 14.5, subtotal: 14.5, warrantyMonths: 6 },
      { code: 'BRK-BREM-02', description: 'Juego de Pastillas de Freno Delanteras Sinterizadas', brand: 'Brembo Sinter', quantity: 2, unitPrice: 24.0, subtotal: 48.0, warrantyMonths: 6 },
    ],
    services: [
      { code: 'SRV-MAN-15K', description: 'Servicio Mayor 15,000 km (Regulación válvulas, sincronización vacuómetro)', hours: 2.5, unitCost: 35.0, subtotal: 35.0 },
      { code: 'SRV-KIT-INS', description: 'Mano de obra montaje de kit de transmisión y calibración de eje', hours: 1.0, unitCost: 20.0, subtotal: 20.0 },
    ],
    subtotalParts: 230.3,
    subtotalServices: 55.0,
    subtotal: 285.3,
    discount: 25.3,
    taxRate: 0.15,
    taxAmount: 39.0,
    total: 299.0,
    mechanicNotes: 'Todos los repuestos cuentan con garantía StarMotos.',
  },
};

const INITIAL_HISTORY: MaintenanceRecord[] = [
  {
    id: 'hist-1',
    otNumber: 'OT-2026-0310',
    invoiceNumber: 'FAC-001-002-0004910',
    date: '15 Mar 2026',
    mileage: 10200,
    branchName: 'StarMotos Matriz Central',
    workSummary: [
      'Cambio de Aceite Sintético Motul 7100 10W-40 (3.2 L)',
      'Reemplazo de Filtro de Aceite Original Benelli',
      'Lavado Técnico a Presión y Lubricación de Cadena con Motul C4',
    ],
    partsReplaced: ['Aceite Motul 7100 (4 cuartos)', 'Filtro Aceite Benelli OEM', 'Arandela de Cárter'],
    totalPaid: 92.5,
    technicianName: 'Carlos Morales (Técnico Certificado)',
  },
  {
    id: 'hist-2',
    otNumber: 'OT-2025-0842',
    invoiceNumber: 'FAC-001-002-0003840',
    date: '18 Nov 2025',
    mileage: 6100,
    branchName: 'StarMotos Matriz Central',
    workSummary: [
      'Mantenimiento Preventivo 6.000 km según manual de fábrica',
      'Calibración de Válvulas y Sincronización de Inyección EFI',
      'Cambio de Pastillas de Freno Delanteras Brembo Sinterizadas',
      'Revisión y Ajuste de Holgura de Rodamientos de Dirección',
    ],
    partsReplaced: ['Pastillas Delanteras Brembo 07BB04SA', 'Líquido de Frenos Motul DOT 5.1'],
    totalPaid: 148.0,
    technicianName: 'Ing. Carlos Mendoza (Master Tech)',
  },
  {
    id: 'hist-3',
    otNumber: 'OT-2025-0320',
    invoiceNumber: 'FAC-001-001-0002155',
    date: '24 Jul 2025',
    mileage: 2500,
    branchName: 'StarMotos Taller Express Norte',
    workSummary: [
      'Primer Servicio Oficial de Rodaje Benelli',
      'Cambio de Aceite Mineral de Asentamiento por Sintético',
      'Ajuste Dinamométrico Completo de Tornillería de Chasis y Motor',
      'Inspección Electrónica con Escáner OBD Benelli Diagnosis',
    ],
    partsReplaced: ['Aceite Motul 5100 10W-40', 'Filtro Aceite OEM', 'Spray Limpiador de Inyección'],
    totalPaid: 74.5,
    technicianName: 'David Carrera (Especialista Benelli)',
  },
];

const INITIAL_WARRANTIES: WarrantyItem[] = [
  {
    id: 'war-1',
    title: 'Garantía Oficial de Motor y Caja Benelli',
    type: 'garantia_fabrica',
    status: 'vigente',
    coverage: 'Componentes internos de motor, transmisión y sistema EFI',
    startDate: '12 Feb 2025',
    expirationDate: '12 Feb 2027',
    kmLimit: 30000,
    currentKm: 14850,
    terms: 'Válida cumpliendo mantenimientos en red oficial StarMotos.',
  },
];

// Lista de secciones válidas en el portal
export const VALID_SECTIONS: ActiveSection[] = [
  'eventos',
  'agendar_cita',
  'perfil',
  'mi_moto',
  'mantenimientos',
  'orden_activa',
  'historial',
  'garantias',
];

// Obtener sección desde el hash de la URL
const getSectionFromHash = (): ActiveSection => {
  if (typeof window === 'undefined') return 'eventos';
  const cleanHash = window.location.hash.replace(/^#\/?/, '').trim();
  if (VALID_SECTIONS.includes(cleanHash as ActiveSection)) {
    return cleanHash as ActiveSection;
  }
  return 'eventos';
};

// Detección de entorno móvil / PWA
const isMobileViewport = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth < 1024 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.matchMedia('(display-mode: standalone)').matches
  );
};

export function useCustomerPortal() {
  // Estado de Autenticación
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('starmotos_auth') === 'true';
  });

  // Sección activa en el menú lateral: lee del hash URL al iniciar o recargar (F5)
  const [activeSection, setActiveSectionState] = useState<ActiveSection>(getSectionFromHash);

  // Drawer / menú hamburguesa
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Referencias para popstate y doble salir
  const activeSectionRef = useRef<ActiveSection>(activeSection);
  activeSectionRef.current = activeSection;

  const isSidebarOpenRef = useRef<boolean>(isSidebarOpen);
  isSidebarOpenRef.current = isSidebarOpen;

  const isApprovalModalOpenRef = useRef<boolean>(false);

  const lastBackPressRef = useRef<number>(0);

  // Notificación Toast (declarada temprano para ser usada por popstate)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Función para cambiar de módulo actualizando la URL y el historial del navegador
  const setActiveSection = useCallback((newSection: ActiveSection, replace = false) => {
    if (!VALID_SECTIONS.includes(newSection)) return;

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

  // Manejo del historial del navegador (Atrás / Adelante) y Doble Salir en móvil
  useEffect(() => {
    const initialSection = getSectionFromHash();
    const isMobile = isMobileViewport();

    // Sincronizar hash inicial si está vacío
    if (!window.location.hash || !VALID_SECTIONS.includes(window.location.hash.replace(/^#\/?/, '') as ActiveSection)) {
      window.history.replaceState({ section: initialSection }, '', `#${initialSection}`);
    }

    // En móvil, si arranca en 'eventos', agregar guard para interceptar el botón atrás
    if (isMobile && initialSection === 'eventos') {
      window.history.pushState({ section: 'eventos', isGuard: true }, '', '#eventos');
    }

    const handlePopState = () => {
      const isMobile = isMobileViewport();

      // 1. Si el drawer móvil está abierto, cerrarlo primero sin salir ni cambiar sección
      if (isSidebarOpenRef.current) {
        setIsSidebarOpen(false);
        window.history.pushState({ section: activeSectionRef.current }, '', `#${activeSectionRef.current}`);
        return;
      }

      // 2. Si el modal de aprobación de presupuesto está abierto, cerrarlo primero
      if (isApprovalModalOpenRef.current) {
        setIsApprovalModalOpen(false);
        window.history.pushState({ section: activeSectionRef.current }, '', `#${activeSectionRef.current}`);
        return;
      }

      const targetFromHash = getSectionFromHash();

      // 3. En móvil: si ya estamos en la raíz ('eventos') y el usuario presiona Atrás
      if (isMobile && activeSectionRef.current === 'eventos' && targetFromHash === 'eventos') {
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          // Doble toque dentro de 2 segundos: permitir salida
          showToast('Saliendo de la aplicación...', 'info');
          window.history.go(-2);
        } else {
          // Primer toque: advertir al usuario y re-armar el guard
          lastBackPressRef.current = now;
          showToast('Presione atrás nuevamente para salir', 'info');
          window.history.pushState({ section: 'eventos', isGuard: true }, '', '#eventos');
        }
        return;
      }

      // 4. Navegación normal entre secciones del historial
      setActiveSectionState(targetFromHash);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showToast]);

  // Datos del Cliente y Ficha de la Moto
  const [profile, setProfile] = useState<ClientProfile>(INITIAL_PROFILE);
  const [motorcycle, setMotorcycle] = useState<MotorcycleClientData>(INITIAL_MOTORCYCLE);
  const [scheduledMaintenances, setScheduledMaintenances] = useState<ScheduledMaintenance[]>(INITIAL_SCHEDULED_MAINTENANCES);

  // Orden de Trabajo y otros datos
  const [activeOrder, setActiveOrder] = useState<WorkOrder>(INITIAL_WORK_ORDER);
  const [history, setHistory] = useState<MaintenanceRecord[]>(INITIAL_HISTORY);
  const [warranties, setWarranties] = useState<WarrantyItem[]>(INITIAL_WARRANTIES);

  // Modales
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  isApprovalModalOpenRef.current = isApprovalModalOpen;
  const [isApproving, setIsApproving] = useState(false);

  // Login: Al ingresar, respeta la sección del hash si es válida, o va a eventos
  const login = useCallback(() => {
    setIsAuthenticated(true);
    localStorage.setItem('starmotos_auth', 'true');
    const target = getSectionFromHash();
    setActiveSection(target, true);
    showToast(`¡Bienvenido al Portal, ${profile.fullName.split(' ')[0]}!`, 'success');
  }, [profile.fullName, showToast, setActiveSection]);

  // Logout
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem('starmotos_auth');
    setActiveSection('eventos', true);
  }, [setActiveSection]);

  // Actualizar perfil
  const updateProfile = useCallback((updated: ClientProfile) => {
    setProfile(updated);
    showToast('Tus datos de perfil y facturación se han guardado exitosamente.', 'success');
  }, [showToast]);

  // Actualizar datos técnicos de la moto
  const updateMotorcycle = useCallback((updated: MotorcycleClientData) => {
    setMotorcycle(updated);
    showToast('Ficha técnica para el taller actualizada correctamente.', 'success');
  }, [showToast]);

  // Agendar nuevo mantenimiento
  const addScheduledMaintenance = useCallback((maintenance: ScheduledMaintenance) => {
    setScheduledMaintenances((prev) => [maintenance, ...prev]);
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#1d4ed8', '#dc2626', '#ffffff'],
    });
    showToast('¡Cita técnica agendada exitosamente en StarMotos!', 'success');
  }, [showToast]);

  // Aprobar cotización de la OT activa
  const approveQuotation = useCallback(() => {
    setIsApproving(true);
    setTimeout(() => {
      setActiveOrder((prev) => ({
        ...prev,
        status: 'en_reparacion',
        steps: buildSteps('en_reparacion'),
        quotation: {
          ...prev.quotation,
          status: 'aprobado',
          approvedAt: 'Hoy (Portal Web Cliente)',
          approvedBy: profile.fullName,
        },
      }));

      setIsApproving(false);
      setIsApprovalModalOpen(false);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1d4ed8', '#dc2626', '#10b981'],
      });

      showToast('¡Presupuesto aprobado con éxito! Tu moto ha ingresado a montaje técnico.', 'success');
    }, 1000);
  }, [profile.fullName, showToast]);

  // Sucursal activa actual
  const activeBranch = useMemo(() => {
    return ALL_BRANCHES.find((b) => b.id === motorcycle.preferredBranchId) || BRANCH_MATRIZ;
  }, [motorcycle.preferredBranchId]);

  return {
    isAuthenticated,
    login,
    logout,
    activeSection,
    setActiveSection,
    isSidebarOpen,
    setIsSidebarOpen,
    profile,
    updateProfile,
    motorcycle,
    updateMotorcycle,
    scheduledMaintenances,
    addScheduledMaintenance,
    activeOrder,
    history,
    warranties,
    branches: ALL_BRANCHES,
    activeBranch,
    isApprovalModalOpen,
    setIsApprovalModalOpen,
    isApproving,
    approveQuotation,
    toastMessage,
    showToast,
  };
}

export type UseCustomerPortalReturn = ReturnType<typeof useCustomerPortal>;
