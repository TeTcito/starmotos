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
} from 'lucide-react';
import {
  AlistamientoFullRecord,
  Technician,
  ServiceActionType,
  Workshop,
} from '../../../types/customer';
import { querySriMock } from '../../../data/mockMultiRoleData';
import { compressImageBase64 } from '../../../utils/imageCompressor';

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
}

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

  // Búsqueda y Filtro de Sede en el listado móvil
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkshopFilter, setSelectedWorkshopFilter] = useState<string>('all');

  // Registro seleccionado para ver detalle en Ficha Técnica
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<AlistamientoFullRecord | null>(null);
  const [detailFormData, setDetailFormData] = useState<AlistamientoFullRecord | null>(null);
  const [detailSuccessToast, setDetailSuccessToast] = useState<string | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'cliente' | 'moto' | 'servicio'>('cliente');

  // Paso para formulario wizard de nuevo alistamiento (1: Cliente, 2: Moto, 3: Servicio)
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

  // Fecha de hoy por defecto en formato YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Estado del formulario para nuevo registro
  const [formData, setFormData] = useState<AlistamientoFullRecord>({
    id: '',
    atendidoPor: defaultAtendidoPor,
    sede: defaultSede,
    sedeId: defaultSedeId,
    fechaServicio: todayStr,
    nombres: '',
    apellidos: '',
    cedulaRuc: '',
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
    tecnicoResponsable: technicians[0]?.name || 'WILLIAM MEZA',
    tecnicoId: technicians[0]?.id || 'tec-01',
    kilometraje: 0,
    aceite: 'con_aceite',
    nivelAceite: 'optimo',
    tipoAceite: 'Katana 20W50',
    numeroFactura: '',
    numeroTicket: '',
    valorServicio: 35.0,
    montoPagado: 35.0,
    abono: 35.0,
    saldoPendiente: 0,
    esCredito: false,
    mesesCredito: 3,
    metodoPago: 'Efectivo',
    observaciones: '',
    proximoMantenimientoKm: 1000,
    fotos: [],
    createdAt: '',
  });

  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [validationAlert, setValidationAlert] = useState<{
    title: string;
    fields: string[];
    stepTarget: 1 | 2 | 3;
  } | null>(null);

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

  // Filtrado de alistamientos existentes por Sede y término de búsqueda
  const filteredRecords = useMemo(() => {
    return recentRecords.filter((r) => {
      // Filtro de Sede / Taller
      if (selectedWorkshopFilter !== 'all') {
        const matchesWs = r.sedeId === selectedWorkshopFilter || r.sede === selectedWorkshopFilter;
        if (!matchesWs) return false;
      }

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const fullClient = `${r.nombres} ${r.apellidos}`.toLowerCase();
      return (
        r.cedulaRuc.toLowerCase().includes(term) ||
        fullClient.includes(term) ||
        r.placa.toLowerCase().includes(term) ||
        r.chasis.toLowerCase().includes(term) ||
        r.modeloMarca.toLowerCase().includes(term) ||
        r.sede.toLowerCase().includes(term) ||
        r.origen.toLowerCase().includes(term) ||
        r.tecnicoResponsable.toLowerCase().includes(term)
      );
    });
  }, [recentRecords, searchTerm, selectedWorkshopFilter]);

  // Métricas financieras y operativas del listado (Ingresos cobrados vs Pendientes por cobrar)
  const statsMetrics = useMemo(() => {
    let totalRecaudado = 0;
    let totalPendiente = 0;
    let totalFacturado = 0;
    let countPdi = 0;
    let countMantenimiento = 0;
    let countConSaldo = 0;

    filteredRecords.forEach((r) => {
      const valor = Number(r.valorServicio) || 0;
      const pagado = r.abono !== undefined ? Number(r.abono) : (Number(r.montoPagado) || 0);
      const pendiente = r.saldoPendiente !== undefined 
        ? Number(r.saldoPendiente) 
        : Math.max(0, valor - pagado);

      totalFacturado += valor;
      totalRecaudado += pagado;
      totalPendiente += pendiente;

      if (pendiente > 0) countConSaldo++;
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

      if (isPdiBlocked && updated.includes('alistamiento_pdi')) {
        updated = updated.filter((s) => s !== 'alistamiento_pdi');
        changed = true;
      }
      if (isEngrasadoBlocked && updated.includes('engrasado')) {
        updated = updated.filter((s) => s !== 'engrasado');
        changed = true;
      }

      if (isPdiBlocked && isEngrasadoBlocked) {
        if (!updated.includes('mantenimiento') || updated.length > 1) {
          updated = ['mantenimiento'];
          changed = true;
        }
      } else if (updated.length === 0) {
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

  // Consultar Cédula o RUC
  const handleConsultar = (idToSearch?: string) => {
    const cleanId = (idToSearch || formData.cedulaRuc).trim();
    if (!cleanId) return;

    setIsSearching(true);
    setSearchFeedback(null);

    const existingRec = recentRecords.find(
      (r) =>
        r.cedulaRuc.trim().toLowerCase() === cleanId.toLowerCase() ||
        (r.chasis && r.chasis.trim().toUpperCase() === cleanId.toUpperCase())
    );

    if (existingRec) {
      setIsSearching(false);
      setFormData((prev) => ({
        ...prev,
        cedulaRuc: existingRec.cedulaRuc,
        nombres: existingRec.nombres,
        apellidos: existingRec.apellidos,
        celular1: existingRec.celular1 || prev.celular1,
        celular2: existingRec.celular2 || prev.celular2,
        email: existingRec.email || prev.email,
        direccion: existingRec.direccion || prev.direccion,
        origen: existingRec.origen || prev.origen,
        motoPreviaId: existingRec.chasis || existingRec.placa,
        chasis: existingRec.chasis || prev.chasis,
        placa: existingRec.placa || prev.placa,
        modeloMarca: existingRec.modeloMarca || prev.modeloMarca,
        kilometraje: existingRec.kilometraje ? existingRec.kilometraje + 500 : prev.kilometraje,
      }));
      setSearchFeedback(`✓ Cliente registrado encontrado: ${existingRec.nombres} ${existingRec.apellidos}`);
      return;
    }

    setTimeout(() => {
      const padronData = querySriMock(cleanId);
      setIsSearching(false);

      if (padronData) {
        const parts = padronData.razonSocial.split(' ');
        let nombres = '';
        let apellidos = '';

        if (parts.length >= 4) {
          apellidos = `${parts[0]} ${parts[1]}`;
          nombres = parts.slice(2).join(' ');
        } else if (parts.length === 3) {
          apellidos = `${parts[0]} ${parts[1]}`;
          nombres = parts[2];
        } else if (parts.length === 2) {
          apellidos = parts[0];
          nombres = parts[1];
        } else {
          nombres = padronData.razonSocial;
          apellidos = '';
        }

        setFormData((prev) => ({
          ...prev,
          cedulaRuc: cleanId,
          nombres: nombres || prev.nombres,
          apellidos: apellidos || prev.apellidos,
          direccion: padronData.address || prev.direccion,
          email: padronData.email || prev.email,
        }));
        setSearchFeedback(`✓ Datos verificados: ${padronData.razonSocial}`);
      } else {
        setSearchFeedback(`Información: No registrado en el padrón local. Ingrese los datos manualmente.`);
      }
    }, 350);
  };

  // Iniciar nuevo alistamiento
  const handleStartNewAlistamiento = (initialCedula?: string) => {
    const cedula = initialCedula?.trim() || '';
    setFormData({
      id: '',
      atendidoPor: defaultAtendidoPor,
      sede: defaultSede,
      sedeId: defaultSedeId,
      fechaServicio: todayStr,
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
      tecnicoResponsable: technicians[0]?.name || 'WILLIAM MEZA',
      tecnicoId: technicians[0]?.id || 'tec-01',
      kilometraje: 0,
      aceite: 'con_aceite',
      nivelAceite: 'optimo',
      tipoAceite: 'Katana 20W50',
      numeroFactura: '',
      numeroTicket: '',
      valorServicio: 35.0,
      montoPagado: 35.0,
      abono: 35.0,
      saldoPendiente: 0,
      esCredito: false,
      mesesCredito: 3,
      metodoPago: 'Efectivo',
      observaciones: '',
      proximoMantenimientoKm: 1000,
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
  const handleNewServiceForExisting = (record: AlistamientoFullRecord) => {
    setFormData({
      id: '',
      atendidoPor: defaultAtendidoPor,
      sede: defaultSede,
      sedeId: defaultSedeId,
      fechaServicio: todayStr,
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
      tecnicoResponsable: record.tecnicoResponsable || technicians[0]?.name || 'WILLIAM MEZA',
      tecnicoId: record.tecnicoId || technicians[0]?.id || 'tec-01',
      kilometraje: record.kilometraje ? record.kilometraje + 500 : 500,
      aceite: record.aceite || 'con_aceite',
      nivelAceite: record.nivelAceite || 'optimo',
      tipoAceite: record.tipoAceite || 'Katana 20W50',
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
      proximoMantenimientoKm: (record.kilometraje || 0) + 1500,
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
      proximoMantenimientoKm: record.proximoMantenimientoKm || 1000,
      fotos: record.fotos || [],
      abono: record.abono !== undefined ? record.abono : (record.montoPagado || 0),
      saldoPendiente:
        record.saldoPendiente !== undefined
          ? record.saldoPendiente
          : Math.max(0, (record.valorServicio || 0) - (record.abono ?? record.montoPagado ?? 0)),
    });
    setDetailSuccessToast(null);
    setDetailActiveTab('cliente');
  };

  // Guardar modificaciones del formulario de alistamiento
  const handleSaveRecordDetail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!detailFormData) return;
    if (onSaveRecord) {
      onSaveRecord(detailFormData);
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

  // Toggle de servicios en formulario de nuevo registro
  const toggleServicio = (servicio: ServiceActionType) => {
    if (servicio === 'alistamiento_pdi' && isPdiBlocked) return;
    if (servicio === 'engrasado' && isEngrasadoBlocked) return;

    if (isPdiBlocked && isEngrasadoBlocked && servicio === 'mantenimiento') {
      return;
    }

    setFormData((prev) => {
      const exists = prev.serviciosRealizados.includes(servicio);
      if (exists) {
        if (prev.serviciosRealizados.length === 1) return prev;
        return {
          ...prev,
          serviciosRealizados: prev.serviciosRealizados.filter((s) => s !== servicio),
        };
      } else {
        return {
          ...prev,
          serviciosRealizados: [...prev.serviciosRealizados, servicio],
        };
      }
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

    const targetWorkshop = workshops.find((w) => w.id === newTechData.workshopId);
    onAddTechnician({
      name: newTechData.name.toUpperCase(),
      specialty: newTechData.specialty,
      phone: newTechData.phone || '0990000000',
      workshopId: newTechData.workshopId,
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
    if (!isPdiOnly && (formData.valorServicio === undefined || formData.valorServicio === null || isNaN(formData.valorServicio))) {
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
    const finalValor = isPdiOnly ? 0 : (formData.valorServicio || 0);
    const finalAbono = isPdiOnly ? 0 : (isCred ? 0 : (formData.abono !== undefined ? formData.abono : (formData.montoPagado || 0)));
    const finalSaldo = isPdiOnly ? 0 : (isCred ? finalValor : (formData.saldoPendiente !== undefined ? formData.saldoPendiente : Math.max(0, finalValor - finalAbono)));

    const fullRecord: AlistamientoFullRecord = {
      ...formData,
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

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Celular 2 (Opcional)</label>
                    <input
                      type="tel"
                      value={detailFormData.celular2 || ''}
                      onChange={(e) => setDetailFormData({ ...detailFormData, celular2: e.target.value })}
                      placeholder="Opcional"
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={detailFormData.email || ''}
                      onChange={(e) => setDetailFormData({ ...detailFormData, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Dirección Domiciliaria</label>
                    <input
                      type="text"
                      value={detailFormData.direccion || ''}
                      onChange={(e) => setDetailFormData({ ...detailFormData, direccion: e.target.value })}
                      placeholder="Calle principal, secundaria, ciudad"
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs text-zinc-900 outline-none transition-all"
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

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">N° de Motor</label>
                      <input
                        type="text"
                        value={detailFormData.numeroMotor || ''}
                        onChange={(e) =>
                          setDetailFormData({ ...detailFormData, numeroMotor: e.target.value.toUpperCase() })
                        }
                        placeholder="Opcional"
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono text-zinc-900 uppercase outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Año / Modelo</label>
                      <input
                        type="number"
                        value={detailFormData.year || ''}
                        onChange={(e) =>
                          setDetailFormData({ ...detailFormData, year: parseInt(e.target.value) || undefined })
                        }
                        placeholder="2026"
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono text-zinc-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Kilometraje de Recepción (km) *</label>
                    <input
                      type="number"
                      min="0"
                      value={detailFormData.kilometraje}
                      onChange={(e) =>
                        setDetailFormData({ ...detailFormData, kilometraje: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  {/* Resumen del Vehículo (Idéntico a Desktop) */}
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 text-xs">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                      Resumen del Vehículo:
                    </span>
                    <div className="text-zinc-800 font-bold">{detailFormData.modeloMarca || 'Sin modelo'}</div>
                    <div className="text-[11px] text-zinc-600 font-mono mt-0.5">
                      Placa: <strong>{detailFormData.placa || 'SIN PLACA'}</strong> • Km:{' '}
                      <strong>{detailFormData.kilometraje} km</strong> • Color:{' '}
                      <strong>{detailFormData.color || 'No especificado'}</strong>
                    </div>
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

                {/* Bloque 2: Técnico & Atención */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    <span>Técnico & Atención</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Técnico Responsable *</label>
                    <select
                      value={detailFormData.tecnicoResponsable}
                      onChange={(e) => {
                        const tName = e.target.value;
                        const tObj = technicians.find((t) => t.name === tName);
                        setDetailFormData({
                          ...detailFormData,
                          tecnicoResponsable: tName,
                          tecnicoId: tObj?.id || 'tec-01',
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600"
                    >
                      {technicians.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.workshopName || 'Taller'})
                        </option>
                      ))}
                      {!technicians.some((t) => t.name === detailFormData.tecnicoResponsable) && (
                        <option value={detailFormData.tecnicoResponsable}>{detailFormData.tecnicoResponsable}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Fecha de Atención</label>
                    <input
                      type="date"
                      value={detailFormData.fechaServicio || ''}
                      onChange={(e) => setDetailFormData({ ...detailFormData, fechaServicio: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Bloque 3: Control de Aceite */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Control de Aceite</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      Control de Aceite (Estado / Nivel / Tipo)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <select
                          value={detailFormData.aceite || 'con_aceite'}
                          onChange={(e) => setDetailFormData({ ...detailFormData, aceite: e.target.value })}
                          className="w-full px-1.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-[11px] font-bold text-zinc-800 outline-none focus:border-blue-600"
                        >
                          <option value="con_aceite">Con Aceite</option>
                          <option value="sin_aceite">Sin Aceite</option>
                        </select>
                      </div>

                      <div>
                        <select
                          value={detailFormData.nivelAceite || 'optimo'}
                          onChange={(e) => setDetailFormData({ ...detailFormData, nivelAceite: e.target.value })}
                          className="w-full px-1.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-[11px] font-semibold text-zinc-800 outline-none focus:border-blue-600"
                        >
                          <option value="optimo">Nivel Óptimo</option>
                          <option value="alto">Nivel Alto</option>
                          <option value="medio">Nivel Medio</option>
                          <option value="bajo">Nivel Bajo</option>
                        </select>
                      </div>

                      <div>
                        <select
                          value={detailFormData.tipoAceite || 'Katana 20W50'}
                          onChange={(e) => setDetailFormData({ ...detailFormData, tipoAceite: e.target.value })}
                          className="w-full px-1.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-[11px] font-semibold text-zinc-800 outline-none focus:border-blue-600"
                        >
                          <option value="Katana 10W30">Katana 10/30</option>
                          <option value="Katana 20W50">Katana 20/50</option>
                          <option value="Katana 15W40">Katana 15/40</option>
                          <option value="Motul 5000">Motul 5000</option>
                          <option value="Motul 7100">Motul 7100</option>
                          <option value="Motor 1 20W50">Motor 1 20/50</option>
                          <option value="Shineray 20W50">Shineray 20/50</option>
                          <option value="4T Mineral 20W50">20W50 Mineral</option>
                          <option value="4T Semi 10W40">10W40 Semi</option>
                          <option value="Castrol Actevo 20W50">Castrol 20W50</option>
                          <option value="Sin Tipo">N/A</option>
                        </select>
                      </div>
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
                          value={detailFormData.valorServicio || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const ab = detailFormData.abono !== undefined ? detailFormData.abono : (detailFormData.montoPagado || 0);
                            setDetailFormData({
                              ...detailFormData,
                              valorServicio: val,
                              saldoPendiente: Math.max(0, val - ab),
                            });
                          }}
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
                              saldoPendiente: isCred ? valServ : Math.max(0, valServ - (detailFormData.abono || valServ)),
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
                              ${(detailFormData.valorServicio || 0).toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Pendiente por Cobrar ($)</label>
                            <div className="px-2.5 py-1.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-900 flex justify-between items-center">
                              <span>${(detailFormData.saldoPendiente ?? detailFormData.valorServicio ?? 0).toFixed(2)}</span>
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
                            value={detailFormData.abono !== undefined ? detailFormData.abono : (detailFormData.montoPagado || 0)}
                            onChange={(e) => {
                              const abVal = parseFloat(e.target.value) || 0;
                              const valServ = detailFormData.valorServicio || 0;
                              setDetailFormData({
                                ...detailFormData,
                                abono: abVal,
                                montoPagado: abVal,
                                saldoPendiente: Math.max(0, valServ - abVal),
                              });
                            }}
                            className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-900 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Pendiente ($)</label>
                          <div className="px-2.5 py-1.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-900 flex justify-between items-center">
                            <span>
                              ${(detailFormData.saldoPendiente ?? Math.max(0, (detailFormData.valorServicio || 0) - (detailFormData.abono ?? detailFormData.montoPagado ?? 0))).toFixed(2)}
                            </span>
                            {(detailFormData.saldoPendiente ?? Math.max(0, (detailFormData.valorServicio || 0) - (detailFormData.abono ?? detailFormData.montoPagado ?? 0))) > 0 ? (
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
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Próximo Mantenimiento Sugerido</label>
                    <div className="px-2.5 py-1.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs font-mono font-bold text-blue-700 flex items-center justify-between">
                      <span>A los {detailFormData.proximoMantenimientoKm || 1000} km</span>
                      <span className="text-[10px] font-sans font-normal text-blue-600">Sugerido</span>
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

            {/* Botón de Filtro al lado derecho de la barra de búsqueda */}
            {workshops && workshops.length > 0 && (
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
                  onChange={(e) => setSelectedWorkshopFilter(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Filtrar por Sede"
                >
                  <option value="all">🏢 Todas las Sedes ({recentRecords.length})</option>
                  {workshops.map((w) => {
                    const count = recentRecords.filter((r) => r.sedeId === w.id || r.sede === w.name).length;
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
          {filteredRecords.length > 0 ? (
            <div className="flex flex-col space-y-2">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  onClick={() => handleOpenRecordDetail(record)}
                  className="bg-white border border-zinc-200 hover:border-blue-400 active:bg-blue-50/50 rounded-xl p-2.5 shadow-2xs transition-all cursor-pointer space-y-1.5 select-none"
                >
                  {/* MÓDULO 1: Cliente & Sede (sin numeración) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-zinc-900 truncate leading-tight">
                        {record.nombres} {record.apellidos}
                      </h4>
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
                      <span>{record.fechaServicio}</span>
                      {record.tecnicoResponsable && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-600 truncate max-w-[85px] font-sans">
                            {record.tecnicoResponsable.split(' ')[0]}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
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
                      <span className="font-mono font-black text-emerald-700 text-xs">
                        ${(record.montoPagado || record.valorServicio || 35).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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
                <h3 className="text-xs font-black text-zinc-900">Paso 1: Datos del Cliente</h3>
                <span className="text-[10px] font-bold text-blue-600">1 de 3</span>
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
                    placeholder="Ej: 2350999252..."
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
                  <p className="text-[10px] text-blue-800 font-medium leading-tight">
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
                    placeholder="0990000000"
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
                    placeholder="0991234567"
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
                  placeholder="cliente@ejemplo.com"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Dirección Domiciliaria</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Ej: Av. 19 de Mayo y Guayas"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Sede / Taller</label>
                  <select
                    value={formData.sede}
                    onChange={(e) => {
                      const sName = e.target.value;
                      const sObj = workshops.find((w) => w.name === sName);
                      setFormData({
                        ...formData,
                        sede: sName,
                        sedeId: sObj?.id || defaultSedeId,
                      });
                    }}
                    className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium"
                  >
                    {workshops.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-[11px] font-bold text-zinc-700">Origen</label>
                    <button
                      type="button"
                      onClick={() => setShowAddOriginModal(true)}
                      className="text-[10px] text-blue-600 font-bold"
                    >
                      + Nuevo
                    </button>
                  </div>
                  <select
                    value={formData.origen}
                    onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                    className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium"
                  >
                    {origins.map((orig) => (
                      <option key={orig} value={orig}>
                        {orig}
                      </option>
                    ))}
                  </select>
                </div>
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
                    value={formData.modeloMarca}
                    onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                    placeholder="Ej: Daytona 250"
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
                    placeholder="SIN PLACA"
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Rojo / Negro"
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Kilometraje (km)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kilometraje}
                    onChange={(e) => setFormData({ ...formData, kilometraje: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Serie o Chasis (VIN) *</label>
                <input
                  type="text"
                  value={formData.chasis}
                  onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                  placeholder="Ej: LBBP57008PA049182"
                  required
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">N° Motor</label>
                  <input
                    type="text"
                    value={formData.numeroMotor || ''}
                    onChange={(e) => setFormData({ ...formData, numeroMotor: e.target.value.toUpperCase() })}
                    placeholder="Opcional"
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Año / Modelo</label>
                  <input
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || undefined })}
                    placeholder="2026"
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Subir Fotos */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-zinc-700">
                    Fotos de la Unidad
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
                          className="px-1.5 py-2 rounded-xl text-[10px] font-bold border text-center bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed select-none flex flex-col items-center justify-center gap-0.5"
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
                      tecnicoId: techObj?.id || 'tec-01',
                    });
                  }}
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
                >
                  {technicians.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.workshopName || 'Taller'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Control de Aceite (Estado, Nivel, Tipo) */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                  Control de Aceite (Estado / Nivel / Tipo)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <select
                    value={formData.aceite}
                    onChange={(e) => setFormData({ ...formData, aceite: e.target.value })}
                    className="w-full px-1.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-[11px] font-bold"
                  >
                    <option value="con_aceite">Con Aceite</option>
                    <option value="sin_aceite">Sin Aceite</option>
                  </select>

                  <select
                    value={formData.nivelAceite || 'optimo'}
                    onChange={(e) => setFormData({ ...formData, nivelAceite: e.target.value })}
                    className="w-full px-1.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-[11px] font-semibold"
                  >
                    <option value="optimo">Óptimo</option>
                    <option value="alto">Alto</option>
                    <option value="medio">Medio</option>
                    <option value="bajo">Bajo</option>
                  </select>

                  <select
                    value={formData.tipoAceite || 'Katana 20W50'}
                    onChange={(e) => setFormData({ ...formData, tipoAceite: e.target.value })}
                    className="w-full px-1.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-[11px] font-semibold"
                  >
                    <option value="Katana 10W30">Katana 10/30</option>
                    <option value="Katana 20W50">Katana 20/50</option>
                    <option value="Katana 15W40">Katana 15/40</option>
                    <option value="Motul 5000">Motul 5000</option>
                    <option value="Motul 7100">Motul 7100</option>
                    <option value="Motor 1 20W50">Motor 1 20/50</option>
                    <option value="Shineray 20W50">Shineray 20/50</option>
                    <option value="4T Mineral 20W50">20W50 Mineral</option>
                    <option value="4T Semi 10W40">10W40 Semi</option>
                    <option value="Castrol Actevo 20W50">Castrol 20W50</option>
                    <option value="Sin Tipo">N/A</option>
                  </select>
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
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setFormData((prev) => ({
                            ...prev,
                            valorServicio: val,
                            abono: prev.esCredito ? 0 : ((prev.abono ?? 0) > val ? val : prev.abono),
                          }));
                        }}
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
                            <span>${formData.valorServicio.toFixed(2)}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-amber-800 mb-0.5">
                            Pendiente
                          </label>
                          <div className="h-7 px-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-amber-900 text-xs font-black">
                            <span>${formData.valorServicio.toFixed(2)}</span>
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
                          max={formData.valorServicio}
                          value={formData.abono ?? ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setFormData((prev) => ({
                              ...prev,
                              abono: val,
                              montoPagado: val,
                              saldoPendiente: Math.max(0, prev.valorServicio - val),
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
                              Math.max(0, formData.valorServicio - (formData.abono ?? 0)) > 0
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }
                          >
                            ${Math.max(0, formData.valorServicio - (formData.abono ?? 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
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

      {/* Input oculto para fotos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,*/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
