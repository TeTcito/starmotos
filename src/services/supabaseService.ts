// src/services/supabaseService.ts
import { supabase } from '../lib/supabase';
import {
  WarrantyRequest,
  AlistamientoFullRecord,
  TallerClient,
  SystemAlert,
  TallerOrder,
  AdminInvoice,
} from '../types/customer';
import { STORAGE_KEYS } from '../constants/storageKeys';

let isRealtimeInitialized = false;
let isSyncing = false;

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
        const cloudWarranties: WarrantyRequest[] = (warrantiesData || [])
          .map((row) => row.data as WarrantyRequest)
          .filter(Boolean);

        const localWarranties: WarrantyRequest[] = (() => {
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.WARRANTIES);
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();

        // Reconciliación: Subir a la nube los registros locales que falten en Supabase
        const cloudIds = new Set(cloudWarranties.map((w) => w.id));
        const missingInCloud = localWarranties.filter((w) => w && w.id && !cloudIds.has(w.id));
        if (missingInCloud.length > 0) {
          console.log(`[Supabase] Subiendo ${missingInCloud.length} garantías locales a la nube...`);
          for (const w of missingInCloud) {
            await cloudSaveWarranty(w);
          }
        }

        // Unificar (los remotos mandan, pero se preservan los locales que no choquen)
        const mergedMap = new Map<string, WarrantyRequest>();
        cloudWarranties.forEach((w) => mergedMap.set(w.id, w));
        localWarranties.forEach((w) => {
          if (w && w.id && !mergedMap.has(w.id)) {
            mergedMap.set(w.id, w);
          }
        });

        const mergedList = Array.from(mergedMap.values());
        localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(mergedList));
        window.dispatchEvent(new Event('starmotos_warranties_updated'));
        warrantiesCount = mergedList.length;
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
        const cloudAlistamientos: AlistamientoFullRecord[] = (alsData || [])
          .map((row) => row.data as AlistamientoFullRecord)
          .filter(Boolean);

        const localAlistamientos: AlistamientoFullRecord[] = (() => {
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.ALISTAMIENTOS);
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();

        // Subir a la nube los alistamientos locales que no existan aún
        const cloudIds = new Set(cloudAlistamientos.map((a) => a.id));
        const missingInCloud = localAlistamientos.filter((a) => a && a.id && !cloudIds.has(a.id));
        if (missingInCloud.length > 0) {
          console.log(`[Supabase] Subiendo ${missingInCloud.length} alistamientos locales a la nube...`);
          for (const a of missingInCloud) {
            await cloudSaveAlistamiento(a);
          }
        }

        // Unificar
        const mergedMap = new Map<string, AlistamientoFullRecord>();
        cloudAlistamientos.forEach((a) => mergedMap.set(a.id, a));
        localAlistamientos.forEach((a) => {
          if (a && a.id && !mergedMap.has(a.id)) {
            mergedMap.set(a.id, a);
          }
        });

        const mergedList = Array.from(mergedMap.values());
        localStorage.setItem(STORAGE_KEYS.ALISTAMIENTOS, JSON.stringify(mergedList));
        window.dispatchEvent(new Event('starmotos_alistamientos_updated'));
        alistamientosCount = mergedList.length;
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
        const cloudClients: TallerClient[] = (clientsData || [])
          .map((row) => row.data as TallerClient)
          .filter(Boolean);

        const localClients: TallerClient[] = (() => {
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();

        // Subir clientes locales no presentes en nube (por ID o por cédula)
        const cloudIds = new Set(cloudClients.map((c) => c.id));
        const cloudIdNumbers = new Set(cloudClients.map((c) => c.idNumber));
        const missingInCloud = localClients.filter(
          (c) => c && c.id && !cloudIds.has(c.id) && !cloudIdNumbers.has(c.idNumber)
        );
        if (missingInCloud.length > 0) {
          console.log(`[Supabase] Subiendo ${missingInCloud.length} clientes locales a la nube...`);
          for (const c of missingInCloud) {
            await cloudSaveClient(c);
          }
        }

        // Unificar clientes
        const mergedMap = new Map<string, TallerClient>();
        cloudClients.forEach((c) => mergedMap.set(c.idNumber || c.id, c));
        localClients.forEach((c) => {
          const key = c.idNumber || c.id;
          if (key && !mergedMap.has(key)) {
            mergedMap.set(key, c);
          }
        });

        const mergedList = Array.from(mergedMap.values());
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(mergedList));
        window.dispatchEvent(new Event('starmotos_clients_updated'));
        clientsCount = mergedList.length;
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
        const cloudAlerts: SystemAlert[] = (alertsData || [])
          .map((row) => row.data as SystemAlert)
          .filter(Boolean);

        const localAlerts: SystemAlert[] = (() => {
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.ALERTS);
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();

        // Subir alertas locales que falten
        const cloudIds = new Set(cloudAlerts.map((a) => a.id));
        const missingInCloud = localAlerts.filter((a) => a && a.id && !cloudIds.has(a.id));
        if (missingInCloud.length > 0) {
          for (const a of missingInCloud) {
            await cloudSaveAlert(a);
          }
        }

        // Unificar alertas
        const mergedMap = new Map<string, SystemAlert>();
        cloudAlerts.forEach((a) => mergedMap.set(a.id, a));
        localAlerts.forEach((a) => {
          if (a && a.id && !mergedMap.has(a.id)) {
            mergedMap.set(a.id, a);
          }
        });

        const mergedList = Array.from(mergedMap.values());
        localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(mergedList));
        window.dispatchEvent(new Event('starmotos_alerts_updated'));
        alertsCount = mergedList.length;
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

      if (!ordErr && ordersData && ordersData.length > 0) {
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

      if (!invErr && invoicesData && invoicesData.length > 0) {
        const items: AdminInvoice[] = invoicesData.map((row) => row.data as AdminInvoice).filter(Boolean);
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(items));
        window.dispatchEvent(new Event('starmotos_invoices_updated'));
      }
    } catch (e) {
      console.warn('Error sincronizando facturas:', e);
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
// ELIMINACIONES EN LA NUBE
// =========================================================================

export async function cloudDeleteWarranty(id: string) {
  try {
    const { error } = await supabase.from('warranties').delete().eq('id', id);
    if (error) console.error('[Supabase] Error eliminando garantía:', error);
  } catch (err) {
    console.error('[Supabase] Excepción eliminando garantía:', err);
  }
}

export async function cloudDeleteAlistamiento(id: string) {
  try {
    const { error } = await supabase.from('full_alistamientos').delete().eq('id', id);
    if (error) console.error('[Supabase] Error eliminando alistamiento:', error);
  } catch (err) {
    console.error('[Supabase] Excepción eliminando alistamiento:', err);
  }
}

export async function cloudDeleteClient(id: string) {
  try {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) console.error('[Supabase] Error eliminando cliente:', error);
  } catch (err) {
    console.error('[Supabase] Excepción eliminando cliente:', err);
  }
}

export async function cloudDeleteAlert(id: string) {
  try {
    const { error } = await supabase.from('alerts').delete().eq('id', id);
    if (error) console.error('[Supabase] Error eliminando alerta:', error);
  } catch (err) {
    console.error('[Supabase] Excepción eliminando alerta:', err);
  }
}

export async function cloudDeleteAlerts(ids: string[]) {
  if (!ids || ids.length === 0) return;
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
            if (newDoc && !current.some((w) => w.id === newDoc.id)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as WarrantyRequest;
            if (updatedDoc) {
              current = current.map((w) => (w.id === updatedDoc.id ? updatedDoc : w));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
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
            if (newDoc && !current.some((a) => a.id === newDoc.id)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as AlistamientoFullRecord;
            if (updatedDoc) {
              current = current.map((a) => (a.id === updatedDoc.id ? updatedDoc : a));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
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
            if (newDoc && !current.some((c) => c.id === newDoc.id || c.idNumber === newDoc.idNumber)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as TallerClient;
            if (updatedDoc) {
              current = current.map((c) =>
                c.id === updatedDoc.id || c.idNumber === updatedDoc.idNumber ? updatedDoc : c
              );
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            current = current.filter((c) => c.id !== deletedId);
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
            if (newDoc && !current.some((a) => a.id === newDoc.id)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as SystemAlert;
            if (updatedDoc) {
              current = current.map((a) => (a.id === updatedDoc.id ? updatedDoc : a));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
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
    .subscribe();

  return channel;
}
