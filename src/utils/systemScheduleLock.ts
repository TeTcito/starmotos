// src/utils/systemScheduleLock.ts
import { useState, useEffect, useCallback } from 'react';

export type ScheduleLockMode = 'auto' | 'manual_locked' | 'manual_unlocked';

export interface ScheduleLockStatus {
  isLocked: boolean; // Si los roles secundarios (taller, garante, gps, cliente) deben estar bloqueados
  mode: ScheduleLockMode;
  isNightTime: boolean; // True si la hora local está entre las 22:00 (10 PM) y 06:59 (7 AM)
  currentHour: number;
  currentMinute: number;
  formattedTime: string;
  reason: 'schedule_auto' | 'manual_forced' | 'none';
  statusMessage: string;
  nextTransitionText: string;
}

const STORAGE_KEY = 'starmotos_schedule_lock_mode';
const LOCK_START_HOUR = 22; // 10:00 PM
const LOCK_END_HOUR = 7;   // 07:00 AM

export function getStoredLockMode(): ScheduleLockMode {
  if (typeof window === 'undefined') return 'auto';
  const val = localStorage.getItem(STORAGE_KEY);
  if (val === 'manual_locked' || val === 'manual_unlocked' || val === 'auto') {
    return val;
  }
  return 'auto';
}

export function setStoredLockMode(mode: ScheduleLockMode): ScheduleLockStatus {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, mode);
  }
  const status = calculateLockStatus(mode);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('starmotos_schedule_lock_changed', { detail: status }));
  }
  return status;
}

export function calculateLockStatus(mode: ScheduleLockMode = getStoredLockMode()): ScheduleLockStatus {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Es horario nocturno si son las 22:00 en adelante (>=22) o antes de las 07:00 (<7)
  const isNightTime = currentHour >= LOCK_START_HOUR || currentHour < LOCK_END_HOUR;

  let isLocked = false;
  let reason: 'schedule_auto' | 'manual_forced' | 'none' = 'none';

  if (mode === 'manual_locked') {
    isLocked = true;
    reason = 'manual_forced';
  } else if (mode === 'manual_unlocked') {
    isLocked = false;
    reason = 'none';
  } else {
    // Modo automático: bloquea de 10:00 PM a 07:00 AM
    isLocked = isNightTime;
    reason = isNightTime ? 'schedule_auto' : 'none';
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedTime = `${pad(currentHour)}:${pad(currentMinute)}`;

  let statusMessage = '';
  let nextTransitionText = '';

  if (mode === 'manual_locked') {
    statusMessage = 'Bloqueo manual forzado activo. Solo administración tiene acceso.';
    nextTransitionText = 'Manual: Mantener o restaurar a modo automático.';
  } else if (mode === 'manual_unlocked') {
    statusMessage = 'Desbloqueo manual activo. Sedes habilitadas temporalmente.';
    nextTransitionText = 'Manual: Sedes con acceso libre.';
  } else if (isNightTime) {
    statusMessage = 'Bloqueo nocturno automático activo (10:00 PM a 07:00 AM). Solo la administración puede ingresar.';
    nextTransitionText = 'Se reactivará automáticamente a las 07:00 AM.';
  } else {
    statusMessage = 'Horario diurno activo. Todas las sedes operativas.';
    nextTransitionText = 'El bloqueo automático se activará a las 10:00 PM.';
  }

  return {
    isLocked,
    mode,
    isNightTime,
    currentHour,
    currentMinute,
    formattedTime,
    reason,
    statusMessage,
    nextTransitionText,
  };
}

/**
 * Hook para escuchar en tiempo real el estado de bloqueo de horario del sistema
 */
export function useSystemScheduleLock() {
  const [status, setStatus] = useState<ScheduleLockStatus>(() => calculateLockStatus());

  const updateStatus = useCallback(() => {
    setStatus(calculateLockStatus());
  }, []);

  useEffect(() => {
    updateStatus();

    // Comprobar cada 15 segundos para reaccionar al llegar a las 22:00 o 07:00
    const interval = setInterval(updateStatus, 15000);

    const handleCustom = (e: any) => {
      if (e?.detail) {
        setStatus(e.detail);
      } else {
        updateStatus();
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        updateStatus();
      }
    };

    window.addEventListener('starmotos_schedule_lock_changed', handleCustom);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('starmotos_schedule_lock_changed', handleCustom);
      window.removeEventListener('storage', handleStorage);
    };
  }, [updateStatus]);

  const toggleManualLock = useCallback(() => {
    const currentMode = status.mode;
    if (currentMode === 'manual_locked') {
      // Si estaba bloqueado forzado, volver a auto
      setStoredLockMode('auto');
    } else {
      // Forzar bloqueo
      setStoredLockMode('manual_locked');
    }
  }, [status.mode]);

  const setMode = useCallback((newMode: ScheduleLockMode) => {
    setStoredLockMode(newMode);
  }, []);

  return {
    ...status,
    toggleManualLock,
    setMode,
    refreshStatus: updateStatus,
  };
}
