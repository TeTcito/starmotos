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
  WorkshopManagerAccount,
  DictamenRecord,
  OrderRating,
  AdminPendiente,
  AgendamientoTicket,
  GpsRecord,
  GpsProfile,
} from '../types/customer';
import {
  cloudSaveWarranty,
  cloudSaveAlert,
  cloudSaveClient,
  cloudSaveAlistamiento,
  cloudSaveOrder,
  cloudSaveInvoice,
  cloudSaveTechnician,
  cloudSaveGarante,
  cloudDeleteGarante,
  cloudSaveWorkshopManager,
  cloudDeleteWorkshopManager,
  cloudSaveDictamen,
  cloudDeleteDictamen,
  cloudDeleteTechnician,
  cloudDeleteWarranty,
  cloudDeleteAlistamiento,
  cloudDeleteClient,
  cloudDeleteAlert,
  cloudDeleteAlerts,
  cloudSavePendiente,
  cloudDeletePendiente,
  cloudSaveRating,
  cloudSaveAgendamiento,
  cloudDeleteAgendamiento,
  getDeletedTombstones,
  addDeletedTombstone,
  removeDeletedTombstone,
  isDeletedTombstone,
  syncBus,
  safeSaveAlistamientosToLocalStorage,
  safeSaveWarrantiesToLocalStorage,
} from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { saveMediaToIndexedDB, isValidDataUrl } from '../services/mediaStorage';
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

// --- Solicitud de Garantía Restaurada GAR-2026-9135 ---
export const RESTORED_WARRANTY_9135: WarrantyRequest = {
  id: 'gar-1790270366447',
  requestNumber: 'GAR-2026-9135',
  status: 'aceptada',
  createdAt: '2026-09-24T19:36:36.527Z',
  approvedAt: '2026-09-24T19:36:36.527Z',
  clientName: 'Bayron Manuel  Bermeo Rizzo',
  clientIdNumber: '1205409004',
  clientPhone: '0994825101',
  motorcycleBrand: 'HMT',
  motorcycleModel: 'Thork 230 pro',
  motorcyclePlate: 'KG212G',
  motorcycleVin: 'L6UB4HA26VA000305',
  motorcycleMileage: 0,
  motorNumber: '163FML000143W7',
  ramvNumber: 'HMT0800024',
  warrantyType: 'marca',
  issueDescription: 'Allá en motor de arranque, tablero y sensor de velocímetro, el vehículo fue ingresado a otro taller no autorizado',
  tallerOrigin: 'StarMotos Sucursal Quevedo',
  tallerOriginId: 'taller-quevedo',
  partsRequired: 'Motor de arranque, Tablero, Sensor de velocímetro',
  partsTags: ['Motor de arranque', 'Tablero', 'Sensor de velocímetro'],
  resolutionType: 'envio_repuesto',
  partsBudget: {
    Tablero: 55,
    'Motor de arranque': 25,
    'Sensor de velocímetro': 15,
  },
  laborTime: '2 horas',
  laborCost: 20,
  totalBudget: 115,
  estimatedCost: 115,
  matrizNotes: 'Inspección técnica de Matriz aprobada. Aplica cobertura de fábrica.',
  garanteNotes: 'por el tiempo esta fuera de garantía por lo que le podemos apoyar con el motor de arranque nada mas y el tema de la velocidad muy probablemente solo sea de calibrar el sensor',
  garanteName: 'Pedro Zeas',
  targetBrand: 'MMOTASA',
  invoiceNumber: '024-000024',
  diagnosticPhotos: [
    'https://djbvtgjykrkygkdhfhos.supabase.co/storage/v1/object/public/warranty-media/garantias/foto_movil_1_1790270354929_bjjqh2.webp',
    'https://djbvtgjykrkygkdhfhos.supabase.co/storage/v1/object/public/warranty-media/garantias/foto_movil_2_1790270273169_olg6i3.webp',
    'https://djbvtgjykrkygkdhfhos.supabase.co/storage/v1/object/public/warranty-media/garantias/foto_movil_3_1790270275904_zofe2n.webp',
    'https://djbvtgjykrkygkdhfhos.supabase.co/storage/v1/object/public/warranty-media/garantias/foto_movil_4_1790270278838_u71d9c.webp',
    'https://djbvtgjykrkygkdhfhos.supabase.co/storage/v1/object/public/warranty-media/garantias/foto_movil_5_1790270359752_mpwi2u.webp',
    'https://djbvtgjykrkygkdhfhos.supabase.co/storage/v1/object/public/warranty-media/garantias/video_movil_1_1790270295244_xxa14v.mp4',
    'https://djbvtgjykrkygkdhfhos.supabase.co/storage/v1/object/public/warranty-media/garantias/video_movil_2_1790270299550_gsqvke.mp4',
  ],
};

// --- Solicitudes de Garantía Iniciales ---
export const INITIAL_WARRANTY_REQUESTS: WarrantyRequest[] = [RESTORED_WARRANTY_9135];

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
  id: 'gar-autorex',
  companyName: 'Autorex',
  ruc: '1792849102001',
  contactName: 'Responsable de Garantías',
  roleTitle: 'Representante Autorizado',
  phone: '0990000000',
  email: 'garantias@autorex.com',
  address: 'Ecuador',
  brandsRepresented: ['Autorex'],
  contractStartDate: '01 Ene 2025',
  contractEndDate: '31 Dic 2028',
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

// Función auxiliar para consultar SRI simulada
export function querySriMock(idNumber: string) {
  const cleanId = idNumber.trim();
  if (SRI_MOCK_DATABASE[cleanId]) {
    return SRI_MOCK_DATABASE[cleanId];
  }

  // Sin API externa conectada: no inventar datos ficticios para cédulas no registradas
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
    'starmotos_shared_technicians_v3',
    'starmotos_shared_technicians_v4',
    'starmotos_garante_pwd_ff@gmail.com',
    'starmotos_garante_pwd_garante1@starmotos.com',
    'starmotos_garante_pwd_luis@starmotos.com',
    'starmotos_pwd_ff@gmail.com',
    'starmotos_pwd_garante1@starmotos.com',
    'starmotos_pwd_luis@starmotos.com',
  ];
  legacyKeys.forEach((k) => localStorage.removeItem(k));

  const testIds = ['gar-1790198469789', 'gar-1790177178056', 'gar-1790195112522'];
  const testCompanies = ['honder', 'kindev', 'social'];
  const activeGarante = localStorage.getItem('starmotos_active_garante_id');
  if (activeGarante && testIds.includes(activeGarante)) {
    localStorage.removeItem('starmotos_active_garante_id');
    localStorage.removeItem('starmotos_active_garante_email');
    localStorage.removeItem('starmotos_shared_garante_profile');
  }

  const rawGarantes = localStorage.getItem(STORAGE_KEYS.GARANTES);
  if (rawGarantes) {
    const parsed = JSON.parse(rawGarantes);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter(
        (g: any) =>
          g &&
          g.id &&
          !testIds.includes(g.id) &&
          !(g.companyName && testCompanies.includes(g.companyName.toLowerCase().trim()))
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEYS.GARANTES, JSON.stringify(cleaned));
      }
    }
  }
} catch (_) {}

// Garantías
export function getStoredWarranties(): WarrantyRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WARRANTIES);
    if (stored) {
      const parsed: WarrantyRequest[] = JSON.parse(stored);
      const filtered = parsed.filter(
        (w) =>
          w &&
          w.id &&
          !isDeletedTombstone(w.id) &&
          (!w.requestNumber || !isDeletedTombstone(w.requestNumber))
      );
      const sanitized = filtered.map((w) => {
        if (Array.isArray(w.diagnosticPhotos)) {
          const clean = w.diagnosticPhotos.filter((p) => {
            if (typeof p === 'string' && p.startsWith('data:')) {
              return isValidDataUrl(p);
            }
            return Boolean(p);
          });
          if (clean.length !== w.diagnosticPhotos.length) {
            return { ...w, diagnosticPhotos: clean };
          }
        }
        return w;
      });

      if (
        !isDeletedTombstone('gar-1790270366447') &&
        !isDeletedTombstone('GAR-2026-9135') &&
        !sanitized.some((w) => w.id === 'gar-1790270366447' || w.requestNumber === 'GAR-2026-9135')
      ) {
        sanitized.unshift(RESTORED_WARRANTY_9135);
        safeSaveWarrantiesToLocalStorage(sanitized);
      }
      return sanitized;
    } else {
      if (!isDeletedTombstone('gar-1790270366447') && !isDeletedTombstone('GAR-2026-9135')) {
        safeSaveWarrantiesToLocalStorage([RESTORED_WARRANTY_9135]);
        return [RESTORED_WARRANTY_9135];
      }
      return [];
    }
  } catch (e) {
    console.error('Error reading warranties from localStorage', e);
  }
  return !isDeletedTombstone('gar-1790270366447') && !isDeletedTombstone('GAR-2026-9135') ? [RESTORED_WARRANTY_9135] : [];
}

export function saveStoredWarranties(warranties: WarrantyRequest[]) {
  try {
    const cleanList = warranties.filter(
      (w) =>
        w &&
        w.id &&
        !isDeletedTombstone(w.id) &&
        (!w.requestNumber || !isDeletedTombstone(w.requestNumber))
    );

    // Guardar en localStorage de forma ultra ligera y protegida
    safeSaveWarrantiesToLocalStorage(cleanList);
    window.dispatchEvent(new Event('starmotos_warranties_updated'));

    // Transmisión a Supabase en paralelo SIEMPRE
    if (cleanList.length > 0) {
      cleanList.forEach((w) => {
        try {
          cloudSaveWarranty(w);
        } catch (e) {
          console.warn('Error en cloudSaveWarranty:', e);
        }
      });
    }
  } catch (e) {
    console.error('Error saving warranties to localStorage', e);
  }
}

/**
 * Evalúa si una solicitud de garantía puede ser eliminada.
 * Regla de negocio: Las garantías que ya han sido ACEPTADAS / APROBADAS solo pueden
 * ser eliminadas una vez transcurridos 30 días desde su resolución oficial.
 * Las demás solicitudes (en revisión, en proceso, rechazadas) se pueden eliminar inmediatamente.
 */
export function canDeleteWarranty(warranty?: WarrantyRequest | null): {
  canDelete: boolean;
  reason?: string;
  daysRemaining?: number;
} {
  if (!warranty) return { canDelete: true };

  const isAccepted =
    warranty.status === 'aceptada' ||
    warranty.status === 'aprobada' ||
    warranty.status === 'en_proceso_aceptacion_2';

  if (!isAccepted) {
    return { canDelete: true };
  }

  // Extraer fecha base (aprobación o creación)
  let baseDate: Date | null = null;
  if (warranty.approvedAt) {
    const parsed = Date.parse(warranty.approvedAt);
    if (!isNaN(parsed)) {
      baseDate = new Date(parsed);
    }
  }

  if (!baseDate && warranty.createdAt) {
    const parsed = Date.parse(warranty.createdAt);
    if (!isNaN(parsed)) {
      baseDate = new Date(parsed);
    }
  }

  if (!baseDate) {
    baseDate = new Date();
  }

  const diffMs = Date.now() - baseDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 30) {
    const daysRemaining = Math.max(1, Math.ceil(30 - diffDays));
    return {
      canDelete: false,
      reason: `Las garantías aceptadas solo se pueden eliminar después de 30 días de su resolución oficial. Faltan ${daysRemaining} día(s) para habilitar su eliminación.`,
      daysRemaining,
    };
  }

  return { canDelete: true };
}

export function deleteStoredWarranty(id: string, force: boolean = false): boolean {
  try {
    const cleanId = id.trim();
    const stored = getStoredWarranties();
    const target = stored.find(
      (w) =>
        w.id === cleanId ||
        w.requestNumber === cleanId ||
        (w.requestNumber && w.requestNumber.toLowerCase() === cleanId.toLowerCase())
    );

    if (target && !force) {
      const deleteCheck = canDeleteWarranty(target);
      if (!deleteCheck.canDelete) {
        alert(deleteCheck.reason || 'Las garantías aceptadas solo se pueden eliminar después de 30 días de su resolución oficial.');
        return false;
      }
    }

    const idsToTombstone = [cleanId];
    if (target?.id && !idsToTombstone.includes(target.id)) idsToTombstone.push(target.id);
    if (target?.requestNumber && !idsToTombstone.includes(target.requestNumber)) idsToTombstone.push(target.requestNumber);

    addDeletedTombstone(...idsToTombstone);

    // 1. Filtrar de garantías locales en localStorage
    const current = stored.filter(
      (w) =>
        w.id !== cleanId &&
        w.requestNumber !== cleanId &&
        (target ? w.id !== target.id && w.requestNumber !== target.requestNumber : true)
    );
    safeSaveWarrantiesToLocalStorage(current);

    // 2. Limpiar dictámenes asociados a esta garantía para que no reaparezca en el garante
    try {
      const storedDictamenes = getStoredDictamenes();
      const remainingDictamenes = storedDictamenes.filter(
        (d) =>
          d.warrantyId !== cleanId &&
          d.requestNumber !== cleanId &&
          (target ? d.warrantyId !== target.id && d.requestNumber !== target.requestNumber : true)
      );
      if (remainingDictamenes.length !== storedDictamenes.length) {
        saveStoredDictamenes(remainingDictamenes);
        window.dispatchEvent(new Event('starmotos_dictamenes_updated'));
      }
    } catch (_) {}

    // 3. Limpiar alertas del sistema vinculadas a esta garantía
    try {
      const storedAlerts = getStoredAlerts();
      const remainingAlerts = storedAlerts.filter(
        (a) =>
          a.relatedId !== cleanId &&
          (target ? a.relatedId !== target.id && a.relatedId !== target.requestNumber : true)
      );
      if (remainingAlerts.length !== storedAlerts.length) {
        saveStoredAlerts(remainingAlerts);
        window.dispatchEvent(new Event('starmotos_alerts_updated'));
      }
    } catch (_) {}

    // 4. Notificar a toda la aplicación
    window.dispatchEvent(new Event('starmotos_warranties_updated'));
    syncBus?.postMessage({ type: 'WARRANTY_DELETED', ids: idsToTombstone });

    // 5. Eliminar en Supabase en cascada
    cloudDeleteWarranty(...idsToTombstone);
    return true;
  } catch (e) {
    console.error('Error deleting warranty', e);
    return false;
  }
}

// Exponer función de programador para forzar borrado inmediato desde la consola del navegador
if (typeof window !== 'undefined') {
  (window as any).forceDeleteWarranty = (id: string) => {
    const res = deleteStoredWarranty(id, true);
    console.log(`[Developer] forceDeleteWarranty("${id}"):`, res ? 'Eliminada con éxito en cascada' : 'Fallo al eliminar');
    return res;
  };
}

/**
 * Función de compatibilidad para evitar errores de importación.
 * Las solicitudes residuales anteriores ya fueron depuradas de forma definitiva.
 */
export function cleanupQuevedoWarranties() {
  // No-op intencional para permitir que las nuevas solicitudes de Quevedo persistan normalmente
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

export function addStoredAlerts(newAlerts: SystemAlert | SystemAlert[]) {
  const toAdd = Array.isArray(newAlerts) ? newAlerts : [newAlerts];
  const current = getStoredAlerts();
  saveStoredAlerts([...toAdd, ...current]);
}

export function filterAlertsForRole(
  alerts: SystemAlert[],
  options: {
    role: 'admin' | 'taller' | 'garante' | 'gps' | 'cliente';
    workshopId?: string;
    brand?: string;
    brandsRepresented?: string[];
    clientId?: string;
  }
): SystemAlert[] {
  const { role, workshopId, brand, brandsRepresented, clientId } = options;

  return alerts.filter((alert) => {
    if (!alert) return false;

    // 1. Role match
    const hasRole =
      !alert.targetRole ||
      alert.targetRole === 'all' ||
      alert.targetRole === role ||
      (alert.targetRoles && alert.targetRoles.includes(role));

    if (!hasRole) return false;

    // 2. Specific role constraints
    if (role === 'taller') {
      if (alert.targetWorkshopId && workshopId) {
        if (alert.targetWorkshopId.trim() !== workshopId.trim()) return false;
      }
    }

    if (role === 'garante') {
      if (alert.targetBrand) {
        const targetB = alert.targetBrand.trim().toLowerCase();
        const matchesMainBrand = brand && brand.trim().toLowerCase() === targetB;
        const matchesRep = brandsRepresented?.some((b) => b.trim().toLowerCase() === targetB);
        if (!matchesMainBrand && !matchesRep) return false;
      }
    }

    if (role === 'cliente') {
      if (alert.targetClientId && clientId) {
        if (alert.targetClientId.trim() !== clientId.trim()) return false;
      }
    }

    return true;
  });
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
    const activeEmail = localStorage.getItem('starmotos_active_garante_email');
    const activeId = localStorage.getItem('starmotos_active_garante_id');
    const garantes = getStoredGarantes();
    if (activeEmail) {
      const match = garantes.find((g) => g.email.trim().toLowerCase() === activeEmail.trim().toLowerCase());
      if (match) return match;
    }
    if (activeId) {
      const match = garantes.find((g) => g.id === activeId);
      if (match) return match;
    }
    const raw = localStorage.getItem('starmotos_shared_garante_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      const testIds = ['gar-1790198469789', 'gar-1790177178056', 'gar-1790195112522'];
      if (parsed && !testIds.includes(parsed.id)) {
        return parsed;
      }
    }
  } catch (_) {}
  return INITIAL_GARANTE_PROFILE;
}

export function saveStoredGaranteProfile(profile: GaranteProfile) {
  try {
    localStorage.setItem('starmotos_shared_garante_profile', JSON.stringify(profile));
    if (profile.email) {
      localStorage.setItem('starmotos_active_garante_email', profile.email);
    }
    if (profile.id) {
      localStorage.setItem('starmotos_active_garante_id', profile.id);
    }
    window.dispatchEvent(new Event('starmotos_garante_profile_updated'));
  } catch (e) {
    console.error('Error saving garante profile', e);
  }
}

// ===================== GARANTES Y MARCAS REGISTRADAS =====================
export const INITIAL_GARANTES: GaranteProfile[] = [];

export function getStoredGarantes(): GaranteProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GARANTES);
    if (raw) {
      const parsed: GaranteProfile[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const testIds = ['gar-1790198469789', 'gar-1790177178056', 'gar-1790195112522'];
        const testCompanies = ['honder', 'kindev', 'social'];
        const clean = parsed.filter(
          (g) =>
            g &&
            g.id &&
            g.id !== 'gar-benelli-ec' &&
            !testIds.includes(g.id) &&
            !(g.companyName && testCompanies.includes(g.companyName.toLowerCase().trim())) &&
            !(g.companyName && g.companyName.toLowerCase().includes('benelli'))
        );
        return clean;
      }
    }
  } catch (e) {
    console.error('Error reading garantes from localStorage', e);
  }
  return [];
}

export function saveStoredGarantes(garantes: GaranteProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.GARANTES, JSON.stringify(garantes));
    window.dispatchEvent(new Event('starmotos_garantes_updated'));
    garantes.forEach((g) => cloudSaveGarante(g));
  } catch (e) {
    console.error('Error saving garantes to localStorage', e);
  }
}

export function saveStoredGarante(garante: GaranteProfile) {
  try {
    const current = getStoredGarantes();
    const updated = [
      garante,
      ...current.filter((g) => g.id !== garante.id && g.email.toLowerCase() !== garante.email.toLowerCase()),
    ];
    saveStoredGarantes(updated);
    saveStoredGaranteProfile(garante);
  } catch (e) {
    console.error('Error saving individual garante', e);
  }
}

/**
 * Devuelve todas las marcas registradas consolidadas (ÚNICAMENTE la Razón Social de garantes registrados).
 * La razón social de la empresa garante actúa directamente como su marca oficial respaldada.
 * Sincronizado en tiempo real con la base de datos y perfiles de garantes oficiales.
 */
export function getRegisteredBrands(): string[] {
  const brandSet = new Set<string>();

  // Agregar única y exclusivamente la razón social de todos los garantes registrados
  const garantes = getStoredGarantes();
  for (const g of garantes) {
    if (g.id === 'gar-benelli-ec') continue;

    if (g.companyName) {
      const cleanCompany = g.companyName.trim();
      if (cleanCompany && !['benelli', 'brixton', 'cfmoto', 'keeway'].includes(cleanCompany.toLowerCase())) {
        brandSet.add(cleanCompany);
      }
    }
  }

  return Array.from(brandSet).sort((a, b) => a.localeCompare(b));
}

// ===================== DICTÁMENES DE GARANTÍA =====================
export const INITIAL_DICTAMENES: DictamenRecord[] = [];

export function getStoredDictamenes(): DictamenRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DICTAMENES);
    if (raw) {
      const parsed: DictamenRecord[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading dictamenes from localStorage', e);
  }
  return INITIAL_DICTAMENES;
}

export function saveStoredDictamenes(dictamenes: DictamenRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.DICTAMENES, JSON.stringify(dictamenes));
    window.dispatchEvent(new Event('starmotos_dictamenes_updated'));
    dictamenes.forEach((d) => cloudSaveDictamen(d));
  } catch (e) {
    console.error('Error saving dictamenes to localStorage', e);
  }
}

export function saveStoredDictamen(dictamen: DictamenRecord) {
  try {
    const current = getStoredDictamenes();
    const updated = [
      dictamen,
      ...current.filter((d) => d.id !== dictamen.id),
    ];
    saveStoredDictamenes(updated);
  } catch (e) {
    console.error('Error saving individual dictamen', e);
  }
}

// ===================== JEFES DE TALLER REGISTRADOS =====================
export const INITIAL_WORKSHOP_MANAGERS: WorkshopManagerAccount[] = [
  {
    id: 'mgr-la-mana',
    name: 'William Daniel Meza Chicaiza',
    workshopId: 'matriz-la-mana',
    workshopName: 'StarMotos Matriz La Maná',
    email: 'sede.la-mana@starmotos.com',
    phone: '0939316698',
  },
  {
    id: 'mgr-quevedo',
    name: 'Jefe de Taller Quevedo',
    workshopId: 'taller-quevedo',
    workshopName: 'StarMotos Sucursal Quevedo',
    email: 'sede.quevedo@starmotos.com',
    phone: '0939317809',
  },
];

export function getStoredWorkshopManagers(): WorkshopManagerAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKSHOP_MANAGERS);
    if (raw) {
      const parsed: WorkshopManagerAccount[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading workshop managers from localStorage', e);
  }
  return INITIAL_WORKSHOP_MANAGERS;
}

export function saveStoredWorkshopManagers(managers: WorkshopManagerAccount[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKSHOP_MANAGERS, JSON.stringify(managers));
    window.dispatchEvent(new Event('starmotos_workshop_managers_updated'));
    managers.forEach((m) => cloudSaveWorkshopManager(m));
  } catch (e) {
    console.error('Error saving workshop managers to localStorage', e);
  }
}

export function saveStoredWorkshopManager(manager: WorkshopManagerAccount) {
  try {
    const current = getStoredWorkshopManagers();
    const updated = [
      manager,
      ...current.filter((m) => m.id !== manager.id && m.email.toLowerCase() !== manager.email.toLowerCase()),
    ];
    saveStoredWorkshopManagers(updated);
  } catch (e) {
    console.error('Error saving individual workshop manager', e);
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
        safeSaveAlistamientosToLocalStorage(remainingAls);
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
        safeSaveWarrantiesToLocalStorage(remainingW);
        window.dispatchEvent(new Event('starmotos_warranties_updated'));
      }
    } catch (_) {}

    // 5. Limpiar órdenes de taller vinculadas a este cliente
    try {
      const currentOrders = getStoredOrders();
      const remainingOrders = currentOrders.filter(
        (o) =>
          o.clientIdNumber !== clean &&
          o.alistamientoId !== clean &&
          (target?.idNumber ? o.clientIdNumber !== target.idNumber : true)
      );
      if (remainingOrders.length !== currentOrders.length) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(remainingOrders));
        window.dispatchEvent(new Event('starmotos_orders_updated'));
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
    id: 'tec-03',
    name: 'DAVID CARRERA',
    workshopId: 'taller-buena-fe',
    workshopName: 'StarMotos Sucursal Buena Fe',
    specialty: 'Inyección Electrónica & Frenos ABS',
    phone: '0939316698',
    status: 'activo',
    activeOrdersCount: 0,
  },
];

export function getStoredTechnicians(): Technician[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TECHNICIANS);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading technicians from localStorage', e);
  }
  return INITIAL_TECHNICIANS;
}

export function saveStoredTechnicians(technicians: Technician[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(technicians));
    window.dispatchEvent(new Event('starmotos_technicians_updated'));
    // Persistir cada técnico a Supabase
    technicians.forEach((t) => cloudSaveTechnician(t));
  } catch (e) {
    console.error('Error saving technicians to localStorage', e);
  }
}

export function deleteStoredTechnician(id: string) {
  try {
    const current = getStoredTechnicians();
    const updated = current.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(updated));
    window.dispatchEvent(new Event('starmotos_technicians_updated'));
    cloudDeleteTechnician(id);
  } catch (e) {
    console.error('Error deleting technician from localStorage', e);
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
      return parsed
        .filter(
          (r) =>
            r &&
            r.id &&
            !isDeletedTombstone(r.id) &&
            (!r.cedulaRuc || !isDeletedTombstone(r.cedulaRuc.trim()))
        )
        .map((r) => {
          let updated = false;
          let fotos = r.fotos;
          if (Array.isArray(fotos)) {
            const cleanFotos = fotos.filter((f) => {
              if (typeof f === 'string' && f.startsWith('data:')) {
                return isValidDataUrl(f);
              }
              return Boolean(f);
            });
            if (cleanFotos.length !== fotos.length) {
              fotos = cleanFotos;
              updated = true;
            }
          }
          let ev = r.evidenciaTransferencia;
          if (typeof ev === 'string' && ev.startsWith('data:') && !isValidDataUrl(ev)) {
            ev = '';
            updated = true;
          }
          if (updated) {
            return { ...r, fotos, evidenciaTransferencia: ev };
          }
          return r;
        });
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
    safeSaveAlistamientosToLocalStorage(cleanList);
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
    const target = stored.find((r) => r.id === clean);

    // Si es un ID de alistamiento específico, sólo lapidar ese ID (nunca la cédula del cliente)
    if (clean.startsWith('als-')) {
      addDeletedTombstone(clean, target?.id);
    } else {
      addDeletedTombstone(clean, target?.id, target?.cedulaRuc);
    }

    const current = stored.filter((r) => r.id !== clean);
    safeSaveAlistamientosToLocalStorage(current);
    window.dispatchEvent(new Event('starmotos_alistamientos_updated'));
    cloudDeleteAlistamiento(clean);

    // Eliminar también en cascada cualquier orden de trabajo vinculada a este alistamiento
    const allOrders = getStoredOrders();
    const updatedOrders = allOrders.filter(
      (o) => o.alistamientoId !== clean && o.id !== clean
    );
    if (updatedOrders.length !== allOrders.length) {
      saveStoredOrders(updatedOrders);
    }
  } catch (e) {
    console.error('Error deleting alistamiento', e);
  }
}


// ===================== CALIFICACIONES DE SERVICIOS TALLER =====================

export const INITIAL_RATINGS: OrderRating[] = [];

export function getStoredRatings(): OrderRating[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RATINGS);
    let items: OrderRating[] = [];
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Descartar cualquier calificación ficticia / mock heredada
        items = parsed.filter(
          (r) => r && r.id && !r.id.startsWith('rat-matriz-') && !r.id.startsWith('rat-suc-')
        );
      }
    }
    // También incluir calificaciones reales adjuntas a las órdenes almacenadas
    const ordersRaw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (ordersRaw) {
      try {
        const parsedOrders = JSON.parse(ordersRaw);
        if (Array.isArray(parsedOrders)) {
          for (const ord of parsedOrders) {
            if (ord.rating && ord.rating.stars) {
              const r = ord.rating as OrderRating;
              if (
                !r.id.startsWith('rat-matriz-') &&
                !r.id.startsWith('rat-suc-') &&
                !items.some((existing) => existing.id === r.id || existing.orderId === (r.orderId || ord.id))
              ) {
                items.push(r);
              }
            }
          }
        }
      } catch (_) {}
    }
    return items;
  } catch (e) {
    console.error('Error reading ratings from localStorage', e);
    return [];
  }
}

export function saveStoredRating(rating: OrderRating) {
  try {
    const current = getStoredRatings();
    const updated = [rating, ...current.filter((r) => r.id !== rating.id && r.orderId !== rating.orderId)];
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(updated));
    window.dispatchEvent(new Event('starmotos_ratings_updated'));
    cloudSaveRating(rating);
  } catch (e) {
    console.error('Error saving rating to localStorage', e);
  }
}

export function isOrderRated(orderId: string): boolean {
  const ratings = getStoredRatings();
  return ratings.some((r) => r.orderId === orderId || r.otNumber === orderId);
}

/**
 * Actualiza la cédula/RUC de un cliente y propaga el cambio en cascada a todos los
 * registros relacionados en el sistema: Ficha del Cliente, Alistamientos y Garantías.
 */
export function updateClientCedulaCascade(
  oldCedula: string,
  newCedula: string,
  extraData?: Partial<TallerClient>
): boolean {
  const cleanOld = (oldCedula || '').trim();
  const cleanNew = (newCedula || '').trim();
  if (!cleanNew) return false;

  try {
    // 1. Actualizar en la base de clientes (TallerClient)
    const storedClients = getStoredClients();
    let clientToSync: TallerClient | null = null;
    const clientIdx = storedClients.findIndex(
      (c) => c.idNumber && c.idNumber.trim() === cleanOld
    );

    if (clientIdx >= 0) {
      storedClients[clientIdx] = {
        ...storedClients[clientIdx],
        ...extraData,
        idNumber: cleanNew,
      };
      clientToSync = storedClients[clientIdx];
      saveStoredClients(storedClients);
    } else if (extraData) {
      const newEntry: TallerClient = {
        id: `cli-${Date.now()}`,
        fullName: extraData.fullName || 'Cliente',
        idNumber: cleanNew,
        phone: extraData.phone || '',
        email: extraData.email || '',
        address: extraData.address || '',
        motorcycleBrand: extraData.motorcycleBrand || 'Moto',
        motorcycleModel: extraData.motorcycleModel || '',
        motorcyclePlate: extraData.motorcyclePlate || '',
        motorcycleVin: extraData.motorcycleVin || '',
        motorNumber: extraData.motorNumber,
        color: extraData.color,
        motorcycleMileage: extraData.motorcycleMileage || 0,
        workshopName: extraData.workshopName || 'StarMotos',
        workshopId: extraData.workshopId || 'taller-principal',
        totalVisits: extraData.totalVisits || 1,
        lastVisit: extraData.lastVisit || new Date().toISOString().split('T')[0],
      };
      storedClients.unshift(newEntry);
      clientToSync = newEntry;
      saveStoredClients(storedClients);
    }

    if (clientToSync) {
      cloudSaveClient(clientToSync);
    }

    // 2. Propagar en Alistamientos
    if (cleanOld && cleanOld !== cleanNew) {
      const storedAls = getStoredFullAlistamientos();
      let alsChanged = false;
      const updatedAls = storedAls.map((r) => {
        if (r.cedulaRuc && r.cedulaRuc.trim() === cleanOld) {
          alsChanged = true;
          return {
            ...r,
            cedulaRuc: cleanNew,
            nombres: extraData?.fullName ? extraData.fullName.split(' ')[0] : r.nombres,
            apellidos: extraData?.fullName ? extraData.fullName.split(' ').slice(1).join(' ') : r.apellidos,
            celular1: extraData?.phone || r.celular1,
            email: extraData?.email || r.email,
            direccion: extraData?.address || r.direccion,
            modeloMarca: extraData?.motorcycleModel || r.modeloMarca,
            placa: extraData?.motorcyclePlate || r.placa,
            chasis: extraData?.motorcycleVin || r.chasis,
          };
        }
        return r;
      });

      if (alsChanged) {
        saveStoredFullAlistamientos(updatedAls);
      }

      // 3. Propagar en Garantías
      try {
        const rawWar = localStorage.getItem(STORAGE_KEYS.WARRANTIES);
        if (rawWar) {
          const warList: WarrantyRequest[] = JSON.parse(rawWar);
          let warChanged = false;
          const updatedWars = warList.map((w) => {
            if (w.clientIdNumber && w.clientIdNumber.trim() === cleanOld) {
              warChanged = true;
              const updatedW: WarrantyRequest = {
                ...w,
                clientIdNumber: cleanNew,
                clientName: extraData?.fullName || w.clientName,
                clientPhone: extraData?.phone || w.clientPhone,
              };
              cloudSaveWarranty(updatedW);
              return updatedW;
            }
            return w;
          });
          if (warChanged) {
            safeSaveWarrantiesToLocalStorage(updatedWars);
            window.dispatchEvent(new Event('starmotos_warranties_updated'));
          }
        }
      } catch (_) {}
    }

    return true;
  } catch (err) {
    console.error('Error al actualizar cédula en cascada:', err);
    return false;
  }
}

// Función para reiniciar todos los módulos a vacío en pruebas
export function resetAllSystemData() {
  localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify([]));
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

// =========================================================================
// GESTIÓN DE PENDIENTES & AGENDAMIENTO (MATRIZ / ADMINISTRACIÓN)
// =========================================================================

export const INITIAL_PENDIENTES: AdminPendiente[] = [
  {
    id: 'pend-1',
    title: 'Comprar kit de cilindro y pistón Shineray XY250',
    description: 'Repuesto solicitado para moto en taller. Cotizar urgente con distribuidor de Guayaquil.',
    category: 'repuesto',
    priority: 'alta',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueTime: '10:00',
    estimatedCost: 85.0,
    workshopName: 'StarMotos Matriz La Maná',
    workshopId: 'matriz-la-mana',
    relatedClientOrBike: 'Shineray XY250 - Placa LAB-1204',
    completed: false,
    createdAt: new Date().toISOString(),
    createdBy: 'Administrador Matriz',
  },
  {
    id: 'pend-2',
    title: 'Pedir juego de neumáticos doble propósito 110/90-17',
    description: 'Stock bajo en bodega central para despacho a sucursales.',
    category: 'compra',
    priority: 'media',
    dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    dueTime: '15:30',
    estimatedCost: 110.0,
    workshopName: 'StarMotos Matriz La Maná',
    workshopId: 'matriz-la-mana',
    relatedClientOrBike: 'Bodega Central Matriz',
    completed: false,
    createdAt: new Date().toISOString(),
    createdBy: 'Administrador Matriz',
  },
  {
    id: 'pend-3',
    title: 'Confirmar retiro de Benelli TRK 502 alistada',
    description: 'Llamar al cliente para coordinar entrega formal y entrega de kit de herramientas.',
    category: 'llamada',
    priority: 'baja',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '17:00',
    estimatedCost: 0,
    workshopName: 'StarMotos Matriz La Maná',
    workshopId: 'matriz-la-mana',
    relatedClientOrBike: 'Benelli TRK 502X - Juan Pérez',
    completed: false,
    createdAt: new Date().toISOString(),
    createdBy: 'Administrador Matriz',
  },
];

export function getStoredPendientes(): AdminPendiente[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDIENTES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error al leer pendientes de localStorage:', e);
  }
  return INITIAL_PENDIENTES;
}

export function saveStoredPendientes(pendientes: AdminPendiente[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PENDIENTES, JSON.stringify(pendientes));
    window.dispatchEvent(new Event('starmotos_pendientes_updated'));
    pendientes.forEach((p) => cloudSavePendiente(p));
  } catch (e) {
    console.error('Error al guardar pendientes en localStorage:', e);
  }
}

export function deleteStoredPendiente(id: string) {
  try {
    const current = getStoredPendientes();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PENDIENTES, JSON.stringify(updated));
    window.dispatchEvent(new Event('starmotos_pendientes_updated'));
    cloudDeletePendiente(id);
  } catch (e) {
    console.error('Error al eliminar pendiente:', e);
  }
}

// =========================================================================
// AGENDAMIENTO DE CITAS TÉCNICAS (CLIENTES Y JEFES DE TALLER)
// =========================================================================

export const INITIAL_AGENDAMIENTOS: AgendamientoTicket[] = [
  {
    id: 'AGN-804192',
    ticketNumber: 'TKT-804192',
    clientName: 'Carlos Alberto Zambrano Morales',
    clientCedula: '1205847392',
    clientPhone: '0987654321',
    clientEmail: 'carlos.zambrano@gmail.com',
    motoPlate: 'AB-892C',
    motoModel: 'Benelli TRK 502X',
    motoBrand: 'Benelli',
    motoChasis: 'LBB502X872164920',
    motoYear: 2025,
    workshopId: 'matriz-la-mana',
    workshopName: 'StarMotos Matriz La Maná',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    scheduledTime: '09:30 AM',
    serviceId: 'alistamiento_pdi',
    serviceTitle: 'Alistamiento PDI (Inspección y Puesta a Punto)',
    serviceCategory: 'Alistamiento',
    estimatedCost: 0,
    notes: 'Revisión y torqueo previo a rodaje.',
    status: 'confirmado',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'AGN-912403',
    ticketNumber: 'TKT-912403',
    clientName: 'María Elena Mendoza Castro',
    clientCedula: '0928374651',
    clientPhone: '0991234567',
    clientEmail: 'maria.mendoza@hotmail.com',
    motoPlate: 'IC-304D',
    motoModel: 'Shineray XY 200 GY',
    motoBrand: 'Shineray',
    motoChasis: 'LL8XY200938172641',
    motoYear: 2024,
    workshopId: 'matriz-la-mana',
    workshopName: 'StarMotos Matriz La Maná',
    scheduledDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    scheduledTime: '14:00 PM',
    serviceId: 'engrasado',
    serviceTitle: 'Engrasado General',
    serviceCategory: 'Mantenimiento',
    estimatedCost: 25,
    notes: 'Ajuste de kit de transmisión y engrase de ejes.',
    status: 'confirmado',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Verifica si un agendamiento ha superado las 24 horas después de la fecha/hora agendada
 */
export function isAgendamientoExpired(agendamiento: AgendamientoTicket): boolean {
  try {
    if (!agendamiento || !agendamiento.scheduledDate) return false;
    const parts = agendamiento.scheduledDate.split('-').map(Number);
    if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return false;
    const [year, month, day] = parts;

    let hours = 18;
    let minutes = 0;
    if (agendamiento.scheduledTime) {
      const match = agendamiento.scheduledTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const ampm = (match[3] || '').toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        hours = h;
        minutes = m;
      }
    }

    const scheduledTimestamp = new Date(year, month - 1, day, hours, minutes, 0).getTime();
    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    return (now - scheduledTimestamp) >= TWENTY_FOUR_HOURS_MS;
  } catch (_) {
    return false;
  }
}

/**
 * Limpia y purga automáticamente agendamientos que ya cumplieron 24h tras la fecha programada
 */
export function cleanExpiredAgendamientos(): AgendamientoTicket[] {
  try {
    let all: AgendamientoTicket[] = [];
    const raw = localStorage.getItem(STORAGE_KEYS.AGENDAMIENTOS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) all = parsed;
    } else {
      all = [...INITIAL_AGENDAMIENTOS];
    }

    const valid: AgendamientoTicket[] = [];
    let hasDeleted = false;

    for (const item of all) {
      if (isAgendamientoExpired(item)) {
        hasDeleted = true;
        cloudDeleteAgendamiento(item.id);
        syncBus?.postMessage({ type: 'AGENDAMIENTO_DELETED', id: item.id });
      } else {
        valid.push(item);
      }
    }

    if (hasDeleted) {
      localStorage.setItem(STORAGE_KEYS.AGENDAMIENTOS, JSON.stringify(valid));
      window.dispatchEvent(new Event('starmotos_agendamientos_updated'));
    }
    return valid;
  } catch (e) {
    console.error('Error al depurar agendamientos expirados:', e);
    return getStoredAgendamientos();
  }
}

export function getStoredAgendamientos(): AgendamientoTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AGENDAMIENTOS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => !isAgendamientoExpired(item));
      }
    }
  } catch (e) {
    console.error('Error al leer agendamientos de localStorage:', e);
  }
  return INITIAL_AGENDAMIENTOS.filter((item) => !isAgendamientoExpired(item));
}

export function saveStoredAgendamientos(items: AgendamientoTicket[]) {
  try {
    const valid = items.filter((item) => !isAgendamientoExpired(item));
    localStorage.setItem(STORAGE_KEYS.AGENDAMIENTOS, JSON.stringify(valid));
    window.dispatchEvent(new Event('starmotos_agendamientos_updated'));
    valid.forEach((a) => cloudSaveAgendamiento(a));
  } catch (e) {
    console.error('Error al guardar agendamientos en localStorage:', e);
  }
}

export function addStoredAgendamiento(item: AgendamientoTicket) {
  try {
    const current = getStoredAgendamientos();
    const updated = [item, ...current.filter((a) => a.id !== item.id)];
    localStorage.setItem(STORAGE_KEYS.AGENDAMIENTOS, JSON.stringify(updated));
    window.dispatchEvent(new Event('starmotos_agendamientos_updated'));
    cloudSaveAgendamiento(item);
    syncBus?.postMessage({ type: 'AGENDAMIENTO_SAVED', payload: item });
  } catch (e) {
    console.error('Error al agregar agendamiento:', e);
  }
}

export function deleteStoredAgendamiento(id: string) {
  try {
    const current = getStoredAgendamientos();
    const updated = current.filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.AGENDAMIENTOS, JSON.stringify(updated));
    window.dispatchEvent(new Event('starmotos_agendamientos_updated'));
    cloudDeleteAgendamiento(id);
    syncBus?.postMessage({ type: 'AGENDAMIENTO_DELETED', id });
  } catch (e) {
    console.error('Error al eliminar agendamiento:', e);
  }
}

// ==============================================================
// --- MÓDULO GPS (MATRIZ & GPS SERVICIOS) ---
// ==============================================================

export const INITIAL_GPS_PROFILE: GpsProfile = {
  id: 'gps-operator-1',
  fullName: 'Ing. David Salazar',
  email: 'gps@starmotos.ec',
  phone: '+593 98 765 4321',
  roleTitle: 'Operador Técnico GPS Servicios',
  companyName: 'StarMotos GPS Servicios',
};

export const INITIAL_GPS_RECORDS: GpsRecord[] = [
  {
    id: 'gps-001',
    ticketNumber: 'GPS-2026-001',
    fechaSolicitud: '2026-09-01',
    horaSolicitud: '10:30',
    nombres: 'Carlos Andrés',
    apellidos: 'Mendoza Loor',
    cedulaRuc: '1205849302',
    celular1: '0987654321',
    celular2: '0991234567',
    celular3: '0956781234',
    email: 'carlos.mendoza@gmail.com',
    direccion: 'Av. 10 de Agosto y Colombia, La Maná',
    modeloMarca: 'Shineray XY200GY',
    placa: 'IB849X',
    chasis: 'L8E2024XY90123',
    numeroMotor: '163FML202488',
    color: 'Rojo / Blanco',
    year: 2024,
    kilometraje: 4200,
    serieGps: '864920048192837',
    serieChip: '8959300182947192830',
    fechaInicio: '2026-09-01',
    fechaVencimiento: '2027-09-01',
    valorServicio: 120.0,
    montoPagado: 120.0,
    abono: 120.0,
    saldoPendiente: 0.0,
    metodoPago: 'Efectivo',
    observaciones: 'Instalación oculta en chasis bajo el tanque. Prueba de corte de corriente satisfactoria.',
    estado: 'activa',
    gpsUser: 'carlos.mendoza',
    gpsPassword: 'MotoGps2026*',
    fechaAprobacion: '2026-09-02',
    aprobadoPor: 'Operador GPS Central',
    createdAt: '2026-09-01T10:30:00Z',
    updatedAt: '2026-09-02T11:15:00Z',
  },
  {
    id: 'gps-002',
    ticketNumber: 'GPS-2026-002',
    fechaSolicitud: '2026-09-25',
    horaSolicitud: '14:20',
    nombres: 'Jessica Paola',
    apellidos: 'Guerrero Cárdenas',
    cedulaRuc: '1723849102',
    celular1: '0998472910',
    celular2: '0983726194',
    celular3: '0972615483',
    email: 'jessica.guerrero@outlook.com',
    direccion: 'Calle Guayaquil y Cotopaxi, La Maná',
    modeloMarca: 'Honda Tornado XR 250',
    placa: 'HQ502P',
    chasis: '9C2MD3804829102',
    numeroMotor: 'MD38E109283',
    color: 'Negro con detalles rojos',
    year: 2025,
    kilometraje: 1500,
    serieGps: '867104928193021',
    serieChip: '8959300482910294820',
    fechaInicio: '2026-09-25',
    fechaVencimiento: '2027-09-25',
    valorServicio: 135.0,
    montoPagado: 50.0,
    abono: 50.0,
    saldoPendiente: 85.0,
    metodoPago: 'Transferencia',
    observaciones: 'Cliente solicita sensor de movimiento y geocerca configurada en La Maná.',
    estado: 'pendiente',
    createdAt: '2026-09-25T14:20:00Z',
    updatedAt: '2026-09-25T14:20:00Z',
  },
];

export function getStoredGpsRecords(): GpsRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GPS_RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error al leer registros GPS de localStorage:', e);
  }
  return INITIAL_GPS_RECORDS;
}

export function saveStoredGpsRecords(records: GpsRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.GPS_RECORDS, JSON.stringify(records));
    window.dispatchEvent(new Event('starmotos_gps_updated'));
    syncBus?.postMessage({ type: 'GPS_UPDATED', payload: records });
  } catch (e) {
    console.error('Error al guardar registros GPS en localStorage:', e);
  }
}

export function saveStoredGpsRecord(record: GpsRecord) {
  try {
    const current = getStoredGpsRecords();
    const idx = current.findIndex((r) => r.id === record.id);
    let updated: GpsRecord[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...record, updatedAt: new Date().toISOString() };
    } else {
      updated = [{ ...record, createdAt: record.createdAt || new Date().toISOString() }, ...current];
    }
    saveStoredGpsRecords(updated);
  } catch (e) {
    console.error('Error al guardar registro GPS individual:', e);
  }
}

export function deleteStoredGpsRecord(id: string) {
  try {
    const current = getStoredGpsRecords();
    const updated = current.filter((r) => r.id !== id);
    saveStoredGpsRecords(updated);
  } catch (e) {
    console.error('Error al eliminar registro GPS:', e);
  }
}

export function getStoredGpsProfile(): GpsProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GPS_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return { ...INITIAL_GPS_PROFILE, ...parsed };
    }
  } catch (e) {
    console.error('Error al leer perfil GPS:', e);
  }
  return INITIAL_GPS_PROFILE;
}

export function saveStoredGpsProfile(profile: GpsProfile) {
  try {
    localStorage.setItem(STORAGE_KEYS.GPS_PROFILE, JSON.stringify(profile));
    window.dispatchEvent(new Event('starmotos_gps_profile_updated'));
  } catch (e) {
    console.error('Error al guardar perfil GPS:', e);
  }
}


