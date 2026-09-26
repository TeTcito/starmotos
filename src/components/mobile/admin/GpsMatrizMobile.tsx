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
  ArrowLeft,
  Smartphone,
  Phone,
  MessageCircle,
  X,
  AlertCircle,
  Save,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Eye,
  Camera,
  Upload,
  Wrench,
  CreditCard,
  MapPin,
} from 'lucide-react';
import { GpsRecord, SystemAlert, Technician, Workshop } from '../../../types/customer';
import {
  getStoredClients,
  getStoredFullAlistamientos,
  querySriMock,
  saveStoredGpsRecord,
  deleteStoredGpsRecord,
  addStoredAlerts,
  getStoredTechnicians,
  getStoredWorkshops,
} from '../../../data/mockMultiRoleData';
import { cleanNumberInput, selectOnFocus } from '../../../utils/numberUtils';
import { compressImageBase64 } from '../../../utils/imageCompressor';
import { isValidMediaUrl } from '../../../services/mediaStorage';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState<'all' | 'con_saldo' | 'pagados'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendiente' | 'activa'>('all');

  // Modo edición / detalle
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<GpsRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRecordForCredentials, setSelectedRecordForCredentials] = useState<GpsRecord | null>(null);

  // Fechas por defecto
  const todayStr = new Date().toISOString().split('T')[0];
  const nextYearDate = new Date();
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
  const nextYearStr = nextYearDate.toISOString().split('T')[0];

  const initialFormData = {
    id: '',
    ticketNumber: '',
    // Módulo 1: Sede & Cliente & 3 Celulares
    sede: 'StarMotos Matriz La Maná',
    sedeId: 'matriz-la-mana',
    cedulaRuc: '',
    nombres: '',
    apellidos: '',
    celular1: '',
    celular2: '',
    celular3: '',
    email: '',
    direccion: '',
    // Módulo 2: Motocicleta & Hardware GPS
    placa: '',
    modeloMarca: '',
    chasis: '',
    numeroMotor: '',
    color: '',
    year: new Date().getFullYear(),
    kilometraje: 0,
    serieGps: '',
    serieChip: '',
    // Módulo 3: Vigencia, Técnico & Contabilidad Matriz
    tecnicoResponsable: '',
    fechaInicio: todayStr,
    fechaVencimiento: nextYearStr,
    valorServicio: 180.0,
    montoPagado: 180.0,
    metodoPago: 'Efectivo' as 'Efectivo' | 'Transferencia',
    evidenciaTransferencia: '',
    fotos: [] as string[],
    observaciones: '',
    // Estado y credenciales
    estado: 'pendiente' as 'pendiente' | 'activa',
    gpsUser: '',
    gpsPassword: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSearchingSri, setIsSearchingSri] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [validationAlert, setValidationAlert] = useState<{ title: string; fields: string[] } | null>(null);

  // Lista oficial de Sedes / Talleres de StarMotos
  const workshopsList = useMemo(() => getStoredWorkshops(), []);

  // Lista de Técnicos disponibles
  const techniciansList = useMemo(() => getStoredTechnicians(), []);

  // Técnicos filtrados dinámicamente según la sede de atención seleccionada
  const availableTechniciansForSede = useMemo(() => {
    const currentWsId = (formData.sedeId || '').toLowerCase().trim();
    const currentWsName = (formData.sede || '').toLowerCase().trim();

    if (!currentWsId && !currentWsName) {
      return techniciansList;
    }

    const currentWs = workshopsList.find(
      (w) => w.id === formData.sedeId || w.name.toLowerCase() === currentWsName
    );
    const cityKey = currentWs?.city ? currentWs.city.split(',')[0].toLowerCase().trim() : '';

    const matching = techniciansList.filter((t) => {
      const tWsId = (t.workshopId || '').toLowerCase().trim();
      const tWsName = (t.workshopName || '').toLowerCase().trim();

      // 1. Coincidencia directa por ID de taller
      if (tWsId && currentWsId && tWsId === currentWsId) return true;

      // 2. Coincidencia por nombre de taller
      if (tWsName && currentWsName && (tWsName.includes(currentWsName) || currentWsName.includes(tWsName))) return true;

      // 3. Coincidencia por ciudad
      if (cityKey && (tWsName.includes(cityKey) || tWsId.includes(cityKey))) return true;

      return false;
    });

    return matching;
  }, [techniciansList, formData.sedeId, formData.sede, workshopsList]);

  // Base de datos local para autocompletado rápido
  const existingClients = useMemo(() => {
    const list = getStoredClients();
    const alistamientos = getStoredFullAlistamientos();
    const map = new Map<string, {
      idNumber: string;
      fullName: string;
      phone?: string;
      email?: string;
      address?: string;
      bike?: string;
      plate?: string;
      vin?: string;
      workshopId?: string;
      workshopName?: string;
    }>();

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
          workshopId: c.workshopId,
          workshopName: c.workshopName,
        });
      }
    });

    alistamientos.forEach((a) => {
      if (a.cedulaRuc) {
        const prev = map.get(a.cedulaRuc.trim());
        map.set(a.cedulaRuc.trim(), {
          idNumber: a.cedulaRuc,
          fullName: `${a.nombres} ${a.apellidos}`.trim(),
          phone: a.celular1 || prev?.phone,
          email: a.email || prev?.email,
          address: a.direccion || prev?.address,
          bike: a.modeloMarca || prev?.bike,
          plate: a.placa || prev?.plate,
          vin: a.chasis || prev?.vin,
          workshopId: a.sedeId || prev?.workshopId,
          workshopName: a.sede || prev?.workshopName,
        });
      }
    });

    return Array.from(map.values());
  }, []);

  // Consultar Cédula o RUC
  const handleConsultar = (idOverride?: string) => {
    const idToSearch = (idOverride !== undefined ? idOverride : formData.cedulaRuc).trim();
    if (!idToSearch) return;

    setSearchFeedback(null);

    // 1. Base local (con recuperación de sede registrada)
    const localMatch = existingClients.find((c) => c.idNumber.trim() === idToSearch);
    if (localMatch) {
      const parts = localMatch.fullName.split(' ');
      const nombres = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
      const apellidos = parts.slice(Math.ceil(parts.length / 2)).join(' ');

      // Determinar la sede registrada del cliente si ya existe
      const matchedWs = workshopsList.find(
        (w) =>
          (localMatch.workshopId && w.id === localMatch.workshopId) ||
          (localMatch.workshopName && (w.name.toLowerCase() === localMatch.workshopName.toLowerCase() || w.name.toLowerCase().includes(localMatch.workshopName.toLowerCase())))
      );
      const targetSede = matchedWs ? matchedWs.name : (localMatch.workshopName || formData.sede || 'StarMotos Matriz La Maná');
      const targetSedeId = matchedWs ? matchedWs.id : (localMatch.workshopId || formData.sedeId || 'matriz-la-mana');

      setFormData((prev) => ({
        ...prev,
        cedulaRuc: idToSearch,
        sede: targetSede,
        sedeId: targetSedeId,
        nombres: nombres || localMatch.fullName,
        apellidos: apellidos || '',
        celular1: localMatch.phone || prev.celular1,
        email: localMatch.email || prev.email,
        direccion: localMatch.address || prev.direccion,
        modeloMarca: localMatch.bike || prev.modeloMarca,
        placa: localMatch.plate || prev.placa,
        chasis: localMatch.vin || prev.chasis,
        tecnicoResponsable: '',
      }));
      setSearchFeedback(`✓ Cliente registrado en ${targetSede}: ${localMatch.fullName}`);
      showToast?.(`Cliente recuperado (${targetSede}): ${localMatch.fullName}`, 'info');
      return;
    }

    // 2. SRI
    setIsSearchingSri(true);
    setTimeout(() => {
      setIsSearchingSri(false);
      const res = querySriMock(idToSearch);
      if (res && res.razonSocial) {
        const parts = res.razonSocial.split(' ');
        const nombres = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
        const apellidos = parts.slice(Math.ceil(parts.length / 2)).join(' ');

        setFormData((prev) => ({
          ...prev,
          cedulaRuc: idToSearch,
          nombres: nombres || res.razonSocial,
          apellidos: apellidos || '',
          direccion: res.address || prev.direccion,
        }));
        setSearchFeedback(`✓ SRI Ecuador: ${res.razonSocial}`);
        showToast?.(`SRI: Razón Social encontrada`, 'success');
      } else {
        setSearchFeedback('ℹ No se encontró en SRI ni en base local. Ingrese los datos manualmente.');
      }
    }, 500);
  };

  // Iniciar nuevo registro
  const handleStartNewGps = (cedulaPreFill = '') => {
    setSelectedRecordForDetail(null);
    setIsEditing(false);
    setValidationAlert(null);
    setSearchFeedback(null);
    setFormData({
      ...initialFormData,
      cedulaRuc: cedulaPreFill,
    });
    setViewMode('form');
    if (cedulaPreFill.length >= 8) {
      setTimeout(() => handleConsultar(cedulaPreFill), 100);
    }
  };

  // Abrir registro existente para ver/editar en el mismo formato
  const handleOpenRecordDetail = (record: GpsRecord) => {
    setSelectedRecordForDetail(record);
    setIsEditing(true);
    setValidationAlert(null);
    setSearchFeedback(null);
    setFormData({
      id: record.id,
      ticketNumber: record.ticketNumber,
      sede: record.sede || 'StarMotos Matriz La Maná',
      sedeId: record.sedeId || 'matriz-la-mana',
      cedulaRuc: record.cedulaRuc,
      nombres: record.nombres,
      apellidos: record.apellidos,
      celular1: record.celular1,
      celular2: record.celular2 || '',
      celular3: record.celular3 || '',
      email: record.email || '',
      direccion: record.direccion || '',
      placa: record.placa,
      modeloMarca: record.modeloMarca,
      chasis: record.chasis,
      numeroMotor: record.numeroMotor || '',
      color: record.color || '',
      year: record.year || new Date().getFullYear(),
      kilometraje: record.kilometraje || 0,
      serieGps: record.serieGps,
      serieChip: record.serieChip,
      tecnicoResponsable: record.tecnicoResponsable || '',
      fechaInicio: record.fechaInicio,
      fechaVencimiento: record.fechaVencimiento,
      valorServicio: Number(record.valorServicio) || 0,
      montoPagado: Number(record.montoPagado) || 0,
      metodoPago: ((record.metodoPago === 'Transferencia' || (record.metodoPago as string)?.toLowerCase?.().includes('transferencia')) ? 'Transferencia' : 'Efectivo') as 'Efectivo' | 'Transferencia',
      evidenciaTransferencia: record.evidenciaTransferencia || '',
      fotos: record.fotos || [],
      observaciones: record.observaciones || '',
      estado: record.estado as any,
      gpsUser: record.gpsUser || '',
      gpsPassword: record.gpsPassword || '',
    });
    setViewMode('form');
  };

  // Guardar (Nuevo o Actualización)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const missing: string[] = [];
    if (!formData.cedulaRuc.trim()) missing.push('Cédula/RUC');
    if (!formData.nombres.trim()) missing.push('Nombres del Propietario');
    if (!formData.celular1.trim()) missing.push('Celular 1 (Principal)');
    if (!formData.chasis.trim()) missing.push('Chasis (VIN)');
    if (!formData.serieGps.trim()) missing.push('Serie de GPS (IMEI)');
    if (!formData.serieChip.trim()) missing.push('Serie de Chip (SIM)');

    if (missing.length > 0) {
      setValidationAlert({
        title: 'Faltan campos obligatorios para registrar el GPS',
        fields: missing,
      });
      showToast?.('Por favor completa todos los campos requeridos.', 'error');
      return;
    }

    const saldo = Math.max(0, Number(formData.valorServicio || 0) - Number(formData.montoPagado || 0));

    if (isEditing && formData.id) {
      // Actualizar registro existente
      const updatedRecord: GpsRecord = {
        ...(selectedRecordForDetail as GpsRecord),
        sede: formData.sede || 'StarMotos Matriz La Maná',
        sedeId: formData.sedeId || 'matriz-la-mana',
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
        tecnicoResponsable: formData.tecnicoResponsable.trim() || undefined,
        fechaInicio: formData.fechaInicio,
        fechaVencimiento: formData.fechaVencimiento,
        valorServicio: Number(formData.valorServicio) || 0,
        montoPagado: Number(formData.montoPagado) || 0,
        saldoPendiente: saldo,
        metodoPago: formData.metodoPago,
        evidenciaTransferencia: formData.metodoPago === 'Transferencia' ? (formData.evidenciaTransferencia || undefined) : undefined,
        fotos: formData.fotos && formData.fotos.length > 0 ? formData.fotos : undefined,
        observaciones: formData.observaciones.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      saveStoredGpsRecord(updatedRecord);
      onSaveRecord?.(updatedRecord);
      showToast?.(`¡Ficha de GPS de ${updatedRecord.nombres} actualizada exitosamente!`, 'success');
      setViewMode('list');
      setSelectedRecordForDetail(null);
      setIsEditing(false);
      return;
    }

    // Crear nuevo registro
    const randomTicket = Math.floor(10000 + Math.random() * 90000);
    const newRecord: GpsRecord = {
      id: `gps-${Date.now()}`,
      ticketNumber: `GPS-${randomTicket}`,
      sede: formData.sede || 'StarMotos Matriz La Maná',
      sedeId: formData.sedeId || 'matriz-la-mana',
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
      tecnicoResponsable: formData.tecnicoResponsable.trim() || undefined,
      fechaInicio: formData.fechaInicio,
      fechaVencimiento: formData.fechaVencimiento,
      valorServicio: Number(formData.valorServicio) || 0,
      montoPagado: Number(formData.montoPagado) || 0,
      saldoPendiente: saldo,
      metodoPago: formData.metodoPago,
      evidenciaTransferencia: formData.metodoPago === 'Transferencia' ? (formData.evidenciaTransferencia || undefined) : undefined,
      fotos: formData.fotos && formData.fotos.length > 0 ? formData.fotos : undefined,
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
      message: `Matriz registró GPS para ${newRecord.modeloMarca} (${newRecord.placa}). Serie GPS: ${newRecord.serieGps}. Asigne credenciales de acceso.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: newRecord.id,
    };
    addStoredAlerts(alertForGps);

    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    showToast?.('¡Solicitud GPS guardada y enviada a GPS Servicios!', 'success');

    setViewMode('list');
    setSelectedRecordForDetail(null);
    setIsEditing(false);
  };

  // Métricas financieras y de conteo
  const statsMetrics = useMemo(() => {
    let totalCobrado = 0;
    let totalPendiente = 0;
    let totalFacturado = 0;
    let countConSaldo = 0;
    let countPagados = 0;
    let countActivosGps = 0;
    let countPendientesGps = 0;

    records.forEach((r) => {
      const valor = Number(r.valorServicio) || 0;
      const pagado = Number(r.montoPagado) || 0;
      const saldo = r.saldoPendiente !== undefined ? Number(r.saldoPendiente) : Math.max(0, valor - pagado);

      totalFacturado += valor;
      totalCobrado += pagado;
      totalPendiente += saldo;

      if (saldo > 0.01) {
        countConSaldo++;
      } else {
        countPagados++;
      }

      if (r.estado === 'activa') {
        countActivosGps++;
      } else {
        countPendientesGps++;
      }
    });

    return {
      totalCobrado,
      totalPendiente,
      totalFacturado,
      countConSaldo,
      countPagados,
      countActivosGps,
      countPendientesGps,
    };
  }, [records]);

  // Registros filtrados
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const valor = Number(r.valorServicio) || 0;
      const pagado = Number(r.montoPagado) || 0;
      const saldo = r.saldoPendiente !== undefined ? Number(r.saldoPendiente) : Math.max(0, valor - pagado);

      // Filtro de pago
      if (filterPayment === 'con_saldo' && saldo <= 0.01) return false;
      if (filterPayment === 'pagados' && saldo > 0.01) return false;

      // Filtro de estado
      if (filterStatus === 'pendiente' && r.estado !== 'pendiente') return false;
      if (filterStatus === 'activa' && r.estado !== 'activa') return false;

      // Búsqueda
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const clientFull = `${r.nombres} ${r.apellidos}`.toLowerCase();
        return (
          clientFull.includes(q) ||
          r.cedulaRuc.toLowerCase().includes(q) ||
          r.placa.toLowerCase().includes(q) ||
          r.chasis.toLowerCase().includes(q) ||
          r.ticketNumber.toLowerCase().includes(q) ||
          r.serieGps.toLowerCase().includes(q) ||
          r.serieChip.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [records, filterPayment, filterStatus, searchTerm]);

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Está seguro de eliminar el registro GPS de ${name}?`)) {
      deleteStoredGpsRecord(id);
      onDeleteRecord?.(id);
      showToast?.('Registro GPS eliminado.', 'info');
    }
  };

  const handleOpenWhatsApp = (phone: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? `593${cleanPhone.slice(1)}` : cleanPhone.startsWith('593') ? cleanPhone : `593${cleanPhone}`;
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in select-none">
      {/* ========================================================================= */}
      {/* 1. VISTA: LISTADO EXTERIOR (ESTILO IDÉNTICO A ALISTAMIENTO)              */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-3.5">
          {/* Header Superior Destacado: Libro de GPS */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900 tracking-tight leading-tight">
                    Libro de GPS Matriz
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Historial de compras y dispositivos satelitales
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStartNewGps('')}
                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo GPS</span>
              </button>
            </div>

            {/* Badges de métricas superiores */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px]">
              <span className="px-2 py-0.5 font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-lg whitespace-nowrap">
                {records.length} Dispositivos
              </span>
              <span className="px-2 py-0.5 font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg whitespace-nowrap">
                {statsMetrics.countActivosGps} Activos
              </span>
              <span className="px-2 py-0.5 font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-lg whitespace-nowrap">
                {statsMetrics.countPendientesGps} Pendientes
              </span>
              <span className="px-2 py-0.5 font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-mono whitespace-nowrap">
                ${statsMetrics.totalFacturado.toFixed(2)} Facturado
              </span>
            </div>

            {/* Barra de Búsqueda de Cédula / Cliente LLAMATIVA y GRANDE */}
            <div className="relative flex items-center bg-zinc-50 border-2 border-cyan-200 focus-within:border-cyan-600 focus-within:bg-white rounded-xl transition-all shadow-xs h-12 px-3 gap-2">
              <Search className="w-4 h-4 text-cyan-600 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cédula, cliente, placa o serie..."
                className="w-full bg-transparent text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-zinc-200 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Aviso reactivo si escribe cédula que no existe */}
            {searchTerm.trim().length >= 8 && filteredRecords.length === 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-center justify-between gap-2 animate-slide-in">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px]">
                    Sin registros para <strong>"{searchTerm}"</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartNewGps(searchTerm.trim())}
                  className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold shrink-0 shadow-2xs"
                >
                  + Registrar
                </button>
              </div>
            )}

            {/* 4 Bloques Estadísticos Reactivos (Filtros rápidos al hacer tap) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Bloque 1: Cobrado */}
              <button
                type="button"
                onClick={() => setFilterPayment(filterPayment === 'pagados' ? 'all' : 'pagados')}
                className={`text-left rounded-xl p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-98 ${
                  filterPayment === 'pagados'
                    ? 'bg-emerald-100 border-2 border-emerald-500 shadow-xs ring-1 ring-emerald-300'
                    : 'bg-emerald-50/70 border border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between text-emerald-800">
                  <span className="text-[9px] font-black uppercase tracking-wider">Cobrado</span>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <div className="mt-0.5">
                  <div className="text-base font-black font-mono text-emerald-900 leading-tight">
                    ${statsMetrics.totalCobrado.toFixed(2)}
                  </div>
                  <span className="text-[9px] font-semibold text-emerald-700">
                    {statsMetrics.countPagados} al día
                  </span>
                </div>
              </button>

              {/* Bloque 2: Pendiente por Cobrar */}
              <button
                type="button"
                onClick={() => setFilterPayment(filterPayment === 'con_saldo' ? 'all' : 'con_saldo')}
                className={`text-left rounded-xl p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-98 ${
                  filterPayment === 'con_saldo'
                    ? 'bg-amber-100 border-2 border-amber-500 shadow-xs ring-1 ring-amber-300'
                    : 'bg-amber-50/70 border border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between text-amber-800">
                  <span className="text-[9px] font-black uppercase tracking-wider">Por Cobrar</span>
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <div className="mt-0.5">
                  <div className="text-base font-black font-mono text-amber-900 leading-tight">
                    ${statsMetrics.totalPendiente.toFixed(2)}
                  </div>
                  <span className="text-[9px] font-semibold text-amber-700">
                    {statsMetrics.countConSaldo > 0 ? `${statsMetrics.countConSaldo} con saldo` : 'Sin saldo'}
                  </span>
                </div>
              </button>

              {/* Bloque 3: Total Facturado */}
              <button
                type="button"
                onClick={() => {
                  setFilterPayment('all');
                  setFilterStatus('all');
                }}
                className="text-left rounded-xl p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none bg-blue-50/70 border border-blue-200"
              >
                <div className="flex items-center justify-between text-blue-800">
                  <span className="text-[9px] font-black uppercase tracking-wider">Facturado</span>
                  <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
                </div>
                <div className="mt-0.5">
                  <div className="text-base font-black font-mono text-blue-900 leading-tight">
                    ${statsMetrics.totalFacturado.toFixed(2)}
                  </div>
                  <span className="text-[9px] font-semibold text-blue-700">Ventas totales</span>
                </div>
              </button>

              {/* Bloque 4: Unidades GPS */}
              <button
                type="button"
                onClick={() => setFilterStatus(filterStatus === 'pendiente' ? 'all' : 'pendiente')}
                className={`text-left rounded-xl p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-98 ${
                  filterStatus === 'pendiente'
                    ? 'bg-cyan-100 border-2 border-cyan-500 shadow-xs ring-1 ring-cyan-300'
                    : 'bg-cyan-50/70 border border-cyan-200'
                }`}
              >
                <div className="flex items-center justify-between text-cyan-800">
                  <span className="text-[9px] font-black uppercase tracking-wider">Dispositivos</span>
                  <Radio className="w-3.5 h-3.5 text-cyan-700" />
                </div>
                <div className="mt-0.5">
                  <div className="text-base font-black text-cyan-900 leading-tight">
                    {records.length} <span className="text-xs font-bold">motos</span>
                  </div>
                  <span className="text-[9px] font-semibold text-cyan-700">
                    {statsMetrics.countActivosGps} Act • {statsMetrics.countPendientesGps} Pend
                  </span>
                </div>
              </button>
            </div>

            {/* Chips de filtro rápido */}
            <div className="flex gap-1.5 overflow-x-auto pt-1 pb-0.5">
              <button
                type="button"
                onClick={() => {
                  setFilterPayment('all');
                  setFilterStatus('all');
                }}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold shrink-0 transition ${
                  filterPayment === 'all' && filterStatus === 'all'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                Todos ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterPayment(filterPayment === 'con_saldo' ? 'all' : 'con_saldo')}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold shrink-0 transition ${
                  filterPayment === 'con_saldo' ? 'bg-amber-600 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                Con Saldo ({statsMetrics.countConSaldo})
              </button>
              <button
                type="button"
                onClick={() => setFilterPayment(filterPayment === 'pagados' ? 'all' : 'pagados')}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold shrink-0 transition ${
                  filterPayment === 'pagados' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                Pagados ({statsMetrics.countPagados})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus(filterStatus === 'pendiente' ? 'all' : 'pendiente')}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold shrink-0 transition ${
                  filterStatus === 'pendiente' ? 'bg-cyan-600 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                Pendientes ({statsMetrics.countPendientesGps})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus(filterStatus === 'activa' ? 'all' : 'activa')}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold shrink-0 transition ${
                  filterStatus === 'activa' ? 'bg-emerald-700 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                Activos ({statsMetrics.countActivosGps})
              </button>
            </div>
          </div>

          {/* Listado de Tarjetas de Clientes GPS (Clic abre la ficha técnica en el mismo formato) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="font-bold text-zinc-600 text-[11px]">
                {filteredRecords.length} resultado{filteredRecords.length === 1 ? '' : 's'} encontrado{filteredRecords.length === 1 ? '' : 's'}
              </span>
              <span className="text-[10px] text-zinc-400">Toca una tarjeta para ver o editar</span>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-zinc-200 text-center text-zinc-400 shadow-2xs">
                <Radio className="w-8 h-8 mx-auto mb-2 text-zinc-300 animate-pulse" />
                <p className="font-bold text-xs text-zinc-700">No hay registros de GPS encontrados</p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Inicia registrando uno nuevo con el botón "+ Nuevo GPS".
                </p>
              </div>
            ) : (
              filteredRecords.map((r, index) => {
                const isApproved = r.estado === 'activa' && Boolean(r.gpsUser);
                const hasSaldo = Number(r.saldoPendiente || 0) > 0.01;

                return (
                  <div
                    key={r.id}
                    onClick={() => handleOpenRecordDetail(r)}
                    className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs space-y-3 cursor-pointer hover:border-cyan-400 active:scale-[0.99] transition select-none group"
                  >
                    {/* Fila Superior: Ticket & Estado */}
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                          {r.ticketNumber}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">#{index + 1}</span>
                      </div>

                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Pendiente</span>
                        </span>
                      )}
                    </div>

                    {/* Cliente y 3 Celulares */}
                    <div>
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-black text-zinc-900 group-hover:text-cyan-700 transition">
                          {r.nombres} {r.apellidos}
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-mono">{r.fechaSolicitud}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-mono text-zinc-500">C.I. {r.cedulaRuc}</span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-cyan-800 bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">
                          <MapPin className="w-2.5 h-2.5 text-cyan-600" />
                          <span>{r.sede || 'Matriz'}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                        <span
                          onClick={(e) => handleOpenWhatsApp(r.celular1, `Hola ${r.nombres}, nos comunicamos de StarMotos sobre su GPS satelital.`, e)}
                          className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1 active:scale-95"
                          title="Enviar WhatsApp"
                        >
                          📱 {r.celular1}
                        </span>
                        {r.celular2 && (
                          <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-mono">
                            📞 {r.celular2}
                          </span>
                        )}
                        {r.celular3 && (
                          <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-mono">
                            📞 {r.celular3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Moto y Series GPS & SIM */}
                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/80 text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 text-[11px]">Motocicleta:</span>
                        <strong className="text-zinc-800 text-[11px] truncate max-w-[60%]">{r.modeloMarca}</strong>
                      </div>
                      <div className="flex justify-between items-center font-mono text-[11px]">
                        <span className="text-zinc-500">Placa:</span>
                        <strong className="text-blue-700 bg-blue-50 px-1 rounded">{r.placa || 'EN TRÁMITE'}</strong>
                      </div>
                      <div className="flex justify-between items-center font-mono text-[11px]">
                        <span className="text-zinc-500">Chasis (VIN):</span>
                        <span className="text-zinc-700 truncate max-w-[60%]">{r.chasis}</span>
                      </div>
                      <div className="pt-1 border-t border-zinc-200/60 flex justify-between items-center font-mono text-[10px]">
                        <span className="text-zinc-500 uppercase font-bold">Serie GPS:</span>
                        <span className="text-zinc-900 font-bold bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                          {r.serieGps}
                        </span>
                      </div>
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-zinc-500 uppercase font-bold">Serie SIM:</span>
                        <span className="text-zinc-700 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                          {r.serieChip}
                        </span>
                      </div>
                    </div>

                    {/* Contabilidad Matriz & Vigencia */}
                    <div className="flex items-center justify-between text-xs px-1">
                      <div className="text-[11px]">
                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">Vigencia</span>
                        <strong className="text-emerald-700 font-mono text-[11px]">{r.fechaVencimiento}</strong>
                        {r.tecnicoResponsable && (
                          <span className="text-[10px] text-zinc-600 font-medium block mt-0.5">
                            🔧 {r.tecnicoResponsable}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">Total / Saldo</span>
                        <div className="font-mono text-xs">
                          <span className="text-zinc-700 font-bold">${Number(r.valorServicio || 0).toFixed(2)}</span>
                          {hasSaldo && (
                            <span className="text-red-600 font-black ml-1.5 bg-red-50 px-1 rounded border border-red-200">
                              Saldo: ${Number(r.saldoPendiente || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px] font-bold text-zinc-500">
                          <span>{r.metodoPago || 'Efectivo'}</span>
                          {r.evidenciaTransferencia && isValidMediaUrl(r.evidenciaTransferencia) && (
                            <a
                              href={r.evidenciaTransferencia}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-0.5"
                              title="Ver comprobante de transferencia"
                            >
                              <Camera className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fila de Acciones: Llave, WhatsApp, Eliminar */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleDelete(r.id, `${r.nombres} ${r.apellidos}`, e)}
                          className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-red-50 text-zinc-400 hover:text-red-600 flex items-center justify-center transition active:scale-95"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleOpenWhatsApp(r.celular1, `Hola ${r.nombres}, le saludamos de StarMotos respecto a su dispositivo GPS satelital.`, e)}
                          className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center transition active:scale-95"
                          title="Escribir al WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        {/* Botón Ver / Editar en formato completo */}
                        <button
                          type="button"
                          onClick={() => handleOpenRecordDetail(r)}
                          className="h-8 px-2.5 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold flex items-center gap-1 hover:bg-zinc-200 transition active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Ficha</span>
                        </button>
                      </div>

                      {/* BOTÓN ICONO DE LLAVE REQUERIDO */}
                      {isApproved ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecordForCredentials(r);
                          }}
                          className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition"
                          title="Ver credenciales (Usuario y Contraseña)"
                        >
                          <KeyRound className="w-4 h-4 text-amber-200" />
                          <span>Credenciales</span>
                        </button>
                      ) : (
                        <div
                          className="py-1.5 px-2.5 rounded-xl bg-zinc-100 text-zinc-400 text-[11px] font-semibold flex items-center gap-1 opacity-70 border border-zinc-200"
                          title="Esperando que GPS Servicios asigne credenciales"
                        >
                          <Lock className="w-3 h-3 text-zinc-400" />
                          <span>Sin Clave</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VISTA: FORMULARIO DE INGRESO / EDICIÓN (TODOS LOS CAMPOS EN 1 PESTAÑA) */}
      {/* ========================================================================= */}
      {viewMode === 'form' && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4 animate-fade-in">
          {/* Header Superior del Formulario */}
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setViewMode('list');
                  setSelectedRecordForDetail(null);
                  setIsEditing(false);
                }}
                className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 active:scale-95 transition"
                title="Volver al Listado"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-sm font-black text-zinc-900 leading-tight">
                  {isEditing ? `Ficha GPS: ${formData.nombres}` : 'Registrar Compra GPS'}
                </h3>
                <p className="text-[10px] text-zinc-400">
                  Todos los campos en una sola vista continua
                </p>
              </div>
            </div>

            {formData.ticketNumber && (
              <span className="font-mono text-[11px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                {formData.ticketNumber}
              </span>
            )}
          </div>

          {/* Alerta de validación */}
          {validationAlert && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-xl flex items-start justify-between gap-2 animate-slide-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-red-700">
                  <strong className="block text-red-900">{validationAlert.title}</strong>
                  <span>Requeridos: {validationAlert.fields.join(', ')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setValidationAlert(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="space-y-4">
            {/* ----------------------------------------------------------------- */}
            {/* MÓDULO 1: DATOS DEL CLIENTE & 3 CELULARES                         */}
            {/* ----------------------------------------------------------------- */}
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-600 text-white font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                    Datos del Cliente & 3 Celulares
                  </h4>
                </div>
                <span className="text-[9px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  Propietario
                </span>
              </div>

              {/* Sede / Taller de Atención */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Sede / Taller de Atención *</span>
                  </span>
                  <span className="text-[9px] text-cyan-700 font-semibold bg-cyan-50 px-1 py-0.5 rounded border border-cyan-200">
                    Cambiar si aplica
                  </span>
                </label>
                <select
                  value={formData.sedeId || formData.sede}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    const selectedWs = workshopsList.find((w) => w.id === selectedVal || w.name === selectedVal);
                    setFormData((prev) => ({
                      ...prev,
                      sedeId: selectedWs ? selectedWs.id : selectedVal,
                      sede: selectedWs ? selectedWs.name : selectedVal,
                      tecnicoResponsable: '',
                    }));
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-bold text-zinc-800 bg-white border border-zinc-300 rounded-xl outline-none focus:border-cyan-600 cursor-pointer"
                  required
                >
                  {workshopsList.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name} ({ws.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cédula con búsqueda SRI */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                  Cédula o RUC *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.cedulaRuc}
                    onChange={(e) => setFormData({ ...formData, cedulaRuc: e.target.value.trim() })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConsultar();
                      }
                    }}
                    placeholder="Ej: 1204567890"
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold bg-white border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleConsultar()}
                    disabled={isSearchingSri}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSearchingSri ? (
                      <span className="animate-spin text-xs">⏳</span>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>SRI</span>
                      </>
                    )}
                  </button>
                </div>
                {searchFeedback && (
                  <p className="text-[10px] font-medium text-cyan-700 mt-1">{searchFeedback}</p>
                )}
              </div>

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    placeholder="Nombres completos"
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    placeholder="Apellidos completos"
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Celular 1 (Principal WhatsApp) sin contenedor externo */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1 flex items-center justify-between">
                  <span>Celular 1 (Principal WhatsApp) *</span>
                  <span className="text-[9px] text-cyan-700 font-bold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                    Principal
                  </span>
                </label>
                <input
                  type="tel"
                  value={formData.celular1}
                  onChange={(e) => setFormData({ ...formData, celular1: e.target.value })}
                  placeholder="0998765432"
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                  required
                />
              </div>

              {/* Celulares 2 y 3 al lado */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Celular 2 (Secundario)
                  </label>
                  <input
                    type="tel"
                    value={formData.celular2}
                    onChange={(e) => setFormData({ ...formData, celular2: e.target.value })}
                    placeholder="0987654321"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Celular 3 (Adicional)
                  </label>
                  <input
                    type="tel"
                    value={formData.celular3}
                    onChange={(e) => setFormData({ ...formData, celular3: e.target.value })}
                    placeholder="0976543210"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                  />
                </div>
              </div>

              {/* Email & Dirección */}
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@correo.com"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Dirección Domiciliaria
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Ciudad, Barrio, Calles"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-xl focus:border-cyan-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* MÓDULO 2: MOTOCICLETA & HARDWARE GPS                              */}
            {/* ----------------------------------------------------------------- */}
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                    Motocicleta & Hardware GPS
                  </h4>
                </div>
                <span className="text-[9px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Vehículo
                </span>
              </div>

              {/* Modelo/Marca & Placa */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Marca / Modelo *
                  </label>
                  <input
                    type="text"
                    value={formData.modeloMarca}
                    onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                    placeholder="Ej: Benelli TRK 502"
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-zinc-300 rounded-xl focus:border-blue-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Placa
                  </label>
                  <input
                    type="text"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                    placeholder="PBX-8492 o EN TRÁMITE"
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-zinc-300 rounded-xl focus:border-blue-600 outline-none uppercase"
                  />
                </div>
              </div>

              {/* Chasis VIN & Número Motor */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Chasis (VIN) *
                  </label>
                  <input
                    type="text"
                    value={formData.chasis}
                    onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                    placeholder="17 dígitos"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-zinc-300 rounded-xl focus:border-blue-600 outline-none uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Número Motor
                  </label>
                  <input
                    type="text"
                    value={formData.numeroMotor}
                    onChange={(e) => setFormData({ ...formData, numeroMotor: e.target.value.toUpperCase() })}
                    placeholder="Motor..."
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-zinc-300 rounded-xl focus:border-blue-600 outline-none uppercase"
                  />
                </div>
              </div>

              {/* Color, Año, Km */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Negro"
                    className="w-full px-2 py-1.5 text-xs bg-white border border-zinc-300 rounded-xl focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Año
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-zinc-300 rounded-xl focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Km
                  </label>
                  <input
                    type="number"
                    value={formData.kilometraje}
                    onChange={(e) => setFormData({ ...formData, kilometraje: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-zinc-300 rounded-xl focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              {/* Series de Hardware GPS & SIM (sin contenedor externo) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Serie GPS (IMEI) *
                  </label>
                  <input
                    type="text"
                    value={formData.serieGps}
                    onChange={(e) => setFormData({ ...formData, serieGps: e.target.value.trim() })}
                    placeholder="869402058491823"
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-zinc-300 rounded-xl focus:border-blue-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Serie Chip (SIM) *
                  </label>
                  <input
                    type="text"
                    value={formData.serieChip}
                    onChange={(e) => setFormData({ ...formData, serieChip: e.target.value.trim() })}
                    placeholder="8959302194820194820"
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-zinc-300 rounded-xl focus:border-blue-600 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* MÓDULO 3: VIGENCIA & CONTABILIDAD MATRIZ                           */}
            {/* ----------------------------------------------------------------- */}
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                    Vigencia, Técnico & Cobro
                  </h4>
                </div>
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Módulo 3
                </span>
              </div>

              {/* Fechas de inicio y vencimiento AL LADO */}
              <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-zinc-200">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-700 block mb-1">
                    Fecha Inicio *
                  </label>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg focus:border-emerald-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-700 block mb-1">
                    Fecha Vence *
                  </label>
                  <input
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg focus:border-emerald-600 outline-none"
                    required
                  />
                </div>
              </div>

              {/* TÉCNICO ENCARGADO (FILTRADO POR SEDE) */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    <span>Técnico Encargado</span>
                  </span>
                  <span className="text-[9px] text-zinc-500 font-medium truncate max-w-[50%]">
                    Sede: {formData.sede || 'Matriz'}
                  </span>
                </label>
                <select
                  value={formData.tecnicoResponsable}
                  onChange={(e) => setFormData({ ...formData, tecnicoResponsable: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold text-zinc-800 bg-white border border-zinc-300 rounded-xl outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="">
                    {availableTechniciansForSede.length === 0
                      ? `(Sin técnicos registrados en ${formData.sede || 'esta sede'})`
                      : 'Seleccione Técnico Encargado...'}
                  </option>
                  {availableTechniciansForSede.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} {t.specialty ? `(${t.specialty})` : ''}
                    </option>
                  ))}
                  {formData.tecnicoResponsable && !availableTechniciansForSede.some((t) => t.name === formData.tecnicoResponsable) && (
                    <option value={formData.tecnicoResponsable}>{formData.tecnicoResponsable} (Asignado)</option>
                  )}
                </select>
              </div>

              {/* CONTABILIDAD MATRIZ: SIN BLOQUE EXTERNO, MÉTODO DE PAGO ALADO */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-700 block mb-1">
                    Valor GPS ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorServicio}
                    onFocus={selectOnFocus}
                    onChange={(e) => {
                      const val = cleanNumberInput(e.target.value);
                      setFormData({ ...formData, valorServicio: val === '' ? 0 : Number(val) });
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-zinc-300 rounded-xl focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-700">
                      Abono ($)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          montoPagado: prev.valorServicio,
                        }));
                      }}
                      className="text-[9px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                    >
                      Total
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.montoPagado}
                    onFocus={selectOnFocus}
                    onChange={(e) => {
                      const ab = cleanNumberInput(e.target.value);
                      setFormData({ ...formData, montoPagado: ab === '' ? 0 : Number(ab) });
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-zinc-300 rounded-xl focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              {/* Saldo Pendiente y Método de Pago ALADO */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Saldo Pendiente ($)
                  </label>
                  <div
                    className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-between ${
                      formData.valorServicio - formData.montoPagado > 0.01
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    }`}
                  >
                    <span>
                      ${Math.max(0, formData.valorServicio - formData.montoPagado).toFixed(2)}
                    </span>
                    <span className={`text-[9px] font-sans font-bold px-1 py-0.5 rounded ${
                      formData.valorServicio - formData.montoPagado > 0.01
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-emerald-200 text-emerald-900'
                    }`}>
                      {formData.valorServicio - formData.montoPagado > 0.01 ? 'Pend.' : 'OK'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                    Método de Pago *
                  </label>
                  <select
                    value={formData.metodoPago}
                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value as 'Efectivo' | 'Transferencia' })}
                    className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-zinc-300 rounded-xl focus:border-emerald-600 outline-none cursor-pointer"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              {/* Subida de Imagen si es Transferencia */}
              {formData.metodoPago === 'Transferencia' && (
                <div className="space-y-1.5 pt-1 border-t border-zinc-200">
                  <label className="block text-[10px] font-black uppercase text-emerald-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                      Comprobante de Transferencia
                    </span>
                    {formData.evidenciaTransferencia && (
                      <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                        ✓ Cargado
                      </span>
                    )}
                  </label>

                  {formData.evidenciaTransferencia && isValidMediaUrl(formData.evidenciaTransferencia) ? (
                    <div className="relative rounded-xl border border-emerald-300 bg-emerald-50/40 p-2 flex items-center gap-2.5">
                      <a
                        href={formData.evidenciaTransferencia}
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-200 shrink-0 block"
                        title="Ver comprobante en tamaño completo"
                      >
                        <img
                          src={formData.evidenciaTransferencia}
                          alt="Comprobante"
                          className="w-full h-full object-cover"
                        />
                      </a>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-zinc-900 truncate">Comprobante registrado</p>
                        <p className="text-[9px] text-zinc-500">Toca la foto para ver completa</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, evidenciaTransferencia: '' }))}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg active:scale-95 cursor-pointer"
                        title="Eliminar comprobante"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 rounded-xl cursor-pointer">
                      <Camera className="w-5 h-5 text-emerald-600 mb-1" />
                      <span className="text-xs font-bold text-emerald-900">Subir foto o captura del comprobante</span>
                      <span className="text-[9px] text-zinc-500">JPG, PNG o captura</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const compressed = await compressImageBase64(file, 1000, 0.7);
                            setFormData((prev) => ({ ...prev, evidenciaTransferencia: compressed }));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              )}

                  {/* FOTOGRAFÍAS / EVIDENCIAS DE LA INSTALACIÓN GPS */}
                  <div className="space-y-1.5 pt-1 border-t border-zinc-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-zinc-700 flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Fotos / Evidencias de Instalación</span>
                      </label>
                      <span className="text-[9px] font-bold text-zinc-500 bg-zinc-200/80 px-1.5 py-0.5 rounded-full">
                        {formData.fotos.length} foto{formData.fotos.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Galería de miniaturas móvil */}
                    {formData.fotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-1.5 pb-1">
                        {formData.fotos.map((foto, index) => (
                          <div
                            key={index}
                            className="relative group rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 aspect-square"
                          >
                            <img
                              src={foto}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-full object-cover"
                              onClick={() => setPreviewImage(foto)}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData((prev) => ({
                                  ...prev,
                                  fotos: prev.fotos.filter((_, i) => i !== index),
                                }));
                              }}
                              className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white shadow-xs"
                              title="Eliminar foto"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                            <span className="absolute bottom-1 left-1 text-[8px] font-bold bg-black/60 text-white px-1 rounded">
                              #{index + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <label className="flex items-center justify-center gap-1.5 p-2 border-2 border-dashed border-cyan-300 hover:border-cyan-500 bg-cyan-50/20 rounded-xl cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-cyan-600" />
                      <span className="text-[11px] font-bold text-cyan-900">
                        {formData.fotos.length > 0 ? '+ Agregar más fotos' : 'Subir fotos de instalación'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            const newFotos: string[] = [];
                            for (let i = 0; i < files.length; i++) {
                              const compressed = await compressImageBase64(files[i], 1000, 0.7);
                              if (compressed) newFotos.push(compressed);
                            }
                            setFormData((prev) => ({
                              ...prev,
                              fotos: [...prev.fotos, ...newFotos],
                            }));
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-700 block mb-1">
                      Observaciones
                    </label>
                    <textarea
                      rows={2}
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      placeholder="Detalles sobre instalación, cobro o cliente..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-300 rounded-xl focus:border-emerald-600 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Botones de acción del formulario */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('list');
                      setSelectedRecordForDetail(null);
                      setIsEditing(false);
                    }}
                    className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition active:scale-95"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? 'Guardar Cambios' : 'Guardar y Enviar'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal visor de foto en tamaño completo */}
          {previewImage && (
            <div
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setPreviewImage(null)}
            >
              <div
                className="relative max-w-sm max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition cursor-pointer z-10"
                  title="Cerrar vista previa"
                >
                  <X className="w-4 h-4" />
                </button>
                <img
                  src={previewImage}
                  alt="Evidencia en tamaño completo"
                  className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain mx-auto"
                />
              </div>
            </div>
          )}

          {/* Modal Credenciales al pulsar la Llave */}
          <GpsCredentialDetailModal
            isOpen={Boolean(selectedRecordForCredentials)}
            onClose={() => setSelectedRecordForCredentials(null)}
            record={selectedRecordForCredentials}
          />
        </div>
      );
};
