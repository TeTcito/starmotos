// src/utils/imageCompressor.ts

/**
 * Comprime y redimensiona una imagen para optimizar el almacenamiento en LocalStorage y Supabase.
 * Limita el ancho/alto a un máximo (default 1200px) y convierte a JPEG con compresión (default 0.75).
 * Esto reduce imágenes de 5-10MB a 70-150KB sin pérdida perceptible de calidad visual.
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

      // Calcular proporción
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
        // Fallback si no hay soporte de canvas
        resolve(typeof input === 'string' ? input : '');
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
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
