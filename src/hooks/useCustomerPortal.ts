// src/hooks/useCustomerPortal.ts
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  WorkOrder,
  Quotation,
  Vehicle,
  MaintenanceRecord,
  WarrantyItem,
  WarrantyStatus,
  Branch,
  WorkOrderStatus,
  ProgressStep,
  ClientProfile,
  MotorcycleClientData,
  ScheduledMaintenance,
  TallerClient,
  AlistamientoFullRecord,
  ServiceActionType,
  TallerOrder,
  OrderRating,
  SystemAlert,
  SolicitudAbonoCliente,
} from '../types/customer';
import { ActiveSection } from '../components/SidebarDrawer';
import {
  getStoredClients,
  saveStoredClients,
  getStoredFullAlistamientos,
  saveStoredFullAlistamientos,
  getStoredOrders,
  saveStoredOrders,
  getStoredWarranties,
  getStoredRatings,
  saveStoredRating,
  isOrderRated,
  addStoredAlerts,
} from '../data/mockMultiRoleData';
import { cloudSaveClient, cloudSaveAlistamiento } from '../services/supabaseService';
import { isValidMediaUrl } from '../services/mediaStorage';

// Sucursales Oficiales StarMotos
export const BRANCH_MATRIZ: Branch = {
  id: 'matriz-la-mana',
  name: 'StarMotos Matriz La Maná',
  code: 'MAT-01',
  address: 'Calle Jaime Roldós #1 y Gonzalo Albarracín',
  city: 'La Maná, Cotopaxi',
  province: 'Cotopaxi',
  canton: 'La Maná',
  parroquia: 'La Maná',
  reference: 'Atrás de la Unidad Educativa La Maná, casa color rojo y blanco',
  phone: '0939316698 / 0939317809',
  whatsapp: '593939316698',
  email: 'starsmotor17@gmail.com',
  schedule: 'Lunes a Viernes: 08:00 - 18:00 | Sábados: 08:30 - 14:00',
  googleMapsUrl: 'https://maps.google.com/?q=La+Mana+Cotopaxi+Ecuador',
};

export const BRANCH_QUEVEDO: Branch = {
  id: 'taller-quevedo',
  name: 'StarMotos Sucursal Quevedo',
  code: 'SUC-05',
  address: 'Décima Tercera entre Junior Guzmán y 12 de Octubre',
  city: 'Quevedo, Los Ríos',
  province: 'Los Ríos',
  canton: 'Quevedo',
  reference: 'Ingresa por lubricadora Don Lucho, al lado de Hostal Carmita',
  phone: '0982852456 / 0939316698',
  whatsapp: '593982852456',
  email: 'starsmotor17@gmail.com',
  schedule: 'Lunes a Viernes: 08:00 - 18:00 | Sábados: 08:30 - 13:30',
  googleMapsUrl: 'https://maps.google.com/?q=Quevedo+Ecuador',
};

export const BRANCH_BUENAFE: Branch = {
  id: 'taller-buena-fe',
  name: 'StarMotos Sucursal Buena Fe',
  code: 'SUC-02',
  address: 'Calle Arcadio Fuente S/N y 7 de Agosto',
  city: 'Buena Fe, Los Ríos',
  province: 'Los Ríos',
  canton: 'Buena Fe',
  reference: 'Vía al cementerio de Buena Fe',
  phone: '0939316698',
  whatsapp: '593939316698',
  email: 'starsmotor17@gmail.com',
  schedule: 'Lunes a Viernes: 08:00 - 17:30 | Sábados: 08:30 - 13:00',
  googleMapsUrl: 'https://maps.google.com/?q=Buena+Fe+Los+Rios+Ecuador',
};

export const BRANCH_ELCARMEN: Branch = {
  id: 'taller-el-carmen',
  name: 'StarMotos Sucursal El Carmen',
  code: 'SUC-04',
  address: 'Urb. Barrio Naranjales, Calle Los Limones S/N y Av. Chone',
  city: 'El Carmen, Manabí',
  province: 'Manabí',
  canton: 'El Carmen',
  reference: 'Diagonal al SuperKia',
  phone: '0939316698',
  whatsapp: '593939316698',
  email: 'starsmotor17@gmail.com',
  schedule: 'Lunes a Viernes: 08:00 - 17:30 | Sábados: 08:30 - 13:00',
  googleMapsUrl: 'https://maps.google.com/?q=El+Carmen+Manabi+Ecuador',
};

export const BRANCH_PORTOVIEJO: Branch = {
  id: 'taller-portoviejo',
  name: 'StarMotos Sucursal Portoviejo',
  code: 'SUC-09',
  address: 'Calle Pedro Gual S/N y Primero de Enero',
  city: 'Portoviejo, Manabí',
  province: 'Manabí',
  canton: 'Portoviejo',
  reference: 'Al lado de Almacén El Centinela Rulimán',
  phone: '0939316698',
  whatsapp: '593939316698',
  email: 'starsmotor17@gmail.com',
  schedule: 'Lunes a Viernes: 08:00 - 17:30 | Sábados: 08:30 - 13:00',
  googleMapsUrl: 'https://maps.google.com/?q=Portoviejo+Manabi+Ecuador',
};

export const ALL_BRANCHES = [
  BRANCH_MATRIZ,
  BRANCH_QUEVEDO,
  BRANCH_BUENAFE,
  BRANCH_ELCARMEN,
  BRANCH_PORTOVIEJO,
];

// Perfil base limpio para nuevos clientes
export const DEFAULT_PROFILE: ClientProfile = {
  id: '',
  fullName: 'Cliente StarMotos',
  idNumber: '',
  phone: '',
  email: '',
  address: '',
  city: 'Ecuador',
  emergencyContactName: '',
  emergencyContactPhone: '',
  clientType: 'particular',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
};

// Moto base limpia para nuevos clientes
export const DEFAULT_MOTORCYCLE: MotorcycleClientData = {
  plate: 'EN TRÁMITE',
  brand: 'StarMotos',
  model: 'Motocicleta',
  year: new Date().getFullYear(),
  displacement: '150 cc',
  vin: 'S/N',
  color: 'Negro',
  currentKm: 0,
  lastOilChangeKm: 0,
  oilChangeIntervalKm: 3000,
  preferredOil: 'Katana 20W50',
  dailyUsageKm: 15,
  reportedSymptoms: '',
  preferredPartsQuality: 'originales_oem',
  preferredBranchId: 'matriz-la-mana',
  photoUrl: '',
};

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
  preferredBranchId: 'matriz-la-mana',
  photoUrl: '',
};

const INITIAL_SCHEDULED_MAINTENANCES: ScheduledMaintenance[] = [
  {
    id: 'maint-1',
    serviceTitle: 'Mantenimiento Preventivo 15,000 KM (Aceite + Filtro + Bujías)',
    recommendedKm: 15000,
    recommendedDate: '25 Sep 2026',
    scheduledDate: '25 Sep 2026',
    scheduledTime: '09:00 AM',
    branchName: 'StarMotos Matriz La Maná',
    branchId: 'matriz-la-mana',
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
    branchName: 'StarMotos Matriz La Maná',
    branchId: 'matriz-la-mana',
    status: 'pendiente',
    estimatedCost: 140.0,
    tasks: ['Regulación de Válvulas por Pastillas', 'Cambio Aceite Horquilla Motul Fork Oil', 'Revisión Líquido Refrigerante'],
    notes: 'Programación automática según promedio diario de 25 km.',
  },
];

// Generador de pasos de la OT
const buildSteps = (currentStatus: WorkOrderStatus): ProgressStep[] => {
  // New simplified flow from user request
  const newFlowStatuses: WorkOrderStatus[] = ['inicio', 'en_proceso', 'trabajando', 'listo_para_entregar', 'entregado'];
  const isNewFlow = newFlowStatuses.includes(currentStatus);

  if (isNewFlow) {
    const stepsDef: { id: WorkOrderStatus; label: string; shortLabel: string; desc: string }[] = [
      { id: 'inicio', label: 'Recepción / Inicio', shortLabel: 'Inicio', desc: 'Moto recibida en taller, orden creada.' },
      { id: 'en_proceso', label: 'En Proceso', shortLabel: 'En Proceso', desc: 'Diagnóstico y preparación de repuestos.' },
      { id: 'trabajando', label: 'Trabajando', shortLabel: 'Trabajando', desc: 'Técnico ejecutando los servicios.' },
      { id: 'listo_para_entregar', label: 'Listo para Entregar', shortLabel: 'Listo', desc: 'Servicio terminado, moto lista para retirar.' },
      { id: 'entregado', label: 'Entregado', shortLabel: 'Entregado', desc: 'Entregada al cliente con conformidad.' },
    ];
    const currentIndex = newFlowStatuses.indexOf(currentStatus);
    return stepsDef.map((step, idx) => ({
      id: step.id,
      label: step.label,
      shortLabel: step.shortLabel,
      description: step.desc,
      completed: idx < currentIndex,
      current: idx === currentIndex,
      timestamp: idx <= currentIndex ? 'Actualizado' : undefined,
    }));
  }

  // Legacy flow
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
  alistamientoId: 'als-demo-01',
  serviciosRealizados: ['mantenimiento', 'engrasado'],
  tecnicoResponsable: 'Carlos "Charly" Morales',
  entryTime: '08:30',
  tipoAceite: '10W-40',
  nivelAceite: 'sintetico',
  estadoAceite: 'con_aceite',
  valorServicio: 75.0,
  abono: 40.0,
  saldoPendiente: 35.0,
  metodoPago: 'Efectivo',
  kilometrajeIngreso: 15200,
  proximoMantenimientoKm: 18000,
  observacionesTaller: 'Desgaste pronunciado en piñón de ataque y catalina 525. Pastillas delanteras al 15% de vida útil. Ajuste general y lubricación de cadena y frenos.',
  numeroFactura: '001-002-0004910',
  numeroTicket: 'TCK-2026-0841',
  fotosIngreso: [
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=80',
  ],
  origenIngreso: 'Recepción Taller Matriz',
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

// Lista de secciones válidas en el portal (en orden estricto de usuario)
export const VALID_SECTIONS: ActiveSection[] = [
  'perfil',
  'orden_activa',
  'agendar_cita',
  'eventos',
  'historial',
  // Secciones heredadas para compatibilidad con redirección
  'mi_moto',
  'mantenimientos',
  'garantias',
];

// Obtener sección desde el hash de la URL
const getSectionFromHash = (): ActiveSection => {
  if (typeof window === 'undefined') return 'perfil';
  const cleanHash = window.location.hash.replace(/^#\/?/, '').trim();
  // Redirecciones de módulos retirados hacia sus nuevas ubicaciones
  if (cleanHash === 'mi_moto') return 'perfil';
  if (cleanHash === 'mantenimientos') return 'agendar_cita';
  if (cleanHash === 'garantias') return 'historial';

  if (VALID_SECTIONS.includes(cleanHash as ActiveSection)) {
    return cleanHash as ActiveSection;
  }
  return 'perfil';
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

// Orden vacía para clientes sin OT activa en taller
const EMPTY_WORK_ORDER: WorkOrder = {
  otNumber: '',
  entryDate: '',
  estimatedDelivery: '',
  clientReason: '',
  branch: BRANCH_MATRIZ,
  mechanic: {
    id: '',
    name: '',
    specialty: '',
    avatarUrl: '',
    certifications: [],
  },
  advisor: '',
  status: 'recepcion',
  steps: [],
  supervisorObservations: '',
  diagnosticPhotos: [],
  quotation: {
    quotationNumber: '',
    createdAt: '',
    expiresAt: '',
    status: 'aprobado',
    parts: [],
    services: [],
    subtotalParts: 0,
    subtotalServices: 0,
    subtotal: 0,
    discount: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 0,
    mechanicNotes: '',
  },
};

// Helper functions para detectar placeholders en placas y chasis
export const isPlaceholderPlate = (plate?: string): boolean => {
  if (!plate) return true;
  const clean = plate.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean || clean.length < 4) return true;
  const placeholders = [
    'sinplaca',
    'entramite',
    'entrmite',
    'tramite',
    'pendiente',
    'porasignar',
    'enproceso',
    'ninguna',
    'ninguno',
    'sinnunero',
    'sinnro',
    'sn',
    'sp',
    'null',
    'undefined',
    'pdi',
  ];
  return placeholders.includes(clean);
};

export const isPlaceholderVin = (vin?: string): boolean => {
  if (!vin) return true;
  const clean = vin.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean || clean.length < 8) return true;
  const placeholders = [
    'sinchasis',
    'sinnro',
    'sinnumber',
    'sinnumero',
    'pendiente',
    'porasignar',
    'entramite',
    'enproceso',
    'ninguno',
    'ninguna',
    'sn',
    'sp',
    'null',
    'undefined',
  ];
  return placeholders.includes(clean);
};

// Vinculación estricta entre el cliente y los alistamientos registrados en taller
const isMatchingClientAlistamiento = (
  alistamiento: AlistamientoFullRecord,
  p: ClientProfile,
  m: MotorcycleClientData
): boolean => {
  const norm = (s?: string) => (s || '').trim().toLowerCase();

  const clientCedula = norm(p.idNumber);
  const alistCedula = norm(alistamiento.cedulaRuc);

  // 1. REGLA ESTRICTA DE CÉDULA / RUC:
  // Si ambos registros tienen cédula, DEBEN coincidir exactamente.
  // Si tienen cédulas diferentes, son clientes distintos (NUNCA transferir datos).
  if (clientCedula && alistCedula) {
    return clientCedula === alistCedula;
  }

  // 2. Correo electrónico (si ambos lo registraron válidamente y tienen formato de email)
  const clientEmail = norm(p.email);
  const alistEmail = norm(alistamiento.email);
  if (clientEmail && alistEmail && clientEmail.includes('@') && alistEmail.includes('@')) {
    if (clientEmail === alistEmail) {
      if (alistCedula && clientCedula && alistCedula !== clientCedula) return false;
      return true;
    }
  }

  // 3. Chasis / VIN ÚNICO (solo si NO es placeholder genérico y no entra en conflicto con otra cédula)
  const clientVin = norm(m.vin);
  const alistVin = norm(alistamiento.chasis);
  if (clientVin && alistVin && !isPlaceholderVin(clientVin) && !isPlaceholderVin(alistVin)) {
    if (clientVin === alistVin) {
      if (alistCedula && clientCedula && alistCedula !== clientCedula) return false;
      return true;
    }
  }

  // 4. Placa vehicular ÚNICA (solo si NO es placeholder como 'EN TRÁMITE', 'S/P' y no hay conflicto de cédula)
  const clientPlate = norm(m.plate).replace(/[^a-z0-9]/g, '');
  const alistPlate = norm(alistamiento.placa).replace(/[^a-z0-9]/g, '');
  if (clientPlate && alistPlate && !isPlaceholderPlate(clientPlate) && !isPlaceholderPlate(alistPlate)) {
    if (clientPlate === alistPlate) {
      if (alistCedula && clientCedula && alistCedula !== clientCedula) return false;
      return true;
    }
  }

  return false;
};

const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
  try {
    if (dateStr.includes('-') && dateStr.length === 10) {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch (_) {}
  return dateStr;
};

const formatServiceSummary = (actions: ServiceActionType[] = [], defaultObs?: string): string[] => {
  const labelMap: Record<string, string> = {
    alistamiento_pdi: 'Alistamiento PDI (Inspección Pre-Entrega 360°)',
    engrasado: 'Servicio de Engrasado General y Calibración Dinamométrica',
    mantenimiento: 'Mantenimiento Preventivo Certificado y Puesta a Punto',
  };

  const results: string[] = actions.map((a) => labelMap[a] || a);
  if (results.length === 0) {
    results.push('Servicio Técnico Certificado');
  }
  if (defaultObs && defaultObs.trim()) {
    results.push(defaultObs.trim());
  }
  return results;
};

// Generador de historial específico para el cliente según alistamientos/servicios realizados
const getClientHistory = (p: ClientProfile, m: MotorcycleClientData): MaintenanceRecord[] => {
  const allAlistamientos = getStoredFullAlistamientos();
  const allOrders = getStoredOrders();
  const norm = (s?: string) => (s || '').trim().toLowerCase();

  // Órdenes del cliente
  const clientOrders = allOrders.filter((o) => {
    const cId = norm(p.idNumber);
    const oId = norm(o.clientIdNumber);
    if (cId && oId) return cId === oId;

    const mPlate = norm(m.plate).replace(/[^a-z0-9]/g, '');
    const oPlate = norm(o.plate).replace(/[^a-z0-9]/g, '');
    if (mPlate && oPlate && !isPlaceholderPlate(m.plate) && !isPlaceholderPlate(o.plate) && mPlate === oPlate) return true;

    return false;
  });

  // Alistamientos que corresponden a este cliente
  const clientAlistamientos = allAlistamientos.filter((a) => isMatchingClientAlistamiento(a, p, m));

  // IDs y tickets de órdenes que están actualmente ACTIVAS (no entregadas)
  const activeAlistamientoIds = new Set<string>();
  const activeOtNumbers = new Set<string>();
  clientOrders.forEach((o) => {
    if (o.status !== 'entregado' && o.status !== 'entregada') {
      if (o.alistamientoId) activeAlistamientoIds.add(o.alistamientoId);
      if (o.id) activeAlistamientoIds.add(o.id);
      if (o.otNumber) activeOtNumbers.add(o.otNumber);
    }
  });

  // Alistamientos entregados (excluye los que están activos en taller)
  const matched = clientAlistamientos.filter((a) => {
    if (activeAlistamientoIds.has(a.id)) return false;
    if (a.numeroTicket && activeOtNumbers.has(a.numeroTicket)) return false;
    return true;
  });

  matched.sort(
    (a, b) =>
      new Date(b.fechaServicio || b.createdAt || 0).getTime() -
      new Date(a.fechaServicio || a.createdAt || 0).getTime()
  );

  const result: MaintenanceRecord[] = [];

  if (matched.length > 0) {
    result.push(
      ...matched.map((a) => {
        const parts: string[] = [];
        if (a.tipoAceite) parts.push(a.tipoAceite);
        else if (a.aceite && a.aceite !== 'sin_aceite') parts.push('Lubricante 4T Oficial');
        parts.push('Insumos y Filtros de Taller');

        return {
          id: a.id,
          otNumber: a.numeroTicket || `OT-${a.id.slice(-6).toUpperCase()}`,
          invoiceNumber: a.numeroFactura || `FAC-${a.id.slice(-6).toUpperCase()}`,
          date: formatDisplayDate(a.fechaServicio),
          mileage: a.kilometraje || 0,
          branchName: a.sede || 'StarMotos Red Oficial',
          workSummary: formatServiceSummary(a.serviciosRealizados, a.observaciones),
          partsReplaced: parts,
          totalPaid: Number(a.montoPagado ?? a.valorServicio ?? 0),
          technicianName: a.tecnicoResponsable || 'Técnico Certificado StarMotos',
          totalCost: Number(a.valorServicio || 0),
          saldoPendiente: a.saldoPendiente !== undefined ? Number(a.saldoPendiente) : Math.max(0, Number(a.valorServicio || 0) - Number(a.abono ?? a.montoPagado ?? 0)),
          abono: a.abono !== undefined ? Number(a.abono) : Number(a.montoPagado || 0),
          alistamientoId: a.id,
          solicitudAbonoPendiente: a.solicitudAbonoPendiente,
          fotos: (a.fotos || []).filter(isValidMediaUrl),
        };
      })
    );
  }

  // Also include delivered orders (entregado/entregada) that don't already have an alistamiento record
  const deliveredOrders = allOrders.filter((o) => {
    if (o.status !== 'entregado' && o.status !== 'entregada') return false;
    const norm = (s?: string) => (s || '').trim().toLowerCase();
    const cId = norm(p.idNumber);
    const oId = norm(o.clientIdNumber);
    // Cedula-first: if both have cedula, they MUST match
    if (cId && oId) return cId === oId;
    // Plate fallback only for non-placeholder plates
    const mPlate = norm(m.plate).replace(/[^a-z0-9]/g, '');
    const oPlate = norm(o.plate).replace(/[^a-z0-9]/g, '');
    if (mPlate && oPlate && !isPlaceholderPlate(m.plate) && !isPlaceholderPlate(o.plate) && mPlate === oPlate) return true;
    return false;
  });

  deliveredOrders.forEach((o) => {
    // Skip if already covered by an alistamiento record
    if (o.alistamientoId && result.some((r) => r.id === o.alistamientoId)) return;
    if (result.some((r) => r.otNumber === o.otNumber)) return;

    result.push({
      id: o.id,
      otNumber: o.otNumber,
      invoiceNumber: `FAC-${o.id.slice(-6).toUpperCase()}`,
      date: formatDisplayDate(o.entryDate),
      mileage: 0,
      branchName: o.workshopName || 'StarMotos Red Oficial',
      workSummary: o.servicesSummary ? o.servicesSummary.split(', ') : [`Servicio: ${o.motorcycleInfo}`],
      partsReplaced: ['Insumos de Taller'],
      totalPaid: o.totalCost || 0,
      technicianName: o.mechanicName || 'Técnico StarMotos',
      alistamientoId: o.alistamientoId,
    });
  });

  if (result.length > 0) return result;

  // Fallback para cuenta demo Fernando Vaca si no tiene alistamientos
  if (p.idNumber === '1724890123') {
    return INITIAL_HISTORY;
  }

  return [];
};

// Generador de citas y mantenimientos programados vinculando los realizados en taller
const getClientScheduledMaintenances = (
  p: ClientProfile,
  m: MotorcycleClientData,
  branch: Branch
): ScheduledMaintenance[] => {
  const result: ScheduledMaintenance[] = [];

  // 1. Citas del cliente en localStorage
  try {
    const customKey = `starmotos_scheduled_citas_${p.idNumber || 'default'}`;
    const raw = localStorage.getItem(customKey);
    if (raw) {
      const parsed: ScheduledMaintenance[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        result.push(...parsed);
      }
    }
  } catch (_) {}

  // 2. Mantenimiento sugerido registrado en el último servicio por el taller
  const allAlistamientos = getStoredFullAlistamientos();
  const matched = allAlistamientos.filter((a) => isMatchingClientAlistamiento(a, p, m));
  matched.sort(
    (a, b) =>
      new Date(b.fechaServicio || b.createdAt || 0).getTime() -
      new Date(a.fechaServicio || a.createdAt || 0).getTime()
  );

  matched.forEach((a) => {
    if (a.proximoMantenimientoKm && a.proximoMantenimientoKm > 0) {
      let recDate = 'Fecha flexible sugerida';
      try {
        if (a.fechaServicio) {
          const d = new Date(a.fechaServicio);
          d.setMonth(d.getMonth() + 3);
          recDate = d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      } catch (_) {}

      const maintId = `alist-sugg-${a.id}`;
      if (!result.some((r) => r.id === maintId)) {
        result.push({
          id: maintId,
          serviceTitle: `Próximo Mantenimiento Sugerido por Taller (${a.proximoMantenimientoKm.toLocaleString()} KM)`,
          recommendedKm: a.proximoMantenimientoKm,
          recommendedDate: recDate,
          branchName: a.sede || branch.name,
          branchId: a.sedeId || branch.id,
          status: 'pendiente',
          estimatedCost: a.valorServicio ? Number(a.valorServicio) : 55.0,
          tasks: [
            `Mantenimiento Preventivo a los ${a.proximoMantenimientoKm.toLocaleString()} KM`,
            'Cambio de Aceite de Motor y Filtro',
            'Regulación de Válvulas y Transmisión',
            'Chequeo de Frenos, Neumáticos y Suspensión',
          ],
          notes: a.observaciones
            ? `Recomendación técnica (${a.tecnicoResponsable || 'Taller'}): ${a.observaciones}`
            : `Sugerido por ${a.tecnicoResponsable || 'técnico StarMotos'} en su última visita a ${a.sede || 'taller StarMotos'}.`,
        });
      }
    }
  });

  // 3. Fallback para cuenta demo Fernando Vaca si no tiene citas
  if (result.length === 0 && p.idNumber === '1724890123') {
    return INITIAL_SCHEDULED_MAINTENANCES;
  }

  return result;
};

// Conversor de una orden de taller a WorkOrder completa para el cliente
export const buildWorkOrderFromTallerOrder = (
  matched: TallerOrder,
  p: ClientProfile,
  m: MotorcycleClientData,
  branch: Branch,
  allAlistamientos: AlistamientoFullRecord[]
): WorkOrder => {
  const norm = (s?: string) => (s || '').trim().toLowerCase();
  let matchedAls = matched.alistamientoId
    ? allAlistamientos.find((a) => a.id === matched.alistamientoId)
    : undefined;

  if (!matchedAls) {
    const candidates = allAlistamientos.filter((a) => {
      const aId = norm(a.cedulaRuc);
      const cId = norm(p.idNumber);
      if (aId && cId && aId === cId) return true;
      const aPlate = norm(a.placa).replace(/[^a-z0-9]/g, '');
      const mPlate = norm(m.plate).replace(/[^a-z0-9]/g, '');
      if (aPlate && mPlate && aPlate === mPlate) return true;
      return false;
    });
    matchedAls =
      candidates.find((a) => a.numeroTicket === matched.otNumber || a.id === matched.id) ||
      candidates.find((a) => a.fotos && a.fotos.length > 0) ||
      candidates[candidates.length - 1];
  }

  const orderBranch = ALL_BRANCHES.find((b) => b.id === matched.workshopId) || branch;
  const steps = buildSteps(matched.status || 'inicio');
  const isQuotationPending = matched.status === 'cotizacion_pendiente';

  const techName = matchedAls?.tecnicoResponsable || matched.mechanicName || 'Técnico Especialista Asignado';
  const entryDate = matchedAls?.fechaServicio || matched.entryDate || 'Reciente';
  const entryTime = matchedAls?.horaServicio || '08:30';
  const totalCost = matchedAls?.valorServicio !== undefined ? Number(matchedAls.valorServicio) : (matched.totalCost || 0);
  const abono = matchedAls?.abono !== undefined ? Number(matchedAls.abono) : (matchedAls?.montoPagado !== undefined ? Number(matchedAls.montoPagado) : totalCost);
  const saldoPendiente = matchedAls?.saldoPendiente !== undefined ? Number(matchedAls.saldoPendiente) : Math.max(0, totalCost - abono);

  return {
    otNumber: matched.otNumber,
    entryDate: entryDate,
    entryTime: entryTime,
    estimatedDelivery: matched.estimatedDelivery || 'En coordinación con taller',
    clientReason: matchedAls?.observaciones || matched.servicesSummary || `Servicio técnico para ${matched.motorcycleInfo || `${m.brand} ${m.model}`}.`,
    branch: orderBranch,
    mechanic: {
      id: matchedAls?.tecnicoId || 'mec-assigned',
      name: techName,
      specialty: 'Mecánico Certificado StarMotos',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      certifications: ['Técnico Homologado StarMotos'],
    },
    advisor: matched.workshopName || orderBranch.name,
    status: matched.status || 'inicio',
    steps: steps,
    supervisorObservations: matchedAls?.observaciones || matched.servicesSummary || 'Servicio en proceso según especificaciones técnicas de fábrica.',
    diagnosticPhotos: (matchedAls?.fotos || []).filter(isValidMediaUrl).map((f, i) => ({
      id: `foto-${i}`,
      url: f,
      title: `Inspección de Recepción ${i + 1}`,
      description: 'Estado de recepción de la motocicleta en taller',
      uploadedAt: entryTime,
      stage: 'Recepción',
    })),
    alistamientoId: matchedAls?.id || matched.alistamientoId,
    serviciosRealizados: matchedAls?.serviciosRealizados || [],
    tecnicoResponsable: techName,
    kilometrajeIngreso: matchedAls?.kilometraje !== undefined ? Number(matchedAls.kilometraje) : (m.currentKm || 0),
    proximoMantenimientoKm: matchedAls?.proximoMantenimientoKm || ((matchedAls?.kilometraje || m.currentKm || 0) + 3000),
    tipoAceite: matchedAls?.tipoAceite || '20W-50',
    nivelAceite: matchedAls?.nivelAceite || 'mineral',
    estadoAceite: matchedAls?.aceite || 'con_aceite',
    valorServicio: totalCost,
    abono: abono,
    saldoPendiente: saldoPendiente,
    metodoPago: matchedAls?.metodoPago || 'Efectivo',
    observacionesTaller: matchedAls?.observaciones || matched.servicesSummary || 'Servicio técnico en proceso según especificaciones técnicas de fábrica.',
    numeroFactura: matchedAls?.numeroFactura || '',
    numeroTicket: matchedAls?.numeroTicket || matched.otNumber || '',
    fotosIngreso: (matchedAls?.fotos || []).filter(isValidMediaUrl),
    origenIngreso: matchedAls?.origen || 'Taller StarMotos',
    orderId: matched.id,
    rating: matched.rating,
    quotation: {
      quotationNumber: `COT-${matched.otNumber.replace(/[^0-9]/g, '') || '01'}`,
      createdAt: entryDate,
      expiresAt: '48 horas posteriores',
      status: isQuotationPending ? 'pendiente_aprobacion' : 'aprobado',
      parts: [],
      services: [],
      subtotalParts: 0,
      subtotalServices: totalCost,
      subtotal: totalCost,
      discount: 0,
      taxRate: 0.15,
      taxAmount: 0,
      total: totalCost,
      mechanicNotes: 'Servicio respaldado con garantía oficial de taller StarMotos.',
    },
  };
};

// Generador de todas las órdenes activas en curso para el cliente
export const getClientActiveOrders = (
  p: ClientProfile,
  m: MotorcycleClientData,
  branch: Branch
): WorkOrder[] => {
  const allOrders = getStoredOrders();
  const allAlistamientos = getStoredFullAlistamientos();
  const norm = (s?: string) => (s || '').trim().toLowerCase();

  // 1. Filtrar órdenes que corresponden al cliente
  const clientOrders = allOrders.filter((o) => {
    const cId = norm(p.idNumber);
    const oId = norm(o.clientIdNumber);
    if (cId && oId) return cId === oId;

    const mPlate = norm(m.plate).replace(/[^a-z0-9]/g, '');
    const oPlate = norm(o.plate).replace(/[^a-z0-9]/g, '');
    if (mPlate && oPlate && !isPlaceholderPlate(m.plate) && !isPlaceholderPlate(o.plate) && mPlate === oPlate) return true;

    return false;
  });

  // 2. Órdenes con estado activo (NO entregadas)
  const activeTallerOrders = clientOrders.filter(
    (o) => o.status !== 'entregada' && o.status !== 'entregado'
  );

  // 3. Revisar si hay alistamientos del cliente que no tengan aún TallerOrder registrado
  const clientAlistamientos = allAlistamientos.filter((a) => isMatchingClientAlistamiento(a, p, m));
  const missingAlistamientos = clientAlistamientos.filter((a) => {
    // Si ya existe una orden para este alistamiento, ya fue evaluada en clientOrders
    const matchingOrder = clientOrders.find(
      (o) =>
        (o.alistamientoId && o.alistamientoId === a.id) ||
        o.id === a.id ||
        (o.otNumber && a.numeroTicket && o.otNumber === a.numeroTicket)
    );
    if (matchingOrder) {
      return false;
    }
    // Si no tiene orden, se considera un nuevo alistamiento activo en taller
    return true;
  });

  // Convertir alistamientos faltantes en TallerOrders sintéticas activas
  const synthesizedOrders: TallerOrder[] = missingAlistamientos.map((a) => {
    const otNumber = a.numeroTicket || `OT-${a.id.slice(-6).toUpperCase()}`;
    return {
      id: a.id,
      otNumber,
      clientName: `${a.nombres} ${a.apellidos}`.trim(),
      clientIdNumber: a.cedulaRuc,
      motorcycleInfo: a.modeloMarca,
      plate: a.placa,
      entryDate: a.fechaServicio || new Date().toISOString().split('T')[0],
      status: 'inicio',
      mechanicName: a.tecnicoResponsable || 'Sin asignar',
      estimatedDelivery: '',
      totalCost: a.valorServicio || 0,
      workshopId: a.sedeId || branch.id,
      workshopName: a.sede || branch.name,
      alistamientoId: a.id,
      servicesSummary: (a.serviciosRealizados || []).join(', ') || 'Alistamiento / Mantenimiento',
    };
  });

  const combinedOrders = [...activeTallerOrders, ...synthesizedOrders];

  // Ordenar por fecha más reciente
  combinedOrders.sort((a, b) => {
    const dateA = new Date(a.entryDate || 0).getTime();
    const dateB = new Date(b.entryDate || 0).getTime();
    return dateB - dateA;
  });

  if (combinedOrders.length > 0) {
    return combinedOrders.map((o) =>
      buildWorkOrderFromTallerOrder(o, p, m, branch, allAlistamientos)
    );
  }

  // Fallback demo Fernando Vaca: SOLO si no tiene órdenes creadas en taller
  if (p.idNumber === '1724890123' && clientOrders.length === 0 && clientAlistamientos.length === 0) {
    return [INITIAL_WORK_ORDER];
  }

  return [];
};

// Generador de OT activa para el cliente (compatibilidad hacia atrás)
export const getClientActiveOrder = (
  p: ClientProfile,
  m: MotorcycleClientData,
  branch: Branch
): WorkOrder => {
  const list = getClientActiveOrders(p, m, branch);
  return list[0] || EMPTY_WORK_ORDER;
};

// Generador de orden entregada pendiente de calificar
const getPendingRatingOrder = (p: ClientProfile, m: MotorcycleClientData): TallerOrder | null => {
  const allOrders = getStoredOrders();
  const clientOrders = allOrders.filter((o) => {
    const norm = (s?: string) => (s || '').trim().toLowerCase();
    const cId = norm(p.idNumber);
    const oId = norm(o.clientIdNumber);
    if (cId && oId) return cId === oId;

    const mPlate = norm(m.plate).replace(/[^a-z0-9]/g, '');
    const oPlate = norm(o.plate).replace(/[^a-z0-9]/g, '');
    if (mPlate && oPlate && !isPlaceholderPlate(m.plate) && !isPlaceholderPlate(o.plate) && mPlate === oPlate) return true;

    return false;
  });

  // Buscar orden más reciente entregada que no haya sido calificada
  return (
    clientOrders.find(
      (o) =>
        (o.status === 'entregado' || (o.status as any) === 'entregada') &&
        !o.rating &&
        !isOrderRated(o.id) &&
        !isOrderRated(o.otNumber)
    ) || null
  );
};

// Generador de garantías para el cliente
const getClientWarranties = (p: ClientProfile, m: MotorcycleClientData): WarrantyItem[] => {
  const allWarranties = getStoredWarranties();
  const matched = allWarranties.filter((w) => {
    const norm = (s?: string) => (s || '').trim().toLowerCase();
    const cId = norm(p.idNumber);
    const wId = norm(w.clientIdNumber);
    // Cedula-first: if both have cedula, they MUST match
    if (cId && wId) return cId === wId;

    const mPlate = norm(m.plate).replace(/[^a-z0-9]/g, '');
    const wPlate = norm(w.motorcyclePlate).replace(/[^a-z0-9]/g, '');
    if (mPlate && wPlate && !isPlaceholderPlate(m.plate) && !isPlaceholderPlate(w.motorcyclePlate) && mPlate === wPlate) return true;

    return false;
  });

  if (matched.length > 0) {
    return matched.map((w) => ({
      id: w.id,
      title: `Garantía StarMotos - ${w.partsRequired || w.requestNumber || 'Taller'}`,
      type: 'garantia_fabrica' as const,
      status: (w.status === 'aprobada' ? 'vigente' : w.status === 'rechazada' ? 'vencida' : 'vigente') as WarrantyStatus,
      coverage: w.issueDescription || 'Cobertura de garantía tramitada en sede oficial StarMotos.',
      startDate: formatDisplayDate(w.createdAt || new Date().toISOString()),
      expirationDate: '12 meses posteriores a la entrega',
      kmLimit: 20000,
      currentKm: m.currentKm || 0,
      terms: 'Válida cumpliendo el plan de mantenimientos preventivos en la red oficial StarMotos.',
    }));
  }

  // Fallback demo Fernando Vaca
  if (p.idNumber === '1724890123') {
    return INITIAL_WARRANTIES;
  }

  return [];
};

// Enriquecer la moto del cliente con el kilometraje e información certificada por el taller
const enrichMotorcycleFromAlistamientos = (
  m: MotorcycleClientData,
  p: ClientProfile
): MotorcycleClientData => {
  const allAlistamientos = getStoredFullAlistamientos();
  const matched = allAlistamientos.filter((a) => isMatchingClientAlistamiento(a, p, m));
  matched.sort(
    (a, b) =>
      new Date(b.fechaServicio || b.createdAt || 0).getTime() -
      new Date(a.fechaServicio || a.createdAt || 0).getTime()
  );

  if (matched.length > 0) {
    const latest = matched[0];
    let updatedKm = m.currentKm;
    let updatedLastOil = m.lastOilChangeKm;

    if (latest.kilometraje && latest.kilometraje > updatedKm) {
      updatedKm = latest.kilometraje;
    }

    const hasOil =
      latest.aceite === 'con_aceite' ||
      Boolean(latest.tipoAceite) ||
      latest.serviciosRealizados?.includes('mantenimiento');
    if (hasOil && latest.kilometraje) {
      updatedLastOil = latest.kilometraje;
    }

    return {
      ...m,
      currentKm: updatedKm,
      lastOilChangeKm: updatedLastOil,
      preferredBranchId: latest.sedeId || m.preferredBranchId,
    };
  }

  return m;
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

    // En móvil, si arranca en 'perfil', agregar guard para interceptar el botón atrás
    if (isMobile && initialSection === 'perfil') {
      window.history.pushState({ section: 'perfil', isGuard: true }, '', '#perfil');
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

      // 3. En móvil: si ya estamos en la raíz ('perfil') y el usuario presiona Atrás
      if (isMobile && activeSectionRef.current === 'perfil' && targetFromHash === 'perfil') {
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          // Doble toque dentro de 2 segundos: permitir salida
          showToast('Saliendo de la aplicación...', 'info');
          window.history.go(-2);
        } else {
          // Primer toque: advertir al usuario y re-armar el guard
          lastBackPressRef.current = now;
          showToast('Presione atrás nuevamente para salir', 'info');
          window.history.pushState({ section: 'perfil', isGuard: true }, '', '#perfil');
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
  const [profile, setProfile] = useState<ClientProfile>(() => {
    try {
      const stored = localStorage.getItem('starmotos_current_client_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...INITIAL_PROFILE, ...parsed };
      }
    } catch (_) {}
    return INITIAL_PROFILE;
  });

  const [motorcycle, setMotorcycle] = useState<MotorcycleClientData>(() => {
    let baseMoto = INITIAL_MOTORCYCLE;
    try {
      const stored = localStorage.getItem('starmotos_current_client_moto');
      if (stored) {
        const parsed = JSON.parse(stored);
        baseMoto = { ...INITIAL_MOTORCYCLE, ...parsed };
      }
    } catch (_) {}

    try {
      const storedProfile = localStorage.getItem('starmotos_current_client_profile');
      const p = storedProfile ? JSON.parse(storedProfile) : INITIAL_PROFILE;
      return enrichMotorcycleFromAlistamientos(baseMoto, p);
    } catch (_) {
      return baseMoto;
    }
  });

  // Sucursal activa actual
  const activeBranch = useMemo(() => {
    return ALL_BRANCHES.find((b) => b.id === motorcycle.preferredBranchId) || BRANCH_MATRIZ;
  }, [motorcycle.preferredBranchId]);

  const [scheduledMaintenances, setScheduledMaintenances] = useState<ScheduledMaintenance[]>(() =>
    getClientScheduledMaintenances(profile, motorcycle, activeBranch)
  );

  // Orden de Trabajo, Historial y Garantías vinculadas en tiempo real
  const [activeOrders, setActiveOrders] = useState<WorkOrder[]>(() =>
    getClientActiveOrders(profile, motorcycle, activeBranch)
  );
  const [selectedActiveOrderIndex, setSelectedActiveOrderIndex] = useState<number>(0);

  const activeOrder = useMemo(() => {
    if (activeOrders.length === 0) return EMPTY_WORK_ORDER;
    const safeIdx = Math.min(Math.max(0, selectedActiveOrderIndex), activeOrders.length - 1);
    return activeOrders[safeIdx] || EMPTY_WORK_ORDER;
  }, [activeOrders, selectedActiveOrderIndex]);

  const [history, setHistory] = useState<MaintenanceRecord[]>(() =>
    getClientHistory(profile, motorcycle)
  );
  const [warranties, setWarranties] = useState<WarrantyItem[]>(() =>
    getClientWarranties(profile, motorcycle)
  );

  // Calificación del Servicio Técnico (Orden Entregada)
  const [pendingRatingOrder, setPendingRatingOrder] = useState<TallerOrder | null>(() =>
    getPendingRatingOrder(profile, motorcycle)
  );
  const [isRatingModalOpen, setIsRatingModalOpen] = useState<boolean>(false);
  const hasDismissedRatingModalRef = useRef<boolean>(false);

  // Auto-apertura si hay una orden entregada sin calificar
  useEffect(() => {
    if (pendingRatingOrder && !hasDismissedRatingModalRef.current) {
      const timer = setTimeout(() => {
        setIsRatingModalOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pendingRatingOrder]);

  // Sincronización reactiva en tiempo real al registrar alistamientos, órdenes o garantías
  useEffect(() => {
    const syncAll = () => {
      let curProfile = profile;
      let curMoto = motorcycle;

      try {
        const rawProfile = localStorage.getItem('starmotos_current_client_profile');
        if (rawProfile) {
          curProfile = { ...INITIAL_PROFILE, ...JSON.parse(rawProfile) };
          setProfile(curProfile);
        }
      } catch (_) {}

      try {
        const rawMoto = localStorage.getItem('starmotos_current_client_moto');
        if (rawMoto) {
          curMoto = { ...INITIAL_MOTORCYCLE, ...JSON.parse(rawMoto) };
        }
      } catch (_) {}

      const enrichedMoto = enrichMotorcycleFromAlistamientos(curMoto, curProfile);
      setMotorcycle(enrichedMoto);

      const branch = ALL_BRANCHES.find((b) => b.id === enrichedMoto.preferredBranchId) || BRANCH_MATRIZ;
      setHistory(getClientHistory(curProfile, enrichedMoto));
      setScheduledMaintenances(getClientScheduledMaintenances(curProfile, enrichedMoto, branch));
      const ordersList = getClientActiveOrders(curProfile, enrichedMoto, branch);
      setActiveOrders(ordersList);
      setSelectedActiveOrderIndex((prev) => (prev < ordersList.length ? prev : 0));
      setWarranties(getClientWarranties(curProfile, enrichedMoto));

      const unratedOrder = getPendingRatingOrder(curProfile, enrichedMoto);
      setPendingRatingOrder(unratedOrder);
      if (unratedOrder && !hasDismissedRatingModalRef.current) {
        setIsRatingModalOpen(true);
      }
    };

    window.addEventListener('starmotos_alistamientos_updated', syncAll);
    window.addEventListener('starmotos_orders_updated', syncAll);
    window.addEventListener('starmotos_warranties_updated', syncAll);
    window.addEventListener('starmotos_clients_updated', syncAll);
    window.addEventListener('starmotos_ratings_updated', syncAll);
    window.addEventListener('storage', syncAll);

    return () => {
      window.removeEventListener('starmotos_alistamientos_updated', syncAll);
      window.removeEventListener('starmotos_orders_updated', syncAll);
      window.removeEventListener('starmotos_warranties_updated', syncAll);
      window.removeEventListener('starmotos_clients_updated', syncAll);
      window.removeEventListener('starmotos_ratings_updated', syncAll);
      window.removeEventListener('storage', syncAll);
    };
  }, []);

  // Modales
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  isApprovalModalOpenRef.current = isApprovalModalOpen;
  const [isApproving, setIsApproving] = useState(false);

  // Enviar Calificación de la Orden Entregada
  const submitRating = useCallback(
    (data: { stars: number; comment: string; orderId: string }) => {
      const allOrders = getStoredOrders();
      const target = allOrders.find((o) => o.id === data.orderId || o.otNumber === data.orderId);
      if (!target) return;

      const ratingRecord: OrderRating = {
        id: `rat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        orderId: target.id,
        otNumber: target.otNumber,
        clientIdNumber: target.clientIdNumber,
        clientName: target.clientName,
        motorcycleInfo: target.motorcycleInfo,
        plate: target.plate,
        technicianName: target.mechanicName || 'Técnico Taller',
        workshopId: target.workshopId,
        workshopName: target.workshopName,
        serviceSummary: target.servicesSummary,
        stars: data.stars,
        comment: data.comment,
        createdAt: new Date().toISOString(),
      };

      // 1. Guardar calificación en la orden
      const updated = allOrders.map((o) => (o.id === target.id ? { ...o, rating: ratingRecord } : o));
      saveStoredOrders(updated);

      // 2. Guardar en almacenamiento de calificaciones
      saveStoredRating(ratingRecord);

      // 3. Crear alerta de sistema para taller y admin
      const ratingAlert: SystemAlert = {
        id: `alt-rat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'info',
        targetRole: 'all',
        targetWorkshopId: target.workshopId,
        title: `⭐ Calificación al Técnico ${target.mechanicName} (${data.stars}/5)`,
        message: `${target.clientName} calificó con ${data.stars} estrellas el servicio de la orden ${target.otNumber}. ${data.comment ? `Comentario: "${data.comment}"` : ''}`,
        timestamp: 'Ahora mismo',
        read: false,
        relatedId: target.id,
      };
      addStoredAlerts(ratingAlert);

      // 4. Confetti y Toast
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      showToast('¡Muchas gracias por calificar nuestro servicio técnico!', 'success');

      setIsRatingModalOpen(false);
      setPendingRatingOrder(null);
    },
    [showToast]
  );

  // Login: Al ingresar, recarga datos actualizados del cliente y sincroniza
  const login = useCallback(() => {
    setIsAuthenticated(true);
    localStorage.setItem('starmotos_auth', 'true');

    let curProfile = profile;
    let curMoto = motorcycle;
    try {
      const rawProfile = localStorage.getItem('starmotos_current_client_profile');
      if (rawProfile) {
        curProfile = { ...INITIAL_PROFILE, ...JSON.parse(rawProfile) };
        setProfile(curProfile);
      }
      const rawMoto = localStorage.getItem('starmotos_current_client_moto');
      if (rawMoto) {
        curMoto = { ...INITIAL_MOTORCYCLE, ...JSON.parse(rawMoto) };
      }
    } catch (_) {}

    const enrichedMoto = enrichMotorcycleFromAlistamientos(curMoto, curProfile);
    setMotorcycle(enrichedMoto);

    const branch = ALL_BRANCHES.find((b) => b.id === enrichedMoto.preferredBranchId) || BRANCH_MATRIZ;
    setHistory(getClientHistory(curProfile, enrichedMoto));
    setScheduledMaintenances(getClientScheduledMaintenances(curProfile, enrichedMoto, branch));
    const ordersList = getClientActiveOrders(curProfile, enrichedMoto, branch);
    setActiveOrders(ordersList);
    setSelectedActiveOrderIndex(0);
    setWarranties(getClientWarranties(curProfile, enrichedMoto));

    const target = getSectionFromHash();
    setActiveSection(target, true);
    showToast(`¡Bienvenido al Portal, ${curProfile.fullName.split(' ')[0]}!`, 'success');
  }, [profile, motorcycle, showToast, setActiveSection]);

  // Logout
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem('starmotos_auth');
    setActiveSection('perfil', true);
  }, [setActiveSection]);

  // Actualizar perfil
  const updateProfile = useCallback((updated: ClientProfile) => {
    setProfile(updated);
    try {
      localStorage.setItem('starmotos_current_client_profile', JSON.stringify(updated));
    } catch (_) {}

    try {
      const stored = getStoredClients();
      let matched = false;
      const updatedList: TallerClient[] = stored.map((c) => {
        const matchId = updated.idNumber && c.idNumber && c.idNumber.trim() === updated.idNumber.trim();
        const matchEmail = updated.email && c.email && c.email.trim().toLowerCase() === updated.email.trim().toLowerCase();
        if (matchId || matchEmail) {
          matched = true;
          return {
            ...c,
            fullName: updated.fullName,
            idNumber: updated.idNumber || c.idNumber,
            phone: updated.phone || c.phone,
            email: updated.email || c.email,
            address: updated.address || c.address,
          };
        }
        return c;
      });

      if (!matched) {
        const newClient: TallerClient = {
          id: updated.idNumber || `cli-${Date.now()}`,
          fullName: updated.fullName,
          idNumber: updated.idNumber,
          phone: updated.phone,
          email: updated.email,
          address: updated.address,
          motorcycleBrand: motorcycle.brand || 'StarMotos',
          motorcycleModel: motorcycle.model || 'Scooter / Moto',
          motorcyclePlate: motorcycle.plate || 'SIN PLACA',
          motorcycleVin: motorcycle.vin || '',
          motorcycleMileage: motorcycle.currentKm || 0,
          workshopId: motorcycle.preferredBranchId || 'matriz-la-mana',
          workshopName: activeBranch?.name || 'StarMotos Matriz La Maná',
          lastVisit: new Date().toISOString().split('T')[0],
          totalVisits: 1,
        };
        updatedList.unshift(newClient);
        cloudSaveClient(newClient).catch(() => {});
      } else {
        const found = updatedList.find(
          (c) =>
            (updated.idNumber && c.idNumber === updated.idNumber) ||
            (updated.email && c.email.toLowerCase() === updated.email.toLowerCase())
        );
        if (found) {
          cloudSaveClient(found).catch(() => {});
        }
      }

      saveStoredClients(updatedList);
    } catch (e) {
      console.error('Error syncing client profile to network storage:', e);
    }

    showToast('Tus datos de perfil se han sincronizado con la red de talleres.', 'success');
  }, [motorcycle, activeBranch, showToast]);

  // Actualizar datos técnicos de la moto
  const updateMotorcycle = useCallback((updated: MotorcycleClientData) => {
    setMotorcycle(updated);
    try {
      localStorage.setItem('starmotos_current_client_moto', JSON.stringify(updated));
    } catch (_) {}

    try {
      const stored = getStoredClients();
      const updatedList: TallerClient[] = stored.map((c) => {
        const matchId = profile.idNumber && c.idNumber && c.idNumber.trim() === profile.idNumber.trim();
        const matchEmail = profile.email && c.email && c.email.trim().toLowerCase() === profile.email.trim().toLowerCase();
        if (matchId || matchEmail) {
          const updatedClient: TallerClient = {
            ...c,
            motorcycleBrand: updated.brand || c.motorcycleBrand,
            motorcycleModel: updated.model || c.motorcycleModel,
            motorcyclePlate: updated.plate || c.motorcyclePlate,
            motorcycleVin: updated.vin || c.motorcycleVin,
            motorcycleMileage: updated.currentKm ?? c.motorcycleMileage,
            workshopId: updated.preferredBranchId || c.workshopId,
            color: updated.color || c.color,
            year: updated.year || c.year,
          };
          cloudSaveClient(updatedClient).catch(() => {});
          return updatedClient;
        }
        return c;
      });

      saveStoredClients(updatedList);
    } catch (e) {
      console.error('Error syncing motorcycle data to network storage:', e);
    }

    showToast('Ficha técnica de la moto sincronizada con la red de talleres.', 'success');
  }, [profile, showToast]);

  // Agendar nuevo mantenimiento
  const addScheduledMaintenance = useCallback((maintenance: ScheduledMaintenance) => {
    setScheduledMaintenances((prev) => {
      const updated = [maintenance, ...prev];
      try {
        const customKey = `starmotos_scheduled_citas_${profile.idNumber || 'default'}`;
        const userOnly = updated.filter((m) => !m.id.startsWith('alist-sugg-'));
        localStorage.setItem(customKey, JSON.stringify(userOnly));
      } catch (_) {}
      return updated;
    });
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#1d4ed8', '#dc2626', '#ffffff'],
    });
    showToast('¡Cita técnica agendada exitosamente en StarMotos!', 'success');
  }, [profile.idNumber, showToast]);

  // Aprobar cotización de la OT activa
  const approveQuotation = useCallback(() => {
    setIsApproving(true);
    setTimeout(() => {
      setActiveOrders((prev) => {
        const safeIdx = Math.min(Math.max(0, selectedActiveOrderIndex), prev.length - 1);
        return prev.map((ord, i) =>
          i === safeIdx
            ? {
                ...ord,
                status: 'en_reparacion',
                steps: buildSteps('en_reparacion'),
                quotation: {
                  ...ord.quotation,
                  status: 'aprobado',
                  approvedAt: 'Hoy (Portal Web Cliente)',
                  approvedBy: profile.fullName,
                },
              }
            : ord
        );
      });

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

  // Enviar comprobante de abono mediante transferencia bancaria
  const submitClientAbono = useCallback(
    async (data: {
      alistamientoId?: string;
      monto: number;
      comprobanteUrl: string;
      bancoOrigen?: string;
      numeroComprobante?: string;
      notas?: string;
    }): Promise<boolean> => {
      try {
        const allAls = getStoredFullAlistamientos();
        let targetIndex = -1;

        if (data.alistamientoId) {
          targetIndex = allAls.findIndex((a) => a.id === data.alistamientoId);
        }

        if (targetIndex === -1) {
          // Buscar primero el que tenga saldo pendiente
          targetIndex = allAls.findIndex((a) => {
            if (!isMatchingClientAlistamiento(a, profile, motorcycle)) return false;
            const val = Number(a.valorServicio) || 0;
            const abn = a.abono !== undefined ? Number(a.abono) : (Number(a.montoPagado) || 0);
            const pend = a.saldoPendiente !== undefined ? Number(a.saldoPendiente) : Math.max(0, val - abn);
            return pend > 0;
          });
        }

        if (targetIndex === -1) {
          // Fallback a cualquier alistamiento del cliente
          targetIndex = allAls.findIndex((a) => isMatchingClientAlistamiento(a, profile, motorcycle));
        }

        let target: AlistamientoFullRecord;

        if (targetIndex === -1) {
          // Si no existe ninguno, creamos un registro inicial para asociar el abono y notificar al taller
          target = {
            id: `als-abono-${Date.now()}`,
            atendidoPor: 'Recepción Taller',
            sede: activeBranch.name,
            sedeId: activeBranch.id,
            fechaServicio: new Date().toISOString().split('T')[0],
            horaServicio: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
            nombres: profile.fullName.split(' ')[0] || 'Cliente',
            apellidos: profile.fullName.split(' ').slice(1).join(' ') || 'StarMotos',
            cedulaRuc: profile.idNumber,
            celular1: profile.phone,
            email: profile.email || 'cliente@starmotos.ec',
            direccion: profile.address || 'Ecuador',
            origen: 'Portal de Clientes',
            chasis: motorcycle.vin || 'VIN-PORTAL',
            placa: motorcycle.plate,
            modeloMarca: `${motorcycle.brand} ${motorcycle.model}`,
            tecnicoResponsable: 'Técnico Asignado',
            tecnicoId: 'tech-default',
            kilometraje: motorcycle.currentKm || 0,
            aceite: 'con_aceite',
            numeroFactura: `FAC-${Date.now().toString().slice(-6)}`,
            numeroTicket: `OT-${Date.now().toString().slice(-6)}`,
            valorServicio: Number(data.monto),
            montoPagado: 0,
            abono: 0,
            saldoPendiente: Number(data.monto),
            serviciosRealizados: ['mantenimiento'],
            metodoPago: 'Transferencia',
            proximoMantenimientoKm: (motorcycle.currentKm || 0) + 3000,
            fotos: [],
            observaciones: 'Registro generado automáticamente para abono por transferencia del cliente.',
            createdAt: new Date().toISOString(),
          };
          allAls.unshift(target);
          targetIndex = 0;
        } else {
          target = allAls[targetIndex];
        }

        const nuevaSolicitud: SolicitudAbonoCliente = {
          id: `sol-abn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fechaSolicitud: new Date().toISOString(),
          monto: Number(data.monto),
          comprobanteUrl: data.comprobanteUrl,
          bancoOrigen: data.bancoOrigen,
          numeroComprobante: data.numeroComprobante,
          estado: 'pendiente',
          observacionesCliente: data.notas,
          clienteNombre: profile.fullName,
          clienteCedula: profile.idNumber,
          clienteTelefono: profile.phone,
        };

        const updatedRecord: AlistamientoFullRecord = {
          ...target,
          solicitudAbonoPendiente: nuevaSolicitud,
        };

        allAls[targetIndex] = updatedRecord;
        saveStoredFullAlistamientos(allAls);
        cloudSaveAlistamiento(updatedRecord);

        // Crear alerta de sistema para taller y matriz
        const abonoAlert: SystemAlert = {
          id: `alt-abn-${Date.now()}`,
          type: 'info',
          targetRole: 'all',
          targetWorkshopId: target.sedeId || activeBranch.id,
          title: `💰 Abono por Transferencia ($${data.monto.toFixed(2)}) - ${profile.fullName}`,
          message: `${profile.fullName} envió comprobante de transferencia por $${data.monto.toFixed(2)} (${data.bancoOrigen || 'Banco'}). Requiere revisión y validación.`,
          timestamp: 'Ahora mismo',
          read: false,
          relatedId: target.id,
        };
        addStoredAlerts(abonoAlert);

        window.dispatchEvent(new Event('starmotos_alistamientos_updated'));

        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#8b5cf6', '#10b981', '#3b82f6'],
        });

        showToast('¡Comprobante de abono enviado con éxito! El taller lo revisará enseguida.', 'success');
        return true;
      } catch (err) {
        console.error('Error al registrar abono del cliente:', err);
        showToast('Error al enviar el comprobante de transferencia.', 'info');
        return false;
      }
    },
    [profile, motorcycle, activeBranch, showToast]
  );

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
    activeOrders,
    selectedActiveOrderIndex,
    setSelectedActiveOrderIndex,
    history,
    warranties,
    branches: ALL_BRANCHES,
    activeBranch,
    isApprovalModalOpen,
    setIsApprovalModalOpen,
    isApproving,
    approveQuotation,
    pendingRatingOrder,
    isRatingModalOpen,
    setIsRatingModalOpen,
    submitRating,
    submitClientAbono,
    toastMessage,
    showToast,
  };
}

export type UseCustomerPortalReturn = ReturnType<typeof useCustomerPortal>;
