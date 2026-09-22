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
  Technician,
  AlistamientoFullRecord,
} from '../types/customer';

// --- Talleres y Sucursales Oficiales de StarMotos (11 Ubicaciones Oficiales) ---
export const INITIAL_WORKSHOPS: Workshop[] = [
  {
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
    manager: 'William Daniel Meza Chicaiza (Gerente)',
    email: 'starsmotor17@gmail.com',
    status: 'operativo',
    activeOrders: 0,
    completedToday: 0,
    pendingWarranties: 0,
    mechanics: 6,
  },
  {
    id: 'taller-buena-fe',
    name: 'StarMotos Sucursal Buena Fe',
    code: 'SUC-02',
    address: 'Calle Arcadio Fuente S/N y 7 de Agosto',
    city: 'Buena Fe, Los Ríos',
    province: 'Los Ríos',
    canton: 'Buena Fe',
    parroquia: 'San Jacinto de Buena Fe',
    reference: 'Vía al cementerio de Buena Fe',
    phone: '0939316698',
    manager: 'Jefe de Taller Buena Fe',
    email: 'starsmotor17@gmail.com',
    status: 'operativo',
    activeOrders: 0,
    completedToday: 0,
    pendingWarranties: 0,
    mechanics: 3,
  },
  {
    id: 'taller-balzar',
    name: 'StarMotos Sucursal Balzar',
    code: 'SUC-03',
    address: 'Callejón 14 SN y 9 de Octubre',
    city: 'Balzar, Guayas',
    province: 'Guayas',
    canton: 'Balzar',
    parroquia: 'Balzar',
    reference: 'Al lado de Picantería Nayeli',
    phone: '0939317809',
    manager: 'Jefe de Taller Balzar',
    email: 'starsmotor17@gmail.com',
    status: 'operativo',
    activeOrders: 0,
    completedToday: 0,
    pendingWarranties: 0,
    mechanics: 2,
  },
  {
    id: 'taller-el-carmen',
    name: 'StarMotos Sucursal El Carmen',
    code: 'SUC-04',
    address: 'Urb. Barrio Naranjales, Calle Los Limones S/N y Av. Chone',
    city: 'El Carmen, Manabí',
    province: 'Manabí',
    canton: 'El Carmen',
    parroquia: 'El Carmen',
    reference: 'Diagonal al SuperKia',
    phone: '0939316698',
    manager: 'Jefe de Taller El Carmen',
    email: 'starsmotor17@gmail.com',
    status: 'operativo',
    activeOrders: 0,
    completedToday: 0,
    pendingWarranties: 0,
    mechanics: 4,
  },
  {
    id: 'taller-quevedo',
    name: 'StarMotos Sucursal Quevedo',
    code: 'SUC-05',
    address: 'Décima Tercera entre Junior Guzmán y 12 de Octubre',
    city: 'Quevedo, Los Ríos',
    province: 'Los Ríos',
    canton: 'Quevedo',
    parroquia: 'Quevedo',
    reference: 'Ingresa por lubricadora Don Lucho, al lado de Hostal Carmita',
    phone: '0982852456 / 0939316698',
    manager: 'Daniel Meza Quevedo',
    email: 'starsmotor17@gmail.com',
    status: 'operativo',
    activeOrders: 0,
    completedToday: 0,
    pendingWarranties: 0,
    mechanics: 5,
  },
  {
    id: 'taller-moraspungo',
    name: 'StarMotos Sucursal Moraspungo',
    code: 'SUC-06',
    address: 'Calle Vicente León S/N y Ulpiano Pino',
    city: 'Moraspungo, Cotopaxi',
    province: 'Cotopaxi',
    canton: 'Pangua',
    parroquia: 'Moraspungo',
    reference: 'Diagonal al parque central',
    phone: '0939317809',
    manager: 'Jefe de Taller Moraspungo',
    email: 'starsmotor17@gmail.com',
    status: 'operativo',
    activeOrders: 0,
    completedToday: 0,
    pendingWarranties: 0,
    mechanics: 2,
  },
  {
    id: 'taller-mocache',
    name: 'StarMotos Sucursal Mocache',
    code: 'SUC-07',
    address: 'Coop. 24 de Mayo, Calle Jaime Roldós SL-2 y Sexta',
    city: 'Mocache, Los Ríos',
    province: 'Los Ríos',
    canton: 'Mocache',
    parroquia: 'Mocache',
    reference: 'Loma de Mocache, frente al Colegio Nacional y al taller, al lado de peluquería',
    phone: '0939316698',
    manager: 'Jefe de Taller Mocache',
    email: 'starsmotor17@gmail.com',
    status: 'operativo',
    activeOrders: 0,
    completedToday: 0,
    pendingWarranties: 0,
    mechanics: 2,
  },
  {
    id: 'taller-quinzaloma',
    name: 'StarMotos Sucursal Quinzaloma',
    code: 'SUC-08',
    address: 'Calle Eduardo Elisario S/N y Secundaria',
    city: 'Quinzaloma, Los Ríos',
    province: 'Los Ríos',
    canton: 'Quinsaloma',
    parroquia: 'Quinsaloma',
    reference: 'Frente al Cuerpo de Bomberos',
    phone: '0939317809',
    manager: 'Jefe de Taller Quinzaloma',
    email: 'starsmotor17@gmail.com',
    status: 'operativo',
    activeOrders: 0,
    completedToday: 0,
    pendingWarranties: 0,
    mechanics: 2,
  },
  {
    id: 'taller-portoviejo',
    name: 'StarMotos Sucursal Portoviejo',
    code: 'SUC-09',
    address: 'Calle Pedro Gual S/N y Primero de Enero',
    city: 'Portoviejo, Manabí',
    province: 'Manabí',
    canton: 'Portoviejo',
    parroquia: 'Portoviejo',
    reference: 'Al lado de Almacén El Centinela Rulimán',
    phone: '0939316698',
    manager: 'Jefe de Taller Portoviejo',
    email: 'starsmotor17@gmail.com',
    status: 'operativo',
    activeOrders: 0,
    completedToday: 0,
    pendingWarranties: 0,
    mechanics: 4,
  },
  {
    id: 'taller-ricaurte',
    name: 'StarMotos Sucursal Ricaurte',
    code: 'SUC-10',
    address: 'Calle Carlos Olmes S/N y Secundaria',
    city: 'Ricaurte, Los Ríos',
    province: 'Los Ríos',
    canton: 'Urdaneta',
    parroquia: 'Ricaurte',
    reference: 'Frente a la Escuela 28 de Mayo',
    phone: '0939317809',
    manager: 'Jefe de Taller Ricaurte',
    email: 'starsmotor17@gmail.com',
    status: 'operativo',
    activeOrders: 0,
    completedToday: 0,
    pendingWarranties: 0,
    mechanics: 2,
  },
  {
    id: 'taller-el-empalme',
    name: 'StarMotos Sucursal El Empalme',
    code: 'SUC-11',
    address: 'San Miguel de Afuera, Calle Manabí S/N y Velasco Ibarra',
    city: 'El Empalme, Guayas',
    province: 'Guayas',
    canton: 'El Empalme',
    parroquia: 'Velasco Ibarra (El Empalme)',
    reference: 'Vía Manabí, frente a Cerámica Mejía',
    phone: '0939316698',
    manager: 'Jefe de Taller El Empalme',
    email: 'starsmotor17@gmail.com',
    status: 'operativo',
    activeOrders: 0,
    completedToday: 0,
    pendingWarranties: 0,
    mechanics: 3,
  },
];

// --- Solicitudes de Garantía Iniciales ---
export const INITIAL_WARRANTY_REQUESTS: WarrantyRequest[] = [];

// --- Alertas del Sistema ---
export const INITIAL_ALERTS: SystemAlert[] = [];

// --- Facturas Administrador SRI ---
export const INITIAL_INVOICES: AdminInvoice[] = [];

// --- Inventario Taller ---
export const INITIAL_INVENTORY: InventoryItem[] = [];

// --- Clientes del Taller ---
export const INITIAL_TALLER_CLIENTS: TallerClient[] = [];

// --- Órdenes de Taller Activas ---
export const INITIAL_TALLER_ORDERS: TallerOrder[] = [];

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
  '2350999252': {
    razonSocial: 'GRACIA GUATO FELIX RAFAEL',
    tipoContribuyente: 'PERSONA NATURAL',
    address: 'Quevedo Av.quito frente a la planta de agua',
    email: 'felix.graciag.r@gmail.com',
    phone: '0982852456',
  },
  '0504411679': {
    razonSocial: 'MEZA CHICAIZA WILLIAM DANIEL',
    tipoContribuyente: 'PERSONA NATURAL (GERENTE GENERAL STARS MOTOS)',
    address: 'Calle Jaime Roldós #1 y Gonzalo Albarracín, La Maná, Cotopaxi',
    email: 'starsmotor17@gmail.com',
    phone: '0939316698',
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

// Limpieza automática de datos demo antiguos en navegadores existentes
try {
  const legacyKeys = [
    'starmotos_shared_warranties',
    'starmotos_shared_alerts',
    'starmotos_shared_invoices',
    'starmotos_shared_orders',
    'starmotos_shared_clients',
    'starmotos_shared_inventory',
    'starmotos_shared_alistamientos',
    'starmotos_shared_workshops_v3',
    'starmotos_shared_technicians_v2',
  ];
  legacyKeys.forEach((k) => localStorage.removeItem(k));
} catch (_) {}

export const STORAGE_KEYS = {
  WARRANTIES: 'starmotos_shared_warranties_v4',
  WORKSHOPS: 'starmotos_shared_workshops_v4',
  ALERTS: 'starmotos_shared_alerts_v4',
  INVOICES: 'starmotos_shared_invoices_v4',
  ORDERS: 'starmotos_shared_orders_v4',
  CLIENTS: 'starmotos_shared_clients_v4',
  INVENTORY: 'starmotos_shared_inventory_v4',
  ALISTAMIENTOS: 'starmotos_shared_alistamientos_v4',
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

// Talleres (11 Ubicaciones Oficiales)
export function getStoredWorkshops(): Workshop[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WORKSHOPS);
    if (stored) {
      const parsed: Workshop[] = JSON.parse(stored);
      if (parsed.length >= 11 && parsed.some((w) => w.id === 'matriz-la-mana')) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading workshops from localStorage', e);
  }
  try {
    localStorage.setItem(STORAGE_KEYS.WORKSHOPS, JSON.stringify(INITIAL_WORKSHOPS));
  } catch (_) {}
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
    window.dispatchEvent(new Event('starmotos_invoices_updated'));
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
    window.dispatchEvent(new Event('starmotos_clients_updated'));
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

export function saveStoredInventory(inventory: InventoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    window.dispatchEvent(new Event('starmotos_inventory_updated'));
  } catch (e) {
    console.error('Error saving inventory to localStorage', e);
  }
}

// ===================== TÉCNICOS =====================
export const INITIAL_TECHNICIANS: Technician[] = [
  {
    id: 'tec-01',
    name: 'WILLIAM MEZA',
    workshopId: 'taller-quevedo',
    workshopName: 'StarMotos Sucursal Quevedo',
    specialty: 'Mecánica Integral & Ajuste PDI',
    phone: '0982852456',
    status: 'activo',
    activeOrdersCount: 0,
  },
  {
    id: 'tec-02',
    name: 'CARLOS "CHARLY" MORALES',
    workshopId: 'matriz-la-mana',
    workshopName: 'StarMotos Matriz La Maná',
    specialty: 'Diagnóstico Electrónico & Escáner Delphi',
    phone: '0939316698',
    status: 'activo',
    activeOrdersCount: 0,
  },
  {
    id: 'tec-03',
    name: 'DAVID CARRERA',
    workshopId: 'taller-buena-fe',
    workshopName: 'StarMotos Sucursal Buena Fe',
    specialty: 'Inyección Electrónica & Frenos ABS',
    phone: '0939316698',
    status: 'activo',
    activeOrdersCount: 0,
  },
  {
    id: 'tec-04',
    name: 'ROBERTO ALMEIDA',
    workshopId: 'taller-el-carmen',
    workshopName: 'StarMotos Sucursal El Carmen',
    specialty: 'Suspensiones & Chasis Multimarca',
    phone: '0939317809',
    status: 'activo',
    activeOrdersCount: 0,
  },
  {
    id: 'tec-05',
    name: 'ANDRÉS GUANO',
    workshopId: 'taller-portoviejo',
    workshopName: 'StarMotos Sucursal Portoviejo',
    specialty: 'Mantenimiento Preventivo & Lubricación',
    phone: '0939316698',
    status: 'activo',
    activeOrdersCount: 0,
  },
  {
    id: 'tec-06',
    name: 'ING. MATEO ENRÍQUEZ',
    workshopId: 'matriz-la-mana',
    workshopName: 'StarMotos Matriz La Maná',
    specialty: 'Auditoría Técnica PDI & Gestión Matriz',
    phone: '0939317809',
    status: 'activo',
    activeOrdersCount: 0,
  },
];

export function getStoredTechnicians(): Technician[] {
  try {
    const stored = localStorage.getItem('starmotos_shared_technicians_v4');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading technicians from localStorage', e);
  }
  return INITIAL_TECHNICIANS;
}

export function saveStoredTechnicians(technicians: Technician[]) {
  try {
    localStorage.setItem('starmotos_shared_technicians_v4', JSON.stringify(technicians));
    window.dispatchEvent(new Event('starmotos_technicians_updated'));
  } catch (e) {
    console.error('Error saving technicians to localStorage', e);
  }
}

// ===================== ORÍGENES / ALMACENES =====================
export const INITIAL_ORIGINS: string[] = [
  'Almacén Matriz La Maná',
  'Almacén Quevedo',
  'Almacén Buena Fe',
  'Almacén El Carmen',
  'Almacén Portoviejo',
  'Almacén El Empalme',
  'Almacén Balzar',
  'Almacén Moraspungo',
  'Almacén Mocache',
  'Almacén Quinzaloma',
  'Almacén Ricaurte',
  'Almacén Tenso Santo Domingo',
  'Particular (Venta directa)',
  'Concesionario Asociado',
  'Referido por socio fundador',
];

export function getStoredOrigins(): string[] {
  try {
    const stored = localStorage.getItem('starmotos_shared_origins_v2');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading origins from localStorage', e);
  }
  return INITIAL_ORIGINS;
}

export function saveStoredOrigins(origins: string[]) {
  try {
    localStorage.setItem('starmotos_shared_origins_v2', JSON.stringify(origins));
    window.dispatchEvent(new Event('starmotos_origins_updated'));
  } catch (e) {
    console.error('Error saving origins to localStorage', e);
  }
}

// ===================== REGISTROS COMPLETOS DE ALISTAMIENTO =====================
export const INITIAL_FULL_ALISTAMIENTOS: AlistamientoFullRecord[] = [];

export function getStoredFullAlistamientos(): AlistamientoFullRecord[] {
  try {
    const stored = localStorage.getItem('starmotos_shared_alistamientos_v4');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading alistamientos from localStorage', e);
  }
  return INITIAL_FULL_ALISTAMIENTOS;
}

export function saveStoredFullAlistamientos(records: AlistamientoFullRecord[]) {
  try {
    localStorage.setItem('starmotos_shared_alistamientos_v4', JSON.stringify(records));
    window.dispatchEvent(new Event('starmotos_alistamientos_updated'));
  } catch (e) {
    console.error('Error saving alistamientos to localStorage', e);
  }
}

// Función para reiniciar todos los módulos a vacío en pruebas
export function resetAllSystemData() {
  saveStoredWarranties([]);
  saveStoredAlerts([]);
  saveStoredInvoices([]);
  saveStoredOrders([]);
  saveStoredClients([]);
  saveStoredInventory([]);
  saveStoredFullAlistamientos([]);
}

