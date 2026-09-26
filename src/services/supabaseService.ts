// src/services/supabaseService.ts
import { supabase } from '../lib/supabase';
import {
  WarrantyRequest,
  AlistamientoFullRecord,
  TallerClient,
  SystemAlert,
  TallerOrder,
  AdminInvoice,
  Technician,
  GaranteProfile,
  WorkshopManagerAccount,
  DictamenRecord,
  AdminPendiente,
} from '../types/customer';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { uploadWarrantyMedia, saveMediaToIndexedDB } from './mediaStorage';

let isRealtimeInitialized = false;
let isSyncing = false;

// =========================================================================
// 0. CONTROL PERSISTENTE DE REGISTROS ELIMINADOS (TOMBSTONES ANTI-REAPARICIÓN)
// =========================================================================

const TOMBSTONES_STORAGE_KEY = 'starmotos_deleted_tombstones_v1';
const TOMBSTONES_SHARED_STORAGE_KEY = 'starmotos_shared_deleted_tombstones_v1';

// Bus de sincronización inter-pestañas en tiempo real
export const syncBus = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('starmotos_sync_bus')
  : null;

if (syncBus) {
  syncBus.onmessage = (event) => {
    if (event.data?.type === 'WARRANTY_DELETED' && Array.isArray(event.data.ids)) {
      addDeletedTombstone(...event.data.ids);
      const raw = localStorage.getItem(STORAGE_KEYS.WARRANTIES);
      if (raw) {
        try {
          const current: WarrantyRequest[] = JSON.parse(raw);
          const filtered = current.filter(
            (w) => !event.data.ids.includes(w.id) && (!w.requestNumber || !event.data.ids.includes(w.requestNumber))
          );
          safeSaveWarrantiesToLocalStorage(filtered as any);
          window.dispatchEvent(new Event('starmotos_warranties_updated'));
        } catch (_) {}
      }
    }
  };
}

export function getDeletedTombstones(): Set<string> {
  try {
    const raw = localStorage.getItem(TOMBSTONES_STORAGE_KEY) || localStorage.getItem(TOMBSTONES_SHARED_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return new Set(list.map((s) => String(s).trim()).filter(Boolean));
      }
    }
  } catch (e) {
    console.error('Error reading tombstones', e);
  }
  return new Set<string>();
}

export function addDeletedTombstone(...ids: (string | undefined | null)[]) {
  try {
    const current = getDeletedTombstones();
    let added = false;
    const cleanList: string[] = [];
    for (const id of ids) {
      if (!id) continue;
      const clean = String(id).trim();
      if (clean) {
        cleanList.push(clean);
        if (!current.has(clean)) {
          current.add(clean);
          added = true;
        }
      }
    }
    if (added) {
      const serialized = JSON.stringify(Array.from(current));
      localStorage.setItem(TOMBSTONES_STORAGE_KEY, serialized);
      localStorage.setItem(TOMBSTONES_SHARED_STORAGE_KEY, serialized);

      // Notificar a otras pestañas instantáneamente
      syncBus?.postMessage({ type: 'WARRANTY_DELETED', ids: cleanList });

      // Persistir en tabla deleted_tombstones de Supabase para toda la red de sedes
      if (cleanList.length > 0) {
        const rows = cleanList.map((cleanId) => ({
          id: cleanId,
          record_type: 'warranty',
          created_at: new Date().toISOString(),
        }));
        supabase.from('deleted_tombstones').upsert(rows, { onConflict: 'id' }).then(({ error }) => {
          if (error) console.warn('[Supabase] Warning guardando deleted_tombstones:', error.message);
        });
      }
    }
  } catch (e) {
    console.error('Error adding tombstone', e);
  }
}

export function removeDeletedTombstone(...ids: (string | undefined | null)[]) {
  try {
    const current = getDeletedTombstones();
    let removed = false;
    for (const id of ids) {
      if (!id) continue;
      const clean = String(id).trim();
      if (clean && current.has(clean)) {
        current.delete(clean);
        removed = true;
      }
    }
    if (removed) {
      const serialized = JSON.stringify(Array.from(current));
      localStorage.setItem(TOMBSTONES_STORAGE_KEY, serialized);
      localStorage.setItem(TOMBSTONES_SHARED_STORAGE_KEY, serialized);
      for (const id of ids) {
        if (id) {
          const clean = String(id).trim();
          supabase.from('deleted_tombstones').delete().eq('id', clean).then(() => {});
        }
      }
    }
  } catch (e) {
    console.error('Error removing tombstone', e);
  }
}

export function isDeletedTombstone(id?: string | null): boolean {
  if (!id) return false;
  const clean = String(id).trim();
  if (!clean) return false;
  return getDeletedTombstones().has(clean);
}

/**
 * Guarda alistamientos en LocalStorage de forma segura con protección contra límite de cuota (QuotaExceededError).
 * Si las fotos en Base64 exceden el espacio del navegador (~5MB), las fotos pesadas se respaldan
 * en IndexedDB y se almacena una versión optimizada y ligera en LocalStorage para garantizar que NUNCA
 * se bloquee la visualización de alistamientos en Matriz ni en ninguna sede.
 */
export function safeSaveAlistamientosToLocalStorage(records: AlistamientoFullRecord[]): boolean {
  if (!records || !Array.isArray(records)) return false;

  const sanitizeAlistamiento = (r: AlistamientoFullRecord, stripMediaCompletely = false): AlistamientoFullRecord => {
    const copy = { ...r };

    // 1. Fotos
    if (Array.isArray(copy.fotos) && copy.fotos.length > 0) {
      if (stripMediaCompletely) {
        copy.fotos = [];
      } else {
        copy.fotos = copy.fotos.map((f, i) => {
          if (typeof f === 'string') {
            if (f.startsWith('http://') || f.startsWith('https://')) return f;
            if (f.length > 2000) {
              const idbKey = `als_foto_${r.id}_${i}`;
              try {
                saveMediaToIndexedDB(idbKey, f);
              } catch (_) {}
              return `idb:${idbKey}`;
            }
          }
          return f;
        });
      }
    }

    // 2. Evidencia de Transferencia
    if (typeof copy.evidenciaTransferencia === 'string') {
      if (stripMediaCompletely) {
        copy.evidenciaTransferencia = '';
      } else if (!copy.evidenciaTransferencia.startsWith('http://') && !copy.evidenciaTransferencia.startsWith('https://') && copy.evidenciaTransferencia.length > 2000) {
        const idbKey = `als_evidencia_${r.id}`;
        try {
          saveMediaToIndexedDB(idbKey, copy.evidenciaTransferencia);
        } catch (_) {}
        copy.evidenciaTransferencia = `idb:${idbKey}`;
      }
    }

    // 3. Comprobante Pago URL
    if (typeof copy.comprobantePagoUrl === 'string') {
      if (stripMediaCompletely) {
        copy.comprobantePagoUrl = '';
      } else if (!copy.comprobantePagoUrl.startsWith('http://') && !copy.comprobantePagoUrl.startsWith('https://') && copy.comprobantePagoUrl.length > 2000) {
        const idbKey = `als_comprobante_${r.id}`;
        try {
          saveMediaToIndexedDB(idbKey, copy.comprobantePagoUrl);
        } catch (_) {}
        copy.comprobantePagoUrl = `idb:${idbKey}`;
      }
    }

    return copy;
  };

  try {
    // Proactivamente sanitizamos para evitar saturar el LocalStorage
    const sanitized = records.map((r) => sanitizeAlistamiento(r, false));
    localStorage.setItem(STORAGE_KEYS.ALISTAMIENTOS, JSON.stringify(sanitized));
    return true;
  } catch (quotaErr) {
    try {
      // Fallback Nivel 2: Limpieza completa de fotos/evidencias manteniendo datos operacionales íntegros
      const stripped = records.map((r) => sanitizeAlistamiento(r, true));
      localStorage.setItem(STORAGE_KEYS.ALISTAMIENTOS, JSON.stringify(stripped));
      return true;
    } catch (quotaErr2) {
      console.warn('[Storage] Advertencia al persistir alistamientos en LocalStorage:', quotaErr2);
      return false;
    }
  }
}

/**
 * Sanitiza y guarda garantías en LocalStorage de forma ultra ligera y segura.
 */
export function safeSaveWarrantiesToLocalStorage(warranties: WarrantyRequest[]): boolean {
  if (!warranties || !Array.isArray(warranties)) return false;

  const sanitizeWarranty = (w: WarrantyRequest, stripMediaCompletely = false): WarrantyRequest => {
    const copy = { ...w };
    if (Array.isArray(copy.diagnosticPhotos) && copy.diagnosticPhotos.length > 0) {
      if (stripMediaCompletely) {
        copy.diagnosticPhotos = [];
      } else {
        copy.diagnosticPhotos = copy.diagnosticPhotos.map((item: any, idx: number) => {
          if (typeof item === 'string') {
            if (item.startsWith('http://') || item.startsWith('https://')) return item;
            if (item.length > 2000) {
              const idbKey = `${w.id}_media_${idx}`;
              try {
                saveMediaToIndexedDB(idbKey, item);
              } catch (_) {}
              return `idb:${idbKey}`;
            }
          }
          return item;
        });
      }
    }
    return copy;
  };

  try {
    const sanitized = warranties.map((w) => sanitizeWarranty(w, false));
    localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(sanitized));
    return true;
  } catch (quotaErr) {
    try {
      const stripped = warranties.map((w) => sanitizeWarranty(w, true));
      localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(stripped));
      return true;
    } catch (err2) {
      console.warn('[Storage] Advertencia al persistir garantías en LocalStorage:', err2);
      return false;
    }
  }
}

// =========================================================================
// 1. SINCRONIZACIÓN BIDIRECCIONAL INTELIGENTE (NUBE <-> LOCAL)
// =========================================================================

export async function syncAllFromSupabase(): Promise<{
  warrantiesCount: number;
  alistamientosCount: number;
  clientsCount: number;
  alertsCount: number;
}> {
  if (isSyncing) {
    return { warrantiesCount: 0, alistamientosCount: 0, clientsCount: 0, alertsCount: 0 };
  }
  isSyncing = true;

  try {
    // 0. Sincronizar registros eliminados (tombstones) globales desde Supabase primero
    try {
      const { data: cloudTombstones } = await supabase.from('deleted_tombstones').select('id');
      if (cloudTombstones && Array.isArray(cloudTombstones)) {
        addDeletedTombstone(...cloudTombstones.map((t) => t.id));
      }
    } catch (_) {}

    const tombstones = getDeletedTombstones();

    // -----------------------------------------------------------------------
    // 1. GARANTÍAS (RECLAMOS)
    // -----------------------------------------------------------------------
    let warrantiesCount = 0;
    try {
      const { data: warrantiesData, error: warErr } = await supabase
        .from('warranties')
        .select('data')
        .order('updated_at', { ascending: false });

      if (!warErr) {
        const rawCloudWarranties: WarrantyRequest[] = (warrantiesData || [])
          .map((row) => row.data as WarrantyRequest)
          .filter(Boolean);

        // Filtrar únicamente garantías explícitamente eliminadas (tombstones)
        const cloudWarranties: WarrantyRequest[] = [];
        for (const w of rawCloudWarranties) {
          if (!w || !w.id) continue;
          const isDeleted =
            tombstones.has(w.id) ||
            (w.requestNumber && tombstones.has(w.requestNumber));

          if (isDeleted) {
            cloudDeleteWarranty(w.id, w.requestNumber);
          } else {
            cloudWarranties.push(w);
          }
        }

        // Fusión bidireccional inteligente: no pisar garantías locales recién emitidas ni resucitar eliminadas
        const existingLocalRaw = localStorage.getItem(STORAGE_KEYS.WARRANTIES);
        let localList: WarrantyRequest[] = [];
        if (existingLocalRaw) {
          try {
            localList = JSON.parse(existingLocalRaw);
          } catch (_) {}
        }
        const cloudIds = new Set(cloudWarranties.map((w) => w.id));
        const mergedWarranties = [...cloudWarranties];
        for (const loc of localList) {
          if (!loc || !loc.id) continue;
          const isTombstoned =
            tombstones.has(loc.id) ||
            (loc.requestNumber && tombstones.has(loc.requestNumber));

          if (isTombstoned) {
            // Proactivamente asegurar eliminación en la nube y no reincorporar
            cloudDeleteWarranty(loc.id, loc.requestNumber);
            continue;
          }

          if (!cloudIds.has(loc.id)) {
            mergedWarranties.push(loc);
            cloudSaveWarranty(loc);
          }
        }

        safeSaveWarrantiesToLocalStorage(mergedWarranties);
        window.dispatchEvent(new Event('starmotos_warranties_updated'));
        warrantiesCount = mergedWarranties.length;
      }
    } catch (e) {
      console.warn('Error sincronizando garantías:', e);
    }

    // -----------------------------------------------------------------------
    // 2. ALISTAMIENTOS PDI & SERVICIO
    // -----------------------------------------------------------------------
    let alistamientosCount = 0;
    try {
      const { data: alsData, error: alsErr } = await supabase
        .from('full_alistamientos')
        .select('data')
        .order('updated_at', { ascending: false });

      if (!alsErr) {
        const rawCloudAlistamientos: AlistamientoFullRecord[] = (alsData || [])
          .map((row) => row.data as AlistamientoFullRecord)
          .filter(Boolean);

        // Filtrar alistamientos eliminados (tombstones) y eliminarlos proactivamente de Supabase
        const cloudAlistamientos: AlistamientoFullRecord[] = [];
        for (const a of rawCloudAlistamientos) {
          if (!a || !a.id) continue;
          const isDeleted =
            tombstones.has(a.id) ||
            (a.cedulaRuc && tombstones.has(a.cedulaRuc.trim()));

          if (isDeleted) {
            cloudDeleteAlistamiento(a.id);
          } else {
            cloudAlistamientos.push(a);
          }
        }

        // Fusión bidireccional inteligente: no pisar alistamientos locales no sincronizados
        const existingLocalRaw = localStorage.getItem(STORAGE_KEYS.ALISTAMIENTOS);
        let localList: AlistamientoFullRecord[] = [];
        if (existingLocalRaw) {
          try {
            localList = JSON.parse(existingLocalRaw);
          } catch (_) {}
        }
        const cloudIds = new Set(cloudAlistamientos.map((a) => a.id));
        const mergedAlistamientos = [...cloudAlistamientos];
        for (const loc of localList) {
          if (!loc || !loc.id) continue;
          const isTombstoned =
            tombstones.has(loc.id) ||
            (loc.cedulaRuc && tombstones.has(loc.cedulaRuc.trim()));

          if (isTombstoned) {
            cloudDeleteAlistamiento(loc.id);
            continue;
          }

          if (!cloudIds.has(loc.id)) {
            mergedAlistamientos.push(loc);
            cloudSaveAlistamiento(loc);
          }
        }

        safeSaveAlistamientosToLocalStorage(mergedAlistamientos);
        window.dispatchEvent(new Event('starmotos_alistamientos_updated'));
        alistamientosCount = mergedAlistamientos.length;
      }
    } catch (e) {
      console.warn('Error sincronizando alistamientos:', e);
    }

    // -----------------------------------------------------------------------
    // 3. CLIENTES & FLOTA
    // -----------------------------------------------------------------------
    let clientsCount = 0;
    try {
      const { data: clientsData, error: cliErr } = await supabase
        .from('clients')
        .select('data')
        .order('updated_at', { ascending: false });

      if (!cliErr) {
        const rawCloudClients: TallerClient[] = (clientsData || [])
          .map((row) => row.data as TallerClient)
          .filter(Boolean);

        // Filtrar clientes eliminados (tombstones) y eliminarlos proactivamente de Supabase
        const cloudClients: TallerClient[] = [];
        for (const c of rawCloudClients) {
          if (!c || !c.id) continue;
          const isDeleted =
            tombstones.has(c.id) ||
            (c.idNumber && tombstones.has(c.idNumber.trim()));

          if (isDeleted) {
            cloudDeleteClient(c.id);
          } else {
            cloudClients.push(c);
          }
        }

        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(cloudClients));
        window.dispatchEvent(new Event('starmotos_clients_updated'));
        clientsCount = cloudClients.length;
      }
    } catch (e) {
      console.warn('Error sincronizando clientes:', e);
    }

    // -----------------------------------------------------------------------
    // 4. ALERTAS DEL SISTEMA
    // -----------------------------------------------------------------------
    let alertsCount = 0;
    try {
      const { data: alertsData, error: altErr } = await supabase
        .from('alerts')
        .select('data')
        .order('created_at', { ascending: false })
        .limit(80);

      if (!altErr) {
        const rawCloudAlerts: SystemAlert[] = (alertsData || [])
          .map((row) => row.data as SystemAlert)
          .filter(Boolean);

        const cloudAlerts: SystemAlert[] = [];
        for (const a of rawCloudAlerts) {
          if (!a || !a.id) continue;
          if (tombstones.has(a.id)) {
            cloudDeleteAlert(a.id);
          } else {
            cloudAlerts.push(a);
          }
        }

        localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(cloudAlerts));
        window.dispatchEvent(new Event('starmotos_alerts_updated'));
        alertsCount = cloudAlerts.length;
      }
    } catch (e) {
      console.warn('Error sincronizando alertas:', e);
    }

    // -----------------------------------------------------------------------
    // 5. ÓRDENES DE TALLER
    // -----------------------------------------------------------------------
    try {
      const { data: ordersData, error: ordErr } = await supabase
        .from('orders')
        .select('data')
        .order('updated_at', { ascending: false });

      if (!ordErr && ordersData) {
        const items: TallerOrder[] = ordersData.map((row) => row.data as TallerOrder).filter(Boolean);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(items));
        window.dispatchEvent(new Event('starmotos_orders_updated'));
      }
    } catch (e) {
      console.warn('Error sincronizando órdenes:', e);
    }

    // -----------------------------------------------------------------------
    // 6. FACTURAS ADMINISTRATIVAS
    // -----------------------------------------------------------------------
    try {
      const { data: invoicesData, error: invErr } = await supabase
        .from('invoices')
        .select('data')
        .order('created_at', { ascending: false });

      if (!invErr && invoicesData) {
        const items: AdminInvoice[] = invoicesData.map((row) => row.data as AdminInvoice).filter(Boolean);
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(items));
        window.dispatchEvent(new Event('starmotos_invoices_updated'));
      }
    } catch (e) {
      console.warn('Error sincronizando facturas:', e);
    }

    // -----------------------------------------------------------------------
    // 7. TÉCNICOS & MECÁNICOS POR SEDE
    // -----------------------------------------------------------------------
    try {
      const { data: techsData, error: techErr } = await supabase
        .from('technicians')
        .select('data')
        .order('created_at', { ascending: false });

      if (!techErr && techsData) {
        const items: Technician[] = techsData.map((row) => row.data as Technician).filter(Boolean);
        localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(items));
        window.dispatchEvent(new Event('starmotos_technicians_updated'));
      }
    } catch (e) {
      console.warn('Error sincronizando técnicos:', e);
    }
    // -----------------------------------------------------------------------
    // 8. GARANTES Y MARCAS REGISTRADAS
    // -----------------------------------------------------------------------
    try {
      const { data: garantesData, error: garErr } = await supabase
        .from('garantes')
        .select('data')
        .order('created_at', { ascending: false });

      if (!garErr && garantesData) {
        const testIds = ['gar-1790198469789', 'gar-1790177178056', 'gar-1790195112522'];
        const testCompanies = ['honder', 'kindev', 'social'];
        const items: GaranteProfile[] = garantesData
          .map((row) => row.data as GaranteProfile)
          .filter(Boolean)
          .filter(
            (g) =>
              g &&
              g.id &&
              !testIds.includes(g.id) &&
              !(g.companyName && testCompanies.includes(g.companyName.toLowerCase().trim()))
          );
        localStorage.setItem(STORAGE_KEYS.GARANTES, JSON.stringify(items));
        window.dispatchEvent(new Event('starmotos_garantes_updated'));
        window.dispatchEvent(new Event('starmotos_garante_profile_updated'));
      }
    } catch (e) {
      console.warn('Error sincronizando garantes:', e);
    }

    // -----------------------------------------------------------------------
    // 9. JEFES DE TALLER REGISTRADOS
    // -----------------------------------------------------------------------
    try {
      const { data: managersData, error: mgrErr } = await supabase
        .from('workshop_managers')
        .select('data')
        .order('created_at', { ascending: false });

      if (!mgrErr && managersData) {
        const items: WorkshopManagerAccount[] = managersData.map((row) => row.data as WorkshopManagerAccount).filter(Boolean);
        if (items.length > 0) {
          localStorage.setItem(STORAGE_KEYS.WORKSHOP_MANAGERS, JSON.stringify(items));
          window.dispatchEvent(new Event('starmotos_workshop_managers_updated'));
        }
      }
    } catch (e) {
      console.warn('Error sincronizando jefes de taller:', e);
    }

    // -----------------------------------------------------------------------
    // 10. DICTÁMENES OFICIALES DE GARANTÍA
    // -----------------------------------------------------------------------
    try {
      const { data: dictamenesData, error: dicErr } = await supabase
        .from('dictamenes')
        .select('data')
        .order('created_at', { ascending: false });

      if (!dicErr && dictamenesData) {
        const items: DictamenRecord[] = dictamenesData.map((row) => row.data as DictamenRecord).filter(Boolean);
        if (items.length > 0) {
          localStorage.setItem(STORAGE_KEYS.DICTAMENES, JSON.stringify(items));
          window.dispatchEvent(new Event('starmotos_dictamenes_updated'));
        }
      }
    } catch (e) {
      console.warn('Error sincronizando dictamenes:', e);
    }

    // -----------------------------------------------------------------------
    // 11. REGISTRO DE PENDIENTES & AGENDAMIENTO
    // -----------------------------------------------------------------------
    try {
      const { data: pendData, error: pendErr } = await supabase
        .from('pendientes')
        .select('data')
        .order('created_at', { ascending: false });

      if (!pendErr && pendData && pendData.length > 0) {
        const items: AdminPendiente[] = pendData.map((row) => row.data as AdminPendiente).filter(Boolean);
        if (items.length > 0) {
          localStorage.setItem(STORAGE_KEYS.PENDIENTES, JSON.stringify(items));
          window.dispatchEvent(new Event('starmotos_pendientes_updated'));
        }
      }
    } catch (e) {
      console.warn('Error sincronizando pendientes:', e);
    }

    return {
      warrantiesCount,
      alistamientosCount,
      clientsCount,
      alertsCount,
    };
  } catch (error) {
    console.warn('Advertencia al sincronizar con Supabase:', error);
    return {
      warrantiesCount: 0,
      alistamientosCount: 0,
      clientsCount: 0,
      alertsCount: 0,
    };
  } finally {
    isSyncing = false;
  }
}

// =========================================================================
// 2. TRANSMISIÓN A LA NUBE (UPSERTS RESILIENTES)
// =========================================================================

export async function cloudSaveWarranty(w: WarrantyRequest) {
  try {
    removeDeletedTombstone(w.id, w.requestNumber);

    // Asegurar que si hay fotos o videos en base64 se suban al Storage y se usen URLs
    let cleanW = { ...w };
    if (w.diagnosticPhotos && w.diagnosticPhotos.length > 0) {
      const hasBase64 = w.diagnosticPhotos.some(
        (p) => typeof p === 'string' && (p.startsWith('data:') || p.startsWith('blob:'))
      );
      if (hasBase64) {
        const uploaded = await Promise.all(
          w.diagnosticPhotos.map(async (item, idx) => {
            if (typeof item === 'string' && (item.startsWith('data:') || item.startsWith('blob:'))) {
              try {
                const cloudUrl = await uploadWarrantyMedia(item, `gar_${w.id}_${idx}`);
                return cloudUrl || item;
              } catch (_) {
                return item;
              }
            }
            return item;
          })
        );
        cleanW.diagnosticPhotos = uploaded;
      }
    }

    const payload = {
      id: cleanW.id,
      request_number: cleanW.requestNumber || null,
      client_name: cleanW.clientName || null,
      client_id_number: cleanW.clientIdNumber || null,
      status: cleanW.status || 'en_revision',
      taller_origin: cleanW.tallerOrigin || 'StarMotos Taller',
      taller_origin_id: cleanW.tallerOriginId || 'taller-principal',
      data: cleanW,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('warranties').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error guardando garantía:', error);
    }
  } catch (err) {
    console.error('[Supabase] Excepción guardando garantía:', err);
  }
}

export async function cloudSaveAlistamiento(rec: AlistamientoFullRecord) {
  try {
    removeDeletedTombstone(rec.id, rec.cedulaRuc);

    let cleanRec = { ...rec };

    // 1. Subir fotos de alistamiento si vienen en base64/blob a Storage para no inflar la base de datos PostgreSQL
    if (cleanRec.fotos && Array.isArray(cleanRec.fotos) && cleanRec.fotos.length > 0) {
      const hasBase64 = cleanRec.fotos.some(
        (f) => typeof f === 'string' && (f.startsWith('data:') || f.startsWith('blob:') || f.length > 2000)
      );
      if (hasBase64) {
        const uploadedFotos = await Promise.all(
          cleanRec.fotos.map(async (item, idx) => {
            if (typeof item === 'string' && (item.startsWith('data:') || item.startsWith('blob:') || item.length > 2000)) {
              try {
                const cloudUrl = await uploadWarrantyMedia(item, `als_${cleanRec.id}_foto_${idx}`);
                return cloudUrl || item;
              } catch (_) {
                return item;
              }
            }
            return item;
          })
        );
        cleanRec.fotos = uploadedFotos;
      }
    }

    // 2. Subir comprobante de transferencia bancaria si viene en base64/blob
    const ev = cleanRec.evidenciaTransferencia || cleanRec.comprobantePagoUrl;
    if (typeof ev === 'string' && (ev.startsWith('data:') || ev.startsWith('blob:') || ev.length > 2000)) {
      try {
        const cloudUrl = await uploadWarrantyMedia(ev, `als_${cleanRec.id}_transferencia`);
        if (cloudUrl && (cloudUrl.startsWith('http://') || cloudUrl.startsWith('https://'))) {
          cleanRec.evidenciaTransferencia = cloudUrl;
          cleanRec.comprobantePagoUrl = cloudUrl;
        }
      } catch (_) {}
    }

    const payload = {
      id: cleanRec.id,
      cedula_ruc: cleanRec.cedulaRuc || null,
      nombres: cleanRec.nombres || null,
      apellidos: cleanRec.apellidos || null,
      sede: cleanRec.sede || 'StarMotos',
      sede_id: cleanRec.sedeId || 'taller-principal',
      placa: cleanRec.placa || null,
      chasis: cleanRec.chasis || null,
      evidencia_transferencia: cleanRec.evidenciaTransferencia || cleanRec.comprobantePagoUrl || null,
      data: cleanRec,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('full_alistamientos').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error guardando alistamiento:', error);
    }
  } catch (err) {
    console.error('[Supabase] Excepción guardando alistamiento:', err);
  }
}

export async function cloudSaveClient(c: TallerClient) {
  try {
    removeDeletedTombstone(c.id, c.idNumber);
    const payload = {
      id: c.id,
      id_number: c.idNumber || null,
      full_name: c.fullName || null,
      phone: c.phone || null,
      workshop_id: c.workshopId || 'taller-principal',
      workshop_name: c.workshopName || 'StarMotos',
      motorcycle_plate: c.motorcyclePlate || null,
      motorcycle_vin: c.motorcycleVin || null,
      data: c,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('clients').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error guardando cliente:', error);
    }
  } catch (err) {
    console.error('[Supabase] Excepción guardando cliente:', err);
  }
}

// =========================================================================
// ELIMINACIONES EN LA NUBE (DEFINITIVAS Y EN CASCADA)
// =========================================================================

export async function cloudDeleteWarranty(...identifiers: (string | undefined | null)[]) {
  const cleanList = identifiers
    .map((i) => (i ? String(i).trim() : ''))
    .filter(Boolean);
  if (cleanList.length === 0) return;

  addDeletedTombstone(...cleanList);

  for (const cleanId of cleanList) {
    try {
      await supabase.from('warranties').delete().eq('id', cleanId);
    } catch (_) {}
    try {
      await supabase.from('warranties').delete().eq('request_number', cleanId);
    } catch (_) {}
    try {
      await supabase.from('alerts').delete().eq('related_id', cleanId);
    } catch (_) {}
  }
}

export async function cloudDeleteAlistamiento(id: string) {
  if (!id) return;
  addDeletedTombstone(id);
  try {
    const cleanId = id.trim();
    const { error } = await supabase
      .from('full_alistamientos')
      .delete()
      .or(`id.eq.${cleanId},cedula_ruc.eq.${cleanId}`);
    if (error) console.error('[Supabase] Error eliminando alistamiento:', error);

    // Eliminar también en cascada cualquier orden de trabajo vinculada
    try {
      await supabase
        .from('orders')
        .delete()
        .or(`data->>alistamientoId.eq.${cleanId}`);
    } catch (_) {}
  } catch (err) {
    console.error('[Supabase] Excepción eliminando alistamiento:', err);
  }
}

export async function cloudDeleteClient(idOrCedula: string) {
  if (!idOrCedula) return;
  addDeletedTombstone(idOrCedula);
  try {
    const clean = idOrCedula.trim();
    // 1. Eliminar de la tabla clients por ID o por id_number
    const { error: cliErr } = await supabase
      .from('clients')
      .delete()
      .or(`id.eq.${clean},id_number.eq.${clean}`);
    if (cliErr) console.error('[Supabase] Error eliminando cliente:', cliErr);

    // 2. Eliminar de la tabla full_alistamientos cualquier registro vinculado
    const { error: alsErr } = await supabase
      .from('full_alistamientos')
      .delete()
      .or(`id.eq.${clean},cedula_ruc.eq.${clean}`);
    if (alsErr) console.error('[Supabase] Error eliminando alistamientos del cliente:', alsErr);

    // 3. Eliminar de garantías cualquier reclamo con esta cédula
    const { error: warErr } = await supabase
      .from('warranties')
      .delete()
      .eq('client_id_number', clean);
    if (warErr) console.error('[Supabase] Error eliminando garantías vinculadas:', warErr);

    // 4. Eliminar de órdenes de taller cualquier orden del cliente
    try {
      await supabase
        .from('orders')
        .delete()
        .or(`data->>clientIdNumber.eq.${clean},data->>alistamientoId.eq.${clean}`);
    } catch (_) {}
  } catch (err) {
    console.error('[Supabase] Excepción eliminando cliente:', err);
  }
}

export async function cloudDeleteAlert(id: string) {
  if (!id) return;
  addDeletedTombstone(id);
  try {
    const { error } = await supabase.from('alerts').delete().eq('id', id);
    if (error) console.error('[Supabase] Error eliminando alerta:', error);
  } catch (err) {
    console.error('[Supabase] Excepción eliminando alerta:', err);
  }
}

export async function cloudDeleteAlerts(ids: string[]) {
  if (!ids || ids.length === 0) return;
  ids.forEach((id) => addDeletedTombstone(id));
  try {
    const { error } = await supabase.from('alerts').delete().in('id', ids);
    if (error) console.error('[Supabase] Error eliminando alertas:', error);
  } catch (err) {
    console.error('[Supabase] Excepción eliminando alertas:', err);
  }
}


export async function cloudSaveAlert(alt: SystemAlert) {
  try {
    const payload = {
      id: alt.id,
      type: alt.type || 'info',
      title: alt.title || 'Notificación',
      message: alt.message || '',
      read: Boolean(alt.read),
      related_id: alt.relatedId || null,
      data: alt,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('alerts').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error guardando alerta:', error);
    }
  } catch (err) {
    console.error('[Supabase] Excepción guardando alerta:', err);
  }
}

export async function cloudSaveOrder(ord: TallerOrder) {
  try {
    const payload = {
      id: ord.id,
      ot_number: ord.otNumber || null,
      status: ord.status || 'recibida',
      data: ord,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('orders').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error guardando orden:', error);
    }
  } catch (err) {
    console.error('[Supabase] Excepción guardando orden:', err);
  }
}

export async function cloudSaveInvoice(inv: AdminInvoice) {
  try {
    const payload = {
      id: inv.id,
      invoice_number: inv.invoiceNumber || null,
      client_name: inv.clientName || null,
      data: inv,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('invoices').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error guardando factura:', error);
    }
  } catch (err) {
    console.error('[Supabase] Excepción guardando factura:', err);
  }
}

export async function cloudSaveTechnician(tech: Technician) {
  try {
    const payload = {
      id: tech.id,
      name: tech.name || null,
      specialty: tech.specialty || null,
      phone: tech.phone || null,
      workshop_id: tech.workshopId || null,
      workshop_name: tech.workshopName || null,
      status: tech.status || 'activo',
      data: tech,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('technicians').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error guardando técnico:', error);
    }
  } catch (err) {
    console.error('[Supabase] Excepción guardando técnico:', err);
  }
}

export async function cloudDeleteTechnician(id: string) {
  if (!id) return;
  try {
    const { error } = await supabase.from('technicians').delete().eq('id', id);
    if (error) console.error('[Supabase] Error eliminando técnico:', error);
  } catch (err) {
    console.error('[Supabase] Excepción eliminando técnico:', err);
  }
}

export async function cloudSaveGarante(g: GaranteProfile) {
  try {
    const payload = {
      id: g.id,
      company_name: g.companyName || null,
      ruc: g.ruc || null,
      contact_name: g.contactName || null,
      role_title: g.roleTitle || null,
      email: g.email || null,
      phone: g.phone || null,
      address: g.address || null,
      brands_represented: g.brandsRepresented || [],
      data: g,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('garantes').upsert(payload, { onConflict: 'id' });
    if (error) console.error('[Supabase] Error guardando garante:', error);
  } catch (err) {
    console.error('[Supabase] Excepción guardando garante:', err);
  }
}

export async function cloudDeleteGarante(id: string) {
  if (!id) return;
  try {
    const { error } = await supabase.from('garantes').delete().eq('id', id);
    if (error) console.error('[Supabase] Error eliminando garante:', error);
  } catch (err) {
    console.error('[Supabase] Excepción eliminando garante:', err);
  }
}

export async function cloudSaveWorkshopManager(m: WorkshopManagerAccount) {
  try {
    const payload = {
      id: m.id,
      name: m.name || null,
      workshop_id: m.workshopId || null,
      workshop_name: m.workshopName || null,
      email: m.email || null,
      phone: m.phone || null,
      data: m,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('workshop_managers').upsert(payload, { onConflict: 'id' });
    if (error) console.error('[Supabase] Error guardando jefe de taller:', error);
  } catch (err) {
    console.error('[Supabase] Excepción guardando jefe de taller:', err);
  }
}

export async function cloudDeleteWorkshopManager(id: string) {
  if (!id) return;
  try {
    const { error } = await supabase.from('workshop_managers').delete().eq('id', id);
    if (error) console.error('[Supabase] Error eliminando jefe de taller:', error);
  } catch (err) {
    console.error('[Supabase] Excepción eliminando jefe de taller:', err);
  }
}

export async function cloudSaveDictamen(d: DictamenRecord) {
  try {
    const payload = {
      id: d.id,
      warranty_id: d.warrantyId,
      request_number: d.requestNumber || null,
      decision: d.decision,
      resolution_type: d.resolutionType || null,
      motorcycle_brand: d.motorcycleBrand || null,
      motorcycle_model: d.motorcycleModel || null,
      motorcycle_plate: d.motorcyclePlate || null,
      motorcycle_vin: d.motorcycleVin || null,
      client_name: d.clientName || null,
      client_id_number: d.clientIdNumber || null,
      garante_id: d.garanteId || null,
      garante_name: d.garanteName || null,
      garante_company: d.garanteCompany || null,
      garante_notes: d.garanteNotes || null,
      rejection_reason: d.rejectionReason || null,
      data: d,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('dictamenes').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error guardando dictamen:', error);
    }
  } catch (err) {
    console.error('[Supabase] Excepción guardando dictamen:', err);
  }
}

export async function cloudDeleteDictamen(id: string) {
  if (!id) return;
  try {
    const { error } = await supabase.from('dictamenes').delete().eq('id', id);
    if (error) console.error('[Supabase] Error eliminando dictamen:', error);
  } catch (err) {
    console.error('[Supabase] Excepción eliminando dictamen:', err);
  }
}

export async function cloudSavePendiente(p: AdminPendiente) {
  try {
    const payload = {
      id: p.id,
      title: p.title,
      category: p.category || 'repuesto',
      priority: p.priority || 'media',
      due_date: p.dueDate || null,
      estimated_cost: p.estimatedCost || 0,
      workshop_id: p.workshopId || null,
      workshop_name: p.workshopName || null,
      completed: !!p.completed,
      completed_at: p.completedAt || null,
      created_by: p.createdBy || null,
      data: p,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('pendientes').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error guardando pendiente:', error);
    }
  } catch (err) {
    console.error('[Supabase] Excepción guardando pendiente:', err);
  }
}

export async function cloudDeletePendiente(id: string) {
  if (!id) return;
  try {
    const { error } = await supabase.from('pendientes').delete().eq('id', id);
    if (error) console.error('[Supabase] Error eliminando pendiente:', error);
  } catch (err) {
    console.error('[Supabase] Excepción eliminando pendiente:', err);
  }
}

export async function cloudPurgeQuevedoWarranties() {
  // No-op intencional: las garantías anteriores ya fueron depuradas. No purgar nuevas solicitudes de Quevedo.
}

// =========================================================================
// 3. SUSCRIPCIÓN EN TIEMPO REAL (REALTIME BROADCAST MULTI-DISPOSITIVO)
// =========================================================================

export function initSupabaseRealtime() {
  if (isRealtimeInitialized) return;
  isRealtimeInitialized = true;

  // Realizar primera sincronización de arranque
  syncAllFromSupabase();

  // Sincronizar automáticamente cuando el usuario regresa a la pestaña
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
      syncAllFromSupabase();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        syncAllFromSupabase();
      }
    });
  }

  // Suscribirse al canal en tiempo real
  const channel = supabase
    .channel('starmotos_global_realtime')
    // Eliminaciones sincronizadas en tiempo real (Tombstones globales)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'deleted_tombstones' },
      (payload) => {
        try {
          const tombstoneId = (payload.new as any)?.id || (payload.old as any)?.id;
          if (tombstoneId) {
            addDeletedTombstone(tombstoneId);
            const raw = localStorage.getItem(STORAGE_KEYS.WARRANTIES);
            if (raw) {
              const current: WarrantyRequest[] = JSON.parse(raw);
              const filtered = current.filter(
                (w) => w.id !== tombstoneId && w.requestNumber !== tombstoneId
              );
              localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(filtered));
              window.dispatchEvent(new Event('starmotos_warranties_updated'));
            }
          }
        } catch (e) {
          console.error('Error procesando realtime tombstone:', e);
        }
      }
    )
    // Garantías
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'warranties' },
      (payload) => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.WARRANTIES);
          let current: WarrantyRequest[] = raw ? JSON.parse(raw) : [];

          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new.data as WarrantyRequest;
            if (
              newDoc &&
              !isDeletedTombstone(newDoc.id) &&
              (!newDoc.requestNumber || !isDeletedTombstone(newDoc.requestNumber))
            ) {
              if (!current.some((w) => w.id === newDoc.id)) {
                current = [newDoc, ...current];
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as WarrantyRequest;
            if (updatedDoc) {
              if (
                isDeletedTombstone(updatedDoc.id) ||
                (updatedDoc.requestNumber && isDeletedTombstone(updatedDoc.requestNumber))
              ) {
                current = current.filter((w) => w.id !== updatedDoc.id);
              } else {
                current = current.map((w) => (w.id === updatedDoc.id ? updatedDoc : w));
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            const reqNum = (payload.old as any)?.request_number;
            if (deletedId) addDeletedTombstone(deletedId);
            if (reqNum) addDeletedTombstone(reqNum);
            current = current.filter(
              (w) => (!deletedId || w.id !== deletedId) && (!reqNum || w.requestNumber !== reqNum)
            );
          }

          try {
            localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(current));
          } catch (err) {
            console.warn('Realtime: quota exceeded en localStorage, optimizando:', err);
            const safeCurrent = current.map((w) => {
              if (!w.diagnosticPhotos || w.diagnosticPhotos.length === 0) return w;
              return {
                ...w,
                diagnosticPhotos: w.diagnosticPhotos.map((item) =>
                  typeof item === 'string' && item.length > 30000 ? item.slice(0, 500) : item
                ),
              };
            });
            try {
              localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(safeCurrent));
            } catch (_) {}
          }
          window.dispatchEvent(new Event('starmotos_warranties_updated'));
        } catch (e) {
          console.error('Error procesando realtime warranties:', e);
        }
      }
    )
    // Alistamientos
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'full_alistamientos' },
      (payload) => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.ALISTAMIENTOS);
          let current: AlistamientoFullRecord[] = raw ? JSON.parse(raw) : [];

          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new.data as AlistamientoFullRecord;
            if (
              newDoc &&
              !isDeletedTombstone(newDoc.id) &&
              !isDeletedTombstone(newDoc.cedulaRuc)
            ) {
              if (!current.some((a) => a.id === newDoc.id)) {
                current = [newDoc, ...current];
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as AlistamientoFullRecord;
            if (updatedDoc) {
              if (
                isDeletedTombstone(updatedDoc.id) ||
                isDeletedTombstone(updatedDoc.cedulaRuc)
              ) {
                current = current.filter((a) => a.id !== updatedDoc.id);
              } else {
                current = current.map((a) => (a.id === updatedDoc.id ? updatedDoc : a));
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            addDeletedTombstone(deletedId);
            current = current.filter((a) => a.id !== deletedId);
          }

          safeSaveAlistamientosToLocalStorage(current);
          window.dispatchEvent(new Event('starmotos_alistamientos_updated'));
        } catch (e) {
          console.error('Error procesando realtime alistamientos:', e);
        }
      }
    )
    // Clientes
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'clients' },
      (payload) => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
          let current: TallerClient[] = raw ? JSON.parse(raw) : [];

          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new.data as TallerClient;
            if (
              newDoc &&
              !isDeletedTombstone(newDoc.id) &&
              !isDeletedTombstone(newDoc.idNumber)
            ) {
              if (!current.some((c) => c.id === newDoc.id || c.idNumber === newDoc.idNumber)) {
                current = [newDoc, ...current];
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as TallerClient;
            if (updatedDoc) {
              if (
                isDeletedTombstone(updatedDoc.id) ||
                isDeletedTombstone(updatedDoc.idNumber)
              ) {
                current = current.filter(
                  (c) => c.id !== updatedDoc.id && c.idNumber !== updatedDoc.idNumber
                );
              } else {
                current = current.map((c) =>
                  c.id === updatedDoc.id || c.idNumber === updatedDoc.idNumber ? updatedDoc : c
                );
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            addDeletedTombstone(deletedId);
            current = current.filter((c) => c.id !== deletedId && c.idNumber !== deletedId);
          }

          localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(current));
          window.dispatchEvent(new Event('starmotos_clients_updated'));
        } catch (e) {
          console.error('Error procesando realtime clients:', e);
        }
      }
    )
    // Alertas
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'alerts' },
      (payload) => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.ALERTS);
          let current: SystemAlert[] = raw ? JSON.parse(raw) : [];

          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new.data as SystemAlert;
            if (newDoc && !isDeletedTombstone(newDoc.id)) {
              if (!current.some((a) => a.id === newDoc.id)) {
                current = [newDoc, ...current];
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as SystemAlert;
            if (updatedDoc) {
              if (isDeletedTombstone(updatedDoc.id)) {
                current = current.filter((a) => a.id !== updatedDoc.id);
              } else {
                current = current.map((a) => (a.id === updatedDoc.id ? updatedDoc : a));
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            addDeletedTombstone(deletedId);
            current = current.filter((a) => a.id !== deletedId);
          }

          localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(current));
          window.dispatchEvent(new Event('starmotos_alerts_updated'));
        } catch (e) {
          console.error('Error procesando realtime alerts:', e);
        }
      }
    )
    // Órdenes
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
          let current: TallerOrder[] = raw ? JSON.parse(raw) : [];

          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new.data as TallerOrder;
            if (newDoc && !current.some((o) => o.id === newDoc.id)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as TallerOrder;
            if (updatedDoc) {
              current = current.map((o) => (o.id === updatedDoc.id ? updatedDoc : o));
            }
          }

          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(current));
          window.dispatchEvent(new Event('starmotos_orders_updated'));
        } catch (e) {
          console.error('Error procesando realtime orders:', e);
        }
      }
    )
    // Técnicos & Mecánicos
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'technicians' },
      (payload) => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.TECHNICIANS);
          let current: Technician[] = raw ? JSON.parse(raw) : [];

          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new.data as Technician;
            if (newDoc && !current.some((t) => t.id === newDoc.id)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as Technician;
            if (updatedDoc) {
              current = current.map((t) => (t.id === updatedDoc.id ? updatedDoc : t));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            current = current.filter((t) => t.id !== deletedId);
          }

          localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(current));
          window.dispatchEvent(new Event('starmotos_technicians_updated'));
        } catch (e) {
          console.error('Error procesando realtime technicians:', e);
        }
      }
    )
    // Garantes y Marcas
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'garantes' },
      (payload) => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.GARANTES);
          let current: GaranteProfile[] = raw ? JSON.parse(raw) : [];

          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new.data as GaranteProfile;
            if (newDoc && !current.some((g) => g.id === newDoc.id)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as GaranteProfile;
            if (updatedDoc) {
              current = current.map((g) => (g.id === updatedDoc.id ? updatedDoc : g));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            current = current.filter((g) => g.id !== deletedId);
          }

          localStorage.setItem(STORAGE_KEYS.GARANTES, JSON.stringify(current));
          window.dispatchEvent(new Event('starmotos_garantes_updated'));
          window.dispatchEvent(new Event('starmotos_garante_profile_updated'));
        } catch (e) {
          console.error('Error procesando realtime garantes:', e);
        }
      }
    )
    // Jefes de Taller
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'workshop_managers' },
      (payload) => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.WORKSHOP_MANAGERS);
          let current: WorkshopManagerAccount[] = raw ? JSON.parse(raw) : [];

          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new.data as WorkshopManagerAccount;
            if (newDoc && !current.some((m) => m.id === newDoc.id)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as WorkshopManagerAccount;
            if (updatedDoc) {
              current = current.map((m) => (m.id === updatedDoc.id ? updatedDoc : m));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            current = current.filter((m) => m.id !== deletedId);
          }

          localStorage.setItem(STORAGE_KEYS.WORKSHOP_MANAGERS, JSON.stringify(current));
          window.dispatchEvent(new Event('starmotos_workshop_managers_updated'));
        } catch (e) {
          console.error('Error procesando realtime workshop managers:', e);
        }
      }
    )
    // Dictámenes Oficiales de Garantía
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'dictamenes' },
      (payload) => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.DICTAMENES);
          let current: DictamenRecord[] = raw ? JSON.parse(raw) : [];

          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new.data as DictamenRecord;
            if (newDoc && !current.some((d) => d.id === newDoc.id)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as DictamenRecord;
            if (updatedDoc) {
              current = current.map((d) => (d.id === updatedDoc.id ? updatedDoc : d));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            current = current.filter((d) => d.id !== deletedId);
          }

          localStorage.setItem(STORAGE_KEYS.DICTAMENES, JSON.stringify(current));
          window.dispatchEvent(new Event('starmotos_dictamenes_updated'));
        } catch (e) {
          console.error('Error procesando realtime dictamenes:', e);
        }
      }
    )
    // Registro de Pendientes & Agendamiento
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pendientes' },
      (payload) => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.PENDIENTES);
          let current: AdminPendiente[] = raw ? JSON.parse(raw) : [];

          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new.data as AdminPendiente;
            if (newDoc && !current.some((p) => p.id === newDoc.id)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as AdminPendiente;
            if (updatedDoc) {
              current = current.map((p) => (p.id === updatedDoc.id ? updatedDoc : p));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            current = current.filter((p) => p.id !== deletedId);
          }

          localStorage.setItem(STORAGE_KEYS.PENDIENTES, JSON.stringify(current));
          window.dispatchEvent(new Event('starmotos_pendientes_updated'));
        } catch (e) {
          console.error('Error procesando realtime pendientes:', e);
        }
      }
    )
    .subscribe();

  return channel;
}
