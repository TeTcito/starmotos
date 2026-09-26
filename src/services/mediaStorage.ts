// src/services/mediaStorage.ts
import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'warranty-media';
const DB_NAME = 'starmotos_media_db_v1';
const STORE_NAME = 'media_cache';

// Inicializar IndexedDB para respaldo offline y almacenamiento persistente local
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no soportado en este entorno'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda un elemento multimedia (base64 o blob) en IndexedDB
 */
export async function saveMediaToIndexedDB(id: string, dataUrl: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, data: dataUrl, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Advertencia al guardar en IndexedDB:', e);
  }
}

/**
 * Recupera un elemento multimedia de IndexedDB
 */
export async function getMediaFromIndexedDB(id: string): Promise<string | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (_) {
    return null;
  }
}

/**
 * Convierte un DataURL (Base64) a Blob binario para subida eficiente
 */
export function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } | null {
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;

    const mimeType = match[1];
    const b64Data = match[2];
    const byteCharacters = atob(b64Data);
    const arrayBuffer = new ArrayBuffer(byteCharacters.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteCharacters.length; i++) {
      uint8Array[i] = byteCharacters.charCodeAt(i);
    }

    const blob = new Blob([arrayBuffer], { type: mimeType });
    return { blob, mimeType };
  } catch (e) {
    console.error('Error convirtiendo base64 a blob:', e);
    return null;
  }
}

/**
 * Sube un archivo o cadena base64 a Supabase Storage (bucket warranty-media)
 * y devuelve la URL pública HTTPS permanente.
 * Si falla o está offline, guarda en IndexedDB y devuelve el contenido de respaldo.
 */
export async function uploadWarrantyMedia(
  input: File | Blob | string,
  prefix = 'media'
): Promise<string> {
  // 1. Si ya es una URL externa de Supabase o internet, retornar tal cual
  if (typeof input === 'string') {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return input;
    }
  }

  try {
    let blob: Blob;
    let mimeType: string;
    let ext = 'webp';

    if (typeof input === 'string') {
      const parsed = dataUrlToBlob(input);
      if (!parsed) {
        return input;
      }
      blob = parsed.blob;
      mimeType = parsed.mimeType;
    } else {
      blob = input;
      mimeType = input.type || 'application/octet-stream';
    }

    if (mimeType.includes('mp4')) ext = 'mp4';
    else if (mimeType.includes('webm')) ext = 'webm';
    else if (mimeType.includes('quicktime') || mimeType.includes('mov')) ext = 'mov';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';

    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${cleanPrefix}_${Date.now()}_${randomSuffix}.${ext}`;
    const folder = cleanPrefix.startsWith('als_') ? 'alistamientos' : 'garantias';
    const filePath = `${folder}/${fileName}`;

    // Subir al bucket público en Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        contentType: mimeType,
        upsert: true,
      });

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        const publicUrl = publicUrlData.publicUrl;
        // Guardar copia local en IndexedDB indexada por URL
        if (typeof input === 'string') {
          saveMediaToIndexedDB(publicUrl, input);
        }
        return publicUrl;
      }
    } else {
      console.warn('[Supabase Storage] Advertencia al subir archivo:', uploadError.message);
    }
  } catch (err) {
    console.warn('[Supabase Storage] Excepción durante subida de medio:', err);
  }

  // Fallback: si falló la subida a Supabase, respaldar en IndexedDB y devolver el dataUrl
  if (typeof input === 'string') {
    const localId = `local_media_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await saveMediaToIndexedDB(localId, input);
    return input;
  }

  return '';
}
