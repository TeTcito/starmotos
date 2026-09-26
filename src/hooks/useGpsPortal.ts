// src/hooks/useGpsPortal.ts
import { useState, useEffect, useCallback } from 'react';
import { GpsRecord, GpsProfile, GpsSection, SystemAlert } from '../types/customer';
import {
  getStoredGpsRecords,
  saveStoredGpsRecord,
  getStoredGpsProfile,
  saveStoredGpsProfile,
  addStoredAlerts,
} from '../data/mockMultiRoleData';

export function useGpsPortal() {
  const [activeSection, setActiveSection] = useState<GpsSection>('solicitudes_gps');
  const [records, setRecords] = useState<GpsRecord[]>(getStoredGpsRecords);
  const [profile, setProfile] = useState<GpsProfile>(getStoredGpsProfile);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modal para asignación de credenciales
  const [selectedRecordForAssign, setSelectedRecordForAssign] = useState<GpsRecord | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Sincronización reactiva con eventos
  useEffect(() => {
    const handleUpdate = () => {
      setRecords(getStoredGpsRecords());
    };
    const handleProfileUpdate = () => {
      setProfile(getStoredGpsProfile());
    };

    window.addEventListener('starmotos_gps_updated', handleUpdate);
    window.addEventListener('starmotos_gps_profile_updated', handleProfileUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('starmotos_gps_updated', handleUpdate);
      window.removeEventListener('starmotos_gps_profile_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const pendingRequests = records.filter((r) => r.estado === 'pendiente');
  const activeRequests = records.filter((r) => r.estado === 'activa');
  const historyRequests = records.filter((r) => r.estado !== 'pendiente');

  const openAssignModal = useCallback((record: GpsRecord) => {
    setSelectedRecordForAssign(record);
    setIsAssignModalOpen(true);
  }, []);

  const closeAssignModal = useCallback(() => {
    setIsAssignModalOpen(false);
    setSelectedRecordForAssign(null);
  }, []);

  const assignCredentials = useCallback(
    (recordId: string, user: string, pass: string) => {
      const target = records.find((r) => r.id === recordId);
      if (!target) return;

      const updatedRecord: GpsRecord = {
        ...target,
        estado: 'activa',
        gpsUser: user.trim(),
        gpsPassword: pass.trim(),
        fechaAprobacion: new Date().toISOString().split('T')[0],
        aprobadoPor: profile.fullName || 'Operador GPS Central',
        updatedAt: new Date().toISOString(),
      };

      saveStoredGpsRecord(updatedRecord);
      setRecords((prev) => prev.map((r) => (r.id === recordId ? updatedRecord : r)));
      closeAssignModal();

      // Crear alerta de sistema para Matriz
      const alert: SystemAlert = {
        id: `alt-gps-${Date.now()}`,
        type: 'info',
        targetRole: 'admin',
        title: `🔑 Credenciales GPS Asignadas: ${target.nombres} ${target.apellidos}`,
        message: `El operador GPS asignó las credenciales para la moto ${target.modeloMarca} (${target.placa}). Usuario: "${user}". Ya puedes visualizarlas en Matriz.`,
        timestamp: 'Ahora mismo',
        read: false,
        relatedId: target.id,
      };
      addStoredAlerts(alert);

      showToast(`¡Credenciales asignadas exitosamente a ${target.nombres}!`, 'success');
    },
    [records, profile.fullName, closeAssignModal, showToast]
  );

  const updateProfile = useCallback(
    (newProfile: GpsProfile) => {
      setProfile(newProfile);
      saveStoredGpsProfile(newProfile);
      showToast('Perfil de operador GPS actualizado.', 'success');
    },
    [showToast]
  );

  return {
    activeSection,
    setActiveSection,
    records,
    pendingRequests,
    activeRequests,
    historyRequests,
    profile,
    updateProfile,
    selectedRecordForAssign,
    isAssignModalOpen,
    openAssignModal,
    closeAssignModal,
    assignCredentials,
    toastMessage,
    showToast,
  };
}
