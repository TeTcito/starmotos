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
} from 'lucide-react';
import {
  AlistamientoFullRecord,
  Technician,
  ServiceActionType,
  Workshop,
} from '../../types/customer';
import { querySriMock } from '../../data/mockMultiRoleData';

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
  recentRecords?: AlistamientoFullRecord[];
  viewMode?: 'list' | 'form';
  onViewModeChange?: (mode: 'list' | 'form') => void;
}

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

  // Referencia para selector de archivos del computador/dispositivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Búsqueda y Filtro de Sede en el listado
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkshopFilter, setSelectedWorkshopFilter] = useState<string>('all');

  // Registro seleccionado para ver detalle en formulario
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<AlistamientoFullRecord | null>(null);
  const [detailFormData, setDetailFormData] = useState<AlistamientoFullRecord | null>(null);
  const [detailSuccessToast, setDetailSuccessToast] = useState<string | null>(null);

  // Paso para vista móvil (1: Cliente, 2: Moto, 3: Servicio)
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

  // Fecha de hoy por defecto en formato YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Estado del formulario completo
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
    serviciosRealizados: ['alistamiento_pdi'],
    tecnicoResponsable: technicians[0]?.name || 'WILLIAM MEZA',
    tecnicoId: technicians[0]?.id || 'tec-01',
    kilometraje: 0,
    aceite: 'con_aceite',
    nivelAceite: 'optimo',
    tipoAceite: '4T Mineral 20W50',
    numeroFactura: '',
    numeroTicket: '',
    valorServicio: 35.0,
    montoPagado: 35.0,
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
      `Estimado/a ${clientName}, le saludamos desde StarMotos. Le compartimos la información de su orden de servicio y alistamiento.`
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

  // Consultar Cédula o RUC (busca en registros existentes o padrón público)
  const handleConsultar = (idToSearch?: string) => {
    const cleanId = (idToSearch || formData.cedulaRuc).trim();
    if (!cleanId) return;

    setIsSearching(true);
    setSearchFeedback(null);

    // 1. Primero verificar si ya existe en el historial local de alistamientos
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

    // 2. Si es cliente nuevo en el taller, consultar padrón
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

  // Iniciar nuevo alistamiento con o sin cédula previa
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
      serviciosRealizados: ['alistamiento_pdi'],
      tecnicoResponsable: technicians[0]?.name || 'WILLIAM MEZA',
      tecnicoId: technicians[0]?.id || 'tec-01',
      kilometraje: 0,
      aceite: 'con_aceite',
      nivelAceite: 'optimo',
      tipoAceite: '4T Mineral 20W50',
      numeroFactura: '',
      numeroTicket: '',
      valorServicio: 35.0,
      montoPagado: 35.0,
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
      serviciosRealizados: ['mantenimiento'],
      tecnicoResponsable: record.tecnicoResponsable || technicians[0]?.name || 'WILLIAM MEZA',
      tecnicoId: record.tecnicoId || technicians[0]?.id || 'tec-01',
      kilometraje: record.kilometraje ? record.kilometraje + 500 : 500,
      aceite: record.aceite || 'con_aceite',
      nivelAceite: record.nivelAceite || 'optimo',
      tipoAceite: record.tipoAceite || '4T Mineral 20W50',
      numeroFactura: '',
      numeroTicket: '',
      valorServicio: 35.0,
      montoPagado: 35.0,
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

  // Abrir registro existente en formulario estructurado
  const handleOpenRecordDetail = (record: AlistamientoFullRecord) => {
    setSelectedRecordForDetail(record);
    setDetailFormData({ ...record });
    setDetailSuccessToast(null);
  };

  // Guardar modificaciones del formulario de alistamiento
  const handleSaveRecordDetail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!detailFormData) return;
    if (onSaveRecord) {
      onSaveRecord(detailFormData);
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
      if (exists) {
        if (prev.serviciosRealizados.length === 1) return prev; // Mantener al menos uno seleccionado
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

  // Subir archivos reales desde el computador o dispositivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            fotos: [...prev.fotos, event.target!.result as string],
          }));
        }
      };
      reader.readAsDataURL(file);
    });

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
    if (formData.valorServicio === undefined || formData.valorServicio === null || isNaN(formData.valorServicio)) {
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

    const fullRecord: AlistamientoFullRecord = {
      ...formData,
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
    <div className="space-y-4">
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
      {/* 1. VISTA: LISTADO O APARTADO INDEPENDIENTE DE ALISTAMIENTO                 */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 1. VISTA: FORMULARIO DE DETALLE DE ALISTAMIENTO PREVIO                    */}
      {/* ========================================================================= */}
      {currentViewMode === 'list' && selectedRecordForDetail && detailFormData && (
        <form
          onSubmit={handleSaveRecordDetail}
          className="h-full w-full flex flex-col overflow-hidden gap-3 animate-fade-in bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-2xs"
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
                  <strong className="text-zinc-700">{detailFormData.fechaServicio}</strong> • Atendido por:{' '}
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
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
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
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Número de Chasis / VIN *
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
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Kilometraje de Recepción (km) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={detailFormData.kilometraje}
                    onChange={(e) =>
                      setDetailFormData({ ...detailFormData, kilometraje: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                  />
                </div>

                <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 text-xs">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                    Resumen del Vehículo:
                  </span>
                  <div className="text-zinc-800 font-bold">{detailFormData.modeloMarca || 'Sin modelo'}</div>
                  <div className="text-[11px] text-zinc-600 font-mono mt-0.5">
                    Placa: <strong>{detailFormData.placa || 'SIN PLACA'}</strong> • Km:{' '}
                    <strong>{detailFormData.kilometraje} km</strong>
                  </div>
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
                <div className="grid grid-cols-2 gap-2">
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
                    <label className="block text-[10px] font-bold text-zinc-700 mb-1">Estado Aceite</label>
                    <input
                      type="text"
                      value={
                        detailFormData.aceite === 'sin_aceite'
                          ? 'Sin Aceite'
                          : `${detailFormData.aceite} (${detailFormData.nivelAceite || 'Óptimo'})`
                      }
                      onChange={(e) => setDetailFormData({ ...detailFormData, aceite: e.target.value })}
                      className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Cobro y Factura */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 mb-1">Monto Cobrado ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={detailFormData.montoPagado || detailFormData.valorServicio || 35.0}
                      onChange={(e) =>
                        setDetailFormData({
                          ...detailFormData,
                          montoPagado: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold text-emerald-800 outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 mb-1">Método de Pago</label>
                    <select
                      value={detailFormData.metodoPago || 'Efectivo'}
                      onChange={(e) => setDetailFormData({ ...detailFormData, metodoPago: e.target.value as any })}
                      className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900 outline-none focus:border-blue-600"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta</option>
                    </select>
                  </div>
                </div>

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
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Próximo Mantenimiento Sugerido
                  </label>
                  <div className="text-xs font-mono font-bold text-blue-700 bg-blue-50/70 p-2 rounded-lg border border-blue-200">
                    A los {detailFormData.proximoMantenimientoKm || 1000} km
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
      )}

      {/* 2. VISTA: LIBRO DE ALISTAMIENTOS (TABLA EXCEL) */}
      {currentViewMode === 'list' && !selectedRecordForDetail && (
        <div className="h-full w-full flex flex-col overflow-hidden gap-2.5 animate-fade-in">
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
                  ${recentRecords.reduce((acc, r) => acc + (r.montoPagado || r.valorServicio || 35), 0).toFixed(2)} Facturado
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

              {/* Filtro de Sede / Taller */}
              {workshops && workshops.length > 0 && (
                <div className="h-12 sm:h-13 bg-white border border-zinc-300 rounded-xl px-3 flex items-center shrink-0 shadow-2xs">
                  <Building2 className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
                  <select
                    value={selectedWorkshopFilter}
                    onChange={(e) => setSelectedWorkshopFilter(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-bold text-zinc-800 outline-none cursor-pointer"
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

          {/* Tabla Tipo Excel de Alistamientos */}
          {filteredRecords.length > 0 ? (
            <div className="flex-1 min-h-0 w-full bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden flex flex-col">
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
                      <th className="w-[8.5%] px-1.5 py-2 text-center whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-800">
                    {filteredRecords.map((record, idx) => {
                      return (
                        <tr
                          key={record.id}
                          onClick={() => handleOpenRecordDetail(record)}
                          className="cursor-pointer hover:bg-blue-50/70 active:bg-blue-100/70 transition-colors divide-x divide-zinc-200/70 even:bg-zinc-50/40 select-none group"
                          title={`Haga clic en cualquier lado para abrir la ficha técnica de ${record.nombres} ${record.apellidos}`}
                        >
                          {/* 1. # */}
                          <td className="px-1 py-2 text-center font-mono text-zinc-400 text-[11px] bg-zinc-50/50">
                            {idx + 1}
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
                            {record.fechaServicio}
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

                          {/* 9. Valor */}
                          <td className="px-2 py-2 text-right font-mono font-bold text-zinc-900 whitespace-nowrap text-xs">
                            ${(record.montoPagado || record.valorServicio || 35).toFixed(2)}
                          </td>

                          {/* 10. Factura */}
                          <td className="px-2 py-2 font-mono text-zinc-700 truncate text-[11px]" title={record.numeroFactura || record.numeroTicket || 'Ticket'}>
                            <span className="truncate block">{record.numeroFactura || record.numeroTicket || 'Ticket'}</span>
                          </td>

                          {/* 11. Acciones */}
                          <td className="px-1.5 py-2 text-center whitespace-nowrap">
                            <div className="inline-flex items-center justify-center gap-1">
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
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="sticky bottom-0 bg-zinc-100 border-t-2 border-zinc-300 font-bold text-zinc-800 text-[11px] shadow-xs z-10">
                    <tr className="divide-x divide-zinc-200">
                      <td colSpan={8} className="px-3 py-2 text-right font-mono uppercase tracking-wider text-[11px]">
                        Total ({filteredRecords.length} registros):
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-emerald-700 font-black text-xs whitespace-nowrap">
                        ${filteredRecords.reduce((sum, r) => sum + (r.montoPagado || r.valorServicio || 35), 0).toFixed(2)}
                      </td>
                      <td colSpan={2} className="px-3 py-2 text-zinc-600 font-normal text-[11px] truncate">
                        <span className="font-bold text-blue-700">
                          {filteredRecords.filter((r) => r.serviciosRealizados.includes('alistamiento_pdi')).length} PDI OK
                        </span>{' '}
                        •{' '}
                        <span className="font-bold text-purple-700">
                          {filteredRecords.filter((r) => r.serviciosRealizados.includes('mantenimiento')).length} Mantenimientos
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
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
      {/* 2. VISTA: FORMULARIO DE ALISTAMIENTO (3 COLUMNAS LIMPIAS, SIN SCROLL)     */}
      {/* ========================================================================= */}
      {currentViewMode === 'form' && (
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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Paso 1
                  </span>
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
                      placeholder="Ej: 2350999252 o RUC..."
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
                    <p className="text-[11px] text-blue-800 font-medium leading-tight">
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
                    placeholder="Ej: Felix Rafael"
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
                    placeholder="Ej: Gracia Guato"
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
                      placeholder="0982852456"
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
                      placeholder="0991234567"
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
                    placeholder="ejemplo@starmotos.ec"
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
                    placeholder="Av. Principal y Secundaria, Ciudad"
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
                    value={formData.modeloMarca}
                    onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                    placeholder="Ej: Tundra r200 / Bajaj Pulsar NS 200"
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
                    placeholder="Ej: KX284T"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-bold uppercase outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>

                {/* Chasis (VIN) (1 por fila) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
                    Chasis (VIN)
                  </label>
                  <input
                    type="text"
                    value={formData.chasis}
                    onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                    placeholder="LBBP57008PA049182"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-mono font-bold uppercase outline-none focus:border-red-600 focus:bg-white"
                  />
                </div>

                {/* Kilometraje Actual (1 por fila) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1.5">
                    Kilometraje Actual
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.kilometraje || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, kilometraje: parseInt(e.target.value) || 0 })
                      }
                      placeholder="0"
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
                        tecnicoId: techObj?.id || 'tec-01',
                      });
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-medium outline-none focus:border-emerald-600 focus:bg-white"
                    required
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.workshopName || 'Taller'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aceite: 3 datos seguidos en una fila (Estado | Nivel | Tipo) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Control de Aceite (Estado / Nivel / Tipo)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
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
                      <select
                        value={formData.nivelAceite || 'optimo'}
                        onChange={(e) => setFormData({ ...formData, nivelAceite: e.target.value })}
                        className="w-full px-2 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white"
                      >
                        <option value="optimo">Nivel Óptimo</option>
                        <option value="alto">Nivel Alto</option>
                        <option value="medio">Nivel Medio</option>
                        <option value="bajo">Nivel Bajo</option>
                      </select>
                    </div>

                    <div>
                      <select
                        value={formData.tipoAceite || '4T Mineral 20W50'}
                        onChange={(e) => setFormData({ ...formData, tipoAceite: e.target.value })}
                        className="w-full px-2 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white"
                      >
                        <option value="4T Mineral 20W50">20W50 Mineral</option>
                        <option value="4T Semi 10W40">10W40 Semi</option>
                        <option value="4T Sintético 10W50">10W50 Sint</option>
                        <option value="Castrol Actevo 20W50">Castrol 20W50</option>
                        <option value="Motul 5100 15W50">Motul 5100</option>
                        <option value="Sin Tipo">N/A</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Valor Servicio y Método de Pago (2 datos seguidos en una fila) */}
                <div className="grid grid-cols-2 gap-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-emerald-900 mb-1">
                      Valor Servicio ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valorServicio}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, valorServicio: val, montoPagado: val });
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-sm font-mono font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-emerald-900 mb-1">
                      Método de Pago
                    </label>
                    <select
                      value={formData.metodoPago}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metodoPago: e.target.value as AlistamientoFullRecord['metodoPago'],
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta Déb/Créd</option>
                      <option value="Crédito Directo">Crédito Directo</option>
                    </select>
                  </div>
                </div>

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
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Próximo Mantenimiento Sugerido
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.proximoMantenimientoKm || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          proximoMantenimientoKm: parseInt(e.target.value) || 1000,
                        })
                      }
                      placeholder="1000"
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white"
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
                  <h3 className="text-sm font-black text-zinc-900">Paso 1: Datos del Cliente</h3>
                  <span className="text-[10px] font-bold text-blue-600">1 de 3</span>
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
                  {searchFeedback && <p className="text-[11px] text-blue-800 font-medium">{searchFeedback}</p>}
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
                    value={formData.modeloMarca}
                    onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
                    placeholder="Ej: Tundra r200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Placa
                  </label>
                  <input
                    type="text"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold uppercase"
                    placeholder="KX284T"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Chasis (VIN)
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
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    Kilometraje Actual
                  </label>
                  <input
                    type="number"
                    value={formData.kilometraje || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, kilometraje: parseInt(e.target.value) || 0 })
                    }
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
                        tecnicoId: techObj?.id || 'tec-01',
                      });
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold"
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-emerald-900 mb-1">
                      Valor ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valorServicio}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, valorServicio: val, montoPagado: val });
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-emerald-900 mb-1">
                      Método
                    </label>
                    <select
                      value={formData.metodoPago}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metodoPago: e.target.value as AlistamientoFullRecord['metodoPago'],
                        })
                      }
                      className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Crédito Directo">Crédito</option>
                    </select>
                  </div>
                </div>

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
    </div>
  );
};
