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
import { STORAGE_KEYS } from '../data/mockMultiRoleData';

let isRealtimeInitialized = false;

// =========================================================================
// 1. SINCRONIZACIÓN DESDE LA NUBE (DESCARGA INICIAL)
// =========================================================================

export async function syncAllFromSupabase(): Promise<{
  warrantiesCount: number;
  alistamientosCount: number;
  clientsCount: number;
  alertsCount: number;
}> {
  try {
    // 1. Garantías
    const { data: warrantiesData, error: warErr } = await supabase
      .from('warranties')
      .select('data')
      .order('updated_at', { ascending: false });

    let warrantiesCount = 0;
    if (!warErr && warrantiesData && warrantiesData.length > 0) {
      const items: WarrantyRequest[] = warrantiesData.map((row) => row.data as WarrantyRequest);
      localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(items));
      window.dispatchEvent(new Event('starmotos_warranties_updated'));
      warrantiesCount = items.length;
    }

    // 2. Alistamientos
    const { data: alsData, error: alsErr } = await supabase
      .from('full_alistamientos')
      .select('data')
      .order('updated_at', { ascending: false });

    let alistamientosCount = 0;
    if (!alsErr && alsData && alsData.length > 0) {
      const items: AlistamientoFullRecord[] = alsData.map((row) => row.data as AlistamientoFullRecord);
      localStorage.setItem(STORAGE_KEYS.ALISTAMIENTOS, JSON.stringify(items));
      window.dispatchEvent(new Event('starmotos_alistamientos_updated'));
      alistamientosCount = items.length;
    }

    // 3. Clientes
    const { data: clientsData, error: cliErr } = await supabase
      .from('clients')
      .select('data')
      .order('updated_at', { ascending: false });

    let clientsCount = 0;
    if (!cliErr && clientsData && clientsData.length > 0) {
      const items: TallerClient[] = clientsData.map((row) => row.data as TallerClient);
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(items));
      window.dispatchEvent(new Event('starmotos_clients_updated'));
      clientsCount = items.length;
    }

    // 4. Alertas
    const { data: alertsData, error: altErr } = await supabase
      .from('alerts')
      .select('data')
      .order('created_at', { ascending: false })
      .limit(60);

    let alertsCount = 0;
    if (!altErr && alertsData && alertsData.length > 0) {
      const items: SystemAlert[] = alertsData.map((row) => row.data as SystemAlert);
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(items));
      window.dispatchEvent(new Event('starmotos_alerts_updated'));
      alertsCount = items.length;
    }

    // 5. Órdenes
    const { data: ordersData, error: ordErr } = await supabase
      .from('orders')
      .select('data')
      .order('updated_at', { ascending: false });

    if (!ordErr && ordersData && ordersData.length > 0) {
      const items: TallerOrder[] = ordersData.map((row) => row.data as TallerOrder);
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(items));
      window.dispatchEvent(new Event('starmotos_orders_updated'));
    }

    // 6. Facturas
    const { data: invoicesData, error: invErr } = await supabase
      .from('invoices')
      .select('data')
      .order('created_at', { ascending: false });

    if (!invErr && invoicesData && invoicesData.length > 0) {
      const items: AdminInvoice[] = invoicesData.map((row) => row.data as AdminInvoice);
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(items));
      window.dispatchEvent(new Event('starmotos_invoices_updated'));
    }

    return {
      warrantiesCount,
      alistamientosCount,
      clientsCount,
      alertsCount,
    };
  } catch (error) {
    console.warn('Advertencia al sincronizar con Supabase (modo local activo):', error);
    return {
      warrantiesCount: 0,
      alistamientosCount: 0,
      clientsCount: 0,
      alertsCount: 0,
    };
  }
}

// =========================================================================
// 2. GUARDADO Y TRANSMISIÓN A LA NUBE (UPSERTS INDIVIDUALES)
// =========================================================================

export async function cloudSaveWarranty(w: WarrantyRequest) {
  try {
    await supabase.from('warranties').upsert(
      {
        id: w.id,
        request_number: w.requestNumber,
        client_name: w.clientName,
        client_id_number: w.clientIdNumber,
        status: w.status,
        taller_origin: w.tallerOrigin,
        taller_origin_id: w.tallerOriginId,
        data: w,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.error('Error guardando garantía en Supabase:', err);
  }
}

export async function cloudSaveAlistamiento(rec: AlistamientoFullRecord) {
  try {
    await supabase.from('full_alistamientos').upsert(
      {
        id: rec.id,
        cedula_ruc: rec.cedulaRuc,
        nombres: rec.nombres,
        apellidos: rec.apellidos,
        sede: rec.sede,
        sede_id: rec.sedeId,
        placa: rec.placa,
        chasis: rec.chasis,
        data: rec,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.error('Error guardando alistamiento en Supabase:', err);
  }
}

export async function cloudSaveClient(c: TallerClient) {
  try {
    await supabase.from('clients').upsert(
      {
        id: c.id,
        id_number: c.idNumber,
        full_name: c.fullName,
        phone: c.phone,
        workshop_id: c.workshopId,
        workshop_name: c.workshopName,
        data: c,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.error('Error guardando cliente en Supabase:', err);
  }
}

export async function cloudSaveAlert(alt: SystemAlert) {
  try {
    await supabase.from('alerts').upsert(
      {
        id: alt.id,
        type: alt.type,
        title: alt.title,
        message: alt.message,
        read: alt.read,
        related_id: alt.relatedId,
        data: alt,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.error('Error guardando alerta en Supabase:', err);
  }
}

export async function cloudSaveOrder(ord: TallerOrder) {
  try {
    await supabase.from('orders').upsert(
      {
        id: ord.id,
        ot_number: ord.otNumber,
        status: ord.status,
        data: ord,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.error('Error guardando orden en Supabase:', err);
  }
}

export async function cloudSaveInvoice(inv: AdminInvoice) {
  try {
    await supabase.from('invoices').upsert(
      {
        id: inv.id,
        invoice_number: inv.invoiceNumber,
        client_name: inv.clientName,
        data: inv,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.error('Error guardando factura en Supabase:', err);
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
            if (!current.some((w) => w.id === newDoc.id)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as WarrantyRequest;
            current = current.map((w) => (w.id === updatedDoc.id ? updatedDoc : w));
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
            if (!current.some((a) => a.id === newDoc.id)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as AlistamientoFullRecord;
            current = current.map((a) => (a.id === updatedDoc.id ? updatedDoc : a));
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
            if (!current.some((c) => c.id === newDoc.id || c.idNumber === newDoc.idNumber)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as TallerClient;
            current = current.map((c) =>
              c.id === updatedDoc.id || c.idNumber === updatedDoc.idNumber ? updatedDoc : c
            );
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
            if (!current.some((a) => a.id === newDoc.id)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as SystemAlert;
            current = current.map((a) => (a.id === updatedDoc.id ? updatedDoc : a));
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
            if (!current.some((o) => o.id === newDoc.id)) {
              current = [newDoc, ...current];
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new.data as TallerOrder;
            current = current.map((o) => (o.id === updatedDoc.id ? updatedDoc : o));
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
