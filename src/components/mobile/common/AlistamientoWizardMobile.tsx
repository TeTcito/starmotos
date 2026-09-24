// src/components/mobile/common/AlistamientoWizardMobile.tsx
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
} from 'lucide-react';
import {
  AlistamientoFullRecord,
  AlistamientoFormData,
  Technician,
  ServiceActionType,
  Workshop,
  TallerClient,
  TallerOrder,
} from '../../../types/customer';
import {
  querySriMock,
  getStoredClients,
  saveStoredClients,
  getStoredFullAlistamientos,
  getRegisteredBrands,
  getStoredOrders,
} from '../../../data/mockMultiRoleData';
import { compressImageBase64 } from '../../../utils/imageCompressor';
import { cleanNumberInput, selectOnFocus } from '../../../utils/numberUtils';
import { getMediaFromIndexedDB } from '../../../services/mediaStorage';
import { matchRecordToWorkshop, getRecordTimestamp, getRecordOrderStatus } from '../../common/AlistamientoWizard';

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

export const isPdiOnlyRecord = (record: AlistamientoFullRecord): boolean => {
  const services = record.serviciosRealizados || [];
  const hasPdi = services.includes('alistamiento_pdi');
  const hasOtherPaidServices = services.some((s) => s === 'mantenimiento' || s === 'engrasado');
  if (hasPdi && !hasOtherPaidServices) return true;
  return Number(record.valorServicio || 0) === 0 && Number(record.montoPagado || 0) === 0 && hasPdi;
};

export const AlistamientoWizardMobile: React.FC<Props> = ({
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

  // Referencia para selector de archivos
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Identificar si la sede actual es Matriz Central de forma resiliente
  const effectiveIsMatriz = Boolean(
    isMatriz ||
    defaultSedeId === 'matriz-la-mana' ||
    defaultSedeId === 'sede-matriz' ||
    (defaultSede && defaultSede.toLowerCase().includes('matriz'))
  );

  // Búsqueda y Filtro de Sede en el listado móvil
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

  // Órdenes de trabajo para colorear tarjetas móviles (verde suave si entregada, amarillo suave si en proceso)
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterPayment !== 'all') count++;
    if (filterDateRange !== 'all') count++;
    if (sortBy !== 'recientes') count++;
    return count;
  }, [filterPayment, filterDateRange, sortBy]);

  const handleResetFilters = () => {
    setFilterPayment('all');
    setFilterDateRange('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('recientes');
  };

  // Registro seleccionado para ver detalle en Ficha Técnica
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<AlistamientoFullRecord | null>(null);
  const [detailFormData, setDetailFormData] = useState<AlistamientoFormData | null>(null);
  const [detailSuccessToast, setDetailSuccessToast] = useState<string | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'cliente' | 'moto' | 'servicio'>('cliente');

  // Paso para formulario wizard de nuevo alistamiento (1: Cliente, 2: Moto, 3: Servicio)
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

  // Fecha de hoy por defecto en formato YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Hora actual por defecto en formato HH:mm
  const getCurrentTimeStr = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // Estado del formulario para nuevo registro
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
    evidenciaTransferencia: '',
    observaciones: '',
    proximoMantenimientoKm: '',
    fotos: [],
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

    if (onSaveRecord) {
      onSaveRecord(updatedRecord);
    }

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
      `Estimado/a ${clientName}, le saludamos desde StarMotos. Le compartimos la información de su ficha técnica y alistamiento.`
    );
    return `https://wa.me/${fullNumber}?text=${message}`;
  };

  // Filtrado de alistamientos existentes por Sede, búsqueda, estado de pago, fechas y ordenamiento
  const filteredRecords = useMemo(() => {
    const base = recentRecords.filter((r) => {
      // 1. Si no es Matriz, restringir estrictamente a la sede asignada
      if (!effectiveIsMatriz && defaultSedeId) {
        const matchesSede = matchRecordToWorkshop(r, defaultSedeId, workshops);
        if (!matchesSede) return false;
      } else if (selectedWorkshopFilter !== 'all') {
        const matchesWs = matchRecordToWorkshop(r, selectedWorkshopFilter, workshops);
        if (!matchesWs) return false;
      }

      // 2. Filtro por término de búsqueda
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

  // Historial completo conocido (combinando recentRecords con localStorage de alistamientos)
  const allKnownRecords = useMemo(() => {
    const stored = getStoredFullAlistamientos();
    const map = new Map<string, AlistamientoFullRecord>();
    recentRecords.forEach((r) => map.set(r.id, r));
    stored.forEach((r) => {
      if (!map.has(r.id)) map.set(r.id, r);
    });
    return Array.from(map.values());
  }, [recentRecords]);

  // Historial previo del cliente o motocicleta (según Cédula/RUC o Chasis o Placa)
  const clientHistoricalRecords = useMemo(() => {
    const cedula = formData.cedulaRuc.trim().toLowerCase();
    const chasis = formData.chasis.trim().toLowerCase();
    const placa = formData.placa.trim().toLowerCase();

    if (!cedula && !chasis && !placa) return [];

    return allKnownRecords.filter((rec) => {
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
  }, [formData.id, formData.cedulaRuc, formData.chasis, formData.placa, allKnownRecords]);

  // 1. ¿Ya se realizó alistamiento PDI previamente para este cliente/moto?
  const hasPdiDone = useMemo(() => {
    return clientHistoricalRecords.some((r) => r.serviciosRealizados?.includes('alistamiento_pdi'));
  }, [clientHistoricalRecords]);

  // 2. ¿Ya se realizó engrasado previamente para este cliente/moto?
  const hasEngrasadoDone = useMemo(() => {
    return clientHistoricalRecords.some((r) => r.serviciosRealizados?.includes('engrasado'));
  }, [clientHistoricalRecords]);

  // Flujo Secuencial Obligatorio:
  // Paso 1: Alistamiento PDI (bloqueado si ya se realizó)
  const isPdiBlocked = hasPdiDone;
  // Paso 2: Engrasado (bloqueado si ya se realizó)
  const isEngrasadoBlocked = hasEngrasadoDone;
  // Paso 3: Mantenimiento (bloqueado si ya se hizo PDI pero aún NO ha realizado el Engrasado)
  const isMantenimientoBlocked = hasPdiDone && !hasEngrasadoDone;

  // Sincronizar dinámicamente qué servicios pueden estar marcados según la etapa secuencial
  useEffect(() => {
    setFormData((prev) => {
      let updated = [...prev.serviciosRealizados];
      let changed = false;

      // Etapa B: Ya tiene PDI previo pero NO engrasado -> Paso 2 Engrasado OBLIGATORIO
      if (hasPdiDone && !hasEngrasadoDone) {
        if (updated.length !== 1 || updated[0] !== 'engrasado') {
          updated = ['engrasado'];
          changed = true;
        }
      }
      // Etapa C: Ya completó Engrasado previo -> Paso 3 Mantenimiento OBLIGATORIO
      else if (hasEngrasadoDone) {
        if (updated.length !== 1 || updated[0] !== 'mantenimiento') {
          updated = ['mantenimiento'];
          changed = true;
        }
      }
      // Etapa A: Primera vez (sin PDI previo) -> Asegurar al menos alistamiento_pdi
      else {
        if (updated.length === 0) {
          updated = ['alistamiento_pdi'];
          changed = true;
        }
      }

      if (!changed) return prev;

      return {
        ...prev,
        serviciosRealizados: updated,
      };
    });
  }, [hasPdiDone, hasEngrasadoDone]);

  // Consultar Cédula o RUC
  const handleConsultar = (idToSearch?: string) => {
    const cleanId = (idToSearch || formData.cedulaRuc).trim();
    if (!cleanId) return;

    setIsSearching(true);
    setSearchFeedback(null);

    // 1. Buscar en historial de alistamientos de esta sede
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
        sede: selectedWorkshopFilter !== 'all' ? prev.sede : (existingRec.sede || prev.sede),
        sedeId: selectedWorkshopFilter !== 'all' ? prev.sedeId : (existingRec.sedeId || prev.sedeId),
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
        sede: selectedWorkshopFilter !== 'all' ? prev.sede : (existingClient.workshopName || prev.sede),
        sedeId: selectedWorkshopFilter !== 'all' ? prev.sedeId : (existingClient.workshopId || prev.sedeId),
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

  // Iniciar nuevo alistamiento
  const handleStartNewAlistamiento = (initialCedula?: string) => {
    const cedula = initialCedula?.trim() || '';

    // Si hay una sede seleccionada en el filtro exterior (distinta de 'all'), pre-seleccionarla automáticamente
    const preselectedWs =
      effectiveIsMatriz && selectedWorkshopFilter !== 'all' && workshops && workshops.length > 0
        ? workshops.find((w) => w.id === selectedWorkshopFilter)
        : null;
    const initialSede = preselectedWs ? preselectedWs.name : defaultSede;
    const initialSedeId = preselectedWs ? preselectedWs.id : defaultSedeId;

    setFormData({
      id: '',
      atendidoPor: defaultAtendidoPor,
      sede: initialSede,
      sedeId: initialSedeId,
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
      evidenciaTransferencia: '',
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
    const prevServicios = Array.isArray(record.serviciosRealizados) ? record.serviciosRealizados : [];
    let nextServicios: ServiceActionType[] = ['engrasado'];
    if (prevServicios.includes('engrasado')) {
      nextServicios = ['mantenimiento'];
    } else if (prevServicios.includes('alistamiento_pdi')) {
      nextServicios = ['engrasado'];
    } else {
      nextServicios = ['mantenimiento'];
    }

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
      serviciosRealizados: nextServicios,
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
      valorServicio: '',
      montoPagado: '',
      abono: '',
      saldoPendiente: '',
      esCredito: false,
      mesesCredito: 3,
      metodoPago: 'Efectivo',
      evidenciaTransferencia: '',
      observaciones: `Servicio subsecuente. Cliente C.I. ${record.cedulaRuc}.`,
      proximoMantenimientoKm: '',
      fotos: [],
      createdAt: '',
    });
    setSearchFeedback(`✓ Datos de ${record.nombres} ${record.apellidos} y moto precargados.`);
    setValidationAlert(null);
    setMobileStep(1);
    setEffectiveViewMode('form');
  };

  // Abrir registro existente en detalle de Ficha Técnica (precarga completa con todos los campos)
  const handleOpenRecordDetail = (record: AlistamientoFullRecord) => {
    setSelectedRecordForDetail(record);
    setDetailFormData({
      ...record,
      celular1: record.celular1 || '',
      celular2: record.celular2 || '',
      email: record.email || '',
      direccion: record.direccion || '',
      color: record.color || '',
      numeroMotor: record.numeroMotor || '',
      ramv: record.ramv || '',
      year: record.year || new Date().getFullYear(),
      aceite: record.aceite || 'con_aceite',
      nivelAceite: record.nivelAceite || 'optimo',
      tipoAceite: record.tipoAceite || 'Katana 20W50',
      numeroFactura: record.numeroFactura || '',
      numeroTicket: record.numeroTicket || '',
      observaciones: record.observaciones || '',
      proximoMantenimientoKm: record.proximoMantenimientoKm || '',
      fotos: record.fotos || [],
      abono: record.abono !== undefined ? record.abono : (record.montoPagado || 0),
      saldoPendiente:
        record.saldoPendiente !== undefined
          ? record.saldoPendiente
          : Math.max(0, (Number(record.valorServicio) || 0) - (Number(record.abono ?? record.montoPagado) || 0)),
      evidenciaTransferencia: record.evidenciaTransferencia || record.comprobantePagoUrl || '',
    });
    setDetailSuccessToast(null);
    setDetailActiveTab('cliente');

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
      evidenciaTransferencia: detailFormData.evidenciaTransferencia || '',
      comprobantePagoUrl: detailFormData.evidenciaTransferencia || '',
    };
    setSelectedRecordForDetail(securedDetail);
    setDetailFormData(securedDetail);
    if (onSaveRecord) {
      onSaveRecord(securedDetail);
    }
    setDetailSuccessToast('✓ Ficha técnica actualizada correctamente.');
    setTimeout(() => setDetailSuccessToast(null), 3000);
  };

  // Toggle de servicios en la ficha técnica
  const toggleDetailServicio = (servicio: ServiceActionType) => {
    if (!detailFormData) return;
    const current = detailFormData.serviciosRealizados || [];
    const exists = current.includes(servicio);
    let updated: ServiceActionType[];
    if (exists) {
      if (current.length === 1) return;
      updated = current.filter((s) => s !== servicio);
    } else {
      updated = [...current, servicio];
    }
    setDetailFormData({
      ...detailFormData,
      serviciosRealizados: updated,
    });
  };

  // Eliminar foto en detalle
  const handleRemoveDetailPhoto = (index: number) => {
    if (!detailFormData) return;
    setDetailFormData({
      ...detailFormData,
      fotos: (detailFormData.fotos || []).filter((_, i) => i !== index),
    });
  };

  // Toggle de servicios en formulario de nuevo registro (con bloqueo por flujo secuencial)
  const toggleServicio = (servicio: ServiceActionType) => {
    if (servicio === 'alistamiento_pdi' && isPdiBlocked) return;
    if (servicio === 'engrasado' && isEngrasadoBlocked) return;
    if (servicio === 'mantenimiento' && isMantenimientoBlocked) return;

    // Si PDI está completado y engrasado aún no, engrasado es obligatorio
    if (hasPdiDone && !hasEngrasadoDone && servicio === 'engrasado') {
      return;
    }

    // Si engrasado ya está completado, mantenimiento es obligatorio
    if (hasEngrasadoDone && servicio === 'mantenimiento') {
      return;
    }

    setFormData((prev) => {
      const exists = prev.serviciosRealizados.includes(servicio);
      let updatedServicios: ServiceActionType[];
      if (exists) {
        if (prev.serviciosRealizados.length === 1) return prev;
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

  // Subir archivos reales desde el dispositivo (comprimidos)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const compressed = await compressImageBase64(file);
      if (compressed) {
        if (selectedRecordForDetail) {
          setDetailFormData((prev) =>
            prev ? { ...prev, fotos: [...(prev.fotos || []), compressed] } : prev
          );
        } else {
          setFormData((prev) => ({
            ...prev,
            fotos: [...prev.fotos, compressed],
          }));
        }
      }
    }
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

  // Envío final del registro
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
      evidenciaTransferencia: formData.evidenciaTransferencia || '',
      comprobantePagoUrl: formData.evidenciaTransferencia || '',
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

    setEffectiveViewMode('list');
    setSearchTerm('');
    setSearchFeedback(null);
  };

  return (
    <div className="w-full flex flex-col min-h-0 space-y-3">
      {/* ========================================================================= */}
      {/* 1. DETALLE DE FICHA TÉCNICA (MODO LIMPIO MÓVIL CON TODOS LOS BLOQUES)     */}
      {/* ========================================================================= */}
      {currentViewMode === 'list' && selectedRecordForDetail && detailFormData && (
        <form
          onSubmit={handleSaveRecordDetail}
          className="w-full flex flex-col gap-2.5 animate-fade-in -mt-1.5"
        >
          {/* Encabezado Ficha Técnica */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-200 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-black text-zinc-900 tracking-tight leading-tight truncate">
                    Ficha técnica
                  </h2>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    ✓ COMPLETADO
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono truncate mt-0.5">
                  <span className="font-semibold text-zinc-700 truncate">
                    {detailFormData.nombres} {detailFormData.apellidos}
                  </span>
                  <span>•</span>
                  <span className="shrink-0">C.I. {detailFormData.cedulaRuc}</span>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas (Iconos) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Abonar / Registrar Pago */}
              {!(detailFormData.serviciosRealizados?.length === 1 && detailFormData.serviciosRealizados[0] === 'alistamiento_pdi') && (
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
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 border ${
                    (detailFormData.saldoPendiente !== undefined
                      ? Number(detailFormData.saldoPendiente)
                      : Math.max(0, (Number(detailFormData.valorServicio) || 0) - (Number(detailFormData.abono ?? detailFormData.montoPagado) || 0))) <= 0.01
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 animate-pulse'
                  }`}
                  title="Abonar / Registrar Pago"
                >
                  <DollarSign className="w-4 h-4" />
                </button>
              )}

              {/* Imprimir */}
              <button
                type="button"
                onClick={() => window.print()}
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 border border-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Imprimir Ficha Técnica"
              >
                <Printer className="w-4 h-4" />
              </button>

              {/* Nuevo Servicio */}
              <button
                type="button"
                onClick={() => {
                  handleNewServiceForExisting(detailFormData);
                  setSelectedRecordForDetail(null);
                  setDetailFormData(null);
                }}
                className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 border border-indigo-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Nuevo Servicio con este cliente"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Guardar */}
              <button
                type="submit"
                className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="Guardar"
              >
                <Save className="w-4 h-4" />
              </button>

              {/* Eliminar */}
              {onDeleteRecord && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Está seguro de eliminar la ficha de ${detailFormData.nombres} ${detailFormData.apellidos}?`
                      )
                    ) {
                      onDeleteRecord(detailFormData.id);
                      setSelectedRecordForDetail(null);
                      setDetailFormData(null);
                    }
                  }}
                  className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white active:scale-95 text-red-600 border border-red-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Eliminar Ficha Técnica"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="h-5 w-px bg-zinc-200 mx-0.5" />

              {/* Regresar */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRecordForDetail(null);
                  setDetailFormData(null);
                }}
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 border border-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Regresar a la Lista"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-600" />
              </button>
            </div>
          </div>

          {/* Toast de Éxito */}
          {detailSuccessToast && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-in shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{detailSuccessToast}</span>
            </div>
          )}

          {/* 3 Pestañas para alternar entre campos */}
          <div className="flex rounded-xl bg-zinc-100 p-1 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setDetailActiveTab('cliente')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                detailActiveTab === 'cliente'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Cliente</span>
            </button>
            <button
              type="button"
              onClick={() => setDetailActiveTab('moto')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                detailActiveTab === 'moto'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <Bike className="w-3.5 h-3.5 shrink-0" />
              <span>Motocicleta</span>
            </button>
            <button
              type="button"
              onClick={() => setDetailActiveTab('servicio')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                detailActiveTab === 'servicio'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 shrink-0" />
              <span>Servicio</span>
            </button>
          </div>

          {/* Contenido según la Pestaña Activa */}
          <div className="w-full">
            {/* 1. CAMPO: CLIENTE (TODOS LOS BLOQUES) */}
            {detailActiveTab === 'cliente' && (
              <div className="space-y-2.5 animate-fade-in pt-1 pb-2">
                {/* Bloque: Identificación personal */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Identificación personal</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Cédula o RUC *</label>
                    <input
                      type="text"
                      value={detailFormData.cedulaRuc}
                      readOnly
                      className="w-full px-2.5 py-1.5 bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-800 outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Nombres *</label>
                    <input
                      type="text"
                      value={detailFormData.nombres}
                      onChange={(e) => setDetailFormData({ ...detailFormData, nombres: e.target.value })}
                      required
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Apellidos *</label>
                    <input
                      type="text"
                      value={detailFormData.apellidos}
                      onChange={(e) => setDetailFormData({ ...detailFormData, apellidos: e.target.value })}
                      required
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700">Teléfono / Celular 1 *</label>
                      {detailFormData.celular1 && (
                        <a
                          href={getCleanWhatsappUrl(detailFormData.celular1, `${detailFormData.nombres} ${detailFormData.apellidos}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={detailFormData.celular1}
                      onChange={(e) => setDetailFormData({ ...detailFormData, celular1: e.target.value })}
                      required
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-semibold text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div className="pt-2 border-t border-zinc-100 space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">Sede / Taller</label>
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
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">Origen / Procedencia</label>
                      <input
                        type="text"
                        value={detailFormData.origen}
                        onChange={(e) => setDetailFormData({ ...detailFormData, origen: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* 2. CAMPO: MOTOCICLETA (TODOS LOS BLOQUES) */}
            {detailActiveTab === 'moto' && (
              <div className="space-y-3 animate-fade-in pt-1 pb-3">
                {/* Bloque: Datos de la Motocicleta */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <Bike className="w-3.5 h-3.5 text-blue-600" />
                    <span>Datos de la Motocicleta</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Modelo y Marca *</label>
                    <input
                      type="text"
                      list="registered-brands-datalist"
                      value={detailFormData.modeloMarca}
                      onChange={(e) => setDetailFormData({ ...detailFormData, modeloMarca: e.target.value })}
                      required
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[11px] font-bold text-zinc-700">Placa Vehicular</label>
                        <button
                          type="button"
                          onClick={() => setDetailFormData({ ...detailFormData, placa: 'SIN PLACA' })}
                          className="text-[10px] text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          S/P
                        </button>
                      </div>
                      <input
                        type="text"
                        value={detailFormData.placa}
                        onChange={(e) =>
                          setDetailFormData({ ...detailFormData, placa: e.target.value.toUpperCase() })
                        }
                        placeholder="SIN PLACA"
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-bold text-zinc-900 uppercase outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Color de la Motocicleta</label>
                      <input
                        type="text"
                        value={detailFormData.color || ''}
                        onChange={(e) => setDetailFormData({ ...detailFormData, color: e.target.value })}
                        placeholder="Ej: Negro / Rojo"
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs text-zinc-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Serie o Chasis (VIN) *</label>
                    <input
                      type="text"
                      value={detailFormData.chasis}
                      onChange={(e) =>
                        setDetailFormData({ ...detailFormData, chasis: e.target.value.toUpperCase() })
                      }
                      required
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-bold text-zinc-900 uppercase outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5 flex items-center justify-between">
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
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. CAMPO: SERVICIO & COBRO (TODOS LOS BLOQUES) */}
            {detailActiveTab === 'servicio' && (
              <div className="space-y-3 animate-fade-in pt-1 pb-3">
                {/* Bloque 1: Servicios Ejecutados (Con selector interactivo) */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                      <Wrench className="w-3.5 h-3.5 text-blue-600" />
                      <span>¿Qué servicios se realizaron? *</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'alistamiento_pdi' as ServiceActionType, label: 'Alistamiento PDI' },
                      { id: 'engrasado' as ServiceActionType, label: 'Engrasado' },
                      { id: 'mantenimiento' as ServiceActionType, label: 'Mantenimiento' },
                    ].map((srv) => {
                      const isSelected = detailFormData.serviciosRealizados?.includes(srv.id);
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => toggleDetailServicio(srv.id)}
                          className={`px-1.5 py-2 rounded-xl text-[10px] font-bold border text-center transition-all cursor-pointer truncate ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          <span className="truncate">{srv.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Banner PDI si aplica */}
                  {detailFormData.serviciosRealizados?.length === 1 && detailFormData.serviciosRealizados[0] === 'alistamiento_pdi' && (
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-xs text-blue-900 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Alistamiento PDI oficial de cortesía ($0.00 al cliente / Garantía de Fábrica).</span>
                    </div>
                  )}
                </div>

                {/* Bloque 2: Técnico, Aceite & Atención (Idéntico a Desktop) */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    <span>Técnico & Aceite</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Técnico Responsable</label>
                    <select
                      value={detailFormData.tecnicoResponsable}
                      onChange={(e) => {
                        const tName = e.target.value;
                        const tObj = technicians.find((t) => t.name === tName);
                        setDetailFormData({
                          ...detailFormData,
                          tecnicoResponsable: tName,
                          tecnicoId: tObj?.id || '',
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600"
                    >
                      <option value="">
                        {technicians.length === 0
                          ? '⚠️ Sin técnicos registrados'
                          : 'Seleccione un técnico responsable...'}
                      </option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.workshopName || 'Taller'})
                        </option>
                      ))}
                      {detailFormData.tecnicoResponsable && !technicians.some((t) => t.name === detailFormData.tecnicoResponsable) && (
                        <option value={detailFormData.tecnicoResponsable}>{detailFormData.tecnicoResponsable}</option>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 mb-0.5">Tipo de Aceite</label>
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
                      <label className="block text-[10px] font-bold text-zinc-700 mb-0.5">Viscosidad / Grado</label>
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

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 mb-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <span>Fecha de Servicio</span>
                      </label>
                      <input
                        type="date"
                        value={detailFormData.fechaServicio || ''}
                        onChange={(e) => setDetailFormData({ ...detailFormData, fechaServicio: e.target.value })}
                        className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-700 mb-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-600" />
                        <span>Hora de Servicio</span>
                      </label>
                      <input
                        type="time"
                        value={detailFormData.horaServicio || ''}
                        onChange={(e) => setDetailFormData({ ...detailFormData, horaServicio: e.target.value })}
                        className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloque 3: Liquidación Financiera, Cobro y Precios */}
                {!(detailFormData.serviciosRealizados?.length === 1 && detailFormData.serviciosRealizados[0] === 'alistamiento_pdi') && (
                  <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                    <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Liquidación Financiera & Cobro</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Valor Servicio ($) *</label>
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
                          className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Método de Pago</label>
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
                          className="w-full px-2 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900 outline-none focus:border-blue-600 cursor-pointer"
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Tarjeta">Tarjeta</option>
                          <option value="Crédito">Crédito</option>
                          <option value="Mixto">Mixto</option>
                        </select>
                      </div>
                    </div>

                    {/* Crédito Activo vs Abono */}
                    {detailFormData.metodoPago === 'Crédito' || detailFormData.metodoPago === 'Crédito Directo' || detailFormData.esCredito ? (
                      <div className="pt-1.5 space-y-1.5 border-t border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase text-blue-900 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                            Crédito Activo (Financiamiento Directo)
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-zinc-500 font-bold">Plazo:</span>
                            <select
                              value={detailFormData.mesesCredito || 3}
                              onChange={(e) => setDetailFormData({ ...detailFormData, mesesCredito: parseInt(e.target.value) || 3 })}
                              className="px-1.5 py-0.5 bg-white border border-blue-300 rounded text-xs font-bold text-blue-900 outline-none"
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
                            <div className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-mono font-bold text-blue-900">
                              ${Number(detailFormData.valorServicio || 0).toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Pendiente por Cobrar ($)</label>
                            <div className="px-2.5 py-1.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-900 flex justify-between items-center">
                              <span>${Number(detailFormData.saldoPendiente ?? detailFormData.valorServicio ?? 0).toFixed(2)}</span>
                              <span className="text-[9px] text-amber-700 uppercase font-black">Deuda</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100">
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="block text-[10px] font-bold text-emerald-800">Abonado / Pagado ($)</label>
                            <button
                              type="button"
                              onClick={() => {
                                const valServ = detailFormData.valorServicio || 0;
                                setDetailFormData({
                                  ...detailFormData,
                                  abono: valServ,
                                  montoPagado: valServ,
                                  saldoPendiente: 0,
                                });
                              }}
                              className="text-[10px] text-emerald-700 underline font-bold cursor-pointer"
                            >
                              Total
                            </button>
                          </div>
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
                            className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-900 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Pendiente ($)</label>
                          <div className="px-2.5 py-1.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-900 flex justify-between items-center">
                            <span>
                              ${Number(detailFormData.saldoPendiente ?? Math.max(0, Number(detailFormData.valorServicio || 0) - Number(detailFormData.abono ?? detailFormData.montoPagado ?? 0))).toFixed(2)}
                            </span>
                            {Number(detailFormData.saldoPendiente ?? Math.max(0, Number(detailFormData.valorServicio || 0) - Number(detailFormData.abono ?? detailFormData.montoPagado ?? 0))) > 0 ? (
                              <span className="text-[9px] px-1 rounded bg-amber-200 text-amber-900 font-sans">
                                Saldo
                              </span>
                            ) : (
                              <span className="text-[9px] px-1 rounded bg-emerald-200 text-emerald-900 font-sans">
                                Pagado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Subida de Evidencia Fotográfica (SOLO SI ES TRANSFERENCIA) */}
                    {(detailFormData.metodoPago === 'Transferencia' || detailFormData.metodoPago?.toLowerCase?.().includes('transferencia')) && (
                      <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 animate-fade-in mt-2">
                        <label className="block text-[10px] font-black uppercase text-blue-900 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-blue-700" />
                            Comprobante / Evidencia de Transferencia *
                          </span>
                          {detailFormData.evidenciaTransferencia && (
                            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                              ✓ Foto cargada
                            </span>
                          )}
                        </label>

                        {detailFormData.evidenciaTransferencia ? (
                          <div className="relative rounded-lg border border-blue-300 bg-white p-2 flex items-center gap-2.5">
                            <a
                              href={detailFormData.evidenciaTransferencia}
                              target="_blank"
                              rel="noreferrer"
                              className="w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 shrink-0 block relative"
                            >
                              <img
                                src={detailFormData.evidenciaTransferencia}
                                alt="Comprobante"
                                className="w-full h-full object-cover"
                              />
                            </a>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-zinc-900 truncate">Comprobante guardado</p>
                              <p className="text-[10px] text-zinc-500">Toca para ver en grande</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDetailFormData({ ...detailFormData, evidenciaTransferencia: '' })}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Cambiar o eliminar imagen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white rounded-lg cursor-pointer transition-all hover:bg-blue-50/50">
                            <Camera className="w-5 h-5 text-blue-600 mb-0.5" />
                            <span className="text-xs font-bold text-blue-950">Subir foto o captura del comprobante</span>
                            <span className="text-[10px] text-zinc-500">JPG, PNG o foto de cámara</span>
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

                {/* Evidencia de Transferencia para la Ficha */}
                {detailFormData.evidenciaTransferencia && (
                  <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-blue-100 text-xs font-bold text-blue-900 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Comprobante de Pago por Transferencia</span>
                      </div>
                      <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                        {detailFormData.metodoPago || 'Transferencia'}
                      </span>
                    </div>
                    <div className="flex justify-center p-2 bg-zinc-50 rounded-lg border border-zinc-200">
                      <a
                        href={detailFormData.evidenciaTransferencia}
                        target="_blank"
                        rel="noreferrer"
                        className="block max-w-full"
                      >
                        <img
                          src={detailFormData.evidenciaTransferencia}
                          alt="Comprobante Bancario"
                          className="max-h-56 rounded-lg shadow-xs object-contain border border-zinc-200 mx-auto"
                        />
                      </a>
                    </div>
                  </div>
                )}

                {/* Bloque 5: Facturación & Próximo Mantenimiento */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Facturación & Mantenimiento</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">N° Factura</label>
                      <input
                        type="text"
                        value={detailFormData.numeroFactura || ''}
                        onChange={(e) => setDetailFormData({ ...detailFormData, numeroFactura: e.target.value })}
                        placeholder="001-002-..."
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">N° Ticket Físico</label>
                      <input
                        type="text"
                        value={detailFormData.numeroTicket || ''}
                        onChange={(e) => setDetailFormData({ ...detailFormData, numeroTicket: e.target.value })}
                        placeholder="TCK-2026-..."
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-bold text-zinc-700">Próximo Mantenimiento Sugerido</label>
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
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                        KM
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bloque 6: Observaciones Mecánicas del Taller */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Observaciones Mecánicas del Taller</span>
                  </div>
                  <textarea
                    rows={2}
                    value={detailFormData.observaciones || ''}
                    onChange={(e) => setDetailFormData({ ...detailFormData, observaciones: e.target.value })}
                    placeholder="Novedades mecánicas, torque de pernos, sugerencias..."
                    className="w-full px-2.5 py-1.5 bg-zinc-50 focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs text-zinc-900 outline-none transition-all resize-none"
                  />
                </div>

                {/* Bloque 7: Fotos de Entrega e Inspección Visual */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>Fotos e Inspección Visual ({detailFormData.fotos?.length || 0})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Subir Foto</span>
                    </button>
                  </div>

                  {detailFormData.fotos && detailFormData.fotos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {detailFormData.fotos.map((url, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-200 shadow-2xs bg-zinc-100">
                          <img
                            src={url}
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDetailPhoto(idx)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all cursor-pointer"
                            title="Eliminar foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="py-4 border-2 border-dashed border-zinc-200 hover:border-blue-400 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-zinc-50/50"
                    >
                      <Camera className="w-6 h-6 text-zinc-400 mb-1" />
                      <span className="text-xs font-semibold text-zinc-600">Sin fotos adjuntas</span>
                      <span className="text-[10px] text-zinc-400">Toca aquí para agregar fotos de la moto</span>
                    </div>
                  )}
                </div>

                {/* Historial de Abonos / Pagos Registrados */}
                {selectedRecordForDetail?.historialAbonos && selectedRecordForDetail.historialAbonos.length > 0 && (
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-blue-100 text-xs font-bold text-blue-900 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Historial de Abonos ({selectedRecordForDetail.historialAbonos.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {selectedRecordForDetail.historialAbonos.map((ab, idx) => (
                        <div key={ab.id || idx} className="bg-white/80 rounded-lg p-2 border border-blue-100 flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-blue-600 font-bold">#{idx + 1} — {ab.fecha}{ab.hora ? ` ${ab.hora}` : ''}</span>
                            <span className="text-xs font-bold text-emerald-700">${Number(ab.monto).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-600">
                              <CreditCard className="w-2.5 h-2.5" />
                              {ab.metodoPago}
                            </span>
                            <span className={`text-[10px] font-bold font-mono ${Number(ab.saldoRestante) > 0.01 ? 'text-rose-600' : 'text-emerald-700'}`}>
                              Saldo: ${Number(ab.saldoRestante).toFixed(2)}
                            </span>
                          </div>
                          {ab.registradoPor && (
                            <span className="text-[9px] text-zinc-400">Por: {ab.registradoPor}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer de Acciones Ficha Técnica */}
          <div className="pt-1.5 border-t border-zinc-200 flex items-center justify-between gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedRecordForDetail(null);
                setDetailFormData(null);
              }}
              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="whitespace-nowrap">Volver</span>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleNewServiceForExisting(detailFormData);
                  setSelectedRecordForDetail(null);
                  setDetailFormData(null);
                }}
                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-black active:scale-95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Nuevo Servicio</span>
              </button>

              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs whitespace-nowrap shrink-0"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Guardar</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 2. VISTA: LISTA DE ALISTAMIENTO (CON BLOQUES DE PRECIOS ADAPTADOS A MÓVIL) */}
      {/* ========================================================================= */}
      {currentViewMode === 'list' && !selectedRecordForDetail && (
        <div className="w-full flex flex-col gap-3 animate-fade-in">
          {/* Título: Solo 'Alistamiento' */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <Wrench className="w-4.5 h-4.5" />
              </div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight leading-tight">
                Alistamiento
              </h2>
            </div>
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-mono">
              {recentRecords.length} registros
            </span>
          </div>

          {/* Barra de Herramientas: [+ Nuevo] + [Barra de Búsqueda Aumentada] + [Filtro de Sedes] */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Botón "+ Nuevo" al lado izquierdo del buscador */}
            <button
              type="button"
              onClick={() => handleStartNewAlistamiento(searchTerm.trim())}
              className="h-11 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all shrink-0"
              title="Iniciar nuevo alistamiento"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo</span>
            </button>

            {/* Barra de Búsqueda Aumentada */}
            <div className="relative flex-1 flex items-center bg-white hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 border border-zinc-300 rounded-xl transition-all shadow-2xs h-11 px-3 gap-2">
              <Search className="w-4 h-4 text-blue-600 shrink-0" />
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
                placeholder="Buscar cliente, CI, placa o chasis..."
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-zinc-100 cursor-pointer shrink-0 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Botón Filtros Interactivos Móvil */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`h-11 px-2.5 rounded-xl border flex items-center justify-center gap-1 font-bold text-xs transition-all shadow-2xs cursor-pointer shrink-0 ${
                isFilterOpen || activeFilterCount > 0
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
              }`}
              title="Filtros avanzados"
            >
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Botón de Filtro al lado derecho de la barra de búsqueda (Solo Matriz) */}
            {effectiveIsMatriz && workshops && workshops.length > 0 && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  className={`h-11 px-3 border rounded-xl flex items-center justify-center gap-1 font-bold text-xs transition-all shadow-2xs cursor-pointer ${
                    selectedWorkshopFilter !== 'all'
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                  }`}
                  title="Filtrar por Sede / Taller"
                >
                  <Filter className="w-4 h-4 text-current" />
                  {selectedWorkshopFilter !== 'all' && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                </button>
                <select
                  value={selectedWorkshopFilter}
                  onChange={(e) => handleSelectWorkshopFilter(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Filtrar por Sede"
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
          </div>

          {/* Panel Desplegable de Filtros Móvil */}
          {isFilterOpen && (
            <div className="bg-zinc-50 border border-blue-200 rounded-xl p-3 shadow-xs space-y-3 shrink-0 animate-fade-in">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-bold text-zinc-900 uppercase">Filtros</span>
                  <span className="text-[10px] text-zinc-500 font-semibold">
                    ({filteredRecords.length})
                  </span>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* 1. Estado de Pago */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pago</span>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'con_saldo', label: 'Con Saldo' },
                    { id: 'pagados', label: 'Pagados' },
                    { id: 'pdi', label: 'PDI ($0)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFilterPayment(item.id as any)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold border text-center transition-all truncate cursor-pointer ${
                        filterPayment === item.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Rango de Fechas */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Fecha</span>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: 'today', label: 'Hoy' },
                    { id: 'this_week', label: 'Semana' },
                    { id: 'this_month', label: 'Mes' },
                    { id: 'custom', label: 'Rango' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFilterDateRange(item.id as any)}
                      className={`px-1.5 py-1 rounded-lg text-[11px] font-bold border text-center transition-all truncate cursor-pointer ${
                        filterDateRange === item.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {filterDateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div>
                      <label className="block text-[9px] text-zinc-500 font-bold">Desde</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-1.5 py-1 bg-white border border-zinc-300 rounded text-[11px] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-zinc-500 font-bold">Hasta</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-1.5 py-1 bg-white border border-zinc-300 rounded text-[11px] font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Ordenamiento */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ordenar por</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-bold text-zinc-800 outline-none"
                >
                  <option value="recientes">📅 Más recientes</option>
                  <option value="antiguos">📅 Más antiguos</option>
                  <option value="cliente_asc">👤 Cliente (A - Z)</option>
                  <option value="cliente_desc">👤 Cliente (Z - A)</option>
                  <option value="modelo_asc">🏍️ Modelo (A - Z)</option>
                  <option value="modelo_desc">🏍️ Modelo (Z - A)</option>
                  <option value="mayor_valor">💰 Mayor valor</option>
                  <option value="mayor_saldo">⏳ Mayor saldo</option>
                </select>
              </div>
            </div>
          )}

          {/* Chips de Filtros Activos Móvil */}
          {!isFilterOpen && activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1 shrink-0 pt-0.5">
              <span className="text-[10px] font-bold text-zinc-400">Filtros:</span>
              {filterPayment !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  <span>
                    {filterPayment === 'con_saldo'
                      ? 'Con Saldo'
                      : filterPayment === 'pagados'
                      ? 'Pagados'
                      : 'PDI'}
                  </span>
                  <button type="button" onClick={() => setFilterPayment('all')} className="hover:text-blue-950">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {filterDateRange !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  <span>
                    {filterDateRange === 'today'
                      ? 'Hoy'
                      : filterDateRange === 'this_week'
                      ? 'Semana'
                      : filterDateRange === 'this_month'
                      ? 'Mes'
                      : 'Rango'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterDateRange('all');
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="hover:text-blue-950"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {sortBy !== 'recientes' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  <span>
                    {sortBy === 'antiguos'
                      ? 'Antiguos'
                      : sortBy.startsWith('cliente')
                      ? 'Cliente'
                      : sortBy.startsWith('modelo')
                      ? 'Modelo'
                      : sortBy === 'mayor_valor'
                      ? 'Mayor valor'
                      : 'Mayor saldo'}
                  </span>
                  <button type="button" onClick={() => setSortBy('recientes')} className="hover:text-blue-950">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          )}

          {/* Bloques de Precios y Estadísticas Adaptados a Móvil (2x2 Compacto) */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {/* Bloque 1: Ingresos Cobrados */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-[10px] font-black uppercase tracking-wider">Ingresos Cobrados</span>
                <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1">
                <div className="text-base sm:text-lg font-black font-mono text-emerald-900 leading-tight">
                  ${statsMetrics.totalRecaudado.toFixed(2)}
                </div>
                <span className="text-[9px] font-semibold text-emerald-700">Abonos liquidados</span>
              </div>
            </div>

            {/* Bloque 2: Pendientes por Cobrar */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-amber-800">
                <span className="text-[10px] font-black uppercase tracking-wider">Por Cobrar</span>
                <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center text-amber-700">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1">
                <div className="text-base sm:text-lg font-black font-mono text-amber-900 leading-tight">
                  ${statsMetrics.totalPendiente.toFixed(2)}
                </div>
                <span className="text-[9px] font-semibold text-amber-700">
                  {statsMetrics.countConSaldo > 0 ? `${statsMetrics.countConSaldo} con saldo` : 'Al día / Sin deuda'}
                </span>
              </div>
            </div>

            {/* Bloque 3: Total Facturado en Servicios */}
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-blue-800">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Facturado</span>
                <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-blue-700">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1">
                <div className="text-base sm:text-lg font-black font-mono text-blue-900 leading-tight">
                  ${statsMetrics.totalFacturado.toFixed(2)}
                </div>
                <span className="text-[9px] font-semibold text-blue-700">Volumen servicios</span>
              </div>
            </div>

            {/* Bloque 4: Operaciones en Taller */}
            <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-purple-800">
                <span className="text-[10px] font-black uppercase tracking-wider">Operaciones</span>
                <div className="w-5 h-5 rounded-md bg-purple-100 flex items-center justify-center text-purple-700">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1">
                <div className="text-base sm:text-lg font-black text-purple-900 leading-tight">
                  {statsMetrics.totalOperaciones} <span className="text-xs font-bold text-purple-700">motos</span>
                </div>
                <span className="text-[9px] font-semibold text-purple-700">
                  {statsMetrics.countPdi} PDI • {statsMetrics.countMantenimiento} Mant.
                </span>
              </div>
            </div>
          </div>

          {/* Sugerencia si escribe una cédula no encontrada */}
          {searchTerm.trim().length >= 8 && filteredRecords.length === 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-center justify-between gap-2 animate-slide-in">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  No hay registros con C.I. <strong>"{searchTerm}"</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleStartNewAlistamiento(searchTerm.trim())}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Registrar</span>
              </button>
            </div>
          )}

          {/* Listado Móvil: Tarjetas de 3 módulos compactas */}
          {/* Barra de Leyenda Móvil */}
          <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-zinc-500 select-none">
            <span>{filteredRecords.length} alistamientos</span>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="inline-flex items-center gap-1 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs"></span>
                <span>Entregado</span>
              </span>
              <span className="inline-flex items-center gap-1 text-amber-800">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-2xs animate-pulse"></span>
                <span>En taller</span>
              </span>
            </div>
          </div>

          {filteredRecords.length > 0 ? (
            <div className="flex flex-col space-y-2">
              {filteredRecords.map((record) => {
                const orderStatus = getRecordOrderStatus(record, effectiveOrders);
                let cardBgClass = 'bg-white border-zinc-200 hover:border-blue-400 active:bg-blue-50/50';
                if (orderStatus === 'completed') {
                  cardBgClass = 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-400 active:bg-emerald-100/60 border-l-4 border-l-emerald-500';
                } else if (orderStatus === 'in_progress') {
                  cardBgClass = 'bg-amber-50/70 border-amber-300 hover:border-amber-400 active:bg-amber-100/60 border-l-4 border-l-amber-500';
                }

                return (
                  <div
                    key={record.id}
                    onClick={() => handleOpenRecordDetail(record)}
                    className={`${cardBgClass} border rounded-xl p-2.5 shadow-2xs transition-all cursor-pointer space-y-1.5 select-none`}
                  >
                    {/* MÓDULO 1: Cliente & Sede (sin numeración) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-zinc-900 truncate leading-tight">
                            {record.nombres} {record.apellidos}
                          </h4>
                          {orderStatus === 'completed' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                              Entregado
                            </span>
                          )}
                          {orderStatus === 'in_progress' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                              En Taller
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-0.5">
                          <span className="bg-zinc-100 px-1 py-0.2 rounded font-semibold text-zinc-700">
                            C.I. {record.cedulaRuc}
                          </span>
                          <span>•</span>
                          <span className="truncate text-zinc-500">{record.sede}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                    </div>

                  {/* MÓDULO 2: Motocicleta & Servicios */}
                  <div className="bg-zinc-50/80 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 border border-zinc-100">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-800 truncate">
                        <Bike className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="truncate">{record.modeloMarca || 'Modelo no esp.'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 mt-0.5">
                        <span className="font-bold text-zinc-700 bg-white px-1 py-0.2 rounded border border-zinc-200">
                          {record.placa || 'S/P'}
                        </span>
                        <span>• {record.kilometraje || 0} km</span>
                      </div>
                    </div>

                    {/* Badges de Servicios */}
                    <div className="flex flex-wrap gap-1 justify-end shrink-0 max-w-[48%]">
                      {record.serviciosRealizados.map((srv) => (
                        <span
                          key={srv}
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            srv === 'alistamiento_pdi'
                              ? 'bg-blue-100/80 text-blue-800 border border-blue-200/60'
                              : srv === 'engrasado'
                              ? 'bg-amber-100/80 text-amber-800 border border-amber-200/60'
                              : 'bg-purple-100/80 text-purple-800 border border-purple-200/60'
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
                  </div>

                  {/* MÓDULO 3: Fecha, Facturado & Contacto */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-100">
                    <div className="flex items-center gap-1 text-zinc-500 font-mono text-[10px]">
                      <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span>{record.fechaServicio}{record.horaServicio ? ` ${record.horaServicio}` : ''}</span>
                      {record.tecnicoResponsable && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-600 truncate max-w-[85px] font-sans">
                            {record.tecnicoResponsable.split(' ')[0]}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Botón de Abonar con indicador de color (Verde = Pagado / Rojo = Saldo Pendiente) */}
                      {(() => {
                        const valServ = Number(record.valorServicio) || 0;
                        const pagado = record.abono !== undefined ? Number(record.abono) : (Number(record.montoPagado) || 0);
                        const saldoPendiente = record.saldoPendiente !== undefined ? Number(record.saldoPendiente) : Math.max(0, valServ - pagado);
                        const isPdi = isPdiOnlyRecord(record);
                        const isPaid = isPdi || saldoPendiente <= 0.01;

                        if (isPdi) return null;

                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAbonoModal(record);
                            }}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 animate-pulse'
                            }`}
                            title={isPaid ? 'Completamente abonado. Clic para ver / modificar abono' : `Saldo pendiente: $${saldoPendiente.toFixed(2)}. Clic para abonar`}
                          >
                            <DollarSign className="w-3 h-3 shrink-0" />
                            {isPaid ? (
                              <span className="font-mono">Abonado</span>
                            ) : (
                              <span className="font-mono font-black text-rose-800">-${saldoPendiente.toFixed(2)}</span>
                            )}
                          </button>
                        );
                      })()}

                      {record.celular1 && (
                        <a
                          href={getCleanWhatsappUrl(record.celular1, `${record.nombres} ${record.apellidos}`)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          title="Contactar por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {isPdiOnlyRecord(record) ? (
                        <span className="text-zinc-400 font-bold">-</span>
                      ) : (
                        (() => {
                          const val = Number(record.valorServicio) || 0;
                          const pag = record.abono !== undefined ? Number(record.abono) : (Number(record.montoPagado) || 0);
                          const pend = record.saldoPendiente !== undefined ? Number(record.saldoPendiente) : Math.max(0, val - pag);
                          return (
                            <div className="flex flex-col items-end leading-none text-right">
                              <span className="font-mono font-black text-zinc-900 text-xs">
                                ${val.toFixed(2)}
                              </span>
                              {pend > 0.01 ? (
                                <span className="text-[9px] font-mono font-black text-rose-600">
                                  Debe ${pend.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-[9px] font-sans font-bold text-emerald-700">
                                  Pagado
                                </span>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          ) : (
            <div className="py-10 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-300">
              <UserCheck className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-500">
                No se encontraron registros de alistamiento
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VISTA: FORMULARIO NUEVO REGISTRO (WIZARD SECUENCIAL EN 3 PASOS)       */}
      {/* ========================================================================= */}
      {currentViewMode === 'form' && (
        <form onSubmit={handleFinalSubmit} className="space-y-3 animate-fade-in">
          {/* ALERTA DE VALIDACIÓN */}
          {validationAlert && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-xl shadow-xs flex items-start justify-between gap-2 animate-slide-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-900">{validationAlert.title}</h4>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Por favor complete:{' '}
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

          {/* Wizard Tabs Móvil */}
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
                className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  mobileStep === tab.s
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contenido Paso 1 Móvil: Cliente */}
          {mobileStep === 1 && (
            <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-zinc-900">Paso 1: Datos del Cliente</h3>
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

              {/* Cédula o RUC */}
              <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-200 space-y-1.5">
                <label className="block text-[11px] font-black uppercase text-blue-900">
                  Cédula o RUC *
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
                    placeholder="Ejemplo: 1723456789"
                    className="flex-1 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleConsultar()}
                    disabled={isSearching || !formData.cedulaRuc.trim()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{isSearching ? '...' : 'Buscar'}</span>
                  </button>
                </div>
                {searchFeedback && (
                  <p
                    className={`text-[10.5px] font-medium leading-tight p-2 rounded-lg border ${
                      searchFeedback.startsWith('✓')
                        ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                        : 'text-amber-800 bg-amber-50 border-amber-200'
                    }`}
                  >
                    {searchFeedback}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Nombres *</label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    placeholder="Ejemplo: Juan Carlos"
                    required
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Apellidos *</label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    placeholder="Ejemplo: Mendoza Zambrano"
                    required
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Celular 1 *</label>
                  <input
                    type="tel"
                    value={formData.celular1}
                    onChange={(e) => setFormData({ ...formData, celular1: e.target.value })}
                    placeholder="Ejemplo: 0987654321"
                    required
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Celular 2 (Opcional)</label>
                  <input
                    type="tel"
                    value={formData.celular2 || ''}
                    onChange={(e) => setFormData({ ...formData, celular2: e.target.value })}
                    placeholder="Ejemplo: 0991234567"
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ejemplo: usuario.cliente99@gmail.com"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Dirección Domiciliaria</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Ejemplo: Av. 10 de Agosto y Calle Bolivar #45"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              {/* Sede / Taller (Arriba de Origen) */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5 flex items-center justify-between">
                  <span>Sede / Taller *</span>
                  {effectiveIsMatriz && (
                    <span className="text-[9px] text-blue-600 font-semibold normal-case">Red Matriz</span>
                  )}
                </label>
                {effectiveIsMatriz && workshops && workshops.length > 0 ? (
                  <select
                    value={formData.sedeId || workshops.find((w) => w.name === formData.sede)?.id || defaultSedeId}
                    onChange={(e) => {
                      const chosenId = e.target.value;
                      const sObj = workshops.find((w) => w.id === chosenId);
                      setFormData({
                        ...formData,
                        sedeId: chosenId,
                        sede: sObj ? sObj.name : formData.sede,
                      });
                    }}
                    className="w-full px-2.5 py-1.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs font-bold text-blue-900 outline-none focus:border-blue-600 focus:bg-white"
                  >
                    {workshops.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-2.5 py-1.5 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-800 truncate">
                    {formData.sede || defaultSede}
                  </div>
                )}
              </div>

              {/* Origen / Almacén (Abajo de Sede) */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-[11px] font-bold text-zinc-700">Origen / Almacén *</label>
                  <button
                    type="button"
                    onClick={() => setShowAddOriginModal(true)}
                    className="text-[10px] text-blue-600 font-bold"
                  >
                    + Nuevo Almacén
                  </button>
                </div>
                <select
                  value={formData.origen}
                  onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium"
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
                  className="py-2 px-3 border border-zinc-300 text-zinc-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStep(2)}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Siguiente: Moto</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Contenido Paso 2 Móvil: Moto */}
          {mobileStep === 2 && (
            <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <h3 className="text-xs font-black text-zinc-900">Paso 2: Datos de la Moto</h3>
                <span className="text-[10px] font-bold text-red-600">2 de 3</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Modelo y Marca *</label>
                  <input
                    type="text"
                    list="registered-brands-datalist"
                    value={formData.modeloMarca}
                    onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                    placeholder="Ejemplo: Thunder 200, Daytona 250..."
                    required
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-[11px] font-bold text-zinc-700">Placa</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, placa: 'EN TRÁMITE' })}
                      className="text-[10px] text-blue-600 underline"
                    >
                      En trámite
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                    placeholder="Ejemplo: AB123C o EN TRÁMITE"
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Color</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Ejemplo: Negro Mate / Rojo Racing"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5 flex items-center justify-between">
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
                  placeholder="Ejemplo: 0 km"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Serie o Chasis (VIN) *</label>
                <input
                  type="text"
                  value={formData.chasis}
                  onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                  placeholder="Ejemplo: 3SCBP123456789012"
                  required
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold uppercase"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setMobileStep(1)}
                  className="flex-1 py-2 border border-zinc-300 text-zinc-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStep(3)}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Siguiente: Servicio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Contenido Paso 3 Móvil: Servicio */}
          {mobileStep === 3 && (
            <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <h3 className="text-xs font-black text-zinc-900">Paso 3: Servicio & Cobro</h3>
                <span className="text-[10px] font-bold text-emerald-600">3 de 3</span>
              </div>

              {/* ¿Qué se realizó? */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-zinc-700">
                    ¿Qué se realizó? *
                  </label>
                  {hasPdiDone && !hasEngrasadoDone && (
                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      Paso 2: Engrasado
                    </span>
                  )}
                  {hasEngrasadoDone && (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Paso 3: Mantenimiento
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    {
                      id: 'alistamiento_pdi' as ServiceActionType,
                      label: 'Alistamiento PDI',
                      stepBadge: 'Paso 1',
                      isBlocked: isPdiBlocked,
                      blockReason: 'Ya realizado',
                    },
                    {
                      id: 'engrasado' as ServiceActionType,
                      label: 'Engrasado',
                      stepBadge: 'Paso 2',
                      isBlocked: isEngrasadoBlocked,
                      blockReason: 'Ya realizado',
                    },
                    {
                      id: 'mantenimiento' as ServiceActionType,
                      label: 'Mantenimiento',
                      stepBadge: 'Paso 3',
                      isBlocked: isMantenimientoBlocked,
                      blockReason: 'Req. Engrasado',
                    },
                  ].map((srv) => {
                    const isSelected = formData.serviciosRealizados.includes(srv.id);

                    if (srv.isBlocked) {
                      return (
                        <div
                          key={srv.id}
                          className="px-1.5 py-2 rounded-xl text-[10px] font-bold border text-center bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed select-none flex flex-col items-center justify-center gap-0.5"
                        >
                          <div className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-zinc-400" />
                            <span className="line-through opacity-70 truncate">{srv.label}</span>
                          </div>
                          <span className="text-[8px] font-semibold text-zinc-400">{srv.blockReason}</span>
                        </div>
                      );
                    }

                    const isMandatory =
                      (hasPdiDone && !hasEngrasadoDone && srv.id === 'engrasado') ||
                      (hasEngrasadoDone && srv.id === 'mantenimiento');

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
                        {isMandatory ? (
                          <span className={`text-[8px] font-bold ${isSelected ? 'text-blue-200' : 'text-amber-600'}`}>
                            {srv.stepBadge} Oblig.
                          </span>
                        ) : (
                          <span className={`text-[8px] font-semibold ${isSelected ? 'text-blue-200' : 'text-zinc-400'}`}>
                            {srv.stepBadge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Técnico Responsable */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-zinc-700">
                    Técnico Responsable *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddTechModal(true)}
                    className="text-[10px] text-emerald-600 font-bold"
                  >
                    + Nuevo Técnico
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
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span>Fecha *</span>
                  </label>
                  <input
                    type="date"
                    value={formData.fechaServicio || todayStr}
                    onChange={(e) => setFormData({ ...formData, fechaServicio: e.target.value })}
                    required
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-600" />
                    <span>Hora *</span>
                  </label>
                  <input
                    type="time"
                    value={formData.horaServicio || getCurrentTimeStr()}
                    onChange={(e) => setFormData({ ...formData, horaServicio: e.target.value })}
                    required
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Control de Aceite (Estado, Nivel, Tipo) */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-zinc-700">
                    Control de Aceite
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomOilInput(!showCustomOilInput)}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
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

                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 mb-0.5">Estado</label>
                    <select
                      value={formData.aceite}
                      onChange={(e) => setFormData({ ...formData, aceite: e.target.value })}
                      className="w-full px-1.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-[11px] font-bold"
                    >
                      <option value="con_aceite">Con Aceite</option>
                      <option value="sin_aceite">Sin Aceite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 mb-0.5">Tipo de Aceite</label>
                    <select
                      value={formData.nivelAceite || 'mineral'}
                      onChange={(e) => setFormData({ ...formData, nivelAceite: e.target.value })}
                      className="w-full px-1.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-[11px] font-semibold"
                    >
                      <option value="mineral">Mineral</option>
                      <option value="semisintetico">Semisintético</option>
                      <option value="sintetico">Sintético</option>
                      <option value="full_sintetico">Full Sintético</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 mb-0.5">Viscosidad / Grado</label>
                    <select
                      value={formData.tipoAceite || '10W-30'}
                      onChange={(e) => setFormData({ ...formData, tipoAceite: e.target.value })}
                      className="w-full px-1.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-[11px] font-semibold"
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

              {formData.serviciosRealizados.length === 1 && formData.serviciosRealizados[0] === 'alistamiento_pdi' ? (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs text-blue-900 font-bold">
                    Alistamiento PDI previo a la venta: $0.00 al cliente.
                  </span>
                </div>
              ) : (
                <div className="space-y-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-emerald-900 mb-0.5">
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
                        className="w-full px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-emerald-900 mb-0.5">
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
                        className="w-full px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-semibold"
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Crédito">Crédito</option>
                        <option value="Mixto">Mixto</option>
                      </select>
                    </div>
                  </div>

                  {formData.metodoPago === 'Crédito' || formData.metodoPago === 'Crédito Directo' || formData.esCredito ? (
                    <div className="pt-1.5 space-y-1.5 border-t border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-blue-900">
                          Crédito Activo
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-zinc-500 font-bold">Plazo:</span>
                          <select
                            value={formData.mesesCredito || 3}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, mesesCredito: Number(e.target.value) || 3 }))
                            }
                            className="h-6 px-1.5 bg-white border border-blue-300 rounded text-[11px] font-bold text-blue-900"
                          >
                            <option value={1}>1 mes</option>
                            <option value={2}>2 meses</option>
                            <option value={3}>3 meses</option>
                            <option value={6}>6 meses</option>
                            <option value={9}>9 meses</option>
                            <option value={12}>12 meses</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-blue-900 mb-0.5">
                            Monto a Crédito
                          </label>
                          <div className="h-7 px-2 bg-blue-50 border border-blue-300 rounded-lg flex items-center justify-between text-blue-900 text-xs font-black">
                            <span>${Number(formData.valorServicio || 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-amber-800 mb-0.5">
                            Pendiente
                          </label>
                          <div className="h-7 px-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-amber-900 text-xs font-black">
                            <span>${Number(formData.valorServicio || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-100">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[10px] font-black uppercase text-emerald-900">
                            Abono ($)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                abono: prev.valorServicio,
                                montoPagado: prev.valorServicio,
                                saldoPendiente: 0,
                              }));
                            }}
                            className="text-[10px] text-emerald-700 underline font-bold"
                          >
                            Total
                          </button>
                        </div>
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
                          className="w-full px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-500 mb-0.5">
                          Pendiente
                        </label>
                        <div className="h-7 px-2 bg-white border border-zinc-200 rounded-lg flex items-center justify-between text-xs font-mono font-black">
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

                  {/* Subida de Evidencia Fotográfica (SOLO SI ES TRANSFERENCIA) */}
                  {(formData.metodoPago === 'Transferencia' || formData.metodoPago?.toLowerCase?.().includes('transferencia')) && (
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 animate-fade-in mt-2">
                      <label className="block text-[10px] font-black uppercase text-blue-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-blue-700" />
                          Comprobante / Evidencia de Transferencia *
                        </span>
                        {formData.evidenciaTransferencia && (
                          <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1 py-0.2 rounded">
                            ✓ Foto cargada
                          </span>
                        )}
                      </label>

                      {formData.evidenciaTransferencia ? (
                        <div className="relative rounded-lg border border-blue-300 bg-white p-2 flex items-center gap-2">
                          <a
                            href={formData.evidenciaTransferencia}
                            target="_blank"
                            rel="noreferrer"
                            className="w-12 h-12 rounded overflow-hidden border border-zinc-200 shrink-0 block relative"
                          >
                            <img
                              src={formData.evidenciaTransferencia}
                              alt="Comprobante"
                              className="w-full h-full object-cover"
                            />
                          </a>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-zinc-900 truncate">Comprobante guardado</p>
                            <p className="text-[9px] text-zinc-500">Toca para ampliar</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, evidenciaTransferencia: '' }))}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                            title="Eliminar imagen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-2.5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white rounded-lg cursor-pointer transition-all hover:bg-blue-50/50">
                          <Camera className="w-5 h-5 text-blue-600 mb-0.5" />
                          <span className="text-[11px] font-bold text-blue-950">Subir foto del comprobante</span>
                          <span className="text-[9px] text-zinc-500">JPG, PNG o foto de cámara</span>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-0.5">
                    N° Factura
                  </label>
                  <input
                    type="text"
                    value={formData.numeroFactura}
                    onChange={(e) => setFormData({ ...formData, numeroFactura: e.target.value })}
                    placeholder="001-002-..."
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-0.5">
                    N° Ticket
                  </label>
                  <input
                    type="text"
                    value={formData.numeroTicket}
                    onChange={(e) => setFormData({ ...formData, numeroTicket: e.target.value })}
                    placeholder="TCK-2026-..."
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Próximo Mantenimiento Sugerido */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-zinc-700">
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
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    KM
                  </span>
                </div>
              </div>

              {/* Fotos de Entrega / Servicio */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-zinc-700">
                    Fotos de Entrega / Servicio ({formData.fotos.length})
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
                {formData.fotos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {formData.fotos.map((url, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-zinc-200">
                        <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i)}
                          className="absolute top-0.5 right-0.5 bg-black/70 text-white p-0.5 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 border border-dashed border-zinc-300 hover:border-emerald-500 rounded-xl text-center cursor-pointer transition-colors bg-zinc-50 hover:bg-emerald-50/50 flex items-center justify-center gap-1.5 text-zinc-600"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold">Subir fotos de inspección o entrega</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-0.5">
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Notas mecánicas..."
                  className="w-full px-2.5 py-1 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValidationAlert(null);
                    setEffectiveViewMode('list');
                  }}
                  className="py-2 px-3 border border-zinc-300 text-zinc-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Registro</span>
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: AGREGAR NUEVO TÉCNICO                                           */}
      {/* ========================================================================= */}
      {showAddTechModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 border border-zinc-200 animate-slide-in">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span>Registrar Nuevo Técnico</span>
              </h3>
              <button onClick={() => setShowAddTechModal(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTechnician} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-0.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={newTechData.name}
                  onChange={(e) => setNewTechData({ ...newTechData, name: e.target.value })}
                  placeholder="Ej: CARLOS MENDOZA"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg outline-none focus:border-emerald-600 font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-0.5">
                  Especialidad
                </label>
                <input
                  type="text"
                  value={newTechData.specialty}
                  onChange={(e) => setNewTechData({ ...newTechData, specialty: e.target.value })}
                  placeholder="Ej: Mantenimiento General"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-0.5">
                  Teléfono / Celular
                </label>
                <input
                  type="text"
                  value={newTechData.phone}
                  onChange={(e) => setNewTechData({ ...newTechData, phone: e.target.value })}
                  placeholder="0990000000"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTechModal(false)}
                  className="flex-1 py-1.5 border border-zinc-300 rounded-lg font-bold text-zinc-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Guardar
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
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 border border-zinc-200 animate-slide-in">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Agregar Origen / Almacén</span>
              </h3>
              <button onClick={() => setShowAddOriginModal(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewOrigin} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-0.5">
                  Nombre del Almacén *
                </label>
                <input
                  type="text"
                  value={newOriginInput}
                  onChange={(e) => setNewOriginInput(e.target.value)}
                  placeholder="Ej: Almacén Manta Central"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg outline-none focus:border-blue-600 font-bold"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddOriginModal(false)}
                  className="flex-1 py-1.5 border border-zinc-300 rounded-lg font-bold text-zinc-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL FLOTANTE: ABONAR / REGISTRAR PAGO                                    */}
      {/* ========================================================================= */}
      {abonoModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3.5 border border-zinc-200 animate-slide-in max-h-[92vh] overflow-y-auto">
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900 leading-tight">
                    Registrar Abono / Pago
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium truncate max-w-[220px]">
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
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-1.5 p-2 bg-zinc-50 rounded-xl border border-zinc-200 text-center font-mono">
                    <div>
                      <span className="block text-[9px] text-zinc-500 uppercase font-sans font-bold">Valor Total</span>
                      <span className="text-xs sm:text-sm font-black text-zinc-900">${valServ.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-zinc-500 uppercase font-sans font-bold">Cobrado Previo</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-700">${prevPagado.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-zinc-500 uppercase font-sans font-bold">Saldo Actual</span>
                      <span className={`text-xs sm:text-sm font-black ${saldoActual > 0.01 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ${saldoActual.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Selector de Modo en Móvil */}
                  <div className="flex items-center justify-between p-1.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px]">
                    <span className="font-bold text-emerald-950 flex items-center gap-1">
                      <Plus className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span className="truncate">{abonoFormData.esSuma ? 'Sumar a cobrado previo' : 'Editar total directo'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAbonoFormData((prev) => ({
                        ...prev,
                        esSuma: !prev.esSuma,
                        montoAbono: prev.esSuma ? String(nuevoTotalPagado) : (saldoActual > 0 ? String(saldoActual) : ''),
                      }))}
                      className="text-[10px] text-emerald-800 underline font-semibold hover:text-emerald-950 cursor-pointer shrink-0"
                    >
                      {abonoFormData.esSuma ? 'Editar total' : 'Sumar abono'}
                    </button>
                  </div>

                  {/* Formulario de Abono */}
                  <form onSubmit={handleSaveAbono} className="space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-black uppercase text-zinc-700">
                          {abonoFormData.esSuma ? 'Monto a abonar hoy ($) *' : 'Total acumulado ($) *'}
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
                              className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold hover:bg-emerald-200 cursor-pointer"
                            >
                              Liquidar (${saldoActual.toFixed(2)})
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
                              className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold hover:bg-blue-200 cursor-pointer"
                            >
                              50%
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
                          className="w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-300 rounded-xl font-mono text-base font-bold text-zinc-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>

                      {/* Desglose Contable en Tiempo Real */}
                      <div className="mt-1.5 p-2 bg-zinc-50 border border-zinc-200 rounded-xl space-y-0.5 font-mono text-[10px]">
                        <div className="flex items-center justify-between text-zinc-600 font-sans">
                          <span>Cobrado previo:</span>
                          <span className="font-mono font-bold text-zinc-800">${prevPagado.toFixed(2)}</span>
                        </div>
                        {abonoFormData.esSuma && inputVal > 0 && (
                          <div className="flex items-center justify-between text-emerald-700 font-sans font-bold">
                            <span className="flex items-center gap-0.5">
                              <Plus className="w-2.5 h-2.5" /> Este abono a sumar:
                            </span>
                            <span className="font-mono font-black text-emerald-800">+${inputVal.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t border-zinc-200 pt-0.5 flex items-center justify-between font-bold">
                          <span className="font-sans text-zinc-800">Nuevo Total Cobrado:</span>
                          <span className="text-emerald-700 font-black text-xs">${nuevoTotalPagado.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between font-bold">
                          <span className="font-sans text-zinc-800">Saldo Restante:</span>
                          <span className={`font-black text-xs ${nuevoSaldo <= 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ${nuevoSaldo.toFixed(2)} {nuevoSaldo <= 0.01 ? '(¡Liquidado!)' : ''}
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
                        className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
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
                      <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 animate-fade-in">
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
                          <div className="relative rounded-xl border border-blue-300 bg-white p-2 flex items-center gap-2.5">
                            <a
                              href={abonoFormData.evidenciaTransferencia}
                              target="_blank"
                              rel="noreferrer"
                              className="w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 shrink-0 block relative"
                            >
                              <img
                                src={abonoFormData.evidenciaTransferencia}
                                alt="Comprobante"
                                className="w-full h-full object-cover"
                              />
                            </a>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-zinc-900 truncate">Comprobante guardado</p>
                              <p className="text-[10px] text-zinc-500">Toca para ampliar</p>
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
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAbonoModalRecord(null)}
                        className="flex-1 py-2 rounded-xl border border-zinc-300 font-bold text-xs text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
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

      {/* Input oculto para fotos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,*/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Lista de sugerencias de marcas registradas */}
      <datalist id="registered-brands-datalist">
        {registeredBrands.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
    </div>
  );
};
