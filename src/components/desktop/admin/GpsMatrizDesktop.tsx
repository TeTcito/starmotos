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
  X,
  Save,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  Printer,
  MessageCircle,
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
  getRegisteredBrands,
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

export const GpsMatrizDesktop: React.FC<Props> = ({
  records,
  onSaveRecord,
  onDeleteRecord,
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState<'all' | 'con_saldo' | 'pagados'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendiente' | 'activa'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Registro en modo edición / detalle
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<GpsRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Modales
  const [selectedRecordForCredentials, setSelectedRecordForCredentials] = useState<GpsRecord | null>(null);

  // Fechas por defecto
  const todayStr = new Date().toISOString().split('T')[0];
  const nextYearDate = new Date();
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
  const nextYearStr = nextYearDate.toISOString().split('T')[0];

  // Estado del Formulario (Todos los campos juntos en 3 columnas en la misma vista)
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
    observaciones: '',
    // Estado y credenciales
    estado: 'pendiente' as 'pendiente' | 'activa',
    gpsUser: '',
    gpsPassword: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isSearchingSri, setIsSearchingSri] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [validationAlert, setValidationAlert] = useState<{ title: string; fields: string[] } | null>(null);

  // Lista oficial de Sedes / Talleres de StarMotos
  const workshopsList = useMemo(() => getStoredWorkshops(), []);

  // Lista de Técnicos disponibles del taller/matriz
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

  // Clientes de base local para autocompletar rápido
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

    // 1. Base local de clientes (con recuperación de sede registrada)
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
        setSearchFeedback(`✓ SRI Ecuador: Razón Social encontrada: ${res.razonSocial}`);
        showToast?.(`SRI: Razón Social recuperada: ${res.razonSocial}`, 'success');
      } else {
        setSearchFeedback('⚠ No se encontró en SRI ni en la base local. Por favor ingrese los datos manualmente.');
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

    // Validar campos obligatorios
    const missing: string[] = [];
    if (!formData.cedulaRuc.trim()) missing.push('Cédula/RUC');
    if (!formData.nombres.trim()) missing.push('Nombres del Propietario');
    if (!formData.celular1.trim()) missing.push('Celular 1 (Principal)');
    if (!formData.chasis.trim()) missing.push('Chasis (VIN)');
    if (!formData.serieGps.trim()) missing.push('Serie de GPS (IMEI)');
    if (!formData.serieChip.trim()) missing.push('Serie de Chip (SIM)');

    if (missing.length > 0) {
      setValidationAlert({
        title: 'Faltan campos obligatorios para registrar la compra del GPS',
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
      observaciones: formData.observaciones.trim() || undefined,
      estado: 'pendiente',
      createdAt: new Date().toISOString(),
    };

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
    setViewMode('list');
    setFormData(initialFormData);
  };

  // Filtrado de la tabla (igual al estilo de Alistamiento)
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Filtro de pago
      if (filterPayment === 'con_saldo' && Number(r.saldoPendiente || 0) <= 0) return false;
      if (filterPayment === 'pagados' && Number(r.saldoPendiente || 0) > 0) return false;

      // Filtro de estado
      if (filterStatus !== 'all' && r.estado !== filterStatus) return false;

      // Búsqueda por texto
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
  }, [records, filterPayment, filterStatus, searchTerm]);

  // Métricas financieras y operativas (igual que Alistamiento)
  const statsMetrics = useMemo(() => {
    let totalFacturado = 0;
    let totalRecaudado = 0;
    let totalPendiente = 0;
    let countConSaldo = 0;
    let countPendientesGps = 0;
    let countActivosGps = 0;

    records.forEach((r) => {
      const val = Number(r.valorServicio) || 0;
      const pag = Number(r.montoPagado) || 0;
      const sal = Number(r.saldoPendiente !== undefined ? r.saldoPendiente : Math.max(0, val - pag));

      totalFacturado += val;
      totalRecaudado += pag;
      totalPendiente += sal;

      if (sal > 0) countConSaldo++;
      if (r.estado === 'pendiente') countPendientesGps++;
      if (r.estado === 'activa') countActivosGps++;
    });

    return {
      totalFacturado,
      totalRecaudado,
      totalPendiente,
      countConSaldo,
      countPendientesGps,
      countActivosGps,
    };
  }, [records]);

  const activeFilterCount = (filterPayment !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0);

  const handleDelete = (id: string, clientName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm(`¿Estás seguro de eliminar el registro GPS de "${clientName}"?`)) {
      deleteStoredGpsRecord(id);
      onDeleteRecord?.(id);
      showToast?.('Registro GPS eliminado del sistema.', 'info');
      if (selectedRecordForDetail?.id === id) {
        setViewMode('list');
        setSelectedRecordForDetail(null);
      }
    }
  };

  return (
    <div className="h-full w-full flex-1 flex flex-col font-sans antialiased animate-fade-in text-zinc-900">
      {/* ========================================================================= */}
      {/* 1. VISTA: TABLA Y LIBRO EXTERIOR DE COMPRAS GPS (IDÉNTICO A ALISTAMIENTO)  */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="h-full w-full flex-1 min-h-0 flex flex-col overflow-y-auto xl:overflow-hidden gap-3">
          {/* Header Superior: Libro de GPS & Búsqueda Destacada */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 shrink-0">
            {/* Fila 1: Título con Icono y Badges de Métricas */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight leading-tight">
                      Libro de Registro & Compras GPS Matriz
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-200">
                      Exclusivo Matriz
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">
                    Historial de rastreadores satelitales, auditoría técnica con GPS Servicios y estados de cobro
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-lg whitespace-nowrap shadow-2xs">
                  {records.length} GPS Totales
                </span>
                <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-lg whitespace-nowrap shadow-2xs">
                  {statsMetrics.countPendientesGps} Pendientes de Clave
                </span>
                <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg whitespace-nowrap shadow-2xs">
                  {statsMetrics.countActivosGps} Activos con Llave
                </span>
                <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-mono whitespace-nowrap shadow-2xs">
                  ${statsMetrics.totalFacturado.toFixed(2)} Facturado
                </span>
              </div>
            </div>

            {/* Fila 2: Barra de Búsqueda LLAMATIVA y Botón "+ Nuevo Registro GPS" */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-2.5 border-t border-zinc-100">
              <div className="relative flex-1 flex items-center bg-zinc-50 hover:bg-white focus-within:bg-white border-2 border-cyan-200 focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-100 rounded-xl transition-all shadow-xs h-12 sm:h-13 px-4 gap-3">
                <Search className="w-5 h-5 text-cyan-600 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (filteredRecords.length === 0 && searchTerm.trim().length >= 8) {
                        handleStartNewGps(searchTerm.trim());
                      } else if (filteredRecords.length > 0) {
                        handleOpenRecordDetail(filteredRecords[0]);
                      }
                    }
                  }}
                  placeholder="Buscar por Cédula, cliente, placa, chasis, serie GPS o serie SIM..."
                  className="w-full bg-transparent text-sm sm:text-base font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-zinc-200 cursor-pointer shrink-0 transition-colors"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {searchTerm.trim().length >= 8 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (filteredRecords.length > 0) {
                        handleOpenRecordDetail(filteredRecords[0]);
                      } else {
                        handleStartNewGps(searchTerm.trim());
                      }
                    }}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    {filteredRecords.length > 0 ? 'Ver Formulario' : 'Consultar C.I.'}
                  </button>
                )}
              </div>

              {/* Botón Filtros Interactivos */}
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`h-12 sm:h-13 px-4 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs shrink-0 ${
                  isFilterOpen || activeFilterCount > 0
                    ? 'bg-cyan-50 border-cyan-400 text-cyan-800'
                    : 'bg-white border-zinc-300 hover:border-zinc-400 text-zinc-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[11px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Botón "+ Nueva Compra GPS" Destacado */}
              <button
                type="button"
                onClick={() => handleStartNewGps(searchTerm.trim())}
                className="h-12 sm:h-13 px-6 bg-cyan-600 hover:bg-cyan-700 active:scale-98 text-white font-bold text-sm sm:text-base rounded-xl shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>+ Nueva Compra GPS</span>
              </button>
            </div>

            {/* Panel de Filtros Interactivos Desplegable */}
            {isFilterOpen && (
              <div className="bg-zinc-50/90 border border-cyan-200 rounded-2xl p-4 shadow-xs space-y-4 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
                      Filtros de GPS & Cobros
                    </span>
                    <span className="text-[11px] text-zinc-500 font-semibold">
                      ({filteredRecords.length} resultado{filteredRecords.length === 1 ? '' : 's'})
                    </span>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterPayment('all');
                        setFilterStatus('all');
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Limpiar Filtros</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Estado de Pago */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-zinc-600 tracking-wider">
                      Estado de Pago en Matriz
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFilterPayment('all')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          filterPayment === 'all'
                            ? 'bg-cyan-600 text-white border-cyan-600 shadow-2xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterPayment('con_saldo')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          filterPayment === 'con_saldo'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        Con Saldo ({statsMetrics.countConSaldo})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterPayment('pagados')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          filterPayment === 'pagados'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        Cobrados
                      </button>
                    </div>
                  </div>

                  {/* Estado de Aprobación por GPS Servicios */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-zinc-600 tracking-wider">
                      Estado de Credenciales (GPS Servicios)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFilterStatus('all')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          filterStatus === 'all'
                            ? 'bg-cyan-600 text-white border-cyan-600 shadow-2xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('pendiente')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          filterStatus === 'pendiente'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        Pendientes ({statsMetrics.countPendientesGps})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('activa')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          filterStatus === 'activa'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        Activos ({statsMetrics.countActivosGps})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4 Tarjetas Financieras Interactivas (Idéntico a Alistamiento) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pt-1">
              {/* Tarjeta 1: Cobrado */}
              <button
                type="button"
                onClick={() => setFilterPayment(filterPayment === 'pagados' ? 'all' : 'pagados')}
                className={`text-left rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-[0.98] ${
                  filterPayment === 'pagados'
                    ? 'bg-emerald-100 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-300 scale-[1.01]'
                    : 'bg-emerald-50/70 border border-emerald-200 shadow-2xs hover:bg-emerald-100/70 hover:border-emerald-300'
                }`}
                title="Filtrar por cobros liquidados"
              >
                <div className="flex items-center justify-between text-emerald-800">
                  <span className="text-[10px] font-black uppercase tracking-wider">Ingresos Cobrados</span>
                  <div className="w-6 h-6 rounded-lg bg-emerald-200/80 flex items-center justify-center text-emerald-800">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-1">
                  <div className="text-lg sm:text-xl font-black font-mono text-emerald-900 leading-tight">
                    ${statsMetrics.totalRecaudado.toFixed(2)}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700">Abonos y cobros recibidos</span>
                </div>
              </button>

              {/* Tarjeta 2: Pendiente por Cobrar */}
              <button
                type="button"
                onClick={() => setFilterPayment(filterPayment === 'con_saldo' ? 'all' : 'con_saldo')}
                className={`text-left rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-[0.98] ${
                  filterPayment === 'con_saldo'
                    ? 'bg-amber-100 border-2 border-amber-500 shadow-md ring-2 ring-amber-300 scale-[1.01]'
                    : 'bg-amber-50/70 border border-amber-200 shadow-2xs hover:bg-amber-100/70 hover:border-amber-300'
                }`}
                title="Filtrar por clientes con saldo pendiente"
              >
                <div className="flex items-center justify-between text-amber-800">
                  <span className="text-[10px] font-black uppercase tracking-wider">Pendiente por Cobrar</span>
                  <div className="w-6 h-6 rounded-lg bg-amber-200/80 flex items-center justify-center text-amber-800">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-1">
                  <div className="text-lg sm:text-xl font-black font-mono text-amber-900 leading-tight">
                    ${statsMetrics.totalPendiente.toFixed(2)}
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700">
                    {statsMetrics.countConSaldo > 0 ? `${statsMetrics.countConSaldo} cliente(s) con saldo` : 'Al día'}
                  </span>
                </div>
              </button>

              {/* Tarjeta 3: Total Facturado */}
              <button
                type="button"
                onClick={() => setFilterPayment('all')}
                className="text-left rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer select-none bg-blue-50/70 border border-blue-200 shadow-2xs hover:bg-blue-100/70"
                title="Ver todas las ventas de GPS"
              >
                <div className="flex items-center justify-between text-blue-800">
                  <span className="text-[10px] font-black uppercase tracking-wider">Total Facturado</span>
                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-1">
                  <div className="text-lg sm:text-xl font-black font-mono text-blue-900 leading-tight">
                    ${statsMetrics.totalFacturado.toFixed(2)}
                  </div>
                  <span className="text-[10px] font-semibold text-blue-700">Volumen total ventas GPS</span>
                </div>
              </button>

              {/* Tarjeta 4: Unidades GPS */}
              <button
                type="button"
                onClick={() => setFilterStatus(filterStatus === 'pendiente' ? 'all' : 'pendiente')}
                className={`text-left rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer select-none ${
                  filterStatus === 'pendiente'
                    ? 'bg-cyan-100 border-2 border-cyan-500 shadow-md ring-2 ring-cyan-300'
                    : 'bg-cyan-50/70 border border-cyan-200 shadow-2xs hover:bg-cyan-100/70'
                }`}
                title="Filtrar por unidades pendientes de credenciales"
              >
                <div className="flex items-center justify-between text-cyan-800">
                  <span className="text-[10px] font-black uppercase tracking-wider">Dispositivos GPS</span>
                  <div className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-700">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-1">
                  <div className="text-lg sm:text-xl font-black text-cyan-900 leading-tight">
                    {records.length} <span className="text-xs font-bold text-cyan-700">unidades</span>
                  </div>
                  <span className="text-[10px] font-semibold text-cyan-700">
                    {statsMetrics.countActivosGps} Activos • {statsMetrics.countPendientesGps} Pendientes
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Tabla de Registros (Estilo Excel de Alistamiento) */}
          <div className="flex-1 min-h-0 min-h-[300px] w-full bg-white border border-zinc-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-zinc-100 z-10 shadow-2xs select-none">
                  <tr className="text-zinc-700 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-300 divide-x divide-zinc-200">
                    <th className="w-10 px-2 py-2.5 text-center text-zinc-500 font-mono">#</th>
                    <th className="px-3 py-2.5">Ticket / Fecha</th>
                    <th className="px-3 py-2.5">Cliente & 3 Celulares</th>
                    <th className="px-3 py-2.5">Motocicleta</th>
                    <th className="px-3 py-2.5">Series GPS & SIM</th>
                    <th className="px-3 py-2.5">Vigencia</th>
                    <th className="px-3 py-2.5 text-right">Valor</th>
                    <th className="px-3 py-2.5 text-right">Pagado</th>
                    <th className="px-3 py-2.5 text-right">Saldo</th>
                    <th className="px-3 py-2.5 text-center">Estado</th>
                    <th className="w-28 px-3 py-2.5 text-center whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-800">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-16 text-center text-zinc-400">
                        <Radio className="w-10 h-10 mx-auto mb-2 text-zinc-300 animate-pulse" />
                        <p className="font-bold text-zinc-700 text-sm">No se encontraron registros de GPS</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {records.length === 0
                            ? 'Inicia registrando una nueva compra de GPS con el botón "+ Nueva Compra GPS".'
                            : 'Prueba cambiando los términos o filtros de búsqueda.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record, i) => {
                      const isApproved = record.estado === 'activa' && Boolean(record.gpsUser);
                      const hasSaldo = Number(record.saldoPendiente || 0) > 0;

                      return (
                        <tr
                          key={record.id}
                          onClick={() => handleOpenRecordDetail(record)}
                          className={`cursor-pointer transition-colors divide-x divide-zinc-200/70 select-none group ${
                            isApproved
                              ? 'bg-emerald-50/40 hover:bg-emerald-100/60 text-zinc-900'
                              : 'hover:bg-cyan-50/60 active:bg-cyan-100/70 text-zinc-900'
                          }`}
                          title={`Haga clic para ver los datos completos de ${record.nombres} ${record.apellidos} en el formato de ingreso`}
                        >
                          {/* # */}
                          <td className="px-2 py-2.5 text-center font-mono text-[11px] text-zinc-400 bg-zinc-50/50">
                            {i + 1}
                          </td>

                          {/* Ticket y Fecha */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className="font-mono font-bold text-xs text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 block w-max">
                              {record.ticketNumber}
                            </span>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">{record.fechaSolicitud}</span>
                          </td>

                          {/* Cliente y 3 Celulares */}
                          <td className="px-3 py-2.5 max-w-xs">
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-zinc-900 group-hover:text-cyan-700 transition-colors truncate">
                                {record.nombres} {record.apellidos}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className="text-[10px] font-mono text-zinc-500">
                                  C.I. {record.cedulaRuc}
                                </span>
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-cyan-800 bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200" title={`Sede: ${record.sede || 'Matriz'}`}>
                                  <MapPin className="w-2.5 h-2.5 text-cyan-600" />
                                  <span className="truncate max-w-[110px]">{record.sede || 'Matriz'}</span>
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200" title="Celular Principal">
                                  📱 {record.celular1}
                                </span>
                                {record.celular2 && (
                                  <span className="font-mono text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded" title="Celular 2">
                                    📞 {record.celular2}
                                  </span>
                                )}
                                {record.celular3 && (
                                  <span className="font-mono text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded" title="Celular 3">
                                    📞 {record.celular3}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Motocicleta */}
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-xs text-zinc-800 block truncate">
                              {record.modeloMarca}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-blue-700 block">
                              Placa: {record.placa || 'EN TRÁMITE'}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400 block truncate">
                              VIN: {record.chasis}
                            </span>
                          </td>

                          {/* Hardware: Series GPS & Chip */}
                          <td className="px-3 py-2.5 font-mono text-[11px]">
                            <div className="truncate">
                              <span className="text-[9px] font-bold uppercase text-zinc-400">GPS: </span>
                              <span className="font-bold text-zinc-900 select-all">{record.serieGps}</span>
                            </div>
                            <div className="truncate mt-0.5">
                              <span className="text-[9px] font-bold uppercase text-zinc-400">SIM: </span>
                              <span className="text-zinc-600 select-all">{record.serieChip}</span>
                            </div>
                          </td>

                          {/* Vigencia & Técnico */}
                          <td className="px-3 py-2.5 text-[11px] whitespace-nowrap">
                            <span className="text-zinc-600 block">Ini: {record.fechaInicio}</span>
                            <span className="font-bold text-emerald-700 block">Ven: {record.fechaVencimiento}</span>
                            {record.tecnicoResponsable && (
                              <span className="text-[10px] text-blue-700 block font-medium truncate max-w-[120px]" title={`Técnico: ${record.tecnicoResponsable}`}>
                                🔧 {record.tecnicoResponsable}
                              </span>
                            )}
                          </td>

                          {/* Valor */}
                          <td className="px-3 py-2.5 text-right font-mono font-semibold text-zinc-800 whitespace-nowrap">
                            ${Number(record.valorServicio || 0).toFixed(2)}
                          </td>

                          {/* Pagado & Método */}
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            <div>${Number(record.montoPagado || 0).toFixed(2)}</div>
                            <div className="flex items-center justify-end gap-1 mt-0.5 font-sans font-medium text-[10px]">
                              <span className="text-zinc-500">
                                {record.metodoPago || 'Efectivo'}
                              </span>
                              {record.evidenciaTransferencia && (
                                <a
                                  href={record.evidenciaTransferencia}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded hover:bg-emerald-50 transition"
                                  title="Ver comprobante de transferencia bancaria"
                                >
                                  <Camera className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Saldo */}
                          <td className="px-3 py-2.5 text-right font-mono font-bold whitespace-nowrap">
                            <span className={hasSaldo ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200' : 'text-zinc-400'}>
                              ${Number(record.saldoPendiente || 0).toFixed(2)}
                            </span>
                          </td>

                          {/* Estado */}
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>Activo</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>Pendiente</span>
                              </span>
                            )}
                          </td>

                          {/* ACCIONES (LLAVE & ELIMINAR) */}
                          <td className="px-3 py-2.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              {/* ICONO DE LLAVE */}
                              {isApproved ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRecordForCredentials(record);
                                  }}
                                  className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 transition cursor-pointer active:scale-95 group relative"
                                  title="Ver credenciales (Usuario y Clave) para compartir por WhatsApp"
                                >
                                  <KeyRound className="w-4 h-4 text-amber-200 group-hover:rotate-12 transition-transform" />
                                </button>
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-400 flex items-center justify-center cursor-not-allowed opacity-50"
                                  title="Pendiente de credenciales: El operador de GPS Servicios aún no ha asignado el usuario y contraseña."
                                >
                                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                                </div>
                              )}

                              {/* Botón Ver Ficha (mismo formato de ingreso) */}
                              <button
                                type="button"
                                onClick={() => handleOpenRecordDetail(record)}
                                className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition cursor-pointer"
                                title="Ver todos los campos en el formato de ingreso"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Eliminar */}
                              <button
                                type="button"
                                onClick={(e) => handleDelete(record.id, `${record.nombres} ${record.apellidos}`, e)}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VISTA: FORMULARIO DE INGRESO / EDICIÓN DE GPS (TODOS LOS CAMPOS EN 1 PESTAÑA) */}
      {/* ========================================================================= */}
      {viewMode === 'form' && (
        <div className="flex-1 min-h-0 w-full overflow-y-auto pr-1 pb-8">
          <form onSubmit={handleSubmitForm} className="space-y-4 animate-fade-in bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
            {/* Cabecera del Formulario de Ingreso de GPS */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('list');
                    setSelectedRecordForDetail(null);
                    setIsEditing(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 active:scale-98 text-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4 text-zinc-600" />
                  <span>Volver al Libro de GPS</span>
                </button>

                <div className="h-6 w-px bg-zinc-200 hidden sm:block" />

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                      {isEditing
                        ? `Ficha Técnica GPS: ${formData.nombres} ${formData.apellidos}`
                        : 'Registro de Nueva Compra GPS'}
                    </h2>
                    {formData.ticketNumber && (
                      <span className="font-mono text-xs text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 font-bold">
                        {formData.ticketNumber}
                      </span>
                    )}
                    {isEditing && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        formData.estado === 'activa'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {formData.estado === 'activa' ? '✓ Credenciales Activas' : '⏳ Pendiente de Credenciales'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Todos los campos de cliente, motocicleta y vigencia integrados en una sola vista.
                  </p>
                </div>
              </div>

              {/* Botones de acción rápida en cabecera */}
              <div className="flex items-center gap-2">
                {isEditing && formData.estado === 'activa' && formData.gpsUser && (
                  <button
                    type="button"
                    onClick={() => setSelectedRecordForCredentials(selectedRecordForDetail)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-200" />
                    <span>Ver Credenciales & WhatsApp</span>
                  </button>
                )}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>
                )}
              </div>
            </div>

            {/* ALERTA DE VALIDACIÓN SI FALTAN CAMPOS */}
            {validationAlert && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-xl shadow-xs flex items-start justify-between gap-3 animate-slide-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-red-900">{validationAlert.title}</h4>
                    <p className="text-[11px] text-red-700 mt-0.5">
                      Por favor complete los campos requeridos:{' '}
                      <span className="font-bold underline">{validationAlert.fields.join(', ')}</span>.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setValidationAlert(null)}
                  className="text-red-400 hover:text-red-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ===================================================================== */}
            {/* LAYOUT PRINCIPAL: 3 COLUMNAS SIMÉTRICAS EN LA MISMA PESTAÑA           */}
            {/* ===================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
              {/* ----------------------------------------------------------------- */}
              {/* COLUMNA 1: MÓDULO 1 - DATOS DEL CLIENTE & 3 CELULARES             */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3.5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 font-black text-xs flex items-center justify-center border border-cyan-200">
                        1
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-zinc-900">Datos del Cliente</h3>
                        <p className="text-[11px] text-zinc-400">Cédula SRI & 3 Celulares</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                      Módulo 1
                    </span>
                  </div>

                  {/* Sede / Taller de Atención */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Sede / Taller de Atención *</span>
                      </span>
                      <span className="text-[10px] text-cyan-700 font-semibold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                        Cambiar si atiende en otra sede
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
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-bold text-zinc-800 outline-none focus:border-cyan-600 focus:bg-white cursor-pointer"
                      required
                    >
                      {workshopsList.map((ws) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.name} ({ws.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cédula o RUC (con botón Consultar SRI) */}
                  <div className="bg-cyan-50/60 p-2.5 rounded-xl border border-cyan-200 space-y-1.5">
                    <label className="block text-xs font-black uppercase text-cyan-950">
                      Cédula o RUC del Cliente *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.cedulaRuc}
                        onChange={(e) => setFormData({ ...formData, cedulaRuc: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleConsultar();
                          }
                        }}
                        placeholder="Ejemplo: 1723456789 o RUC..."
                        className="flex-1 px-3 py-2 bg-white border border-cyan-300 rounded-xl text-sm font-mono font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleConsultar()}
                        disabled={isSearchingSri || !formData.cedulaRuc.trim()}
                        className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{isSearchingSri ? 'Buscando...' : 'Consultar'}</span>
                      </button>
                    </div>
                    {searchFeedback && (
                      <p className="text-[11px] font-medium leading-tight p-2 rounded-lg bg-white border border-cyan-200 text-cyan-900">
                        {searchFeedback}
                      </p>
                    )}
                  </div>

                  {/* Nombres */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      value={formData.nombres}
                      onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                      placeholder="Ejemplo: Carlos Alberto"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-cyan-600 focus:bg-white"
                      required
                    />
                  </div>

                  {/* Apellidos */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      placeholder="Ejemplo: Mendoza Villao"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-cyan-600 focus:bg-white"
                      required
                    />
                  </div>

                  {/* Celular 1 (Principal WhatsApp) */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1 flex items-center justify-between">
                      <span>Celular 1 (Principal WhatsApp) *</span>
                      <span className="text-[10px] text-cyan-700 font-bold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                        Principal
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={formData.celular1}
                      onChange={(e) => setFormData({ ...formData, celular1: e.target.value })}
                      placeholder="0998765432"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-bold text-zinc-900 outline-none focus:border-cyan-600 focus:bg-white"
                      required
                    />
                  </div>

                  {/* Celulares 2 y 3 al lado */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Celular 2 (Secundario)
                      </label>
                      <input
                        type="tel"
                        value={formData.celular2}
                        onChange={(e) => setFormData({ ...formData, celular2: e.target.value })}
                        placeholder="0987654321"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono text-zinc-900 outline-none focus:border-cyan-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Celular 3 (Adicional)
                      </label>
                      <input
                        type="tel"
                        value={formData.celular3}
                        onChange={(e) => setFormData({ ...formData, celular3: e.target.value })}
                        placeholder="0976543210"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono text-zinc-900 outline-none focus:border-cyan-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Correo y Dirección */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      Correo Electrónico (Opcional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="cliente@correo.com"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-cyan-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      Dirección Domiciliaria
                    </label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      placeholder="Av. 19 de Mayo y San Pablo"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-cyan-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* COLUMNA 2: MÓDULO 2 - DATOS DE LA MOTO & HARDWARE GPS             */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3.5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 font-black text-xs flex items-center justify-center border border-cyan-200">
                        2
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-zinc-900">Motocicleta & GPS</h3>
                        <p className="text-[11px] text-zinc-400">Datos vehiculares & hardware</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                      Módulo 2
                    </span>
                  </div>

                  {/* Placa y Marca/Modelo */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Placa
                      </label>
                      <input
                        type="text"
                        value={formData.placa}
                        onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                        placeholder="PBX-8492 o EN TRÁMITE"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-bold text-zinc-900 outline-none focus:border-cyan-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Marca / Modelo *
                      </label>
                      <input
                        type="text"
                        value={formData.modeloMarca}
                        onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                        placeholder="Ej: Benelli TRK 502X"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-bold text-zinc-900 outline-none focus:border-cyan-600 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Chasis (VIN) */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      Número de Chasis (VIN) *
                    </label>
                    <input
                      type="text"
                      value={formData.chasis}
                      onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                      placeholder="17 dígitos alfanuméricos"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-bold text-zinc-900 outline-none focus:border-cyan-600 focus:bg-white"
                      required
                    />
                  </div>

                  {/* Motor, Color, Año, Km */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Número de Motor
                      </label>
                      <input
                        type="text"
                        value={formData.numeroMotor}
                        onChange={(e) => setFormData({ ...formData, numeroMotor: e.target.value.toUpperCase() })}
                        placeholder="Ej: BJ265MN-1"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono text-zinc-800 outline-none focus:border-cyan-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="Ej: Gris / Rojo"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-800 outline-none focus:border-cyan-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Año
                      </label>
                      <input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-800 outline-none focus:border-cyan-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Kilometraje
                      </label>
                      <input
                        type="number"
                        value={formData.kilometraje}
                        onChange={(e) => setFormData({ ...formData, kilometraje: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-800 outline-none focus:border-cyan-600"
                      />
                    </div>
                  </div>

                  {/* Series de Hardware GPS & SIM (sin contenedor externo) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Serie de GPS (IMEI) *
                      </label>
                      <input
                        type="text"
                        value={formData.serieGps}
                        onChange={(e) => setFormData({ ...formData, serieGps: e.target.value.trim() })}
                        placeholder="Ej: 869402058491823"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-cyan-600 focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Serie de Chip (SIM) *
                      </label>
                      <input
                        type="text"
                        value={formData.serieChip}
                        onChange={(e) => setFormData({ ...formData, serieChip: e.target.value.trim() })}
                        placeholder="Ej: 8959302194820194820"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-cyan-600 focus:bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* COLUMNA 3: MÓDULO 3 - VIGENCIA, TÉCNICO & COBRO                   */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3.5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 font-black text-xs flex items-center justify-center border border-cyan-200">
                        3
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-zinc-900">Vigencia, Técnico & Cobro</h3>
                        <p className="text-[11px] text-zinc-400">Fechas, técnico y contabilidad</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Módulo 3
                    </span>
                  </div>

                  {/* FECHA DE INICIO Y FECHA DE VENCIMIENTO AL LADO */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Fecha Inicio *</span>
                      </label>
                      <input
                        type="date"
                        value={formData.fechaInicio}
                        onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-cyan-600 focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>Fecha Vence *</span>
                      </label>
                      <input
                        type="date"
                        value={formData.fechaVencimiento}
                        onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-cyan-600 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* TÉCNICO ENCARGADO (FILTRADO POR SEDE) */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-blue-600" />
                        <span>Técnico Encargado</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium truncate max-w-[50%]">
                        Sede: {formData.sede || 'Matriz'}
                      </span>
                    </label>
                    <select
                      value={formData.tecnicoResponsable}
                      onChange={(e) => setFormData({ ...formData, tecnicoResponsable: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-800 outline-none focus:border-cyan-600 focus:bg-white cursor-pointer"
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
                        <option value={formData.tecnicoResponsable}>{formData.tecnicoResponsable} (Asignado previamente)</option>
                      )}
                    </select>
                  </div>

                  {/* CONTABILIDAD MATRIZ (SIN BLOQUE EXTERNO) & MÉTODO DE PAGO ALADO */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Valor del GPS ($) *
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
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-cyan-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold uppercase text-zinc-700">
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
                          className="text-[10px] text-cyan-700 hover:text-cyan-800 font-bold underline cursor-pointer"
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
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-cyan-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Saldo Pendiente alado */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Saldo Pendiente ($)
                      </label>
                      <div
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center justify-between ${
                          formData.valorServicio - formData.montoPagado > 0.01
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        }`}
                      >
                        <span>
                          ${Math.max(0, formData.valorServicio - formData.montoPagado).toFixed(2)}
                        </span>
                        <span className={`text-[10px] font-sans font-bold px-1.5 py-0.5 rounded ${
                          formData.valorServicio - formData.montoPagado > 0.01
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-emerald-200 text-emerald-900'
                        }`}>
                          {formData.valorServicio - formData.montoPagado > 0.01 ? 'Pendiente' : 'Pagado'}
                        </span>
                      </div>
                    </div>

                    {/* Método de pago alado con solo 2 opciones: Efectivo o Transferencia */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Método de Pago *
                      </label>
                      <select
                        value={formData.metodoPago}
                        onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value as 'Efectivo' | 'Transferencia' })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-800 outline-none focus:border-cyan-600 focus:bg-white cursor-pointer"
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                      </select>
                    </div>
                  </div>

                  {/* Subida de Imagen si es Transferencia */}
                  {formData.metodoPago === 'Transferencia' && (
                    <div className="space-y-1.5 animate-fade-in pt-1 border-t border-zinc-200/80">
                      <label className="block text-[11px] font-black uppercase text-emerald-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-emerald-700" />
                          Comprobante de Transferencia Bancaria
                        </span>
                        {formData.evidenciaTransferencia && (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                            ✓ Comprobante cargado
                          </span>
                        )}
                      </label>

                      {formData.evidenciaTransferencia && isValidMediaUrl(formData.evidenciaTransferencia) ? (
                        <div className="relative rounded-xl border border-emerald-300 bg-emerald-50/30 p-2.5 flex items-center gap-3 shadow-xs">
                          <a
                            href={formData.evidenciaTransferencia}
                            target="_blank"
                            rel="noreferrer"
                            className="w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 shrink-0 block group"
                            title="Clic para ver comprobante en tamaño completo"
                          >
                            <img
                              src={formData.evidenciaTransferencia}
                              alt="Comprobante de transferencia"
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                          </a>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-zinc-900 truncate">Comprobante registrado</p>
                            <p className="text-[10px] text-zinc-500">Clic en la foto para abrir en tamaño completo</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, evidenciaTransferencia: '' }))}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                            title="Eliminar comprobante"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/50 rounded-xl cursor-pointer transition-all">
                          <Camera className="w-5 h-5 text-emerald-600 mb-1" />
                          <span className="text-xs font-bold text-emerald-900">Subir foto o captura del comprobante</span>
                          <span className="text-[10px] text-zinc-500">JPG, PNG o captura de transferencia</span>
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

                  {/* Observaciones */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      Observaciones / Notas
                    </label>
                    <textarea
                      rows={2}
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      placeholder="Ej: Incluye 1 año de plataforma satelital"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-800 outline-none focus:border-cyan-600 focus:bg-white resize-none"
                    />
                  </div>
                </div>

                {/* BOTÓN SUBMIT DE GUARDADO */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-6 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isEditing
                        ? 'Guardar Cambios de la Ficha GPS'
                        : 'Guardar y Enviar Solicitud a GPS Servicios'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </form>
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
