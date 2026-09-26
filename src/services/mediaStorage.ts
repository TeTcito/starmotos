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
 * Valida si una cadena es un DataURL válido con contenido suficiente y sin caracteres corruptos
 */
export function isValidDataUrl(dataUrl: string): boolean {
  if (!dataUrl || typeof dataUrl !== 'string') return false;
  if (!dataUrl.startsWith('data:')) return false;
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return false;
  const dataPart = dataUrl.slice(commaIdx + 1).trim();
  if (dataPart.length < 20) return false;
  if (dataPart.includes('…') || dataPart.includes('...')) return false;
  return true;
}

/**
 * Convierte un DataURL (Base64) a Blob binario para subida eficiente
 */
export function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } | null {
  if (!dataUrl || typeof dataUrl !== 'string' || !isValidDataUrl(dataUrl)) {
    return null;
  }

  try {
    const commaIdx = dataUrl.indexOf(',');
    const header = dataUrl.slice(0, commaIdx);
    let b64Data = dataUrl.slice(commaIdx + 1);

    // Extraer mimeType del header
    const mimeMatch = header.match(/^data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/webp';

    // Limpieza estricta de b64Data (espacios, saltos de línea, caracteres corruptos)
    b64Data = b64Data.trim().replace(/\s+/g, '');

    if (b64Data.includes('…') || b64Data.includes('...')) {
      return null;
    }

    // Decodificar si viene con encoding URL
    if (b64Data.includes('%')) {
      try {
        b64Data = decodeURIComponent(b64Data);
      } catch (_) {}
    }

    // Convertir URL-safe Base64 a Base64 estándar
    b64Data = b64Data.replace(/-/g, '+').replace(/_/g, '/');

    // Reparar padding '=' si no es múltiplo de 4
    const padLen = (4 - (b64Data.length % 4)) % 4;
    if (padLen > 0) {
      b64Data += '='.repeat(padLen);
    }

    // Validar que solo contenga caracteres válidos en Base64
    if (!/^[A-Za-z0-9+/=]+$/.test(b64Data)) {
      return null;
    }

    const byteCharacters = atob(b64Data);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const blob = new Blob([byteNumbers], { type: mimeType });
    return { blob, mimeType };
  } catch (_) {
    // Si la cadena está corrupta o incompleta, retornar null silenciosamente sin alertar con errores rojos
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
    if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('idb:')) {
      return input;
    }
  }

  try {
    let blob: Blob;
    let mimeType: string;
    let ext = 'webp';

    if (typeof input === 'string') {
      if (input.startsWith('data:')) {
        const parsed = dataUrlToBlob(input);
        if (!parsed) {
          // DataURL corrupto o incompleto: no retornar cadena rota para evitar net::ERR_INVALID_URL
          return '';
        }
        blob = parsed.blob;
        mimeType = parsed.mimeType;
      } else {
        return input;
      }
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
