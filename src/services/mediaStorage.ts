// src/services/mediaStorage.ts
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

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
 * Realiza la subida de un Blob/File a Supabase Storage mediante XMLHttpRequest
 * para permitir reporte de progreso en tiempo real y timeout extendido en redes móviles.
 */
function uploadViaXhr(
  url: string,
  blob: Blob,
  mimeType: string,
  onProgress?: (percent: number, loaded: number, total: number) => void
): Promise<{ ok: boolean; status: number }> {
  return new Promise((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
      xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Content-Type', mimeType);
      xhr.setRequestHeader('cache-control', 'max-age=31536000');
      xhr.setRequestHeader('x-upsert', 'true');
      xhr.timeout = 300000; // 5 minutos de timeout para subidas de video en redes móviles

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && e.total > 0) {
            const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
            onProgress(percent, e.loaded, e.total);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (onProgress && blob.size > 0) {
            onProgress(100, blob.size, blob.size);
          }
          resolve({ ok: true, status: xhr.status });
        } else {
          console.warn('[Supabase Storage XHR] Status no exitoso:', xhr.status, xhr.responseText);
          resolve({ ok: false, status: xhr.status });
        }
      };

      xhr.onerror = () => {
        console.warn('[Supabase Storage XHR] Error de red.');
        resolve({ ok: false, status: 0 });
      };

      xhr.ontimeout = () => {
        console.warn('[Supabase Storage XHR] Tiempo de espera agotado.');
        resolve({ ok: false, status: 408 });
      };

      xhr.send(blob);
    } catch (e) {
      console.warn('[Supabase Storage XHR] Excepción al enviar XHR:', e);
      resolve({ ok: false, status: 500 });
    }
  });
}

/**
 * Valida si una cadena es un DataURL válido con contenido suficiente y sin caracteres corruptos.
 * Soporta tanto imágenes (data:image/) como videos diagnósticos (data:video/).
 */
export function isValidDataUrl(dataUrl: string): boolean {
  if (!dataUrl || typeof dataUrl !== 'string') return false;
  const isImage = dataUrl.startsWith('data:image/');
  const isVideo = dataUrl.startsWith('data:video/');
  if (!isImage && !isVideo) return false;

  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return false;

  let b64Data = dataUrl.slice(commaIdx + 1).trim().replace(/\s+/g, '');
  if (b64Data.length < 50) return false;
  if (b64Data.includes('…') || b64Data.includes('...')) return false;
  if (b64Data.length % 4 === 1) return false;

  b64Data = b64Data.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (b64Data.length % 4)) % 4;
  if (padLen > 0) {
    b64Data += '='.repeat(padLen);
  }

  const sampleToCheck = b64Data.slice(0, 500);
  if (!/^[A-Za-z0-9+/=]+$/.test(sampleToCheck)) {
    return false;
  }

  try {
    const decodedSample = atob(sampleToCheck.slice(0, 120));
    if (dataUrl.includes('image/webp')) {
      if (!decodedSample.startsWith('RIFF') || !decodedSample.includes('WEBP')) {
        return false;
      }
    }
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Valida si una URL de medio es segura y válida para renderizar en etiquetas <img> o <video> sin provocar ERR_INVALID_URL
 */
export function isValidMediaUrl(url: unknown): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return true;
  }
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('data:video/')) {
    return isValidDataUrl(trimmed);
  }
  return false;
}

/**
 * Limpia y purga proactivamente de localStorage cualquier DataURL corrupto o incompleto
 * (generado previamente por errores de cuota o slicing) para evitar net::ERR_INVALID_URL.
 */
export function cleanCorruptedMediaFromLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const raw = localStorage.getItem(key);
      if (!raw || (!raw.includes('data:image/') && !raw.includes('data:video/') && !raw.includes('idb:'))) continue;

      try {
        let changed = false;
        const cleanValue = (val: any): any => {
          if (typeof val === 'string') {
            if (val.startsWith('data:image/') || val.startsWith('data:video/')) {
              if (!isValidDataUrl(val)) {
                changed = true;
                return '';
              }
            } else if (val.startsWith('idb:')) {
              changed = true;
              return '';
            }
            return val;
          }
          if (Array.isArray(val)) {
            const nextArr = val
              .map(cleanValue)
              .filter((item) => item !== '' && item !== null && item !== undefined);
            if (nextArr.length !== val.length) {
              changed = true;
            }
            return nextArr;
          }
          if (val && typeof val === 'object') {
            const nextObj: Record<string, any> = {};
            for (const [k, v] of Object.entries(val)) {
              nextObj[k] = cleanValue(v);
            }
            return nextObj;
          }
          return val;
        };

        const parsed = JSON.parse(raw);
        const cleaned = cleanValue(parsed);
        if (changed) {
          localStorage.setItem(key, JSON.stringify(cleaned));
          console.info(`[Storage Sanitizer] Se limpiaron medios corruptos de ${key}`);
        }
      } catch (_) {
        // Ignorar claves no JSON
      }
    }
  } catch (err) {
    console.warn('[Storage Sanitizer] Error al sanitizar localStorage:', err);
  }
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

    const mimeMatch = header.match(/^data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : (header.includes('video') ? 'video/mp4' : 'image/webp');

    b64Data = b64Data.trim().replace(/\s+/g, '');

    if (b64Data.includes('%')) {
      try {
        b64Data = decodeURIComponent(b64Data);
      } catch (_) {}
    }

    b64Data = b64Data.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (b64Data.length % 4)) % 4;
    if (padLen > 0) {
      b64Data += '='.repeat(padLen);
    }

    const byteCharacters = atob(b64Data);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const blob = new Blob([byteNumbers], { type: mimeType });
    return { blob, mimeType };
  } catch (_) {
    return null;
  }
}

/**
 * Sube un archivo, blob o cadena base64 a Supabase Storage (bucket warranty-media)
 * y devuelve la URL pública HTTPS permanente.
 * Incluye soporte de progreso en tiempo real (0%-100%) y fallback offline.
 */
export async function uploadWarrantyMedia(
  input: File | Blob | string,
  prefix = 'media',
  onProgress?: (percent: number, loaded: number, total: number) => void
): Promise<string> {
  // 1. Si ya es una URL externa de Supabase o internet, retornar tal cual
  if (typeof input === 'string') {
    if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('idb:')) {
      return input;
    }
  }

  let blob: Blob;
  let mimeType: string;
  let ext = 'webp';

  try {
    if (typeof input === 'string') {
      if (input.startsWith('data:')) {
        const parsed = dataUrlToBlob(input);
        if (!parsed) {
          return '';
        }
        blob = parsed.blob;
        mimeType = parsed.mimeType;
      } else if (input.startsWith('blob:')) {
        try {
          const res = await fetch(input);
          blob = await res.blob();
          mimeType = blob.type || 'video/mp4';
        } catch (_) {
          return '';
        }
      } else {
        return input;
      }
    } else {
      blob = input;
      mimeType = input.type || 'application/octet-stream';
    }

    // Normalización de extensiones y tipos MIME para máxima compatibilidad cross-platform
    if (mimeType.includes('mp4') || mimeType.includes('m4v')) {
      ext = 'mp4';
      mimeType = 'video/mp4';
    } else if (mimeType.includes('webm')) {
      ext = 'webm';
      mimeType = 'video/webm';
    } else if (mimeType.includes('quicktime') || mimeType.includes('mov')) {
      // Normalizar videos de iPhone/QuickTime a .mp4 para compatibilidad universal en Android/Windows
      ext = 'mp4';
      mimeType = 'video/mp4';
    } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      ext = 'jpg';
    } else if (mimeType.includes('png')) {
      ext = 'png';
    } else if (mimeType.includes('webp')) {
      ext = 'webp';
    } else if (input instanceof File && input.name) {
      const parts = input.name.split('.');
      if (parts.length > 1) {
        const fileExt = parts.pop()?.toLowerCase();
        if (fileExt === 'mov' || fileExt === 'mp4' || fileExt === 'm4v') {
          ext = 'mp4';
          mimeType = 'video/mp4';
        } else if (fileExt) {
          ext = fileExt;
        }
      }
    }

    // Si el prefijo indica video y el tipo quedó genérico, forzar video/mp4
    if (prefix.toLowerCase().includes('video') && (!mimeType || mimeType === 'application/octet-stream')) {
      mimeType = 'video/mp4';
      ext = 'mp4';
    }

    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${cleanPrefix}_${Date.now()}_${randomSuffix}.${ext}`;
    const folder = cleanPrefix.startsWith('als_') ? 'alistamientos' : 'garantias';
    const filePath = `${folder}/${fileName}`;

    let uploadSuccess = false;

    // Subida primaria con XHR para tracking de progreso en vivo y timeout extendido
    if (typeof window !== 'undefined' && window.XMLHttpRequest && SUPABASE_URL && SUPABASE_ANON_KEY) {
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`;
      const res = await uploadViaXhr(uploadUrl, blob, mimeType, onProgress);
      uploadSuccess = res.ok;
    }

    // Fallback secundario con SDK de Supabase si XHR no pudo usarse
    if (!uploadSuccess) {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, blob, {
          contentType: mimeType,
          cacheControl: '31536000',
          upsert: true,
        });
      uploadSuccess = !uploadError;
      if (uploadError) {
        console.warn('[Supabase Storage] Error en subida SDK:', uploadError.message);
      }
    }

    if (uploadSuccess) {
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        const publicUrl = publicUrlData.publicUrl;
        if (typeof input === 'string' && input.startsWith('data:')) {
          saveMediaToIndexedDB(publicUrl, input);
        }
        return publicUrl;
      }
    }
  } catch (err) {
    console.warn('[Supabase Storage] Excepción durante subida de medio:', err);
  }

  // Fallback de contingencia: si falló la subida a Supabase, respaldar en IndexedDB
  if (typeof input === 'string' && input.startsWith('data:')) {
    const localId = `local_media_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await saveMediaToIndexedDB(localId, input);
    return input;
  } else if (typeof input !== 'string') {
    try {
      const fallbackDataUrl = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string) || '');
        r.onerror = () => resolve('');
        r.readAsDataURL(blob);
      });
      if (fallbackDataUrl && isValidDataUrl(fallbackDataUrl)) {
        const localId = `local_media_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await saveMediaToIndexedDB(localId, fallbackDataUrl);
        return fallbackDataUrl;
      }
    } catch (_) {}
  }

  return '';
}
