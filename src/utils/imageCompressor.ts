// src/utils/imageCompressor.ts

/**
 * Comprime y convierte una imagen a formato .WEBP ultraligero
 * para optimizar el almacenamiento en LocalStorage y Supabase.
 * Reduce imágenes de 5-15MB a 50-120KB manteniendo nitidez para peritajes.
 */
export async function compressImageBase64(
  input: File | Blob | string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    // Si ya es un URL web externo (http:// o https://), devolver tal cual
    if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))) {
      resolve(input);
      return;
    }

    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calcular proporción manteniendo aspecto
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof input === 'string' ? input : '');
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      try {
        // Intentar compresión nativa a WEBP (30-40% más liviano que JPG)
        let compressedDataUrl = canvas.toDataURL('image/webp', quality);
        if (!compressedDataUrl.startsWith('data:image/webp')) {
          // Fallback a JPEG si el motor del navegador no soporta webp export
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(compressedDataUrl);
      } catch {
        resolve(typeof input === 'string' ? input : '');
      }
    };

    img.onerror = () => {
      resolve(typeof input === 'string' ? input : '');
    };

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(input);
    }
  });
}

/**
 * Comprime un archivo de video a un formato ligero (.webm / .mp4 con bitrate optimizado)
 * para evitar sobrecarga en la base de datos o almacenamiento.
 * Si el video es menor a 1.2MB, se procesa directamente en base64.
 * Si es más grande, se re-codifica mediante Canvas + MediaRecorder a resolución diagnóstica (max 640x480, 500kbps).
 */
export async function compressVideoBase64(
  file: File | Blob,
  maxWidth = 640,
  maxHeight = 480,
  maxDurationSec = 35
): Promise<string> {
  return new Promise((resolve) => {
    // 1. Si es menor a 1.2 MB, leer directamente sin necesidad de re-muestreo pesado
    if (file.size <= 1.2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    // 2. Transcodificación en cliente con MediaRecorder y Canvas
    const canRecord = typeof MediaRecorder !== 'undefined';
    if (!canRecord) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;

    const cleanup = () => {
      try {
        URL.revokeObjectURL(videoUrl);
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch (_) {}
    };

    const fallbackReader = () => {
      cleanup();
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    };

    video.onloadedmetadata = () => {
      let width = video.videoWidth || 640;
      let height = video.videoHeight || 480;

      // Escalar dimensiones a resolución liviana
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      // Asegurar números pares para códecs de video
      width = width % 2 === 0 ? width : width - 1;
      height = height % 2 === 0 ? height : height - 1;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx || typeof canvas.captureStream !== 'function') {
        fallbackReader();
        return;
      }

      let mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        } else {
          mimeType = '';
        }
      }

      try {
        const stream = canvas.captureStream(20);
        const options: MediaRecorderOptions = {
          videoBitsPerSecond: 450_000, // 450 kbps ultra ligero
        };
        if (mimeType) options.mimeType = mimeType;

        const recorder = new MediaRecorder(stream, options);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          cleanup();
          const compressedBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = () => fallbackReader();
          r.readAsDataURL(compressedBlob);
        };

        recorder.start(100);

        let isRunning = true;
        const startTime = Date.now();

        const drawFrame = () => {
          if (!isRunning) return;
          if (video.paused || video.ended || (Date.now() - startTime) > maxDurationSec * 1000) {
            isRunning = false;
            if (recorder.state === 'recording') {
              recorder.stop();
            }
            return;
          }
          ctx.drawImage(video, 0, 0, width, height);
          requestAnimationFrame(drawFrame);
        };

        video.onended = () => {
          isRunning = false;
          if (recorder.state === 'recording') recorder.stop();
        };

        video.play().then(() => {
          drawFrame();
        }).catch(() => {
          fallbackReader();
        });

      } catch (_) {
        fallbackReader();
      }
    };

    video.onerror = () => {
      fallbackReader();
    };
  });
}
