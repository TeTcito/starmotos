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
  AdminProfile,
} from '../types/customer';
import {
  cloudSaveWarranty,
  cloudSaveAlert,
  cloudSaveClient,
  cloudSaveAlistamiento,
  cloudSaveOrder,
  cloudSaveInvoice,
  cloudDeleteWarranty,
  cloudDeleteAlistamiento,
  cloudDeleteClient,
  cloudDeleteAlert,
  cloudDeleteAlerts,
  getDeletedTombstones,
  addDeletedTombstone,
  removeDeletedTombstone,
  isDeletedTombstone,
} from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { STORAGE_KEYS } from '../constants/storageKeys';
export {
  STORAGE_KEYS,
  getDeletedTombstones,
  addDeletedTombstone,
  removeDeletedTombstone,
  isDeletedTombstone,
};


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
    email: 'sede.la-mana@starmotos.com',
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
    email: 'sede.buena-fe@starmotos.com',
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
    email: 'sede.balzar@starmotos.com',
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
    email: 'sede.el-carmen@starmotos.com',
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
    email: 'sede.quevedo@starmotos.com',
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
    email: 'sede.moraspungo@starmotos.com',
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
    email: 'sede.mocache@starmotos.com',
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
    email: 'sede.quinzaloma@starmotos.com',
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
    email: 'sede.portoviejo@starmotos.com',
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
    email: 'sede.ricaurte@starmotos.com',
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
    email: 'sede.el-empalme@starmotos.com',
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

// Garantías
export function getStoredWarranties(): WarrantyRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WARRANTIES);
    if (stored) {
      const parsed: WarrantyRequest[] = JSON.parse(stored);
      return parsed.filter(
        (w) =>
          w &&
          w.id &&
          !isDeletedTombstone(w.id) &&
          (!w.requestNumber || !isDeletedTombstone(w.requestNumber)) &&
          (!w.clientIdNumber || !isDeletedTombstone(w.clientIdNumber))
      );
    }
  } catch (e) {
    console.error('Error reading warranties from localStorage', e);
  }
  return INITIAL_WARRANTY_REQUESTS.filter(
    (w) =>
      w &&
      w.id &&
      !isDeletedTombstone(w.id) &&
      (!w.requestNumber || !isDeletedTombstone(w.requestNumber)) &&
      (!w.clientIdNumber || !isDeletedTombstone(w.clientIdNumber))
  );
}

export function saveStoredWarranties(warranties: WarrantyRequest[]) {
  try {
    const cleanList = warranties.filter(
      (w) =>
        w &&
        w.id &&
        !isDeletedTombstone(w.id) &&
        (!w.requestNumber || !isDeletedTombstone(w.requestNumber)) &&
        (!w.clientIdNumber || !isDeletedTombstone(w.clientIdNumber))
    );
    localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(cleanList));
    window.dispatchEvent(new Event('starmotos_warranties_updated'));
    if (cleanList.length > 0) {
      cleanList.forEach((w) => cloudSaveWarranty(w));
    }
  } catch (e) {
    console.error('Error saving warranties to localStorage', e);
  }
}

export function deleteStoredWarranty(id: string) {
  try {
    const cleanId = id.trim();
    const stored = getStoredWarranties();
    const target = stored.find((w) => w.id === cleanId || w.requestNumber === cleanId);
    addDeletedTombstone(cleanId, target?.id, target?.requestNumber);

    const current = stored.filter(
      (w) =>
        w.id !== cleanId &&
        w.requestNumber !== cleanId &&
        (target ? w.id !== target.id && w.requestNumber !== target.requestNumber : true)
    );
    localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(current));
    window.dispatchEvent(new Event('starmotos_warranties_updated'));
    cloudDeleteWarranty(cleanId);
  } catch (e) {
    console.error('Error deleting warranty', e);
  }
}

// Alertas
export function getStoredAlerts(): SystemAlert[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (stored) {
      const parsed: SystemAlert[] = JSON.parse(stored);
      return parsed.filter((a) => a && a.id && !isDeletedTombstone(a.id));
    }
  } catch (e) {
    console.error('Error reading alerts from localStorage', e);
  }
  return INITIAL_ALERTS.filter((a) => a && a.id && !isDeletedTombstone(a.id));
}

export function saveStoredAlerts(alerts: SystemAlert[]) {
  try {
    const cleanList = alerts.filter((a) => a && a.id && !isDeletedTombstone(a.id));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(cleanList));
    window.dispatchEvent(new Event('starmotos_alerts_updated'));
    if (cleanList.length > 0) {
      cleanList.forEach((alt) => cloudSaveAlert(alt));
    }
  } catch (e) {
    console.error('Error saving alerts to localStorage', e);
  }
}

export function deleteStoredAlert(id: string) {
  try {
    const cleanId = id.trim();
    addDeletedTombstone(cleanId);
    const current = getStoredAlerts().filter((a) => a.id !== cleanId);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(current));
    window.dispatchEvent(new Event('starmotos_alerts_updated'));
    cloudDeleteAlert(cleanId);
  } catch (e) {
    console.error('Error deleting alert', e);
  }
}

export function deleteStoredAlerts(ids: string[]) {
  if (!ids || ids.length === 0) return;
  try {
    ids.forEach((id) => addDeletedTombstone(id));
    const idSet = new Set(ids.map((i) => i.trim()));
    const current = getStoredAlerts().filter((a) => !idSet.has(a.id));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(current));
    window.dispatchEvent(new Event('starmotos_alerts_updated'));
    cloudDeleteAlerts(ids);
  } catch (e) {
    console.error('Error deleting alerts', e);
  }
}

// Talleres (11 Ubicaciones Oficiales)
export function getStoredWorkshops(): Workshop[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WORKSHOPS);
    if (stored) {
      const parsed: Workshop[] = JSON.parse(stored);
      if (parsed.length >= 11 && parsed.some((w) => w.id === 'matriz-la-mana')) {
        // Sincronizar correos corporativos oficiales actualizados
        return parsed.map((ws) => {
          const initWs = INITIAL_WORKSHOPS.find((i) => i.id === ws.id);
          return initWs ? { ...ws, email: initWs.email } : ws;
        });
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

export function saveStoredWorkshops(workshops: Workshop[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKSHOPS, JSON.stringify(workshops));
    window.dispatchEvent(new Event('starmotos_workshops_updated'));
  } catch (e) {
    console.error('Error saving workshops to localStorage', e);
  }
}

// ===================== PERFIL DE ADMINISTRADOR =====================
export const INITIAL_ADMIN_PROFILE: AdminProfile = {
  fullName: 'William Daniel Meza Chicaiza',
  firstNames: 'William Daniel',
  lastNames: 'Meza Chicaiza',
  email: 'admin@starmotos.com',
  phone: '0939316698',
  roleTitle: 'Administrador General & Gerente Matriz',
  companyName: 'StarMotos Ecuador',
};

export function getStoredAdminProfile(): AdminProfile {
  try {
    const raw = localStorage.getItem('starmotos_admin_profile');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return INITIAL_ADMIN_PROFILE;
}

export function saveStoredAdminProfile(profile: AdminProfile) {
  try {
    localStorage.setItem('starmotos_admin_profile', JSON.stringify(profile));
    window.dispatchEvent(new Event('starmotos_admin_profile_updated'));
  } catch (e) {
    console.error('Error saving admin profile', e);
  }
}

// ===================== PERFIL DE GARANTE =====================
export function getStoredGaranteProfile(): GaranteProfile {
  try {
    const raw = localStorage.getItem('starmotos_shared_garante_profile');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return INITIAL_GARANTE_PROFILE;
}

export function saveStoredGaranteProfile(profile: GaranteProfile) {
  try {
    localStorage.setItem('starmotos_shared_garante_profile', JSON.stringify(profile));
    window.dispatchEvent(new Event('starmotos_garante_profile_updated'));
  } catch (e) {
    console.error('Error saving garante profile', e);
  }
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
    if (invoices.length > 0) {
      invoices.forEach((i) => cloudSaveInvoice(i));
    }
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
    if (orders.length > 0) {
      orders.forEach((o) => cloudSaveOrder(o));
    }
  } catch (e) {
    console.error('Error saving orders to localStorage', e);
  }
}

// Clientes Taller
export function getStoredClients(): TallerClient[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (stored) {
      const parsed: TallerClient[] = JSON.parse(stored);
      return parsed.filter(
        (c) =>
          c &&
          c.id &&
          !isDeletedTombstone(c.id) &&
          (!c.idNumber || !isDeletedTombstone(c.idNumber.trim()))
      );
    }
  } catch (e) {
    console.error('Error reading clients from localStorage', e);
  }
  return INITIAL_TALLER_CLIENTS.filter(
    (c) =>
      c &&
      c.id &&
      !isDeletedTombstone(c.id) &&
      (!c.idNumber || !isDeletedTombstone(c.idNumber.trim()))
  );
}

export function saveStoredClients(clients: TallerClient[]) {
  try {
    const cleanList = clients.filter(
      (c) =>
        c &&
        c.id &&
        !isDeletedTombstone(c.id) &&
        (!c.idNumber || !isDeletedTombstone(c.idNumber.trim()))
    );
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(cleanList));
    window.dispatchEvent(new Event('starmotos_clients_updated'));
    if (cleanList.length > 0) {
      cleanList.forEach((c) => cloudSaveClient(c));
    }
  } catch (e) {
    console.error('Error saving clients to localStorage', e);
  }
}

export function deleteStoredClient(idOrCedula: string) {
  try {
    const clean = idOrCedula.trim();
    const currentClients = getStoredClients();
    const target = currentClients.find(
      (c) => c.id === clean || c.idNumber === clean
    );
    const idsToTombstone = [clean];
    if (target?.id) idsToTombstone.push(target.id);
    if (target?.idNumber) idsToTombstone.push(target.idNumber);

    // 1. Registrar en tombstones para evitar cualquier resurrección
    addDeletedTombstone(...idsToTombstone);

    // 2. Filtrar y persistir clientes
    const remainingClients = currentClients.filter(
      (c) =>
        c.id !== clean &&
        c.idNumber !== clean &&
        (target ? c.id !== target.id && c.idNumber !== target.idNumber : true)
    );
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(remainingClients));
    window.dispatchEvent(new Event('starmotos_clients_updated'));

    // 3. Limpiar y tombstonear alistamientos vinculados a este cliente
    try {
      const currentAls = getStoredFullAlistamientos();
      const relatedAls = currentAls.filter(
        (r) =>
          r.cedulaRuc === clean ||
          r.id === clean ||
          (target?.idNumber && r.cedulaRuc === target.idNumber)
      );
      if (relatedAls.length > 0) {
        relatedAls.forEach((r) => addDeletedTombstone(r.id, r.cedulaRuc));
        const remainingAls = currentAls.filter(
          (r) =>
            r.cedulaRuc !== clean &&
            r.id !== clean &&
            (target?.idNumber ? r.cedulaRuc !== target.idNumber : true)
        );
        localStorage.setItem(STORAGE_KEYS.ALISTAMIENTOS, JSON.stringify(remainingAls));
        window.dispatchEvent(new Event('starmotos_alistamientos_updated'));
      }
    } catch (_) {}

    // 4. Limpiar y tombstonear garantías vinculadas a este cliente
    try {
      const currentW = getStoredWarranties();
      const relatedW = currentW.filter(
        (w) =>
          w.clientIdNumber === clean ||
          (target?.idNumber && w.clientIdNumber === target.idNumber)
      );
      if (relatedW.length > 0) {
        relatedW.forEach((w) => addDeletedTombstone(w.id, w.requestNumber));
        const remainingW = currentW.filter(
          (w) =>
            w.clientIdNumber !== clean &&
            (target?.idNumber ? w.clientIdNumber !== target.idNumber : true)
        );
        localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(remainingW));
        window.dispatchEvent(new Event('starmotos_warranties_updated'));
      }
    } catch (_) {}

    // 5. Eliminar en Supabase (en cascada)
    cloudDeleteClient(clean);
  } catch (e) {
    console.error('Error deleting client', e);
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
    const stored = localStorage.getItem(STORAGE_KEYS.ALISTAMIENTOS);
    if (stored) {
      const parsed: AlistamientoFullRecord[] = JSON.parse(stored);
      return parsed.filter(
        (r) =>
          r &&
          r.id &&
          !isDeletedTombstone(r.id) &&
          (!r.cedulaRuc || !isDeletedTombstone(r.cedulaRuc.trim()))
      );
    }
  } catch (e) {
    console.error('Error reading alistamientos from localStorage', e);
  }
  return INITIAL_FULL_ALISTAMIENTOS.filter(
    (r) =>
      r &&
      r.id &&
      !isDeletedTombstone(r.id) &&
      (!r.cedulaRuc || !isDeletedTombstone(r.cedulaRuc.trim()))
  );
}

export function saveStoredFullAlistamientos(records: AlistamientoFullRecord[]) {
  try {
    const cleanList = records.filter(
      (r) =>
        r &&
        r.id &&
        !isDeletedTombstone(r.id) &&
        (!r.cedulaRuc || !isDeletedTombstone(r.cedulaRuc.trim()))
    );
    localStorage.setItem(STORAGE_KEYS.ALISTAMIENTOS, JSON.stringify(cleanList));
    window.dispatchEvent(new Event('starmotos_alistamientos_updated'));
    if (cleanList.length > 0) {
      cleanList.forEach((r) => cloudSaveAlistamiento(r));
    }
  } catch (e) {
    console.error('Error saving alistamientos to localStorage', e);
  }
}

export function deleteStoredAlistamiento(id: string) {
  try {
    const clean = id.trim();
    const stored = getStoredFullAlistamientos();
    const target = stored.find((r) => r.id === clean || r.cedulaRuc === clean);
    addDeletedTombstone(clean, target?.id, target?.cedulaRuc);

    const current = stored.filter(
      (r) =>
        r.id !== clean &&
        r.cedulaRuc !== clean &&
        (target ? r.id !== target.id : true)
    );
    localStorage.setItem(STORAGE_KEYS.ALISTAMIENTOS, JSON.stringify(current));
    window.dispatchEvent(new Event('starmotos_alistamientos_updated'));
    cloudDeleteAlistamiento(clean);
  } catch (e) {
    console.error('Error deleting alistamiento', e);
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
  try {
    localStorage.removeItem('starmotos_deleted_tombstones_v1');
    supabase.from('warranties').delete().neq('id', '___').then(() => {});
    supabase.from('full_alistamientos').delete().neq('id', '___').then(() => {});
    supabase.from('clients').delete().neq('id', '___').then(() => {});
    supabase.from('alerts').delete().neq('id', '___').then(() => {});
    supabase.from('orders').delete().neq('id', '___').then(() => {});
    supabase.from('invoices').delete().neq('id', '___').then(() => {});
  } catch (_) {}
}

