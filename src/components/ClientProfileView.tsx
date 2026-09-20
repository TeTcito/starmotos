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
  PlusCircle,
  ShieldCheck,
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
  const [profileForm, setProfileForm] = useState<ClientProfile>(profile);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  const [motoForm, setMotoForm] = useState<MotorcycleClientData>(motorcycle);
  const [isMotoSaved, setIsMotoSaved] = useState(false);

  // Modal para agendar nuevo mantenimiento
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || 'matriz-quito');
  const [selectedServiceTitle, setSelectedServiceTitle] = useState('Mantenimiento Preventivo (Aceite y Filtros)');
  const [scheduleDate, setScheduleDate] = useState('2026-09-25');
  const [scheduleTime, setScheduleTime] = useState('09:30');
  const [scheduleNotes, setScheduleNotes] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 3000);
  };

  const handleSaveMoto = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMotorcycle(motoForm);
    setIsMotoSaved(true);
    setTimeout(() => setIsMotoSaved(false), 3000);
  };

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
      tasks: ['Aceite Sintético', 'Filtro OEM', 'Tensión de Cadena', 'Chequeo Frenos'],
      notes: scheduleNotes || 'Cita solicitada desde portal.',
    };

    onScheduleNewMaintenance(newMaint);
    setIsScheduleModalOpen(false);
    setScheduleNotes('');
  };

  // Cálculo de salud de aceite
  const kmSinceLastOil = motoForm.currentKm - motoForm.lastOilChangeKm;
  const kmRemainingOil = Math.max(0, motoForm.oilChangeIntervalKm - kmSinceLastOil);
  const oilHealthPercentage = Math.max(0, Math.min(100, Math.round((kmRemainingOil / motoForm.oilChangeIntervalKm) * 100)));

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* ========================================================================= */}
      {/* 1. SECCIÓN SUPERIOR: PERFIL DEL CLIENTE                                   */}
      {/* ========================================================================= */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              Perfil del Cliente
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {isProfileSaved && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Guardado
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nombres y Apellidos
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Cédula / RUC (SRI)
              </label>
              <div className="relative">
                <CreditCard className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  value={profileForm.idNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, idNumber: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Celular / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Dirección / Ciudad
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Contacto de Emergencia
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-red-400" />
                <input
                  type="text"
                  value={`${profileForm.emergencyContactName} - ${profileForm.emergencyContactPhone}`}
                  onChange={(e) => {
                    const parts = e.target.value.split('-');
                    setProfileForm({
                      ...profileForm,
                      emergencyContactName: parts[0] ? parts[0].trim() : '',
                      emergencyContactPhone: parts[1] ? parts[1].trim() : '',
                    });
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow transition flex items-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Perfil</span>
            </button>
          </div>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* 2. SECCIÓN INFERIOR: FICHA DE LA MOTO Y MANTENIMIENTO                    */}
      {/* ========================================================================= */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-red-500" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              Motocicleta & Mantenimiento
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow transition flex items-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Agendar Cita</span>
          </button>
        </div>

        {/* Barra Compacta del Vehículo y Estado de Aceite */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-850">
          <div className="flex items-center gap-3">
            {/* Placa Ecuatoriana */}
            <div className="flex flex-col items-center bg-white text-zinc-950 px-2 py-0.5 rounded border border-zinc-300 font-mono shrink-0">
              <div className="flex items-center gap-1 text-[6px] font-black tracking-widest text-zinc-800 uppercase border-b border-zinc-200 pb-0.2">
                <span className="w-2 h-1 bg-gradient-to-r from-yellow-400 via-blue-600 to-red-600 rounded-[0.5px]" />
                <span>EC</span>
              </div>
              <span className="text-xs font-black tracking-wide leading-tight mt-0.5">
                {motoForm.plate}
              </span>
            </div>

            <div>
              <h3 className="text-xs font-bold text-white">
                {motoForm.brand} {motoForm.model} ({motoForm.year})
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                {motoForm.displacement} • {motoForm.color}
              </p>
            </div>
          </div>

          {/* Vida de Aceite */}
          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-3">
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block">Vida de Aceite</span>
              <span className="text-xs font-mono font-bold text-zinc-200">
                ~{kmRemainingOil.toLocaleString()} km restantes
              </span>
            </div>
            <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  oilHealthPercentage > 40
                    ? 'bg-emerald-500'
                    : oilHealthPercentage > 15
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${oilHealthPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Formulario Técnico Sin Contenedores Anidados Excesivos */}
        <form onSubmit={handleSaveMoto} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Kilometraje Actual
              </label>
              <div className="relative">
                <Gauge className="w-3.5 h-3.5 absolute left-3 top-3 text-blue-400" />
                <input
                  type="number"
                  value={motoForm.currentKm}
                  onChange={(e) => setMotoForm({ ...motoForm, currentKm: Number(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Aceite Habitual
              </label>
              <div className="relative">
                <Fuel className="w-3.5 h-3.5 absolute left-3 top-3 text-amber-400" />
                <select
                  value={motoForm.preferredOil}
                  onChange={(e) => setMotoForm({ ...motoForm, preferredOil: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs cursor-pointer"
                >
                  <option value="Motul 7100 10W-40 100% Sintético">Motul 7100 10W-40 (Sintético)</option>
                  <option value="Motul 5100 15W-50 Semi-Sintético">Motul 5100 15W-50 (Semi-sintético)</option>
                  <option value="Castrol Power1 10W-40 4T">Castrol Power1 10W-40</option>
                  <option value="Yamalube 10W-40 4T Full Synthetic">Yamalube 10W-40</option>
                  <option value="Recomendación Oficial del Mecánico">Recomendación de Taller</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Preferencia Repuestos
              </label>
              <div className="relative">
                <ShieldCheck className="w-3.5 h-3.5 absolute left-3 top-3 text-emerald-400" />
                <select
                  value={motoForm.preferredPartsQuality}
                  onChange={(e) => setMotoForm({ ...motoForm, preferredPartsQuality: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs cursor-pointer"
                >
                  <option value="originales_oem">100% Originales OEM</option>
                  <option value="alternativos_premium">Alternativos de Alta Gama</option>
                </select>
              </div>
            </div>

            {/* Síntomas / Fallas */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-amber-400 mb-1">
                Síntomas o Fallas Detectadas
              </label>
              <textarea
                value={motoForm.reportedSymptoms}
                onChange={(e) => setMotoForm({ ...motoForm, reportedSymptoms: e.target.value })}
                rows={2}
                placeholder="Ruidos, frenos, encendido o detalles para el mecánico..."
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white rounded-xl p-2.5 text-xs placeholder:text-zinc-600 transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              {isMotoSaved && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ficha actualizada
                </span>
              )}
            </div>

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow transition flex items-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Ficha</span>
            </button>
          </div>
        </form>

        {/* ========================================================================= */}
        {/* LISTA DE MANTENIMIENTOS PROGRAMADOS                                      */}
        {/* ========================================================================= */}
        <div className="pt-3 border-t border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Mantenimientos Programados ({scheduledMaintenances.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scheduledMaintenances.map((maint) => (
              <div
                key={maint.id}
                className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-850 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white">{maint.serviceTitle}</h4>
                    <span className="text-[10px] text-blue-400 font-mono">
                      A los {maint.recommendedKm.toLocaleString()} KM
                    </span>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    {maint.status}
                  </span>
                </div>

                <div className="text-[11px] text-zinc-300 flex justify-between border-t border-zinc-850 pt-1.5">
                  <span>
                    <strong>Fecha:</strong> {maint.scheduledDate || maint.recommendedDate}
                  </span>
                  <span>
                    <strong>Sucursal:</strong> {maint.branchName.replace('StarMotos ', '')}
                  </span>
                </div>

                <div className="text-[10px] text-zinc-400">
                  {maint.tasks.join(' • ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MODAL: AGENDAR CITA                                                       */}
      {/* ========================================================================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                <h3 className="text-xs font-bold text-white">Agendar Cita</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-300 mb-1">
                  Servicio
                </label>
                <select
                  value={selectedServiceTitle}
                  onChange={(e) => setSelectedServiceTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2 text-xs"
                >
                  <option value="Mantenimiento Preventivo (Aceite y Filtros)">
                    Mantenimiento Preventivo (Aceite + Filtro + Cadena)
                  </option>
                  <option value="Servicio Mayor / Afinamiento">
                    Servicio Mayor (Válvulas + Inyección + Bujías)
                  </option>
                  <option value="Revisión de Frenos">
                    Revisión de Frenos y Pastillas
                  </option>
                  <option value="Kit de Arrastre">
                    Cambio Kit de Arrastre
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1">
                  Sucursal
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2 text-xs"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">
                    Hora
                  </label>
                  <select
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2 text-xs font-mono"
                  >
                    <option value="08:30">08:30 AM</option>
                    <option value="09:30">09:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1">
                  Nota para el taller
                </label>
                <textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  rows={2}
                  placeholder="Detalles adicionales..."
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2 text-xs"
                />
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-zinc-800 text-zinc-400 font-bold hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
