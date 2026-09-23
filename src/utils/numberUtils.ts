// src/utils/numberUtils.ts
import React from 'react';

/**
 * Limpia y normaliza la entrada de campos numéricos en formularios.
 * - Evita que un 0 inicial se quede pegado a la izquierda al escribir (ej: escribir 20 en un campo con '0' no produce '020' sino '20').
 * - Permite borrar completamente el campo (retorna '') para que el usuario pueda escribir limpiamente.
 * - Respeta valores decimales como '0.5' o '0.75'.
 */
export function cleanNumberInput(raw: string | number | undefined | null): string {
  if (raw === '' || raw === undefined || raw === null) return '';
  let cleaned = String(raw).trim();
  // Si comienza con ceros seguidos de dígitos no decimales (ej: "02", "020", "005"), remover los ceros iniciales
  if (cleaned.length > 1 && cleaned.startsWith('0') && !cleaned.startsWith('0.')) {
    cleaned = cleaned.replace(/^0+/, '');
    if (cleaned === '') cleaned = '0';
  }
  return cleaned;
}

/**
 * Evento onFocus reutilizable para inputs numéricos.
 * Selecciona automáticamente todo el texto al hacer clic o foco, de modo que cualquier tecla sobrescriba el valor actual.
 */
export function selectOnFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  try {
    e.target.select();
  } catch {
    // Ignorar si el navegador no soporta select en ciertos tipos
  }
}
