// src/components/desktop/admin/GarantiasPlusDesktop.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  Plus,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  Building2,
  Bike,
  Wrench,
  Eye,
  FileText,
  Printer,
  Trash2,
  Check,
  Upload,
  Lock,
  MessageCircle,
  Save,
  DollarSign,
  TrendingUp,
  Clock,
  CreditCard,
  Filter,
  ChevronDown,
  SlidersHorizontal,
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

export type GarantiaPlusFormData = {
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

export const GarantiasPlusDesktop: React.FC<Props> = ({
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
  // Manejo de modo de visualización (controlado externamente o interno)
  const [internalViewMode, setInternalViewMode] = useState<'list' | 'form'>('list');
  const currentViewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;

  const setEffectiveViewMode = (mode: 'list' | 'form') => {
    setInternalViewMode(mode);
    onViewModeChange?.(mode);
  };

  // Referencia para selector de archivos
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Catálogos auxiliares con respaldo de almacenamiento local
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

  // Registros en tiempo real sincronizados con localStorage
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

  // Marcas registradas
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

  // Registro seleccionado para ver detalle en formulario completo (Ficha de Garantía Plus)
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<GarantiaPlusRecord | null>(null);
  const [detailFormData, setDetailFormData] = useState<GarantiaPlusFormData | null>(null);
  const [detailSuccessToast, setDetailSuccessToast] = useState<string | null>(null);

  // Helper para fechas
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

  // Formulario de Nuevo Registro
  const [formData, setFormData] = useState<GarantiaPlusFormData>({
    id: '',
    numeroTicket: '',
    atendidoPor: defaultAtendidoPor,
    sede: defaultSede,
    sedeId: defaultSedeId,
    fechaServicio: todayStr, // Fecha de inicio
    fechaVencimiento: nextYearStr, // Fecha de vencimiento (reemplaza a la hora)
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
    observaciones: 'Paquete Garantía Plus contratado. Los mantenimientos preventivos y engrasados quedan cubiertos al 100% durante el periodo de vigencia.',
    proximoMantenimientoKm: '',
    fotos: [],
    evidenciaTransferencia: '',
    comprobantePagoUrl: '',
    historialAbonos: [],
    estado: 'activa',
    createdAt: '',
  });

  const [customOilTypes, setCustomOilTypes] = useState<string[]>([]);
  const [showCustomOilInput, setShowCustomOilInput] = useState(false);
  const [newCustomOil, setNewCustomOil] = useState('');

  const handleAddCustomOil = () => {
    if (newCustomOil.trim() && !customOilTypes.includes(newCustomOil.trim())) {
      setCustomOilTypes([...customOilTypes, newCustomOil.trim()]);
      setNewCustomOil('');
      setShowCustomOilInput(false);
    }
  };

  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [validationAlert, setValidationAlert] = useState<{
    title: string;
    fields: string[];
    stepTarget: 1 | 2 | 3;
  } | null>(null);

  // Modal Flotante de Abono & Evidencias
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
    const nota = `\n[Abono Garantía Plus ${fechaAbono} ${horaAbono}: +$${abonoEfectivo.toFixed(2)} (${abonoFormData.metodoPago}). Saldo rest.: $${nuevoSaldo.toFixed(2)}]`;
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

  // Modales rápidos de Técnico y Origen
  const [showAddTechModal, setShowAddTechModal] = useState(false);
  const [newTechData, setNewTechData] = useState({
    name: '',
    specialty: 'Mecánica Rápida & Garantías',
    phone: '',
    workshopId: defaultSedeId,
  });

  const [showAddOriginModal, setShowAddOriginModal] = useState(false);
  const [newOriginInput, setNewOriginInput] = useState('');

  const handleSaveNewTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechData.name.trim()) return;

    if (propOnAddTechnician) {
      propOnAddTechnician({
        name: newTechData.name.toUpperCase(),
        specialty: newTechData.specialty,
        phone: newTechData.phone || '0990000000',
        workshopId: newTechData.workshopId || defaultSedeId,
        workshopName: workshops.find((w) => w.id === newTechData.workshopId)?.name || defaultSede,
        status: 'activo',
      });
    }

    setFormData((prev) => ({
      ...prev,
      tecnicoResponsable: newTechData.name.toUpperCase(),
    }));

    setShowAddTechModal(false);
    setNewTechData({
      name: '',
      specialty: 'Mecánica Rápida & Garantías',
      phone: '',
      workshopId: defaultSedeId,
    });
  };

  const handleSaveNewOrigin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOriginInput.trim()) return;
    const clean = newOriginInput.trim();
    if (!origins.includes(clean)) {
      setOrigins((prev) => [...prev, clean]);
    }
    if (propOnAddOrigin) {
      propOnAddOrigin(clean);
    }
    setFormData((prev) => ({
      ...prev,
      origen: clean,
    }));
    setShowAddOriginModal(false);
    setNewOriginInput('');
  };

  const getCleanWhatsappUrl = (phone: string, clientName: string) => {
    const cleanDigits = phone.replace(/\D/g, '');
    let fullNumber = cleanDigits;
    if (fullNumber.startsWith('0')) {
      fullNumber = `593${fullNumber.substring(1)}`;
    }
    const message = encodeURIComponent(
      `Estimado/a ${clientName}, le saludamos de StarMotos Matriz. Le contactamos referente a su póliza de Garantía Plus activa para su motocicleta. Recuerde que sus mantenimientos periódicos y revisiones técnicas están cubiertos al 100%. ¡Estamos para servirle!`
    );
    return `https://wa.me/${fullNumber}?text=${message}`;
  };

  // Cantidad de filtros activos
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterPayment !== 'all') count++;
    if (filterDateRange !== 'all' || sortBy !== 'recientes') count++;
    return count;
  }, [filterPayment, filterDateRange, sortBy]);

  // Base de registros filtrada por Sede, término y fechas
  const baseRecords = useMemo(() => {
    return effectiveRecords.filter((r) => {
      // 1. Sede
      if (selectedWorkshopFilter !== 'all') {
        const matchesSede =
          r.sedeId === selectedWorkshopFilter ||
          (r.sede || '').toLowerCase().includes(selectedWorkshopFilter.toLowerCase());
        if (!matchesSede) return false;
      }

      // 2. Búsqueda
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const fullClient = `${r.nombres} ${r.apellidos}`.toLowerCase();
        const matchesTerm =
          r.cedulaRuc.toLowerCase().includes(term) ||
          fullClient.includes(term) ||
          r.placa.toLowerCase().includes(term) ||
          r.chasis.toLowerCase().includes(term) ||
          r.modeloMarca.toLowerCase().includes(term) ||
          (r.numeroTicket || '').toLowerCase().includes(term) ||
          r.sede.toLowerCase().includes(term) ||
          r.origen.toLowerCase().includes(term) ||
          r.tecnicoResponsable.toLowerCase().includes(term);
        if (!matchesTerm) return false;
      }

      // 3. Fechas
      if (filterDateRange !== 'all') {
        const dateStr = r.fechaServicio || r.createdAt;
        if (!dateStr) return false;
        const now = new Date();
        const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
        if (!y || !m || !d) return false;

        if (filterDateRange === 'today') {
          if (y !== now.getFullYear() || m !== now.getMonth() + 1 || d !== now.getDate()) return false;
        } else if (filterDateRange === 'this_week') {
          const dayOfWeek = now.getDay();
          const diffToMonday = (dayOfWeek + 6) % 7;
          const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0);
          const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59);
          const recDate = new Date(y, m - 1, d);
          if (recDate < monday || recDate > sunday) return false;
        } else if (filterDateRange === 'this_month') {
          if (y !== now.getFullYear() || m !== now.getMonth() + 1) return false;
        } else if (filterDateRange === 'this_year') {
          if (y !== now.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [effectiveRecords, searchTerm, selectedWorkshopFilter, filterDateRange]);

  // Métricas financieras y operativas globales
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

      // Vigencia
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
      if (sortBy === 'recientes' || sortBy === 'hoy' || sortBy === 'por_semana' || sortBy === 'por_mes' || sortBy === 'por_ano') {
        return (b.createdAt || b.fechaServicio || '').localeCompare(a.createdAt || a.fechaServicio || '');
      }
      if (sortBy === 'antiguos') {
        return (a.createdAt || a.fechaServicio || '').localeCompare(b.createdAt || b.fechaServicio || '');
      }
      if (sortBy === 'cliente_asc') {
        const nameA = `${a.nombres} ${a.apellidos}`.trim().toLowerCase();
        const nameB = `${b.nombres} ${b.apellidos}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'cliente_desc') {
        const nameA = `${a.nombres} ${a.apellidos}`.trim().toLowerCase();
        const nameB = `${b.nombres} ${b.apellidos}`.trim().toLowerCase();
        return nameB.localeCompare(nameA);
      }
      if (sortBy === 'modelo_asc') {
        return (a.modeloMarca || '').localeCompare(b.modeloMarca || '');
      }
      if (sortBy === 'modelo_desc') {
        return (b.modeloMarca || '').localeCompare(a.modeloMarca || '');
      }
      if (sortBy === 'mayor_valor') {
        return (Number(b.valorServicio) || 0) - (Number(a.valorServicio) || 0);
      }
      if (sortBy === 'mayor_saldo') {
        const saldoA = a.saldoPendiente !== undefined ? Number(a.saldoPendiente) : Math.max(0, (Number(a.valorServicio) || 0) - (Number(a.abono ?? a.montoPagado) || 0));
        const saldoB = b.saldoPendiente !== undefined ? Number(b.saldoPendiente) : Math.max(0, (Number(b.valorServicio) || 0) - (Number(b.abono ?? b.montoPagado) || 0));
        return saldoB - saldoA;
      }
      return 0;
    });
  }, [baseRecords, filterPayment, sortBy]);

  // Paginación
  const totalPages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * RECORDS_PER_PAGE, currentPage * RECORDS_PER_PAGE);

  // Helper para consultar SRI / clientes previos
  const handleConsultar = (cedulaInput?: string) => {
    const cedula = (cedulaInput !== undefined ? cedulaInput : formData.cedulaRuc).trim();
    if (!cedula) return;

    setIsSearching(true);
    setSearchFeedback(null);

    // 1. Verificar si ya tiene Garantía Plus previa
    const existingGp = effectiveRecords.find(
      (r) => (r.cedulaRuc || '').trim().toLowerCase() === cedula.toLowerCase()
    );
    if (existingGp) {
      setSearchFeedback(
        `👑 El cliente ya posee Garantía Plus registrada (${existingGp.nombres} ${existingGp.apellidos}, Vence: ${existingGp.fechaVencimiento}). Datos precargados.`
      );
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
        kilometraje: existingGp.kilometraje || '',
      }));
      setIsSearching(false);
      return;
    }

    // 2. Buscar en base general de clientes
    const storedClients = getStoredClients();
    const foundClient = storedClients.find(
      (c) =>
        (c.idNumber && c.idNumber.trim().toLowerCase() === cedula.toLowerCase()) ||
        (c.motorcycleVin && c.motorcycleVin.trim().toUpperCase() === cedula.toUpperCase()) ||
        (c.motorcyclePlate && c.motorcyclePlate.trim().toUpperCase() === cedula.toUpperCase())
    );
    if (foundClient) {
      setSearchFeedback(`✓ Cliente registrado encontrado: ${foundClient.fullName}`);
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

    // 3. Consulta SRI Mock
    const sriResult = querySriMock(cedula);
    if (sriResult) {
      setSearchFeedback(`✓ Datos verificados en Registro Oficial / SRI: ${sriResult.razonSocial}`);
      const parts = (sriResult.razonSocial || '').trim().split(' ');
      const apellidos = parts.slice(0, Math.min(2, parts.length)).join(' ');
      const nombres = parts.slice(Math.min(2, parts.length)).join(' ') || parts[0];

      setFormData((prev) => ({
        ...prev,
        nombres: nombres || prev.nombres,
        apellidos: apellidos || prev.apellidos,
        direccion: sriResult.address || prev.direccion,
        email: sriResult.email || prev.email,
        celular1: sriResult.phone || prev.celular1,
      }));
    } else {
      setSearchFeedback('ℹ️ Cédula no registrada previamente. Complete los datos manualmente.');
    }
    setIsSearching(false);
  };

  const handleSaveClientToDatabase = () => {
    const cleanId = formData.cedulaRuc.trim();
    const cleanNombres = formData.nombres.trim();
    const cleanApellidos = formData.apellidos.trim();

    if (!cleanId || !cleanNombres) {
      alert('Por favor ingrese al menos Cédula y Nombres del cliente.');
      return;
    }

    const fullName = `${cleanNombres} ${cleanApellidos}`.trim();
    const currentClients = getStoredClients();
    const existingIndex = currentClients.findIndex(
      (c) => c.idNumber && c.idNumber.trim().toLowerCase() === cleanId.toLowerCase()
    );

    const clientToSave: TallerClient = {
      id: existingIndex >= 0 ? currentClients[existingIndex].id : `cli-${Date.now()}`,
      fullName,
      idNumber: cleanId,
      phone: formData.celular1.trim() || (existingIndex >= 0 ? currentClients[existingIndex].phone : ''),
      email: formData.email.trim() || (existingIndex >= 0 ? currentClients[existingIndex].email : ''),
      address: formData.direccion.trim() || (existingIndex >= 0 ? currentClients[existingIndex].address : ''),
      motorcycleBrand: formData.modeloMarca ? formData.modeloMarca.split(' ')[0] : (existingIndex >= 0 ? currentClients[existingIndex].motorcycleBrand : 'StarMotos'),
      motorcycleModel: formData.modeloMarca.trim() || (existingIndex >= 0 ? currentClients[existingIndex].motorcycleModel : 'Modelo por definir'),
      motorcyclePlate: formData.placa.trim().toUpperCase() || (existingIndex >= 0 ? currentClients[existingIndex].motorcyclePlate : 'S/P'),
      motorcycleVin: formData.chasis.trim().toUpperCase() || (existingIndex >= 0 ? currentClients[existingIndex].motorcycleVin : undefined),
      color: formData.color?.trim() || (existingIndex >= 0 ? currentClients[existingIndex].color : undefined),
      motorcycleMileage: Number(formData.kilometraje) || 0,
      lastVisit: todayStr,
      totalVisits: existingIndex >= 0 ? (currentClients[existingIndex].totalVisits || 1) + 1 : 1,
      workshopId: formData.sedeId || defaultSedeId,
      workshopName: formData.sede || defaultSede,
    };

    let updatedClients: TallerClient[];
    if (existingIndex >= 0) {
      updatedClients = [...currentClients];
      updatedClients[existingIndex] = clientToSave;
    } else {
      updatedClients = [clientToSave, ...currentClients];
    }

    saveStoredClients(updatedClients);
    setSearchFeedback(`✓ Cliente "${fullName}" guardado en la base de datos.`);
  };

  // Iniciar nueva Garantía Plus
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
      fechaServicio: nowToday, // Inicio
      fechaVencimiento: nowNextYear, // Vencimiento (+1 año)
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
      observaciones: 'Paquete Garantía Plus contratado. Los mantenimientos preventivos y engrasados quedan cubiertos al 100% durante el periodo de vigencia.',
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
    setEffectiveViewMode('form');

    if (cedula && cedula.length >= 10) {
      handleConsultar(cedula);
    }
  };

  // Abrir registro existente en detalle de Ficha Técnica
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

    // Resolver evidencias si vienen con idb:
    const evidencia = record.evidenciaTransferencia || record.comprobantePagoUrl || '';
    if (evidencia.startsWith('idb:')) {
      const key = evidencia.replace('idb:', '');
      getMediaFromIndexedDB(key).then((data) => {
        if (data) {
          setDetailFormData((prev) => (prev ? {
            ...prev,
            evidenciaTransferencia: data,
            comprobantePagoUrl: data,
          } : null));
        }
      });
    }
  };

  // Guardar modificaciones del formulario de Ficha Técnica
  const handleSaveRecordDetail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!detailFormData) return;

    const oldCedula = (selectedRecordForDetail?.cedulaRuc || '').trim();
    const newCedula = (detailFormData.cedulaRuc || '').trim();

    if (!newCedula) {
      alert('El número de cédula o RUC es obligatorio.');
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

    // Calcular estado según fechaVencimiento
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
      evidenciaTransferencia: detailFormData.evidenciaTransferencia || '',
      comprobantePagoUrl: detailFormData.evidenciaTransferencia || '',
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
    setDetailSuccessToast('✓ Póliza de Garantía Plus y ficha técnica actualizadas correctamente.');
    setTimeout(() => setDetailSuccessToast(null), 3000);
  };

  // Toggle servicios en formulario
  const toggleServicio = (srv: ServiceActionType) => {
    setFormData((prev) => {
      const current = prev.serviciosRealizados || [];
      if (current.includes(srv)) {
        if (current.length === 1) return prev;
        return { ...prev, serviciosRealizados: current.filter((s) => s !== srv) };
      }
      return { ...prev, serviciosRealizados: [...current, srv] };
    });
  };

  const toggleDetailServicio = (srv: ServiceActionType) => {
    if (!detailFormData) return;
    const current = detailFormData.serviciosRealizados || [];
    let updated: ServiceActionType[];
    if (current.includes(srv)) {
      if (current.length === 1) return;
      updated = current.filter((s) => s !== srv);
    } else {
      updated = [...current, srv];
    }
    setDetailFormData({ ...detailFormData, serviciosRealizados: updated });
  };

  // Manejo de archivos e imágenes
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const compressed = await compressImageBase64(file);
      if (compressed) {
        setFormData((prev) => ({
          ...prev,
          fotos: [...(prev.fotos || []), compressed],
        }));

        uploadWarrantyMedia(compressed, `gp_foto_${Date.now()}`)
          .then((cloudUrl) => {
            if (cloudUrl && (cloudUrl.startsWith('http://') || cloudUrl.startsWith('https://'))) {
              setFormData((p) => {
                const nextFotos = [...(p.fotos || [])];
                const foundIdx = nextFotos.indexOf(compressed);
                if (foundIdx >= 0) {
                  nextFotos[foundIdx] = cloudUrl;
                  return { ...p, fotos: nextFotos };
                }
                return p;
              });
            }
          })
          .catch((err) => console.warn('Subida en background de foto:', err));
      }
    }
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fotos: (prev.fotos || []).filter((_, i) => i !== index),
    }));
  };

  // Envío final del registro de nueva Garantía Plus
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validar Paso 1: Cliente
    const missingStep1: string[] = [];
    if (!formData.cedulaRuc.trim()) missingStep1.push('Cédula/RUC');
    if (!formData.nombres.trim()) missingStep1.push('Nombres');
    if (!formData.apellidos.trim()) missingStep1.push('Apellidos');
    if (!formData.celular1.trim()) missingStep1.push('Celular');

    // 2. Validar Paso 2: Moto
    const missingStep2: string[] = [];
    if (!formData.modeloMarca.trim()) missingStep2.push('Modelo y Marca');
    if (!formData.placa.trim() && !formData.chasis.trim()) missingStep2.push('Placa o Chasis (VIN)');

    // 3. Validar Paso 3: Servicio & Fechas
    const missingStep3: string[] = [];
    if (!formData.tecnicoResponsable.trim()) missingStep3.push('Técnico responsable');
    if (!formData.fechaServicio.trim()) missingStep3.push('Fecha de Inicio');
    if (!formData.fechaVencimiento.trim()) missingStep3.push('Fecha de Vencimiento');
    if (formData.valorServicio === undefined || formData.valorServicio === '' || isNaN(Number(formData.valorServicio))) {
      missingStep3.push('Valor de la Garantía Plus ($)');
    }

    if (missingStep1.length > 0) {
      setValidationAlert({ title: 'Faltan datos en Paso 1: Cliente', fields: missingStep1, stepTarget: 1 });
      return;
    }
    if (missingStep2.length > 0) {
      setValidationAlert({ title: 'Faltan datos en Paso 2: Moto', fields: missingStep2, stepTarget: 2 });
      return;
    }
    if (missingStep3.length > 0) {
      setValidationAlert({ title: 'Faltan datos en Paso 3: Servicio', fields: missingStep3, stepTarget: 3 });
      return;
    }

    setValidationAlert(null);

    const isCred = formData.metodoPago === 'Crédito' || formData.metodoPago === 'Crédito Directo' || Boolean(formData.esCredito);
    const numVal = Number(formData.valorServicio) || 0;
    const numAbono = formData.abono !== undefined && formData.abono !== ''
      ? Number(formData.abono)
      : (formData.montoPagado !== '' ? Number(formData.montoPagado) : numVal);
    const finalAbono = isCred ? 0 : numAbono;
    const finalSaldo = isCred ? numVal : Math.max(0, numVal - finalAbono);

    // Calcular estado según fechaVencimiento
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
      esCredito: isCred,
      valorServicio: numVal,
      montoPagado: finalAbono,
      abono: finalAbono,
      saldoPendiente: finalSaldo,
      estado: estadoInicial,
      createdAt: new Date().toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' }),
    };

    onSaveRecord(fullRecord);

    confetti({
      particleCount: 130,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#fbbf24', '#3b82f6'],
    });

    setEffectiveViewMode('list');
    setSearchTerm('');
    setSearchFeedback(null);
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Input oculto para subir archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,*/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. VISTA: FORMULARIO DE DETALLE DE GARANTÍA PLUS (FICHA TÉCNICA)          */}
      {/* ========================================================================= */}
      {currentViewMode === 'list' && selectedRecordForDetail && detailFormData && (
        <div className="flex-1 min-h-0 w-full overflow-y-auto pr-1 pb-8">
          <form
            onSubmit={handleSaveRecordDetail}
            className="w-full flex flex-col gap-4 animate-fade-in bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-2xs mb-4"
          >
            {/* Cabecera del Formulario de Garantía Plus */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecordForDetail(null);
                    setDetailFormData(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-98 text-zinc-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4 text-zinc-600" />
                  <span>Volver al Libro de Garantías Plus</span>
                </button>
                <div className="h-6 w-px bg-zinc-200 hidden sm:block" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                      Ficha de Garantía Plus: {detailFormData.nombres} {detailFormData.apellidos}
                    </h2>
                    <span className="font-mono text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 font-semibold">
                      C.I./RUC: {detailFormData.cedulaRuc}
                    </span>
                    {(() => {
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      const [vy, vm, vd] = (detailFormData.fechaVencimiento || '').split('-').map(Number);
                      const vDate = new Date(vy, vm - 1, vd);
                      vDate.setHours(23, 59, 59, 999);
                      const diffTime = vDate.getTime() - now.getTime();
                      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const isVigente = days >= 0;

                      return isVigente ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>👑 VIGENTE ({days} DÍAS RESTANTES)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          <span>VENCIDA</span>
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Sede: <strong className="text-zinc-700">{detailFormData.sede}</strong> • Inicio:{' '}
                    <strong className="text-zinc-700">{detailFormData.fechaServicio}</strong> • Vencimiento:{' '}
                    <strong className="text-amber-800 font-mono font-bold">{detailFormData.fechaVencimiento}</strong> • Atendido por:{' '}
                    <strong className="text-zinc-700">{detailFormData.atendidoPor || 'Matriz'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer"
                  title="Imprimir contrato / ficha técnica"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Ficha</span>
                </button>

                {detailFormData.celular1 && (
                  <a
                    href={getCleanWhatsappUrl(detailFormData.celular1, `${detailFormData.nombres} ${detailFormData.apellidos}`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (selectedRecordForDetail) {
                      handleOpenAbonoModal({
                        ...selectedRecordForDetail,
                        ...detailFormData,
                        valorServicio: Number(detailFormData.valorServicio) || 0,
                        montoPagado: Number(detailFormData.montoPagado) || 0,
                        abono: Number(detailFormData.abono) || 0,
                        saldoPendiente: Number(detailFormData.saldoPendiente) || 0,
                        kilometraje: Number(detailFormData.kilometraje) || 0,
                        year: detailFormData.year !== undefined && detailFormData.year !== '' ? Number(detailFormData.year) : undefined,
                        mesesCredito: Number(detailFormData.mesesCredito) || 3,
                        proximoMantenimientoKm: Number(detailFormData.proximoMantenimientoKm) || 0,
                      });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer"
                  title="Registrar abono o pago"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Abonar</span>
                </button>

                {onNavigateSection && (
                  <button
                    type="button"
                    onClick={() => onNavigateSection('alistamiento')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-black text-white rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer"
                    title="Realizar alistamiento o mantenimiento cubierto para este cliente"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Servicio en Alistamiento</span>
                  </button>
                )}

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-98"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>

                {onDeleteRecord && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Está seguro de eliminar permanentemente la Garantía Plus de ${detailFormData.nombres} ${detailFormData.apellidos}?`)) {
                        onDeleteRecord(detailFormData.id);
                        setSelectedRecordForDetail(null);
                        setDetailFormData(null);
                      }
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Toast de Éxito al Actualizar */}
            {detailSuccessToast && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-in shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{detailSuccessToast}</span>
              </div>
            )}

            {/* 3 COLUMNAS EXACTAS DE DETALLE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* COLUMNA 1: DATOS DEL CLIENTE */}
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wider">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>1. Datos del Cliente</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Titular</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-zinc-700">Cédula o RUC *</label>
                    <span className="text-[9px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      Modificable
                    </span>
                  </div>
                  <input
                    type="text"
                    value={detailFormData.cedulaRuc}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 13);
                      setDetailFormData({ ...detailFormData, cedulaRuc: clean });
                    }}
                    placeholder="Ej: 1204567890"
                    maxLength={13}
                    required
                    className="w-full px-3 py-1.5 bg-white border border-blue-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Nombres *</label>
                  <input
                    type="text"
                    value={detailFormData.nombres}
                    onChange={(e) => setDetailFormData({ ...detailFormData, nombres: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-medium text-zinc-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    value={detailFormData.apellidos}
                    onChange={(e) => setDetailFormData({ ...detailFormData, apellidos: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-medium text-zinc-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Teléfono / Celular 1 *</label>
                  <input
                    type="tel"
                    value={detailFormData.celular1}
                    onChange={(e) => setDetailFormData({ ...detailFormData, celular1: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-medium text-zinc-900 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">Sede / Taller</label>
                    <select
                      value={detailFormData.sede}
                      onChange={(e) => setDetailFormData({ ...detailFormData, sede: e.target.value })}
                      className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 outline-none focus:border-blue-600"
                    >
                      {workshops.map((w) => (
                        <option key={w.id} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">Origen / Procedencia</label>
                    <input
                      type="text"
                      value={detailFormData.origen}
                      onChange={(e) => setDetailFormData({ ...detailFormData, origen: e.target.value })}
                      className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* COLUMNA 2: DATOS DE LA MOTOCICLETA */}
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wider">
                    <Bike className="w-4 h-4 text-blue-600" />
                    <span>2. Motocicleta Registrada</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Unidad</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Modelo y Marca *</label>
                  <input
                    type="text"
                    list="registered-brands-datalist"
                    value={detailFormData.modeloMarca}
                    onChange={(e) => setDetailFormData({ ...detailFormData, modeloMarca: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-semibold text-zinc-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Placa Vehicular</label>
                  <input
                    type="text"
                    value={detailFormData.placa}
                    onChange={(e) => setDetailFormData({ ...detailFormData, placa: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-bold text-zinc-900 uppercase outline-none transition-all"
                    placeholder="SIN PLACA"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Color de la Motocicleta</label>
                  <input
                    type="text"
                    value={detailFormData.color || ''}
                    onChange={(e) => setDetailFormData({ ...detailFormData, color: e.target.value })}
                    placeholder="Ej: Negro / Rojo / Azul"
                    className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-semibold text-zinc-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Serie o Chasis (VIN) *</label>
                  <input
                    type="text"
                    value={detailFormData.chasis}
                    onChange={(e) => setDetailFormData({ ...detailFormData, chasis: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-medium text-zinc-900 uppercase outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1 flex items-center justify-between">
                    <span>Kilometraje (km)</span>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {detailFormData.kilometraje !== '' ? `${detailFormData.kilometraje} km` : '0 km'}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={detailFormData.kilometraje}
                    onFocus={selectOnFocus}
                    onChange={(e) => {
                      const km = cleanNumberInput(e.target.value);
                      setDetailFormData({ ...detailFormData, kilometraje: km });
                    }}
                    placeholder="0"
                    className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                  />
                </div>
              </div>

              {/* COLUMNA 3: SERVICIO & COBRO (DONDE ESTABA LA HORA, VA FECHA DE VENCIMIENTO) */}
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wider">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <span>3. Póliza & Cobro</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Vigencia</span>
                </div>

                {/* Servicios Cubiertos Chips */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Servicios Cubiertos por la Póliza:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'alistamiento_pdi', label: 'Alistamiento PDI' },
                      { id: 'engrasado', label: 'Engrasado' },
                      { id: 'mantenimiento', label: 'Mantenimiento' },
                    ].map((srv) => {
                      const isSelected = detailFormData.serviciosRealizados?.includes(srv.id as any);
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => toggleDetailServicio(srv.id as any)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through'
                          }`}
                        >
                          {srv.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Técnico Responsable */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-1">Técnico Responsable</label>
                  <input
                    type="text"
                    value={detailFormData.tecnicoResponsable}
                    onChange={(e) => setDetailFormData({ ...detailFormData, tecnicoResponsable: e.target.value })}
                    className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600"
                  />
                </div>

                {/* DIFERENCIA CLAVE: FECHA DE INICIO Y FECHA DE VENCIMIENTO (EN LUGAR DE LA HORA) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-600" />
                      <span>Fecha de Inicio</span>
                    </label>
                    <input
                      type="date"
                      value={detailFormData.fechaServicio}
                      onChange={(e) => setDetailFormData({ ...detailFormData, fechaServicio: e.target.value })}
                      className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-600" />
                      <span>Fecha de Vencimiento *</span>
                    </label>
                    <input
                      type="date"
                      value={detailFormData.fechaVencimiento}
                      onChange={(e) => setDetailFormData({ ...detailFormData, fechaVencimiento: e.target.value })}
                      required
                      className="w-full px-2 py-1.5 bg-amber-50/70 border border-amber-300 rounded-lg text-xs font-bold text-amber-950 outline-none focus:border-amber-600"
                    />
                  </div>
                </div>

                {/* Aceite y Viscosidad */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 mb-1">Tipo de Aceite</label>
                    <select
                      value={detailFormData.nivelAceite || 'semisintetico'}
                      onChange={(e) => setDetailFormData({ ...detailFormData, nivelAceite: e.target.value })}
                      className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600"
                    >
                      <option value="mineral">Mineral</option>
                      <option value="semisintetico">Semisintético</option>
                      <option value="sintetico">Sintético</option>
                      <option value="full_sintetico">Full Sintético</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 mb-1">Viscosidad / Grado</label>
                    <input
                      type="text"
                      value={detailFormData.tipoAceite || '10W-40 Motul'}
                      onChange={(e) => setDetailFormData({ ...detailFormData, tipoAceite: e.target.value })}
                      className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Factura / Ticket */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 mb-1">Factura Oficial</label>
                    <input
                      type="text"
                      value={detailFormData.numeroFactura || ''}
                      onChange={(e) => setDetailFormData({ ...detailFormData, numeroFactura: e.target.value })}
                      placeholder="001-001-0001"
                      className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-medium outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 mb-1">Póliza / Ticket</label>
                    <input
                      type="text"
                      value={detailFormData.numeroTicket || ''}
                      readOnly
                      className="w-full px-2 py-1.5 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono font-bold text-zinc-600"
                    />
                  </div>
                </div>

                {/* Valores y Cobro */}
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="block text-[9px] font-bold uppercase text-amber-900">Costo Póliza ($)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={detailFormData.valorServicio}
                        onChange={(e) => {
                          const val = e.target.value;
                          const ab = Number(detailFormData.abono) || 0;
                          setDetailFormData({
                            ...detailFormData,
                            valorServicio: val,
                            saldoPendiente: String(Math.max(0, (Number(val) || 0) - ab)),
                          });
                        }}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-bold font-mono outline-none"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold uppercase text-emerald-900">Abonado ($)</span>
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
                        className="w-full px-2 py-1 bg-white border border-emerald-300 rounded text-xs font-bold font-mono text-emerald-700 outline-none"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold uppercase text-zinc-700">Saldo Pendiente</span>
                      <div className={`text-xs font-bold font-mono pt-1 ${Number(detailFormData.saldoPendiente || 0) > 0.01 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        ${(Number(detailFormData.saldoPendiente) || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-1">Observaciones</label>
                  <textarea
                    rows={2}
                    value={detailFormData.observaciones}
                    onChange={(e) => setDetailFormData({ ...detailFormData, observaciones: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium outline-none focus:border-blue-600 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer del Formulario de Detalle */}
            <div className="pt-3 border-t border-zinc-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedRecordForDetail(null);
                  setDetailFormData(null);
                }}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                ← Cancelar / Volver a la Lista
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-98"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VISTA: LIBRO DE GARANTÍAS PLUS (TABLA EXCEL & BLOQUES DE ESTADÍSTICA) */}
      {/* ========================================================================= */}
      {currentViewMode === 'list' && !selectedRecordForDetail && (
        <div className="h-full w-full flex-1 min-h-0 flex flex-col overflow-y-auto xl:overflow-hidden gap-2.5 animate-fade-in">
          {/* Header Superior Destacado */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 shrink-0">
            {/* Fila 1: Título con Icono y Badges de Métricas */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Sparkles className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight leading-tight">
                    Libro de Garantías Plus - Matriz
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Historial de contratos, pólizas activas y clientes con mantenimientos cubiertos sin costo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 rounded-lg whitespace-nowrap shadow-2xs">
                  {effectiveRecords.length} Contratos Totales
                </span>
                <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg whitespace-nowrap shadow-2xs">
                  {statsMetrics.countActivas} Garantías Vigentes
                </span>
                <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-mono whitespace-nowrap shadow-2xs">
                  ${statsMetrics.totalFacturado.toFixed(2)} Facturado
                </span>
              </div>
            </div>

            {/* Fila 2: Barra de Búsqueda LLAMATIVA y GRANDE */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-2.5 border-t border-zinc-100">
              <div className="relative flex-1 flex items-center bg-zinc-50 hover:bg-white focus-within:bg-white border-2 border-amber-300 focus-within:border-amber-600 focus-within:ring-4 focus-within:ring-amber-100 rounded-xl transition-all shadow-xs h-12 sm:h-13 px-4 gap-3">
                <Search className="w-5 h-5 text-amber-600 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (filteredRecords.length === 0 && searchTerm.trim().length >= 8) {
                        handleStartNewGarantiaPlus(searchTerm.trim());
                      } else if (filteredRecords.length > 0) {
                        handleOpenRecordDetail(filteredRecords[0]);
                      }
                    }
                  }}
                  placeholder="Buscar por número de Cédula o RUC (ej. 1204567890), nombre del cliente, placa o chasis..."
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
                        handleStartNewGarantiaPlus(searchTerm.trim());
                      }
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
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
                    ? 'bg-amber-50 border-amber-400 text-amber-800'
                    : 'bg-white border-zinc-300 hover:border-zinc-400 text-zinc-700'
                }`}
                title="Filtros avanzados por pago, fechas y orden"
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Filtro de Sede / Taller */}
              {workshops && workshops.length > 0 && (
                <div className="h-12 sm:h-13 bg-white border border-zinc-300 rounded-xl px-3 flex items-center shrink-0 shadow-2xs">
                  <Building2 className="w-4 h-4 text-amber-600 mr-2 shrink-0" />
                  <select
                    value={selectedWorkshopFilter}
                    onChange={(e) => setSelectedWorkshopFilter(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-bold text-zinc-800 outline-none cursor-pointer"
                  >
                    <option value="all">🏢 Todas las Sedes ({effectiveRecords.length})</option>
                    {workshops.map((w) => {
                      const count = effectiveRecords.filter(
                        (r) => r.sedeId === w.id || (r.sede || '').toLowerCase().includes(w.name.toLowerCase())
                      ).length;
                      return (
                        <option key={w.id} value={w.id}>
                          {w.name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Accesos directos a Alistamiento y GPS */}
              {onNavigateSection && (
                <div className="hidden md:flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onNavigateSection('alistamiento')}
                    className="h-12 sm:h-13 px-4 bg-zinc-800 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 shrink-0"
                    title="Ir a Alistamiento PDI y Servicios"
                  >
                    <Wrench className="w-4 h-4 text-blue-400" />
                    <span>Alistamiento</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateSection('gps')}
                    className="h-12 sm:h-13 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 shrink-0"
                    title="Ir a GPS Matriz"
                  >
                    <Radio className="w-4 h-4 text-blue-400" />
                    <span>GPS Matriz</span>
                  </button>
                </div>
              )}

              {/* Botón "+ Nueva Garantía Plus" Destacado */}
              <button
                type="button"
                onClick={() => handleStartNewGarantiaPlus(searchTerm.trim())}
                className="h-12 sm:h-13 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm sm:text-base rounded-xl shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shrink-0"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>+ Nueva Garantía Plus</span>
              </button>
            </div>

            {/* Panel de Filtros Interactivos Desplegable */}
            {isFilterOpen && (
              <div className="bg-zinc-50/90 border border-amber-200 rounded-2xl p-4 shadow-sm space-y-4 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
                      Filtros de Garantías Plus
                    </span>
                    <span className="text-[11px] text-zinc-500 font-semibold">
                      ({filteredRecords.length} resultado{filteredRecords.length === 1 ? '' : 's'})
                    </span>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Limpiar Filtros</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Servicios Cubiertos */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-zinc-600 tracking-wider">
                      Servicios Cubiertos
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'all', label: 'Todos' },
                        { id: 'pdi', label: 'Alistamiento PDI' },
                        { id: 'engrasado', label: 'Engrasado' },
                        { id: 'mantenimiento', label: 'Mantenimiento' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFilterPayment(item.id as any)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer truncate ${
                            filterPayment === item.id
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs'
                              : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Ordenar Resultados */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-zinc-600 tracking-wider">
                      Ordenar Resultados
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setSortBy(val);
                        if (val === 'hoy') setFilterDateRange('today');
                        else if (val === 'por_semana') setFilterDateRange('this_week');
                        else if (val === 'por_mes') setFilterDateRange('this_month');
                        else if (val === 'por_ano') setFilterDateRange('this_year');
                        else setFilterDateRange('all');
                      }}
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-800 outline-none cursor-pointer focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                    >
                      <option value="recientes">📅 Más recientes primero</option>
                      <option value="antiguos">📅 Más antiguos primero</option>
                      <option value="hoy">📅 Hoy</option>
                      <option value="por_semana">📅 Por semana</option>
                      <option value="por_mes">📅 Por mes</option>
                      <option value="por_ano">📅 Por año</option>
                      <option value="cliente_asc">👤 Cliente (A - Z)</option>
                      <option value="cliente_desc">👤 Cliente (Z - A)</option>
                      <option value="modelo_asc">🏍️ Modelo / Marca (A - Z)</option>
                      <option value="modelo_desc">🏍️ Modelo / Marca (Z - A)</option>
                      <option value="mayor_valor">💰 Mayor valor de contrato</option>
                      <option value="mayor_saldo">⏳ Mayor saldo pendiente</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Chips de Filtros Activos */}
            {!isFilterOpen && activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-zinc-500">Filtros aplicados:</span>
                {filterPayment !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                    <span>
                      {filterPayment === 'con_saldo'
                        ? 'Con Saldo'
                        : filterPayment === 'pagados'
                        ? 'Pagados'
                        : filterPayment === 'pdi'
                        ? 'PDI'
                        : filterPayment === 'engrasado'
                        ? 'Engrasado'
                        : 'Mantenimiento'}
                    </span>
                    <button type="button" onClick={() => setFilterPayment('all')} className="hover:text-amber-950 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {sortBy !== 'recientes' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                    <span>{sortBy}</span>
                    <button type="button" onClick={() => setSortBy('recientes')} className="hover:text-amber-950 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-red-600 hover:underline ml-1 cursor-pointer"
                >
                  Restablecer
                </button>
              </div>
            )}

            {/* Fila 3: Bloques Estadísticos Reactivos (4 Bloques Idénticos a Alistamiento) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
              {/* Bloque 1: Ingresos Cobrados */}
              <button
                type="button"
                onClick={() => setFilterPayment(filterPayment === 'pagados' ? 'all' : 'pagados')}
                className={`text-left rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-[0.98] ${
                  filterPayment === 'pagados'
                    ? 'bg-emerald-100 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-300 scale-[1.01]'
                    : 'bg-emerald-50/70 border border-emerald-200 shadow-2xs hover:bg-emerald-100/70 hover:border-emerald-300'
                }`}
                title="Clic para ver pólizas cobradas"
              >
                <div className="flex items-center justify-between text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider">Ingresos Cobrados</span>
                    {filterPayment === 'pagados' && (
                      <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.2 rounded-full uppercase">
                        Filtrado
                      </span>
                    )}
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-emerald-200/80 flex items-center justify-center text-emerald-800">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-1">
                  <div className="text-lg sm:text-xl font-black font-mono text-emerald-900 leading-tight">
                    ${statsMetrics.totalRecaudado.toFixed(2)}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700">Abonos y cobros liquidados</span>
                </div>
              </button>

              {/* Bloque 2: Pendientes por Cobrar */}
              <button
                type="button"
                onClick={() => setFilterPayment(filterPayment === 'con_saldo' ? 'all' : 'con_saldo')}
                className={`text-left rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-[0.98] ${
                  filterPayment === 'con_saldo'
                    ? 'bg-amber-100 border-2 border-amber-500 shadow-md ring-2 ring-amber-300 scale-[1.01]'
                    : 'bg-amber-50/70 border border-amber-200 shadow-2xs hover:bg-amber-100/70 hover:border-amber-300'
                }`}
                title="Clic para ver pólizas con saldo pendiente"
              >
                <div className="flex items-center justify-between text-amber-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider">Pendiente por Cobrar</span>
                    {filterPayment === 'con_saldo' && (
                      <span className="text-[9px] font-black bg-amber-600 text-white px-1.5 py-0.2 rounded-full uppercase">
                        Filtrado
                      </span>
                    )}
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-amber-200/80 flex items-center justify-center text-amber-800">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-1">
                  <div className="text-lg sm:text-xl font-black font-mono text-amber-900 leading-tight">
                    ${statsMetrics.totalPendiente.toFixed(2)}
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700">
                    {statsMetrics.countConSaldo > 0 ? `${statsMetrics.countConSaldo} cliente(s) con saldo` : 'Al día / Sin deudas'}
                  </span>
                </div>
              </button>

              {/* Bloque 3: Total Facturado */}
              <button
                type="button"
                onClick={() => setFilterPayment('all')}
                className={`text-left rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-[0.98] ${
                  filterPayment === 'all'
                    ? 'bg-blue-50/90 border border-blue-300 shadow-2xs hover:bg-blue-100/70'
                    : 'bg-blue-50/50 border border-blue-200 shadow-2xs opacity-85 hover:opacity-100 hover:bg-blue-100/60'
                }`}
                title="Clic para ver todas las pólizas facturadas"
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
                  <span className="text-[10px] font-semibold text-blue-700">Volumen total (Ver todos)</span>
                </div>
              </button>

              {/* Bloque 4: Operaciones / Pólizas */}
              <button
                type="button"
                onClick={() => setFilterPayment('all')}
                className={`text-left rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-[0.98] ${
                  filterPayment === 'all'
                    ? 'bg-purple-50/90 border border-purple-300 shadow-2xs hover:bg-purple-100/70'
                    : 'bg-purple-50/50 border border-purple-200 shadow-2xs opacity-85 hover:opacity-100 hover:bg-purple-100/60'
                }`}
                title="Clic para ver todas las pólizas"
              >
                <div className="flex items-center justify-between text-purple-800">
                  <span className="text-[10px] font-black uppercase tracking-wider">Pólizas Registradas</span>
                  <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-1">
                  <div className="text-lg sm:text-xl font-black text-purple-900 leading-tight">
                    {statsMetrics.totalOperaciones} <span className="text-xs font-bold text-purple-700">contratos</span>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-700">
                    {statsMetrics.countActivas} activas • {statsMetrics.totalOperaciones - statsMetrics.countActivas} vencidas
                  </span>
                </div>
              </button>
            </div>

            {/* Aviso o Sugerencia reactiva si escribe una cédula no existente */}
            {searchTerm.trim().length >= 8 && filteredRecords.length === 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-3 animate-slide-in">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-900">
                  <UserCheck className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                  <span>
                    No hay contratos previos de Garantía Plus registrados con C.I. <strong>"{searchTerm}"</strong>. ¿Desea crear uno nuevo?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartNewGarantiaPlus(searchTerm.trim())}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shrink-0 shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Garantía Plus con C.I. {searchTerm}</span>
                </button>
              </div>
            )}
          </div>

          {/* Barra de Leyenda de Estados */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1 text-xs shrink-0 select-none">
            <span className="font-semibold text-zinc-500 text-[11px]">
              {filteredRecords.length} contrato{filteredRecords.length === 1 ? '' : 's'} de Garantía Plus
            </span>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <div className="flex items-center gap-1.5" title="Pólizas vigentes con más de 30 días">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs"></span>
                <span className="text-emerald-800">Vigente (Fila Verde)</span>
              </div>
              <div className="flex items-center gap-1.5" title="Pólizas próximas a vencer (menos de 30 días)">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-2xs animate-pulse"></span>
                <span className="text-amber-800">Por Vencer (Fila Amarilla)</span>
              </div>
              <div className="flex items-center gap-1.5" title="Pólizas que ya expiraron">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-2xs"></span>
                <span className="text-rose-800">Vencida</span>
              </div>
            </div>
          </div>

          {/* TABLA EXCEL EXACTA */}
          {filteredRecords.length > 0 ? (
            <div className="flex-1 min-h-0 min-h-[260px] w-full bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden flex flex-col">
              <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden">
                <table className="w-full table-fixed text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-zinc-100 z-10 shadow-2xs">
                    <tr className="text-zinc-700 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-300 divide-x divide-zinc-200 select-none">
                      <th className="w-[3%] px-1 py-2 text-center text-zinc-500 font-mono">#</th>
                      <th className="w-[14%] px-2.5 py-2 truncate">Cliente</th>
                      <th className="w-[10%] px-2 py-2 truncate">Origen</th>
                      <th className="w-[10%] px-2 py-2 truncate">Sede</th>
                      {/* En Alistamiento era solo Fecha, aquí es Vigencia (Inicio -> Vencimiento) */}
                      <th className="w-[12%] px-2 py-2 text-center whitespace-nowrap">Vigencia / Fechas</th>
                      <th className="w-[13%] px-2 py-2 truncate">Motocicleta</th>
                      <th className="w-[11%] px-2 py-2 truncate">Servicios Cubiertos</th>
                      <th className="w-[8.5%] px-2 py-2 truncate">Técnico</th>
                      <th className="w-[7%] px-2 py-2 text-right whitespace-nowrap">Valor</th>
                      <th className="w-[7%] px-2 py-2 truncate">Póliza</th>
                      <th className="w-[10%] px-1.5 py-2 text-center whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-800">
                    {paginatedRecords.map((record, i) => {
                      const idx = (currentPage - 1) * RECORDS_PER_PAGE + i;

                      // Calcular estado de vigencia
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      const [vy, vm, vd] = (record.fechaVencimiento || '').split('-').map(Number);
                      const vDate = new Date(vy, vm - 1, vd);
                      vDate.setHours(23, 59, 59, 999);
                      const diffTime = vDate.getTime() - now.getTime();
                      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const isVigente = daysRemaining > 30;
                      const isPorVencer = daysRemaining >= 0 && daysRemaining <= 30;
                      const isVencida = daysRemaining < 0;

                      let rowBgClass = 'even:bg-zinc-50/40 hover:bg-amber-50/70 active:bg-amber-100/70 text-zinc-800';
                      if (isVigente) {
                        rowBgClass = 'bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-950';
                      } else if (isPorVencer) {
                        rowBgClass = 'bg-amber-50/60 hover:bg-amber-100/70 text-amber-950';
                      } else if (isVencida) {
                        rowBgClass = 'bg-rose-50/40 hover:bg-rose-100/60 text-zinc-700 opacity-90';
                      }

                      return (
                        <tr
                          key={record.id}
                          onClick={() => handleOpenRecordDetail(record)}
                          className={`cursor-pointer transition-colors divide-x divide-zinc-200/70 select-none group ${rowBgClass}`}
                          title={`Haga clic para abrir la ficha de Garantía Plus de ${record.nombres} ${record.apellidos}`}
                        >
                          {/* 1. # */}
                          <td className="px-1 py-2 text-center font-mono text-[11px] bg-transparent">
                            <div className="flex items-center justify-center gap-1">
                              {isVigente && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-2xs" />}
                              {isPorVencer && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse shadow-2xs" />}
                              {isVencida && <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />}
                              <span className={isVigente ? 'text-emerald-700 font-bold' : isPorVencer ? 'text-amber-800 font-bold' : 'text-zinc-400'}>
                                {idx + 1}
                              </span>
                            </div>
                          </td>

                          {/* 2. Cliente */}
                          <td className="px-2.5 py-2 truncate" title={`${record.nombres} ${record.apellidos} (C.I. ${record.cedulaRuc})`}>
                            <div className="flex flex-col truncate">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-bold truncate text-xs text-zinc-900 group-hover:text-amber-600 transition-colors">
                                  {record.nombres} {record.apellidos}
                                </span>
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[9px] font-black border border-amber-300">
                                  👑 GP
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-zinc-500 truncate">
                                C.I. {record.cedulaRuc}
                              </span>
                            </div>
                          </td>

                          {/* 3. Origen */}
                          <td className="px-2 py-2 truncate text-zinc-600 font-medium" title={record.origen}>
                            {record.origen}
                          </td>

                          {/* 4. Sede */}
                          <td className="px-2 py-2 truncate text-zinc-600 font-medium" title={record.sede}>
                            {record.sede}
                          </td>

                          {/* 5. Vigencia / Fechas (DIFERENCIA CLAVE) */}
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center leading-tight">
                              <span className="font-mono text-[11px] text-zinc-700 font-bold">
                                {record.fechaServicio} → <span className="text-amber-900 font-black">{record.fechaVencimiento}</span>
                              </span>
                              {isVigente && (
                                <span className="text-[9px] font-bold text-emerald-700">
                                  Vigente ({daysRemaining} d)
                                </span>
                              )}
                              {isPorVencer && (
                                <span className="text-[9px] font-black text-amber-700 animate-pulse">
                                  ¡Por vencer ({daysRemaining} d)!
                                </span>
                              )}
                              {isVencida && (
                                <span className="text-[9px] font-bold text-rose-600">
                                  Vencida
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Motocicleta */}
                          <td className="px-2 py-2 truncate" title={`${record.modeloMarca} • Placa: ${record.placa} • Chasis: ${record.chasis}`}>
                            <div className="flex flex-col truncate">
                              <span className="font-bold text-zinc-900 truncate">{record.modeloMarca}</span>
                              <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                                <span className="font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                                  {record.placa || 'S/P'}
                                </span>
                                {record.color && <span>• {record.color}</span>}
                              </div>
                            </div>
                          </td>

                          {/* 7. Servicios Cubiertos */}
                          <td className="px-2 py-2 truncate">
                            <div className="flex flex-wrap gap-1">
                              {record.serviciosRealizados?.map((s) => (
                                <span
                                  key={s}
                                  className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 uppercase"
                                >
                                  {s === 'alistamiento_pdi' ? 'PDI' : s}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* 8. Técnico */}
                          <td className="px-2 py-2 truncate text-zinc-600 font-medium" title={record.tecnicoResponsable}>
                            {record.tecnicoResponsable || '—'}
                          </td>

                          {/* 9. Valor */}
                          <td className="px-2 py-2 text-right whitespace-nowrap font-mono">
                            {(() => {
                              const val = Number(record.valorServicio) || 0;
                              const pag = record.abono !== undefined ? Number(record.abono) : (Number(record.montoPagado) || 0);
                              const pend = record.saldoPendiente !== undefined ? Number(record.saldoPendiente) : Math.max(0, val - pag);

                              return (
                                <div className="flex flex-col items-end leading-tight">
                                  <span className="font-black text-zinc-900 text-xs">${val.toFixed(2)}</span>
                                  {pend > 0.01 ? (
                                    <span className="text-[10px] text-rose-600 font-black">Debe: ${pend.toFixed(2)}</span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-700 font-bold">Pagado</span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* 10. Factura / Póliza */}
                          <td className="px-2 py-2 font-mono text-zinc-700 truncate text-[11px]" title={record.numeroTicket || record.numeroFactura}>
                            <span className="truncate block font-bold text-amber-900">{record.numeroTicket || record.numeroFactura || 'GP'}</span>
                          </td>

                          {/* 11. Acciones */}
                          <td className="px-1.5 py-2 text-center whitespace-nowrap">
                            <div className="inline-flex items-center justify-center gap-1">
                              {/* Botón de Dinero / Abono */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAbonoModal(record);
                                }}
                                className="p-1 rounded-lg border text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 transition-all cursor-pointer shadow-2xs"
                                title="Gestionar abonos o pagos"
                              >
                                <DollarSign className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>

                              {/* Ver Ficha */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRecordDetail(record);
                                }}
                                className="px-1.5 py-0.5 text-[10px] font-bold bg-zinc-100 hover:bg-amber-500 hover:text-slate-950 text-zinc-700 rounded transition-colors cursor-pointer inline-flex items-center gap-0.5"
                                title="Ver Ficha de Garantía Plus"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Ficha</span>
                              </button>

                              {/* WhatsApp */}
                              {record.celular1 && (
                                <a
                                  href={getCleanWhatsappUrl(record.celular1, `${record.nombres} ${record.apellidos}`)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-0.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                  title="Contactar por WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {/* Ir a Alistamiento con este cliente */}
                              {onNavigateSection && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateSection('alistamiento');
                                  }}
                                  className="p-0.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                  title="Registrar servicio cubierto en Alistamiento"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Eliminar */}
                              {onDeleteRecord && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`¿Está seguro de eliminar la Garantía Plus de ${record.nombres} ${record.apellidos}?`)) {
                                      onDeleteRecord(record.id);
                                    }
                                  }}
                                  className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Eliminar registro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="sticky bottom-0 bg-zinc-100 border-t-2 border-zinc-300 font-bold text-zinc-800 text-[11px] shadow-xs z-10">
                    <tr className="divide-x divide-zinc-200">
                      <td colSpan={8} className="px-3 py-2 text-right font-mono uppercase tracking-wider text-[11px]">
                        Totales ({filteredRecords.length} pólizas):
                      </td>
                      <td className="px-2 py-2 text-right font-mono whitespace-nowrap">
                        <div className="flex flex-col items-end leading-tight">
                          <span className="text-zinc-900 font-black text-xs">${statsMetrics.totalFacturado.toFixed(2)}</span>
                          <span className="text-[10px] text-emerald-700 font-bold">Cobrado: ${statsMetrics.totalRecaudado.toFixed(2)}</span>
                          {statsMetrics.totalPendiente > 0.01 && (
                            <span className="text-[10px] text-rose-600 font-black">Por cobrar: ${statsMetrics.totalPendiente.toFixed(2)}</span>
                          )}
                        </div>
                      </td>
                      <td colSpan={2} className="px-3 py-2 text-zinc-600 font-normal text-[11px] truncate">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-amber-800">{statsMetrics.countActivas} Pólizas Vigentes</span>
                          </div>
                          {statsMetrics.countConSaldo > 0 ? (
                            <span className="text-[10px] font-bold text-rose-600">
                              ⚠️ {statsMetrics.countConSaldo} cliente(s) con saldo por cobrar
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700">
                              ✓ Al día sin saldos pendientes
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="bg-white border-t border-zinc-200 p-3 flex items-center justify-between shadow-sm z-10 shrink-0">
                  <div className="text-xs font-semibold text-zinc-600">
                    Mostrando {(currentPage - 1) * RECORDS_PER_PAGE + 1}-{Math.min(currentPage * RECORDS_PER_PAGE, filteredRecords.length)} de {filteredRecords.length} registros
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                    >
                      Anterior
                    </button>
                    <div className="flex items-center gap-1 hidden sm:flex px-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                            currentPage === page
                              ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex items-center justify-center p-8 bg-white border border-zinc-200 rounded-xl">
              <div className="text-center space-y-2 max-w-sm">
                <Sparkles className="w-8 h-8 text-amber-300 mx-auto" />
                <h3 className="text-sm font-bold text-zinc-800">
                  No se encontraron contratos de Garantía Plus
                </h3>
                <p className="text-xs text-zinc-500">
                  {searchTerm
                    ? 'Ningún registro coincide con los criterios de búsqueda especificados.'
                    : 'Aún no hay pólizas de Garantía Plus registradas en esta sede. Inicie la primera ahora.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleStartNewGarantiaPlus(searchTerm)}
                  className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg cursor-pointer inline-flex items-center gap-1.5 shadow-2xs font-black"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Registrar Nueva Garantía Plus</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VISTA: FORMULARIO DE REGISTRO NUEVO (3 COLUMNAS SIMÉTRICAS)             */}
      {/* ========================================================================= */}
      {currentViewMode === 'form' && (
        <div className="flex-1 min-h-0 w-full overflow-y-auto pr-1 pb-8">
          <form onSubmit={handleFinalSubmit} className="space-y-4 animate-fade-in">
            {/* ALERTA DE VALIDACIÓN */}
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

            {/* BANNER SUPERIOR: NUEVA GARANTÍA PLUS MATRIZ */}
            <div className="p-4 bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-500/20 border-2 border-amber-400 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                  <Sparkles className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-amber-950">
                    👑 Nuevo Contrato de Garantía Plus - Matriz
                  </h3>
                  <p className="text-xs text-amber-900 font-medium leading-relaxed">
                    Al ingresar a este cliente, todos sus siguientes mantenimientos y engrasados en Alistamiento saldrán automáticamente como <strong>Pagados ($0.00)</strong> sin costo durante su vigencia.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEffectiveViewMode('list')}
                className="px-3.5 py-1.5 bg-white/90 hover:bg-white text-zinc-800 border border-zinc-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
              >
                ← Volver al Libro
              </button>
            </div>

            {/* 3 COLUMNAS SIMÉTRICAS DESKTOP */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-5 items-stretch">
              {/* ----------------------------------------------------------------- */}
              {/* COLUMNA 1: PASO 1 - DATOS DEL CLIENTE                             */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3.5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-black text-xs flex items-center justify-center border border-blue-200">
                        1
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-zinc-900">Datos del Cliente</h3>
                        <p className="text-[11px] text-zinc-400">Verificación y contacto</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Paso 1
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveClientToDatabase}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                        title="Guardar cliente en la base de datos"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar</span>
                      </button>
                    </div>
                  </div>

                  {/* Cédula o RUC con Consulta */}
                  <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-200 space-y-1.5">
                    <label className="block text-xs font-black uppercase text-blue-900">
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
                        className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-xl text-sm font-mono font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleConsultar()}
                        disabled={isSearching || !formData.cedulaRuc.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{isSearching ? 'Consultando...' : 'Consultar'}</span>
                      </button>
                    </div>
                    {searchFeedback && (
                      <p
                        className={`text-xs font-medium leading-tight p-2.5 rounded-xl border ${
                          searchFeedback.startsWith('✓') || searchFeedback.startsWith('👑')
                            ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                            : 'text-amber-800 bg-amber-50 border-amber-200'
                        }`}
                      >
                        {searchFeedback}
                      </p>
                    )}
                  </div>

                  {/* Nombres */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">Nombres *</label>
                    <input
                      type="text"
                      value={formData.nombres}
                      onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                      placeholder="Ejemplo: Juan Carlos"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-blue-600 focus:bg-white"
                      required
                    />
                  </div>

                  {/* Apellidos */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">Apellidos *</label>
                    <input
                      type="text"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      placeholder="Ejemplo: Mendoza Zambrano"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-blue-600 focus:bg-white"
                      required
                    />
                  </div>

                  {/* Celulares */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">Celular Principal *</label>
                      <input
                        type="text"
                        value={formData.celular1}
                        onChange={(e) => setFormData({ ...formData, celular1: e.target.value })}
                        placeholder="Ejemplo: 0987654321"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-medium outline-none focus:border-blue-600 focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">Celular Opcional</label>
                      <input
                        type="text"
                        value={formData.celular2}
                        onChange={(e) => setFormData({ ...formData, celular2: e.target.value })}
                        placeholder="Ejemplo: 0991234567"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-medium outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="usuario@ejemplo.com"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">Dirección Domiciliaria</label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      placeholder="Av. Principal y Secundaria"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  {/* Sede */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">Sede de Emisión *</label>
                    <select
                      value={formData.sedeId || defaultSedeId}
                      onChange={(e) => {
                        const chosenId = e.target.value;
                        const ws = workshops.find((w) => w.id === chosenId);
                        setFormData({
                          ...formData,
                          sedeId: chosenId,
                          sede: ws ? ws.name : formData.sede,
                        });
                      }}
                      className="w-full px-3 py-2 bg-blue-50/70 border border-blue-200 rounded-xl text-sm font-bold text-blue-900 outline-none focus:border-blue-600 focus:bg-white"
                    >
                      {workshops.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Origen */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase text-zinc-700">Origen / Almacén *</label>
                      <button
                        type="button"
                        onClick={() => setShowAddOriginModal(true)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Nuevo Almacén</span>
                      </button>
                    </div>
                    <select
                      value={formData.origen}
                      onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-blue-600 focus:bg-white"
                    >
                      {origins.map((orig) => (
                        <option key={orig} value={orig}>
                          {orig}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* COLUMNA 2: PASO 2 - DATOS DE LA MOTO                             */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3.5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 font-black text-xs flex items-center justify-center border border-red-200">
                        2
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-zinc-900">Datos de la Moto</h3>
                        <p className="text-[11px] text-zinc-400">Identificación técnica del vehículo</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                      Paso 2
                    </span>
                  </div>

                  {/* Modelo y Marca */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">Modelo y Marca *</label>
                    <input
                      type="text"
                      list="registered-brands-datalist"
                      value={formData.modeloMarca}
                      onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                      placeholder="Ejemplo: Thunder 200 / Pulsar NS 200"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-semibold outline-none focus:border-red-600 focus:bg-white"
                      required
                    />
                    <datalist id="registered-brands-datalist">
                      {registeredBrands.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>

                  {/* Placa */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase text-zinc-700">Placa</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, placa: 'EN TRÁMITE' })}
                        className="text-xs text-zinc-500 hover:text-zinc-800 underline cursor-pointer"
                      >
                        En trámite
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.placa}
                      onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                      placeholder="Ejemplo: AB123C o EN TRÁMITE"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-bold uppercase outline-none focus:border-red-600 focus:bg-white"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">Color de la Moto</label>
                    <input
                      type="text"
                      value={formData.color || ''}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="Ejemplo: Negro Mate / Rojo Racing"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-semibold outline-none focus:border-red-600 focus:bg-white"
                    />
                  </div>

                  {/* Serie o Chasis */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">Serie o Chasis (VIN) *</label>
                    <input
                      type="text"
                      value={formData.chasis}
                      onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                      placeholder="Ejemplo: 3SCBP123456789012"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-bold uppercase outline-none focus:border-red-600 focus:bg-white"
                      required
                    />
                  </div>

                  {/* Kilometraje */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5 flex items-center justify-between">
                      <span>Kilometraje de Recepción (Odómetro)</span>
                      <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {formData.kilometraje !== '' ? `${formData.kilometraje} KM` : '0 KM'}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formData.kilometraje}
                        onFocus={selectOnFocus}
                        onChange={(e) => {
                          const km = cleanNumberInput(e.target.value);
                          setFormData((prev) => ({ ...prev, kilometraje: km }));
                        }}
                        placeholder="Ejemplo: 0 km"
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-bold outline-none focus:border-red-600 focus:bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                        KM
                      </span>
                    </div>
                  </div>

                  {/* Resumen de Cobertura */}
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Cobertura Garantía Plus:</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      El chasis y la placa quedarán asociados a la póliza activa. Al llegar a taller, el sistema reconocerá automáticamente la motocicleta para exonerar el pago de mano de obra y servicios cubiertos.
                    </p>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* COLUMNA 3: PASO 3 - SERVICIO, FECHAS & COBRO                      */}
              {/* (LA DIFERENCIA CLAVE: FECHA DE VENCIMIENTO DONDE ESTABA LA HORA) */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3.5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 font-black text-xs flex items-center justify-center border border-emerald-200">
                        3
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-zinc-900">Servicio & Cobro</h3>
                        <p className="text-[11px] text-zinc-400">Vigencia, póliza y facturación</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Paso 3
                    </span>
                  </div>

                  {/* Servicios que cubre la Garantía Plus */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
                      ¿Qué servicios cubre la Garantía Plus? *
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'alistamiento_pdi' as ServiceActionType, label: 'Alistamiento PDI' },
                        { id: 'engrasado' as ServiceActionType, label: 'Engrasado' },
                        { id: 'mantenimiento' as ServiceActionType, label: 'Mantenimiento' },
                      ].map((srv) => {
                        const isSelected = formData.serviciosRealizados.includes(srv.id);
                        return (
                          <button
                            key={srv.id}
                            type="button"
                            onClick={() => toggleServicio(srv.id)}
                            className={`px-2 py-2 rounded-xl text-[11px] font-bold border text-center transition-all cursor-pointer truncate flex flex-col items-center justify-center gap-0.5 ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs font-black'
                                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                            }`}
                          >
                            <span className="truncate">{srv.label}</span>
                            <span className="text-[9px] font-bold text-amber-900">✓ Incluido</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Técnico Responsable */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase text-zinc-700">Técnico Responsable *</label>
                      <button
                        type="button"
                        onClick={() => setShowAddTechModal(true)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Nuevo Técnico</span>
                      </button>
                    </div>
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
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-emerald-600 focus:bg-white"
                      required
                    >
                      <option value="">Seleccione un técnico responsable...</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.workshopName || 'Taller'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* DIFERENCIA CLAVE SOLICITADA POR EL USUARIO:
                      EN EL SERVICIO, DONDE ESTABA LA HORA, VA LA FECHA DE VENCIMIENTO */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Fecha de Inicio *</span>
                      </label>
                      <input
                        type="date"
                        value={formData.fechaServicio || todayStr}
                        onChange={(e) => {
                          const newInicio = e.target.value;
                          setFormData({
                            ...formData,
                            fechaServicio: newInicio,
                            fechaVencimiento: getNextYearDateStr(newInicio),
                          });
                        }}
                        required
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-semibold text-zinc-900 outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-amber-900 mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>Fecha de Vencimiento *</span>
                      </label>
                      <input
                        type="date"
                        value={formData.fechaVencimiento || nextYearStr}
                        onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-amber-50/70 border border-amber-300 rounded-xl text-sm font-black text-amber-950 outline-none focus:border-amber-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Control de Aceite */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase text-zinc-700">Control de Aceite</label>
                      <button
                        type="button"
                        onClick={() => setShowCustomOilInput(!showCustomOilInput)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Aceite</span>
                      </button>
                    </div>

                    {showCustomOilInput && (
                      <div className="flex gap-2 mb-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                        <input
                          type="text"
                          value={newCustomOil}
                          onChange={(e) => setNewCustomOil(e.target.value)}
                          placeholder="Nueva Viscosidad..."
                          className="flex-1 px-2 py-1 text-xs border border-emerald-200 rounded outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomOil}
                          className="px-2 py-1 text-xs bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700"
                        >
                          Añadir
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 mb-1">Estado</label>
                        <select
                          value={formData.aceite}
                          onChange={(e) => setFormData({ ...formData, aceite: e.target.value })}
                          className="w-full px-2 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white"
                        >
                          <option value="con_aceite">Con Aceite</option>
                          <option value="sin_aceite">Sin Aceite</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 mb-1">Tipo de Aceite</label>
                        <select
                          value={formData.nivelAceite || 'semisintetico'}
                          onChange={(e) => setFormData({ ...formData, nivelAceite: e.target.value })}
                          className="w-full px-2 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white"
                        >
                          <option value="mineral">Mineral</option>
                          <option value="semisintetico">Semisintético</option>
                          <option value="sintetico">Sintético</option>
                          <option value="full_sintetico">Full Sintético</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 mb-1">Viscosidad / Grado</label>
                        <select
                          value={formData.tipoAceite || '10W-40 Motul'}
                          onChange={(e) => setFormData({ ...formData, tipoAceite: e.target.value })}
                          className="w-full px-2 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white"
                        >
                          <option value="10W-30">10W-30</option>
                          <option value="10W-40 Motul">10W-40 Motul</option>
                          <option value="15W-40">15W-40</option>
                          <option value="15W-50">15W-50</option>
                          <option value="20W-40">20W-40</option>
                          <option value="20W-50">20W-50</option>
                          {customOilTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Bloque de Cobro de la Garantía Plus */}
                  <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-2.5 shadow-2xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                          Valor Garantía Plus ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.valorServicio}
                          onFocus={selectOnFocus}
                          onChange={(e) => {
                            const clean = cleanNumberInput(e.target.value);
                            const val = clean === '' ? 0 : parseFloat(clean);
                            const abonoVal = formData.abono !== undefined && formData.abono !== '' ? Number(formData.abono) : val;
                            setFormData({
                              ...formData,
                              valorServicio: clean,
                              saldoPendiente: String(Math.max(0, val - abonoVal)),
                            });
                          }}
                          placeholder="180.00"
                          className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-sm font-mono font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-amber-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                          Método de Pago
                        </label>
                        <select
                          value={formData.metodoPago}
                          onChange={(e) => {
                            const newMetodo = e.target.value;
                            const isCred = newMetodo === 'Crédito';
                            setFormData({
                              ...formData,
                              metodoPago: newMetodo,
                              esCredito: isCred,
                              abono: isCred ? '0' : formData.valorServicio,
                              montoPagado: isCred ? '0' : formData.valorServicio,
                              saldoPendiente: isCred ? String(formData.valorServicio) : '0',
                            });
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Tarjeta">Tarjeta Déb/Créd</option>
                          <option value="Crédito">Crédito</option>
                          <option value="Mixto">Mixto</option>
                        </select>
                      </div>
                    </div>

                    {/* Si es transferencia: Comprobante */}
                    {formData.metodoPago === 'Transferencia' && (
                      <div className="p-2 bg-white/90 rounded-lg border border-amber-300 space-y-1.5">
                        <label className="block text-[10px] font-black uppercase text-amber-900 flex items-center gap-1">
                          <Upload className="w-3 h-3 text-amber-700" />
                          <span>Subir Comprobante de Transferencia</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const b64 = await compressImageBase64(file);
                              if (b64) {
                                setFormData((prev) => ({
                                  ...prev,
                                  evidenciaTransferencia: b64,
                                  comprobantePagoUrl: b64,
                                }));
                              }
                            }
                          }}
                          className="w-full text-xs text-zinc-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                        />
                      </div>
                    )}

                    {/* Factura */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                        Número de Factura Oficial
                      </label>
                      <input
                        type="text"
                        value={formData.numeroFactura || ''}
                        onChange={(e) => setFormData({ ...formData, numeroFactura: e.target.value })}
                        placeholder="Ej: 001-002-0004567"
                        className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-medium outline-none focus:border-amber-600"
                      />
                    </div>

                    {/* Observaciones */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                        Observaciones / Términos del Contrato
                      </label>
                      <textarea
                        rows={2}
                        value={formData.observaciones}
                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-xl text-xs font-medium outline-none focus:border-amber-600 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Botón de envío */}
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setValidationAlert(null);
                      setEffectiveViewMode('list');
                    }}
                    className="py-2.5 px-4 border border-zinc-300 text-zinc-700 rounded-xl font-bold text-xs cursor-pointer hover:bg-zinc-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Registro de Garantía Plus</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: AGREGAR NUEVO TÉCNICO AL TALLER                                 */}
      {/* ========================================================================= */}
      {showAddTechModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-zinc-200 animate-slide-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span>Registrar Nuevo Técnico</span>
              </h3>
              <button onClick={() => setShowAddTechModal(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTechnician} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={newTechData.name}
                  onChange={(e) => setNewTechData({ ...newTechData, name: e.target.value })}
                  placeholder="Ej: CARLOS MENDOZA"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-emerald-600 font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Especialidad</label>
                <input
                  type="text"
                  value={newTechData.specialty}
                  onChange={(e) => setNewTechData({ ...newTechData, specialty: e.target.value })}
                  placeholder="Ej: Mecánica Rápida & Garantías"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Teléfono / Celular</label>
                <input
                  type="text"
                  value={newTechData.phone}
                  onChange={(e) => setNewTechData({ ...newTechData, phone: e.target.value })}
                  placeholder="0990000000"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTechModal(false)}
                  className="flex-1 py-2 border border-zinc-300 rounded-xl font-bold text-zinc-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Guardar Técnico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: AGREGAR NUEVO ORIGEN / ALMACÉN                                   */}
      {/* ========================================================================= */}
      {showAddOriginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-zinc-200 animate-slide-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Agregar Origen / Almacén</span>
              </h3>
              <button onClick={() => setShowAddOriginModal(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewOrigin} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Nombre del Almacén / Concesionario *
                </label>
                <input
                  type="text"
                  value={newOriginInput}
                  onChange={(e) => setNewOriginInput(e.target.value)}
                  placeholder="Ej: Almacén Manta Central"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-blue-600 font-bold"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddOriginModal(false)}
                  className="flex-1 py-2 border border-zinc-300 rounded-xl font-bold text-zinc-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Agregar Origen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL FLOTANTE: ABONAR / REGISTRAR PAGO                                 */}
      {/* ========================================================================= */}
      {abonoModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-zinc-200 animate-slide-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">Registrar Abono / Pago</h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    {abonoModalRecord.nombres} {abonoModalRecord.apellidos} • {abonoModalRecord.placa || abonoModalRecord.modeloMarca}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAbonoModalRecord(null)}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer p-1 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAbono} className="space-y-3.5 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1.5">
                <div className="flex justify-between text-zinc-600">
                  <span>Valor de la Póliza:</span>
                  <span className="font-bold font-mono text-zinc-900">${(Number(abonoModalRecord.valorServicio) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Abonado Previamente:</span>
                  <span className="font-bold font-mono">
                    ${(abonoModalRecord.abono !== undefined ? Number(abonoModalRecord.abono) : (Number(abonoModalRecord.montoPagado) || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600 border-t border-zinc-200 pt-1 font-bold">
                  <span>Saldo Pendiente:</span>
                  <span className="font-mono">
                    ${(abonoModalRecord.saldoPendiente !== undefined ? Number(abonoModalRecord.saldoPendiente) : Math.max(0, (Number(abonoModalRecord.valorServicio) || 0) - (Number(abonoModalRecord.abono ?? abonoModalRecord.montoPagado) || 0))).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Monto a Abonar ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={abonoFormData.montoAbono}
                  onChange={(e) => setAbonoFormData({ ...abonoFormData, montoAbono: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-base font-bold font-mono text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Método de Pago</label>
                <select
                  value={abonoFormData.metodoPago}
                  onChange={(e) => setAbonoFormData({ ...abonoFormData, metodoPago: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-emerald-600"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                  <option value="Crédito">Crédito Directo</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAbonoModalRecord(null)}
                  className="flex-1 py-2.5 border border-zinc-300 rounded-xl font-bold text-zinc-700 cursor-pointer hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Abono</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
