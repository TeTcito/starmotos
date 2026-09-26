// src/components/desktop/admin/GpsMatrizDesktop.tsx
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
  UserCheck,
  Building2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Phone,
  Cpu,
  Receipt,
  AlertCircle,
  Filter,
  Check,
  Copy,
} from 'lucide-react';
import { GpsRecord, SystemAlert } from '../../../types/customer';
import {
  getStoredClients,
  getStoredFullAlistamientos,
  querySriMock,
  saveStoredGpsRecord,
  deleteStoredGpsRecord,
  addStoredAlerts,
  getRegisteredBrands,
} from '../../../data/mockMultiRoleData';
import { cleanNumberInput, selectOnFocus } from '../../../utils/numberUtils';
import { GpsCredentialDetailModal } from '../../common/GpsCredentialDetailModal';

interface Props {
  records: GpsRecord[];
  onSaveRecord?: (record: GpsRecord) => void;
  onDeleteRecord?: (id: string) => void;
  showToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const GpsMatrizDesktop: React.FC<Props> = ({
  records,
  onSaveRecord,
  onDeleteRecord,
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'activa'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [selectedRecordForCredentials, setSelectedRecordForCredentials] = useState<GpsRecord | null>(null);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<GpsRecord | null>(null);

  // Estado del Formulario Wizard de 3 Pasos
  const todayStr = new Date().toISOString().split('T')[0];
  const nextYearDate = new Date();
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
  const nextYearStr = nextYearDate.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    // Paso 1: Cliente & 3 Celulares
    cedulaRuc: '',
    nombres: '',
    apellidos: '',
    celular1: '',
    celular2: '',
    celular3: '',
    email: '',
    direccion: '',
    // Paso 2: Motocicleta & Dispositivo GPS
    placa: '',
    modeloMarca: '',
    chasis: '',
    numeroMotor: '',
    color: '',
    year: new Date().getFullYear(),
    kilometraje: 0,
    serieGps: '',
    serieChip: '',
    // Paso 3: Vigencia & Contabilidad Matriz
    fechaInicio: todayStr,
    fechaVencimiento: nextYearStr,
    valorServicio: 180.0,
    montoPagado: 180.0,
    metodoPago: 'Efectivo',
    observaciones: '',
  });

  const [isSearchingSri, setIsSearchingSri] = useState(false);
  const [sriError, setSriError] = useState('');

  // Clientes existentes para búsqueda rápida
  const existingClients = useMemo(() => {
    const list = getStoredClients();
    const alistamientos = getStoredFullAlistamientos();
    const map = new Map<string, { idNumber: string; fullName: string; phone?: string; email?: string; address?: string; bike?: string; plate?: string; vin?: string }>();

    list.forEach((c) => {
      if (c.idNumber) {
        map.set(c.idNumber.trim(), {
          idNumber: c.idNumber,
          fullName: c.fullName,
          phone: c.phone,
          email: c.email,
          address: c.address,
          bike: `${c.motorcycleBrand || ''} ${c.motorcycleModel || ''}`.trim(),
          plate: c.motorcyclePlate,
          vin: c.motorcycleVin,
        });
      }
    });

    alistamientos.forEach((a) => {
      if (a.cedulaRuc) {
        map.set(a.cedulaRuc.trim(), {
          idNumber: a.cedulaRuc,
          fullName: `${a.nombres} ${a.apellidos}`.trim(),
          phone: a.celular1,
          email: a.email,
          address: a.direccion,
          bike: a.modeloMarca,
          plate: a.placa,
          vin: a.chasis,
        });
      }
    });

    return Array.from(map.values());
  }, []);

  // Búsqueda automática en SRI y en base existente
  const handleSearchClient = (idQuery: string) => {
    const cleanId = idQuery.trim();
    if (!cleanId) return;

    setSriError('');

    // 1. Revisar si ya existe en clientes locales
    const localMatch = existingClients.find((c) => c.idNumber === cleanId);
    if (localMatch) {
      const parts = localMatch.fullName.split(' ');
      const nombres = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
      const apellidos = parts.slice(Math.ceil(parts.length / 2)).join(' ');

      setFormData((prev) => ({
        ...prev,
        cedulaRuc: cleanId,
        nombres: nombres || localMatch.fullName,
        apellidos: apellidos || '',
        celular1: localMatch.phone || prev.celular1,
        email: localMatch.email || prev.email,
        direccion: localMatch.address || prev.direccion,
        modeloMarca: localMatch.bike || prev.modeloMarca,
        placa: localMatch.plate || prev.placa,
        chasis: localMatch.vin || prev.chasis,
      }));
      showToast?.(`Cliente encontrado en sistema: ${localMatch.fullName}`, 'info');
      return;
    }

    // 2. Si no está local, consultar SRI mock
    setIsSearchingSri(true);
    setTimeout(() => {
      setIsSearchingSri(false);
      const res = querySriMock(cleanId);
      if (res && res.razonSocial) {
        const parts = res.razonSocial.split(' ');
        const nombres = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
        const apellidos = parts.slice(Math.ceil(parts.length / 2)).join(' ');

        setFormData((prev) => ({
          ...prev,
          cedulaRuc: cleanId,
          nombres: nombres || res.razonSocial,
          apellidos: apellidos || '',
          direccion: res.address || prev.direccion,
        }));
        showToast?.(`SRI: Razón Social recuperada: ${res.razonSocial}`, 'success');
      } else {
        setSriError('No se encontró en SRI. Ingrese los datos manualmente.');
      }
    }, 600);
  };

  // Enviar y Registrar Solicitud GPS
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones requeridas
    if (!formData.cedulaRuc.trim() || !formData.nombres.trim() || !formData.celular1.trim()) {
      showToast?.('Por favor complete la cédula, nombres y el celular principal del cliente.', 'error');
      setStep(1);
      return;
    }

    if (!formData.chasis.trim() || !formData.serieGps.trim() || !formData.serieChip.trim()) {
      showToast?.('Por favor complete el chasis, la serie GPS y la serie de Chip.', 'error');
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

    // Guardar en almacenamiento
    saveStoredGpsRecord(newRecord);
    onSaveRecord?.(newRecord);

    // Alerta de sistema para el perfil GPS Servicios
    const alertForGps: SystemAlert = {
      id: `alt-gps-${Date.now()}`,
      type: 'orden_creada',
      targetRole: 'gps',
      title: `📡 Nueva Solicitud GPS: ${newRecord.nombres} ${newRecord.apellidos}`,
      message: `Matriz registró la compra de GPS para la moto ${newRecord.modeloMarca} (${newRecord.placa}). Serie GPS: ${newRecord.serieGps}. Pendiente de asignación de usuario y clave.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: newRecord.id,
    };
    addStoredAlerts(alertForGps);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#0284c7', '#10b981'],
    });

    showToast?.('¡Solicitud GPS guardada y enviada a GPS Servicios!', 'success');

    // Reset y cambio a vista de lista
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

  // Filtrado de registros
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== 'todos' && r.estado !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const clientFull = `${r.nombres} ${r.apellidos}`.toLowerCase();
        const phones = `${r.celular1} ${r.celular2 || ''} ${r.celular3 || ''}`.toLowerCase();
        return (
          clientFull.includes(q) ||
          r.cedulaRuc.toLowerCase().includes(q) ||
          r.placa.toLowerCase().includes(q) ||
          r.modeloMarca.toLowerCase().includes(q) ||
          r.ticketNumber.toLowerCase().includes(q) ||
          r.serieGps.toLowerCase().includes(q) ||
          r.serieChip.toLowerCase().includes(q) ||
          phones.includes(q)
        );
      }
      return true;
    });
  }, [records, statusFilter, searchTerm]);

  // Métricas
  const totalRegistros = records.length;
  const pendientesCount = records.filter((r) => r.estado === 'pendiente').length;
  const activasCount = records.filter((r) => r.estado === 'activa').length;
  const totalCobrado = records.reduce((acc, r) => acc + (Number(r.montoPagado) || 0), 0);
  const totalSaldo = records.reduce((acc, r) => acc + (Number(r.saldoPendiente) || 0), 0);

  const handleDelete = (id: string, clientName: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el registro GPS de "${clientName}"?`)) {
      deleteStoredGpsRecord(id);
      onDeleteRecord?.(id);
      showToast?.('Registro GPS eliminado del sistema.', 'info');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header con Título, Métricas y Botón de Acción */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                  Módulo GPS Matriz
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-200">
                  Exclusivo Matriz
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Registro de ventas GPS satelital, seguimiento contable y sincronización con perfil GPS Servicios.
              </p>
            </div>
          </div>
        </div>

        {/* Toggle de Modo: Listado vs Registro */}
        <div className="flex items-center gap-2">
          {viewMode === 'list' ? (
            <button
              type="button"
              onClick={() => {
                setViewMode('form');
                setStep(1);
              }}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-2 transition cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Ingresar Nuevo GPS</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold border border-zinc-300 flex items-center gap-2 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Listado</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Tarjetas de Resumen Numérico */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Total GPS</span>
          <span className="text-xl font-black text-zinc-900">{totalRegistros}</span>
        </div>
        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Pendientes</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-xl font-black text-amber-900">{pendientesCount}</span>
        </div>
        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Activas / Con Llave</span>
            <KeyRound className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xl font-black text-emerald-900">{activasCount}</span>
        </div>
        <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Cobrado Matriz</span>
          <span className="text-lg font-black text-blue-900">${totalCobrado.toFixed(2)}</span>
        </div>
        <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Saldo Pendiente</span>
          <span className={`text-lg font-black ${totalSaldo > 0 ? 'text-red-600' : 'text-zinc-700'}`}>
            ${totalSaldo.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 3. VISTA WIZARD: FORMULARIO DE 3 PASOS */}
      {viewMode === 'form' && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-6">
          {/* Indicador de 3 Pasos */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                step === 1
                  ? 'bg-cyan-600 text-white border-cyan-700 shadow-md shadow-cyan-600/20'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-cyan-50/50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                  step === 1 ? 'bg-white text-cyan-700' : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                1
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Módulo 1</p>
                <p className="text-xs font-bold">Cliente & 3 Celulares</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                step === 2
                  ? 'bg-cyan-600 text-white border-cyan-700 shadow-md shadow-cyan-600/20'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-cyan-50/50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                  step === 2 ? 'bg-white text-cyan-700' : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                2
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Módulo 2</p>
                <p className="text-xs font-bold">Moto & Serie GPS/Chip</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                step === 3
                  ? 'bg-cyan-600 text-white border-cyan-700 shadow-md shadow-cyan-600/20'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-cyan-50/50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                  step === 3 ? 'bg-white text-cyan-700' : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                3
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Módulo 3</p>
                <p className="text-xs font-bold">Fechas & Contabilidad Matriz</p>
              </div>
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* ===================== PASO 1: CLIENTE Y 3 CELULARES ===================== */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">
                      Módulo 1: Datos del Cliente & Contactos Telefónicos
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Ingrese cédula/RUC para autocompletar desde el SRI o base de clientes existente.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 font-mono">
                    3 Números de Celular
                  </span>
                </div>

                {/* Búsqueda Cédula / SRI */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formData.cedulaRuc}
                      onChange={(e) => setFormData({ ...formData, cedulaRuc: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchClient(formData.cedulaRuc);
                        }
                      }}
                      placeholder="Cédula o RUC (ej. 1724890123)..."
                      className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono bg-zinc-50 border border-zinc-300 rounded-xl focus:border-cyan-600 focus:bg-white outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSearchClient(formData.cedulaRuc)}
                    disabled={isSearchingSri}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSearchingSri ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>{isSearchingSri ? 'Buscando...' : 'Buscar Cliente / SRI'}</span>
                  </button>
                </div>

                {sriError && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    {sriError}
                  </p>
                )}

                {/* Nombres y Apellidos */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                      Nombres del Propietario *
                    </label>
                    <input
                      type="text"
                      value={formData.nombres}
                      onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                      placeholder="Ej: Carlos Alberto"
                      className="w-full px-3.5 py-2.5 text-xs font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-cyan-600 focus:bg-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                      Apellidos del Propietario *
                    </label>
                    <input
                      type="text"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      placeholder="Ej: Mendoza Villao"
                      className="w-full px-3.5 py-2.5 text-xs font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-cyan-600 focus:bg-white outline-none"
                      required
                    />
                  </div>
                </div>

                {/* 3 NÚMEROS DE CELULAR */}
                <div className="bg-cyan-50/50 border border-cyan-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-cyan-700" />
                    <span className="text-xs font-black text-cyan-950 uppercase tracking-wider">
                      Contacto Telefónico (3 Números Requeridos/Permitidos)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                        Celular 1 (Principal WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        value={formData.celular1}
                        onChange={(e) => setFormData({ ...formData, celular1: e.target.value })}
                        placeholder="0998765432"
                        className="w-full px-3.5 py-2 text-xs font-mono font-bold text-zinc-900 bg-white border border-cyan-300 rounded-xl focus:border-cyan-600 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                        Celular 2 (Secundario / Emergencia)
                      </label>
                      <input
                        type="tel"
                        value={formData.celular2}
                        onChange={(e) => setFormData({ ...formData, celular2: e.target.value })}
                        placeholder="0987654321"
                        className="w-full px-3.5 py-2 text-xs font-mono text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                        Celular 3 (Adicional / Referencia)
                      </label>
                      <input
                        type="tel"
                        value={formData.celular3}
                        onChange={(e) => setFormData({ ...formData, celular3: e.target.value })}
                        placeholder="0976543210"
                        className="w-full px-3.5 py-2 text-xs font-mono text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Email y Dirección */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                      Correo Electrónico (Opcional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="cliente@correo.com"
                      className="w-full px-3.5 py-2 text-xs text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-cyan-600 focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                      Dirección Domiciliaria
                    </label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      placeholder="Av. 19 de Mayo y San Pablo"
                      className="w-full px-3.5 py-2 text-xs text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-cyan-600 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.nombres.trim() || !formData.celular1.trim()) {
                        showToast?.('Por favor ingresa nombres y el celular principal.', 'error');
                        return;
                      }
                      setStep(2);
                    }}
                    className="py-2.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>Continuar a Ficha Moto & GPS</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ===================== PASO 2: MOTO & SERIE GPS / CHIP ===================== */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">
                      Módulo 2: Datos de la Motocicleta & Dispositivo GPS
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Complete la ficha técnica del vehículo y registre las series obligatorias de GPS y Chip SIM.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 font-mono">
                    Series GPS & SIM
                  </span>
                </div>

                {/* Datos de la Motocicleta */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                      Placa del Vehículo
                    </label>
                    <input
                      type="text"
                      value={formData.placa}
                      onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                      placeholder="Ej: PBX-8492 o EN TRÁMITE"
                      className="w-full px-3.5 py-2 text-xs font-mono font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-cyan-600 focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                      Marca y Modelo de la Moto *
                    </label>
                    <input
                      type="text"
                      value={formData.modeloMarca}
                      onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                      placeholder="Ej: Benelli TRK 502X ABS"
                      className="w-full px-3.5 py-2 text-xs font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-cyan-600 focus:bg-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                      Número de Chasis (VIN) *
                    </label>
                    <input
                      type="text"
                      value={formData.chasis}
                      onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                      placeholder="17 dígitos alfanuméricos"
                      className="w-full px-3.5 py-2 text-xs font-mono font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-cyan-600 focus:bg-white outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                      Número de Motor
                    </label>
                    <input
                      type="text"
                      value={formData.numeroMotor}
                      onChange={(e) => setFormData({ ...formData, numeroMotor: e.target.value.toUpperCase() })}
                      placeholder="Ej: BJ265MN-1"
                      className="w-full px-3.5 py-2 text-xs font-mono text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="Ej: Gris / Rojo"
                      className="w-full px-3.5 py-2 text-xs text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                      Año
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                      Kilometraje
                    </label>
                    <input
                      type="number"
                      value={formData.kilometraje}
                      onChange={(e) => setFormData({ ...formData, kilometraje: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                    />
                  </div>
                </div>

                {/* BLOQUES EXCLUSIVOS: SERIE DE GPS Y SERIE DE CHIP */}
                <div className="bg-gradient-to-r from-sky-50 to-cyan-50 border-2 border-cyan-300 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-cyan-700" />
                    <div>
                      <span className="text-xs font-black text-cyan-950 uppercase tracking-wider block">
                        Identificadores del Hardware de Rastreo
                      </span>
                      <span className="text-[11px] text-cyan-700">
                        Ambos campos son obligatorios para que el perfil GPS Servicios registre la SIM y configure el rastreador.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-cyan-900 mb-1">
                        Serie de GPS (IMEI / Tracker ID) *
                      </label>
                      <input
                        type="text"
                        value={formData.serieGps}
                        onChange={(e) => setFormData({ ...formData, serieGps: e.target.value.trim() })}
                        placeholder="Ej: 869402058491823"
                        className="w-full px-3.5 py-2.5 text-xs font-mono font-bold text-zinc-900 bg-white border-2 border-cyan-400 rounded-xl focus:border-cyan-600 outline-none shadow-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-cyan-900 mb-1">
                        Serie de Chip (SIM / ICCID) *
                      </label>
                      <input
                        type="text"
                        value={formData.serieChip}
                        onChange={(e) => setFormData({ ...formData, serieChip: e.target.value.trim() })}
                        placeholder="Ej: 8959302194820194820"
                        className="w-full px-3.5 py-2.5 text-xs font-mono font-bold text-zinc-900 bg-white border-2 border-cyan-400 rounded-xl focus:border-cyan-600 outline-none shadow-xs"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-2 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás: Cliente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.chasis.trim() || !formData.serieGps.trim() || !formData.serieChip.trim()) {
                        showToast?.('Por favor ingresa chasis, serie GPS y serie de Chip.', 'error');
                        return;
                      }
                      setStep(3);
                    }}
                    className="py-2.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>Continuar a Fechas & Contabilidad</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ===================== PASO 3: FECHAS & CONTABILIDAD MATRIZ ===================== */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">
                      Módulo 3: Vigencia & Contabilidad Matriz
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Fechas de inicio y vencimiento. Los valores económicos son exclusivos de Matriz y no serán visibles para GPS Servicios.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                    Solo Contabilidad Matriz
                  </span>
                </div>

                {/* FECHA DE INICIO Y FECHA DE VENCIMIENTO AL LADO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Fecha de Inicio del Servicio *</span>
                    </label>
                    <input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-bold text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>Fecha de Vencimiento *</span>
                    </label>
                    <input
                      type="date"
                      value={formData.fechaVencimiento}
                      onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-bold text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                      required
                    />
                  </div>
                </div>

                {/* CONTABILIDAD MATRIZ */}
                <div className="bg-gradient-to-br from-emerald-50/60 to-blue-50/60 border border-emerald-200 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                    <div>
                      <span className="text-xs font-black text-emerald-950 uppercase tracking-wider block">
                        Valores Económicos (Privado Matriz Central)
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Oculto para el perfil GPS Servicios por seguridad contable.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                        Valor del Servicio / GPS ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.valorServicio}
                        onChange={(e) => setFormData({ ...formData, valorServicio: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 text-xs font-bold text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:border-emerald-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                        Monto Pagado / Abono ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.montoPagado}
                        onChange={(e) => setFormData({ ...formData, montoPagado: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 text-xs font-bold text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:border-emerald-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                        Saldo Pendiente ($)
                      </label>
                      <div className="w-full px-3.5 py-2 text-xs font-black rounded-xl bg-white border border-zinc-300 flex items-center justify-between">
                        <span className={formData.valorServicio - formData.montoPagado > 0 ? 'text-red-600' : 'text-emerald-700'}>
                          ${Math.max(0, formData.valorServicio - formData.montoPagado).toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                        Método de Pago
                      </label>
                      <select
                        value={formData.metodoPago}
                        onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs font-bold text-zinc-800 bg-white border border-zinc-300 rounded-xl focus:border-emerald-600 outline-none"
                      >
                        <option value="Efectivo">Efectivo en Caja</option>
                        <option value="Transferencia Banco Pichincha">Transferencia Banco Pichincha</option>
                        <option value="Transferencia Banco Guayaquil">Transferencia Banco Guayaquil</option>
                        <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                        <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                        <option value="Crédito Directo">Crédito Directo StarMotos</option>
                        <option value="Mixto">Pago Mixto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                        Observaciones / Notas Internas
                      </label>
                      <input
                        type="text"
                        value={formData.observaciones}
                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                        placeholder="Ej: Incluye instalación física y 1 año de plataforma"
                        className="w-full px-3.5 py-2 text-xs text-zinc-800 bg-white border border-zinc-300 rounded-xl focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-2 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás: Moto & GPS</span>
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar y Enviar Solicitud a GPS Servicios</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* 4. VISTA LISTADO: TABLA DE SOLICITUDES GPS */}
      {viewMode === 'list' && (
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-xs overflow-hidden">
          {/* Barra de Filtros y Búsqueda */}
          <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50/50">
            {/* Tabs de Estado */}
            <div className="flex items-center gap-1 bg-zinc-200/70 p-1 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('todos')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'todos'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Todos ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pendiente')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'pendiente'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Pendientes ({pendientesCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('activa')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'activa'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Activos / Con Llave ({activasCount})
              </button>
            </div>

            {/* Input de Búsqueda */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente, cédula, placa, serie..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
              />
            </div>
          </div>

          {/* Tabla de Registros */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-100/70 border-b border-zinc-200 text-[10px] font-black uppercase tracking-wider text-zinc-500 select-none">
                  <th className="py-3 px-4">Ticket / Fecha</th>
                  <th className="py-3 px-4">Cliente & 3 Celulares</th>
                  <th className="py-3 px-4">Vehículo</th>
                  <th className="py-3 px-4">Series GPS & Chip</th>
                  <th className="py-3 px-4">Vigencia</th>
                  <th className="py-3 px-4">Contabilidad Matriz</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones (Llave)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-400">
                      <Radio className="w-8 h-8 mx-auto mb-2 text-zinc-300 animate-pulse" />
                      <p className="font-bold text-zinc-600 text-sm">No se encontraron solicitudes GPS</p>
                      <p className="text-xs text-zinc-400">
                        {records.length === 0
                          ? 'Aún no se han registrado compras de GPS en Matriz.'
                          : 'Prueba cambiando los filtros de búsqueda.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const isApproved = r.estado === 'activa' && Boolean(r.gpsUser);
                    return (
                      <tr key={r.id} className="hover:bg-cyan-50/30 transition">
                        {/* Ticket y Fecha */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 block w-max">
                            {r.ticketNumber}
                          </span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">{r.fechaSolicitud}</span>
                        </td>

                        {/* Cliente y Celulares */}
                        <td className="py-3 px-4 max-w-xs">
                          <span className="font-bold text-zinc-900 block truncate">
                            {r.nombres} {r.apellidos}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-500 block">C.I. {r.cedulaRuc}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200" title="Celular Principal">
                              📱 {r.celular1}
                            </span>
                            {r.celular2 && (
                              <span className="font-mono text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded" title="Celular 2">
                                📞 {r.celular2}
                              </span>
                            )}
                            {r.celular3 && (
                              <span className="font-mono text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded" title="Celular 3">
                                📞 {r.celular3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Vehículo */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-zinc-800 block truncate">{r.modeloMarca}</span>
                          <span className="font-mono text-[11px] font-bold text-blue-700 block">
                            Placa: {r.placa || 'EN TRÁMITE'}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-400 block truncate">VIN: {r.chasis}</span>
                        </td>

                        {/* Series GPS y SIM */}
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div>
                            <span className="text-[9px] font-bold uppercase text-zinc-400 block">GPS:</span>
                            <span className="font-bold text-zinc-900 select-all">{r.serieGps}</span>
                          </div>
                          <div className="mt-0.5">
                            <span className="text-[9px] font-bold uppercase text-zinc-400 block">SIM:</span>
                            <span className="text-zinc-600 select-all">{r.serieChip}</span>
                          </div>
                        </td>

                        {/* Vigencia */}
                        <td className="py-3 px-4 text-[11px]">
                          <span className="text-zinc-600 block">Ini: {r.fechaInicio}</span>
                          <span className="font-bold text-emerald-700 block">Ven: {r.fechaVencimiento}</span>
                        </td>

                        {/* Contabilidad Matriz */}
                        <td className="py-3 px-4 text-[11px]">
                          <div className="flex items-center justify-between text-zinc-700">
                            <span>Valor:</span>
                            <strong>${Number(r.valorServicio || 0).toFixed(2)}</strong>
                          </div>
                          <div className="flex items-center justify-between text-emerald-700">
                            <span>Pagado:</span>
                            <strong>${Number(r.montoPagado || 0).toFixed(2)}</strong>
                          </div>
                          {Number(r.saldoPendiente || 0) > 0 && (
                            <div className="flex items-center justify-between text-red-600 font-bold">
                              <span>Saldo:</span>
                              <strong>${Number(r.saldoPendiente).toFixed(2)}</strong>
                            </div>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="py-3 px-4">
                          {r.estado === 'activa' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Activo</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3" />
                              <span>Pendiente</span>
                            </span>
                          )}
                        </td>

                        {/* ACCIONES: ICONO DE LLAVE REQUERIDO */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* BOTÓN ICONO DE LLAVE */}
                            {isApproved ? (
                              <button
                                type="button"
                                onClick={() => setSelectedRecordForCredentials(r)}
                                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 transition cursor-pointer active:scale-95 group relative"
                                title="Ver credenciales de usuario y clave GPS para enviar por WhatsApp"
                              >
                                <KeyRound className="w-4 h-4 text-amber-200 group-hover:rotate-12 transition-transform" />
                              </button>
                            ) : (
                              <div
                                className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-400 flex items-center justify-center cursor-not-allowed opacity-50 relative group"
                                title="Pendiente de credenciales: El operador de GPS Servicios aún no ha asignado el usuario y contraseña."
                              >
                                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                              </div>
                            )}

                            {/* Ver Detalle Completo */}
                            <button
                              type="button"
                              onClick={() => setSelectedRecordForDetail(r)}
                              className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition cursor-pointer"
                              title="Ver ficha técnica completa"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Eliminar */}
                            <button
                              type="button"
                              onClick={() => handleDelete(r.id, `${r.nombres} ${r.apellidos}`)}
                              className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-red-50 text-zinc-400 hover:text-red-600 flex items-center justify-center transition cursor-pointer"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Credenciales al pulsar la Llave */}
      <GpsCredentialDetailModal
        isOpen={Boolean(selectedRecordForCredentials)}
        onClose={() => setSelectedRecordForCredentials(null)}
        record={selectedRecordForCredentials}
      />

      {/* Modal de Detalle Completo */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-zinc-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-bold text-zinc-900">
                  Ficha Técnica Completa • {selectedRecordForDetail.ticketNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordForDetail(null)}
                className="w-7 h-7 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 space-y-1">
                <span className="font-bold text-zinc-400 uppercase text-[10px] block">Cliente</span>
                <p className="text-sm font-black text-zinc-900">
                  {selectedRecordForDetail.nombres} {selectedRecordForDetail.apellidos}
                </p>
                <p className="font-mono text-zinc-600">Cédula: {selectedRecordForDetail.cedulaRuc}</p>
                <p className="text-zinc-600">Celular 1: {selectedRecordForDetail.celular1}</p>
                {selectedRecordForDetail.celular2 && <p className="text-zinc-600">Celular 2: {selectedRecordForDetail.celular2}</p>}
                {selectedRecordForDetail.celular3 && <p className="text-zinc-600">Celular 3: {selectedRecordForDetail.celular3}</p>}
                {selectedRecordForDetail.email && <p className="text-zinc-600">Email: {selectedRecordForDetail.email}</p>}
                {selectedRecordForDetail.direccion && <p className="text-zinc-600">Dirección: {selectedRecordForDetail.direccion}</p>}
              </div>

              <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 space-y-1">
                <span className="font-bold text-zinc-400 uppercase text-[10px] block">Vehículo & Hardware</span>
                <p className="font-bold text-zinc-900">{selectedRecordForDetail.modeloMarca}</p>
                <p className="font-mono text-blue-700">Placa: {selectedRecordForDetail.placa}</p>
                <p className="font-mono text-zinc-600">Chasis (VIN): {selectedRecordForDetail.chasis}</p>
                <p className="font-mono text-zinc-900 font-bold">Serie GPS: {selectedRecordForDetail.serieGps}</p>
                <p className="font-mono text-zinc-900 font-bold">Serie Chip: {selectedRecordForDetail.serieChip}</p>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-800 uppercase text-[10px] block">Contabilidad Matriz</span>
                <p>Valor Servicio: <strong>${selectedRecordForDetail.valorServicio}</strong></p>
                <p>Monto Pagado: <strong>${selectedRecordForDetail.montoPagado}</strong></p>
                <p>Saldo Pendiente: <strong>${selectedRecordForDetail.saldoPendiente}</strong></p>
                <p>Método de Pago: <strong>{selectedRecordForDetail.metodoPago}</strong></p>
                {selectedRecordForDetail.observaciones && (
                  <p className="text-zinc-600 italic">Notas: {selectedRecordForDetail.observaciones}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedRecordForDetail(null)}
                className="py-2 px-4 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
