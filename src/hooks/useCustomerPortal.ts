// src/hooks/useCustomerPortal.ts
import { useState, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  CustomerPortalData,
  WorkOrder,
  Quotation,
  Vehicle,
  Inspection360,
  MaintenanceRecord,
  WarrantyItem,
  Branch,
  WorkOrderStatus,
  ProgressStep,
} from '../types/customer';

// Sucursales StarMotos
export const BRANCH_MATRIZ: Branch = {
  id: 'matriz-quito',
  name: 'StarMotos Matriz Central',
  code: 'MAT-01',
  address: 'Av. 10 de Agosto N31-154 y Mariana de Jesús',
  city: 'Quito, Ecuador',
  phone: '+593 2 254-8900',
  whatsapp: '593998745612',
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
  phone: '+593 2 248-3320',
  whatsapp: '593984123789',
  email: 'norte@starmotos.ec',
  schedule: 'Lunes a Viernes: 08:00 - 17:30 | Sábados: 08:30 - 13:00',
  googleMapsUrl: 'https://maps.google.com/?q=-0.1256,-78.4723',
};

// Generador de pasos de la OT según el estado actual
const buildSteps = (currentStatus: WorkOrderStatus): ProgressStep[] => {
  const stepsDef: { id: WorkOrderStatus; label: string; shortLabel: string; desc: string; time: string }[] = [
    {
      id: 'recepcion',
      label: 'Recepción e Inspección 360°',
      shortLabel: 'Recepción',
      desc: 'Ingreso al sistema, inventario de pertenencias y chequeo visual de carrocería.',
      time: '20 Sep 2026, 08:45 AM',
    },
    {
      id: 'diagnostico',
      label: 'Diagnóstico en Elevador',
      shortLabel: 'Diagnóstico',
      desc: 'Revisión técnica de compresión, sistema eléctrico, kit de transmisión y frenos.',
      time: '20 Sep 2026, 10:15 AM',
    },
    {
      id: 'cotizacion_pendiente',
      label: 'Cotización y Presupuesto',
      shortLabel: 'Cotización',
      desc: 'Emisión de proforma de repuestos originales y mano de obra para autorización del cliente.',
      time: '20 Sep 2026, 11:30 AM',
    },
    {
      id: 'en_reparacion',
      label: 'En Reparación Mecánica',
      shortLabel: 'En Reparación',
      desc: 'Mecánico especializado ejecutando trabajos técnicos y reemplazo de repuestos.',
      time: '20 Sep 2026, 02:20 PM',
    },
    {
      id: 'control_calidad',
      label: 'Control de Calidad & Escáner',
      shortLabel: 'C. Calidad',
      desc: 'Prueba de ruta en banco de rodillos, torque con dinamométrica y reseteo de testigo de servicio.',
      time: 'Estimado: Hoy 04:30 PM',
    },
    {
      id: 'lista_retiro',
      label: 'Lista para Retiro',
      shortLabel: 'Lista para Retiro',
      desc: 'Motocicleta lavada, verificada y lista en bahía de entrega de la sucursal.',
      time: 'Estimado: Hoy 05:45 PM',
    },
    {
      id: 'entregada',
      label: 'Entregada al Propietario',
      shortLabel: 'Entregada',
      desc: 'Firma de conformidad, entrega de repuestos sustituidos y factura electrónica SRI.',
      time: 'Pendiente entrega',
    },
  ];

  const order: WorkOrderStatus[] = [
    'recepcion',
    'diagnostico',
    'cotizacion_pendiente',
    'en_reparacion',
    'control_calidad',
    'lista_retiro',
    'entregada',
  ];

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

// Escenario 1: Benelli TRK 502X - Estado: Cotización Pendiente (Requiere Aprobación)
const SCENARIO_BENELLI: CustomerPortalData = {
  vehicle: {
    plate: 'PBX-8492',
    brand: 'Benelli',
    model: 'TRK 502X ABS Adventure',
    displacement: '500 cc',
    year: 2024,
    color: 'Gris Antracita / Chasis Rojo Racing',
    vin: 'LBBP57008PA049182',
    currentKm: 14850,
    fuelLevel: 'half',
    fuelPercentage: 50,
    photoUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80',
  },
  activeOrder: {
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
    supervisorObservations:
      'Se detectó desgaste pronunciado en el piñón de ataque y catalina del kit de transmisión. Pastillas de freno delanteras al 15% de vida útil. Se recomienda cambio inmediato por seguridad de ruta.',
    diagnosticPhotos: [
      {
        id: 'diag-1',
        url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=900&q=80',
        title: 'Desgaste en Catalina y Cadena 525',
        description: 'Dientes de catalina afilados y estiramiento de cadena fuera de tolerancia de manual.',
        uploadedAt: '10:35 AM',
        stage: 'Diagnóstico Transmisión',
      },
      {
        id: 'diag-2',
        url: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80',
        title: 'Pastillas Delanteras Cerámicas',
        description: 'Espesor residual de 1.2 mm (límite de servicio 1.0 mm). Disco en buen estado sin rebaba.',
        uploadedAt: '10:48 AM',
        stage: 'Inspección Frenos',
      },
      {
        id: 'diag-3',
        url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=900&q=80',
        title: 'Bujías NGK Iridium y Filtro de Aire',
        description: 'Depósitos normales de carbón en electrodo, filtro de aire saturado de partículas.',
        uploadedAt: '11:15 AM',
        stage: 'Afinamiento Motor',
      },
    ],
    quotation: {
      quotationNumber: 'COT-2026-1104',
      createdAt: '20 Sep 2026, 11:20 AM',
      expiresAt: '22 Sep 2026, 18:00 PM',
      status: 'pendiente_aprobacion',
      parts: [
        {
          code: 'REP-BEN-525',
          description: 'Kit de Arrastre Reforzado Regina O-Ring 525 (15T / 44T)',
          brand: 'Regina Chain Italy',
          quantity: 1,
          unitPrice: 115.0,
          subtotal: 115.0,
          warrantyMonths: 12,
        },
        {
          code: 'LUB-MOT-7100',
          description: 'Aceite 100% Sintético Motul 7100 10W-40 4T (3.2 Litros)',
          brand: 'Motul Ester',
          quantity: 3.2,
          unitPrice: 16.5,
          subtotal: 52.8,
          warrantyMonths: 6,
        },
        {
          code: 'FIL-BEN-OEM',
          description: 'Filtro de Aceite Benelli TRK Original OEM',
          brand: 'Benelli Genuine Parts',
          quantity: 1,
          unitPrice: 14.5,
          subtotal: 14.5,
          warrantyMonths: 6,
        },
        {
          code: 'BRK-BREM-02',
          description: 'Juego de Pastillas de Freno Delanteras Sinterizadas',
          brand: 'Brembo Sinter',
          quantity: 2,
          unitPrice: 24.0,
          subtotal: 48.0,
          warrantyMonths: 6,
        },
      ],
      services: [
        {
          code: 'SRV-MAN-15K',
          description: 'Servicio Mayor 15,000 km (Regulación válvulas, sincronización vacuómetro, apriete)',
          hours: 2.5,
          unitCost: 35.0,
          subtotal: 35.0,
        },
        {
          code: 'SRV-KIT-INS',
          description: 'Mano de obra desmontaje y montaje de kit de transmisión y calibración de eje',
          hours: 1.0,
          unitCost: 20.0,
          subtotal: 20.0,
        },
      ],
      subtotalParts: 230.3,
      subtotalServices: 55.0,
      subtotal: 285.3,
      discount: 25.3, // Descuento de fidelidad cliente
      taxRate: 0.15,  // SRI Ecuador 15%
      taxAmount: 39.0, // (285.3 - 25.3) * 0.15 = 260.0 * 0.15 = 39.00
      total: 299.0,
      mechanicNotes:
        'Todos los repuestos son 100% originales o de grado superior con garantía StarMotos. Al autorizar antes de las 13:00, su moto ingresa a montaje prioritario para entrega mañana.',
    },
  },
  inspection: {
    receptionDate: '20 Sep 2026, 08:30 AM',
    advisorName: 'Mateo Enríquez',
    advisorGeneralNotes:
      'Vehículo ingresa encendiendo al toque. Se entrega con maletas laterales originales instaladas. Llave original + copia de seguridad en recepción.',
    fuelLevelAtCheckin: 'half',
    kmAtCheckin: 14850,
    helmetReceived: false,
    documentsReceived: true,
    toolsReceived: true,
    photos: {
      frontal: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
      lateralIzq: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
      lateralDer: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
      trasera: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=800&q=80',
      tablero: 'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?auto=format&fit=crop&w=800&q=80',
    },
    damages: [
      {
        id: 'dam-1',
        zone: 'Defensa Baja Lateral Izquierda',
        damageType: 'Rayón por apoyo en garaje',
        severity: 'leve',
        advisorNotes: 'Raspones superficiales en tubo de protección metálico, sin deformación.',
      },
      {
        id: 'dam-2',
        zone: 'Cúpula Parabrisas',
        damageType: 'Microrayaduras por lavado previo',
        severity: 'leve',
        advisorNotes: 'Desgaste cosmético común, no afecta visibilidad.',
      },
      {
        id: 'dam-3',
        zone: 'Llanta Delantera Metzeler Tourance',
        damageType: 'Desgaste regular 40% remanente',
        severity: 'moderado',
        advisorNotes: 'Presión calibrada a 32 PSI en recepción.',
      },
    ],
    signature: {
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100"><path d="M 20 60 Q 60 10 110 50 T 180 40 T 260 70 M 70 45 L 240 45" stroke="%23f97316" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
      clientName: 'Fernando David Paredes Zambrano',
      identificationId: '1724890123',
      timestamp: '20 Sep 2026, 08:38:14 ECT',
      ipAddress: '190.152.88.42 (Sucursal Matriz)',
    },
  },
  history: [
    {
      id: 'hist-1',
      otNumber: 'OT-2026-0310',
      invoiceNumber: 'FAC-001-002-0004910',
      date: '15 Mar 2026',
      mileage: 10200,
      branchName: 'StarMotos Matriz Central',
      workSummary: ['Cambio de Aceite Motul 7100', 'Filtro de Aceite OEM', 'Lavado Técnico de Motor y Cadena'],
      partsReplaced: ['Aceite 10W-40 (3.2 L)', 'Filtro Aceite Benelli'],
      totalPaid: 92.5,
      technicianName: 'Carlos Morales',
    },
    {
      id: 'hist-2',
      otNumber: 'OT-2025-0894',
      invoiceNumber: 'FAC-001-002-0003180',
      date: '02 Oct 2025',
      mileage: 5100,
      branchName: 'StarMotos Taller Express Norte',
      workSummary: ['Primer Mantenimiento Post-Rodaje', 'Revisión y torque de culata', 'Reemplazo bujías'],
      partsReplaced: ['Bujías NGK CR8E', 'Aceite Motul 5100 15W-50'],
      totalPaid: 78.0,
      technicianName: 'Andrés Viteri',
    },
    {
      id: 'hist-3',
      otNumber: 'OT-2025-0105',
      invoiceNumber: 'FAC-001-002-0001850',
      date: '12 Feb 2025',
      mileage: 1000,
      branchName: 'StarMotos Matriz Central',
      workSummary: ['Revisión Inicial de Garantía de Fábrica', 'Ajuste de embrague y frenos'],
      partsReplaced: ['Aceite Mineral Mineral 10W-40', 'Filtro aceite'],
      totalPaid: 45.0,
      technicianName: 'Carlos Morales',
    },
  ],
  warranties: [
    {
      id: 'war-1',
      title: 'Garantía Oficial de Motor y Caja',
      type: 'garantia_fabrica',
      status: 'vigente',
      coverage: 'Componentes internos de motor, transmisión y sistema EFI',
      startDate: '12 Feb 2025',
      expirationDate: '12 Feb 2027',
      kmLimit: 30000,
      currentKm: 14850,
      terms: 'Válida al realizar todos los mantenimientos programados en la red oficial StarMotos.',
    },
    {
      id: 'war-2',
      title: 'Pastillas de Freno Brembo Sinter',
      type: 'repuesto',
      status: 'vigente',
      coverage: 'Defectos de fabricación, desprendimiento de material de fricción',
      startDate: '20 Sep 2026',
      expirationDate: '20 Mar 2027',
      kmLimit: 10000,
      currentKm: 14850,
      terms: 'Cubre cambio sin costo ante cristalización anómala o fisura.',
    },
    {
      id: 'war-3',
      title: 'Kit de Arrastre Regina Reforzado',
      type: 'repuesto',
      status: 'vigente',
      coverage: 'Rotura prematura de eslabones y orings',
      startDate: '20 Sep 2026',
      expirationDate: '20 Sep 2027',
      kmLimit: 15000,
      currentKm: 14850,
      terms: 'Requiere lubricación periódica cada 500 km.',
    },
  ],
};

// Escenario 2: Yamaha MT-03 - Estado: En Reparación
const SCENARIO_YAMAHA: CustomerPortalData = {
  ...SCENARIO_BENELLI,
  vehicle: {
    plate: 'PCM-3921',
    brand: 'Yamaha',
    model: 'MT-03 ABS Dark Lightning',
    displacement: '321 cc',
    year: 2025,
    color: 'Cyan Storm / Negro Metalizado',
    vin: 'JYARN6532PA981023',
    currentKm: 8920,
    fuelLevel: 'three_quarters',
    fuelPercentage: 75,
    photoUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80',
  },
  activeOrder: {
    ...SCENARIO_BENELLI.activeOrder,
    otNumber: 'OT-2026-0792',
    entryDate: '19 Sep 2026, 14:15 PM',
    estimatedDelivery: 'Hoy, 18:30 PM',
    clientReason: 'Reemplazo de discos de embrague y cambio de líquido de frenos DOT 5.1.',
    branch: BRANCH_NORTE,
    status: 'en_reparacion',
    steps: buildSteps('en_reparacion'),
    quotation: {
      ...SCENARIO_BENELLI.activeOrder.quotation,
      quotationNumber: 'COT-2026-1055',
      status: 'aprobado',
      approvedAt: '20 Sep 2026, 09:12 AM',
      approvedBy: 'Propietario (Validación Móvil OTP)',
    },
  },
};

// Escenario 3: Honda CB190R - Estado: Lista para Retiro
const SCENARIO_HONDA: CustomerPortalData = {
  ...SCENARIO_BENELLI,
  vehicle: {
    plate: 'IC-459K',
    brand: 'Honda',
    model: 'CB190R Repsol Edition',
    displacement: '184 cc',
    year: 2023,
    color: 'Naranja Repsol / Blanco / Rojo',
    vin: '3HGBM49S1NM008412',
    currentKm: 22400,
    fuelLevel: 'full',
    fuelPercentage: 100,
    photoUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80',
  },
  activeOrder: {
    ...SCENARIO_BENELLI.activeOrder,
    otNumber: 'OT-2026-0650',
    entryDate: '19 Sep 2026, 09:00 AM',
    estimatedDelivery: '¡LISTA AHORA MISMO!',
    clientReason: 'Calibración de inyección PGM-FI, cambio de aceite y batería nueva.',
    branch: BRANCH_MATRIZ,
    status: 'lista_retiro',
    steps: buildSteps('lista_retiro'),
    pickupReadyNotice: 'Tu moto ha superado el control de calidad al 100%, fue lavada y te espera en Bahía 1 de Matriz Central.',
    quotation: {
      ...SCENARIO_BENELLI.activeOrder.quotation,
      quotationNumber: 'COT-2026-0980',
      status: 'aprobado',
      approvedAt: '19 Sep 2026, 10:45 AM',
      approvedBy: 'Propietario vía Portal Web',
    },
  },
};

export type ActiveTab = 'orden' | 'inspeccion' | 'historial' | 'garantias';
export type ScenarioKey = 'benelli_cotizacion' | 'yamaha_en_reparacion' | 'honda_lista_retiro';

export function useCustomerPortal() {
  const [currentScenarioKey, setCurrentScenarioKey] = useState<ScenarioKey>('benelli_cotizacion');
  const [activeTab, setActiveTab] = useState<ActiveTab>('orden');
  const [portalData, setPortalData] = useState<CustomerPortalData>(SCENARIO_BENELLI);
  const [isApproving, setIsApproving] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<{ url: string; title: string; subtitle?: string } | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Notificación tipo Toast
  const showToast = useCallback((text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Cambiar escenario para demostración interactiva
  const changeScenario = useCallback((key: ScenarioKey) => {
    setCurrentScenarioKey(key);
    if (key === 'benelli_cotizacion') {
      setPortalData(SCENARIO_BENELLI);
    } else if (key === 'yamaha_en_reparacion') {
      setPortalData(SCENARIO_YAMAHA);
    } else if (key === 'honda_lista_retiro') {
      setPortalData(SCENARIO_HONDA);
    }
  }, []);

  // Aprobar cotización en tiempo real
  const approveQuotation = useCallback(() => {
    setIsApproving(true);

    setTimeout(() => {
      setPortalData((prev) => {
        const updatedSteps = buildSteps('en_reparacion');
        const nowFormatted = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

        return {
          ...prev,
          activeOrder: {
            ...prev.activeOrder,
            status: 'en_reparacion',
            steps: updatedSteps,
            quotation: {
              ...prev.activeOrder.quotation,
              status: 'aprobado',
              approvedAt: `Hoy, ${nowFormatted} (Portal Web Cliente)`,
              approvedBy: prev.inspection.signature.clientName,
            },
          },
        };
      });

      setIsApproving(false);
      setIsApprovalModalOpen(false);

      // Disparar confetti festivo
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#10b981', '#ffffff'],
      });

      showToast('¡Presupuesto aprobado con éxito! Tu motocicleta ha ingresado a montaje mecánico inmediato.', 'success');
    }, 1200);
  }, [showToast]);

  // Generador de enlace a WhatsApp con mensaje automático
  const getWhatsAppLink = useCallback(
    (context: 'general' | 'cotizacion' | 'retiro' = 'general') => {
      const { vehicle, activeOrder } = portalData;
      let text = '';

      if (context === 'cotizacion') {
        text = `Hola StarMotos ${activeOrder.branch.name}, soy ${portalData.inspection.signature.clientName}. Tengo una consulta sobre la cotización ${activeOrder.quotation.quotationNumber} de mi ${vehicle.brand} ${vehicle.model} (Placa: ${vehicle.plate}) en la OT #${activeOrder.otNumber}.`;
      } else if (context === 'retiro') {
        text = `Hola StarMotos ${activeOrder.branch.name}, vi que mi moto ${vehicle.brand} ${vehicle.model} (Placa: ${vehicle.plate}, OT #${activeOrder.otNumber}) ya está lista para retiro. Voy en camino.`;
      } else {
        text = `Hola StarMotos ${activeOrder.branch.name}, solicito información del avance de mi moto ${vehicle.brand} ${vehicle.model} (Placa: ${vehicle.plate}, OT #${activeOrder.otNumber}).`;
      }

      return `https://wa.me/${activeOrder.branch.whatsapp}?text=${encodeURIComponent(text)}`;
    },
    [portalData]
  );

  // Apertura de modal de fotos
  const openPhotoModal = useCallback((url: string, title: string, subtitle?: string) => {
    setActivePhotoModal({ url, title, subtitle });
  }, []);

  const closePhotoModal = useCallback(() => {
    setActivePhotoModal(null);
  }, []);

  // Simulación de descarga de proforma PDF
  const handleDownloadProforma = useCallback(() => {
    window.print();
  }, []);

  // Cálculo de resumen de cotización
  const quotationSummary = useMemo(() => {
    return portalData.activeOrder.quotation;
  }, [portalData.activeOrder.quotation]);

  return {
    portalData,
    activeTab,
    setActiveTab,
    currentScenarioKey,
    changeScenario,
    isApproving,
    isApprovalModalOpen,
    setIsApprovalModalOpen,
    approveQuotation,
    activePhotoModal,
    openPhotoModal,
    closePhotoModal,
    getWhatsAppLink,
    handleDownloadProforma,
    toastMessage,
    showToast,
    quotationSummary,
  };
}

export type UseCustomerPortalReturn = ReturnType<typeof useCustomerPortal>;
