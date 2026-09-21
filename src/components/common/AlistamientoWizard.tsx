// src/components/common/AlistamientoWizard.tsx
import React, { useState, useEffect, useMemo } from 'react';
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

  // Búsqueda en el listado
  const [searchTerm, setSearchTerm] = useState('');

  // Registro seleccionado para ver detalle en modal
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<AlistamientoFullRecord | null>(null);

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

  const [isSearchingSri, setIsSearchingSri] = useState(false);
  const [sriFeedback, setSriFeedback] = useState<string | null>(null);
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

  // Filtrado de alistamientos existentes
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return recentRecords;
    const term = searchTerm.toLowerCase().trim();
    return recentRecords.filter((r) => {
      const fullClient = `${r.nombres} ${r.apellidos}`.toLowerCase();
      return (
        r.cedulaRuc.toLowerCase().includes(term) ||
        fullClient.includes(term) ||
        r.placa.toLowerCase().includes(term) ||
        r.chasis.toLowerCase().includes(term) ||
        r.modeloMarca.toLowerCase().includes(term) ||
        r.sede.toLowerCase().includes(term) ||
        r.tecnicoResponsable.toLowerCase().includes(term)
      );
    });
  }, [recentRecords, searchTerm]);

  // Auto-llenado con SRI
  const handleSearchSri = (idToSearch?: string) => {
    const cleanId = (idToSearch || formData.cedulaRuc).trim();
    if (!cleanId) return;

    setIsSearchingSri(true);
    setSriFeedback(null);

    setTimeout(() => {
      const sriData = querySriMock(cleanId);
      setIsSearchingSri(false);

      if (sriData) {
        const parts = sriData.razonSocial.split(' ');
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
          nombres = sriData.razonSocial;
          apellidos = '';
        }

        setFormData((prev) => ({
          ...prev,
          cedulaRuc: cleanId,
          nombres: nombres || prev.nombres,
          apellidos: apellidos || prev.apellidos,
          direccion: sriData.address || prev.direccion,
          email: sriData.email || prev.email,
        }));
        setSriFeedback(`✓ Datos verificados con el SRI: ${sriData.razonSocial}`);
      } else {
        setSriFeedback(`Información: No registrado en base SRI local. Ingrese los datos manualmente.`);
      }
    }, 400);
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
    setSriFeedback(null);
    setValidationAlert(null);
    setMobileStep(1);
    setEffectiveViewMode('form');

    if (cedula && cedula.length >= 10) {
      handleSearchSri(cedula);
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
    setSriFeedback(`✓ Datos de ${record.nombres} ${record.apellidos} y moto precargados.`);
    setValidationAlert(null);
    setMobileStep(1);
    setEffectiveViewMode('form');
  };

  // Servicios toggle (Solo 3 permitidos: alistamiento_pdi, engrasado, mantenimiento)
  const toggleServicio = (servicio: ServiceActionType) => {
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

  // Subir foto simulada
  const handleAddMockPhoto = () => {
    const mockPhotos = [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=600&q=80',
    ];
    const randomPhoto = mockPhotos[formData.fotos.length % mockPhotos.length];
    setFormData((prev) => ({
      ...prev,
      fotos: [...prev.fotos, randomPhoto],
    }));
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
    setSriFeedback(null);
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. VISTA: LISTADO EN TARJETAS SEMICUADRADAS / CUADRADAS                   */}
      {/* ========================================================================= */}
      {currentViewMode === 'list' && (
        <div className="space-y-4 animate-fade-in">
          {/* Header Superior con Buscador y Botón Nuevo Alistamiento */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
                    Módulo de Alistamiento & Mantenimientos
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                    {recentRecords.length} Registros
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Historial de alistamientos PDI, auditoría técnica y entrega de motocicletas StarMotos.
                </p>
              </div>

              {/* Botón "+ Nuevo Alistamiento" */}
              <button
                type="button"
                onClick={() => handleStartNewAlistamiento()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo Alistamiento</span>
              </button>
            </div>

            {/* Barra de Búsqueda */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredRecords.length === 0 && searchTerm.trim().length >= 8) {
                    handleStartNewAlistamiento(searchTerm.trim());
                  }
                }}
                placeholder="Buscar cliente por cédula/RUC, nombres, modelo de moto, placa o chasis..."
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 hover:bg-zinc-100/80 focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Banner sugerencia si busca una cédula que no existe */}
            {searchTerm.trim().length >= 8 && filteredRecords.length === 0 && (
              <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    No encontramos alistamientos para <strong className="font-mono">"{searchTerm}"</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartNewAlistamiento(searchTerm.trim())}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Registrar nuevo con C.I. {searchTerm} (SRI)</span>
                </button>
              </div>
            )}
          </div>

          {/* Grid de Tarjetas Cuadradas / Semicuadradas */}
          {filteredRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRecords.map((record) => {
                const isPdi = record.serviciosRealizados.includes('alistamiento_pdi');
                return (
                  <div
                    key={record.id}
                    className="bg-white border border-zinc-200 hover:border-blue-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group min-h-[350px]"
                  >
                    {/* Borde superior acentuado */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 ${
                        isPdi ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}
                    />

                    {/* Contenido Principal de la Tarjeta */}
                    <div className="space-y-3.5 pt-1">
                      {/* Cabecera de la Tarjeta */}
                      <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-bold border border-zinc-200 text-[11px]">
                            <Building2 className="w-3 h-3 text-zinc-500" />
                            <span className="truncate max-w-[170px]">{record.sede}</span>
                          </span>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            <span>{record.fechaServicio}</span>
                            <span>•</span>
                            <span className="font-mono text-[10px]">{record.numeroTicket || record.id}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>COMPLETADO</span>
                          </span>
                          <div className="font-black text-sm text-zinc-900 mt-1">
                            ${(record.montoPagado || record.valorServicio || 35).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Bloque 1: Cliente */}
                      <div className="bg-blue-50/40 border border-blue-100/80 rounded-xl p-3 space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>Cliente</span>
                        </div>
                        <div className="font-bold text-zinc-900 text-sm truncate">
                          {record.nombres} {record.apellidos}
                        </div>
                        <div className="text-zinc-600 text-xs font-mono flex items-center justify-between gap-2">
                          <span>C.I: <strong>{record.cedulaRuc}</strong></span>
                          {record.celular1 && <span>Tel: {record.celular1}</span>}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          Origen: <span className="text-zinc-600 font-medium">{record.origen}</span>
                        </div>
                      </div>

                      {/* Bloque 2: Motocicleta (Solo datos del vehículo) */}
                      <div className="bg-red-50/40 border border-red-100/80 rounded-xl p-3 space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-red-600 flex items-center gap-1">
                          <Bike className="w-3 h-3" />
                          <span>Motocicleta</span>
                        </div>
                        <div className="font-bold text-zinc-900 text-xs sm:text-sm truncate">
                          {record.modeloMarca || 'Modelo no especificado'}
                        </div>
                        <div className="text-zinc-600 text-xs font-mono flex items-center justify-between gap-2">
                          <span className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded font-black text-zinc-800 text-[10px]">
                            {record.placa ? record.placa : 'SIN PLACA'}
                          </span>
                          <span>Km: <strong className="text-zinc-900">{record.kilometraje || 0}</strong></span>
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          VIN: <span className="font-mono text-zinc-600">{record.chasis ? record.chasis.substring(0, 15) + '...' : 'S/N'}</span>
                        </div>
                      </div>

                      {/* Bloque 3: Servicio, Aceite & Técnico */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {record.serviciosRealizados.map((srv) => (
                            <span
                              key={srv}
                              className="px-2 py-0.5 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded text-[10px] font-bold"
                            >
                              {srv === 'alistamiento_pdi'
                                ? 'ALISTAMIENTO PDI'
                                : srv === 'engrasado'
                                ? 'ENGRASADO'
                                : 'MANTENIMIENTO'}
                            </span>
                          ))}
                        </div>
                        <div className="text-zinc-600 text-[11px] flex items-center justify-between">
                          <span>Aceite: <strong>{record.aceite === 'sin_aceite' ? 'Sin Aceite' : `Con Aceite (${record.nivelAceite || 'Óptimo'})`}</strong></span>
                          <span>Próx: <strong>{record.proximoMantenimientoKm || 1000} km</strong></span>
                        </div>
                        <div className="text-zinc-500 text-[11px] flex items-center justify-between pt-0.5">
                          <span>Técnico: <strong className="text-zinc-800">{record.tecnicoResponsable}</strong></span>
                          <span>{record.metodoPago || 'Efectivo'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción de la Tarjeta */}
                    <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRecordForDetail(record)}
                        className="flex-1 py-2 text-zinc-700 hover:text-blue-600 hover:bg-blue-50 border border-zinc-200 hover:border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Ver Ficha</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNewServiceForExisting(record)}
                        className="flex-1 py-2 bg-zinc-100 hover:bg-blue-600 text-zinc-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Crear nuevo mantenimiento subsecuente con este cliente"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nuevo Servicio</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Bike className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900">No se encontraron alistamientos registrados</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {searchTerm
                  ? 'Ningún registro coincide con los criterios de búsqueda especificados.'
                  : 'Aún no hay alistamientos registrados en esta sede. Inicia el primer registro ahora.'}
              </p>
              <button
                type="button"
                onClick={() => handleStartNewAlistamiento(searchTerm)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Primer Alistamiento</span>
              </button>
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
                      <p className="text-[11px] text-zinc-400">Verificación SRI y contacto</p>
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
                          handleSearchSri();
                        }
                      }}
                      placeholder="Ej: 2350999252"
                      className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-xl text-sm font-mono font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleSearchSri()}
                      disabled={isSearchingSri || !formData.cedulaRuc.trim()}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                      title="Consultar SRI Ecuador"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isSearchingSri ? 'SRI...' : 'SRI'}</span>
                    </button>
                  </div>
                  {sriFeedback && (
                    <p className="text-[11px] text-blue-800 font-medium leading-tight">
                      {sriFeedback}
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

                {/* ¿Qué se realizó? (Solo los 3 originales: Alistamiento PDI, Engrasado, Mantenimiento) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                    ¿Qué se realizó? *
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'alistamiento_pdi', label: 'Alistamiento PDI' },
                      { id: 'engrasado', label: 'Engrasado' },
                      { id: 'mantenimiento', label: 'Mantenimiento' },
                    ].map((srv) => {
                      const isSelected = formData.serviciosRealizados.includes(srv.id as ServiceActionType);
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => toggleServicio(srv.id as ServiceActionType)}
                          className={`px-2 py-2 rounded-xl text-[11px] font-bold border text-center transition-all cursor-pointer truncate ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
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
                        className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white"
                      >
                        <option value="con_aceite">Con Aceite</option>
                        <option value="sin_aceite">Sin Aceite</option>
                      </select>
                    </div>

                    <div>
                      <select
                        value={formData.nivelAceite || 'optimo'}
                        onChange={(e) => setFormData({ ...formData, nivelAceite: e.target.value })}
                        className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white"
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
                        className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white"
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
                      N° Factura SRI
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

                {/* Inspección Visual (Fotos de Evidencia de Entrega) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-zinc-700">
                      Inspección Visual (Fotos de Entrega)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMockPhoto}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>+ Foto</span>
                    </button>
                  </div>

                  {formData.fotos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {formData.fotos.map((fUrl, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-video rounded-lg overflow-hidden border border-zinc-200 group"
                        >
                          <img src={fUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      onClick={handleAddMockPhoto}
                      className="border border-dashed border-zinc-300 hover:border-emerald-400 rounded-xl p-2.5 text-center cursor-pointer transition-colors bg-zinc-50 hover:bg-emerald-50/40"
                    >
                      <Camera className="w-4 h-4 text-zinc-400 mx-auto mb-0.5" />
                      <span className="text-[11px] text-zinc-500 font-medium">
                        Clic para adjuntar fotos de evidencia de entrega
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
                      placeholder="Ej: 2350999252"
                      className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSearchSri()}
                      disabled={isSearchingSri || !formData.cedulaRuc.trim()}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {isSearchingSri ? '...' : 'SRI'}
                    </button>
                  </div>
                  {sriFeedback && <p className="text-[11px] text-blue-800 font-medium">{sriFeedback}</p>}
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
      {/* 3. MODAL: DETALLE COMPLETO DE ALISTAMIENTO PREVIO                         */}
      {/* ========================================================================= */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-zinc-200 animate-slide-in max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900">
                    Ficha Técnica de Alistamiento
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    ID: <span className="font-mono font-bold text-zinc-800">{selectedRecordForDetail.id}</span> • Sede:{' '}
                    <span className="font-bold text-zinc-800">{selectedRecordForDetail.sede}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Bloques de Información */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Cliente */}
              <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100 space-y-1.5">
                <div className="text-[10px] font-black uppercase text-blue-800 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Cliente</span>
                </div>
                <div className="font-bold text-zinc-900 text-sm">
                  {selectedRecordForDetail.nombres} {selectedRecordForDetail.apellidos}
                </div>
                <div className="text-zinc-600 font-mono text-[11px]">C.I: {selectedRecordForDetail.cedulaRuc}</div>
                <div className="text-zinc-600 text-[11px]">Tel: {selectedRecordForDetail.celular1}</div>
                {selectedRecordForDetail.email && (
                  <div className="text-zinc-500 text-[10px] truncate">{selectedRecordForDetail.email}</div>
                )}
                {selectedRecordForDetail.direccion && (
                  <div className="text-zinc-500 text-[10px]">{selectedRecordForDetail.direccion}</div>
                )}
                <div className="text-[10px] text-zinc-400 pt-1 border-t border-blue-100">
                  Origen: <span className="font-medium text-zinc-700">{selectedRecordForDetail.origen}</span>
                </div>
              </div>

              {/* Moto */}
              <div className="bg-red-50/40 p-3 rounded-xl border border-red-100 space-y-1.5">
                <div className="text-[10px] font-black uppercase text-red-800 flex items-center gap-1">
                  <Bike className="w-3 h-3" />
                  <span>Motocicleta</span>
                </div>
                <div className="font-bold text-zinc-900 text-sm">
                  {selectedRecordForDetail.modeloMarca}
                </div>
                <div className="text-zinc-600 font-mono text-[11px]">
                  Placa: <strong className="text-zinc-900">{selectedRecordForDetail.placa || 'SIN PLACA'}</strong>
                </div>
                <div className="text-zinc-600 font-mono text-[10px] truncate">
                  VIN: {selectedRecordForDetail.chasis || 'S/N'}
                </div>
                <div className="text-zinc-600 text-[11px]">
                  Km: <strong className="text-zinc-900">{selectedRecordForDetail.kilometraje} km</strong>
                </div>
              </div>

              {/* Servicio */}
              <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100 space-y-1.5">
                <div className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                  <Wrench className="w-3 h-3" />
                  <span>Servicio</span>
                </div>
                <div className="font-bold text-zinc-900 text-sm">
                  ${(selectedRecordForDetail.montoPagado || selectedRecordForDetail.valorServicio).toFixed(2)}
                </div>
                <div className="text-zinc-600 text-[11px]">
                  Método: <strong className="text-zinc-900">{selectedRecordForDetail.metodoPago}</strong>
                </div>
                <div className="text-zinc-600 text-[11px]">
                  Técnico: <strong className="text-zinc-900">{selectedRecordForDetail.tecnicoResponsable}</strong>
                </div>
                <div className="text-zinc-600 text-[11px]">
                  Aceite: <strong className="text-zinc-900">{selectedRecordForDetail.aceite === 'sin_aceite' ? 'Sin Aceite' : `${selectedRecordForDetail.aceite} (${selectedRecordForDetail.nivelAceite || 'Óptimo'})`}</strong>
                </div>
                <div className="text-zinc-600 text-[10px]">
                  Próx: <strong className="text-zinc-900">{selectedRecordForDetail.proximoMantenimientoKm || 1000} km</strong>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-xs space-y-1">
              <div className="font-bold text-zinc-700">Observaciones Técnicas:</div>
              <p className="text-zinc-600 italic">
                {selectedRecordForDetail.observaciones || 'Sin observaciones mecánicas registradas.'}
              </p>
            </div>

            {/* Fotos si las hay */}
            {selectedRecordForDetail.fotos && selectedRecordForDetail.fotos.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-zinc-700">Evidencia Fotográfica de Entrega:</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {selectedRecordForDetail.fotos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Inspección"
                      className="rounded-lg aspect-video object-cover border border-zinc-200"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Acciones del Modal */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ficha</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleNewServiceForExisting(selectedRecordForDetail);
                    setSelectedRecordForDetail(null);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Servicio con este Cliente</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRecordForDetail(null)}
                  className="px-3 py-1.5 border border-zinc-300 text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-50 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
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
    </div>
  );
};
