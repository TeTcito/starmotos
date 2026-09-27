// src/components/mobile/admin/GarantiasPlusMobile.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  Plus,
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  Building2,
  Bike,
  Wrench,
  FileText,
  Printer,
  Trash2,
  Check,
  Lock,
  ArrowLeft,
  MessageCircle,
  Save,
  Filter,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Clock,
  CreditCard,
  Upload,
  SlidersHorizontal,
  ChevronDown,
  Eye,
  Sparkles,
  Radio,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  GarantiaPlusRecord,
  Technician,
  ServiceActionType,
  Workshop,
  TallerClient,
  AbonoRecord,
} from '../../../types/customer';
import {
  querySriMock,
  getStoredClients,
  saveStoredClients,
  getStoredGarantiasPlusRecords,
  saveStoredGarantiaPlusRecord,
  deleteStoredGarantiaPlusRecord,
  getRegisteredBrands,
  getStoredTechnicians,
  getStoredWorkshops,
  updateClientCedulaCascade,
} from '../../../data/mockMultiRoleData';
import { compressImageBase64 } from '../../../utils/imageCompressor';
import { cleanNumberInput, selectOnFocus } from '../../../utils/numberUtils';
import { getMediaFromIndexedDB, uploadWarrantyMedia, isValidMediaUrl } from '../../../services/mediaStorage';

interface Props {
  records?: GarantiaPlusRecord[];
  onSaveRecord?: (record: GarantiaPlusRecord) => void;
  onDeleteRecord?: (id: string) => void;
  showToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
  workshops?: Workshop[];
  technicians?: Technician[];
  origins?: string[];
  onAddTechnician?: (tech: Omit<Technician, 'id' | 'activeOrdersCount'>) => void;
  onAddOrigin?: (origin: string) => void;
  onNavigateSection?: (section: any) => void;
  defaultAtendidoPor?: string;
  defaultSede?: string;
  defaultSedeId?: string;
  viewMode?: 'list' | 'form';
  onViewModeChange?: (mode: 'list' | 'form') => void;
}

export type GarantiaPlusMobileFormData = {
  id: string;
  numeroTicket: string;
  atendidoPor: string;
  sede: string;
  sedeId: string;
  fechaServicio: string; // Fecha de inicio
  fechaVencimiento: string; // Fecha de vencimiento (reemplaza a la hora)
  nombres: string;
  apellidos: string;
  cedulaRuc: string;
  celular1: string;
  celular2?: string;
  celular3?: string;
  email: string;
  direccion: string;
  origen: string;
  motoPreviaId?: string;
  chasis: string;
  numeroMotor?: string;
  ramv?: string;
  placa: string;
  modeloMarca: string;
  color?: string;
  year?: number | string;
  serviciosRealizados: ServiceActionType[];
  tecnicoResponsable: string;
  tecnicoId: string;
  kilometraje: number | string;
  aceite: 'sin_aceite' | 'con_aceite' | string;
  nivelAceite?: string;
  tipoAceite?: string;
  numeroFactura?: string;
  valorServicio: number | string;
  montoPagado: number | string;
  abono?: number | string;
  saldoPendiente?: number | string;
  esCredito?: boolean;
  mesesCredito?: number | string;
  metodoPago: string;
  observaciones: string;
  proximoMantenimientoKm?: number | string;
  fotos?: string[];
  evidenciaTransferencia?: string;
  comprobantePagoUrl?: string;
  historialAbonos?: AbonoRecord[];
  estado: 'activa' | 'vencida' | 'cancelada';
  createdAt: string;
};

export const GarantiasPlusMobile: React.FC<Props> = ({
  records: propRecords,
  onSaveRecord: propOnSaveRecord,
  onDeleteRecord: propOnDeleteRecord,
  showToast,
  workshops: propWorkshops,
  technicians: propTechnicians,
  origins: propOrigins,
  onAddTechnician: propOnAddTechnician,
  onAddOrigin: propOnAddOrigin,
  onNavigateSection,
  defaultAtendidoPor = 'William Daniel Meza (Gerente)',
  defaultSede = 'StarMotos Matriz La Maná',
  defaultSedeId = 'matriz-la-mana',
  viewMode: externalViewMode,
  onViewModeChange,
}) => {
  const [internalViewMode, setInternalViewMode] = useState<'list' | 'form'>('list');
  const currentViewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;

  const setEffectiveViewMode = (mode: 'list' | 'form') => {
    setInternalViewMode(mode);
    onViewModeChange?.(mode);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const workshops = useMemo(() => {
    if (propWorkshops && propWorkshops.length > 0) return propWorkshops;
    return getStoredWorkshops();
  }, [propWorkshops]);

  const technicians = useMemo(() => {
    if (propTechnicians && propTechnicians.length > 0) return propTechnicians;
    return getStoredTechnicians();
  }, [propTechnicians]);

  const defaultOriginsList = [
    'Almacén Principal La Maná',
    'Almacén Quevedo Central',
    'Almacén Valencia',
    'Almacén El Empalme',
    'Almacén Buena Fe',
  ];
  const [origins, setOrigins] = useState<string[]>(propOrigins || defaultOriginsList);

  useEffect(() => {
    if (propOrigins && propOrigins.length > 0) {
      setOrigins(propOrigins);
    }
  }, [propOrigins]);

  // Registros en tiempo real
  const [storedRecords, setStoredRecords] = useState<GarantiaPlusRecord[]>(() => getStoredGarantiasPlusRecords());

  useEffect(() => {
    const handleUpdate = () => {
      setStoredRecords(getStoredGarantiasPlusRecords());
    };
    window.addEventListener('starmotos_garantias_plus_updated', handleUpdate);
    return () => {
      window.removeEventListener('starmotos_garantias_plus_updated', handleUpdate);
    };
  }, []);

  const effectiveRecords = propRecords !== undefined ? propRecords : storedRecords;

  const onSaveRecord = (record: GarantiaPlusRecord) => {
    saveStoredGarantiaPlusRecord(record);
    propOnSaveRecord?.(record);
    setStoredRecords(getStoredGarantiasPlusRecords());
  };

  const onDeleteRecord = (id: string) => {
    deleteStoredGarantiaPlusRecord(id);
    propOnDeleteRecord?.(id);
    setStoredRecords(getStoredGarantiasPlusRecords());
  };

  const [registeredBrands, setRegisteredBrands] = useState<string[]>(getRegisteredBrands);

  // Búsqueda y Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkshopFilter, setSelectedWorkshopFilter] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'con_saldo' | 'pagados' | 'pdi' | 'engrasado' | 'mantenimiento'>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom'>('all');
  const [sortBy, setSortBy] = useState<
    'recientes' | 'antiguos' | 'hoy' | 'por_semana' | 'por_mes' | 'por_ano' | 'cliente_asc' | 'cliente_desc' | 'modelo_asc' | 'modelo_desc' | 'mayor_valor' | 'mayor_saldo'
  >('recientes');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const RECORDS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPayment, filterDateRange, sortBy, selectedWorkshopFilter]);

  const handleResetFilters = () => {
    setFilterPayment('all');
    setFilterDateRange('all');
    setSortBy('recientes');
  };

  // Detalle de Ficha Técnica
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<GarantiaPlusRecord | null>(null);
  const [detailFormData, setDetailFormData] = useState<GarantiaPlusMobileFormData | null>(null);
  const [detailSuccessToast, setDetailSuccessToast] = useState<string | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'cliente' | 'moto' | 'servicio'>('cliente');

  // Paso para formulario wizard (1: Cliente, 2: Moto, 3: Servicio)
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

  const getLocalDateStr = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getNextYearDateStr = (baseDateStr?: string) => {
    const d = baseDateStr ? new Date(baseDateStr) : new Date();
    d.setFullYear(d.getFullYear() + 1);
    return getLocalDateStr(d);
  };

  const todayStr = getLocalDateStr();
  const nextYearStr = getNextYearDateStr(todayStr);

  const [formData, setFormData] = useState<GarantiaPlusMobileFormData>({
    id: '',
    numeroTicket: '',
    atendidoPor: defaultAtendidoPor,
    sede: defaultSede,
    sedeId: defaultSedeId,
    fechaServicio: todayStr,
    fechaVencimiento: nextYearStr,
    nombres: '',
    apellidos: '',
    cedulaRuc: '',
    celular1: '',
    celular2: '',
    celular3: '',
    email: '',
    direccion: '',
    origen: origins[0] || 'Almacén Principal La Maná',
    motoPreviaId: '',
    chasis: '',
    numeroMotor: '',
    ramv: '',
    placa: '',
    modeloMarca: '',
    color: '',
    year: new Date().getFullYear(),
    serviciosRealizados: ['alistamiento_pdi', 'engrasado', 'mantenimiento'],
    tecnicoResponsable: technicians[0]?.name || '',
    tecnicoId: technicians[0]?.id || '',
    kilometraje: '',
    aceite: 'con_aceite',
    nivelAceite: 'semisintetico',
    tipoAceite: '10W-40 Motul',
    numeroFactura: '',
    valorServicio: '180.00',
    montoPagado: '180.00',
    abono: '180.00',
    saldoPendiente: '0.00',
    esCredito: false,
    mesesCredito: 3,
    metodoPago: 'Efectivo',
    observaciones: 'Paquete Garantía Plus contratado. Mantenimientos y servicios cubiertos al 100%.',
    proximoMantenimientoKm: '',
    fotos: [],
    evidenciaTransferencia: '',
    comprobantePagoUrl: '',
    historialAbonos: [],
    estado: 'activa',
    createdAt: '',
  });

  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [validationAlert, setValidationAlert] = useState<{
    title: string;
    fields: string[];
    stepTarget: 1 | 2 | 3;
  } | null>(null);

  // Modal Flotante de Abono
  const [abonoModalRecord, setAbonoModalRecord] = useState<GarantiaPlusRecord | null>(null);
  const [abonoFormData, setAbonoFormData] = useState<{
    montoAbono: string;
    metodoPago: string;
    evidenciaTransferencia: string;
    numeroFactura: string;
    esSuma: boolean;
  }>({
    montoAbono: '',
    metodoPago: 'Efectivo',
    evidenciaTransferencia: '',
    numeroFactura: '',
    esSuma: true,
  });

  const handleOpenAbonoModal = (record: GarantiaPlusRecord) => {
    setAbonoModalRecord(record);
    const valServ = Number(record.valorServicio) || 0;
    const currentAbono = record.abono !== undefined ? Number(record.abono) : (Number(record.montoPagado) || 0);
    const currentPend = record.saldoPendiente !== undefined ? Number(record.saldoPendiente) : Math.max(0, valServ - currentAbono);
    setAbonoFormData({
      montoAbono: currentPend > 0 ? String(currentPend) : '',
      metodoPago: record.metodoPago || 'Efectivo',
      evidenciaTransferencia: record.evidenciaTransferencia || record.comprobantePagoUrl || '',
      numeroFactura: record.numeroFactura || '',
      esSuma: true,
    });
  };

  const handleSaveAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!abonoModalRecord) return;

    const valServ = Number(abonoModalRecord.valorServicio) || 0;
    const prevPagado = abonoModalRecord.abono !== undefined ? Number(abonoModalRecord.abono) : (Number(abonoModalRecord.montoPagado) || 0);
    const inputAbono = parseFloat(abonoFormData.montoAbono) || 0;

    const nuevoTotalPagado = abonoFormData.esSuma
      ? Math.min(valServ, prevPagado + inputAbono)
      : Math.min(valServ, inputAbono);

    const nuevoSaldo = Math.max(0, valServ - nuevoTotalPagado);
    const isPaidInFull = nuevoSaldo <= 0.01;

    const fechaAbono = new Date().toLocaleDateString('es-EC');
    const horaAbono = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    const abonoEfectivo = abonoFormData.esSuma ? inputAbono : Math.max(0, nuevoTotalPagado - prevPagado);

    const nuevoItemAbono: AbonoRecord = {
      id: `abn-${Date.now()}`,
      fecha: fechaAbono,
      hora: horaAbono,
      monto: abonoEfectivo,
      metodoPago: abonoFormData.metodoPago as any,
      evidenciaTransferencia: abonoFormData.evidenciaTransferencia || undefined,
      numeroFactura: abonoFormData.numeroFactura || undefined,
      saldoRestante: nuevoSaldo,
      registradoPor: defaultAtendidoPor || 'Matriz',
    };

    const updatedHistorial = [...(abonoModalRecord.historialAbonos || []), nuevoItemAbono];
    const nota = `\n[Abono GP ${fechaAbono} ${horaAbono}: +$${abonoEfectivo.toFixed(2)} (${abonoFormData.metodoPago}). Saldo rest.: $${nuevoSaldo.toFixed(2)}]`;
    const updatedObservaciones = ((abonoModalRecord.observaciones || '').trim() + nota).trim();

    const updatedRecord: GarantiaPlusRecord = {
      ...abonoModalRecord,
      abono: nuevoTotalPagado,
      montoPagado: nuevoTotalPagado,
      saldoPendiente: nuevoSaldo,
      metodoPago: abonoFormData.metodoPago,
      esCredito: abonoFormData.metodoPago === 'Crédito' ? true : (!isPaidInFull && Boolean(abonoModalRecord.esCredito)),
      evidenciaTransferencia: abonoFormData.evidenciaTransferencia || abonoModalRecord.evidenciaTransferencia,
      comprobantePagoUrl: abonoFormData.evidenciaTransferencia || abonoModalRecord.comprobantePagoUrl,
      numeroFactura: abonoFormData.numeroFactura || abonoModalRecord.numeroFactura,
      historialAbonos: updatedHistorial,
      observaciones: updatedObservaciones,
    };

    onSaveRecord(updatedRecord);

    if (isPaidInFull) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#fbbf24', '#059669'],
      });
    }

    if (selectedRecordForDetail && selectedRecordForDetail.id === updatedRecord.id) {
      setSelectedRecordForDetail(updatedRecord);
      setDetailFormData(updatedRecord as any);
    }

    setAbonoModalRecord(null);
  };

  const getCleanWhatsappUrl = (phone: string, clientName: string) => {
    const cleanDigits = phone.replace(/\D/g, '');
    let fullNumber = cleanDigits;
    if (fullNumber.startsWith('0')) {
      fullNumber = `593${fullNumber.substring(1)}`;
    }
    const message = encodeURIComponent(
      `Estimado/a ${clientName}, le saludamos de StarMotos Matriz. Le contactamos referente a su póliza de Garantía Plus activa para su motocicleta. ¡Estamos para servirle!`
    );
    return `https://wa.me/${fullNumber}?text=${message}`;
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterPayment !== 'all') count++;
    if (filterDateRange !== 'all' || sortBy !== 'recientes') count++;
    return count;
  }, [filterPayment, filterDateRange, sortBy]);

  // Base de registros filtrada
  const baseRecords = useMemo(() => {
    return effectiveRecords.filter((r) => {
      if (selectedWorkshopFilter !== 'all') {
        const matchesSede =
          r.sedeId === selectedWorkshopFilter ||
          (r.sede || '').toLowerCase().includes(selectedWorkshopFilter.toLowerCase());
        if (!matchesSede) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const fullClient = `${r.nombres} ${r.apellidos}`.toLowerCase();
        const matchesTerm =
          r.cedulaRuc.toLowerCase().includes(term) ||
          fullClient.includes(term) ||
          r.placa.toLowerCase().includes(term) ||
          r.chasis.toLowerCase().includes(term) ||
          r.modeloMarca.toLowerCase().includes(term) ||
          (r.numeroTicket || '').toLowerCase().includes(term);
        if (!matchesTerm) return false;
      }

      return true;
    });
  }, [effectiveRecords, searchTerm, selectedWorkshopFilter]);

  // Métricas financieras
  const statsMetrics = useMemo(() => {
    let totalRecaudado = 0;
    let totalPendiente = 0;
    let totalFacturado = 0;
    let countActivas = 0;
    let countConSaldo = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    baseRecords.forEach((r) => {
      const valor = Number(r.valorServicio) || 0;
      const pagado = r.abono !== undefined ? Number(r.abono) : (Number(r.montoPagado) || 0);
      const pendiente = r.saldoPendiente !== undefined ? Number(r.saldoPendiente) : Math.max(0, valor - pagado);

      totalFacturado += valor;
      totalRecaudado += pagado;
      totalPendiente += pendiente;

      if (pendiente > 0.01) countConSaldo++;

      if (r.fechaVencimiento) {
        const [vy, vm, vd] = r.fechaVencimiento.split('-').map(Number);
        const vDate = new Date(vy, vm - 1, vd);
        vDate.setHours(23, 59, 59, 999);
        if (vDate >= now && r.estado !== 'cancelada') {
          countActivas++;
        }
      }
    });

    return {
      totalRecaudado,
      totalPendiente,
      totalFacturado,
      countActivas,
      countConSaldo,
      totalOperaciones: baseRecords.length,
    };
  }, [baseRecords]);

  // Filtrado final con ordenamiento
  const filteredRecords = useMemo(() => {
    const afterPayment = baseRecords.filter((r) => {
      if (filterPayment !== 'all') {
        const valor = Number(r.valorServicio) || 0;
        const pagado = r.abono !== undefined ? Number(r.abono) : (Number(r.montoPagado) || 0);
        const pendiente = r.saldoPendiente !== undefined ? Number(r.saldoPendiente) : Math.max(0, valor - pagado);

        if (filterPayment === 'con_saldo') {
          if (pendiente <= 0.01) return false;
        } else if (filterPayment === 'pagados') {
          if (valor <= 0 || pendiente > 0.01) return false;
        } else if (filterPayment === 'pdi') {
          if (!r.serviciosRealizados?.includes('alistamiento_pdi')) return false;
        } else if (filterPayment === 'engrasado') {
          if (!r.serviciosRealizados?.includes('engrasado')) return false;
        } else if (filterPayment === 'mantenimiento') {
          if (!r.serviciosRealizados?.includes('mantenimiento')) return false;
        }
      }
      return true;
    });

    return [...afterPayment].sort((a, b) => {
      return (b.createdAt || b.fechaServicio || '').localeCompare(a.createdAt || a.fechaServicio || '');
    });
  }, [baseRecords, filterPayment]);

  const totalPages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * RECORDS_PER_PAGE, currentPage * RECORDS_PER_PAGE);

  const handleConsultar = (cedulaInput?: string) => {
    const cedula = (cedulaInput !== undefined ? cedulaInput : formData.cedulaRuc).trim();
    if (!cedula) return;

    setIsSearching(true);
    setSearchFeedback(null);

    const existingGp = effectiveRecords.find(
      (r) => (r.cedulaRuc || '').trim().toLowerCase() === cedula.toLowerCase()
    );
    if (existingGp) {
      setSearchFeedback(`👑 Ya posee Garantía Plus (Vence: ${existingGp.fechaVencimiento}). Datos precargados.`);
      setFormData((prev) => ({
        ...prev,
        cedulaRuc: existingGp.cedulaRuc,
        nombres: existingGp.nombres,
        apellidos: existingGp.apellidos,
        celular1: existingGp.celular1,
        celular2: existingGp.celular2 || '',
        email: existingGp.email || '',
        direccion: existingGp.direccion || '',
        placa: existingGp.placa || '',
        chasis: existingGp.chasis || '',
        modeloMarca: existingGp.modeloMarca || '',
        color: existingGp.color || '',
      }));
      setIsSearching(false);
      return;
    }

    const storedClients = getStoredClients();
    const foundClient = storedClients.find(
      (c) =>
        (c.idNumber && c.idNumber.trim().toLowerCase() === cedula.toLowerCase()) ||
        (c.motorcycleVin && c.motorcycleVin.trim().toUpperCase() === cedula.toUpperCase()) ||
        (c.motorcyclePlate && c.motorcyclePlate.trim().toUpperCase() === cedula.toUpperCase())
    );
    if (foundClient) {
      setSearchFeedback(`✓ Cliente encontrado: ${foundClient.fullName}`);
      const parts = (foundClient.fullName || '').trim().split(' ');
      let cNombres = '';
      let cApellidos = '';
      if (parts.length >= 4) {
        cApellidos = `${parts[0]} ${parts[1]}`;
        cNombres = parts.slice(2).join(' ');
      } else if (parts.length === 3) {
        cApellidos = `${parts[0]} ${parts[1]}`;
        cNombres = parts[2];
      } else if (parts.length === 2) {
        cApellidos = parts[0];
        cNombres = parts[1];
      } else {
        cNombres = foundClient.fullName;
      }
      setFormData((prev) => ({
        ...prev,
        cedulaRuc: foundClient.idNumber || cedula,
        nombres: cNombres || prev.nombres,
        apellidos: cApellidos || prev.apellidos,
        celular1: foundClient.phone || prev.celular1,
        email: foundClient.email || prev.email,
        direccion: foundClient.address || prev.direccion,
        chasis: foundClient.motorcycleVin || prev.chasis,
        placa: foundClient.motorcyclePlate || prev.placa,
        modeloMarca: foundClient.motorcycleModel || prev.modeloMarca,
        color: foundClient.color || prev.color,
      }));
      setIsSearching(false);
      return;
    }

    const sriResult = querySriMock(cedula);
    if (sriResult) {
      setSearchFeedback(`✓ Verificado SRI: ${sriResult.razonSocial}`);
      const parts = (sriResult.razonSocial || '').trim().split(' ');
      const apellidos = parts.slice(0, Math.min(2, parts.length)).join(' ');
      const nombres = parts.slice(Math.min(2, parts.length)).join(' ') || parts[0];
      setFormData((prev) => ({ ...prev, nombres, apellidos }));
    } else {
      setSearchFeedback('ℹ️ Complete los datos del cliente manualmente.');
    }
    setIsSearching(false);
  };

  const handleStartNewGarantiaPlus = (initialCedula?: string) => {
    const cedula = initialCedula?.trim() || '';
    const nowToday = getLocalDateStr();
    const nowNextYear = getNextYearDateStr(nowToday);

    setFormData({
      id: '',
      numeroTicket: `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      atendidoPor: defaultAtendidoPor,
      sede: defaultSede,
      sedeId: defaultSedeId,
      fechaServicio: nowToday,
      fechaVencimiento: nowNextYear,
      nombres: '',
      apellidos: '',
      cedulaRuc: cedula,
      celular1: '',
      celular2: '',
      celular3: '',
      email: '',
      direccion: '',
      origen: origins[0] || 'Almacén Principal La Maná',
      motoPreviaId: '',
      chasis: '',
      numeroMotor: '',
      ramv: '',
      placa: '',
      modeloMarca: '',
      color: '',
      year: new Date().getFullYear(),
      serviciosRealizados: ['alistamiento_pdi', 'engrasado', 'mantenimiento'],
      tecnicoResponsable: technicians[0]?.name || '',
      tecnicoId: technicians[0]?.id || '',
      kilometraje: '',
      aceite: 'con_aceite',
      nivelAceite: 'semisintetico',
      tipoAceite: '10W-40 Motul',
      numeroFactura: '',
      valorServicio: '180.00',
      montoPagado: '180.00',
      abono: '180.00',
      saldoPendiente: '0.00',
      esCredito: false,
      mesesCredito: 3,
      metodoPago: 'Efectivo',
      observaciones: 'Paquete Garantía Plus contratado.',
      proximoMantenimientoKm: '',
      fotos: [],
      evidenciaTransferencia: '',
      comprobantePagoUrl: '',
      historialAbonos: [],
      estado: 'activa',
      createdAt: '',
    });

    setSearchFeedback(null);
    setValidationAlert(null);
    setMobileStep(1);
    setEffectiveViewMode('form');

    if (cedula && cedula.length >= 10) {
      handleConsultar(cedula);
    }
  };

  const handleOpenRecordDetail = (record: GarantiaPlusRecord) => {
    setSelectedRecordForDetail(record);
    const valServ = Number(record.valorServicio) || 0;
    const pag = record.abono !== undefined ? Number(record.abono) : (Number(record.montoPagado) || 0);
    const pend = record.saldoPendiente !== undefined ? Number(record.saldoPendiente) : Math.max(0, valServ - pag);

    setDetailFormData({
      ...record,
      valorServicio: String(valServ),
      montoPagado: String(pag),
      abono: String(pag),
      saldoPendiente: String(pend),
      kilometraje: record.kilometraje ? String(record.kilometraje) : '',
      proximoMantenimientoKm: record.proximoMantenimientoKm ? String(record.proximoMantenimientoKm) : '',
      year: record.year || new Date().getFullYear(),
    });
    setDetailSuccessToast(null);
    setDetailActiveTab('cliente');
  };

  const handleSaveRecordDetail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!detailFormData) return;

    const oldCedula = (selectedRecordForDetail?.cedulaRuc || '').trim();
    const newCedula = (detailFormData.cedulaRuc || '').trim();

    if (!newCedula) {
      alert('La cédula o RUC es obligatorio.');
      return;
    }

    if (oldCedula && newCedula !== oldCedula) {
      updateClientCedulaCascade(oldCedula, newCedula, {
        fullName: `${detailFormData.nombres} ${detailFormData.apellidos}`.trim(),
        phone: detailFormData.celular1,
        email: detailFormData.email,
        address: detailFormData.direccion,
        motorcycleModel: detailFormData.modeloMarca,
        motorcyclePlate: detailFormData.placa,
        motorcycleVin: detailFormData.chasis,
        motorcycleMileage: Number(detailFormData.kilometraje) || 0,
        workshopName: detailFormData.sede,
        workshopId: detailFormData.sedeId,
      });
    }

    const valServ = Number(detailFormData.valorServicio) || 0;
    const valAbono = detailFormData.abono !== undefined && detailFormData.abono !== ''
      ? Number(detailFormData.abono)
      : (detailFormData.montoPagado !== '' ? Number(detailFormData.montoPagado) : 0);
    const valSaldo = detailFormData.saldoPendiente !== undefined && detailFormData.saldoPendiente !== ''
      ? Number(detailFormData.saldoPendiente)
      : Math.max(0, valServ - valAbono);

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let estadoCalculado: 'activa' | 'vencida' | 'cancelada' = detailFormData.estado || 'activa';
    if (detailFormData.fechaVencimiento) {
      const [vy, vm, vd] = detailFormData.fechaVencimiento.split('-').map(Number);
      const vDate = new Date(vy, vm - 1, vd);
      vDate.setHours(23, 59, 59, 999);
      estadoCalculado = vDate >= now ? 'activa' : 'vencida';
    }

    const securedDetail: GarantiaPlusRecord = {
      ...detailFormData,
      cedulaRuc: newCedula,
      kilometraje: Number(detailFormData.kilometraje) || 0,
      valorServicio: valServ,
      montoPagado: valAbono,
      abono: valAbono,
      saldoPendiente: valSaldo,
      proximoMantenimientoKm: Number(detailFormData.proximoMantenimientoKm) || 0,
      year: detailFormData.year !== undefined && detailFormData.year !== '' ? Number(detailFormData.year) : undefined,
      mesesCredito: Number(detailFormData.mesesCredito) || 3,
      estado: estadoCalculado,
      updatedAt: new Date().toISOString(),
    };

    setSelectedRecordForDetail(securedDetail);
    setDetailFormData({
      ...securedDetail,
      valorServicio: String(valServ),
      montoPagado: String(valAbono),
      abono: String(valAbono),
      saldoPendiente: String(valSaldo),
      kilometraje: String(securedDetail.kilometraje),
      proximoMantenimientoKm: String(securedDetail.proximoMantenimientoKm || ''),
    });

    onSaveRecord(securedDetail);
    setDetailSuccessToast('✓ Ficha técnica actualizada correctamente.');
    setTimeout(() => setDetailSuccessToast(null), 3000);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const missingStep1: string[] = [];
    if (!formData.cedulaRuc.trim()) missingStep1.push('Cédula/RUC');
    if (!formData.nombres.trim()) missingStep1.push('Nombres');
    if (!formData.apellidos.trim()) missingStep1.push('Apellidos');
    if (!formData.celular1.trim()) missingStep1.push('Celular');

    const missingStep2: string[] = [];
    if (!formData.modeloMarca.trim()) missingStep2.push('Modelo y Marca');
    if (!formData.placa.trim() && !formData.chasis.trim()) missingStep2.push('Placa o Chasis (VIN)');

    const missingStep3: string[] = [];
    if (!formData.tecnicoResponsable.trim()) missingStep3.push('Técnico responsable');
    if (!formData.fechaServicio.trim()) missingStep3.push('Fecha de Inicio');
    if (!formData.fechaVencimiento.trim()) missingStep3.push('Fecha de Vencimiento');

    if (missingStep1.length > 0) {
      setValidationAlert({ title: 'Faltan datos en Paso 1: Cliente', fields: missingStep1, stepTarget: 1 });
      setMobileStep(1);
      return;
    }
    if (missingStep2.length > 0) {
      setValidationAlert({ title: 'Faltan datos en Paso 2: Moto', fields: missingStep2, stepTarget: 2 });
      setMobileStep(2);
      return;
    }
    if (missingStep3.length > 0) {
      setValidationAlert({ title: 'Faltan datos en Paso 3: Servicio', fields: missingStep3, stepTarget: 3 });
      setMobileStep(3);
      return;
    }

    setValidationAlert(null);

    const isCred = formData.metodoPago === 'Crédito' || formData.metodoPago === 'Crédito Directo';
    const numVal = Number(formData.valorServicio) || 0;
    const numAbono = formData.abono !== undefined && formData.abono !== ''
      ? Number(formData.abono)
      : (formData.montoPagado !== '' ? Number(formData.montoPagado) : numVal);
    const finalAbono = isCred ? 0 : numAbono;
    const finalSaldo = isCred ? numVal : Math.max(0, numVal - finalAbono);

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const [vy, vm, vd] = formData.fechaVencimiento.split('-').map(Number);
    const vDate = new Date(vy, vm - 1, vd);
    vDate.setHours(23, 59, 59, 999);
    const estadoInicial = vDate >= now ? 'activa' : 'vencida';

    const fullRecord: GarantiaPlusRecord = {
      ...formData,
      id: `gp-${Date.now()}`,
      numeroTicket: formData.numeroTicket || `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      numeroFactura: formData.numeroFactura || `FAC-GP-${Math.floor(100000 + Math.random() * 900000)}`,
      kilometraje: Number(formData.kilometraje) || 0,
      proximoMantenimientoKm: Number(formData.proximoMantenimientoKm) || 0,
      year: formData.year !== undefined && formData.year !== '' ? Number(formData.year) : undefined,
      mesesCredito: Number(formData.mesesCredito) || 3,
      valorServicio: numVal,
      montoPagado: finalAbono,
      abono: finalAbono,
      saldoPendiente: finalSaldo,
      estado: estadoInicial,
      createdAt: new Date().toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' }),
    };

    onSaveRecord(fullRecord);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#fbbf24', '#3b82f6'],
    });

    setEffectiveViewMode('list');
    setSearchTerm('');
    setSearchFeedback(null);
  };

  return (
    <div className="w-full flex-1 flex flex-col p-3 space-y-3 pb-24">
      {/* 1. VISTA: DETALLE DE FICHA TÉCNICA EN MÓVIL */}
      {currentViewMode === 'list' && selectedRecordForDetail && detailFormData && (
        <form onSubmit={handleSaveRecordDetail} className="space-y-3 animate-fade-in">
          {/* Header Superior Móvil */}
          <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRecordForDetail(null);
                  setDetailFormData(null);
                }}
                className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 hover:bg-zinc-200"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-xs font-black text-zinc-900 leading-tight">
                  {detailFormData.nombres} {detailFormData.apellidos}
                </h3>
                <span className="font-mono text-[10px] text-zinc-500">C.I. {detailFormData.cedulaRuc}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700"
                title="Imprimir"
              >
                <Printer className="w-4 h-4" />
              </button>

              {detailFormData.celular1 && (
                <a
                  href={getCleanWhatsappUrl(detailFormData.celular1, `${detailFormData.nombres} ${detailFormData.apellidos}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}

              <button
                type="submit"
                className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white"
                title="Guardar"
              >
                <Save className="w-4 h-4" />
              </button>

              {onDeleteRecord && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar la Garantía Plus de ${detailFormData.nombres} ${detailFormData.apellidos}?`)) {
                      onDeleteRecord(detailFormData.id);
                      setSelectedRecordForDetail(null);
                      setDetailFormData(null);
                    }
                  }}
                  className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {detailSuccessToast && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{detailSuccessToast}</span>
            </div>
          )}

          {/* 3 Pestañas */}
          <div className="flex rounded-xl bg-zinc-100 p-1 gap-1">
            <button
              type="button"
              onClick={() => setDetailActiveTab('cliente')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                detailActiveTab === 'cliente' ? 'bg-amber-500 text-slate-950 shadow-xs font-black' : 'text-zinc-600'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Cliente</span>
            </button>
            <button
              type="button"
              onClick={() => setDetailActiveTab('moto')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                detailActiveTab === 'moto' ? 'bg-amber-500 text-slate-950 shadow-xs font-black' : 'text-zinc-600'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Moto</span>
            </button>
            <button
              type="button"
              onClick={() => setDetailActiveTab('servicio')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                detailActiveTab === 'servicio' ? 'bg-amber-500 text-slate-950 shadow-xs font-black' : 'text-zinc-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Póliza</span>
            </button>
          </div>

          {/* Tab 1: Cliente */}
          {detailActiveTab === 'cliente' && (
            <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Cédula o RUC *</label>
                <input
                  type="text"
                  value={detailFormData.cedulaRuc}
                  onChange={(e) => setDetailFormData({ ...detailFormData, cedulaRuc: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Nombres *</label>
                <input
                  type="text"
                  value={detailFormData.nombres}
                  onChange={(e) => setDetailFormData({ ...detailFormData, nombres: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Apellidos *</label>
                <input
                  type="text"
                  value={detailFormData.apellidos}
                  onChange={(e) => setDetailFormData({ ...detailFormData, apellidos: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Celular Principal *</label>
                <input
                  type="tel"
                  value={detailFormData.celular1}
                  onChange={(e) => setDetailFormData({ ...detailFormData, celular1: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Sede</label>
                <select
                  value={detailFormData.sede}
                  onChange={(e) => setDetailFormData({ ...detailFormData, sede: e.target.value })}
                  className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                >
                  {workshops.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Tab 2: Motocicleta */}
          {detailActiveTab === 'moto' && (
            <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Modelo y Marca *</label>
                <input
                  type="text"
                  value={detailFormData.modeloMarca}
                  onChange={(e) => setDetailFormData({ ...detailFormData, modeloMarca: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Placa</label>
                  <input
                    type="text"
                    value={detailFormData.placa}
                    onChange={(e) => setDetailFormData({ ...detailFormData, placa: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Color</label>
                  <input
                    type="text"
                    value={detailFormData.color || ''}
                    onChange={(e) => setDetailFormData({ ...detailFormData, color: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Chasis (VIN) *</label>
                <input
                  type="text"
                  value={detailFormData.chasis}
                  onChange={(e) => setDetailFormData({ ...detailFormData, chasis: e.target.value.toUpperCase() })}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono uppercase"
                  required
                />
              </div>
            </div>
          )}

          {/* Tab 3: Póliza (DIFERENCIA CLAVE: FECHA DE VENCIMIENTO EN LUGAR DE HORA) */}
          {detailActiveTab === 'servicio' && (
            <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span>Fecha Inicio</span>
                  </label>
                  <input
                    type="date"
                    value={detailFormData.fechaServicio}
                    onChange={(e) => setDetailFormData({ ...detailFormData, fechaServicio: e.target.value })}
                    className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-900 mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-600" />
                    <span>Vencimiento *</span>
                  </label>
                  <input
                    type="date"
                    value={detailFormData.fechaVencimiento}
                    onChange={(e) => setDetailFormData({ ...detailFormData, fechaVencimiento: e.target.value })}
                    className="w-full px-2 py-1.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-950"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Técnico Responsable</label>
                <input
                  type="text"
                  value={detailFormData.tecnicoResponsable}
                  onChange={(e) => setDetailFormData({ ...detailFormData, tecnicoResponsable: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-0.5">Valor Póliza ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={detailFormData.valorServicio}
                    onChange={(e) => {
                      const v = e.target.value;
                      const ab = Number(detailFormData.abono) || 0;
                      setDetailFormData({
                        ...detailFormData,
                        valorServicio: v,
                        saldoPendiente: String(Math.max(0, (Number(v) || 0) - ab)),
                      });
                    }}
                    className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-0.5">Abonado ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={detailFormData.abono}
                    onChange={(e) => {
                      const ab = e.target.value;
                      const tot = Number(detailFormData.valorServicio) || 0;
                      setDetailFormData({
                        ...detailFormData,
                        abono: ab,
                        montoPagado: ab,
                        saldoPendiente: String(Math.max(0, tot - (Number(ab) || 0))),
                      });
                    }}
                    className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-700 mb-0.5">Observaciones</label>
                <textarea
                  rows={2}
                  value={detailFormData.observaciones}
                  onChange={(e) => setDetailFormData({ ...detailFormData, observaciones: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs resize-none"
                />
              </div>
            </div>
          )}
        </form>
      )}

      {/* 2. VISTA: LISTA DE GARANTÍAS PLUS (CARD LIST MÓVIL) */}
      {currentViewMode === 'list' && !selectedRecordForDetail && (
        <div className="space-y-3 animate-fade-in">
          {/* Header Superior Móvil */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-zinc-900 leading-tight">Garantías Plus - Matriz</h2>
                  <p className="text-[11px] text-zinc-500 font-medium">Contratos y beneficios vigentes</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStartNewGarantiaPlus(searchTerm.trim())}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-xs flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nueva GP</span>
              </button>
            </div>

            {/* Buscador Prominente */}
            <div className="relative flex items-center bg-zinc-50 border-2 border-amber-300 rounded-xl px-3 h-11 gap-2">
              <Search className="w-4 h-4 text-amber-600 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Cédula, cliente, placa o chasis..."
                className="w-full bg-transparent text-xs font-semibold outline-none"
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} className="text-zinc-400 p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Accesos rápidos Alistamiento y GPS */}
            {onNavigateSection && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateSection('alistamiento')}
                  className="flex-1 py-1.5 bg-zinc-100 text-zinc-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1"
                >
                  <Wrench className="w-3 h-3 text-blue-600" />
                  <span>Alistamiento</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateSection('gps')}
                  className="flex-1 py-1.5 bg-zinc-100 text-zinc-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1"
                >
                  <Radio className="w-3 h-3 text-blue-600" />
                  <span>GPS Matriz</span>
                </button>
              </div>
            )}

            {/* 4 Bloques Estadísticos Móviles */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">Cobrado</span>
                <span className="text-base font-black font-mono text-emerald-950">${statsMetrics.totalRecaudado.toFixed(2)}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">Por Cobrar</span>
                <span className="text-base font-black font-mono text-amber-950">${statsMetrics.totalPendiente.toFixed(2)}</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
                <span className="text-[10px] font-bold uppercase text-blue-800 block">Total Facturado</span>
                <span className="text-base font-black font-mono text-blue-950">${statsMetrics.totalFacturado.toFixed(2)}</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5">
                <span className="text-[10px] font-bold uppercase text-purple-800 block">Pólizas</span>
                <span className="text-base font-black text-purple-950">{statsMetrics.countActivas} vigentes</span>
              </div>
            </div>
          </div>

          {/* Lista de Tarjetas de Garantías Plus */}
          <div className="space-y-2.5">
            {paginatedRecords.map((record, idx) => {
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              const [vy, vm, vd] = (record.fechaVencimiento || '').split('-').map(Number);
              const vDate = new Date(vy, vm - 1, vd);
              vDate.setHours(23, 59, 59, 999);
              const diffTime = vDate.getTime() - now.getTime();
              const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const isVigente = daysRemaining >= 0;

              return (
                <div
                  key={record.id || idx}
                  onClick={() => handleOpenRecordDetail(record)}
                  className={`bg-white border rounded-2xl p-3.5 shadow-2xs space-y-2.5 transition-all cursor-pointer ${
                    isVigente ? 'border-amber-300 hover:border-amber-400' : 'border-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-zinc-900 leading-tight">
                        {record.nombres} {record.apellidos}
                      </h4>
                      <span className="text-[10px] font-mono text-zinc-500">C.I. {record.cedulaRuc}</span>
                    </div>

                    {isVigente ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                        👑 VIGENTE ({daysRemaining} d)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                        VENCIDA
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-600 bg-zinc-50 p-2 rounded-xl">
                    <span className="font-bold text-zinc-800 truncate">{record.modeloMarca}</span>
                    <span className="font-mono text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {record.placa || 'S/P'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>
                      Vence: <strong className="font-mono text-zinc-800">{record.fechaVencimiento}</strong>
                    </span>
                    <span className="font-mono font-bold text-zinc-800">
                      ${Number(record.valorServicio).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAbonoModal(record);
                      }}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200"
                    >
                      Abonar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRecordDetail(record);
                      }}
                      className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold"
                    >
                      Ver Ficha
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. VISTA: FORMULARIO NUEVA GARANTÍA PLUS WIZARD MÓVIL (3 PASOS) */}
      {currentViewMode === 'form' && (
        <form onSubmit={handleFinalSubmit} className="space-y-3 animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-amber-950">👑 Nueva Garantía Plus</h3>
              <p className="text-[10px] text-zinc-500">Paso {mobileStep} de 3</p>
            </div>
            <button
              type="button"
              onClick={() => setEffectiveViewMode('list')}
              className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-bold"
            >
              Cancelar
            </button>
          </div>

          {validationAlert && (
            <div className="bg-red-50 border border-red-300 p-2.5 rounded-xl text-xs text-red-800 font-semibold">
              {validationAlert.title}
            </div>
          )}

          {/* Indicador de 3 pasos */}
          <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-bold">
            <div className={`p-1.5 rounded-lg ${mobileStep === 1 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-zinc-100 text-zinc-600'}`}>
              1. Cliente
            </div>
            <div className={`p-1.5 rounded-lg ${mobileStep === 2 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-zinc-100 text-zinc-600'}`}>
              2. Moto
            </div>
            <div className={`p-1.5 rounded-lg ${mobileStep === 3 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-zinc-100 text-zinc-600'}`}>
              3. Póliza
            </div>
          </div>

          {/* PASO 1 */}
          {mobileStep === 1 && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 space-y-1.5">
                <label className="block text-[11px] font-bold text-blue-900">Cédula o RUC *</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={formData.cedulaRuc}
                    onChange={(e) => setFormData({ ...formData, cedulaRuc: e.target.value })}
                    placeholder="Ej: 1204567890"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleConsultar()}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                  >
                    Buscar
                  </button>
                </div>
                {searchFeedback && <p className="text-[10px] font-medium text-emerald-800">{searchFeedback}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Nombres *</label>
                <input
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  placeholder="Juan Carlos"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Apellidos *</label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  placeholder="Mendoza Zambrano"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Celular Principal *</label>
                <input
                  type="tel"
                  value={formData.celular1}
                  onChange={(e) => setFormData({ ...formData, celular1: e.target.value })}
                  placeholder="0987654321"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setMobileStep(2)}
                  className="w-full py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1"
                >
                  <span>Siguiente: Datos de la Moto</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {mobileStep === 2 && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Modelo y Marca *</label>
                <input
                  type="text"
                  value={formData.modeloMarca}
                  onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                  placeholder="Ej: Pulsar NS 200"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Placa</label>
                  <input
                    type="text"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                    placeholder="AB123C"
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Color</label>
                  <input
                    type="text"
                    value={formData.color || ''}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Negro"
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Serie o Chasis (VIN) *</label>
                <input
                  type="text"
                  value={formData.chasis}
                  onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                  placeholder="3SCBP..."
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono uppercase"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setMobileStep(1)}
                  className="flex-1 py-2 bg-zinc-100 text-zinc-700 font-bold rounded-xl text-xs"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStep(3)}
                  className="flex-1 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3 (FECHA DE VENCIMIENTO REEMPLAZANDO A LA HORA) */}
          {mobileStep === 3 && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-0.5">Fecha Inicio</label>
                  <input
                    type="date"
                    value={formData.fechaServicio}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        fechaServicio: val,
                        fechaVencimiento: getNextYearDateStr(val),
                      });
                    }}
                    className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Vencimiento (+1 año)</label>
                  <input
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                    className="w-full px-2 py-1.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-950"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Técnico Responsable *</label>
                <select
                  value={formData.tecnicoResponsable}
                  onChange={(e) => {
                    const name = e.target.value;
                    const t = technicians.find((tech) => tech.name === name);
                    setFormData({
                      ...formData,
                      tecnicoResponsable: name,
                      tecnicoId: t?.id || '',
                    });
                  }}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
                  required
                >
                  <option value="">Seleccione técnico...</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-0.5">Valor Póliza ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valorServicio}
                    onChange={(e) => {
                      const v = e.target.value;
                      const ab = Number(formData.abono) || 0;
                      setFormData({
                        ...formData,
                        valorServicio: v,
                        saldoPendiente: String(Math.max(0, (Number(v) || 0) - ab)),
                      });
                    }}
                    className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-0.5">Método de Pago</label>
                  <select
                    value={formData.metodoPago}
                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                    className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Crédito">Crédito</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setMobileStep(2)}
                  className="flex-1 py-2 bg-zinc-100 text-zinc-700 font-bold rounded-xl text-xs"
                >
                  Anterior
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Póliza</span>
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* 4. MODAL FLOTANTE DE ABONO */}
      {abonoModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3 border border-zinc-200 animate-slide-in">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-xs font-black text-zinc-900">Registrar Abono</h3>
              <button onClick={() => setAbonoModalRecord(null)} className="text-zinc-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAbono} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-1">Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={abonoFormData.montoAbono}
                  onChange={(e) => setAbonoFormData({ ...abonoFormData, montoAbono: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-bold font-mono outline-none"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-1">Método</label>
                <select
                  value={abonoFormData.metodoPago}
                  onChange={(e) => setAbonoFormData({ ...abonoFormData, metodoPago: e.target.value })}
                  className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Crédito">Crédito</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAbonoModalRecord(null)}
                  className="flex-1 py-2 border border-zinc-300 rounded-xl font-bold text-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-xs"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
