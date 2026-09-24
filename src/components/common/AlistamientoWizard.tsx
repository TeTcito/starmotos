// src/components/common/AlistamientoWizard.tsx
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
  Eye,
  FileText,
  Printer,
  Trash2,
  Check,
  Upload,
  Lock,
  ArrowLeft,
  MessageCircle,
  Save,
  DollarSign,
  TrendingUp,
  Clock,
  CreditCard,
  Filter,
  ChevronDown,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';
import {
  AlistamientoFullRecord,
  AlistamientoFormData,
  Technician,
  ServiceActionType,
  Workshop,
  TallerClient,
  TallerOrder,
} from '../../types/customer';
import {
  querySriMock,
  getStoredClients,
  saveStoredClients,
  getStoredFullAlistamientos,
  getRegisteredBrands,
  getStoredOrders,
} from '../../data/mockMultiRoleData';
import { compressImageBase64 } from '../../utils/imageCompressor';
import { cleanNumberInput, selectOnFocus } from '../../utils/numberUtils';
import { getMediaFromIndexedDB } from '../../services/mediaStorage';

interface Props {
  defaultAtendidoPor: string;
  defaultSede: string;
  defaultSedeId: string;
  workshops: Workshop[];
  technicians: Technician[];
  origins: string[];
  onAddTechnician: (tech: Omit<Technician, 'id' | 'activeOrdersCount'>) => void;
  onAddOrigin: (origin: string) => void;
  onSaveRecord: (record: AlistamientoFullRecord) => void;
  onDeleteRecord?: (id: string) => void;
  recentRecords?: AlistamientoFullRecord[];
  viewMode?: 'list' | 'form';
  onViewModeChange?: (mode: 'list' | 'form') => void;
  isMatriz?: boolean;
  selectedWorkshopFilter?: string;
  onSelectWorkshopFilter?: (wsId: string) => void;
  orders?: TallerOrder[];
}

export const isPdiOnlyRecord = (record: AlistamientoFullRecord | AlistamientoFormData): boolean => {
  const services = record.serviciosRealizados || [];
  const hasPdi = services.includes('alistamiento_pdi');
  const hasOtherPaidServices = services.some((s) => s === 'mantenimiento' || s === 'engrasado');
  if (hasPdi && !hasOtherPaidServices) return true;
  return Number(record.valorServicio || 0) === 0 && Number(record.montoPagado || 0) === 0 && hasPdi;
};

export const matchRecordToWorkshop = (
  record: AlistamientoFullRecord,
  targetWsId: string,
  workshopsList: Workshop[] = []
): boolean => {
  if (!targetWsId || targetWsId === 'all') return true;
  // 1. Coincidencia directa por sedeId
  if (record.sedeId && record.sedeId === targetWsId) return true;

  // 2. Coincidencia por información del taller
  const targetWs = workshopsList.find((w) => w.id === targetWsId);
  if (!targetWs) {
    return record.sede === targetWsId;
  }

  // Coincidencia exacta por nombre
  if (record.sede && record.sede.toLowerCase().trim() === targetWs.name.toLowerCase().trim()) return true;

  // Coincidencia resiliente por subcadena de ciudad o nombre
  if (record.sede) {
    const cleanSede = record.sede.toLowerCase().replace(/starmotos|sucursal|sede|taller/gi, '').trim();
    const cleanWs = targetWs.name.toLowerCase().replace(/starmotos|sucursal|sede|taller/gi, '').trim();
    const cityPart = targetWs.city.toLowerCase().split(',')[0].trim();
    if (cleanSede && (cleanSede.includes(cleanWs) || cleanWs.includes(cleanSede) || (cityPart && cleanSede.includes(cityPart)))) {
      return true;
    }
  }

  // Coincidencia si el sedeId contiene el nombre de la ciudad
  if (record.sedeId && targetWs.city) {
    const cityPart = targetWs.city.toLowerCase().split(',')[0].trim();
    if (cityPart && record.sedeId.toLowerCase().includes(cityPart)) {
      return true;
    }
  }

  return false;
};

export const getRecordTimestamp = (r: AlistamientoFullRecord): number => {
  // 1. Si el ID contiene timestamp numérico de Date.now() (ej. als-1727185338000)
  const idMatch = (r.id || '').match(/(\d{12,14})/);
  if (idMatch) {
    const ts = Number(idMatch[1]);
    if (!isNaN(ts) && ts > 1600000000000) return ts;
  }

  // 2. Si fechaServicio (YYYY-MM-DD) y horaServicio (HH:mm) están presentes
  if (r.fechaServicio) {
    const time = r.horaServicio ? (r.horaServicio.length === 5 ? `${r.horaServicio}:00` : r.horaServicio) : '00:00:00';
    const parsed = Date.parse(`${r.fechaServicio}T${time}`);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // 3. Si createdAt tiene fecha legible estándar o ISO
  if (r.createdAt) {
    const parsed = Date.parse(r.createdAt);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  return 0;
};

export const getRecordOrderStatus = (
  record: AlistamientoFullRecord,
  ordersList: TallerOrder[] = []
): 'completed' | 'in_progress' | null => {
  if (!ordersList || ordersList.length === 0) return null;
  // 1. Coincidencia directa por alistamientoId
  let order = ordersList.find((o) => o.alistamientoId && o.alistamientoId === record.id);
  // 2. Coincidencia si el ID del alistamiento coincide con el ID de la orden
  if (!order) {
    order = ordersList.find((o) => o.id === record.id);
  }
  // 3. Coincidencia de respaldo por cédula y placa
  if (!order && record.cedulaRuc) {
    const cleanPlate = (record.placa || '').trim().toUpperCase();
    const hasValidPlate = cleanPlate && cleanPlate !== 'S/P' && cleanPlate !== 'EN TRÁMITE' && cleanPlate !== 'ENTRAMITE';
    order = ordersList.find((o) => {
      if (o.clientIdNumber !== record.cedulaRuc) return false;
      if (hasValidPlate && o.plate) {
        return o.plate.trim().toUpperCase() === cleanPlate;
      }
      return false;
    });
  }

  if (!order) return null;

  const st = (order.status || '').toLowerCase().trim();
  if (st === 'entregado' || st === 'entregada') {
    return 'completed';
  }
  // Cualquier otro estado activo en taller ('inicio', 'en_proceso', 'trabajando', 'listo_para_entregar', 'recepcion', etc.)
  return 'in_progress';
};

export const AlistamientoWizard: React.FC<Props> = ({
  defaultAtendidoPor,
  defaultSede,
  defaultSedeId,
  workshops,
  technicians,
  origins,
  onAddTechnician,
  onAddOrigin,
  onSaveRecord,
  onDeleteRecord,
  recentRecords = [],
  viewMode: externalViewMode,
  onViewModeChange,
  isMatriz = false,
  selectedWorkshopFilter: propSelectedWorkshopFilter,
  onSelectWorkshopFilter,
  orders: propOrders,
}) => {
  // Manejo de modo de visualización (controlado externamente o interno)
  const [internalViewMode, setInternalViewMode] = useState<'list' | 'form'>('list');
  const currentViewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;

  const setEffectiveViewMode = (mode: 'list' | 'form') => {
    setInternalViewMode(mode);
    onViewModeChange?.(mode);
  };

  // Referencia para selector de archivos del computador/dispositivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Identificar si la sede actual es Matriz Central de forma resiliente
  const effectiveIsMatriz = Boolean(
    isMatriz ||
    defaultSedeId === 'matriz-la-mana' ||
    defaultSedeId === 'sede-matriz' ||
    (defaultSede && defaultSede.toLowerCase().includes('matriz'))
  );

  // Búsqueda y Filtro de Sede en el listado
  const [searchTerm, setSearchTerm] = useState('');
  const [internalWorkshopFilter, setInternalWorkshopFilter] = useState<string>('all');
  const selectedWorkshopFilter = propSelectedWorkshopFilter !== undefined ? propSelectedWorkshopFilter : internalWorkshopFilter;

  const handleSelectWorkshopFilter = (wsId: string) => {
    setInternalWorkshopFilter(wsId);
    onSelectWorkshopFilter?.(wsId);
  };

  // Filtros interactivos avanzados (Pago, Fechas, Ordenamiento)
  const [filterPayment, setFilterPayment] = useState<'all' | 'con_saldo' | 'pagados' | 'pdi'>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<
    'recientes' | 'antiguos' | 'cliente_asc' | 'cliente_desc' | 'modelo_asc' | 'modelo_desc' | 'mayor_valor' | 'mayor_saldo'
  >('recientes');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const RECORDS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPayment, filterDateRange, sortBy, selectedWorkshopFilter]);

  // Marcas registradas en tiempo real de los garantes oficiales
  const [registeredBrands, setRegisteredBrands] = useState<string[]>(getRegisteredBrands);

  useEffect(() => {
    const handleBrandsUpdate = () => {
      setRegisteredBrands(getRegisteredBrands());
    };
    window.addEventListener('starmotos_garantes_updated', handleBrandsUpdate);
    window.addEventListener('starmotos_garante_profile_updated', handleBrandsUpdate);
    return () => {
      window.removeEventListener('starmotos_garantes_updated', handleBrandsUpdate);
      window.removeEventListener('starmotos_garante_profile_updated', handleBrandsUpdate);
    };
  }, []);

  // Órdenes de trabajo para colorear filas según estado de taller (verde suave si entregada, amarillo suave si en proceso)
  const [internalOrders, setInternalOrders] = useState<TallerOrder[]>(() => getStoredOrders());

  useEffect(() => {
    const handleOrdersUpdate = () => {
      setInternalOrders(getStoredOrders());
    };
    window.addEventListener('starmotos_orders_updated', handleOrdersUpdate);
    return () => {
      window.removeEventListener('starmotos_orders_updated', handleOrdersUpdate);
    };
  }, []);

  const effectiveOrders = propOrders || internalOrders;

  const handleResetFilters = () => {
    setFilterPayment('all');
    setFilterDateRange('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('recientes');
  };

  // Registro seleccionado para ver detalle en formulario
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<AlistamientoFullRecord | null>(null);
  const [detailFormData, setDetailFormData] = useState<AlistamientoFormData | null>(null);
  const [detailSuccessToast, setDetailSuccessToast] = useState<string | null>(null);

  // Paso para vista móvil (1: Cliente, 2: Moto, 3: Servicio)
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

  // Fecha de hoy por defecto en formato YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Hora actual por defecto en formato HH:mm
  const getCurrentTimeStr = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // Estado del formulario completo
  const [formData, setFormData] = useState<AlistamientoFormData>({
    id: '',
    atendidoPor: defaultAtendidoPor,
    sede: defaultSede,
    sedeId: defaultSedeId,
    fechaServicio: todayStr,
    horaServicio: getCurrentTimeStr(),
    nombres: '',
    apellidos: '',
    cedulaRuc: '',
    celular1: '',
    celular2: '',
    email: '',
    direccion: '',
    origen:
      origins.find((o) =>
        defaultSede &&
        (o.toLowerCase().includes(defaultSede.toLowerCase().replace(/starmotos|sucursal|sede|taller/gi, '').trim()) ||
          defaultSede.toLowerCase().includes(o.toLowerCase().replace(/almacén|almacen/gi, '').trim()))
      ) ||
      (defaultSede ? `Almacén ${defaultSede.replace(/StarMotos\s*/i, '')}` : origins[0] || 'Almacén Principal'),
    motoPreviaId: '',
    chasis: '',
    placa: '',
    modeloMarca: '',
    color: '',
    serviciosRealizados: ['alistamiento_pdi'],
    tecnicoResponsable: technicians[0]?.name || '',
    tecnicoId: technicians[0]?.id || '',
    kilometraje: '',
    aceite: 'con_aceite',
    nivelAceite: 'mineral',
    tipoAceite: '10W-30',
    numeroFactura: '',
    numeroTicket: '',
    valorServicio: '',
    montoPagado: '',
    abono: '',
    saldoPendiente: '',
    esCredito: false,
    mesesCredito: 3,
    metodoPago: 'Efectivo',
    observaciones: '',
    proximoMantenimientoKm: '',
    fotos: [],
    evidenciaTransferencia: '',
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
  const [abonoModalRecord, setAbonoModalRecord] = useState<AlistamientoFullRecord | null>(null);
  const [abonoFormData, setAbonoFormData] = useState<{
    montoAbono: string;
    metodoPago: AlistamientoFullRecord['metodoPago'];
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

  const handleOpenAbonoModal = (record: AlistamientoFullRecord) => {
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

    // Si está en modo suma (predeterminado), se suma el nuevo abono a lo recaudado previamente
    const nuevoTotalPagado = abonoFormData.esSuma
      ? Math.min(valServ, prevPagado + inputAbono)
      : Math.min(valServ, inputAbono);

    const nuevoSaldo = Math.max(0, valServ - nuevoTotalPagado);
    const isPaidInFull = nuevoSaldo <= 0.01;

    const fechaAbono = new Date().toLocaleDateString('es-EC');
    const horaAbono = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    const abonoEfectivo = abonoFormData.esSuma ? inputAbono : Math.max(0, nuevoTotalPagado - prevPagado);

    const nuevoItemAbono = {
      id: `abn-${Date.now()}`,
      fecha: fechaAbono,
      hora: horaAbono,
      monto: abonoEfectivo,
      metodoPago: abonoFormData.metodoPago,
      evidenciaTransferencia: abonoFormData.evidenciaTransferencia || undefined,
      numeroFactura: abonoFormData.numeroFactura || undefined,
      saldoRestante: nuevoSaldo,
      registradoPor: defaultAtendidoPor || 'Taller',
    };

    const updatedHistorial = [...(abonoModalRecord.historialAbonos || []), nuevoItemAbono];
    const nota = `\n[Abono ${fechaAbono} ${horaAbono}: +$${abonoEfectivo.toFixed(2)} (${abonoFormData.metodoPago}). Saldo rest.: $${nuevoSaldo.toFixed(2)}]`;
    const updatedObservaciones = ((abonoModalRecord.observaciones || '').trim() + nota).trim();

    const updatedRecord: AlistamientoFullRecord = {
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
        colors: ['#10b981', '#059669', '#34d399', '#f59e0b'],
      });
    }

    if (selectedRecordForDetail && selectedRecordForDetail.id === updatedRecord.id) {
      setSelectedRecordForDetail(updatedRecord);
      setDetailFormData(updatedRecord);
    }

    setAbonoModalRecord(null);
  };

  // Modales rápidos
  const [showAddTechModal, setShowAddTechModal] = useState(false);
  const [newTechData, setNewTechData] = useState({
    name: '',
    specialty: 'Mecánica Rápida & Mantenimiento',
    phone: '',
    workshopId: defaultSedeId,
  });

  const [showAddOriginModal, setShowAddOriginModal] = useState(false);
  const [newOriginInput, setNewOriginInput] = useState('');

  // Sincronizar si cambia defaultSede / defaultAtendidoPor
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      atendidoPor: prev.atendidoPor || defaultAtendidoPor,
      sede: prev.sede || defaultSede,
      sedeId: prev.sedeId || defaultSedeId,
    }));
  }, [defaultAtendidoPor, defaultSede, defaultSedeId]);

  const getCleanWhatsappUrl = (phone: string, clientName: string) => {
    const cleanDigits = phone.replace(/\D/g, '');
    let fullNumber = cleanDigits;
    if (fullNumber.startsWith('0')) {
      fullNumber = `593${fullNumber.substring(1)}`;
    }
    const message = encodeURIComponent(
      `Estimado/a ${clientName}, le saludamos desde StarMotos. Le compartimos la información de su orden de servicio y alistamiento.`
    );
    return `https://wa.me/${fullNumber}?text=${message}`;
  };

  // Cantidad de filtros activos (para badge en botón)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterPayment !== 'all') count++;
    if (filterDateRange !== 'all') count++;
    if (sortBy !== 'recientes') count++;
    return count;
  }, [filterPayment, filterDateRange, sortBy]);

  // Filtrado de alistamientos existentes por Sede, término de búsqueda, pagos, fechas y ordenamiento
  const filteredRecords = useMemo(() => {
    const base = recentRecords.filter((r) => {
      // 1. Restricción por Sede
      if (!effectiveIsMatriz && defaultSedeId) {
        const matchesSede = matchRecordToWorkshop(r, defaultSedeId, workshops);
        if (!matchesSede) return false;
      } else if (selectedWorkshopFilter !== 'all') {
        const matchesWs = matchRecordToWorkshop(r, selectedWorkshopFilter, workshops);
        if (!matchesWs) return false;
      }

      // 2. Término de búsqueda
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const fullClient = `${r.nombres} ${r.apellidos}`.toLowerCase();
        const matchesTerm = (
          r.cedulaRuc.toLowerCase().includes(term) ||
          fullClient.includes(term) ||
          r.placa.toLowerCase().includes(term) ||
          r.chasis.toLowerCase().includes(term) ||
          r.modeloMarca.toLowerCase().includes(term) ||
          r.sede.toLowerCase().includes(term) ||
          r.origen.toLowerCase().includes(term) ||
          r.tecnicoResponsable.toLowerCase().includes(term)
        );
        if (!matchesTerm) return false;
      }

      // 3. Filtro por Estado de Pago
      if (filterPayment !== 'all') {
        const valor = Number(r.valorServicio) || 0;
        const pagado = r.abono !== undefined ? Number(r.abono) : (Number(r.montoPagado) || 0);
        const pendiente = r.saldoPendiente !== undefined ? Number(r.saldoPendiente) : Math.max(0, valor - pagado);
        const isPdi = isPdiOnlyRecord(r);

        if (filterPayment === 'con_saldo') {
          if (pendiente <= 0.01) return false;
        } else if (filterPayment === 'pagados') {
          if (isPdi || valor <= 0 || pendiente > 0.01) return false;
        } else if (filterPayment === 'pdi') {
          if (!isPdi) return false;
        }
      }

      // 4. Filtro por Fechas
      if (filterDateRange !== 'all') {
        const rawDate = r.fechaServicio || r.createdAt;
        if (rawDate) {
          const parts = rawDate.split('T')[0].split('-');
          let recDate: Date | null = null;
          if (parts.length === 3) {
            recDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          } else {
            recDate = new Date(rawDate);
          }

          if (recDate && !isNaN(recDate.getTime())) {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

            if (filterDateRange === 'today') {
              if (recDate < todayStart || recDate > todayEnd) return false;
            } else if (filterDateRange === 'this_week') {
              const dayOfWeek = now.getDay();
              const diffToMonday = (dayOfWeek + 6) % 7;
              const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
              const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
              if (recDate < monday || recDate > sunday) return false;
            } else if (filterDateRange === 'this_month') {
              const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
              const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
              if (recDate < monthStart || recDate > monthEnd) return false;
            } else if (filterDateRange === 'custom') {
              if (customStartDate) {
                const cStart = new Date(customStartDate + 'T00:00:00');
                if (!isNaN(cStart.getTime()) && recDate < cStart) return false;
              }
              if (customEndDate) {
                const cEnd = new Date(customEndDate + 'T23:59:59');
                if (!isNaN(cEnd.getTime()) && recDate > cEnd) return false;
              }
            }
          }
        }
      }

      return true;
    });

    // 5. Ordenamiento
    return [...base].sort((a, b) => {
      if (sortBy === 'recientes') {
        const timeA = getRecordTimestamp(a);
        const timeB = getRecordTimestamp(b);
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || '').localeCompare(a.id || '');
      }
      if (sortBy === 'antiguos') {
        const timeA = getRecordTimestamp(a);
        const timeB = getRecordTimestamp(b);
        if (timeA !== timeB) return timeA - timeB;
        return (a.id || '').localeCompare(b.id || '');
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
        return (a.modeloMarca || '').trim().toLowerCase().localeCompare((b.modeloMarca || '').trim().toLowerCase());
      }
      if (sortBy === 'modelo_desc') {
        return (b.modeloMarca || '').trim().toLowerCase().localeCompare((a.modeloMarca || '').trim().toLowerCase());
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
  }, [
    recentRecords,
    searchTerm,
    selectedWorkshopFilter,
    defaultSedeId,
    defaultSede,
    effectiveIsMatriz,
    workshops,
    filterPayment,
    filterDateRange,
    customStartDate,
    customEndDate,
    sortBy,
  ]);

  // Métricas financieras y operativas del listado (Ingresos cobrados vs Pendientes por cobrar)
  const statsMetrics = useMemo(() => {
    let totalRecaudado = 0;
    let totalPendiente = 0;
    let totalFacturado = 0;
    let countPdi = 0;
    let countMantenimiento = 0;
    let countConSaldo = 0;

    filteredRecords.forEach((r) => {
      const isPdi = isPdiOnlyRecord(r);
      const valor = isPdi ? 0 : (Number(r.valorServicio) || 0);
      const pagado = isPdi ? 0 : (r.abono !== undefined ? Number(r.abono) : (Number(r.montoPagado) || 0));
      const pendiente = isPdi ? 0 : (r.saldoPendiente !== undefined 
        ? Number(r.saldoPendiente) 
        : Math.max(0, valor - pagado));

      totalFacturado += valor;
      totalRecaudado += pagado;
      totalPendiente += pendiente;

      if (pendiente > 0.01) countConSaldo++;
      if (r.serviciosRealizados?.includes('alistamiento_pdi')) countPdi++;
      if (r.serviciosRealizados?.includes('mantenimiento') || r.serviciosRealizados?.includes('engrasado')) countMantenimiento++;
    });

    return {
      totalRecaudado,
      totalPendiente,
      totalFacturado,
      countPdi,
      countMantenimiento,
      countConSaldo,
      totalOperaciones: filteredRecords.length,
    };
  }, [filteredRecords]);

  // Paginación derivada
  const totalPages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * RECORDS_PER_PAGE, currentPage * RECORDS_PER_PAGE);

  // Historial previo del cliente o motocicleta (según Cédula/RUC o Chasis o Placa)
  const clientHistoricalRecords = useMemo(() => {
    const cedula = formData.cedulaRuc.trim().toLowerCase();
    const chasis = formData.chasis.trim().toLowerCase();
    const placa = formData.placa.trim().toLowerCase();

    if (!cedula && !chasis && !placa) return [];

    return recentRecords.filter((rec) => {
      if (formData.id && rec.id === formData.id) return false;
      const matchCedula = !!cedula && rec.cedulaRuc.trim().toLowerCase() === cedula;
      const matchChasis = !!chasis && rec.chasis.trim().toLowerCase() === chasis;
      const matchPlaca =
        !!placa &&
        placa !== 'en trámite' &&
        placa !== 's/p' &&
        rec.placa.trim().toLowerCase() === placa;

      return matchCedula || matchChasis || matchPlaca;
    });
  }, [formData.id, formData.cedulaRuc, formData.chasis, formData.placa, recentRecords]);

  // 1. Si ya se realizó alistamiento PDI previamente para este cliente/moto, opción bloqueada
  const isPdiBlocked = useMemo(() => {
    return clientHistoricalRecords.some((r) => r.serviciosRealizados?.includes('alistamiento_pdi'));
  }, [clientHistoricalRecords]);

  // 2. Si ya se realizó engrasado previamente para este cliente/moto, opción bloqueada
  const isEngrasadoBlocked = useMemo(() => {
    return clientHistoricalRecords.some((r) => r.serviciosRealizados?.includes('engrasado'));
  }, [clientHistoricalRecords]);

  // Sincronizar dinámicamente qué servicios pueden estar marcados
  useEffect(() => {
    setFormData((prev) => {
      let updated = [...prev.serviciosRealizados];
      let changed = false;

      // Si PDI está bloqueado, no puede estar marcado
      if (isPdiBlocked && updated.includes('alistamiento_pdi')) {
        updated = updated.filter((s) => s !== 'alistamiento_pdi');
        changed = true;
      }
      // Si Engrasado está bloqueado, no puede estar marcado
      if (isEngrasadoBlocked && updated.includes('engrasado')) {
        updated = updated.filter((s) => s !== 'engrasado');
        changed = true;
      }

      // Si ambos están completados/bloqueados, mantenimiento se queda marcado y lo demás desmarcado
      if (isPdiBlocked && isEngrasadoBlocked) {
        if (!updated.includes('mantenimiento') || updated.length > 1) {
          updated = ['mantenimiento'];
          changed = true;
        }
      } else if (updated.length === 0) {
        // Siempre asegurar al menos una opción activa
        updated = ['mantenimiento'];
        changed = true;
      }

      if (!changed) return prev;

      return {
        ...prev,
        serviciosRealizados: updated,
      };
    });
  }, [isPdiBlocked, isEngrasadoBlocked]);

  // Consultar Cédula o RUC (busca en registros existentes o clientes guardados)
  const handleConsultar = (idToSearch?: string) => {
    const cleanId = (idToSearch || formData.cedulaRuc).trim();
    if (!cleanId) return;

    setIsSearching(true);
    setSearchFeedback(null);

    // 1. Primero verificar si ya existe en el historial local de alistamientos de esta sede
    const allAlistamientos = effectiveIsMatriz
      ? [...recentRecords, ...getStoredFullAlistamientos()]
      : recentRecords.filter((r) => r.sedeId === defaultSedeId || r.sede === defaultSede);
    const existingRec = allAlistamientos.find(
      (r) =>
        (r.cedulaRuc && r.cedulaRuc.trim().toLowerCase() === cleanId.toLowerCase()) ||
        (r.chasis && r.chasis.trim().toUpperCase() === cleanId.toUpperCase())
    );

    if (existingRec) {
      setIsSearching(false);
      setFormData((prev) => ({
        ...prev,
        cedulaRuc: existingRec.cedulaRuc || cleanId,
        nombres: existingRec.nombres || prev.nombres,
        apellidos: existingRec.apellidos || prev.apellidos,
        celular1: existingRec.celular1 || prev.celular1,
        celular2: existingRec.celular2 || prev.celular2,
        email: existingRec.email || prev.email,
        direccion: existingRec.direccion || prev.direccion,
        origen: existingRec.origen || prev.origen,
        motoPreviaId: existingRec.chasis || existingRec.placa || prev.motoPreviaId,
        chasis: existingRec.chasis || prev.chasis,
        placa: existingRec.placa || prev.placa,
        modeloMarca: existingRec.modeloMarca || prev.modeloMarca,
        color: existingRec.color || prev.color,
        kilometraje: existingRec.kilometraje || prev.kilometraje,
      }));
      setSearchFeedback(`✓ Cliente registrado encontrado: ${existingRec.nombres} ${existingRec.apellidos}`);
      return;
    }

    // 2. Buscar en base de datos de clientes registrados de esta sede
    const storedClients = effectiveIsMatriz
      ? getStoredClients()
      : getStoredClients().filter((c) => c.workshopId === defaultSedeId || c.workshopName === defaultSede);
    const existingClient = storedClients.find(
      (c) =>
        (c.idNumber && c.idNumber.trim().toLowerCase() === cleanId.toLowerCase()) ||
        (c.motorcycleVin && c.motorcycleVin.trim().toUpperCase() === cleanId.toUpperCase()) ||
        (c.motorcyclePlate && c.motorcyclePlate.trim().toUpperCase() === cleanId.toUpperCase())
    );

    if (existingClient) {
      setIsSearching(false);
      const parts = (existingClient.fullName || '').trim().split(' ');
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
        cNombres = existingClient.fullName;
      }

      setFormData((prev) => ({
        ...prev,
        cedulaRuc: existingClient.idNumber || cleanId,
        nombres: cNombres || prev.nombres,
        apellidos: cApellidos || prev.apellidos,
        celular1: existingClient.phone || prev.celular1,
        email: existingClient.email || prev.email,
        direccion: existingClient.address || prev.direccion,
        motoPreviaId: existingClient.motorcycleVin || existingClient.motorcyclePlate || prev.motoPreviaId,
        chasis: existingClient.motorcycleVin || prev.chasis,
        placa: existingClient.motorcyclePlate || prev.placa,
        modeloMarca: existingClient.motorcycleModel
          ? `${existingClient.motorcycleBrand || ''} ${existingClient.motorcycleModel}`.trim()
          : prev.modeloMarca,
        numeroMotor: existingClient.motorNumber || prev.numeroMotor,
        ramv: existingClient.ramvNumber || prev.ramv,
        color: existingClient.color || prev.color,
        year: existingClient.year || prev.year,
        kilometraje: existingClient.motorcycleMileage !== undefined ? existingClient.motorcycleMileage : prev.kilometraje,
      }));
      setSearchFeedback(`✓ Cliente registrado encontrado: ${existingClient.fullName}`);
      return;
    }

    // 3. No encontrado en la base de datos (y actualmente sin API externa conectada)
    // NO rellenar ni inventar datos ficticios: el usuario debe poder continuar llenando los datos manualmente
    setTimeout(() => {
      setIsSearching(false);
      setSearchFeedback('ℹ Cédula no registrada en el sistema. Puedes continuar completando los datos manualmente.');
    }, 250);
  };

  // Guardar datos del cliente ingresado en la base de datos de la red
  const handleSaveClientToDatabase = () => {
    const cleanId = formData.cedulaRuc.trim();
    const cleanNombres = formData.nombres.trim();
    const cleanApellidos = formData.apellidos.trim();

    if (!cleanId) {
      setSearchFeedback('⚠️ Ingrese el número de Cédula o RUC para guardar al cliente.');
      return;
    }
    if (!cleanNombres) {
      setSearchFeedback('⚠️ Ingrese los nombres del cliente para poder registrarlo.');
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
      phone: formData.celular1.trim() || formData.celular2?.trim() || (existingIndex >= 0 ? currentClients[existingIndex].phone : ''),
      email: formData.email.trim() || (existingIndex >= 0 ? currentClients[existingIndex].email : ''),
      address: formData.direccion.trim() || (existingIndex >= 0 ? currentClients[existingIndex].address : ''),
      motorcycleBrand: formData.modeloMarca ? formData.modeloMarca.split(' ')[0] : (existingIndex >= 0 ? currentClients[existingIndex].motorcycleBrand : 'Benelli'),
      motorcycleModel: formData.modeloMarca.trim() || (existingIndex >= 0 ? currentClients[existingIndex].motorcycleModel : 'Modelo por definir'),
      motorcyclePlate: formData.placa.trim().toUpperCase() || (existingIndex >= 0 ? currentClients[existingIndex].motorcyclePlate : 'S/P'),
      motorcycleVin: formData.chasis.trim().toUpperCase() || (existingIndex >= 0 ? currentClients[existingIndex].motorcycleVin : undefined),
      motorNumber: formData.numeroMotor?.trim().toUpperCase() || (existingIndex >= 0 ? currentClients[existingIndex].motorNumber : undefined),
      ramvNumber: formData.ramv?.trim().toUpperCase() || (existingIndex >= 0 ? currentClients[existingIndex].ramvNumber : undefined),
      color: formData.color?.trim() || (existingIndex >= 0 ? currentClients[existingIndex].color : undefined),
      motorcycleMileage: Number(formData.kilometraje) > 0
        ? Number(formData.kilometraje)
        : (existingIndex >= 0 && currentClients[existingIndex].motorcycleMileage !== undefined
            ? currentClients[existingIndex].motorcycleMileage
            : (Number(formData.kilometraje) || 0)),
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

    try {
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.3 } });
    } catch (_) {}

    setSearchFeedback(`✓ Cliente "${fullName}" guardado exitosamente en la base de datos.`);
  };

  // Iniciar nuevo alistamiento con o sin cédula previa
  const handleStartNewAlistamiento = (initialCedula?: string) => {
    const cedula = initialCedula?.trim() || '';
    setFormData({
      id: '',
      atendidoPor: defaultAtendidoPor,
      sede: defaultSede,
      sedeId: defaultSedeId,
      fechaServicio: todayStr,
      horaServicio: getCurrentTimeStr(),
      nombres: '',
      apellidos: '',
      cedulaRuc: cedula,
      celular1: '',
      celular2: '',
      email: '',
      direccion: '',
      origen: origins[0] || 'almacen Tenso santo domingo',
      motoPreviaId: '',
      chasis: '',
      placa: '',
      modeloMarca: '',
      color: '',
      serviciosRealizados: ['alistamiento_pdi'],
      tecnicoResponsable: technicians[0]?.name || '',
      tecnicoId: technicians[0]?.id || '',
      kilometraje: '',
      aceite: 'con_aceite',
      nivelAceite: 'mineral',
      tipoAceite: '10W-30',
      numeroFactura: '',
      numeroTicket: '',
      valorServicio: '',
      montoPagado: '',
      abono: '',
      saldoPendiente: '',
      esCredito: false,
      mesesCredito: 3,
      metodoPago: 'Efectivo',
      observaciones: '',
      proximoMantenimientoKm: '',
      fotos: [],
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

  // Reusar datos de un cliente existente para nuevo servicio
  const handleNewServiceForExisting = (record: AlistamientoFullRecord | AlistamientoFormData) => {
    setFormData({
      id: '',
      atendidoPor: defaultAtendidoPor,
      sede: defaultSede,
      sedeId: defaultSedeId,
      fechaServicio: todayStr,
      horaServicio: getCurrentTimeStr(),
      nombres: record.nombres,
      apellidos: record.apellidos,
      cedulaRuc: record.cedulaRuc,
      celular1: record.celular1,
      celular2: record.celular2 || '',
      email: record.email || '',
      direccion: record.direccion || '',
      origen: record.origen,
      motoPreviaId: record.chasis || record.placa,
      chasis: record.chasis,
      placa: record.placa,
      modeloMarca: record.modeloMarca,
      color: record.color || '',
      serviciosRealizados: ['mantenimiento'],
      tecnicoResponsable: (record.tecnicoResponsable && technicians.some((t) => t.name === record.tecnicoResponsable))
        ? record.tecnicoResponsable
        : (technicians[0]?.name || ''),
      tecnicoId: (record.tecnicoId && technicians.some((t) => t.id === record.tecnicoId))
        ? record.tecnicoId
        : (technicians[0]?.id || ''),
      kilometraje: record.kilometraje || '',
      aceite: record.aceite || 'con_aceite',
      nivelAceite: record.nivelAceite || 'mineral',
      tipoAceite: record.tipoAceite || '10W-30',
      numeroFactura: '',
      numeroTicket: '',
      valorServicio: 35.0,
      montoPagado: 35.0,
      abono: 35.0,
      saldoPendiente: 0,
      esCredito: false,
      mesesCredito: 3,
      metodoPago: 'Efectivo',
      observaciones: `Mantenimiento subsecuente. Cliente C.I. ${record.cedulaRuc}.`,
      proximoMantenimientoKm: '',
      fotos: [],
      createdAt: '',
    });
    setSearchFeedback(`✓ Datos de ${record.nombres} ${record.apellidos} y moto precargados.`);
    setValidationAlert(null);
    setMobileStep(1);
    setEffectiveViewMode('form');
  };

  // Abrir registro existente en formulario estructurado
  const handleOpenRecordDetail = (record: AlistamientoFullRecord) => {
    setSelectedRecordForDetail(record);
    setDetailFormData({ ...record });
    setDetailSuccessToast(null);

    // Resolver evidencias y fotos desde IndexedDB si vienen con idb:
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

    if (record.fotos && record.fotos.length > 0) {
      record.fotos.forEach((f, idx) => {
        if (typeof f === 'string' && f.startsWith('idb:')) {
          const key = f.replace('idb:', '');
          getMediaFromIndexedDB(key).then((data) => {
            if (data) {
              setDetailFormData((prev) => {
                if (!prev) return null;
                const nextFotos = [...(prev.fotos || [])];
                nextFotos[idx] = data;
                return { ...prev, fotos: nextFotos };
              });
            }
          });
        }
      });
    }
  };

  // Guardar modificaciones del formulario de alistamiento
  const handleSaveRecordDetail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!detailFormData) return;
    const valServ = Number(detailFormData.valorServicio) || 0;
    const valAbono = detailFormData.abono !== undefined && detailFormData.abono !== '' ? Number(detailFormData.abono) : (detailFormData.montoPagado !== '' ? Number(detailFormData.montoPagado) : 0);
    const securedDetail: AlistamientoFullRecord = {
      ...detailFormData,
      kilometraje: Number(detailFormData.kilometraje) || 0,
      valorServicio: valServ,
      montoPagado: valAbono,
      abono: valAbono,
      saldoPendiente: detailFormData.saldoPendiente !== undefined && detailFormData.saldoPendiente !== '' ? Number(detailFormData.saldoPendiente) : Math.max(0, valServ - valAbono),
      proximoMantenimientoKm: Number(detailFormData.proximoMantenimientoKm) || 0,
      year: detailFormData.year !== undefined && detailFormData.year !== '' ? Number(detailFormData.year) : undefined,
      mesesCredito: Number(detailFormData.mesesCredito) || 3,
    };
    setSelectedRecordForDetail(securedDetail);
    setDetailFormData(securedDetail);
    if (onSaveRecord) {
      onSaveRecord(securedDetail);
    }
    setDetailSuccessToast('✓ Ficha técnica y datos de alistamiento actualizados correctamente.');
    setTimeout(() => setDetailSuccessToast(null), 3500);
  };

  // Servicios toggle (con bloqueo si ya se realizaron previamente)
  const toggleServicio = (servicio: ServiceActionType) => {
    if (servicio === 'alistamiento_pdi' && isPdiBlocked) return;
    if (servicio === 'engrasado' && isEngrasadoBlocked) return;

    // Si ambos ya están completados/bloqueados, mantenimiento se queda marcado fijo
    if (isPdiBlocked && isEngrasadoBlocked && servicio === 'mantenimiento') {
      return;
    }

    setFormData((prev) => {
      const exists = prev.serviciosRealizados.includes(servicio);
      let updatedServicios: ServiceActionType[];
      if (exists) {
        if (prev.serviciosRealizados.length === 1) return prev; // Mantener al menos uno seleccionado
        updatedServicios = prev.serviciosRealizados.filter((s) => s !== servicio);
      } else {
        updatedServicios = [...prev.serviciosRealizados, servicio];
      }

      const isPdiOnly = updatedServicios.length === 1 && updatedServicios[0] === 'alistamiento_pdi';
      let valor = prev.valorServicio;
      let pagado = prev.montoPagado;
      let abono = prev.abono;
      let saldo = prev.saldoPendiente;

      if (isPdiOnly) {
        valor = 0;
        pagado = 0;
        abono = 0;
        saldo = 0;
      } else if (valor === 0 && updatedServicios.some((s) => s === 'mantenimiento' || s === 'engrasado')) {
        valor = 35.0;
        pagado = 35.0;
        abono = 35.0;
        saldo = 0;
      }

      return {
        ...prev,
        serviciosRealizados: updatedServicios,
        valorServicio: valor,
        montoPagado: pagado,
        abono: abono,
        saldoPendiente: saldo,
      };
    });
  };

  // Subir archivos reales desde el computador o dispositivo (comprimidas)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const compressed = await compressImageBase64(file);
      if (compressed) {
        setFormData((prev) => ({
          ...prev,
          fotos: [...prev.fotos, compressed],
        }));
      }
    }

    // Resetear valor para permitir seleccionar el mismo archivo si se desea
    e.target.value = '';
  };


  const handleRemovePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index),
    }));
  };

  // Guardar Técnico Nuevo
  const handleSaveNewTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechData.name.trim()) return;

    const wsId = (!effectiveIsMatriz || !newTechData.workshopId) ? defaultSedeId : newTechData.workshopId;
    const targetWorkshop = workshops.find((w) => w.id === wsId) || workshops.find((w) => w.id === defaultSedeId);
    onAddTechnician({
      name: newTechData.name.toUpperCase(),
      specialty: newTechData.specialty,
      phone: newTechData.phone || '0990000000',
      workshopId: wsId,
      workshopName: targetWorkshop?.name || defaultSede,
      status: 'activo',
    });

    setFormData((prev) => ({
      ...prev,
      tecnicoResponsable: newTechData.name.toUpperCase(),
    }));

    setShowAddTechModal(false);
    setNewTechData({
      name: '',
      specialty: 'Mecánica Rápida & Mantenimiento',
      phone: '',
      workshopId: defaultSedeId,
    });
  };

  // Guardar Nuevo Origen / Almacén
  const handleSaveNewOrigin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOriginInput.trim()) return;
    onAddOrigin(newOriginInput.trim());
    setFormData((prev) => ({
      ...prev,
      origen: newOriginInput.trim(),
    }));
    setShowAddOriginModal(false);
    setNewOriginInput('');
  };

  // Envío final del registro con validación estricta y retorno automático al listado
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

    // 3. Validar Paso 3: Servicio
    const missingStep3: string[] = [];
    if (!formData.tecnicoResponsable.trim()) missingStep3.push('Técnico responsable');
    if (!formData.serviciosRealizados || formData.serviciosRealizados.length === 0) {
      missingStep3.push('¿Qué se realizó?');
    }
    const isPdiOnly = formData.serviciosRealizados.length === 1 && formData.serviciosRealizados[0] === 'alistamiento_pdi';
    if (!isPdiOnly && (formData.valorServicio === undefined || formData.valorServicio === null || formData.valorServicio === '' || isNaN(Number(formData.valorServicio)))) {
      missingStep3.push('Valor del servicio ($)');
    }

    if (missingStep1.length > 0) {
      setValidationAlert({
        title: 'Faltan datos en Paso 1: Cliente',
        fields: missingStep1,
        stepTarget: 1,
      });
      setMobileStep(1);
      return;
    }

    if (missingStep2.length > 0) {
      setValidationAlert({
        title: 'Faltan datos en Paso 2: Moto',
        fields: missingStep2,
        stepTarget: 2,
      });
      setMobileStep(2);
      return;
    }

    if (missingStep3.length > 0) {
      setValidationAlert({
        title: 'Faltan datos en Paso 3: Servicio',
        fields: missingStep3,
        stepTarget: 3,
      });
      setMobileStep(3);
      return;
    }

    // Limpiar alerta y procesar guardado
    setValidationAlert(null);

    const isCred = formData.metodoPago === 'Crédito' || formData.metodoPago === 'Crédito Directo' || !!formData.esCredito;
    const numVal = Number(formData.valorServicio) || 0;
    const numAbono = formData.abono !== undefined && formData.abono !== '' ? Number(formData.abono) : (formData.montoPagado !== '' ? Number(formData.montoPagado) : numVal);
    const finalValor = isPdiOnly ? 0 : numVal;
    const finalAbono = isPdiOnly ? 0 : (isCred ? 0 : numAbono);
    const finalSaldo = isPdiOnly ? 0 : (isCred ? finalValor : (formData.saldoPendiente !== undefined && formData.saldoPendiente !== '' ? Number(formData.saldoPendiente) : Math.max(0, finalValor - finalAbono)));

    const fullRecord: AlistamientoFullRecord = {
      ...formData,
      kilometraje: Number(formData.kilometraje) || 0,
      proximoMantenimientoKm: Number(formData.proximoMantenimientoKm) || 0,
      year: formData.year !== undefined && formData.year !== '' ? Number(formData.year) : undefined,
      mesesCredito: Number(formData.mesesCredito) || 3,
      esCredito: isCred,
      metodoPago: isCred ? 'Crédito' : formData.metodoPago,
      valorServicio: finalValor,
      montoPagado: finalAbono,
      abono: finalAbono,
      saldoPendiente: finalSaldo,
      id: `als-${Date.now()}`,
      createdAt: new Date().toLocaleString('es-EC', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      numeroFactura:
        formData.numeroFactura ||
        `001-002-${Math.floor(1000000 + Math.random() * 9000000)}`,
      numeroTicket:
        formData.numeroTicket ||
        `TCK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    onSaveRecord(fullRecord);

    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#0f3299', '#d92525', '#10b981', '#f59e0b'],
    });

    // Volver al listado y limpiar formulario
    setEffectiveViewMode('list');
    setSearchTerm('');
    setSearchFeedback(null);
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Input oculto para subir archivos reales de imágenes */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,*/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. VISTA: FORMULARIO DE DETALLE DE ALISTAMIENTO PREVIO                    */}
      {/* ========================================================================= */}
      {currentViewMode === 'list' && selectedRecordForDetail && detailFormData && (
        <div className="flex-1 min-h-0 w-full overflow-y-auto pr-1 pb-8">
          <form
            onSubmit={handleSaveRecordDetail}
            className="w-full flex flex-col gap-4 animate-fade-in bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-2xs mb-4"
          >
          {/* Cabecera del Formulario de Alistamiento */}
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
                <span>Volver al Libro de Alistamientos</span>
              </button>
              <div className="h-6 w-px bg-zinc-200 hidden sm:block" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                    Ficha Técnica: {detailFormData.nombres} {detailFormData.apellidos}
                  </h2>
                  <span className="font-mono text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 font-semibold">
                    C.I./RUC: {detailFormData.cedulaRuc}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ COMPLETADO
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Sede: <strong className="text-zinc-700">{detailFormData.sede}</strong> • Fecha:{' '}
                  <strong className="text-zinc-700">{detailFormData.fechaServicio}</strong>
                  {detailFormData.horaServicio ? (
                    <> • Hora: <strong className="text-zinc-700 font-mono">{detailFormData.horaServicio}</strong></>
                  ) : null} • Atendido por:{' '}
                  <strong className="text-zinc-700">{detailFormData.atendidoPor || 'StarMotos'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer"
                title="Imprimir ficha técnica"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ficha</span>
              </button>

              {detailFormData.celular1 && (
                <a
                  href={getCleanWhatsappUrl(
                    detailFormData.celular1,
                    `${detailFormData.nombres} ${detailFormData.apellidos}`
                  )}
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
                      year: detailFormData.year !== undefined && detailFormData.year !== '' ? Number(detailFormData.year) : undefined,
                    } as AlistamientoFullRecord);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer"
                title="Registrar abono o evidencia de pago"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Abonar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleNewServiceForExisting(detailFormData);
                  setSelectedRecordForDetail(null);
                  setDetailFormData(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-black text-white rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nuevo Servicio</span>
              </button>

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
                    if (window.confirm(`¿Está seguro de eliminar permanentemente la ficha de alistamiento de ${detailFormData.nombres} ${detailFormData.apellidos}?`)) {
                      onDeleteRecord(detailFormData.id);
                      setSelectedRecordForDetail(null);
                      setDetailFormData(null);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer"
                  title="Eliminar este alistamiento de la base de datos"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Ficha</span>
                </button>
              )}
            </div>
          </div>

          {/* Notificación de éxito al guardar */}
          {detailSuccessToast && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-in shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{detailSuccessToast}</span>
            </div>
          )}

          {/* Formulario en 3 Columnas Simétricas */}
          <div className="w-full space-y-4 pr-1">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              {/* COLUMNA 1: DATOS DEL CLIENTE */}
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wider">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>1. Datos del Cliente</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Propietario</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Cédula o RUC *</label>
                  <input
                    type="text"
                    value={detailFormData.cedulaRuc}
                    readOnly
                    className="w-full px-3 py-1.5 bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-800 outline-none cursor-not-allowed"
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
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Teléfono / Celular 1 *
                  </label>
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
                      {!workshops.some((w) => w.name === detailFormData.sede) && (
                        <option value={detailFormData.sede}>{detailFormData.sede}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                      Origen / Procedencia
                    </label>
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
                    onChange={(e) =>
                      setDetailFormData({ ...detailFormData, placa: e.target.value.toUpperCase() })
                    }
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
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Serie o Chasis (VIN) *
                  </label>
                  <input
                    type="text"
                    value={detailFormData.chasis}
                    onChange={(e) =>
                      setDetailFormData({ ...detailFormData, chasis: e.target.value.toUpperCase() })
                    }
                    required
                    className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-medium text-zinc-900 uppercase outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1 flex items-center justify-between">
                    <span>Kilometraje de Recepción (km) *</span>
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
                      setDetailFormData({
                        ...detailFormData,
                        kilometraje: km,
                      });
                    }}
                    placeholder="0"
                    className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                  />
                </div>
              </div>

              {/* COLUMNA 3: SERVICIO & COBRO */}
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wider">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <span>3. Servicio & Cobro</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Técnico</span>
                </div>

                {/* Servicios Realizados Chips */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Servicios Ejecutados:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {detailFormData.serviciosRealizados?.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 uppercase"
                      >
                        {s.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Técnico y Aceite */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 mb-1">Técnico Responsable</label>
                    <input
                      type="text"
                      value={detailFormData.tecnicoResponsable}
                      onChange={(e) =>
                        setDetailFormData({ ...detailFormData, tecnicoResponsable: e.target.value })
                      }
                      className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 mb-1">Tipo de Aceite</label>
                    <select
                      value={detailFormData.nivelAceite || 'mineral'}
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
                    <select
                      value={detailFormData.tipoAceite || '10W-30'}
                      onChange={(e) => setDetailFormData({ ...detailFormData, tipoAceite: e.target.value })}
                      className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600"
                    >
                      <option value="10W-30">10W-30</option>
                      <option value="10W-40">10W-40</option>
                      <option value="15W-40">15W-40</option>
                      <option value="15W-50">15W-50</option>
                      <option value="20W-40">20W-40</option>
                      <option value="20W-50">20W-50</option>
                      <option value="25W-50">25W-50</option>
                      <option value="5W-30">5W-30</option>
                      <option value="5W-40">5W-40</option>
                      {customOilTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                      <option value="Sin Tipo">N/A</option>
                    </select>
                  </div>
                </div>

                {/* Fecha y Hora en Detalle */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-600" />
                      <span>Fecha de Servicio</span>
                    </label>
                    <input
                      type="date"
                      value={detailFormData.fechaServicio || ''}
                      onChange={(e) =>
                        setDetailFormData({ ...detailFormData, fechaServicio: e.target.value })
                      }
                      className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-600" />
                      <span>Hora de Servicio</span>
                    </label>
                    <input
                      type="time"
                      value={detailFormData.horaServicio || ''}
                      onChange={(e) =>
                        setDetailFormData({ ...detailFormData, horaServicio: e.target.value })
                      }
                      className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>

                {/* Si solo es PDI en detalle: Sin cobro */}
                {detailFormData.serviciosRealizados?.length === 1 && detailFormData.serviciosRealizados[0] === 'alistamiento_pdi' ? (
                  <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-xs text-blue-900 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Alistamiento PDI (Cero costo al cliente / Cubierto por Fábrica)</span>
                  </div>
                ) : (
                  /* Cobro y Facturación en Detalle */
                  <div className="space-y-2 bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-700 mb-1">Valor Servicio ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={detailFormData.valorServicio !== undefined && detailFormData.valorServicio !== null ? detailFormData.valorServicio : ''}
                          onFocus={selectOnFocus}
                          onChange={(e) => {
                            const clean = cleanNumberInput(e.target.value);
                            const val = clean === '' ? 0 : parseFloat(clean);
                            const ab = Number(detailFormData.abono !== undefined && detailFormData.abono !== '' ? detailFormData.abono : (detailFormData.montoPagado || 0));
                            setDetailFormData({
                              ...detailFormData,
                              valorServicio: clean,
                              saldoPendiente: Math.max(0, val - ab),
                            });
                          }}
                          placeholder="0.00"
                          className="w-full px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-700 mb-1">Método de Pago</label>
                        <select
                          value={detailFormData.metodoPago === 'Crédito Directo' ? 'Crédito' : (detailFormData.metodoPago || 'Efectivo')}
                          onChange={(e) => {
                            const met = e.target.value as any;
                            const isCred = met === 'Crédito';
                            const valServ = detailFormData.valorServicio || 0;
                            setDetailFormData({
                              ...detailFormData,
                              metodoPago: met,
                              esCredito: isCred,
                              abono: isCred ? 0 : (detailFormData.abono !== undefined ? detailFormData.abono : valServ),
                              montoPagado: isCred ? 0 : (detailFormData.abono !== undefined ? detailFormData.abono : valServ),
                              saldoPendiente: isCred ? valServ : Math.max(0, Number(valServ) - Number(detailFormData.abono || valServ)),
                            });
                          }}
                          className="w-full px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900 outline-none focus:border-blue-600 cursor-pointer"
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Tarjeta">Tarjeta</option>
                          <option value="Crédito">Crédito</option>
                          <option value="Mixto">Mixto</option>
                        </select>
                      </div>
                    </div>

                    {/* Fila Dinámica según Método de Pago: Crédito Activo vs Abono y Saldo */}
                    {detailFormData.metodoPago === 'Crédito' || detailFormData.metodoPago === 'Crédito Directo' || detailFormData.esCredito ? (
                      <div className="pt-2 space-y-2 border-t border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-blue-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            Crédito Activo
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-500 font-bold">Tiempo:</span>
                            <select
                              value={detailFormData.mesesCredito || 3}
                              onChange={(e) => setDetailFormData({ ...detailFormData, mesesCredito: parseInt(e.target.value) || 3 })}
                              className="px-2 py-0.5 bg-white border border-blue-300 rounded text-[11px] font-bold text-blue-900 outline-none"
                            >
                              <option value={1}>1 Mes</option>
                              <option value={2}>2 Meses</option>
                              <option value={3}>3 Meses</option>
                              <option value={6}>6 Meses</option>
                              <option value={9}>9 Meses</option>
                              <option value={12}>12 Meses</option>
                              <option value={18}>18 Meses</option>
                              <option value={24}>24 Meses</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-blue-900 mb-0.5">Monto a Crédito ($)</label>
                            <input
                              type="number"
                              value={Number(detailFormData.valorServicio || 0).toFixed(2)}
                              readOnly
                              className="w-full px-2 py-1 bg-blue-50/70 border border-blue-300 rounded-lg text-xs font-mono font-bold text-blue-900 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Pendiente por Cobrar ($)</label>
                            <div className="px-2 py-1 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-900 flex justify-between items-center">
                              <span>${Number(detailFormData.valorServicio || 0).toFixed(2)}</span>
                              <span className="text-[9px] text-amber-700 font-bold">Crédito</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100">
                        <div>
                          <label className="block text-[10px] font-bold text-emerald-800 mb-0.5">Abono ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={detailFormData.abono !== undefined && detailFormData.abono !== '' ? detailFormData.abono : (detailFormData.montoPagado ?? '')}
                            onFocus={selectOnFocus}
                            onChange={(e) => {
                              const clean = cleanNumberInput(e.target.value);
                              const abVal = clean === '' ? 0 : parseFloat(clean);
                              const valServ = Number(detailFormData.valorServicio || 0);
                              setDetailFormData({
                                ...detailFormData,
                                abono: clean,
                                montoPagado: clean,
                                saldoPendiente: Math.max(0, valServ - abVal),
                              });
                            }}
                            placeholder="0.00"
                            className="w-full px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Pendiente ($)</label>
                          <div className="px-2 py-1 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-900 flex justify-between">
                            <span>
                              ${Number(detailFormData.saldoPendiente ?? Math.max(0, Number(detailFormData.valorServicio || 0) - Number(detailFormData.abono ?? detailFormData.montoPagado ?? 0))).toFixed(2)}
                            </span>
                            <span className="text-[9px] text-amber-700">Saldo</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Evidencia de Transferencia en Ficha Técnica / Edición */}
                    {(detailFormData.metodoPago === 'Transferencia' || (detailFormData.metodoPago as string)?.toLowerCase?.().includes('transferencia')) && (
                      <div className="pt-2 border-t border-zinc-200 space-y-1.5 animate-fade-in">
                        <label className="block text-[10px] font-bold text-blue-900 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Upload className="w-3 h-3 text-blue-700" />
                            Comprobante / Evidencia de Transferencia
                          </span>
                          {detailFormData.evidenciaTransferencia && (
                            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                              ✓ Comprobante cargado
                            </span>
                          )}
                        </label>
                        {detailFormData.evidenciaTransferencia ? (
                          <div className="rounded-lg border border-blue-200 bg-white p-2 flex items-center gap-3">
                            <a
                              href={detailFormData.evidenciaTransferencia}
                              target="_blank"
                              rel="noreferrer"
                              className="w-12 h-12 rounded overflow-hidden border border-zinc-200 shrink-0 block"
                            >
                              <img
                                src={detailFormData.evidenciaTransferencia}
                                alt="Comprobante"
                                className="w-full h-full object-cover"
                              />
                            </a>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-zinc-900 truncate">Comprobante de transferencia</p>
                              <p className="text-[9px] text-zinc-500">Clic para ver en tamaño completo</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDetailFormData({ ...detailFormData, evidenciaTransferencia: '' })}
                              className="p-1 text-rose-500 hover:text-rose-700 rounded cursor-pointer"
                              title="Eliminar comprobante"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-2.5 border border-dashed border-blue-300 hover:border-blue-500 bg-white rounded-lg cursor-pointer transition-all hover:bg-blue-50/50">
                            <Camera className="w-4 h-4 text-blue-600 mb-0.5" />
                            <span className="text-[11px] font-bold text-blue-950">Subir foto del comprobante</span>
                            <span className="text-[9px] text-zinc-400">JPG, PNG o captura</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const compressed = await compressImageBase64(file, 1000, 0.7);
                                  setDetailFormData({ ...detailFormData, evidenciaTransferencia: compressed });
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">N° Factura o Ticket</label>
                  <input
                    type="text"
                    value={detailFormData.numeroFactura || detailFormData.numeroTicket || ''}
                    onChange={(e) => setDetailFormData({ ...detailFormData, numeroFactura: e.target.value })}
                    className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-zinc-700">
                      Próximo Mantenimiento Sugerido
                    </label>
                    <span className="text-[10px] text-blue-600 font-bold">Editable</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={detailFormData.proximoMantenimientoKm || ''}
                      onFocus={selectOnFocus}
                      onChange={(e) => {
                        const clean = cleanNumberInput(e.target.value);
                        setDetailFormData({
                          ...detailFormData,
                          proximoMantenimientoKm: clean,
                        });
                      }}
                      placeholder="Ej: 1000"
                      className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      KM
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones Técnicas */}
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-1.5">
              <label className="block text-xs font-black uppercase text-zinc-800 tracking-wider">
                Observaciones Mecánicas del Taller
              </label>
              <textarea
                rows={2}
                value={detailFormData.observaciones || ''}
                onChange={(e) => setDetailFormData({ ...detailFormData, observaciones: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs text-zinc-900 outline-none transition-all resize-none"
                placeholder="Sin observaciones mecánicas registradas para esta unidad."
              />
            </div>

            {/* Evidencia Fotográfica de Entrega */}
            {detailFormData.fotos && detailFormData.fotos.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-zinc-200 space-y-2">
                <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>Inspección Visual & Evidencias Fotográficas ({detailFormData.fotos.length})</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {detailFormData.fotos.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-video rounded-lg overflow-hidden border border-zinc-200 block group relative shadow-2xs"
                    >
                      <img
                        src={url}
                        alt={`Evidencia ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Evidencia de Transferencia Bancaria (Comprobante de Pago) en Ficha Técnica */}
            {detailFormData.evidenciaTransferencia && (
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-emerald-950 tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Evidencia de Abono / Comprobante de Transferencia</span>
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                    Abonado: ${(Number(detailFormData.abono ?? detailFormData.montoPagado) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <a
                    href={detailFormData.evidenciaTransferencia}
                    target="_blank"
                    rel="noreferrer"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden border border-emerald-300 block group relative shadow-xs bg-white shrink-0"
                    title="Clic para ver comprobante en tamaño completo"
                  >
                    <img
                      src={detailFormData.evidenciaTransferencia}
                      alt="Comprobante de Transferencia"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </a>
                  <div className="text-xs text-zinc-600 space-y-1">
                    <p className="font-bold text-zinc-800">Comprobante bancario verificado</p>
                    <p className="text-[11px] text-zinc-500">
                      Evidencia registrada para el servicio de {detailFormData.nombres} {detailFormData.apellidos}.
                    </p>
                    <p className="text-[11px] text-zinc-600 font-mono">
                      Método: <strong>{detailFormData.metodoPago}</strong> • Saldo pendiente: <strong className={Number(detailFormData.saldoPendiente || 0) > 0 ? 'text-rose-600' : 'text-emerald-700'}>${(Number(detailFormData.saldoPendiente) || 0).toFixed(2)}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Historial de Abonos / Pagos Registrados */}
            {selectedRecordForDetail?.historialAbonos && selectedRecordForDetail.historialAbonos.length > 0 && (
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-2">
                <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-700" />
                  <span>Historial de Abonos ({selectedRecordForDetail.historialAbonos.length})</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead>
                      <tr className="border-b border-blue-200 text-blue-800 font-bold">
                        <th className="py-1.5 px-2">#</th>
                        <th className="py-1.5 px-2">Fecha</th>
                        <th className="py-1.5 px-2">Monto</th>
                        <th className="py-1.5 px-2">Método</th>
                        <th className="py-1.5 px-2">Saldo Restante</th>
                        <th className="py-1.5 px-2">Registrado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecordForDetail.historialAbonos.map((ab, idx) => (
                        <tr key={ab.id || idx} className="border-b border-blue-100 last:border-0 hover:bg-blue-100/50">
                          <td className="py-1.5 px-2 font-mono text-blue-600">{idx + 1}</td>
                          <td className="py-1.5 px-2 font-mono">{ab.fecha}{ab.hora ? ` ${ab.hora}` : ''}</td>
                          <td className="py-1.5 px-2 font-bold text-emerald-700">${Number(ab.monto).toFixed(2)}</td>
                          <td className="py-1.5 px-2">
                            <span className="inline-flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-200">
                              <CreditCard className="w-2.5 h-2.5" />
                              {ab.metodoPago}
                            </span>
                          </td>
                          <td className={`py-1.5 px-2 font-bold font-mono ${Number(ab.saldoRestante) > 0.01 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            ${Number(ab.saldoRestante).toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-zinc-500">{ab.registradoPor || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer del Formulario */}
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
                type="button"
                onClick={() => {
                  handleNewServiceForExisting(detailFormData);
                  setSelectedRecordForDetail(null);
                  setDetailFormData(null);
                }}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-black text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Iniciar Nuevo Servicio con este Cliente</span>
              </button>

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

      {/* 2. VISTA: LIBRO DE ALISTAMIENTOS (TABLA EXCEL) */}
      {currentViewMode === 'list' && !selectedRecordForDetail && (
        <div className="h-full w-full flex-1 min-h-0 flex flex-col overflow-y-auto xl:overflow-hidden gap-2.5 animate-fade-in">
          {/* Header Superior Destacado: Libro de Alistamientos & Búsqueda de Cédula */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 shrink-0">
            {/* Fila 1: Título con Icono y Badges de Métricas */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight leading-tight">
                    Libro de Alistamiento PDI & Mantenimientos
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Historial de unidades entregadas, fichas técnicas y servicios mecánicos
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-lg whitespace-nowrap shadow-2xs">
                  {recentRecords.length} Registros Totales
                </span>
                <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg whitespace-nowrap shadow-2xs">
                  {recentRecords.filter((r) => r.serviciosRealizados.includes('alistamiento_pdi')).length} PDI Realizados
                </span>
                <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-mono whitespace-nowrap shadow-2xs">
                  ${recentRecords.reduce((acc, r) => acc + (isPdiOnlyRecord(r) ? 0 : (Number(r.valorServicio) || 0)), 0).toFixed(2)} Facturado
                </span>
              </div>
            </div>

            {/* Fila 2: Barra de Búsqueda de Cédula / Cliente LLAMATIVA y GRANDE */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-2.5 border-t border-zinc-100">
              {/* Contenedor del Buscador Prominente */}
              <div className="relative flex-1 flex items-center bg-zinc-50 hover:bg-white focus-within:bg-white border-2 border-blue-200 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 rounded-xl transition-all shadow-xs h-12 sm:h-13 px-4 gap-3">
                <Search className="w-5 h-5 text-blue-600 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (filteredRecords.length === 0 && searchTerm.trim().length >= 8) {
                        handleStartNewAlistamiento(searchTerm.trim());
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
                        handleStartNewAlistamiento(searchTerm.trim());
                      }
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
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
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'bg-white border-zinc-300 hover:border-zinc-400 text-zinc-700'
                }`}
                title="Filtros avanzados por pago, fechas y orden"
              >
                <SlidersHorizontal className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Filtro de Sede / Taller (Solo disponible para Matriz) */}
              {effectiveIsMatriz && workshops && workshops.length > 0 && (
                <div className="h-12 sm:h-13 bg-white border border-zinc-300 rounded-xl px-3 flex items-center shrink-0 shadow-2xs">
                  <Building2 className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
                  <select
                    value={selectedWorkshopFilter}
                    onChange={(e) => handleSelectWorkshopFilter(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-bold text-zinc-800 outline-none cursor-pointer"
                  >
                    <option value="all">🏢 Todas las Sedes ({recentRecords.length})</option>
                    {workshops.map((w) => {
                      const count = recentRecords.filter((r) => matchRecordToWorkshop(r, w.id, workshops)).length;
                      return (
                        <option key={w.id} value={w.id}>
                          {w.name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Botón "+ Nuevo Alistamiento" Destacado */}
              <button
                type="button"
                onClick={() => handleStartNewAlistamiento(searchTerm.trim())}
                className="h-12 sm:h-13 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shrink-0"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>+ Nuevo Alistamiento</span>
              </button>
            </div>

            {/* Panel de Filtros Interactivos Desplegable */}
            {isFilterOpen && (
              <div className="bg-zinc-50/90 border border-blue-200 rounded-2xl p-4 shadow-sm space-y-4 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
                      Filtros de Alistamiento & Servicios
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. Estado de Pago */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-zinc-600 tracking-wider">
                      Estado de Pago
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'all', label: 'Todos' },
                        { id: 'con_saldo', label: 'Pendiente (Con Saldo)' },
                        { id: 'pagados', label: 'Pagados (Al Día)' },
                        { id: 'pdi', label: 'PDI (Sin Costo)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFilterPayment(item.id as any)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer truncate ${
                            filterPayment === item.id
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Rango de Fechas */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-zinc-600 tracking-wider">
                      Fecha del Servicio
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'all', label: 'Todas' },
                        { id: 'today', label: 'Hoy' },
                        { id: 'this_week', label: 'Esta Semana' },
                        { id: 'this_month', label: 'Este Mes' },
                        { id: 'custom', label: 'Rango Manual' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFilterDateRange(item.id as any)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer truncate ${
                            filterDateRange === item.id
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    {filterDateRange === 'custom' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] text-zinc-500 font-bold">Desde</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 font-bold">Hasta</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Ordenamiento */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-zinc-600 tracking-wider">
                      Ordenar Resultados
                    </label>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-800 outline-none cursor-pointer focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="recientes">📅 Más recientes primero</option>
                        <option value="antiguos">📅 Más antiguos primero</option>
                        <option value="cliente_asc">👤 Cliente (A - Z)</option>
                        <option value="cliente_desc">👤 Cliente (Z - A)</option>
                        <option value="modelo_asc">🏍️ Modelo / Marca (A - Z)</option>
                        <option value="modelo_desc">🏍️ Modelo / Marca (Z - A)</option>
                        <option value="mayor_valor">💰 Mayor valor de servicio</option>
                        <option value="mayor_saldo">⏳ Mayor saldo pendiente</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chips de Filtros Activos cuando el panel está cerrado */}
            {!isFilterOpen && activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-zinc-500">Filtros aplicados:</span>
                {filterPayment !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                    <span>
                      Pago:{' '}
                      {filterPayment === 'con_saldo'
                        ? 'Con Saldo'
                        : filterPayment === 'pagados'
                        ? 'Pagados'
                        : 'PDI'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFilterPayment('all')}
                      className="hover:text-blue-950 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterDateRange !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                    <span>
                      Fecha:{' '}
                      {filterDateRange === 'today'
                        ? 'Hoy'
                        : filterDateRange === 'this_week'
                        ? 'Esta semana'
                        : filterDateRange === 'this_month'
                        ? 'Este mes'
                        : `${customStartDate || '...'} a ${customEndDate || '...'}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterDateRange('all');
                        setCustomStartDate('');
                        setCustomEndDate('');
                      }}
                      className="hover:text-blue-950 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {sortBy !== 'recientes' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                    <span>
                      Orden:{' '}
                      {sortBy === 'antiguos'
                        ? 'Antiguos'
                        : sortBy === 'cliente_asc'
                        ? 'Cliente (A-Z)'
                        : sortBy === 'cliente_desc'
                        ? 'Cliente (Z-A)'
                        : sortBy === 'modelo_asc'
                        ? 'Modelo (A-Z)'
                        : sortBy === 'modelo_desc'
                        ? 'Modelo (Z-A)'
                        : sortBy === 'mayor_valor'
                        ? 'Mayor valor'
                        : 'Mayor saldo'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSortBy('recientes')}
                      className="hover:text-blue-950 cursor-pointer"
                    >
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

            {/* Fila 3: Bloques Estadísticos Reactivos (Ingresos Cobrados vs Pendientes por Cobrar) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
              {/* Bloque 1: Total Cobrado / Abonos */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex flex-col justify-between shadow-2xs hover:bg-emerald-50 transition-colors">
                <div className="flex items-center justify-between text-emerald-800">
                  <span className="text-[10px] font-black uppercase tracking-wider">Ingresos Cobrados</span>
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-1">
                  <div className="text-lg sm:text-xl font-black font-mono text-emerald-900 leading-tight">
                    ${statsMetrics.totalRecaudado.toFixed(2)}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700">Abonos y cobros liquidados</span>
                </div>
              </div>

              {/* Bloque 2: Pendientes por Cobrar */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex flex-col justify-between shadow-2xs hover:bg-amber-50 transition-colors">
                <div className="flex items-center justify-between text-amber-800">
                  <span className="text-[10px] font-black uppercase tracking-wider">Pendiente por Cobrar</span>
                  <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
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
              </div>

              {/* Bloque 3: Total Facturado en Servicios */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex flex-col justify-between shadow-2xs hover:bg-blue-50 transition-colors">
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
                  <span className="text-[10px] font-semibold text-blue-700">Volumen total de servicios</span>
                </div>
              </div>

              {/* Bloque 4: Operaciones en Taller */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 flex flex-col justify-between shadow-2xs hover:bg-purple-50 transition-colors">
                <div className="flex items-center justify-between text-purple-800">
                  <span className="text-[10px] font-black uppercase tracking-wider">Operaciones</span>
                  <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-1">
                  <div className="text-lg sm:text-xl font-black text-purple-900 leading-tight">
                    {statsMetrics.totalOperaciones} <span className="text-xs font-bold text-purple-700">motos</span>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-700">
                    {statsMetrics.countPdi} PDI • {statsMetrics.countMantenimiento} Mantenimientos
                  </span>
                </div>
              </div>
            </div>

            {/* Aviso o Sugerencia reactiva si escribe una cédula no existente */}
            {searchTerm.trim().length >= 8 && filteredRecords.length === 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-3 animate-slide-in">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-900">
                  <UserCheck className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                  <span>
                    No hay alistamientos previos registrados con C.I. <strong>"{searchTerm}"</strong>. ¿Desea iniciar un nuevo registro?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartNewAlistamiento(searchTerm.trim())}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar nuevo con C.I. {searchTerm}</span>
                </button>
              </div>
            )}
          </div>

            {/* Barra de Leyenda de Estados de Taller y Conteo */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1 text-xs shrink-0 select-none">
              <span className="font-semibold text-zinc-500 text-[11px]">
                {filteredRecords.length} alistamiento{filteredRecords.length === 1 ? '' : 's'} registrado{filteredRecords.length === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <div className="flex items-center gap-1.5" title="Alistamientos cuya orden de trabajo en taller ya fue completada y entregada">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs"></span>
                  <span className="text-emerald-800">Orden Entregada (Fila Verde)</span>
                </div>
                <div className="flex items-center gap-1.5" title="Alistamientos con orden de trabajo iniciada o en proceso de mantenimiento en taller">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-2xs animate-pulse"></span>
                  <span className="text-amber-800">En Proceso en Taller (Fila Amarilla)</span>
                </div>
              </div>
            </div>

            {filteredRecords.length > 0 ? (
              <div className="flex-1 min-h-0 min-h-[260px] w-full bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden flex flex-col">
                <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden">
                <table className="w-full table-fixed text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-zinc-100 z-10 shadow-2xs">
                    <tr className="text-zinc-700 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-300 divide-x divide-zinc-200 select-none">
                      <th className="w-[3%] px-1 py-2 text-center text-zinc-500 font-mono">#</th>
                      <th className="w-[13%] px-2.5 py-2 truncate">Cliente</th>
                      <th className="w-[10%] px-2 py-2 truncate">Origen</th>
                      <th className="w-[10%] px-2 py-2 truncate">Sede</th>
                      <th className="w-[7.5%] px-1.5 py-2 text-center whitespace-nowrap">Fecha</th>
                      <th className="w-[14%] px-2 py-2 truncate">Motocicleta</th>
                      <th className="w-[12%] px-2 py-2 truncate">Servicios</th>
                      <th className="w-[8.5%] px-2 py-2 truncate">Técnico</th>
                      <th className="w-[6%] px-2 py-2 text-right whitespace-nowrap">Valor</th>
                      <th className="w-[7.5%] px-2 py-2 truncate">Factura</th>
                      <th className="w-[10%] px-1.5 py-2 text-center whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-800">
                    {paginatedRecords.map((record, i) => {
                      const idx = (currentPage - 1) * RECORDS_PER_PAGE + i;
                      const orderStatus = getRecordOrderStatus(record, effectiveOrders);

                      let rowBgClass = 'even:bg-zinc-50/40 hover:bg-blue-50/70 active:bg-blue-100/70 text-zinc-800';
                      let statusTooltip = `Haga clic en cualquier lado para abrir la ficha técnica de ${record.nombres} ${record.apellidos}`;

                      if (orderStatus === 'completed') {
                        rowBgClass = 'bg-emerald-50/75 hover:bg-emerald-100/80 active:bg-emerald-200/70 text-emerald-950';
                        statusTooltip = `[ORDEN ENTREGADA / COMPLETADA] Ficha técnica de ${record.nombres} ${record.apellidos}`;
                      } else if (orderStatus === 'in_progress') {
                        rowBgClass = 'bg-amber-50/75 hover:bg-amber-100/80 active:bg-amber-200/70 text-amber-950';
                        statusTooltip = `[MANTENIMIENTO EN PROCESO EN TALLER] Ficha técnica de ${record.nombres} ${record.apellidos}`;
                      }

                      return (
                        <tr
                          key={record.id}
                          onClick={() => handleOpenRecordDetail(record)}
                          className={`cursor-pointer transition-colors divide-x divide-zinc-200/70 select-none group ${rowBgClass}`}
                          title={statusTooltip}
                        >
                          {/* 1. # */}
                          <td className={`px-1 py-2 text-center font-mono text-[11px] ${orderStatus ? 'bg-transparent' : 'bg-zinc-50/50'}`}>
                            <div className="flex items-center justify-center gap-1">
                              {orderStatus === 'completed' && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-2xs" title="Orden entregada" />
                              )}
                              {orderStatus === 'in_progress' && (
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse shadow-2xs" title="En proceso en taller" />
                              )}
                              <span className={orderStatus === 'completed' ? 'text-emerald-700 font-bold' : orderStatus === 'in_progress' ? 'text-amber-800 font-bold' : 'text-zinc-400'}>
                                {idx + 1}
                              </span>
                            </div>
                          </td>

                          {/* 2. Cliente */}
                          <td className="px-2.5 py-2 truncate" title={`${record.nombres} ${record.apellidos} (C.I. ${record.cedulaRuc})`}>
                            <div className="flex flex-col truncate">
                              <span className="font-bold truncate text-xs text-zinc-900 group-hover:text-blue-600 transition-colors">
                                {record.nombres} {record.apellidos}
                              </span>
                              <span className="text-[10px] font-mono font-normal text-zinc-400 truncate">
                                C.I. {record.cedulaRuc}
                              </span>
                            </div>
                          </td>

                          {/* 3. Origen */}
                          <td className="px-2 py-2 text-zinc-600 truncate" title={record.origen}>
                            <span className="truncate block text-xs">{record.origen}</span>
                          </td>

                          {/* 4. Sede */}
                          <td className="px-2 py-2 text-zinc-700 truncate" title={record.sede}>
                            <span className="inline-block text-[11px] font-medium bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200/80 truncate max-w-full">
                              {record.sede}
                            </span>
                          </td>

                          {/* 5. Fecha */}
                          <td className="px-1.5 py-2 text-center whitespace-nowrap font-mono text-zinc-600 text-[11px]" title={record.fechaServicio}>
                            <div className="font-semibold text-zinc-800">{record.fechaServicio}</div>
                            {record.horaServicio && (
                              <div className="text-[10px] text-zinc-400">{record.horaServicio}</div>
                            )}
                          </td>

                          {/* 6. Motocicleta */}
                          <td className="px-2 py-2 truncate" title={`${record.modeloMarca} - Placa: ${record.placa || 'S/P'}`}>
                            <div className="flex flex-col truncate">
                              <span className="font-semibold text-xs text-zinc-800 truncate">
                                {record.modeloMarca || 'Modelo no esp.'}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 truncate">
                                <span className="font-bold text-zinc-700 bg-zinc-100 px-1 rounded">{record.placa || 'S/P'}</span>
                                <span>• {record.kilometraje || 0} km</span>
                              </div>
                            </div>
                          </td>

                          {/* 7. Servicios */}
                          <td className="px-2 py-2 truncate">
                            <div className="flex flex-wrap gap-1">
                              {record.serviciosRealizados.map((srv) => (
                                <span
                                  key={srv}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    srv === 'alistamiento_pdi'
                                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                      : srv === 'engrasado'
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                      : 'bg-purple-50 text-purple-800 border border-purple-200'
                                  }`}
                                >
                                  {srv === 'alistamiento_pdi'
                                    ? 'PDI'
                                    : srv === 'engrasado'
                                    ? 'Engrasado'
                                    : 'Mantenimiento'}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* 8. Técnico */}
                          <td className="px-2 py-2 text-zinc-700 truncate" title={record.tecnicoResponsable}>
                            <span className="truncate block text-xs font-medium">{record.tecnicoResponsable}</span>
                          </td>

                          {/* 9. Valor & Estado Contable */}
                          <td className="px-2 py-2 text-right font-mono whitespace-nowrap text-xs">
                            {isPdiOnlyRecord(record) ? (
                              <span className="text-zinc-400 font-bold text-center block">-</span>
                            ) : (
                              (() => {
                                const val = Number(record.valorServicio) || 0;
                                const pag = record.abono !== undefined ? Number(record.abono) : (Number(record.montoPagado) || 0);
                                const pend = record.saldoPendiente !== undefined ? Number(record.saldoPendiente) : Math.max(0, val - pag);
                                return (
                                  <div className="flex flex-col items-end leading-tight">
                                    <span className="font-bold text-zinc-900 text-xs">${val.toFixed(2)}</span>
                                    {pend > 0.01 ? (
                                      <span className="text-[10px] text-rose-600 font-black" title={`Pendiente: $${pend.toFixed(2)} (Abonado: $${pag.toFixed(2)})`}>
                                        Debe: ${pend.toFixed(2)}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-emerald-700 font-bold" title={`Pagado al 100% ($${pag.toFixed(2)})`}>
                                        Pagado
                                      </span>
                                    )}
                                  </div>
                                );
                              })()
                            )}
                          </td>

                          {/* 10. Factura */}
                          <td className="px-2 py-2 font-mono text-zinc-700 truncate text-[11px]" title={record.numeroFactura || record.numeroTicket || 'Ticket'}>
                            <span className="truncate block">{record.numeroFactura || record.numeroTicket || 'Ticket'}</span>
                          </td>

                          {/* 11. Acciones */}
                          <td className="px-1.5 py-2 text-center whitespace-nowrap">
                            <div className="inline-flex items-center justify-center gap-1">
                              {/* Botón de Dinero / Abono (Verde si está pagado, Rojo si falta abonar) */}
                              {(() => {
                                const val = Number(record.valorServicio) || 0;
                                const pag = record.abono !== undefined ? Number(record.abono) : (Number(record.montoPagado) || 0);
                                const pend = record.saldoPendiente !== undefined ? Number(record.saldoPendiente) : Math.max(0, val - pag);
                                const isPdi = isPdiOnlyRecord(record);
                                const isPaid = isPdi || val <= 0 || pend <= 0.01;

                                return (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenAbonoModal(record);
                                    }}
                                    className={`p-1 rounded-lg border transition-all cursor-pointer shadow-2xs ${
                                      isPaid
                                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
                                        : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-300 animate-pulse'
                                    }`}
                                    title={
                                      isPaid
                                        ? `Todo abonado ($${pag.toFixed(2)}). Clic para gestionar pagos o evidencias.`
                                        : `Falta abonar: $${pend.toFixed(2)} pendientes. Clic para registrar abono.`
                                    }
                                  >
                                    <DollarSign className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </button>
                                );
                              })()}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRecordDetail(record);
                                }}
                                className="px-1.5 py-0.5 text-[10px] font-bold bg-zinc-100 hover:bg-blue-600 hover:text-white text-zinc-700 rounded transition-colors cursor-pointer inline-flex items-center gap-0.5"
                                title="Ver Ficha Técnica"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Ficha</span>
                              </button>
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
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNewServiceForExisting(record);
                                }}
                                className="p-0.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                title="Nuevo Servicio subsecuente"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteRecord && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`¿Está seguro de eliminar el alistamiento de ${record.nombres} ${record.apellidos}?`)) {
                                      onDeleteRecord(record.id);
                                    }
                                  }}
                                  className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Eliminar Alistamiento"
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
                        Totales ({filteredRecords.length} registros):
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
                            <span className="text-blue-700">{statsMetrics.countPdi} PDI OK</span>
                            <span>•</span>
                            <span className="text-purple-700">{statsMetrics.countMantenimiento} Mantenimientos</span>
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
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-white border-t border-zinc-200 p-3 flex items-center justify-between shadow-sm z-10 shrink-0">
                  <div className="text-xs font-semibold text-zinc-600">
                    Mostrando {(currentPage - 1) * RECORDS_PER_PAGE + 1}-{Math.min(currentPage * RECORDS_PER_PAGE, filteredRecords.length)} de {filteredRecords.length} registros
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs flex items-center"
                    >
                      Anterior
                    </button>
                    <div className="flex items-center gap-1 hidden sm:flex px-1">
                      {(() => {
                        const maxVisible = 5;
                        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                        let end = Math.min(totalPages, start + maxVisible - 1);
                        if (end - start + 1 < maxVisible) {
                          start = Math.max(1, end - maxVisible + 1);
                        }
                        
                        const pages = [];
                        if (start > 1) {
                          pages.push(
                            <button key="1" type="button" onClick={() => setCurrentPage(1)} className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${currentPage === 1 ? 'bg-blue-600 text-white shadow-2xs' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}>1</button>
                          );
                          if (start > 2) pages.push(<span key="ellipsis1" className="text-zinc-400 text-xs font-bold tracking-wider px-0.5">...</span>);
                        }
                        for (let i = start; i <= end; i++) {
                          pages.push(
                            <button key={i} type="button" onClick={() => setCurrentPage(i)} className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${currentPage === i ? 'bg-blue-600 text-white shadow-2xs' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}>{i}</button>
                          );
                        }
                        if (end < totalPages) {
                          if (end < totalPages - 1) pages.push(<span key="ellipsis2" className="text-zinc-400 text-xs font-bold tracking-wider px-0.5">...</span>);
                          pages.push(
                            <button key={totalPages} type="button" onClick={() => setCurrentPage(totalPages)} className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${currentPage === totalPages ? 'bg-blue-600 text-white shadow-2xs' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}>{totalPages}</button>
                          );
                        }
                        return pages;
                      })()}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs flex items-center"
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
                <Bike className="w-8 h-8 text-zinc-300 mx-auto" />
                <h3 className="text-sm font-bold text-zinc-800">
                  No se encontraron alistamientos registrados
                </h3>
                <p className="text-xs text-zinc-500">
                  {searchTerm
                    ? 'Ningún registro coincide con los criterios de búsqueda especificados.'
                    : 'Aún no hay alistamientos registrados en esta sede. Inicia el primer registro ahora.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleStartNewAlistamiento(searchTerm)}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Registrar Nuevo Alistamiento</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VISTA: FORMULARIO DE ALISTAMIENTO (3 COLUMNAS)                         */}
      {/* ========================================================================= */}
      {currentViewMode === 'form' && (
        <div className="flex-1 min-h-0 w-full overflow-y-auto pr-1 pb-8">
          <form onSubmit={handleFinalSubmit} className="space-y-4 animate-fade-in">
          {/* ALERTA DE VALIDACIÓN (SI FALTAN CAMPOS) */}
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
          {/* LAYOUT ESCRITORIO: 3 COLUMNAS SIMÉTRICAS                              */}
          {/* ===================================================================== */}
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
                      title="Guardar este cliente en la base de datos para futuras consultas"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar</span>
                    </button>
                  </div>
                </div>

                {/* Cédula o RUC (Primerito) */}
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
                      title="Consultar número de Cédula o RUC"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isSearching ? 'Consultando...' : 'Consultar'}</span>
                    </button>
                  </div>
                  {searchFeedback && (
                    <p
                      className={`text-xs font-medium leading-tight p-2.5 rounded-xl border ${
                        searchFeedback.startsWith('✓')
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                          : 'text-amber-800 bg-amber-50 border-amber-200'
                      }`}
                    >
                      {searchFeedback}
                    </p>
                  )}
                </div>

                {/* Nombres (1 por fila) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    placeholder="Ejemplo: Juan Carlos"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-blue-600 focus:bg-white"
                    required
                  />
                </div>

                {/* Apellidos (1 por fila) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    placeholder="Ejemplo: Mendoza Zambrano"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-blue-600 focus:bg-white"
                    required
                  />
                </div>

                {/* Celulares en 2 columnas para optimizar espacio */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      Celular Principal *
                    </label>
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
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      Celular Opcional
                    </label>
                    <input
                      type="text"
                      value={formData.celular2}
                      onChange={(e) => setFormData({ ...formData, celular2: e.target.value })}
                      placeholder="Ejemplo: 0991234567"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-medium outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Correo Electrónico (1 por fila) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ejemplo: usuario.cliente99@gmail.com"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                {/* Dirección Domiciliaria (1 por fila) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Dirección Domiciliaria
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Ejemplo: Av. 10 de Agosto y Calle Bolivar #45"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                {/* Origen / Almacén */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-zinc-700">
                      Origen / Almacén *
                    </label>
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
            {/* COLUMNA 2: PASO 2 - DATOS DE LA MOTO (SOLO DATOS DE LA MOTO)     */}
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

                {/* Modelo y Marca (1 por fila) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
                    Modelo y Marca *
                  </label>
                  <input
                    type="text"
                    list="registered-brands-datalist"
                    value={formData.modeloMarca}
                    onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                    placeholder="Ejemplo: Thunder 200 / Pulsar NS 200"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-semibold outline-none focus:border-red-600 focus:bg-white"
                    required
                  />
                </div>

                {/* Placa (1 por fila) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase text-zinc-700">
                      Placa
                    </label>
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

                {/* Color de la Moto (1 por fila) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
                    Color de la Moto
                  </label>
                  <input
                    type="text"
                    value={formData.color || ''}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Ejemplo: Negro Mate / Rojo Racing"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-semibold outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>

                {/* Serie o Chasis (VIN) (1 por fila) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
                    Serie o Chasis (VIN)
                  </label>
                  <input
                    type="text"
                    value={formData.chasis}
                    onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                    placeholder="Ejemplo: 3SCBP123456789012"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-bold uppercase outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>

                {/* Kilometraje de Recepción (1 por fila) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5 flex items-center justify-between">
                    <span>Kilometraje de Recepción (Odómetro) *</span>
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
                        setFormData((prev) => ({
                          ...prev,
                          kilometraje: km,
                        }));
                      }}
                      placeholder="Ejemplo: 0 km"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-bold outline-none focus:border-red-600 focus:bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      KM
                    </span>
                  </div>
                </div>

                {/* Resumen decorativo del vehículo */}
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs space-y-1 text-zinc-600">
                  <div className="font-bold text-zinc-800">Estado de Identificación:</div>
                  <p className="text-[11px] text-zinc-500">
                    Asegúrese de verificar que el Chasis (VIN) coincida con la plaqueta física de la motocicleta.
                  </p>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* COLUMNA 3: PASO 3 - SERVICIO, ACEITE, COBRO & INSPECCIÓN          */}
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
                      <p className="text-[11px] text-zinc-400">Trabajos, aceite y facturación</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Paso 3
                  </span>
                </div>

                {/* ¿Qué se realizó? (Alistamiento PDI, Engrasado, Mantenimiento con bloqueo por historial) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-zinc-700">
                      ¿Qué se realizó? *
                    </label>
                    {isPdiBlocked && isEngrasadoBlocked && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        PDI & Engrasado previos
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      {
                        id: 'alistamiento_pdi' as ServiceActionType,
                        label: 'Alistamiento PDI',
                        isBlocked: isPdiBlocked,
                      },
                      {
                        id: 'engrasado' as ServiceActionType,
                        label: 'Engrasado',
                        isBlocked: isEngrasadoBlocked,
                      },
                      {
                        id: 'mantenimiento' as ServiceActionType,
                        label: 'Mantenimiento',
                        isBlocked: false,
                      },
                    ].map((srv) => {
                      const isSelected = formData.serviciosRealizados.includes(srv.id);

                      if (srv.isBlocked) {
                        return (
                          <div
                            key={srv.id}
                            title="Servicio ya completado previamente para este cliente / motocicleta"
                            className="px-2 py-2 rounded-xl text-[11px] font-bold border text-center bg-zinc-100/90 border-zinc-200 text-zinc-400 cursor-not-allowed select-none flex flex-col items-center justify-center gap-0.5"
                          >
                            <div className="flex items-center gap-1">
                              <Lock className="w-3 h-3 text-zinc-400" />
                              <span className="line-through opacity-70 truncate">{srv.label}</span>
                            </div>
                            <span className="text-[9px] font-semibold text-zinc-400">Ya realizado</span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => toggleServicio(srv.id)}
                          className={`px-2 py-2 rounded-xl text-[11px] font-bold border text-center transition-all cursor-pointer truncate flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          <span className="truncate">{srv.label}</span>
                          {isPdiBlocked && isEngrasadoBlocked && srv.id === 'mantenimiento' && (
                            <span className="text-[9px] font-bold text-blue-200">Requerido</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Técnico Responsable */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-zinc-700">
                      Técnico Responsable *
                    </label>
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
                      const techName = e.target.value;
                      const techObj = technicians.find((t) => t.name === techName);
                      setFormData({
                        ...formData,
                        tecnicoResponsable: techName,
                        tecnicoId: techObj?.id || '',
                      });
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-emerald-600 focus:bg-white"
                    required
                  >
                    <option value="">
                      {technicians.length === 0
                        ? '⚠️ Sin técnicos en este taller (Cree uno con + Nuevo Técnico)'
                        : 'Seleccione un técnico responsable...'}
                    </option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.workshopName || 'Taller'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha y Hora de Servicio (Debajo de Técnico Responsable) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Fecha de Servicio *</span>
                    </label>
                    <input
                      type="date"
                      value={formData.fechaServicio || todayStr}
                      onChange={(e) => setFormData({ ...formData, fechaServicio: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-semibold text-zinc-900 outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Hora de Servicio *</span>
                    </label>
                    <input
                      type="time"
                      value={formData.horaServicio || getCurrentTimeStr()}
                      onChange={(e) => setFormData({ ...formData, horaServicio: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-semibold text-zinc-900 outline-none focus:border-emerald-600 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Aceite: 3 datos seguidos en una fila (Estado | Nivel | Tipo) */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-zinc-700">
                      Control de Aceite
                    </label>
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
                        value={formData.nivelAceite || 'mineral'}
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
                        value={formData.tipoAceite || '10W-30'}
                        onChange={(e) => setFormData({ ...formData, tipoAceite: e.target.value })}
                        className="w-full px-2 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white"
                      >
                        <option value="10W-30">10W-30</option>
                        <option value="10W-40">10W-40</option>
                        <option value="15W-40">15W-40</option>
                        <option value="15W-50">15W-50</option>
                        <option value="20W-40">20W-40</option>
                        <option value="20W-50">20W-50</option>
                        <option value="25W-50">25W-50</option>
                        <option value="5W-30">5W-30</option>
                        <option value="5W-40">5W-40</option>
                        {customOilTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                        <option value="Sin Tipo">N/A</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Si se selecciona únicamente Alistamiento PDI: NO se muestran bloques de cobro ni método de pago */}
                {formData.serviciosRealizados.length === 1 && formData.serviciosRealizados[0] === 'alistamiento_pdi' ? (
                  <div className="bg-blue-50/80 border border-blue-200 p-3 rounded-xl flex items-center gap-2.5 text-xs text-blue-900 font-semibold shadow-2xs">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <span className="font-bold block">Alistamiento PDI de Fábrica / Concesionario</span>
                      <span className="text-[11px] text-blue-700 font-normal">
                        Servicio oficial de cortesía sin cobro al cliente (Cubierto por Garantía PDI de Entrega).
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Bloque de Cobro: Valor, Método de Pago, Abono y Crédito */
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-2.5 shadow-2xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-black uppercase text-emerald-900 mb-1">
                          Valor Servicio ($) *
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
                              saldoPendiente: Math.max(0, val - abonoVal),
                            });
                          }}
                          placeholder="0.00"
                          className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-sm font-mono font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-black uppercase text-emerald-900 mb-1">
                          Método de Pago
                        </label>
                        <select
                          value={formData.metodoPago === 'Crédito Directo' ? 'Crédito' : formData.metodoPago}
                          onChange={(e) => {
                            const newMetodo = e.target.value as AlistamientoFullRecord['metodoPago'];
                            const isCred = newMetodo === 'Crédito';
                            setFormData({
                              ...formData,
                              metodoPago: newMetodo,
                              esCredito: isCred,
                              abono: isCred ? 0 : formData.valorServicio,
                              montoPagado: isCred ? 0 : formData.valorServicio,
                              saldoPendiente: isCred ? formData.valorServicio : 0,
                            });
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Tarjeta">Tarjeta Déb/Créd</option>
                          <option value="Crédito">Crédito</option>
                          <option value="Mixto">Mixto</option>
                        </select>
                      </div>
                    </div>

                    {/* Fila Dinámica: Abono vs Crédito con Tiempo en Meses */}
                    {formData.metodoPago === 'Crédito' || formData.metodoPago === 'Crédito Directo' || formData.esCredito ? (
                      <div className="pt-2 space-y-2 border-t border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase text-blue-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            Crédito Activo
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                            Financiamiento Directo
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-black uppercase text-blue-900 mb-1">
                              Monto a Crédito ($)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.valorServicio !== '' ? Number(formData.valorServicio).toFixed(2) : '0.00'}
                              readOnly
                              className="w-full px-3 py-1.5 bg-blue-50/60 border border-blue-300 rounded-xl text-sm font-mono font-bold text-blue-900 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black uppercase text-blue-900 mb-1">
                              Tiempo (Meses)
                            </label>
                            <select
                              value={formData.mesesCredito || 3}
                              onChange={(e) => setFormData({ ...formData, mesesCredito: parseInt(e.target.value) || 3 })}
                              className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-xl text-xs font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                              <option value={1}>1 Mes</option>
                              <option value={2}>2 Meses</option>
                              <option value={3}>3 Meses</option>
                              <option value={6}>6 Meses</option>
                              <option value={9}>9 Meses</option>
                              <option value={12}>12 Meses</option>
                              <option value={18}>18 Meses</option>
                              <option value={24}>24 Meses</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                          <span className="font-bold text-amber-900">Total Pendiente por Cobrar:</span>
                          <span className="font-mono font-black text-amber-700 text-sm">
                            ${Number(formData.valorServicio || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Si NO es crédito: Abono y Saldo Pendiente */
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-black uppercase text-emerald-900">
                              Abono ($)
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  abono: formData.valorServicio,
                                  montoPagado: formData.valorServicio,
                                  saldoPendiente: 0,
                                });
                              }}
                              className="text-[10px] text-emerald-700 underline font-semibold cursor-pointer"
                            >
                              Total
                            </button>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.abono !== undefined ? formData.abono : formData.montoPagado}
                            onFocus={selectOnFocus}
                            onChange={(e) => {
                              const clean = cleanNumberInput(e.target.value);
                              const abonoVal = clean === '' ? 0 : parseFloat(clean);
                              const valServ = Number(formData.valorServicio || 0);
                              const pendiente = Math.max(0, valServ - abonoVal);
                              setFormData({
                                ...formData,
                                abono: clean,
                                montoPagado: clean,
                                saldoPendiente: pendiente,
                              });
                            }}
                            placeholder="0.00"
                            className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-sm font-mono font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                            Saldo Pendiente ($)
                          </label>
                          <div
                            className={`w-full px-3 py-1.5 rounded-xl border text-sm font-mono font-bold flex items-center justify-between ${
                              Number(formData.saldoPendiente ?? Math.max(0, Number(formData.valorServicio || 0) - Number((formData.abono ?? formData.montoPagado) || 0))) > 0
                                ? 'bg-amber-50 border-amber-300 text-amber-900'
                                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            }`}
                          >
                            <span>
                              ${Number(formData.saldoPendiente ?? Math.max(0, Number(formData.valorServicio || 0) - Number((formData.abono ?? formData.montoPagado) || 0))).toFixed(2)}
                            </span>
                            {Number(formData.saldoPendiente ?? Math.max(0, Number(formData.valorServicio || 0) - Number((formData.abono ?? formData.montoPagado) || 0))) > 0 ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-sans">
                                Pendiente
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-sans">
                                Pagado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Evidencia de Transferencia Bancaria (Solo visible si es Transferencia) */}
                    {(formData.metodoPago === 'Transferencia' || (formData.metodoPago as string)?.toLowerCase?.().includes('transferencia')) && (
                      <div className="pt-2 border-t border-emerald-200 space-y-1.5 animate-fade-in">
                        <label className="block text-[11px] font-black uppercase text-emerald-900 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-emerald-700" />
                            Comprobante / Evidencia de Transferencia Bancaria
                          </span>
                          {formData.evidenciaTransferencia && (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                              ✓ Comprobante cargado
                            </span>
                          )}
                        </label>
                        {formData.evidenciaTransferencia ? (
                          <div className="relative rounded-xl border border-emerald-300 bg-white p-2 flex items-center gap-3">
                            <a
                              href={formData.evidenciaTransferencia}
                              target="_blank"
                              rel="noreferrer"
                              className="w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 shrink-0 block"
                            >
                              <img
                                src={formData.evidenciaTransferencia}
                                alt="Comprobante de transferencia"
                                className="w-full h-full object-cover"
                              />
                            </a>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-zinc-900 truncate">Comprobante bancario registrado</p>
                              <p className="text-[10px] text-zinc-500">Clic en la imagen para abrir en tamaño completo</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, evidenciaTransferencia: '' }))}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Eliminar comprobante"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white rounded-xl cursor-pointer transition-all hover:bg-emerald-50/50">
                            <Camera className="w-5 h-5 text-emerald-600 mb-1" />
                            <span className="text-xs font-bold text-emerald-900">Subir foto o captura del comprobante</span>
                            <span className="text-[10px] text-zinc-500">JPG, PNG o foto del comprobante de transferencia</span>
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
                  </div>
                )}

                {/* Factura y Ticket (2 datos seguidos en una fila) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      N° Factura
                    </label>
                    <input
                      type="text"
                      value={formData.numeroFactura}
                      onChange={(e) => setFormData({ ...formData, numeroFactura: e.target.value })}
                      placeholder="001-002-..."
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-medium outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      N° Ticket Físico
                    </label>
                    <input
                      type="text"
                      value={formData.numeroTicket}
                      onChange={(e) => setFormData({ ...formData, numeroTicket: e.target.value })}
                      placeholder="TCK-2026-..."
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-medium outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Próximo Mantenimiento Sugerido */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-zinc-700">
                      Próximo Mantenimiento Sugerido
                    </label>
                    <span className="text-[10px] text-blue-600 font-bold">Editable</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.proximoMantenimientoKm || ''}
                      onFocus={selectOnFocus}
                      onChange={(e) => {
                        const clean = cleanNumberInput(e.target.value);
                        setFormData({
                          ...formData,
                          proximoMantenimientoKm: clean,
                        });
                      }}
                      placeholder="Ej: 1000"
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      KM
                    </span>
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Observaciones / Novedades
                  </label>
                  <textarea
                    rows={2}
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Detalles sobre entrega, torque de pernos, novedades..."
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium outline-none focus:border-emerald-600 focus:bg-white resize-none"
                  />
                </div>

                {/* Inspección Visual (Fotos reales de Evidencia de Entrega) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase text-zinc-700">
                      Inspección Visual (Fotos de Entrega)
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Fotos</span>
                    </button>
                  </div>

                  {formData.fotos.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {formData.fotos.map((fUrl, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-video rounded-lg overflow-hidden border border-zinc-200 group bg-black/5"
                          >
                            <img src={fUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              title="Eliminar foto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-1.5 border border-dashed border-emerald-400 hover:bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar más fotos desde este dispositivo</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-zinc-300 hover:border-emerald-500 rounded-xl p-3 text-center cursor-pointer transition-colors bg-zinc-50 hover:bg-emerald-50/50"
                    >
                      <Camera className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                      <span className="text-xs text-zinc-700 font-bold block">
                        Subir fotos desde este dispositivo o computadora
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        PNG, JPG, JPEG, WEBP o cualquier formato
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BOTONES INFERIORES EN ESCRITORIO: SOLO CANCELAR O GUARDAR             */}
          {/* ===================================================================== */}
          <div className="hidden lg:flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setValidationAlert(null);
                setEffectiveViewMode('list');
              }}
              className="px-6 py-2.5 border border-zinc-300 hover:bg-zinc-100 text-zinc-700 rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              Guardar
            </button>
          </div>

          {/* ===================================================================== */}
          {/* LAYOUT MÓVIL: WIZARD SECUENCIAL EN 3 PASOS CON TABS                   */}
          {/* ===================================================================== */}
          <div className="block lg:hidden space-y-4">
            {/* Tabs de Navegación Móvil */}
            <div className="grid grid-cols-3 gap-1 bg-zinc-100 p-1 rounded-xl">
              {[
                { s: 1, label: '1. Cliente' },
                { s: 2, label: '2. Moto' },
                { s: 3, label: '3. Servicio' },
              ].map((tab) => (
                <button
                  key={tab.s}
                  type="button"
                  onClick={() => setMobileStep(tab.s as 1 | 2 | 3)}
                  className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    mobileStep === tab.s
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenido Paso 1 Móvil */}
            {mobileStep === 1 && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-zinc-900">Paso 1: Datos del Cliente</h3>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">1 de 3</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveClientToDatabase}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="Guardar este cliente en la base de datos para futuras consultas"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Cliente</span>
                  </button>
                </div>

                <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-200 space-y-1.5">
                  <label className="block text-xs font-black uppercase text-blue-900">
                    Cédula o RUC *
                  </label>
                  <div className="flex gap-1.5">
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
                      placeholder="Ej: 2350999252 o RUC"
                      className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleConsultar()}
                      disabled={isSearching || !formData.cedulaRuc.trim()}
                      className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1"
                      title="Consultar número de Cédula o RUC"
                    >
                      <Search className="w-3 h-3" />
                      <span>{isSearching ? '...' : 'Consultar'}</span>
                    </button>
                  </div>
                  {searchFeedback && (
                    <p
                      className={`text-xs font-medium leading-tight p-2 rounded-lg border ${
                        searchFeedback.startsWith('✓')
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                          : 'text-amber-800 bg-amber-50 border-amber-200'
                      }`}
                    >
                      {searchFeedback}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium"
                    placeholder="Ej: Felix Rafael"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium"
                    placeholder="Ej: Gracia Guato"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      Celular Principal *
                    </label>
                    <input
                      type="text"
                      value={formData.celular1}
                      onChange={(e) => setFormData({ ...formData, celular1: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-medium"
                      placeholder="0982852456"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      Celular Opcional
                    </label>
                    <input
                      type="text"
                      value={formData.celular2}
                      onChange={(e) => setFormData({ ...formData, celular2: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-medium"
                      placeholder="0991234567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Origen / Almacén *
                  </label>
                  <select
                    value={formData.origen}
                    onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium"
                  >
                    {origins.map((orig) => (
                      <option key={orig} value={orig}>
                        {orig}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setValidationAlert(null);
                      setEffectiveViewMode('list');
                    }}
                    className="py-2.5 px-4 border border-zinc-300 text-zinc-700 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileStep(2)}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Contenido Paso 2 Móvil */}
            {mobileStep === 2 && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <h3 className="text-sm font-black text-zinc-900">Paso 2: Datos de la Moto</h3>
                  <span className="text-[10px] font-bold text-red-600">2 de 3</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Modelo y Marca *
                  </label>
                  <input
                    type="text"
                    list="registered-brands-datalist"
                    value={formData.modeloMarca}
                    onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
                    placeholder="Ej: Tundra r200"
                  />
                </div>

                {/* Placa Vehicular (Bloque independiente) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-zinc-700">
                      Placa
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, placa: 'EN TRÁMITE' })}
                      className="text-[10px] text-zinc-500 hover:text-zinc-800 underline cursor-pointer"
                    >
                      En trámite
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold uppercase"
                    placeholder="Ej: KX284T"
                  />
                </div>

                {/* Color de la Moto (Bloque independiente) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Color de la Moto
                  </label>
                  <input
                    type="text"
                    value={formData.color || ''}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
                    placeholder="Ej: Negro / Rojo / Azul / Blanco"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Serie o Chasis (VIN)
                  </label>
                  <input
                    type="text"
                    value={formData.chasis}
                    onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold uppercase"
                    placeholder="LBBP57008..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1 flex items-center justify-between">
                    <span>Kilometraje de Recepción (Odómetro) *</span>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {formData.kilometraje !== '' ? `${formData.kilometraje} KM` : '0 KM'}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kilometraje}
                    onFocus={selectOnFocus}
                    onChange={(e) => {
                      const km = cleanNumberInput(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        kilometraje: km,
                      }));
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-bold"
                    placeholder="0"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileStep(1)}
                    className="flex-1 py-2.5 border border-zinc-300 text-zinc-700 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileStep(3)}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Contenido Paso 3 Móvil */}
            {mobileStep === 3 && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <h3 className="text-sm font-black text-zinc-900">Paso 3: Servicio & Cobro</h3>
                  <span className="text-[10px] font-bold text-emerald-600">3 de 3</span>
                </div>

                {/* ¿Qué se realizó? Móvil */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-zinc-700">
                      ¿Qué se realizó? *
                    </label>
                    {isPdiBlocked && isEngrasadoBlocked && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        PDI & Engrasado previos
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      {
                        id: 'alistamiento_pdi' as ServiceActionType,
                        label: 'Alistamiento PDI',
                        isBlocked: isPdiBlocked,
                      },
                      {
                        id: 'engrasado' as ServiceActionType,
                        label: 'Engrasado',
                        isBlocked: isEngrasadoBlocked,
                      },
                      {
                        id: 'mantenimiento' as ServiceActionType,
                        label: 'Mantenimiento',
                        isBlocked: false,
                      },
                    ].map((srv) => {
                      const isSelected = formData.serviciosRealizados.includes(srv.id);

                      if (srv.isBlocked) {
                        return (
                          <div
                            key={srv.id}
                            title="Servicio ya completado previamente"
                            className="px-1.5 py-2 rounded-xl text-[10px] font-bold border text-center bg-zinc-100/90 border-zinc-200 text-zinc-400 cursor-not-allowed select-none flex flex-col items-center justify-center gap-0.5"
                          >
                            <div className="flex items-center gap-1">
                              <Lock className="w-3 h-3 text-zinc-400" />
                              <span className="line-through opacity-70 truncate">{srv.label}</span>
                            </div>
                            <span className="text-[8px] font-semibold text-zinc-400">Ya realizado</span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => toggleServicio(srv.id)}
                          className={`px-1.5 py-2 rounded-xl text-[10px] font-bold border text-center transition-all cursor-pointer truncate flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          <span className="truncate">{srv.label}</span>
                          {isPdiBlocked && isEngrasadoBlocked && srv.id === 'mantenimiento' && (
                            <span className="text-[8px] font-bold text-blue-200">Requerido</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Técnico Responsable *
                  </label>
                  <select
                    value={formData.tecnicoResponsable}
                    onChange={(e) => {
                      const techName = e.target.value;
                      const techObj = technicians.find((t) => t.name === techName);
                      setFormData({
                        ...formData,
                        tecnicoResponsable: techName,
                        tecnicoId: techObj?.id || '',
                      });
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="">
                      {technicians.length === 0
                        ? '⚠️ Sin técnicos registrados'
                        : 'Seleccione un técnico responsable...'}
                    </option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha y Hora de Servicio (Debajo de Técnico Responsable) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-600" />
                      <span>Fecha *</span>
                    </label>
                    <input
                      type="date"
                      value={formData.fechaServicio || todayStr}
                      onChange={(e) => setFormData({ ...formData, fechaServicio: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-600" />
                      <span>Hora *</span>
                    </label>
                    <input
                      type="time"
                      value={formData.horaServicio || getCurrentTimeStr()}
                      onChange={(e) => setFormData({ ...formData, horaServicio: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                {formData.serviciosRealizados.length === 1 && formData.serviciosRealizados[0] === 'alistamiento_pdi' ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                    <span className="text-xs text-blue-900 font-bold">
                      Alistamiento PDI es un servicio oficial previo a la venta. No genera cobro directo al cliente ($0.00).
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2.5 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-black uppercase text-emerald-900 mb-1">
                          Valor ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.valorServicio}
                          onFocus={selectOnFocus}
                          onChange={(e) => {
                            const clean = cleanNumberInput(e.target.value);
                            const val = clean === '' ? 0 : parseFloat(clean);
                            setFormData((prev) => ({
                              ...prev,
                              valorServicio: clean,
                              abono: prev.esCredito ? 0 : (Number(prev.abono ?? 0) > val ? clean : prev.abono),
                            }));
                          }}
                          placeholder="0.00"
                          className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase text-emerald-900 mb-1">
                          Método
                        </label>
                        <select
                          value={formData.metodoPago === 'Crédito Directo' ? 'Crédito' : formData.metodoPago}
                          onChange={(e) => {
                            const newMetodo = e.target.value as AlistamientoFullRecord['metodoPago'];
                            const isCred = newMetodo === 'Crédito';
                            setFormData((prev) => ({
                              ...prev,
                              metodoPago: newMetodo,
                              esCredito: isCred,
                              abono: isCred ? 0 : prev.valorServicio,
                              montoPagado: isCred ? 0 : prev.valorServicio,
                              saldoPendiente: isCred ? prev.valorServicio : 0,
                            }));
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold"
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Tarjeta">Tarjeta</option>
                          <option value="Crédito">Crédito</option>
                          <option value="Mixto">Mixto</option>
                        </select>
                      </div>
                    </div>

                    {/* Fila Dinámica: Abono vs Crédito con Tiempo en Meses (Móvil) */}
                    {formData.metodoPago === 'Crédito' || formData.metodoPago === 'Crédito Directo' || formData.esCredito ? (
                      <div className="pt-2 space-y-2 border-t border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase text-blue-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            Crédito Activo
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-500 font-bold">Plazo:</span>
                            <select
                              value={formData.mesesCredito || 3}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, mesesCredito: Number(e.target.value) || 3 }))
                              }
                              className="h-7 px-2 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-900 outline-none"
                            >
                              <option value={1}>1 mes</option>
                              <option value={2}>2 meses</option>
                              <option value={3}>3 meses</option>
                              <option value={6}>6 meses</option>
                              <option value={9}>9 meses</option>
                              <option value={12}>12 meses</option>
                              <option value={18}>18 meses</option>
                              <option value={24}>24 meses</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-black uppercase text-blue-900 mb-1">
                              Monto a Crédito ($)
                            </label>
                            <div className="h-8 px-2.5 bg-blue-50 border border-blue-300 rounded-lg flex items-center justify-between text-blue-900 text-xs font-black">
                              <span>Total</span>
                              <span>${Number(formData.valorServicio || 0).toFixed(2)}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-black uppercase text-amber-800 mb-1">
                              Pendiente ($)
                            </label>
                            <div className="h-8 px-2.5 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-amber-900 text-xs font-black">
                              <span>${Number(formData.valorServicio || 0).toFixed(2)}</span>
                              <span className="text-[9px] text-amber-700">Crédito</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-100">
                        <div>
                          <label className="block text-[11px] font-black uppercase text-emerald-900 mb-1">
                            Abono ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={Number(formData.valorServicio || 0)}
                            value={formData.abono ?? ''}
                            onFocus={selectOnFocus}
                            onChange={(e) => {
                              const clean = cleanNumberInput(e.target.value);
                              const val = clean === '' ? 0 : parseFloat(clean);
                              setFormData((prev) => ({
                                ...prev,
                                abono: clean,
                                montoPagado: clean,
                                saldoPendiente: Math.max(0, Number(prev.valorServicio || 0) - val),
                              }));
                            }}
                            placeholder="0.00"
                            className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-black uppercase text-zinc-500 mb-1">
                            Pendiente por Cobrar
                          </label>
                          <div className="h-8 px-2.5 bg-white border border-zinc-200 rounded-lg flex items-center justify-between text-xs font-mono font-black">
                            <span
                              className={
                                Math.max(0, Number(formData.valorServicio || 0) - Number(formData.abono ?? 0)) > 0
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }
                            >
                              ${Math.max(0, Number(formData.valorServicio || 0) - Number(formData.abono ?? 0)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Evidencia de Transferencia Bancaria Móvil (Solo visible si es Transferencia) */}
                    {(formData.metodoPago === 'Transferencia' || (formData.metodoPago as string)?.toLowerCase?.().includes('transferencia')) && (
                      <div className="pt-2 border-t border-emerald-200 space-y-1.5 animate-fade-in">
                        <label className="block text-[11px] font-black uppercase text-emerald-900 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Upload className="w-3.5 h-3.5 text-emerald-700" />
                            Comprobante de Transferencia
                          </span>
                          {formData.evidenciaTransferencia && (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                              ✓ Cargado
                            </span>
                          )}
                        </label>
                        {formData.evidenciaTransferencia ? (
                          <div className="relative rounded-xl border border-emerald-300 bg-white p-2 flex items-center gap-2">
                            <a
                              href={formData.evidenciaTransferencia}
                              target="_blank"
                              rel="noreferrer"
                              className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-200 shrink-0 block"
                            >
                              <img
                                src={formData.evidenciaTransferencia}
                                alt="Comprobante"
                                className="w-full h-full object-cover"
                              />
                            </a>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-zinc-900 truncate">Comprobante registrado</p>
                              <p className="text-[10px] text-zinc-500">Clic para ver</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, evidenciaTransferencia: '' }))}
                              className="p-1 text-rose-500 hover:text-rose-700 rounded-lg cursor-pointer"
                              title="Eliminar comprobante"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white rounded-xl cursor-pointer transition-all hover:bg-emerald-50/50">
                            <Camera className="w-5 h-5 text-emerald-600 mb-1" />
                            <span className="text-xs font-bold text-emerald-900">Subir comprobante de transferencia</span>
                            <span className="text-[10px] text-zinc-500">Foto o captura bancaria</span>
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
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-zinc-700">
                      Fotos de Entrega
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-emerald-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>+ Subir Foto</span>
                    </button>
                  </div>
                  {formData.fotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {formData.fotos.map((url, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden border">
                          <img src={url} alt="Foto" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(i)}
                            className="absolute top-0.5 right-0.5 bg-black/70 text-white p-0.5 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Próximo Mantenimiento Sugerido */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-zinc-700">
                      Próximo Mantenimiento Sugerido
                    </label>
                    <span className="text-[10px] text-blue-600 font-bold">Editable</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.proximoMantenimientoKm || ''}
                      onFocus={selectOnFocus}
                      onChange={(e) => {
                        const clean = cleanNumberInput(e.target.value);
                        setFormData({
                          ...formData,
                          proximoMantenimientoKm: clean,
                        });
                      }}
                      placeholder="Ej: 1000"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold outline-none focus:border-blue-600 focus:bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      KM
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    rows={2}
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Notas mecánicas..."
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setValidationAlert(null);
                      setEffectiveViewMode('list');
                    }}
                    className="py-2.5 px-4 border border-zinc-300 text-zinc-700 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar</span>
                  </button>
                </div>
              </div>
            )}
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
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Nombre Completo *
                </label>
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
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Especialidad
                </label>
                <input
                  type="text"
                  value={newTechData.specialty}
                  onChange={(e) => setNewTechData({ ...newTechData, specialty: e.target.value })}
                  placeholder="Ej: Mecánica Rápida & Mantenimiento"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Teléfono / Celular
                </label>
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
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">
                    Registrar Abono / Pago
                  </h3>
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

            {/* Resumen Financiero del Servicio */}
            {(() => {
              const valServ = Number(abonoModalRecord.valorServicio) || 0;
              const prevPagado = abonoModalRecord.abono !== undefined ? Number(abonoModalRecord.abono) : (Number(abonoModalRecord.montoPagado) || 0);
              const saldoActual = abonoModalRecord.saldoPendiente !== undefined ? Number(abonoModalRecord.saldoPendiente) : Math.max(0, valServ - prevPagado);
              const inputVal = parseFloat(abonoFormData.montoAbono) || 0;
              
              // Si es modo suma, el total pagado es prevPagado + inputVal; sino, es inputVal directo
              const nuevoTotalPagado = abonoFormData.esSuma
                ? Math.min(valServ, prevPagado + inputVal)
                : Math.min(valServ, inputVal);
              const nuevoSaldo = Math.max(0, valServ - nuevoTotalPagado);

              return (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center font-mono">
                    <div>
                      <span className="block text-[10px] text-zinc-500 uppercase font-sans font-bold">Valor Total</span>
                      <span className="text-sm font-black text-zinc-900">${valServ.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-zinc-500 uppercase font-sans font-bold">Cobrado Previo</span>
                      <span className="text-sm font-black text-emerald-700">${prevPagado.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-zinc-500 uppercase font-sans font-bold">Saldo Actual</span>
                      <span className={`text-sm font-black ${saldoActual > 0.01 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ${saldoActual.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Selector de Modo: Sumar Abono (Recomendado) vs Ajustar Total Acumulado */}
                  <div className="flex items-center justify-between p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-emerald-700" />
                      {abonoFormData.esSuma ? 'Modo: Sumar nuevo abono a lo ya cobrado' : 'Modo: Corregir total acumulado'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAbonoFormData((prev) => ({
                        ...prev,
                        esSuma: !prev.esSuma,
                        montoAbono: prev.esSuma ? String(nuevoTotalPagado) : (saldoActual > 0 ? String(saldoActual) : ''),
                      }))}
                      className="text-[10px] text-emerald-800 underline font-semibold hover:text-emerald-950 cursor-pointer"
                    >
                      {abonoFormData.esSuma ? 'Editar total directo' : 'Volver a modo suma'}
                    </button>
                  </div>

                  {/* Formulario de Abono */}
                  <form onSubmit={handleSaveAbono} className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-black uppercase text-zinc-700">
                          {abonoFormData.esSuma ? 'Monto a abonar hoy ($) *' : 'Total acumulado cobrado ($) *'}
                        </label>
                        {saldoActual > 0.01 && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setAbonoFormData((prev) => ({
                                  ...prev,
                                  esSuma: true,
                                  montoAbono: String(saldoActual),
                                }));
                              }}
                              className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold hover:bg-emerald-200 cursor-pointer"
                            >
                              Liquidar Saldo (${saldoActual.toFixed(2)})
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAbonoFormData((prev) => ({
                                  ...prev,
                                  esSuma: true,
                                  montoAbono: String((saldoActual / 2).toFixed(2)),
                                }));
                              }}
                              className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold hover:bg-blue-200 cursor-pointer"
                            >
                              50% (${(saldoActual / 2).toFixed(2)})
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={valServ > 0 ? valServ * 1.5 : 99999}
                          value={abonoFormData.montoAbono}
                          onFocus={selectOnFocus}
                          onChange={(e) => {
                            const val = cleanNumberInput(e.target.value);
                            setAbonoFormData((prev) => ({ ...prev, montoAbono: val }));
                          }}
                          placeholder="0.00"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-xl font-mono text-base font-bold text-zinc-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>

                      {/* Desglose Contable en Tiempo Real */}
                      <div className="mt-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1 font-mono text-[11px]">
                        <div className="flex items-center justify-between text-zinc-600 font-sans">
                          <span>Ya cobrado previamente:</span>
                          <span className="font-mono font-bold text-zinc-800">${prevPagado.toFixed(2)}</span>
                        </div>
                        {abonoFormData.esSuma && inputVal > 0 && (
                          <div className="flex items-center justify-between text-emerald-700 font-sans">
                            <span className="flex items-center gap-1 font-bold">
                              <Plus className="w-3 h-3" /> Este nuevo abono a sumar:
                            </span>
                            <span className="font-mono font-black text-emerald-800">+${inputVal.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t border-zinc-200 pt-1 flex items-center justify-between font-bold">
                          <span className="font-sans text-zinc-800">Nuevo Total Cobrado:</span>
                          <span className="text-emerald-700 font-black text-xs">${nuevoTotalPagado.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between font-bold">
                          <span className="font-sans text-zinc-800">Saldo Pendiente Restante:</span>
                          <span className={`font-black text-xs ${nuevoSaldo <= 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ${nuevoSaldo.toFixed(2)} {nuevoSaldo <= 0.01 ? '(¡100% Liquidado!)' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Método de Pago */}
                    <div>
                      <label className="block text-[11px] font-black uppercase text-zinc-700 mb-1">
                        Método / Tipo de Pago *
                      </label>
                      <select
                        value={abonoFormData.metodoPago}
                        onChange={(e) => {
                          const met = e.target.value as AlistamientoFullRecord['metodoPago'];
                          setAbonoFormData((prev) => ({ ...prev, metodoPago: met }));
                        }}
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
                      >
                        <option value="Efectivo">💵 Efectivo</option>
                        <option value="Transferencia">🏦 Transferencia Bancaria</option>
                        <option value="Tarjeta">💳 Tarjeta Débito / Crédito</option>
                        <option value="Crédito">📋 Crédito Directo</option>
                        <option value="Mixto">🔄 Mixto</option>
                      </select>
                    </div>

                    {/* Subida de Evidencia Fotográfica (SOLO SI ES TRANSFERENCIA) */}
                    {(abonoFormData.metodoPago === 'Transferencia' || abonoFormData.metodoPago?.toLowerCase?.().includes('transferencia')) && (
                      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 animate-fade-in">
                        <label className="block text-[11px] font-black uppercase text-blue-900 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-blue-700" />
                            Comprobante / Evidencia de Transferencia *
                          </span>
                          {abonoFormData.evidenciaTransferencia && (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                              ✓ Foto cargada
                            </span>
                          )}
                        </label>

                        {abonoFormData.evidenciaTransferencia ? (
                          <div className="relative rounded-xl border border-blue-300 bg-white p-2 flex items-center gap-3">
                            <a
                              href={abonoFormData.evidenciaTransferencia}
                              target="_blank"
                              rel="noreferrer"
                              className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 shrink-0 block relative"
                            >
                              <img
                                src={abonoFormData.evidenciaTransferencia}
                                alt="Comprobante"
                                className="w-full h-full object-cover"
                              />
                            </a>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-zinc-900 truncate">Comprobante guardado</p>
                              <p className="text-[10px] text-zinc-500">Clic en la imagen para ver en tamaño completo</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAbonoFormData((prev) => ({ ...prev, evidenciaTransferencia: '' }))}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Cambiar o eliminar imagen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white rounded-xl cursor-pointer transition-all hover:bg-blue-50/50">
                            <Camera className="w-6 h-6 text-blue-600 mb-1" />
                            <span className="text-xs font-bold text-blue-950">Subir foto o captura del comprobante</span>
                            <span className="text-[10px] text-zinc-500">JPG, PNG o foto desde el móvil</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const compressed = await compressImageBase64(file, 1000, 0.7);
                                  setAbonoFormData((prev) => ({ ...prev, evidenciaTransferencia: compressed }));
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {/* N° Factura / Ticket Opcional */}
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                        N° Factura o Comprobante (Opcional)
                      </label>
                      <input
                        type="text"
                        value={abonoFormData.numeroFactura}
                        onChange={(e) => setAbonoFormData((prev) => ({ ...prev, numeroFactura: e.target.value }))}
                        placeholder="Ej: 001-002-0004523"
                        className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-emerald-600"
                      />
                    </div>

                    {/* Botones de Acción */}
                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAbonoModalRecord(null)}
                        className="flex-1 py-2.5 border border-zinc-300 rounded-xl font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar Abono</span>
                      </button>
                    </div>
                  </form>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Lista de sugerencias de marcas registradas */}
      <datalist id="registered-brands-datalist">
        {registeredBrands.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
    </div>
  );
};
