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
} from '../types/customer';
import { STORAGE_KEYS } from '../constants/storageKeys';

let isRealtimeInitialized = false;
let isSyncing = false;

// =========================================================================
// 0. CONTROL PERSISTENTE DE REGISTROS ELIMINADOS (TOMBSTONES ANTI-REAPARICIÓN)
// =========================================================================

const TOMBSTONES_STORAGE_KEY = 'starmotos_deleted_tombstones_v1';

export function getDeletedTombstones(): Set<string> {
  try {
    const raw = localStorage.getItem(TOMBSTONES_STORAGE_KEY);
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
    for (const id of ids) {
      if (!id) continue;
      const clean = String(id).trim();
      if (clean && !current.has(clean)) {
        current.add(clean);
        added = true;
      }
    }
    if (added) {
      localStorage.setItem(TOMBSTONES_STORAGE_KEY, JSON.stringify(Array.from(current)));
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
      localStorage.setItem(TOMBSTONES_STORAGE_KEY, JSON.stringify(Array.from(current)));
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

        // Filtrar garantías eliminadas (tombstones) y eliminarlas proactivamente de Supabase
        const cloudWarranties: WarrantyRequest[] = [];
        for (const w of rawCloudWarranties) {
          if (!w || !w.id) continue;
          const isDeleted =
            tombstones.has(w.id) ||
            (w.requestNumber && tombstones.has(w.requestNumber)) ||
            (w.clientIdNumber && tombstones.has(w.clientIdNumber));

          if (isDeleted) {
            cloudDeleteWarranty(w.id);
          } else {
            cloudWarranties.push(w);
          }
        }

        localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(cloudWarranties));
        window.dispatchEvent(new Event('starmotos_warranties_updated'));
        warrantiesCount = cloudWarranties.length;
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

        localStorage.setItem(STORAGE_KEYS.ALISTAMIENTOS, JSON.stringify(cloudAlistamientos));
        window.dispatchEvent(new Event('starmotos_alistamientos_updated'));
        alistamientosCount = cloudAlistamientos.length;
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
        const items: GaranteProfile[] = garantesData.map((row) => row.data as GaranteProfile).filter(Boolean);
        if (items.length > 0) {
          localStorage.setItem(STORAGE_KEYS.GARANTES, JSON.stringify(items));
          window.dispatchEvent(new Event('starmotos_garantes_updated'));
          window.dispatchEvent(new Event('starmotos_garante_profile_updated'));
        }
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
    removeDeletedTombstone(w.id, w.requestNumber, w.clientIdNumber);
    const payload = {
      id: w.id,
      request_number: w.requestNumber || null,
      client_name: w.clientName || null,
      client_id_number: w.clientIdNumber || null,
      status: w.status || 'en_revision',
      taller_origin: w.tallerOrigin || 'StarMotos Taller',
      taller_origin_id: w.tallerOriginId || 'taller-principal',
      data: w,
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
    const payload = {
      id: rec.id,
      cedula_ruc: rec.cedulaRuc || null,
      nombres: rec.nombres || null,
      apellidos: rec.apellidos || null,
      sede: rec.sede || 'StarMotos',
      sede_id: rec.sedeId || 'taller-principal',
      placa: rec.placa || null,
      chasis: rec.chasis || null,
      data: rec,
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

export async function cloudDeleteWarranty(id: string) {
  if (!id) return;
  addDeletedTombstone(id);
  try {
    const cleanId = id.trim();
    const { error } = await supabase
      .from('warranties')
      .delete()
      .or(`id.eq.${cleanId},request_number.eq.${cleanId}`);
    if (error) console.error('[Supabase] Error eliminando garantía:', error);
  } catch (err) {
    console.error('[Supabase] Excepción eliminando garantía:', err);
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
              !isDeletedTombstone(newDoc.requestNumber) &&
              !isDeletedTombstone(newDoc.clientIdNumber)
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
                isDeletedTombstone(updatedDoc.requestNumber) ||
                isDeletedTombstone(updatedDoc.clientIdNumber)
              ) {
                current = current.filter((w) => w.id !== updatedDoc.id);
              } else {
                current = current.map((w) => (w.id === updatedDoc.id ? updatedDoc : w));
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            addDeletedTombstone(deletedId);
            current = current.filter((w) => w.id !== deletedId);
          }

          localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(current));
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

          localStorage.setItem(STORAGE_KEYS.ALISTAMIENTOS, JSON.stringify(current));
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
    .subscribe();

  return channel;
}
