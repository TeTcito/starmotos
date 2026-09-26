// src/components/mobile/admin/GpsMatrizMobile.tsx
import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Radio,
  Plus,
  Search,
  KeyRound,
  Lock,
  Calendar,
  DollarSign,
  Bike,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { GpsRecord, SystemAlert } from '../../../types/customer';
import {
  getStoredClients,
  getStoredFullAlistamientos,
  querySriMock,
  saveStoredGpsRecord,
  deleteStoredGpsRecord,
  addStoredAlerts,
} from '../../../data/mockMultiRoleData';
import { GpsCredentialDetailModal } from '../../common/GpsCredentialDetailModal';

interface Props {
  records: GpsRecord[];
  onSaveRecord?: (record: GpsRecord) => void;
  onDeleteRecord?: (id: string) => void;
  showToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const GpsMatrizMobile: React.FC<Props> = ({
  records,
  onSaveRecord,
  onDeleteRecord,
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'activa'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecordForCredentials, setSelectedRecordForCredentials] = useState<GpsRecord | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextYearDate = new Date();
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
  const nextYearStr = nextYearDate.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    cedulaRuc: '',
    nombres: '',
    apellidos: '',
    celular1: '',
    celular2: '',
    celular3: '',
    email: '',
    direccion: '',
    placa: '',
    modeloMarca: '',
    chasis: '',
    numeroMotor: '',
    color: '',
    year: new Date().getFullYear(),
    kilometraje: 0,
    serieGps: '',
    serieChip: '',
    fechaInicio: todayStr,
    fechaVencimiento: nextYearStr,
    valorServicio: 180.0,
    montoPagado: 180.0,
    metodoPago: 'Efectivo',
    observaciones: '',
  });

  const [isSearchingSri, setIsSearchingSri] = useState(false);

  // Búsqueda rápida
  const handleSearchClient = (idQuery: string) => {
    const cleanId = idQuery.trim();
    if (!cleanId) return;

    // Buscar localmente
    const clients = getStoredClients();
    const local = clients.find((c) => c.idNumber === cleanId);
    if (local) {
      const parts = local.fullName.split(' ');
      const nombres = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
      const apellidos = parts.slice(Math.ceil(parts.length / 2)).join(' ');
      setFormData((prev) => ({
        ...prev,
        cedulaRuc: cleanId,
        nombres: nombres || local.fullName,
        apellidos: apellidos || '',
        celular1: local.phone || prev.celular1,
        email: local.email || prev.email,
        direccion: local.address || prev.direccion,
        modeloMarca: `${local.motorcycleBrand || ''} ${local.motorcycleModel || ''}`.trim() || prev.modeloMarca,
        placa: local.motorcyclePlate || prev.placa,
        chasis: local.motorcycleVin || prev.chasis,
      }));
      showToast?.(`Cliente local: ${local.fullName}`, 'info');
      return;
    }

    // SRI
    setIsSearchingSri(true);
    setTimeout(() => {
      setIsSearchingSri(false);
      const res = querySriMock(cleanId);
      if (res && res.razonSocial) {
        const parts = res.razonSocial.split(' ');
        setFormData((prev) => ({
          ...prev,
          cedulaRuc: cleanId,
          nombres: parts.slice(0, Math.ceil(parts.length / 2)).join(' '),
          apellidos: parts.slice(Math.ceil(parts.length / 2)).join(' '),
          direccion: res.address || prev.direccion,
        }));
        showToast?.('SRI: Razón social recuperada.', 'success');
      } else {
        showToast?.('No encontrado en SRI. Ingrese los datos manualmente.', 'info');
      }
    }, 600);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cedulaRuc.trim() || !formData.nombres.trim() || !formData.celular1.trim()) {
      showToast?.('Complete cédula, nombres y celular principal.', 'error');
      setStep(1);
      return;
    }

    if (!formData.chasis.trim() || !formData.serieGps.trim() || !formData.serieChip.trim()) {
      showToast?.('Complete chasis, serie GPS y serie Chip.', 'error');
      setStep(2);
      return;
    }

    const saldo = Math.max(0, Number(formData.valorServicio || 0) - Number(formData.montoPagado || 0));
    const randomTicket = Math.floor(10000 + Math.random() * 90000);

    const newRecord: GpsRecord = {
      id: `gps-${Date.now()}`,
      ticketNumber: `GPS-${randomTicket}`,
      fechaSolicitud: todayStr,
      horaSolicitud: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      cedulaRuc: formData.cedulaRuc.trim(),
      celular1: formData.celular1.trim(),
      celular2: formData.celular2.trim() || undefined,
      celular3: formData.celular3.trim() || undefined,
      email: formData.email.trim() || undefined,
      direccion: formData.direccion.trim() || undefined,
      placa: formData.placa.trim().toUpperCase() || 'EN TRÁMITE',
      chasis: formData.chasis.trim().toUpperCase(),
      numeroMotor: formData.numeroMotor.trim().toUpperCase() || undefined,
      modeloMarca: formData.modeloMarca.trim() || 'Motocicleta General',
      color: formData.color.trim() || undefined,
      year: Number(formData.year) || new Date().getFullYear(),
      kilometraje: Number(formData.kilometraje) || 0,
      serieGps: formData.serieGps.trim(),
      serieChip: formData.serieChip.trim(),
      fechaInicio: formData.fechaInicio,
      fechaVencimiento: formData.fechaVencimiento,
      valorServicio: Number(formData.valorServicio) || 0,
      montoPagado: Number(formData.montoPagado) || 0,
      saldoPendiente: saldo,
      metodoPago: formData.metodoPago,
      observaciones: formData.observaciones.trim() || undefined,
      estado: 'pendiente',
      createdAt: new Date().toISOString(),
    };

    saveStoredGpsRecord(newRecord);
    onSaveRecord?.(newRecord);

    const alertForGps: SystemAlert = {
      id: `alt-gps-${Date.now()}`,
      type: 'orden_creada',
      targetRole: 'gps',
      title: `📡 Nueva Solicitud GPS: ${newRecord.nombres} ${newRecord.apellidos}`,
      message: `Matriz registró GPS para ${newRecord.modeloMarca} (${newRecord.placa}). Serie GPS: ${newRecord.serieGps}.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: newRecord.id,
    };
    addStoredAlerts(alertForGps);

    confetti({ particleCount: 60, spread: 60 });
    showToast?.('¡Solicitud GPS enviada a GPS Servicios!', 'success');

    setFormData({
      cedulaRuc: '',
      nombres: '',
      apellidos: '',
      celular1: '',
      celular2: '',
      celular3: '',
      email: '',
      direccion: '',
      placa: '',
      modeloMarca: '',
      chasis: '',
      numeroMotor: '',
      color: '',
      year: new Date().getFullYear(),
      kilometraje: 0,
      serieGps: '',
      serieChip: '',
      fechaInicio: todayStr,
      fechaVencimiento: nextYearStr,
      valorServicio: 180.0,
      montoPagado: 180.0,
      metodoPago: 'Efectivo',
      observaciones: '',
    });
    setStep(1);
    setViewMode('list');
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== 'todos' && r.estado !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const clientFull = `${r.nombres} ${r.apellidos}`.toLowerCase();
        return (
          clientFull.includes(q) ||
          r.cedulaRuc.toLowerCase().includes(q) ||
          r.placa.toLowerCase().includes(q) ||
          r.ticketNumber.toLowerCase().includes(q) ||
          r.serieGps.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, statusFilter, searchTerm]);

  const pendientesCount = records.filter((r) => r.estado === 'pendiente').length;
  const activasCount = records.filter((r) => r.estado === 'activa').length;

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Eliminar registro GPS de ${name}?`)) {
      deleteStoredGpsRecord(id);
      onDeleteRecord?.(id);
      showToast?.('Registro eliminado.', 'info');
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Header móvil */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-zinc-900 tracking-tight">GPS Matriz</h2>
            <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
              Satelital
            </span>
          </div>
        </div>

        {viewMode === 'list' ? (
          <button
            type="button"
            onClick={() => {
              setViewMode('form');
              setStep(1);
            }}
            className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo GPS</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className="py-1.5 px-3 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold flex items-center gap-1 border border-zinc-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Listado</span>
          </button>
        )}
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-2.5 rounded-xl border border-zinc-200 text-center">
          <span className="text-[9px] uppercase font-bold text-zinc-400 block">Total</span>
          <span className="text-base font-black text-zinc-900">{records.length}</span>
        </div>
        <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center">
          <span className="text-[9px] uppercase font-bold text-amber-700 block">Pendientes</span>
          <span className="text-base font-black text-amber-900">{pendientesCount}</span>
        </div>
        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-center">
          <span className="text-[9px] uppercase font-bold text-emerald-700 block">Activas</span>
          <span className="text-base font-black text-emerald-900">{activasCount}</span>
        </div>
      </div>

      {/* VISTA FORMULARIO */}
      {viewMode === 'form' && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
          {/* Stepper móvil */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s as any)}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition ${
                  step === s
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Paso {s}
              </button>
            ))}
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Paso 1: Cliente & 3 Celulares */}
            {step === 1 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.cedulaRuc}
                    onChange={(e) => setFormData({ ...formData, cedulaRuc: e.target.value })}
                    placeholder="Cédula / RUC..."
                    className="flex-1 px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => handleSearchClient(formData.cedulaRuc)}
                    className="px-3 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl"
                  >
                    {isSearchingSri ? '...' : <Search className="w-4 h-4" />}
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">Nombres *</label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-xl"
                    required
                  />
                </div>

                {/* 3 Celulares */}
                <div className="p-3 bg-cyan-50/60 border border-cyan-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-black uppercase text-cyan-900 block">3 Celulares</span>
                  <div>
                    <label className="text-[10px] text-zinc-600">Celular 1 (Principal WhatsApp) *</label>
                    <input
                      type="tel"
                      value={formData.celular1}
                      onChange={(e) => setFormData({ ...formData, celular1: e.target.value })}
                      placeholder="0998765432"
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-cyan-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-600">Celular 2 (Secundario)</label>
                    <input
                      type="tel"
                      value={formData.celular2}
                      onChange={(e) => setFormData({ ...formData, celular2: e.target.value })}
                      placeholder="0987654321"
                      className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-zinc-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-600">Celular 3 (Adicional)</label>
                    <input
                      type="tel"
                      value={formData.celular3}
                      onChange={(e) => setFormData({ ...formData, celular3: e.target.value })}
                      placeholder="0976543210"
                      className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-zinc-300 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-2.5 bg-cyan-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                >
                  <span>Continuar a Moto & GPS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Paso 2: Moto & Series GPS/Chip */}
            {step === 2 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">Placa</label>
                  <input
                    type="text"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                    placeholder="PBX-8492 o EN TRÁMITE"
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">Marca / Modelo *</label>
                  <input
                    type="text"
                    value={formData.modeloMarca}
                    onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                    placeholder="Ej: Benelli TRK 502X"
                    className="w-full px-3 py-2 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">Chasis (VIN) *</label>
                  <input
                    type="text"
                    value={formData.chasis}
                    onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded-xl"
                    required
                  />
                </div>

                {/* Series Hardware */}
                <div className="p-3 bg-cyan-50 border border-cyan-300 rounded-xl space-y-2">
                  <span className="text-[10px] font-black uppercase text-cyan-900 block">Series GPS & SIM</span>
                  <div>
                    <label className="text-[10px] font-bold text-cyan-900">Serie GPS (IMEI) *</label>
                    <input
                      type="text"
                      value={formData.serieGps}
                      onChange={(e) => setFormData({ ...formData, serieGps: e.target.value.trim() })}
                      placeholder="869402058491823"
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-cyan-400 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-cyan-900">Serie Chip (SIM) *</label>
                    <input
                      type="text"
                      value={formData.serieChip}
                      onChange={(e) => setFormData({ ...formData, serieChip: e.target.value.trim() })}
                      placeholder="8959302194820194820"
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-cyan-400 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2 bg-zinc-100 text-zinc-700 text-xs font-bold rounded-xl"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Paso 3: Fechas al lado & Contabilidad Matriz */}
            {step === 3 && (
              <div className="space-y-3">
                {/* Fechas al lado */}
                <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-600 block mb-1">Inicio *</label>
                    <input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs font-bold bg-white border border-zinc-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-600 block mb-1">Vence *</label>
                    <input
                      type="date"
                      value={formData.fechaVencimiento}
                      onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs font-bold bg-white border border-zinc-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                {/* Contabilidad Matriz */}
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <span className="text-[10px] font-black uppercase text-emerald-900 block">
                    Contabilidad Matriz (Privado)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-600">Valor GPS ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.valorServicio}
                        onChange={(e) => setFormData({ ...formData, valorServicio: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 text-xs font-bold bg-white border border-zinc-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-600">Abono ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.montoPagado}
                        onChange={(e) => setFormData({ ...formData, montoPagado: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 text-xs font-bold bg-white border border-zinc-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-zinc-200">
                    <span className="text-[10px] font-bold text-zinc-600">Saldo Pendiente:</span>
                    <strong className={formData.valorServicio - formData.montoPagado > 0 ? 'text-red-600' : 'text-emerald-700'}>
                      ${Math.max(0, formData.valorServicio - formData.montoPagado).toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-2.5 bg-zinc-100 text-zinc-700 text-xs font-bold rounded-xl"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    Guardar y Enviar
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* VISTA LISTADO DE TARJETAS */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {/* Búsqueda y Filtros */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente, placa, serie..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-zinc-300 rounded-xl"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setStatusFilter('todos')}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold shrink-0 ${
                  statusFilter === 'todos' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                Todos ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pendiente')}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold shrink-0 ${
                  statusFilter === 'pendiente' ? 'bg-amber-600 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                Pendientes ({pendientesCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('activa')}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold shrink-0 ${
                  statusFilter === 'activa' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                Activos ({activasCount})
              </button>
            </div>
          </div>

          {/* Tarjetas */}
          {filteredRecords.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-zinc-200 text-center text-zinc-400">
              <Radio className="w-6 h-6 mx-auto mb-2 text-zinc-300" />
              <p className="font-bold text-xs">No hay solicitudes GPS encontradas</p>
            </div>
          ) : (
            filteredRecords.map((r) => {
              const isApproved = r.estado === 'activa' && Boolean(r.gpsUser);
              return (
                <div
                  key={r.id}
                  className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      {r.ticketNumber}
                    </span>
                    {r.estado === 'activa' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Pendiente
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">{r.nombres} {r.apellidos}</h4>
                    <p className="text-[11px] font-mono text-zinc-500">C.I. {r.cedulaRuc}</p>
                    <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">📱 {r.celular1}</span>
                      {r.celular2 && <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-mono">📞 {r.celular2}</span>}
                    </div>
                  </div>

                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-150 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Moto:</span>
                      <strong className="text-zinc-800">{r.modeloMarca}</strong>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-zinc-500">Placa:</span>
                      <strong className="text-blue-700">{r.placa || 'EN TRÁMITE'}</strong>
                    </div>
                    <div className="flex justify-between font-mono text-[11px] pt-1 border-t border-zinc-200/60">
                      <span className="text-zinc-500">Serie GPS:</span>
                      <span className="text-zinc-900 font-bold">{r.serieGps}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-500">Vence:</span>
                      <strong className="text-emerald-700">{r.fechaVencimiento}</strong>
                    </div>
                  </div>

                  {/* Fila de Acciones: Llave para credenciales */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id, `${r.nombres} ${r.apellidos}`)}
                      className="p-2 rounded-xl bg-zinc-100 text-zinc-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* BOTÓN ICONO DE LLAVE */}
                    {isApproved ? (
                      <button
                        type="button"
                        onClick={() => setSelectedRecordForCredentials(r)}
                        className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/30"
                      >
                        <KeyRound className="w-4 h-4 text-amber-200" />
                        <span>Ver Credenciales</span>
                      </button>
                    ) : (
                      <div
                        className="py-2 px-3 rounded-xl bg-zinc-100 text-zinc-400 text-xs font-semibold flex items-center gap-1.5 opacity-60"
                        title="Pendiente de credenciales por GPS Servicios"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Esperando Credenciales</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Credenciales */}
      <GpsCredentialDetailModal
        isOpen={Boolean(selectedRecordForCredentials)}
        onClose={() => setSelectedRecordForCredentials(null)}
        record={selectedRecordForCredentials}
      />
    </div>
  );
};
