// src/components/common/AlistamientoWizard.tsx
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  Plus,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  X,
  UserCheck,
  Building2,
  Bike,
  Wrench,
  DollarSign,
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
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

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
    aceite: 'sin_aceite',
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

  // Auto-llenado con SRI
  const handleSearchSri = () => {
    const cleanId = formData.cedulaRuc.trim();
    if (!cleanId) return;

    setIsSearchingSri(true);
    setSriFeedback(null);

    setTimeout(() => {
      const sriData = querySriMock(cleanId);
      setIsSearchingSri(false);

      if (sriData) {
        // Separar nombres y apellidos si es posible
        const parts = sriData.razonSocial.split(' ');
        let nombres = '';
        let apellidos = '';
        if (parts.length >= 4) {
          apellidos = `${parts[0]} ${parts[1]}`;
          nombres = parts.slice(2).join(' ');
        } else if (parts.length >= 2) {
          apellidos = parts[0];
          nombres = parts.slice(1).join(' ');
        } else {
          nombres = sriData.razonSocial;
        }

        setFormData((prev) => ({
          ...prev,
          nombres: nombres,
          apellidos: apellidos,
          direccion: sriData.address || prev.direccion,
          email: prev.email || sriData.email,
          celular1: prev.celular1 || sriData.phone,
        }));
        setSriFeedback(`✓ Datos SRI recuperados: ${sriData.razonSocial}`);
      } else {
        setSriFeedback('Contribuyente no registrado en padrón. Complete manualmente.');
      }
    }, 500);
  };

  // Toggle servicios en Paso 3
  const toggleService = (service: ServiceActionType) => {
    setFormData((prev) => {
      const current = prev.serviciosRealizados;
      if (current.includes(service)) {
        if (current.length === 1) return prev; // Mantener al menos uno
        return { ...prev, serviciosRealizados: current.filter((s) => s !== service) };
      } else {
        return { ...prev, serviciosRealizados: [...current, service] };
      }
    });
  };

  // Agregar foto demo o input
  const handleAddPhoto = () => {
    if (formData.fotos.length >= 7) return;
    const samplePhotos = [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=600&q=80',
    ];
    const randomPhoto = samplePhotos[formData.fotos.length % samplePhotos.length];
    setFormData((prev) => ({
      ...prev,
      fotos: [...prev.fotos, randomPhoto],
    }));
  };

  // Eliminar foto
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
    if (!formData.nombres || !formData.modeloMarca) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

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
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0f3299', '#d92525', '#10b981'],
    });

    // Resetear formulario
    setStep(1);
    setFormData({
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
      aceite: 'sin_aceite',
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
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR DE PASOS (ESTILO EXACTO DE LAS CAPTURAS)                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-3 gap-3 select-none">
        {/* Paso 1 */}
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`py-3 px-4 rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
            step === 1
              ? 'bg-[#0f3299] text-white shadow-md'
              : step > 1
              ? 'bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]'
              : 'bg-[#f1f5f9] text-zinc-500'
          }`}
        >
          {step > 1 && <CheckCircle2 className="w-4 h-4 text-[#059669]" />}
          <span>1. Cliente</span>
        </button>

        {/* Paso 2 */}
        <button
          type="button"
          onClick={() => {
            if (formData.nombres || step > 1) setStep(2);
          }}
          className={`py-3 px-4 rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
            step === 2
              ? 'bg-[#0f3299] text-white shadow-md'
              : step > 2
              ? 'bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]'
              : 'bg-[#f1f5f9] text-zinc-500'
          }`}
        >
          {step > 2 && <CheckCircle2 className="w-4 h-4 text-[#059669]" />}
          <span>2. Moto</span>
        </button>

        {/* Paso 3 */}
        <button
          type="button"
          onClick={() => {
            if (formData.modeloMarca || step > 2) setStep(3);
          }}
          className={`py-3 px-4 rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
            step === 3
              ? 'bg-[#0f3299] text-white shadow-md'
              : 'bg-[#f1f5f9] text-zinc-500'
          }`}
        >
          <span>3. Servicio</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. FORMULARIO PASO A PASO                                                 */}
      {/* ========================================================================= */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* ===================== PASO 1: CLIENTE ===================== */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Bloque: Atención */}
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3">
                Atención
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Atendido por *
                  </label>
                  <input
                    type="text"
                    value={formData.atendidoPor}
                    onChange={(e) => setFormData({ ...formData, atendidoPor: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Sede *
                  </label>
                  <select
                    value={formData.sedeId}
                    onChange={(e) => {
                      const selectedWs = workshops.find((w) => w.id === e.target.value);
                      setFormData({
                        ...formData,
                        sedeId: e.target.value,
                        sede: selectedWs?.name || e.target.value,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 text-xs text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none cursor-pointer"
                  >
                    {workshops.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name.replace('StarMotos ', '')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Fecha del servicio *
                  </label>
                  <input
                    type="date"
                    value={formData.fechaServicio}
                    onChange={(e) => setFormData({ ...formData, fechaServicio: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none font-mono"
                    required
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Por defecto hoy — cámbiala si es de un día anterior.
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-zinc-100" />

            {/* Bloque: Datos del cliente */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Datos del cliente
                </h3>
                {sriFeedback && (
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {sriFeedback}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Nombres */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    placeholder="Ej: Felix Rafael"
                    className="w-full px-3.5 py-2 text-xs text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                    required
                  />
                </div>

                {/* Apellidos */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    placeholder="Ej: Gracia Guato"
                    className="w-full px-3.5 py-2 text-xs text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                    required
                  />
                </div>

                {/* Cédula/RUC con botón SRI */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Cédula/RUC *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={formData.cedulaRuc}
                      onChange={(e) => setFormData({ ...formData, cedulaRuc: e.target.value })}
                      placeholder="2350999252"
                      className="w-full px-3.5 py-2 pr-12 text-xs font-mono text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSearchSri}
                      disabled={isSearchingSri}
                      title="Consultar SRI"
                      className="absolute right-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                    >
                      {isSearchingSri ? '...' : 'SRI'}
                    </button>
                  </div>
                </div>

                {/* Celular 1 */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Celular 1 *
                  </label>
                  <input
                    type="tel"
                    value={formData.celular1}
                    onChange={(e) => setFormData({ ...formData, celular1: e.target.value })}
                    placeholder="0982852456"
                    className="w-full px-3.5 py-2 text-xs font-mono text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                    required
                  />
                </div>

                {/* Celular 2 */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Celular 2
                  </label>
                  <input
                    type="tel"
                    value={formData.celular2}
                    onChange={(e) => setFormData({ ...formData, celular2: e.target.value })}
                    placeholder="Opcional"
                    className="w-full px-3.5 py-2 text-xs font-mono text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                {/* Correo electrónico */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="felix.graciag.r@gmail.com"
                    className="w-full px-3.5 py-2 text-xs text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                {/* Dirección */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Quevedo Av.quito frente a la planta de agua"
                    className="w-full px-3.5 py-2 text-xs text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                {/* Origen (tipo de cliente) con botón (+) */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Origen (tipo de cliente)
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={formData.origen}
                      onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none cursor-pointer"
                    >
                      {origins.map((orig) => (
                        <option key={orig} value={orig}>
                          {orig}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setShowAddOriginModal(true)}
                      title="Agregar nuevo origen / almacén"
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold transition cursor-pointer flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Continuar */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  if (!formData.nombres.trim() || !formData.cedulaRuc.trim()) {
                    alert('Por favor ingrese los nombres y la cédula del cliente.');
                    return;
                  }
                  setStep(2);
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#0f3299] hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== PASO 2: MOTO ===================== */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">
                Datos de la moto
              </h3>

              {/* Selector de moto previa */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Moto de este cliente
                </label>
                <select
                  value={formData.motoPreviaId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'tundra-r200') {
                      setFormData({
                        ...formData,
                        motoPreviaId: val,
                        modeloMarca: 'Tundra r200',
                        placa: 'KX284T',
                        chasis: 'LBBP57008PA049182',
                      });
                    } else if (val === 'benelli-trk') {
                      setFormData({
                        ...formData,
                        motoPreviaId: val,
                        modeloMarca: 'Benelli TRK 502X ABS',
                        placa: 'PBX-8492',
                        chasis: 'LC6PC8901PA112390',
                      });
                    } else {
                      setFormData({
                        ...formData,
                        motoPreviaId: '',
                      });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-xs text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none cursor-pointer"
                >
                  <option value="">Seleccione o registre una moto...</option>
                  <option value="tundra-r200">Tundra r200 — Placa: Kx284T</option>
                  <option value="benelli-trk">Benelli TRK 502X — Placa: PBX-8492</option>
                  <option value="nueva">+ Registrar Nueva Motocicleta</option>
                </select>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Si ya visitó antes con otra moto, selecciónala aquí — se completan sus datos automáticamente.
                </p>
              </div>

              {/* Campos Chasis, Placa, Modelo - Marca */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Chasis (VIN)
                  </label>
                  <input
                    type="text"
                    value={formData.chasis}
                    onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                    placeholder="Número de chasis (17 caracteres)"
                    className="w-full px-3.5 py-2 text-xs font-mono text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Placa
                  </label>
                  <input
                    type="text"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                    placeholder="KX284T"
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Modelo - Marca
                  </label>
                  <input
                    type="text"
                    value={formData.modeloMarca}
                    onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                    placeholder="Tundra r200"
                    className="w-full px-3.5 py-2 text-xs font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Botones Atrás y Continuar */}
            <div className="pt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-6 rounded-xl border border-zinc-300 text-zinc-700 font-bold text-xs flex items-center gap-1.5 hover:bg-zinc-50 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!formData.modeloMarca.trim()) {
                    alert('Por favor ingrese el modelo o marca de la motocicleta.');
                    return;
                  }
                  setStep(3);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#0f3299] hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== PASO 3: SERVICIO ===================== */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3">
                Datos del servicio
              </h3>

              {/* ¿Qué se hizo? (Pills seleccionables tipo captura) */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-zinc-700 mb-2">
                  ¿Qué se hizo? *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleService('alistamiento_pdi')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs text-center border transition-all cursor-pointer ${
                      formData.serviciosRealizados.includes('alistamiento_pdi')
                        ? 'bg-[#0a2373] text-white border-[#0a2373] shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    ALISTAMIENTO PDI
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleService('engrasado')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs text-center border transition-all cursor-pointer ${
                      formData.serviciosRealizados.includes('engrasado')
                        ? 'bg-[#0a2373] text-white border-[#0a2373] shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    Engrasado
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleService('mantenimiento')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs text-center border transition-all cursor-pointer ${
                      formData.serviciosRealizados.includes('mantenimiento')
                        ? 'bg-[#0a2373] text-white border-[#0a2373] shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    Mantenimiento
                  </button>
                </div>
              </div>

              {/* Técnico responsable con botón (+) */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Técnico responsable *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.tecnicoResponsable}
                    onChange={(e) => {
                      const selected = technicians.find((t) => t.name === e.target.value);
                      setFormData({
                        ...formData,
                        tecnicoResponsable: e.target.value,
                        tecnicoId: selected?.id || '',
                      });
                    }}
                    className="flex-1 px-3.5 py-2 text-xs font-bold text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none cursor-pointer"
                  >
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.name}>
                        {tech.name} — {tech.specialty} ({tech.workshopName.replace('StarMotos ', '')})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowAddTechModal(true)}
                    title="Registrar nuevo técnico"
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold transition cursor-pointer flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Técnicos asignados a {formData.sede}
                </p>
              </div>

              {/* Kilometraje y Aceite */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Kilometraje *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.kilometraje || ''}
                      onChange={(e) => setFormData({ ...formData, kilometraje: Number(e.target.value) })}
                      placeholder="Ej: 450"
                      className="w-full px-3.5 py-2 pr-10 text-xs font-mono font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold">
                      km
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Aceite *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, aceite: 'sin_aceite' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                        formData.aceite === 'sin_aceite'
                          ? 'bg-[#0a2373] text-white border-[#0a2373] shadow-xs'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-300'
                      }`}
                    >
                      <span>● Sin aceite</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, aceite: 'con_aceite' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                        formData.aceite === 'con_aceite'
                          ? 'bg-[#0a2373] text-white border-[#0a2373] shadow-xs'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-300'
                      }`}
                    >
                      <span>● Con aceite</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* N.° de factura y N.° de ticket */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    N.° de factura *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroFactura}
                    onChange={(e) => setFormData({ ...formData, numeroFactura: e.target.value })}
                    placeholder="005-001-0004521"
                    className="w-full px-3.5 py-2 text-xs font-mono text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    N.° de ticket *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroTicket}
                    onChange={(e) => setFormData({ ...formData, numeroTicket: e.target.value })}
                    placeholder="TCK-2026-9921"
                    className="w-full px-3.5 py-2 text-xs font-mono text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              {/* Valor del servicio, Monto pagado, Método de pago */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Valor del servicio *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valorServicio || ''}
                      onChange={(e) => setFormData({ ...formData, valorServicio: Number(e.target.value) })}
                      className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold text-blue-700 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Monto pagado
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.montoPagado}
                      onChange={(e) => setFormData({ ...formData, montoPagado: Number(e.target.value) })}
                      className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Método de pago
                  </label>
                  <select
                    value={formData.metodoPago}
                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs font-bold text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none cursor-pointer"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
                    <option value="Mixto">Mixto</option>
                  </select>
                </div>
              </div>

              {/* Observaciones */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Detalla lo que se hizo a la moto (ej: cambio de aceite, ajustes, piezas cambiadas, etc.)"
                  className="w-full px-3.5 py-2 text-xs text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none resize-none"
                />
              </div>

              {/* Próximo Mantenimiento */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Próximo Mantenimiento
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    value={formData.proximoMantenimientoKm || ''}
                    onChange={(e) => setFormData({ ...formData, proximoMantenimientoKm: Number(e.target.value) })}
                    placeholder="1000"
                    className="w-full px-3.5 py-2 pr-10 text-xs font-mono font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold">
                    km
                  </span>
                </div>
              </div>

              {/* Fotos del servicio (Grilla de hasta 7 fotos exactamente como en la imagen) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-zinc-700">
                    Fotos del servicio
                  </label>
                  <span className="text-xs font-mono font-bold text-zinc-500">
                    {formData.fotos.length} de 7 fotos
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-3">
                  {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                    const photo = formData.fotos[idx];
                    return (
                      <div
                        key={idx}
                        className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-400 transition"
                      >
                        {photo ? (
                          <>
                            <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <Camera className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    disabled={formData.fotos.length >= 7}
                    className="px-3.5 py-2 rounded-xl bg-[#0f3299] hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Tomar foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    disabled={formData.fotos.length >= 7}
                    className="px-3.5 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 text-zinc-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Galería</span>
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
                  Sube fotos de la moto (cómo llegó, cómo se despachó, documentos, factura, comprobante de transferencia, etc. Máximo 7 fotos (opcional)).
                </p>
              </div>
            </div>

            {/* Botones de Finalizar */}
            <div className="pt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-6 rounded-xl border border-zinc-300 text-zinc-700 font-bold text-xs flex items-center gap-1.5 hover:bg-zinc-50 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>

              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Registro de Servicio Completo</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL: AGREGAR NUEVO TÉCNICO EN EL ACTO                                  */}
      {/* ========================================================================= */}
      {showAddTechModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-zinc-200 animate-slide-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Registrar Nuevo Técnico de Taller</span>
              </h3>
              <button onClick={() => setShowAddTechModal(false)} className="text-zinc-400 hover:text-zinc-700">
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
                  placeholder="Ej: MARIO ANDRADE"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-blue-600 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Especialidad Técnica
                </label>
                <input
                  type="text"
                  value={newTechData.specialty}
                  onChange={(e) => setNewTechData({ ...newTechData, specialty: e.target.value })}
                  placeholder="Ej: Inyección Delphi, Motores 4T, PDI..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  value={newTechData.phone}
                  onChange={(e) => setNewTechData({ ...newTechData, phone: e.target.value })}
                  placeholder="0991234567"
                  className="w-full px-3 py-2 font-mono bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Sede Asignada
                </label>
                <select
                  value={newTechData.workshopId}
                  onChange={(e) => setNewTechData({ ...newTechData, workshopId: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl outline-none cursor-pointer"
                >
                  {workshops.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTechModal(false)}
                  className="flex-1 py-2 border border-zinc-300 rounded-xl font-bold text-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs"
                >
                  Guardar Técnico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: AGREGAR NUEVO ORIGEN / ALMACÉN                                   */}
      {/* ========================================================================= */}
      {showAddOriginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-zinc-200 animate-slide-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Agregar Origen / Almacén</span>
              </h3>
              <button onClick={() => setShowAddOriginModal(false)} className="text-zinc-400 hover:text-zinc-700">
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
                  className="flex-1 py-2 border border-zinc-300 rounded-xl font-bold text-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs"
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
