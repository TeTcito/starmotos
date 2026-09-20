// src/components/ClientProfileView.tsx
import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Save,
  CheckCircle2,
  Calendar,
  Wrench,
  Gauge,
  Fuel,
  AlertTriangle,
  Clock,
  Sparkles,
  PlusCircle,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  FileEdit,
  Car,
} from 'lucide-react';
import { ClientProfile, MotorcycleClientData, ScheduledMaintenance, Branch } from '../types/customer';

interface Props {
  profile: ClientProfile;
  onUpdateProfile: (updated: ClientProfile) => void;
  motorcycle: MotorcycleClientData;
  onUpdateMotorcycle: (updated: MotorcycleClientData) => void;
  scheduledMaintenances: ScheduledMaintenance[];
  onScheduleNewMaintenance: (maintenance: ScheduledMaintenance) => void;
  branches: Branch[];
}

export const ClientProfileView: React.FC<Props> = ({
  profile,
  onUpdateProfile,
  motorcycle,
  onUpdateMotorcycle,
  scheduledMaintenances,
  onScheduleNewMaintenance,
  branches,
}) => {
  // Estado local para el formulario de perfil
  const [profileForm, setProfileForm] = useState<ClientProfile>(profile);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  // Estado local para el formulario de la moto (útil para el taller)
  const [motoForm, setMotoForm] = useState<MotorcycleClientData>(motorcycle);
  const [isMotoSaved, setIsMotoSaved] = useState(false);

  // Modal para agendar nuevo mantenimiento
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || 'matriz-quito');
  const [selectedServiceTitle, setSelectedServiceTitle] = useState('Mantenimiento Preventivo (Cambio de Aceite y Filtro)');
  const [scheduleDate, setScheduleDate] = useState('2026-09-25');
  const [scheduleTime, setScheduleTime] = useState('09:30');
  const [scheduleNotes, setScheduleNotes] = useState('');

  // Guardar perfil
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 3500);
  };

  // Guardar datos de la moto
  const handleSaveMoto = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMotorcycle(motoForm);
    setIsMotoSaved(true);
    setTimeout(() => setIsMotoSaved(false), 3500);
  };

  // Confirmar agendamiento de cita
  const handleConfirmSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = branches.find((b) => b.id === selectedBranchId) || branches[0];
    const newMaint: ScheduledMaintenance = {
      id: `maint-${Date.now()}`,
      serviceTitle: selectedServiceTitle,
      recommendedKm: motoForm.currentKm + 1000,
      recommendedDate: scheduleDate,
      scheduledDate: scheduleDate,
      scheduledTime: scheduleTime,
      branchName: branch.name,
      branchId: branch.id,
      status: 'confirmada',
      estimatedCost: 65.0,
      tasks: ['Cambio de Aceite Sintético', 'Filtro de Aceite OEM', 'Tensión de Cadena', 'Revisión Frenos'],
      notes: scheduleNotes || 'Cita solicitada desde el Portal del Cliente.',
    };

    onScheduleNewMaintenance(newMaint);
    setIsScheduleModalOpen(false);
    setScheduleNotes('');
  };

  // Cálculo de km restantes para próximo cambio de aceite
  const kmSinceLastOil = motoForm.currentKm - motoForm.lastOilChangeKm;
  const kmRemainingOil = Math.max(0, motoForm.oilChangeIntervalKm - kmSinceLastOil);
  const oilHealthPercentage = Math.max(0, Math.min(100, Math.round((kmRemainingOil / motoForm.oilChangeIntervalKm) * 100)));

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ========================================================================= */}
      {/* 1. SECCIÓN SUPERIOR: INFORMACIÓN DEL CLIENTE (PERFIL)                    */}
      {/* ========================================================================= */}
      <section className="bg-zinc-900/90 rounded-3xl p-5 sm:p-7 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Información y Perfil del Cliente
                </h2>
                <span className="text-[10px] bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Datos de Facturación SRI
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Mantén tus datos actualizados para recepción de proformas, facturas electrónicas y notificaciones de taller.
              </p>
            </div>
          </div>

          {isProfileSaved && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Perfil guardado correctamente!</span>
            </div>
          )}
        </div>

        {/* Formulario de Perfil */}
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Nombres y Apellidos */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Nombres y Apellidos Completos:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs placeholder:text-zinc-600 transition font-medium"
                />
              </div>
            </div>

            {/* Cédula o RUC */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Cédula o RUC (Facturación SRI):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <CreditCard className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={profileForm.idNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, idNumber: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono transition"
                />
              </div>
            </div>

            {/* Teléfono / WhatsApp */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Teléfono Celular / WhatsApp:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono transition"
                />
              </div>
            </div>

            {/* Correo Electrónico */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Correo Electrónico (Facturas Electrónicas):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs transition"
                />
              </div>
            </div>

            {/* Ciudad y Dirección */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Dirección de Domicilio / Ciudad:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Av. Principal y Secundaria, Quito"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs transition"
                />
              </div>
            </div>

            {/* Contacto de Emergencia */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Contacto de Emergencia (Nombre y Teléfono):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Phone className="w-4 h-4 text-red-400" />
                </div>
                <input
                  type="text"
                  value={`${profileForm.emergencyContactName} - ${profileForm.emergencyContactPhone}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parts = val.split('-');
                    setProfileForm({
                      ...profileForm,
                      emergencyContactName: parts[0] ? parts[0].trim() : '',
                      emergencyContactPhone: parts[1] ? parts[1].trim() : '',
                    });
                  }}
                  placeholder="Nombre Familiar - 0987654321"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs transition"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center gap-2 active:scale-98 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios de Perfil</span>
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* 2. SECCIÓN INFERIOR: FICHA DE LA MOTO & MANTENIMIENTOS PROGRAMADOS        */}
      {/* (CAMPOS QUE EL CLIENTE LLENA Y LE SIRVEN AL TALLER PARA USARLOS)           */}
      {/* ========================================================================= */}
      <section className="bg-zinc-900/90 rounded-3xl p-5 sm:p-7 border border-zinc-800 shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado de la Sección */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center shadow-lg">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Ficha de la Motocicleta & Mantenimientos Programados
                </h2>
                <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Uso Taller
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Esta información la utilizas tú y la revisa el jefe de taller antes de recibir tu motocicleta.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl shadow-lg shadow-red-600/25 transition flex items-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Agendar Nuevo Servicio</span>
            </button>
          </div>
        </div>

        {/* Ficha Rápida del Vehículo con Matrícula Ecuatoriana */}
        <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 rounded-2xl p-4 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Placa Ecuatoriana */}
            <div className="shrink-0 flex flex-col items-center bg-white text-zinc-950 px-3 py-1 rounded-lg border-2 border-zinc-300 shadow-md font-mono">
              <div className="flex items-center gap-1 w-full justify-center text-[7px] font-black tracking-widest text-zinc-800 uppercase border-b border-zinc-200 pb-0.5">
                <span className="inline-block w-2.5 h-1.5 bg-gradient-to-r from-yellow-400 via-blue-600 to-red-600 rounded-[1px]" />
                <span>ECUADOR</span>
              </div>
              <span className="text-sm font-black tracking-wider leading-none mt-1">
                {motoForm.plate}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-red-500 uppercase tracking-wide">
                {motoForm.brand}
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                {motoForm.model} ({motoForm.year})
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Cilindraje: {motoForm.displacement} • Color: {motoForm.color}
              </p>
            </div>
          </div>

          {/* Estado del Aceite & Kilometraje */}
          <div className="flex items-center gap-4 bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                Odómetro Reportado:
              </span>
              <span className="text-sm font-black text-white font-mono">
                {motoForm.currentKm.toLocaleString()} KM
              </span>
            </div>
            <div className="border-l border-zinc-800 pl-4">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                Vida Aceite:
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      oilHealthPercentage > 40
                        ? 'bg-emerald-500'
                        : oilHealthPercentage > 15
                        ? 'bg-amber-500'
                        : 'bg-red-500 animate-pulse'
                    }`}
                    style={{ width: `${oilHealthPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-zinc-200">{oilHealthPercentage}%</span>
              </div>
              <span className="text-[9px] text-zinc-500 block font-mono">
                Faltan ~{kmRemainingOil.toLocaleString()} km para cambio
              </span>
            </div>
          </div>
        </div>

        {/* Formulario Técnico que el Cliente llena para el Taller */}
        <form onSubmit={handleSaveMoto} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Kilometraje Actual Reportado */}
            <div className="bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800/80">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-200 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-blue-400" />
                  Actualizar Kilometraje:
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">KM</span>
              </label>
              <input
                type="number"
                value={motoForm.currentKm}
                onChange={(e) => setMotoForm({ ...motoForm, currentKm: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-750 focus:border-blue-500 text-white rounded-xl px-3 py-2 text-sm font-mono font-bold"
                placeholder="ej. 15200"
              />
              <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                El taller calcula las alertas preventivas según el km que ingreses aquí.
              </p>
            </div>

            {/* Aceite Usado Habitualmente */}
            <div className="bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800/80">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-200 mb-1.5 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-amber-400" />
                Aceite Usado Habitualmente:
              </label>
              <select
                value={motoForm.preferredOil}
                onChange={(e) => setMotoForm({ ...motoForm, preferredOil: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-750 focus:border-blue-500 text-white rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
              >
                <option value="Motul 7100 10W-40 100% Sintético">Motul 7100 10W-40 (100% Sintético Ester)</option>
                <option value="Motul 5100 15W-50 Semi-Sintético">Motul 5100 15W-50 (Technosynthese)</option>
                <option value="Castrol Power1 10W-40 4T">Castrol Power1 10W-40 4T</option>
                <option value="Yamalube 10W-40 4T Full Synthetic">Yamalube 10W-40 Full Synthetic</option>
                <option value="Liqui Moly Street Race 10W-40">Liqui Moly Street Race 10W-40</option>
                <option value="Recomendación Oficial del Mecánico">Recomendación Oficial del Mecánico</option>
              </select>
              <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                Permite al mecánico preparar los galones y filtros antes de que llegues.
              </p>
            </div>

            {/* Preferencia de Repuestos */}
            <div className="bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800/80">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-200 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Preferencia de Repuestos:
              </label>
              <select
                value={motoForm.preferredPartsQuality}
                onChange={(e) => setMotoForm({ ...motoForm, preferredPartsQuality: e.target.value as any })}
                className="w-full bg-zinc-900 border border-zinc-750 focus:border-blue-500 text-white rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
              >
                <option value="originales_oem">100% Originales OEM (Garantía Máxima)</option>
                <option value="alternativos_premium">Alternativos de Alta Gama (Brembo, Regina, NGK)</option>
              </select>
              <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                Ayuda a los asesores a cotizarte con tu presupuesto preferido.
              </p>
            </div>

            {/* Síntomas o Fallas Detectadas por el Cliente (CRÍTICO PARA EL TALLER) */}
            <div className="md:col-span-2 lg:col-span-3 bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Síntomas, Ruidos o Fallas que has Notado (Reporte para el Mecánico):
                </label>
                <span className="text-[10px] text-zinc-500">Visible en la orden de ingreso</span>
              </div>
              <textarea
                value={motoForm.reportedSymptoms}
                onChange={(e) => setMotoForm({ ...motoForm, reportedSymptoms: e.target.value })}
                rows={3}
                placeholder="Ejemplo: 'Siento un chillido al frenar adelante a baja velocidad, la cadena salta en segunda marcha y le cuesta encender en las mañanas frías'..."
                className="w-full bg-zinc-900 border border-zinc-750 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white rounded-xl p-3 text-xs leading-relaxed placeholder:text-zinc-600 transition"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Este reporte le ahorra tiempo al técnico en el elevador para que diagnostique exactamente lo que te preocupa.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {isMotoSaved ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Ficha del taller actualizada con éxito.
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500">
                Los datos se sincronizan con la base de datos de StarMotos.
              </span>
            )}

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-lg shadow-red-600/25 transition flex items-center gap-2 active:scale-98 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Ficha Técnica para el Taller</span>
            </button>
          </div>
        </form>

        {/* ========================================================================= */}
        {/* LISTA DE MANTENIMIENTOS PROGRAMADOS Y CITAS AGENDADAS                    */}
        {/* ========================================================================= */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-200">
                Mantenimientos Programados & Citas Activas ({scheduledMaintenances.length})
              </h3>
            </div>
            <span className="text-[10px] text-zinc-500">Soporte Multi-Sucursal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {scheduledMaintenances.map((maint) => (
              <div
                key={maint.id}
                className="bg-zinc-950/80 rounded-2xl p-4 border border-zinc-800/90 shadow-md space-y-3 hover:border-zinc-700 transition"
              >
                <div className="flex items-start justify-between gap-2 border-b border-zinc-850 pb-2.5">
                  <div>
                    <span className="text-xs font-black text-white block">{maint.serviceTitle}</span>
                    <span className="text-[10px] text-blue-400 font-mono">
                      Recomendado a los {maint.recommendedKm.toLocaleString()} KM
                    </span>
                  </div>

                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    {maint.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                  <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 block">Fecha y Hora:</span>
                    <span className="font-bold text-white">
                      {maint.scheduledDate || maint.recommendedDate} {maint.scheduledTime ? `• ${maint.scheduledTime}` : ''}
                    </span>
                  </div>
                  <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 block">Sucursal Asignada:</span>
                    <span className="font-bold text-white truncate block">{maint.branchName.replace('StarMotos ', '')}</span>
                  </div>
                </div>

                {/* Tareas del servicio */}
                <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-850">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Trabajos contemplados:</span>
                  <ul className="list-disc list-inside text-zinc-300 text-[11px] space-y-0.5">
                    {maint.tasks.map((task, idx) => (
                      <li key={idx}>{task}</li>
                    ))}
                  </ul>
                </div>

                {maint.notes && (
                  <p className="text-[10px] text-zinc-400 italic bg-zinc-900/30 p-2 rounded-lg border border-zinc-850">
                    Nota: "{maint.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MODAL: AGENDAR NUEVO MANTENIMIENTO / CITA EN TALLER                       */}
      {/* ========================================================================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Agendar Cita de Mantenimiento</h3>
                  <p className="text-[11px] text-zinc-400">Selecciona sucursal, fecha y trabajos</p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule} className="p-5 space-y-4 text-xs">
              {/* Tipo de Servicio */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                  Tipo de Mantenimiento Requerido:
                </label>
                <select
                  value={selectedServiceTitle}
                  onChange={(e) => setSelectedServiceTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-medium"
                >
                  <option value="Mantenimiento Preventivo (Cambio de Aceite y Filtro)">
                    Mantenimiento Preventivo (Aceite 10W-40 + Filtro + Cadena)
                  </option>
                  <option value="Servicio Mayor / Afinamiento de Motor">
                    Servicio Mayor (Regulación Válvulas + Sincronización Inyección + Bujías)
                  </option>
                  <option value="Revisión de Frenos y Cambio de Pastillas">
                    Sistema de Frenos (Pastillas + Líquido DOT 5.1)
                  </option>
                  <option value="Kit de Arrastre y Transmisión">
                    Kit de Arrastre (Desmontaje y Montaje de Cadena/Catalina/Piñón)
                  </option>
                  <option value="Diagnóstico Eléctrico y Batería">
                    Diagnóstico Eléctrico / Falla de Carga
                  </option>
                </select>
              </div>

              {/* Sucursal */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                  Sucursal StarMotos:
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-medium"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.address})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Fecha Deseada:
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Hora Estimada:
                  </label>
                  <select
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs font-mono"
                  >
                    <option value="08:30">08:30 AM</option>
                    <option value="09:30">09:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Notas del cliente para el taller */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                  Comentario / Solicitud Especial para el Taller:
                </label>
                <textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej: Necesito que revisen la presión de las llantas además del cambio de aceite..."
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs placeholder:text-zinc-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 font-bold hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30"
                >
                  Confirmar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
