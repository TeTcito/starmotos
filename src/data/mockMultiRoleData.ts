// src/data/mockMultiRoleData.ts
import {
  Workshop,
  WarrantyRequest,
  SystemAlert,
  AdminInvoice,
  InventoryItem,
  TallerClient,
  TallerOrder,
  GaranteProfile,
} from '../types/customer';

// --- Talleres Iniciales ---
export const INITIAL_WORKSHOPS: Workshop[] = [
  {
    id: 'matriz-quito',
    name: 'StarMotos Matriz Central',
    code: 'MAT-01',
    address: 'Av. 10 de Agosto N31-154 y Mariana de Jesús',
    city: 'Quito, Pichincha',
    phone: '+593 93 931 6698',
    manager: 'Ing. Mateo Enríquez',
    status: 'operativo',
    activeOrders: 8,
    completedToday: 5,
    pendingWarranties: 2,
    mechanics: 6,
  },
  {
    id: 'taller-norte',
    name: 'StarMotos Express Norte',
    code: 'NOR-02',
    address: 'Av. Galo Plaza Lasso N64-89 y De los Pinos',
    city: 'Quito Norte, Pichincha',
    phone: '+593 99 234 5678',
    manager: 'Téc. David Carrera',
    status: 'operativo',
    activeOrders: 4,
    completedToday: 3,
    pendingWarranties: 1,
    mechanics: 3,
  },
  {
    id: 'taller-cumbaya',
    name: 'StarMotos Valle de Cumbayá',
    code: 'VLL-03',
    address: 'Av. Interoceánica km 12 y Pampite',
    city: 'Cumbayá, Pichincha',
    phone: '+593 98 765 4321',
    manager: 'Ing. Roberto Almeida',
    status: 'operativo',
    activeOrders: 6,
    completedToday: 4,
    pendingWarranties: 0,
    mechanics: 4,
  },
  {
    id: 'taller-sur',
    name: 'StarMotos Taller Sur',
    code: 'SUR-04',
    address: 'Av. Pedro Vicente Maldonado y El Beaterio',
    city: 'Quito Sur, Pichincha',
    phone: '+593 97 123 9876',
    manager: 'Téc. Andrés Guano',
    status: 'mantenimiento',
    activeOrders: 1,
    completedToday: 2,
    pendingWarranties: 1,
    mechanics: 2,
  },
];

// --- Solicitudes de Garantía Iniciales (En los distintos estados de la máquina de estados) ---
export const INITIAL_WARRANTY_REQUESTS: WarrantyRequest[] = [
  {
    id: 'gar-001',
    requestNumber: 'GAR-2026-0042',
    createdAt: '21 Sep 2026, 09:30 AM',
    clientName: 'Fernando Vaca',
    clientIdNumber: '1724890123',
    motorcycleBrand: 'Benelli',
    motorcycleModel: 'TRK 502X ABS',
    motorcyclePlate: 'PBX-8492',
    motorcycleVin: 'LBBP57008PA049182',
    warrantyType: 'marca',
    issueDescription: 'Fallo en sensor de presión de aceite y ligera fuga en retenedor de barra delantera izquierda con solo 14,850 km.',
    diagnosticPhotos: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'enviada_matriz',
    tallerOrigin: 'StarMotos Express Norte',
    tallerOriginId: 'taller-norte',
    estimatedCost: 185.0,
    invoiceNumber: 'FAC-002-001-0003421',
  },
  {
    id: 'gar-002',
    requestNumber: 'GAR-2026-0041',
    createdAt: '20 Sep 2026, 14:15 PM',
    clientName: 'Esteban Paredes Moreno',
    clientIdNumber: '1718903452',
    motorcycleBrand: 'CFMOTO',
    motorcycleModel: '450MT Adventure',
    motorcyclePlate: 'PCW-9021',
    motorcycleVin: 'LC6PC8901PA112390',
    warrantyType: 'marca',
    issueDescription: 'Pantalla TFT TFT parpadea en frío y pierde sincronización Bluetooth con switch encendido.',
    diagnosticPhotos: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'enviada_garante',
    tallerOrigin: 'StarMotos Matriz Central',
    tallerOriginId: 'matriz-quito',
    matrizNotes: 'Validado por Ing. Enríquez. Diagnóstico electrónico confirma código de error CAN-Bus B102. Aplica garantía de fábrica.',
    estimatedCost: 320.0,
    invoiceNumber: 'FAC-001-002-0008891',
  },
  {
    id: 'gar-003',
    requestNumber: 'GAR-2026-0040',
    createdAt: '19 Sep 2026, 11:00 AM',
    clientName: 'Lucía Santillán Mora',
    clientIdNumber: '1715678901',
    motorcycleBrand: 'Royal Enfield',
    motorcycleModel: 'Himalayan 450 Sherpa',
    motorcyclePlate: 'PDJ-4431',
    motorcycleVin: 'ME3HIM450PA778812',
    warrantyType: 'plus_taller',
    issueDescription: 'Juego excesivo en rodamiento de dirección y ajuste de kit de pernos reforzado StarMotos Plus.',
    diagnosticPhotos: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'aprobada',
    tallerOrigin: 'StarMotos Valle de Cumbayá',
    tallerOriginId: 'taller-cumbaya',
    matrizNotes: 'Cubierto al 100% por Póliza Garantía Plus StarMotos.',
    garanteNotes: 'Aprobación autorizada por Gerencia de Garantías Benelli/CFMOTO Ecuador.',
    approvedAt: '20 Sep 2026, 16:30 PM',
    estimatedCost: 95.0,
    invoiceNumber: 'FAC-003-001-0001209',
  },
  {
    id: 'gar-004',
    requestNumber: 'GAR-2026-0039',
    createdAt: '18 Sep 2026, 16:45 PM',
    clientName: 'Jorge Vinicio Caicedo',
    clientIdNumber: '0923456781',
    motorcycleBrand: 'Bajaj',
    motorcycleModel: 'Dominar 400 UG',
    motorcyclePlate: 'GLR-7721',
    motorcycleVin: 'MD2DOMIN4PA456711',
    warrantyType: 'gps',
    issueDescription: 'Dispositivo GPS Satelital StarMotos con batería de respaldo degradada y pérdida de señal en túneles prolongados.',
    diagnosticPhotos: [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'completada',
    tallerOrigin: 'StarMotos Matriz Central',
    tallerOriginId: 'matriz-quito',
    matrizNotes: 'Módulo GPS reemplazado con unidad 4G LTE homologada Arcotel.',
    garanteNotes: 'Proveedor Satelital autorizó recambio inmediato.',
    approvedAt: '19 Sep 2026, 10:00 AM',
    estimatedCost: 120.0,
    invoiceNumber: 'FAC-001-002-0008740',
  },
  {
    id: 'gar-005',
    requestNumber: 'GAR-2026-0038',
    createdAt: '17 Sep 2026, 10:20 AM',
    clientName: 'Diego Sebastián Viteri',
    clientIdNumber: '1709845123',
    motorcycleBrand: 'KTM',
    motorcycleModel: '390 Adventure',
    motorcyclePlate: 'PDI-1190',
    motorcycleVin: 'VBK390ADVPA889921',
    warrantyType: 'marca',
    issueDescription: 'Reclamo por desgaste de pastillas a los 3,000 km tras caída en off-road.',
    diagnosticPhotos: [
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'rechazada',
    tallerOrigin: 'StarMotos Express Norte',
    tallerOriginId: 'taller-norte',
    matrizNotes: 'Elevado al garante con informe de inspección técnica.',
    garanteNotes: 'Rechazado: El daño obedece a impacto físico y contaminación externa con lodo/arena, no defecto de fábrica.',
    rejectedAt: '18 Sep 2026, 14:00 PM',
    rejectionReason: 'Uso indebido fuera de especificación y daño por impacto externo.',
    estimatedCost: 75.0,
  },
];

// --- Alertas del Sistema ---
export const INITIAL_ALERTS: SystemAlert[] = [
  {
    id: 'alt-01',
    type: 'orden_creada',
    title: 'Nueva Orden de Alistamiento',
    message: 'Se ha registrado el alistamiento de la moto Benelli TRK 502X (PBX-8492) en Matriz.',
    timestamp: 'Hace 15 minutos',
    read: false,
    relatedId: 'OT-2026-0841',
  },
  {
    id: 'alt-02',
    type: 'garantia_aprobada',
    title: 'Garantía Aprobada por Garante',
    message: 'El Garante oficial Benelli aprobó la solicitud GAR-2026-0040 por $95.00 USD.',
    timestamp: 'Hace 1 hora',
    read: false,
    relatedId: 'GAR-2026-0040',
  },
  {
    id: 'alt-03',
    type: 'estado_cambiado',
    title: 'Taller Norte Operatividad',
    message: 'Taller Express Norte completó 3 mantenimientos preventivos hoy.',
    timestamp: 'Hace 3 horas',
    read: true,
  },
  {
    id: 'alt-04',
    type: 'factura_emitida',
    title: 'Factura SRI Autorizada',
    message: 'Comprobante FAC-001-002-0008891 emitido con éxito al SRI (Clave de acceso generada).',
    timestamp: 'Ayer, 18:30 PM',
    read: true,
  },
];

// --- Facturas Administrador SRI ---
export const INITIAL_INVOICES: AdminInvoice[] = [
  {
    id: 'inv-101',
    invoiceNumber: '001-002-0008891',
    clientName: 'Fernando Vaca',
    clientIdNumber: '1724890123',
    date: '20 Sep 2026',
    subtotal: 260.0,
    iva: 39.0,
    total: 299.0,
    status: 'emitida',
    workshopName: 'StarMotos Matriz Central',
  },
  {
    id: 'inv-102',
    invoiceNumber: '001-002-0008890',
    clientName: 'Esteban Paredes Moreno',
    clientIdNumber: '1718903452',
    date: '20 Sep 2026',
    subtotal: 120.0,
    iva: 18.0,
    total: 138.0,
    status: 'emitida',
    workshopName: 'StarMotos Matriz Central',
  },
  {
    id: 'inv-103',
    invoiceNumber: '002-001-0003421',
    clientName: 'Camila Torres Vega',
    clientIdNumber: '1723456789',
    date: '19 Sep 2026',
    subtotal: 85.0,
    iva: 12.75,
    total: 97.75,
    status: 'emitida',
    workshopName: 'StarMotos Express Norte',
  },
  {
    id: 'inv-104',
    invoiceNumber: '003-001-0001209',
    clientName: 'Lucía Santillán Mora',
    clientIdNumber: '1715678901',
    date: '19 Sep 2026',
    subtotal: 145.0,
    iva: 21.75,
    total: 166.75,
    status: 'emitida',
    workshopName: 'StarMotos Valle de Cumbayá',
  },
  {
    id: 'inv-105',
    invoiceNumber: '001-002-0008889',
    clientName: 'Transportes Rápidos Pichincha Cía. Ltda.',
    clientIdNumber: '1792345678001',
    date: '18 Sep 2026',
    subtotal: 450.0,
    iva: 67.5,
    total: 517.5,
    status: 'emitida',
    workshopName: 'StarMotos Matriz Central',
  },
];

// --- Inventario Taller ---
export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-01',
    code: 'LUB-MOT-7100',
    name: 'Aceite Sintético Motul 7100 10W-40 4T (1L)',
    brand: 'Motul',
    category: 'Lubricantes',
    stock: 48,
    minStock: 15,
    unitPrice: 16.5,
    lastRestocked: '18 Sep 2026',
  },
  {
    id: 'inv-02',
    code: 'LUB-MOT-5100',
    name: 'Aceite Semi-Sintético Motul 5100 15W-50 4T',
    brand: 'Motul',
    category: 'Lubricantes',
    stock: 32,
    minStock: 12,
    unitPrice: 13.0,
    lastRestocked: '15 Sep 2026',
  },
  {
    id: 'inv-03',
    code: 'FIL-BEN-OEM',
    name: 'Filtro de Aceite Benelli TRK 502 / Leoncino',
    brand: 'Benelli OEM',
    category: 'Filtros',
    stock: 14,
    minStock: 8,
    unitPrice: 14.5,
    lastRestocked: '20 Sep 2026',
  },
  {
    id: 'inv-04',
    code: 'BRK-BREM-02',
    name: 'Juego Pastillas Delanteras Sinterizadas Benelli',
    brand: 'Brembo',
    category: 'Frenos',
    stock: 6,
    minStock: 10,
    unitPrice: 24.0,
    lastRestocked: '10 Sep 2026',
  },
  {
    id: 'inv-05',
    code: 'REP-REG-525',
    name: 'Cadena Reforzada Regina O-Ring 525 120 Eslabones',
    brand: 'Regina Italy',
    category: 'Transmisión',
    stock: 8,
    minStock: 5,
    unitPrice: 85.0,
    lastRestocked: '12 Sep 2026',
  },
  {
    id: 'inv-06',
    code: 'GPS-STAR-4G',
    name: 'Dispositivo GPS Satelital StarMotos 4G LTE',
    brand: 'StarMotos GPS',
    category: 'Electrónica',
    stock: 18,
    minStock: 6,
    unitPrice: 95.0,
    lastRestocked: '21 Sep 2026',
  },
];

// --- Clientes del Taller ---
export const INITIAL_TALLER_CLIENTS: TallerClient[] = [
  {
    id: 'tc-01',
    fullName: 'Fernando Vaca',
    idNumber: '1724890123',
    phone: '+593 99 874 5612',
    email: 'cliente@starmotos.ec',
    motorcycleBrand: 'Benelli',
    motorcycleModel: 'TRK 502X ABS',
    motorcyclePlate: 'PBX-8492',
    lastVisit: '20 Sep 2026',
    totalVisits: 4,
  },
  {
    id: 'tc-02',
    fullName: 'Esteban Paredes Moreno',
    idNumber: '1718903452',
    phone: '+593 98 443 2190',
    email: 'eparedes@gmail.com',
    motorcycleBrand: 'CFMOTO',
    motorcycleModel: '450MT Adventure',
    motorcyclePlate: 'PCW-9021',
    lastVisit: '20 Sep 2026',
    totalVisits: 2,
  },
  {
    id: 'tc-03',
    fullName: 'Camila Torres Vega',
    idNumber: '1723456789',
    phone: '+593 99 112 3344',
    email: 'ctorres@hotmail.com',
    motorcycleBrand: 'Yamaha',
    motorcycleModel: 'MT-03 ABS',
    motorcyclePlate: 'IC-451K',
    lastVisit: '19 Sep 2026',
    totalVisits: 5,
  },
  {
    id: 'tc-04',
    fullName: 'Jorge Vinicio Caicedo',
    idNumber: '0923456781',
    phone: '+593 97 998 8776',
    email: 'jorge.caicedo@ecuaexpress.com',
    motorcycleBrand: 'Bajaj',
    motorcycleModel: 'Dominar 400 UG',
    motorcyclePlate: 'GLR-7721',
    lastVisit: '18 Sep 2026',
    totalVisits: 7,
  },
];

// --- Órdenes de Taller Activas ---
export const INITIAL_TALLER_ORDERS: TallerOrder[] = [
  {
    id: 'ord-01',
    otNumber: 'OT-2026-0841',
    clientName: 'Fernando Vaca',
    clientIdNumber: '1724890123',
    motorcycleInfo: 'Benelli TRK 502X ABS 2024',
    plate: 'PBX-8492',
    entryDate: '20 Sep 2026, 08:30 AM',
    status: 'cotizacion_pendiente',
    mechanicName: 'Carlos "Charly" Morales',
    estimatedDelivery: 'Hoy, 17:00 PM',
    totalCost: 299.0,
  },
  {
    id: 'ord-02',
    otNumber: 'OT-2026-0842',
    clientName: 'Esteban Paredes Moreno',
    clientIdNumber: '1718903452',
    motorcycleInfo: 'CFMOTO 450MT Adventure 2024',
    plate: 'PCW-9021',
    entryDate: '20 Sep 2026, 11:15 AM',
    status: 'en_reparacion',
    mechanicName: 'David Carrera',
    estimatedDelivery: 'Mañana, 12:00 PM',
    totalCost: 138.0,
  },
  {
    id: 'ord-03',
    otNumber: 'OT-2026-0843',
    clientName: 'Camila Torres Vega',
    clientIdNumber: '1723456789',
    motorcycleInfo: 'Yamaha MT-03 ABS 2023',
    plate: 'IC-451K',
    entryDate: '19 Sep 2026, 14:00 PM',
    status: 'control_calidad',
    mechanicName: 'Carlos "Charly" Morales',
    estimatedDelivery: 'Hoy, 15:30 PM',
    totalCost: 97.75,
  },
  {
    id: 'ord-04',
    otNumber: 'OT-2026-0840',
    clientName: 'Mauricio Noboa',
    clientIdNumber: '1708891234',
    motorcycleInfo: 'KTM Duke 390 2022',
    plate: 'PDF-3320',
    entryDate: '19 Sep 2026, 09:00 AM',
    status: 'lista_retiro',
    mechanicName: 'Andrés Guano',
    estimatedDelivery: 'Listo para retiro',
    totalCost: 175.0,
  },
];

// --- Perfil del Garante ---
export const INITIAL_GARANTE_PROFILE: GaranteProfile = {
  id: 'gar-benelli-ec',
  companyName: 'Representaciones Benelli & CFMOTO del Ecuador S.A.',
  ruc: '1792849102001',
  contactName: 'Ing. Paulina Velasteguí (Jefa Nacional de Garantías)',
  phone: '+593 2 398 5400 / +593 99 780 1200',
  email: 'garantias.oficial@benelli-ecuador.com',
  address: 'Av. Granados E12-40 y 6 de Diciembre, Edificio Corporativo Motorcorp Piso 4',
  brandsRepresented: ['Benelli', 'CFMOTO', 'Keeway', 'Brixton'],
  contractStartDate: '01 Ene 2024',
  contractEndDate: '31 Dic 2027',
};

// --- Mock Base de Datos SRI para Auto-Llenado de Cédula/RUC en Ecuador ---
export const SRI_MOCK_DATABASE: Record<string, { razonSocial: string; tipoContribuyente: string; address: string; email: string; phone: string }> = {
  '1724890123': {
    razonSocial: 'VACA MORALES FERNANDO XAVIER',
    tipoContribuyente: 'PERSONA NATURAL OBLIGADA A LLEVAR CONTABILIDAD',
    address: 'Av. Brasil N39-122 y Edmundo Carvajal, Quito',
    email: 'cliente@starmotos.ec',
    phone: '0998745612',
  },
  '1718903452': {
    razonSocial: 'PAREDES MORENO ESTEBAN DARIO',
    tipoContribuyente: 'PERSONA NATURAL NO OBLIGADA A LLEVAR CONTABILIDAD',
    address: 'Calle Los Álamos N14-22 y Eloy Alfaro, Quito',
    email: 'eparedes@gmail.com',
    phone: '0984432190',
  },
  '1715678901': {
    razonSocial: 'SANTILLAN MORA LUCIA MARGARITA',
    tipoContribuyente: 'REGIMEN RIMPE - EMPRENDEDOR',
    address: 'Av. Interoceánica km 11, Cumbayá',
    email: 'lucia.santillan@hotmail.com',
    phone: '0995544332',
  },
  '1792345678001': {
    razonSocial: 'TRANSPORTES RAPIDOS PICHINCHA CIA. LTDA.',
    tipoContribuyente: 'SOCIEDAD',
    address: 'Av. Galo Plaza Lasso N55-12 y Sabanilla, Quito',
    email: 'facturacion@transpichincha.com',
    phone: '022456789',
  },
  '1792849102001': {
    razonSocial: 'REPRESENTACIONES BENELLI & CFMOTO DEL ECUADOR S.A.',
    tipoContribuyente: 'CONTRIBUYENTE ESPECIAL',
    address: 'Av. Granados E12-40 y 6 de Diciembre, Quito',
    email: 'facturacion@benelli-ecuador.com',
    phone: '023985400',
  },
  '0923456781': {
    razonSocial: 'CAICEDO ANDRADE JORGE VINICIO',
    tipoContribuyente: 'PERSONA NATURAL',
    address: 'Av. 9 de Octubre y Boyacá, Guayaquil',
    email: 'jorge.caicedo@ecuaexpress.com',
    phone: '0979988776',
  },
};

// Función auxiliar para consultar SRI simulada (genera un nombre realista si no existe)
export function querySriMock(idNumber: string) {
  const cleanId = idNumber.trim();
  if (SRI_MOCK_DATABASE[cleanId]) {
    return SRI_MOCK_DATABASE[cleanId];
  }

  // Generador de fallback dinámico para cualquier cédula válida de 10 o 13 dígitos
  if (cleanId.length === 10 || cleanId.length === 13) {
    const isRuc = cleanId.length === 13;
    return {
      razonSocial: isRuc
        ? `EMPRESA COMERCIAL MOTOS DEL ECUADOR CIA. LTDA. (RUC ${cleanId})`
        : `CLIENTE REGISTRADO SRI #${cleanId.slice(0, 4)} (C.I. ${cleanId})`,
      tipoContribuyente: isRuc ? 'SOCIEDAD' : 'PERSONA NATURAL',
      address: 'Pichincha, Quito, Av. Amazonas y República',
      email: `contacto.${cleanId.slice(-4)}@sri-ecuador.ec`,
      phone: '0991234567',
    };
  }

  return null;
}

// =========================================================================
// GESTOR DE ALMACENAMIENTO COMPARTIDO (LOCALSTORAGE) PARA LA DEMO EN VIVO
// =========================================================================

const STORAGE_KEYS = {
  WARRANTIES: 'starmotos_shared_warranties',
  WORKSHOPS: 'starmotos_shared_workshops',
  ALERTS: 'starmotos_shared_alerts',
  INVOICES: 'starmotos_shared_invoices',
  ORDERS: 'starmotos_shared_orders',
  CLIENTS: 'starmotos_shared_clients',
  INVENTORY: 'starmotos_shared_inventory',
};

// Garantías
export function getStoredWarranties(): WarrantyRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WARRANTIES);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading warranties from localStorage', e);
  }
  return INITIAL_WARRANTY_REQUESTS;
}

export function saveStoredWarranties(warranties: WarrantyRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(warranties));
    window.dispatchEvent(new Event('starmotos_warranties_updated'));
  } catch (e) {
    console.error('Error saving warranties to localStorage', e);
  }
}

// Alertas
export function getStoredAlerts(): SystemAlert[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading alerts from localStorage', e);
  }
  return INITIAL_ALERTS;
}

export function saveStoredAlerts(alerts: SystemAlert[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    window.dispatchEvent(new Event('starmotos_alerts_updated'));
  } catch (e) {
    console.error('Error saving alerts to localStorage', e);
  }
}

// Talleres
export function getStoredWorkshops(): Workshop[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WORKSHOPS);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading workshops from localStorage', e);
  }
  return INITIAL_WORKSHOPS;
}

// Facturas
export function getStoredInvoices(): AdminInvoice[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading invoices from localStorage', e);
  }
  return INITIAL_INVOICES;
}

export function saveStoredInvoices(invoices: AdminInvoice[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  } catch (e) {
    console.error('Error saving invoices to localStorage', e);
  }
}

// Órdenes
export function getStoredOrders(): TallerOrder[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading orders from localStorage', e);
  }
  return INITIAL_TALLER_ORDERS;
}

export function saveStoredOrders(orders: TallerOrder[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    window.dispatchEvent(new Event('starmotos_orders_updated'));
  } catch (e) {
    console.error('Error saving orders to localStorage', e);
  }
}

// Clientes Taller
export function getStoredClients(): TallerClient[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading clients from localStorage', e);
  }
  return INITIAL_TALLER_CLIENTS;
}

export function saveStoredClients(clients: TallerClient[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  } catch (e) {
    console.error('Error saving clients to localStorage', e);
  }
}

// Inventario
export function getStoredInventory(): InventoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading inventory from localStorage', e);
  }
  return INITIAL_INVENTORY;
}
